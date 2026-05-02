const Folder = require('../models/Folder');
const FolderCode = require('../models/FolderCode');
const Snippet = require('../models/Snippet');

class FolderService {
  // Create a new folder
  async createFolder(userId, name, parentId = null) {
    const folder = await Folder.create({
      user: userId,
      name: name.trim(),
      parentId: parentId,
    });
    return folder;
  }

  // Get all folders for a user (with hierarchy)
  async getUserFolders(userId) {
    const folders = await Folder.find({
      user: userId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    // Build folder tree
    const folderMap = {};
    const rootFolders = [];

    folders.forEach((folder) => {
      folderMap[folder._id.toString()] = { ...folder.toObject(), children: [], codes: [] };
    });

    folders.forEach((folder) => {
      if (folder.parentId && folderMap[folder.parentId.toString()]) {
        folderMap[folder.parentId.toString()].children.push(folderMap[folder._id.toString()]);
      } else {
        rootFolders.push(folderMap[folder._id.toString()]);
      }
    });

    return rootFolders;
  }

  // Get folder by ID with its contents - UPDATED to include snippets from FolderCode
  async getFolderById(folderId, userId) {
    const folder = await Folder.findOne({ _id: folderId, user: userId, isDeleted: false });
    if (!folder) throw new Error('Folder not found');

    // Get subfolders
    const subfolders = await Folder.find({
      parentId: folderId,
      user: userId,
      isDeleted: false,
    });

    // Get snippets in this folder via FolderCode association
    const folderCodes = await FolderCode.find({ folder: folderId, user: userId }).populate(
      'snippet',
      'title language codeContent views createdAt updatedAt'
    );

    const snippets = folderCodes.map((fc) => ({
      ...fc.snippet.toObject(),
      folderId: folderId,
    }));

    return {
      folder,
      subfolders,
      snippets,
    };
  }

  // Update folder
  async updateFolder(folderId, userId, updateData) {
    const folder = await Folder.findOne({ _id: folderId, user: userId, isDeleted: false });
    if (!folder) throw new Error('Folder not found');

    if (updateData.name) {
      folder.name = updateData.name;
      await this.updateChildrenPaths(folderId);
    }

    await folder.save();
    return folder;
  }

  // Update paths of all child folders
  async updateChildrenPaths(folderId) {
    const children = await Folder.find({ parentId: folderId });
    for (const child of children) {
      const parent = await Folder.findById(folderId);
      child.path = parent.path + '/' + child.name;
      await child.save();
      await this.updateChildrenPaths(child._id);
    }
  }

  // Move folder to another parent
  async moveFolder(folderId, userId, newParentId) {
    const folder = await Folder.findOne({ _id: folderId, user: userId, isDeleted: false });
    if (!folder) throw new Error('Folder not found');

    // Prevent circular reference
    if (newParentId) {
      let parent = await Folder.findById(newParentId);
      while (parent) {
        if (parent._id.toString() === folderId.toString()) {
          throw new Error('Cannot move folder into its own subfolder');
        }
        parent = await Folder.findById(parent.parentId);
      }
    }

    folder.parentId = newParentId;
    await folder.save();
    await this.updateChildrenPaths(folderId);

    return folder;
  }

  // Delete folder (soft delete - move to trash)
  async deleteFolder(folderId, userId) {
    const folder = await Folder.findOne({ _id: folderId, user: userId });
    if (!folder) throw new Error('Folder not found');

    folder.isDeleted = true;
    folder.deletedAt = new Date();
    await folder.save();

    // Also soft delete all subfolders
    await Folder.updateMany(
      { parentId: folderId, user: userId },
      { isDeleted: true, deletedAt: new Date() }
    );

    return folder;
  }

  // Restore folder from trash
  async restoreFolder(folderId, userId) {
    const folder = await Folder.findOne({ _id: folderId, user: userId, isDeleted: true });
    if (!folder) throw new Error('Folder not found');

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();

    return folder;
  }

  // Permanently delete folder
  async permanentDeleteFolder(folderId, userId) {
    const folder = await Folder.findOne({ _id: folderId, user: userId });
    if (!folder) throw new Error('Folder not found');

    // Remove all folder-code associations
    await FolderCode.deleteMany({ folder: folderId });

    // Delete all subfolders recursively
    const deleteSubfolders = async (parentId) => {
      const subfolders = await Folder.find({ parentId, user: userId });
      for (const sub of subfolders) {
        await FolderCode.deleteMany({ folder: sub._id });
        await deleteSubfolders(sub._id);
        await Folder.deleteOne({ _id: sub._id });
      }
    };

    await deleteSubfolders(folderId);
    await Folder.deleteOne({ _id: folderId });

    return { success: true };
  }

  // Add snippet to folder
  async addSnippetToFolder(folderId, snippetId, userId) {
    // Check if snippet exists
    const snippet = await Snippet.findOne({ _id: snippetId, user: userId });
    if (!snippet) throw new Error('Snippet not found');

    // Check if folder exists
    const folder = await Folder.findOne({ _id: folderId, user: userId, isDeleted: false });
    if (!folder) throw new Error('Folder not found');

    // Check if already exists
    const existing = await FolderCode.findOne({ folder: folderId, snippet: snippetId });
    if (existing) throw new Error('Snippet already in this folder');

    const folderCode = await FolderCode.create({
      folder: folderId,
      snippet: snippetId,
      user: userId,
    });

    return folderCode;
  }

  // Remove snippet from folder
  async removeSnippetFromFolder(folderId, snippetId, userId) {
    const result = await FolderCode.findOneAndDelete({
      folder: folderId,
      snippet: snippetId,
      user: userId,
    });

    if (!result) throw new Error('Snippet not found in this folder');
    return { success: true };
  }

  // Move snippet to another folder
  async moveSnippetToFolder(snippetId, sourceFolderId, targetFolderId, userId) {
    // Remove from source
    if (sourceFolderId) {
      await FolderCode.findOneAndDelete({
        folder: sourceFolderId,
        snippet: snippetId,
        user: userId,
      });
    }

    // Add to target
    return await this.addSnippetToFolder(targetFolderId, snippetId, userId);
  }

  // Get all deleted folders
  async getDeletedFolders(userId) {
    return await Folder.find({
      user: userId,
      isDeleted: true,
    }).sort({ deletedAt: -1 });
  }

  // Get folder breadcrumb path
  async getFolderPath(folderId) {
    const path = [];
    let current = await Folder.findById(folderId);

    while (current) {
      path.unshift({ id: current._id, name: current.name });
      if (current.parentId) {
        current = await Folder.findById(current.parentId);
      } else {
        break;
      }
    }

    return path;
  }

  // ========== ADDED METHOD ==========
  // CHECK if folder is empty (no snippets and no subfolders)
  async isFolderEmpty(folderId, userId) {
    const subfolders = await Folder.countDocuments({
      parentId: folderId,
      user: userId,
      isDeleted: false,
    });

    const snippets = await Snippet.countDocuments({
      folderId: folderId,
      user: userId,
      isDeleted: false,
    });

    return subfolders === 0 && snippets === 0;
  }
}

module.exports = new FolderService();
