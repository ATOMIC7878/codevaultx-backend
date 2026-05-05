const userService = require('../services/userService');
const { asyncHandler } = require('../utils/errorHandler');

const updateProfile = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  const user = await userService.updateProfile(req.user._id, { username, email });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  const user = await userService.updateAvatar(req.user._id, avatarPath);

  // FIX: Convert to absolute URL using BACKEND URL
  const baseUrl = process.env.BACKEND_URL || 'https://codevaultx-api.onrender.com';
  const absoluteAvatarUrl = `${baseUrl}${avatarPath}`;

  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully',
    data: {
      user,
      avatarUrl: absoluteAvatarUrl,
      avatar: absoluteAvatarUrl, // Set both for consistency
    },
  });
});

const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await userService.deleteAvatar(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Avatar deleted successfully',
    data: { user },
  });
});

const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats(req.user._id);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = { updateProfile, updateAvatar, deleteAvatar, getUserStats };
