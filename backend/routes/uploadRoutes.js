const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { uploadPhoto, deletePhoto, getPhoto } = require('../controllers/photoController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure default.jpg exists
const defaultPhotoPath = path.join(uploadsDir, 'default.jpg');
if (!fs.existsSync(defaultPhotoPath)) {
    // Create a simple default photo (blank image)
    const defaultImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(defaultPhotoPath, defaultImage);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomnumber-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const basename = path.basename(file.originalname, extension);
        cb(null, basename + '-' + uniqueSuffix + extension);
    }
});

// File filter function for images only
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

// File filter function for documents
const documentFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only document files are allowed'), false);
    }
};

const uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit for images
    },
    fileFilter: imageFilter
});

const uploadDocument = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for documents
    },
    fileFilter: documentFilter
});

const uploadMultiple = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5 // Max 5 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Photo routes
router.post('/profile-photo', authenticateToken, uploadImage.single('photo'), uploadPhoto);
router.delete('/profile-photo', authenticateToken, deletePhoto);
router.get('/photo/:filename', getPhoto);

// Document upload
router.post('/document', authenticateToken, uploadDocument.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Here you can save the document information to the database
        // For example, create a document record linked to the user

        res.status(200).json({
            message: 'Document uploaded successfully',
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            documentUrl: `/uploads/${req.file.filename}`
        });

    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Multiple file upload
router.post('/multiple', authenticateToken, uploadMultiple.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const filesInfo = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            url: `/uploads/${file.filename}`
        }));

        res.status(200).json({
            message: 'Files uploaded successfully',
            files: filesInfo
        });

    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete file
router.delete('/:filename', authenticateToken, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Prevent deletion of default photo
        if (filename === 'default.jpg') {
            return res.status(400).json({ message: 'Cannot delete default photo' });
        }

        fs.unlinkSync(filePath);

        res.status(200).json({ message: 'File deleted successfully' });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files' });
        }
    }
    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({ message: 'Only image files are allowed' });
    }
    if (error.message === 'Only document files are allowed') {
        return res.status(400).json({ message: 'Only document files are allowed' });
    }
    if (error.message === 'File type not allowed') {
        return res.status(400).json({ message: 'File type not allowed' });
    }
    
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = router;