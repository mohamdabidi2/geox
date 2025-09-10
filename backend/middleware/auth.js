const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Middleware to check if user is fully verified
const requireFullVerification = (req, res, next) => {
    if (!req.user || !req.user.validEmail || !req.user.verifiedProfileRh || !req.user.verifiedProfileDirection) {
        return res.status(403).json({ 
            message: 'Your profile is not yet fully validated. Please wait until RH and Direction confirm it.',
            verification: {
                validEmail: req.user?.validEmail || false,
                verifiedProfileRh: req.user?.verifiedProfileRh || false,
                verifiedProfileDirection: req.user?.verifiedProfileDirection || false
            }
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireFullVerification
};

