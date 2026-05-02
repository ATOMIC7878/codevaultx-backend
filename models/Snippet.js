const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: 'Untitled Snippet',
    },
    codeContent: {
      type: String,
      required: [true, 'Code content is required'],
      maxlength: [100000, 'Code content cannot exceed 100KB'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    parentSnippet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Snippet',
      default: null,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    // SOFT DELETE FIELDS
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
snippetSchema.index({ user: 1, createdAt: -1 });
snippetSchema.index({ language: 1 });
snippetSchema.index({ isPublic: 1 });
snippetSchema.index({ tags: 1 });
snippetSchema.index({ folderId: 1, user: 1 });
snippetSchema.index({ isDeleted: 1, user: 1 }); // For trash queries

module.exports = mongoose.model('Snippet', snippetSchema);
