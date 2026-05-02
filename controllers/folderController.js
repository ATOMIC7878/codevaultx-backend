const folderService = require('../services/folderService');
const Folder = require('../models/Folder');
const { asyncHandler } = require('../utils/errorHandler');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const Snippet = require('../models/Snippet');
const File = require('../models/File');

// ========== FULL LANGUAGE EXTENSION MAPPING ==========
const getFileExtension = (language) => {
  const extMap = {
    // Programming Languages
    python: '.py',
    javascript: '.js',
    typescript: '.ts',
    java: '.java',
    csharp: '.cs',
    'c++': '.cpp',
    cpp: '.cpp',
    go: '.go',
    rust: '.rs',
    ruby: '.rb',
    php: '.php',
    swift: '.swift',
    kotlin: '.kt',
    scala: '.scala',
    elixir: '.ex',
    haskell: '.hs',
    clojure: '.clj',
    dart: '.dart',
    perl: '.pl',
    lua: '.lua',
    fsharp: '.fs',

    // Web Development
    html: '.html',
    html5: '.html',
    css: '.css',
    css3: '.css',
    react: '.jsx',
    vue: '.vue',
    'vue.js': '.vue',
    angular: '.ts',
    svelte: '.svelte',
    'next.js': '.jsx',
    nextjs: '.jsx',
    'nuxt.js': '.vue',
    nuxtjs: '.vue',
    tailwind: '.css',
    'tailwind css': '.css',
    bootstrap: '.css',
    jquery: '.js',
    astro: '.astro',
    gatsby: '.jsx',
    remix: '.jsx',
    solidjs: '.jsx',
    qwik: '.tsx',

    // Mobile Development
    'swift-mobile': '.swift',
    'kotlin-mobile': '.kt',
    flutter: '.dart',
    'react-native': '.jsx',
    ionic: '.ts',
    xamarin: '.cs',
    capacitor: '.js',

    // Backend & API
    nodejs: '.js',
    'node.js': '.js',
    'python-backend': '.py',
    'java-spring': '.java',
    'spring boot': '.java',
    'go-backend': '.go',
    'php-backend': '.php',
    '.net core': '.cs',
    dotnet: '.cs',
    'ruby-rails': '.rb',
    'ruby on rails': '.rb',
    nestjs: '.ts',
    fastapi: '.py',
    graphql: '.graphql',
    grpc: '.proto',

    // Databases
    sql: '.sql',
    postgresql: '.sql',
    mysql: '.sql',
    mongodb: '.js',
    redis: '.redis',
    elasticsearch: '.json',
    cassandra: '.cql',
    dynamodb: '.json',
    firebase: '.json',
    sqlite: '.sqlite',
    oracle: '.sql',

    // DevOps & Cloud
    docker: '.dockerfile',
    kubernetes: '.yaml',
    terraform: '.tf',
    ansible: '.yml',
    jenkins: '.groovy',
    'github-actions': '.yml',
    'gitlab-ci': '.yml',
    prometheus: '.yml',
    nginx: '.conf',
    apache: '.conf',

    // Data Science
    'python-data': '.py',
    'r-data': '.r',
    julia: '.jl',
    matlab: '.m',
    'scala-spark': '.scala',
    pandas: '.py',
    numpy: '.py',

    // AI/ML
    tensorflow: '.py',
    pytorch: '.py',
    keras: '.py',
    'scikit-learn': '.py',
    opencv: '.py',
    nlp: '.py',
    langchain: '.py',

    // Game Development
    'unity-csharp': '.cs',
    'unreal-cpp': '.cpp',
    'godot-gdscript': '.gd',
    cocos2d: '.js',

    // Configuration & Markup
    json: '.json',
    yaml: '.yaml',
    xml: '.xml',
    markdown: '.md',
    toml: '.toml',
    env: '.env',
    ini: '.ini',
    csv: '.csv',

    // Scripting & Automation
    bash: '.sh',
    powershell: '.ps1',
    zsh: '.zsh',
    'perl-script': '.pl',
    'lua-script': '.lua',
    vba: '.vba',
  };

  const langLower = language?.toLowerCase() || '';

  if (extMap[langLower]) return extMap[langLower];

  // Partial matches
  if (langLower.includes('python')) return '.py';
  if (langLower.includes('javascript') || langLower.includes('js')) return '.js';
  if (langLower.includes('typescript') || langLower.includes('ts')) return '.ts';
  if (langLower.includes('java')) return '.java';
  if (langLower.includes('csharp') || langLower.includes('c#')) return '.cs';
  if (langLower.includes('c++') || langLower.includes('cpp')) return '.cpp';
  if (langLower.includes('go')) return '.go';
  if (langLower.includes('rust')) return '.rs';
  if (langLower.includes('ruby')) return '.rb';
  if (langLower.includes('php')) return '.php';
  if (langLower.includes('swift')) return '.swift';
  if (langLower.includes('kotlin')) return '.kt';
  if (langLower.includes('html')) return '.html';
  if (langLower.includes('css')) return '.css';
  if (langLower.includes('react') || langLower.includes('vue') || langLower.includes('angular'))
    return '.jsx';
  if (langLower.includes('sql')) return '.sql';
  if (langLower.includes('json')) return '.json';
  if (langLower.includes('yaml') || langLower.includes('yml')) return '.yaml';
  if (langLower.includes('xml')) return '.xml';
  if (langLower.includes('markdown') || langLower.includes('md')) return '.md';
  if (langLower.includes('bash') || langLower.includes('sh')) return '.sh';
  if (langLower.includes('docker')) return '.dockerfile';
  if (langLower.includes('terraform')) return '.tf';

  return '.txt';
};

// ========== RECURSIVE FUNCTION TO GET ALL SUBFOLDER IDS ==========
const getAllSubFolderIds = async (parentId, userId) => {
  let allIds = [parentId];

  const childFolders = await Folder.find({
    parentId: parentId,
    user: userId,
    isDeleted: false,
    name: { $ne: 'Root' },
  });

  for (const child of childFolders) {
    const childIds = await getAllSubFolderIds(child._id, userId);
    allIds = [...allIds, ...childIds];
  }

  return allIds;
};

// ========== FUNCTION TO BUILD FOLDER PATH MAP ==========
const buildFolderPathMap = async (userId) => {
  const allFolders = await Folder.find({
    user: userId,
    isDeleted: false,
  });

  const folderMap = new Map();
  allFolders.forEach((f) => {
    folderMap.set(f._id.toString(), {
      name: f.name,
      parentId: f.parentId,
    });
  });

  return folderMap;
};

// ========== FUNCTION TO GET FULL FOLDER PATH ==========
const getFolderPath = (folderId, folderMap, currentPath = '') => {
  const folderData = folderMap.get(folderId.toString());
  if (!folderData) return currentPath;

  const folderName = folderData.name.replace(/[\\/:*?"<>|]/g, '_');

  if (!folderData.parentId) {
    return currentPath ? path.join(folderName, currentPath) : folderName;
  }

  const parentPath = getFolderPath(folderData.parentId, folderMap, '');
  if (parentPath) {
    return path.join(parentPath, folderName, currentPath);
  }
  return currentPath ? path.join(folderName, currentPath) : folderName;
};

// Create folder
const createFolder = asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  const folder = await folderService.createFolder(req.user._id, name, parentId);

  res.status(201).json({
    success: true,
    message: 'Folder created successfully',
    data: { folder },
  });
});

// Get all user folders
const getUserFolders = asyncHandler(async (req, res) => {
  const allFolders = await folderService.getUserFolders(req.user._id);
  const nonRootFolders = await Folder.find({
    user: req.user._id,
    name: { $ne: 'Root' },
    isDeleted: false,
  });

  console.log(`📊 User ${req.user.id} has ${nonRootFolders.length} user-created folders`);

  res.status(200).json({
    success: true,
    data: {
      folders: allFolders,
      userFolderCount: nonRootFolders.length,
    },
  });
});

// Get folder by ID with contents
const getFolderById = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const folderData = await folderService.getFolderById(folderId, req.user._id);

  res.status(200).json({
    success: true,
    data: folderData,
  });
});

// Update folder
const updateFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const { name } = req.body;
  const folder = await folderService.updateFolder(folderId, req.user._id, { name });

  res.status(200).json({
    success: true,
    message: 'Folder updated successfully',
    data: { folder },
  });
});

// Move folder
const moveFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const { newParentId } = req.body;
  const folder = await folderService.moveFolder(folderId, req.user._id, newParentId);

  res.status(200).json({
    success: true,
    message: 'Folder moved successfully',
    data: { folder },
  });
});

// Delete folder (soft delete)
const deleteFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const folder = await folderService.deleteFolder(folderId, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Folder moved to trash',
    data: { folder },
  });
});

// Restore folder from trash
const restoreFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const folder = await folderService.restoreFolder(folderId, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Folder restored successfully',
    data: { folder },
  });
});

// Permanently delete folder
const permanentDeleteFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  await folderService.permanentDeleteFolder(folderId, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Folder permanently deleted',
  });
});

// Add snippet to folder
const addSnippetToFolder = asyncHandler(async (req, res) => {
  const { folderId, snippetId } = req.body;
  const result = await folderService.addSnippetToFolder(folderId, snippetId, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Snippet added to folder',
    data: result,
  });
});

// Remove snippet from folder
const removeSnippetFromFolder = asyncHandler(async (req, res) => {
  const { folderId, snippetId } = req.params;
  await folderService.removeSnippetFromFolder(folderId, snippetId, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Snippet removed from folder',
  });
});

// Move snippet to folder
const moveSnippetToFolder = asyncHandler(async (req, res) => {
  const { snippetId, sourceFolderId, targetFolderId } = req.body;
  const result = await folderService.moveSnippetToFolder(
    snippetId,
    sourceFolderId,
    targetFolderId,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: 'Snippet moved successfully',
    data: result,
  });
});

// Get deleted folders
const getDeletedFolders = asyncHandler(async (req, res) => {
  const folders = await folderService.getDeletedFolders(req.user._id);

  res.status(200).json({
    success: true,
    data: { folders },
  });
});

// Check if folder is empty
const checkFolderEmpty = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const isEmpty = await folderService.isFolderEmpty(folderId, req.user._id);

  res.status(200).json({
    success: true,
    data: { isEmpty },
  });
});

// ========== FINAL FIXED: Download folder as ZIP ==========
const downloadFolderAsZip = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user._id;

    const folder = await Folder.findOne({
      _id: folderId,
      user: userId,
      isDeleted: false,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
    }

    console.log('🚀 ZIP START:', folder.name);
    console.log('🔍 User ID:', userId.toString());
    console.log('🔍 Target Folder ID:', folderId);

    // Get all subfolder IDs recursively
    const allFolderIds = await getAllSubFolderIds(folderId, userId);
    console.log('📁 All Folder IDs:', allFolderIds);

    // Build folder map for path resolution
    const folderMap = await buildFolderPathMap(userId);
    if (!folderMap.has(folderId.toString())) {
      folderMap.set(folderId.toString(), { name: folder.name, parentId: folder.parentId });
    }

    // ========== QUERY 1: Snippets (uses 'user' field) ==========
    const snippets = await Snippet.find({
      user: userId,
      folderId: { $in: allFolderIds },
      isDeleted: false,
    });

    // ========== QUERY 2: Files (uses 'userId' field) ==========
    const files = await File.find({
      userId: userId,
      folderId: { $in: allFolderIds },
      isDeleted: false,
    });

    console.log('📝 Snippets found:', snippets.length);
    console.log('📄 Files found:', files.length);

    // Debug logs
    if (snippets.length > 0) {
      console.log('📝 First snippet:', snippets[0].title, 'folderId:', snippets[0].folderId);
    }
    if (files.length > 0) {
      console.log('📄 First file:', files[0].name, 'folderId:', files[0].folderId);
    }

    const zipName = `${folder.name.replace(/[\\/:*?"<>|]/g, '_')}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('ZIP ERROR:', err);
      if (!res.headersSent) res.status(500).end();
    });

    archive.on('end', () => {
      console.log(`✅ ZIP created: ${zipName} (${archive.pointer()} bytes)`);
    });

    archive.pipe(res);

    let count = 0;

    // Add snippets with proper folder structure
    for (const s of snippets) {
      const folderPath = getFolderPath(s.folderId, folderMap);
      const ext = getFileExtension(s.language);
      const fileName = `${s.title.replace(/[\\/:*?"<>|]/g, '_')}${ext}`;
      const fullPath = folderPath ? path.join(folderPath, fileName) : fileName;

      archive.append(s.codeContent || '', { name: fullPath });
      console.log('📄 Added snippet:', fullPath);
      count++;
    }

    // Add files with proper folder structure
    for (const f of files) {
      const folderPath = getFolderPath(f.folderId, folderMap);
      const fileName = `${f.name.replace(/[\\/:*?"<>|]/g, '_')}${f.fileExtension}`;
      const fullPath = folderPath ? path.join(folderPath, fileName) : fileName;

      if (fs.existsSync(f.filePath)) {
        archive.file(f.filePath, { name: fullPath });
        console.log('📁 Added file:', fullPath);
        count++;
      } else {
        console.warn('❌ Missing file:', f.filePath);
      }
    }

    if (count === 0) {
      archive.append('Folder is empty', { name: 'EMPTY.txt' });
      console.log('⚠️ No items found, added EMPTY.txt');
    }

    console.log('✅ Total items added to ZIP:', count);

    archive.finalize();
  } catch (err) {
    console.error('❌ ZIP ERROR:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'ZIP failed: ' + err.message,
      });
    }
  }
};

module.exports = {
  createFolder,
  getUserFolders,
  getFolderById,
  updateFolder,
  moveFolder,
  deleteFolder,
  restoreFolder,
  permanentDeleteFolder,
  addSnippetToFolder,
  removeSnippetFromFolder,
  moveSnippetToFolder,
  getDeletedFolders,
  checkFolderEmpty,
  downloadFolderAsZip,
};
