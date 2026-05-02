const snippetService = require('../services/snippetService');
const Folder = require('../models/Folder');
const { asyncHandler } = require('../utils/errorHandler');

const createSnippet = asyncHandler(async (req, res) => {
  const snippetData = req.body;
  const userId = req.user.id;
  let folderId = req.body.folderId || null;

  if (!folderId) {
    let rootFolder = await Folder.findOne({ user: userId, name: 'Root', parentId: null });
    if (!rootFolder) {
      rootFolder = await Folder.create({
        user: userId,
        name: 'Root',
        parentId: null,
      });
    }
    folderId = rootFolder._id;
  }

  const snippet = await snippetService.createSnippet(userId, snippetData, folderId);

  res.status(201).json({
    success: true,
    message: 'Snippet created successfully',
    data: { snippet, folderId },
  });
});

// Get active snippets (for dashboard)
const getUserSnippets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await snippetService.getUserActiveSnippets(req.user.id, page, limit);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// Get deleted snippets (for trash)
const getDeletedSnippets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const result = await snippetService.getDeletedSnippets(req.user.id, page, limit);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getSnippetsByFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await snippetService.getSnippetsByFolder(req.user.id, folderId, page, limit);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getSnippetById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const snippet = await snippetService.getSnippetById(id, req.user.id);

  res.status(200).json({
    success: true,
    data: { snippet },
  });
});

const updateSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const snippet = await snippetService.updateSnippet(id, req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Snippet updated successfully',
    data: { snippet },
  });
});

// SOFT DELETE snippet
const deleteSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await snippetService.deleteSnippet(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Snippet moved to trash',
  });
});

// RESTORE snippet from trash
const restoreSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await snippetService.restoreSnippet(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Snippet restored to Root',
  });
});

// PERMANENT DELETE snippet
const permanentDeleteSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await snippetService.permanentDeleteSnippet(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Snippet permanently deleted',
  });
});

// COPY snippet
const copySnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { targetFolderId } = req.body;
  const snippet = await snippetService.copySnippet(id, req.user.id, targetFolderId);

  res.status(201).json({
    success: true,
    message: 'Snippet copied successfully',
    data: { snippet },
  });
});

const generateShareToken = asyncHandler(async (req, res) => {
  const shareToken = await snippetService.generateShareToken(req.params.id, req.user.id);
  res.status(200).json({
    success: true,
    data: {
      shareToken,
      shareUrl: `${req.protocol}://${req.get('host')}/api/snippets/share/${shareToken}`,
    },
  });
});

const getSharedSnippet = asyncHandler(async (req, res) => {
  const snippet = await snippetService.getSharedSnippet(req.params.token);
  res.status(200).json({
    success: true,
    data: { snippet },
  });
});

const forkSnippet = asyncHandler(async (req, res) => {
  const snippet = await snippetService.forkSnippet(req.params.id, req.user.id);
  res.status(201).json({
    success: true,
    message: 'Snippet forked successfully',
    data: { snippet },
  });
});

module.exports = {
  createSnippet,
  getUserSnippets,
  getDeletedSnippets,
  getSnippetsByFolder,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  restoreSnippet,
  permanentDeleteSnippet,
  copySnippet,
  generateShareToken,
  getSharedSnippet,
  forkSnippet,
};
