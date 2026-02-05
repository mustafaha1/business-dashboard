const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');

// Upload directories
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const INVOICES_DIR = path.join(UPLOAD_DIR, 'invoices');

// Create directories if they don't exist
[UPLOAD_DIR, INVOICES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Allowed file types
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
];

// Allowed extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip'];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Storage configuration for invoices
const invoiceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, INVOICES_DIR);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = mime.lookup(file.originalname);
    
    // Check extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
    }
    
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !ALLOWED_MIME_TYPES.includes(mimeType)) {
        return cb(new Error('Invalid file type'), false);
    }
    
    cb(null, true);
};

// Multer configuration for invoices
const invoiceUpload = multer({
    storage: invoiceStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    }
});

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size is 10MB.',
                code: 'FILE_TOO_LARGE',
                maxSize: MAX_FILE_SIZE
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected file field.',
                code: 'UNEXPECTED_FILE'
            });
        }
        return res.status(400).json({
            error: err.message,
            code: err.code
        });
    }
    
    if (err) {
        return res.status(400).json({
            error: err.message,
            code: 'UPLOAD_ERROR'
        });
    }
    
    next();
};

// Delete file helper
const deleteFile = (filePath) => {
    return new Promise((resolve) => {
        if (!filePath) {
            resolve(false);
            return;
        }
        
        const fullPath = path.join(UPLOAD_DIR, filePath);
        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};

// Get file info helper
const getFileInfo = (filePath) => {
    if (!filePath) return null;
    
    const fullPath = path.join(UPLOAD_DIR, filePath);
    
    try {
        const stats = fs.statSync(fullPath);
        return {
            exists: true,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
        };
    } catch (err) {
        return {
            exists: false,
            error: err.message
        };
    }
};

// Format file size helper
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
    invoiceUpload,
    handleUploadError,
    deleteFile,
    getFileInfo,
    formatFileSize,
    UPLOAD_DIR,
    INVOICES_DIR,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES
};