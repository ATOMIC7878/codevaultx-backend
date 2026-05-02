const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/snippetController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createSnippet);
router.get('/', getUserSnippets);
router.get('/deleted', getDeletedSnippets);
router.get('/folder/:folderId', getSnippetsByFolder);
router.get('/:id', getSnippetById);
router.put('/:id', updateSnippet);
router.delete('/:id', deleteSnippet);
router.put('/:id/restore', restoreSnippet);
router.delete('/:id/permanent', permanentDeleteSnippet);
router.post('/:id/copy', copySnippet);
router.post('/:id/share', generateShareToken);
router.post('/:id/fork', forkSnippet);

// Public route
router.get('/share/:token', getSharedSnippet);

module.exports = router;
