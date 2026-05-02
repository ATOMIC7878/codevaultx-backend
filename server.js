const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const snippetRoutes = require('./routes/snippetRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// ============ ENSURE UPLOAD DIRECTORIES EXIST ============
const uploadsDir = path.join(__dirname, '../uploads');
const filesDir = path.join(__dirname, '../uploads/files');
const avatarsDir = path.join(__dirname, '../uploads/avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
  console.log('📁 Created uploads/files directory');
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log('📁 Created uploads/avatars directory');
}

// ============ MIDDLEWARE (FIRST) - INCREASE ALL LIMITS ============
app.use(cors());

// CRITICAL: Increase JSON and URL-encoded limits to 500MB
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb', parameterLimit: 500000 }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Increase timeout for large file uploads (30 minutes for very large files)
app.use((req, res, next) => {
  req.setTimeout(30 * 60 * 1000); // 30 minutes
  res.setTimeout(30 * 60 * 1000); // 30 minutes
  next();
});

// ============ DATABASE CONNECTION ============
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codevaultx')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ============ API ROUTES (BEFORE STATIC FILES - CRITICAL!) ============
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);

// ============ TEST ROUTE TO VERIFY API IS WORKING ============
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!', maxUploadSize: '500MB' });
});

// ============ STATIC FILES (AFTER API ROUTES) ============
app.use(express.static(path.join(__dirname, '../frontend/pages')));
app.use('/components', express.static(path.join(__dirname, '../frontend/components')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use('/utils', express.static(path.join(__dirname, '../frontend/utils')));
app.use('/layouts', express.static(path.join(__dirname, '../frontend/layouts')));

// ============ HTML ROUTES ============
app.get(['/', '/auth'], (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/auth.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/editor.html'));
});

app.get('/languages', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/languages.html'));
});

app.get('/readmode', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/readmode.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/upload.html'));
});

// ============ PASSWORD RESET & USERNAME RECOVERY ROUTES ============
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/reset-password.html'));
});

app.get('/forgot-username', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/forgot-username.html'));
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Handle file size limit errors specifically
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum file size is 500MB.',
    });
  }

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum file size is 500MB.',
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!',
  });
});

// ============ 404 HANDLER FOR API ROUTES ============
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 CodeVaultX server running on http://localhost:${PORT}`);
  console.log(`📁 API test: http://localhost:${PORT}/api/test`);
  console.log(`📁 Upload page: http://localhost:${PORT}/upload`);
  console.log(`📁 Files API: http://localhost:${PORT}/api/files`);
  console.log(`📁 Max upload size: 500MB`);
  console.log(`📁 Upload timeout: 30 minutes`);
  console.log(`\n✅ All routes configured successfully!\n`);
});
