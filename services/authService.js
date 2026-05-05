const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../utils/generateToken');
const Folder = require('../models/Folder');
const { sendPasswordResetEmail, sendUsernameRecoveryEmail } = require('./emailService');

class AuthService {
  async register(userData) {
    const { username, email, password } = userData;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    await Folder.create({
      user: user._id,
      name: 'Root',
      parentId: null,
    });

    console.log(`✅ Created root folder for new user: ${username}`);

    const token = generateToken(user._id);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async login(credentials) {
    const { username, password } = credentials;

    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // FIX: Convert relative avatar path to absolute URL
    const userObj = user.toJSON();
    const baseUrl = process.env.FRONTEND_URL || 'https://codevaultx-api.onrender.com';

    if (userObj.avatarUrl && userObj.avatarUrl.startsWith('/')) {
      userObj.avatarUrl = `${baseUrl}${userObj.avatarUrl}`;
    }

    return userObj;
  }

  // ========== PASSWORD RESET METHODS ==========

  async forgotPassword(email) {
    const user = await User.findOne({ email }).select(
      '+passwordResetToken +passwordResetTokenExpires +passwordResetAttempts +passwordResetLockUntil'
    );

    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      };
    }

    if (user.isPasswordResetLocked && user.isPasswordResetLocked()) {
      const minutesLeft = Math.ceil((user.passwordResetLockUntil - Date.now()) / 60000);
      throw new Error(`Too many attempts. Please try again in ${minutesLeft} minutes.`);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const emailSent = await sendPasswordResetEmail(user.email, user.username, resetToken);

    if (!emailSent && process.env.NODE_ENV === 'production') {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new Error('Failed to send reset email. Please try again later.');
    }

    return {
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && { devToken: resetToken }),
    };
  }

  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: { $gt: Date.now() },
    }).select(
      '+passwordResetToken +passwordResetTokenExpires +passwordResetAttempts +passwordResetLockUntil +password'
    );

    if (!user) {
      throw new Error('Invalid or expired reset token. Please request a new one.');
    }

    if (user.isPasswordResetLocked && user.isPasswordResetLocked()) {
      throw new Error('Too many failed attempts. Please try again later.');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    user.password = newPassword;
    user.clearResetToken();
    await user.save();

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }

  async verifyResetToken(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: { $gt: Date.now() },
    }).select('passwordResetToken');

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    return {
      valid: true,
      message: 'Token is valid',
    };
  }

  async forgotUsername(email) {
    const user = await User.findOne({ email });

    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, we will send your username.',
      };
    }

    const emailSent = await sendUsernameRecoveryEmail(user.email, user.username);

    return {
      success: true,
      message: 'If an account with that email exists, we will send your username.',
    };
  }
}

module.exports = new AuthService();
