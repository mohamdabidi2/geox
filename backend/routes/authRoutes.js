const express = require('express');
const router = express.Router();
const { 
    login, 
    verifyEmail, 
    createPassword, 
    getProfile, 
    register 
} = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/create-password', createPassword);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);

// Admin only routes
router.post('/register',  register);

module.exports = router;