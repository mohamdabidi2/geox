const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Upload user photo
const uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filename = req.file.filename;
        const userId = req.user.id;

        // Get current user to check for existing photo
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old photo if it exists and is not the default
        if (user.photo && user.photo !== 'default.jpg') {
            const oldPhotoPath = path.join(__dirname, '../uploads', user.photo);
            if (fs.existsSync(oldPhotoPath)) {
                try {
                    fs.unlinkSync(oldPhotoPath);
                } catch (error) {
                    console.error('Error deleting old photo:', error);
                }
            }
        }

        // Update user photo in database
        await user.update({ photo: filename });

        res.status(200).json({
            message: 'Photo uploaded successfully',
            filename: filename,
            photoUrl: `/uploads/${filename}`
        });

    } catch (error) {
        console.error('Upload photo error:', error);
        
        // Clean up uploaded file if database update fails
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }
        }
        
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete user photo
const deletePhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.photo || user.photo === 'default.jpg') {
            return res.status(400).json({ message: 'No photo to delete' });
        }

        // Delete photo file
        const photoPath = path.join(__dirname, '../uploads', user.photo);
        if (fs.existsSync(photoPath)) {
            try {
                fs.unlinkSync(photoPath);
            } catch (error) {
                console.error('Error deleting photo file:', error);
            }
        }

        // Update user photo to default
        await user.update({ photo: 'default.jpg' });

        res.status(200).json({
            message: 'Photo deleted successfully',
            photoUrl: '/uploads/default.jpg'
        });

    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user photo
const getPhoto = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads', filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            // Return default photo if requested file doesn't exist
            const defaultPath = path.join(__dirname, '../uploads/default.jpg');
            if (fs.existsSync(defaultPath)) {
                return res.sendFile(defaultPath);
            }
            return res.status(404).json({ message: 'Photo not found' });
        }

        res.sendFile(filePath);

    } catch (error) {
        console.error('Get photo error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    uploadPhoto,
    deletePhoto,
    getPhoto
};
