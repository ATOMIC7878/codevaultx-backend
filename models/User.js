const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // ========== PASSWORD RESET FIELDS (ADD THESE) ==========
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetLockUntil: {
      type: Date,
      select: false,
    },
    // ========== END PASSWORD RESET FIELDS ==========
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ========== PASSWORD RESET METHODS (ADD THESE) ==========

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  this.passwordResetAttempts = 0;
  this.passwordResetLockUntil = undefined;

  return resetToken;
};

// Check if password reset is rate-limited
userSchema.methods.isPasswordResetLocked = function () {
  if (!this.passwordResetLockUntil) return false;
  return this.passwordResetLockUntil > Date.now();
};

// Increment reset attempts
userSchema.methods.incrementResetAttempts = async function () {
  this.passwordResetAttempts = (this.passwordResetAttempts || 0) + 1;

  if (this.passwordResetAttempts >= 5) {
    this.passwordResetLockUntil = Date.now() + 15 * 60 * 1000;
    this.passwordResetAttempts = 0;
  }

  await this.save({ validateBeforeSave: false });
};

// Clear reset token after successful password change
userSchema.methods.clearResetToken = function () {
  this.passwordResetToken = undefined;
  this.passwordResetTokenExpires = undefined;
  this.passwordResetAttempts = 0;
  this.passwordResetLockUntil = undefined;
};

// ========== END PASSWORD RESET METHODS ==========

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  delete obj.passwordResetToken;
  delete obj.passwordResetTokenExpires;
  delete obj.passwordResetAttempts;
  delete obj.passwordResetLockUntil;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
