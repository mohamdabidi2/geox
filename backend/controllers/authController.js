const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

// Generate email verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Login controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('Email and password are required')
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email with poste data
        const user = await User.findByEmail(email, true);
        if (!user) {
            console.log('Invalid credentials')
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token for valid user (regardless of verification status)
        const token = generateToken(user.id);

        // Check if email is validated
        if (!user.validEmail) {
            // Generate new verification token
            const verificationToken = generateVerificationToken();
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Update user with verification token
            await user.update({
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires
            });

            // Send verification email
            await sendVerificationEmail(user.email, verificationToken);

            return res.status(200).json({
                message: 'Please check your email to confirm your account.',
                needsEmailVerification: true,
                token, // Send token even though email is not verified
                user: user.toJSON()
            });
        }

        // Check password (only if email is validated)
        if (!user.password) {
            return res.status(400).json({ 
                message: 'Password not set. Please check your email for verification link to set your password.',
                token, // Send token even though password is not set
                user: user.toJSON()
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is fully verified
        if (!user.verifiedProfileRh || !user.verifiedProfileDirection) {
            return res.status(403).json({
                message: 'Your profile is not yet fully validated. Please wait until RH and Direction confirm it.',
                verification: {
                    validEmail: user.validEmail,
                    verifiedProfileRh: user.verifiedProfileRh,
                    verifiedProfileDirection: user.verifiedProfileDirection
                },
                token, // Send token even though profile is not fully verified
                user: user.toJSON()
            });
        }

        // If all validations pass (correct credentials and fully verified)
        res.status(200).json({
            message: 'Login successful',
            token,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Verify email token
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        // Find user by verification token
        const user = await User.findByVerificationToken(token);
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update user email validation status
        await user.update({
            validEmail: true,
            emailVerificationToken: null,
            emailVerificationExpires: null
        });

        res.status(200).json({
            message: 'Email verified successfully',
            needsPasswordCreation: !user.password,
            userId: user.id
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create password after email verification
const createPassword = async (req, res) => {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({ message: 'User ID and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.validEmail) {
            return res.status(400).json({ message: 'Email must be verified first' });
        }

        // Hash password and update user
        const hashedPassword = await User.hashPassword(password);
        await user.update({ password: hashedPassword });

        res.status(200).json({
            message: 'Password created successfully. You can now login.'
        });

    } catch (error) {
        console.error('Create password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        // Get user with full poste and magasin data
        const user = await User.findById(req.user.id, true);
        res.status(200).json({
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Register new user (admin only)
const register = async (req, res) => {
    try {
        const { email, firstname, lastname, poste, isAdmin, magasin_id } = req.body;
        console.log(req.body)

        // Validate input
        if (!email || !firstname || !lastname || !poste) {
            return res.status(400).json({ message: 'Email, firstname, lastname, and poste are required' });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Handle undefined values by converting to null
        const sanitizedIsAdmin = isAdmin !== undefined ? isAdmin : false;
        const sanitizedMagasinId = magasin_id !== undefined ? magasin_id : null;

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user with verification token and magasin_id
        // responsibleChef will be automatically determined from poste's parent
        const userId = await User.create({
            email,
            firstname,
            lastname,
            poste,
            isAdmin: sanitizedIsAdmin,
            magasin_id: sanitizedMagasinId,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken);
            console.log(`Verification email sent to: ${email}`);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail the registration if email fails, just log it
        }

        res.status(201).json({
            message: 'User created successfully. Please check your email to verify your account and set your password.',
            userId,
            needsEmailVerification: true
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    login,
    verifyEmail,
    createPassword,
    getProfile,
    register
};