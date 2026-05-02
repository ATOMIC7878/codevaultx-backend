const User = require('../models/User');
const fs = require('fs');
const path = require('path');

class UserService {
  async updateProfile(userId, updateData) {
    const { username, email } = updateData;

    if (username || email) {
      const query = {};
      if (username) query.username = username;
      if (email) query.email = email;

      const existingUser = await User.findOne({
        ...query,
        _id: { $ne: userId },
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw new Error('Username already taken');
        }
        if (existingUser.email === email) {
          throw new Error('Email already registered');
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.toJSON();
  }

  async updateAvatar(userId, avatarPath) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '../../', user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.avatarUrl = avatarPath;
    await user.save();

    return user.toJSON();
  }

  async deleteAvatar(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '../../', user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      user.avatarUrl = null;
      await user.save();
    }

    return user.toJSON();
  }

  async getUserStats(userId) {
    const Snippet = require('../models/Snippet');

    const [totalSnippets, publicSnippets, recentSnippets] = await Promise.all([
      Snippet.countDocuments({ user: userId }),
      Snippet.countDocuments({ user: userId, isPublic: true }),
      Snippet.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title language createdAt views'),
    ]);

    return {
      totalSnippets,
      publicSnippets,
      recentSnippets,
    };
  }
}

module.exports = new UserService();
