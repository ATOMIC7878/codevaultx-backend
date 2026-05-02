const express = require('express');
const router = express.Router();
const {
  updateProfile,
  updateAvatar,
  deleteAvatar,
  getUserStats,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), handleUploadError, updateAvatar);
router.delete('/avatar', protect, deleteAvatar);
router.get('/stats', protect, getUserStats);

module.exports = router;
