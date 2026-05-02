const authService = require('../services/authService');
const { asyncHandler } = require('../utils/errorHandler');

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const result = await authService.register({ username, email, password });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const result = await authService.login({ username, password });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const result = await authService.forgotPassword(email);

  res.status(200).json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: 'Token and password are required',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  const result = await authService.resetPassword(token, password);

  res.status(200).json(result);
});

const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required',
    });
  }

  const result = await authService.verifyResetToken(token);

  res.status(200).json(result);
});

const forgotUsername = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const result = await authService.forgotUsername(email);

  res.status(200).json(result);
});

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  forgotUsername,
};
