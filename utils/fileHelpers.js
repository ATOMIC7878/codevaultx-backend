const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      resolve(false);
      return;
    }

    const fullPath = path.join(__dirname, '../../', filePath);

    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
        return;
      }

      fs.unlink(fullPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });
};

const getFileExtension = (language) => {
  const extensions = {
    javascript: '.js',
    python: '.py',
    java: '.java',
    cpp: '.cpp',
    csharp: '.cs',
    go: '.go',
    rust: '.rs',
    php: '.php',
    ruby: '.rb',
    swift: '.swift',
    kotlin: '.kt',
    typescript: '.ts',
    html: '.html',
    css: '.css',
    json: '.json',
    xml: '.xml',
    yaml: '.yaml',
    markdown: '.md',
    sql: '.sql',
    bash: '.sh',
    txt: '.txt',
    pdf: '.pdf',
  };
  return extensions[language] || '.txt';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = { deleteFile, getFileExtension, formatFileSize };
