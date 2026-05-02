const Snippet = require('../models/Snippet');
const crypto = require('crypto');
const mongoose = require('mongoose');

class SnippetService {
  async createSnippet(userId, snippetData, folderId = null) {
    const { title, codeContent, language, fileType, description, tags, isPublic } = snippetData;

    const snippet = await Snippet.create({
      user: userId,
      title: title || 'Untitled Snippet',
      codeContent,
      language,
      fileType,
      description: description || '',
      tags: tags || [],
      isPublic: isPublic || false,
      folderId: folderId,
    });

    console.log(`✅ Snippet created - ID: ${snippet._id}, User: ${userId}, Folder: ${folderId}`);
    return snippet;
  }

  // Get active snippets (not deleted) for user
  async getUserActiveSnippets(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [snippets, total] = await Promise.all([
      Snippet.find({ user: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title language fileType createdAt isPublic views folderId'),
      Snippet.countDocuments({ user: userId, isDeleted: false }),
    ]);

    console.log(`📊 Found ${total} active snippets for user: ${userId}`);

    return {
      snippets,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // Get deleted snippets for trash
  async getDeletedSnippets(userId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [snippets, total] = await Promise.all([
      Snippet.find({ user: userId, isDeleted: true })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title language fileType createdAt deletedAt'),
      Snippet.countDocuments({ user: userId, isDeleted: true }),
    ]);

    console.log(`🗑️ Found ${total} deleted snippets for user: ${userId}`);

    return {
      snippets,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // Get snippets by specific folder (only active)
  async getSnippetsByFolder(userId, folderId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [snippets, total] = await Promise.all([
      Snippet.find({ user: userId, folderId: folderId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title language fileType createdAt isPublic views'),
      Snippet.countDocuments({ user: userId, folderId: folderId, isDeleted: false }),
    ]);

    return {
      snippets,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getSnippetById(snippetId, userId) {
    if (!mongoose.Types.ObjectId.isValid(snippetId)) {
      throw new Error('Invalid snippet ID format');
    }

    const snippet = await Snippet.findById(snippetId);

    if (!snippet) {
      throw new Error('Snippet not found');
    }

    const snippetOwner = snippet.user.toString();
    const requestUser = userId.toString();

    if (!snippet.isPublic && snippetOwner !== requestUser) {
      throw new Error('Access denied');
    }

    return snippet;
  }

  async updateSnippet(snippetId, userId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(snippetId)) {
      throw new Error('Invalid snippet ID format');
    }

    const snippet = await Snippet.findOne({ _id: snippetId, user: userId, isDeleted: false });

    if (!snippet) {
      throw new Error('Snippet not found or unauthorized');
    }

    const allowedUpdates = [
      'title',
      'codeContent',
      'language',
      'fileType',
      'description',
      'tags',
      'isPublic',
      'folderId',
    ];
    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        snippet[field] = updateData[field];
      }
    });

    await snippet.save();
    return snippet;
  }

  // SOFT DELETE snippet
  async deleteSnippet(snippetId, userId) {
    const snippet = await Snippet.findOne({ _id: snippetId, user: userId });

    if (!snippet) {
      throw new Error('Snippet not found or unauthorized');
    }

    snippet.isDeleted = true;
    snippet.deletedAt = new Date();
    await snippet.save();

    console.log(`🗑️ Snippet soft deleted: ${snippetId} at ${snippet.deletedAt}`);
    return { success: true };
  }

  // RESTORE snippet from trash
  async restoreSnippet(snippetId, userId) {
    const snippet = await Snippet.findOne({ _id: snippetId, user: userId, isDeleted: true });

    if (!snippet) {
      throw new Error('Snippet not found in trash');
    }

    snippet.isDeleted = false;
    snippet.deletedAt = null;
    await snippet.save();

    console.log(`🔄 Snippet restored: ${snippetId}`);
    return { success: true };
  }

  // PERMANENT DELETE snippet
  async permanentDeleteSnippet(snippetId, userId) {
    const snippet = await Snippet.findOneAndDelete({ _id: snippetId, user: userId });

    if (!snippet) {
      throw new Error('Snippet not found');
    }

    console.log(`💀 Snippet permanently deleted: ${snippetId}`);
    return { success: true };
  }

  // COPY snippet (duplicate)
  async copySnippet(snippetId, userId, targetFolderId) {
    const original = await Snippet.findOne({ _id: snippetId, user: userId, isDeleted: false });

    if (!original) {
      throw new Error('Snippet not found');
    }

    const copiedSnippet = await Snippet.create({
      user: userId,
      title: `${original.title} (copy)`,
      codeContent: original.codeContent,
      language: original.language,
      fileType: original.fileType,
      description: original.description,
      tags: original.tags,
      isPublic: false,
      folderId: targetFolderId,
    });

    console.log(`📋 Snippet copied: ${snippetId} -> ${copiedSnippet._id}`);
    return copiedSnippet;
  }

  async generateShareToken(snippetId, userId) {
    const snippet = await Snippet.findOne({ _id: snippetId, user: userId, isDeleted: false });

    if (!snippet) {
      throw new Error('Snippet not found or unauthorized');
    }

    snippet.isPublic = true;
    snippet.shareToken = crypto.randomBytes(16).toString('hex');
    await snippet.save();

    return snippet.shareToken;
  }

  async getSharedSnippet(token) {
    const snippet = await Snippet.findOne({ shareToken: token, isPublic: true, isDeleted: false });

    if (!snippet) {
      throw new Error('Shared snippet not found');
    }

    snippet.views += 1;
    await snippet.save();

    return snippet;
  }

  async forkSnippet(snippetId, userId) {
    const originalSnippet = await Snippet.findOne({
      _id: snippetId,
      isPublic: true,
      isDeleted: false,
    });

    if (!originalSnippet) {
      throw new Error('Snippet not available for forking');
    }

    const forkedSnippet = await Snippet.create({
      user: userId,
      title: `Fork: ${originalSnippet.title}`,
      codeContent: originalSnippet.codeContent,
      language: originalSnippet.language,
      fileType: originalSnippet.fileType,
      description: originalSnippet.description,
      tags: originalSnippet.tags,
      parentSnippet: originalSnippet._id,
      isPublic: false,
      folderId: null, // Fork goes to root
    });

    originalSnippet.forks += 1;
    await originalSnippet.save();

    return forkedSnippet;
  }
}

module.exports = new SnippetService();
