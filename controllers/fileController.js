const File = require('../models/File');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Create upload middleware - 1GB limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024,
    fieldSize: 1024 * 1024 * 1024,
  },
});

// Helper function to validate file type
function getFileTypeFromExtension(filename) {
  const ext = path.extname(filename).toLowerCase();

  const archiveTypes = ['.zip', '.rar', '.7z'];
  const documentTypes = ['.pdf', '.doc', '.docx', '.txt'];

  if (archiveTypes.includes(ext)) {
    return 'archive';
  } else if (documentTypes.includes(ext)) {
    return 'document';
  } else {
    return null;
  }
}

// Upload file
exports.uploadFile = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer error details:', {
        message: err.message,
        code: err.code,
        field: err.field,
        stack: err.stack,
      });

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum file size is 1GB.',
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      console.log('========================================');
      console.log('🔍 RAW req.body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 folderId type:', typeof req.body.folderId);
      console.log('🔍 folderId value:', req.body.folderId);
      console.log('========================================');

      let { fileName, folderId } = req.body;
      const file = req.file;

      let finalFolderId = null;
      if (folderId && folderId !== 'null' && folderId !== 'undefined' && folderId !== '') {
        finalFolderId = folderId;
        console.log('✅ File will be saved to folder ID:', finalFolderId);
      } else {
        console.log('📁 No valid folderId, saving to Root');
      }

      const fileType = getFileTypeFromExtension(file.originalname);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

      console.log('📤 Upload details:', {
        fileName,
        folderId: finalFolderId,
        originalName: file.originalname,
        fileType: fileType,
        sizeInMB: fileSizeMB + ' MB',
      });

      if (file.size > 1024 * 1024 * 1024) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(413).json({
          success: false,
          message: `File size (${fileSizeMB} MB) exceeds 1GB limit`,
        });
      }

      if (!fileType) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Allowed: .zip, .rar, .7z, .pdf, .doc, .docx, .txt',
        });
      }

      const newFile = new File({
        userId: req.user._id,
        name: fileName || path.parse(file.originalname).name,
        originalName: file.originalname,
        fileType: fileType,
        fileExtension: path.extname(file.originalname),
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath: file.path,
        folderId: finalFolderId,
      });

      await newFile.save();

      console.log('✅ File saved successfully:', {
        id: newFile._id,
        name: newFile.name,
        folderId: newFile.folderId,
        size: fileSizeMB + ' MB',
      });
      console.log('========================================');

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          file: {
            _id: newFile._id,
            name: newFile.name,
            originalName: newFile.originalName,
            fileType: newFile.fileType,
            fileExtension: newFile.fileExtension,
            fileSize: newFile.fileSize,
            folderId: newFile.folderId,
            createdAt: newFile.createdAt,
          },
        },
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error during upload',
      });
    }
  });
};

// Get user files
exports.getUserFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    const query = {
      userId: req.user._id,
      isDeleted: false,
    };

    console.log('📁 getUserFiles - folderId param:', folderId);

    if (folderId && folderId !== 'null' && folderId !== 'undefined') {
      query.folderId = folderId;
      console.log('📁 Filtering by folder:', folderId);
    } else {
      query.folderId = null;
      console.log('📁 Filtering by Root (null)');
    }

    const files = await File.find(query).sort({ createdAt: -1 });

    console.log(`📁 Found ${files.length} files in ${folderId || 'Root'}`);

    res.json({
      success: true,
      data: { files },
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get deleted files
exports.getDeletedFiles = async (req, res) => {
  try {
    const files = await File.find({
      userId: req.user._id,
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    res.json({
      success: true,
      data: { files },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get file by ID
exports.getFileById = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.json({
      success: true,
      data: { file },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Soft delete file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.json({
      success: true,
      message: 'File moved to trash',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Restore file
exports.restoreFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: true,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in trash',
      });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.json({
      success: true,
      message: 'File restored successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Permanent delete file
exports.permanentDeleteFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: true,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    await File.deleteOne({ _id: file._id });

    res.json({
      success: true,
      message: 'File permanently deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Move file to folder
exports.moveFile = async (req, res) => {
  try {
    const { folderId } = req.body;
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    file.folderId = folderId || null;
    file.updatedAt = new Date();
    await file.save();

    res.json({
      success: true,
      message: 'File moved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server',
      });
    }

    const downloadName = file.name + file.fileExtension;
    res.download(file.filePath, downloadName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get file stats
exports.getFileStats = async (req, res) => {
  try {
    const totalFiles = await File.countDocuments({
      userId: req.user._id,
      isDeleted: false,
    });

    const archiveFiles = await File.countDocuments({
      userId: req.user._id,
      isDeleted: false,
      fileType: 'archive',
    });

    const documentFiles = await File.countDocuments({
      userId: req.user._id,
      isDeleted: false,
      fileType: 'document',
    });

    res.json({
      success: true,
      data: {
        totalFiles,
        archiveFiles,
        documentFiles,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
