const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createFolder,
  getUserFolders,
  getFolderById,
  updateFolder,
  moveFolder,
  deleteFolder,
  restoreFolder,
  permanentDeleteFolder,
  addSnippetToFolder,
  removeSnippetFromFolder,
  moveSnippetToFolder,
  getDeletedFolders,
  checkFolderEmpty,
  downloadFolderAsZip,
} = require('../controllers/folderController');

// Protected routes
router.use(protect);

// Folder CRUD
router.post('/', createFolder);
router.get('/', getUserFolders);
router.get('/deleted', getDeletedFolders);
router.get('/:folderId', getFolderById);
router.put('/:folderId', updateFolder);
router.put('/:folderId/move', moveFolder);
router.delete('/:folderId', deleteFolder);
router.put('/:folderId/restore', restoreFolder);
router.delete('/:folderId/permanent', permanentDeleteFolder);

// Check if folder is empty
router.get('/:folderId/empty', checkFolderEmpty);

// Download folder as ZIP
router.get('/:folderId/download', downloadFolderAsZip);

// Snippet operations
router.post('/add-snippet', addSnippetToFolder);
router.delete('/:folderId/snippets/:snippetId', removeSnippetFromFolder);
router.post('/move-snippet', moveSnippetToFolder);

module.exports = router;
