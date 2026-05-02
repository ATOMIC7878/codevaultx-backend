const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    path: {
      type: String,
      default: '',
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

// Generate path before saving
folderSchema.pre('save', async function (next) {
  if (this.isModified('parentId') || this.isNew) {
    if (this.parentId) {
      const parentFolder = await this.constructor.findById(this.parentId);
      if (parentFolder) {
        this.path = parentFolder.path + '/' + this.name;
      } else {
        this.path = '/' + this.name;
      }
    } else {
      this.path = '/' + this.name;
    }
  }
  next();
});

// Indexes
folderSchema.index({ user: 1, parentId: 1 });
folderSchema.index({ user: 1, isDeleted: 1 });
folderSchema.index({ user: 1, path: 1 });

module.exports = mongoose.model('Folder', folderSchema);
