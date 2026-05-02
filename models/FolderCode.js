// backend/models/FolderCode.js
const mongoose = require('mongoose');

const folderCodeSchema = new mongoose.Schema(
  {
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      required: [true, 'Folder ID is required'],
      index: true,
    },
    snippet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Snippet',
      required: [true, 'Snippet ID is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate folder-snippet pairs
folderCodeSchema.index({ folder: 1, snippet: 1 }, { unique: true });

module.exports = mongoose.model('FolderCode', folderCodeSchema);
