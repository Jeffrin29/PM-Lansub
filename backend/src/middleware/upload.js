const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const config = require('../config/config');
const { errorResponse } = require('../utils/helpers');

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sub-folder by entity type: uploads/projects/ or uploads/tasks/
    const entityType = req.baseUrl.includes('project') ? 'projects' : 'tasks';
    const dest = path.join(uploadDir, entityType);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', `File type '${file.mimetype}' is not allowed.`),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
    files: 10,
  },
});

/**
 * Multer error handler — converts multer errors into standard API error responses
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `File too large. Maximum size is ${config.upload.maxSize / 1024 / 1024}MB.`,
      LIMIT_FILE_COUNT: 'Too many files. Maximum 10 files per upload.',
      LIMIT_UNEXPECTED_FILE: err.field || 'Unexpected file field.',
    };
    return errorResponse(res, messages[err.code] || err.message, 400);
  }
  next(err);
};

module.exports = { upload, handleMulterError };
