const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

// All routes require authentication
router.use(protect);

// Upload and get files
router.post('/upload', fileController.uploadFile);
router.get('/', fileController.getUserFiles);
router.get('/deleted', fileController.getDeletedFiles);
router.get('/stats', fileController.getFileStats);

// Single file operations
router.delete('/:id', fileController.deleteFile);
router.put('/:id/restore', fileController.restoreFile);
router.delete('/:id/permanent', fileController.permanentDeleteFile);
router.put('/:id/move', fileController.moveFile);
router.get('/:id/download', fileController.downloadFile);

module.exports = router;
