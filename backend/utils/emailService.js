const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Email templates
const emailTemplates = {
    verification: {
        subject: 'Verify Your Email Address',
        template: null
    },
    passwordReset: {
        subject: 'Reset Your Password',
        template: null
    },
    welcome: {
        subject: 'Welcome to Our Platform',
        template: null
    }
};

// Load email templates
const loadTemplates = async () => {
    try {
        const templatesDir = path.join(__dirname, '..', 'templates', 'emails');
        
        // Create templates directory if it doesn't exist
        await fs.mkdir(templatesDir, { recursive: true });
        
        // Check if template files exist, create them if they don't
        const verificationPath = path.join(templatesDir, 'verification.html');
        const passwordResetPath = path.join(templatesDir, 'password-reset.html');
        const welcomePath = path.join(templatesDir, 'welcome.html');

        // Create default templates if they don't exist
        if (!await fileExists(verificationPath)) {
            await createDefaultTemplate(verificationPath, 'verification');
        }
        if (!await fileExists(passwordResetPath)) {
            await createDefaultTemplate(passwordResetPath, 'passwordReset');
        }
        if (!await fileExists(welcomePath)) {
            await createDefaultTemplate(welcomePath, 'welcome');
        }

        // Load templates
        emailTemplates.verification.template = await fs.readFile(verificationPath, 'utf8');
        emailTemplates.passwordReset.template = await fs.readFile(passwordResetPath, 'utf8');
        emailTemplates.welcome.template = await fs.readFile(welcomePath, 'utf8');

    } catch (error) {
        console.warn('Error loading email templates, using default templates:', error.message);
        setFallbackTemplates();
    }
};

// Check if file exists
const fileExists = async (path) => {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
};

// Create default template file
const createDefaultTemplate = async (filePath, templateType) => {
    let content = '';
    
    switch (templateType) {
        case 'verification':
            content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <h2>Hello,</h2>
            <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{verificationLink}}" class="button">Verify Email Address</a>
            </p>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">
                {{verificationLink}}
            </p>

            <p>This verification link will expire in 24 hours.</p>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>If you have any questions, contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
            <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;
        
        case 'passwordReset':
            content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello,</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{resetLink}}" class="button">Reset Password</a>
            </p>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">
                {{resetLink}}
            </p>

            <p>This reset link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
            <p>If you have any questions, contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
            <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;
        
        case 'welcome':
            content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome Aboard!</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}},</h2>
            <p>Welcome to our platform! Your account has been successfully created and is ready to use.</p>
            
            <p>You can now:</p>
            <ul>
                <li>Login to your account</li>
                <li>Access all available features</li>
                <li>Start using our services</li>
            </ul>

            <p style="text-align: center; margin: 30px 0;">
                <a href="{{loginLink}}" class="button">Login to Your Account</a>
            </p>

            <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
        </div>
        <div class="footer">
            <p>Contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
            <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
            break;
    }
    
    await fs.writeFile(filePath, content);
};

// Set fallback templates
const setFallbackTemplates = () => {
    emailTemplates.verification.template = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Verify Your Email</title>
        </head>
        <body>
            <h2>Email Verification</h2>
            <p>Hello,</p>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="{{verificationLink}}">Verify Email</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
        </body>
        </html>
    `;

    emailTemplates.passwordReset.template = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset Your Password</title>
        </head>
        <body>
            <h2>Password Reset</h2>
            <p>Hello,</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="{{resetLink}}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
        </body>
        </html>
    `;

    emailTemplates.welcome.template = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome</title>
        </head>
        <body>
            <h2>Welcome to Our Platform!</h2>
            <p>Hello {{firstName}},</p>
            <p>Your account has been successfully created and is ready to use.</p>
            <p>You can now login with your email address and password.</p>
            <p>Thank you for joining us!</p>
        </body>
        </html>
    `;
};

// Replace template variables
const replaceTemplateVariables = (template, variables) => {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        
        const html = replaceTemplateVariables(emailTemplates.verification.template, {
            verificationLink,
            frontendUrl: process.env.FRONTEND_URL,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"No Reply" <${process.env.SMTP_USER}>`,
            to: email,
            subject: emailTemplates.verification.subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        
        const html = replaceTemplateVariables(emailTemplates.passwordReset.template, {
            resetLink,
            frontendUrl: process.env.FRONTEND_URL,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"No Reply" <${process.env.SMTP_USER}>`,
            to: email,
            subject: emailTemplates.passwordReset.subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName) => {
    try {
        const html = replaceTemplateVariables(emailTemplates.welcome.template, {
            firstName,
            loginLink: `${process.env.FRONTEND_URL}/login`,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Welcome" <${process.env.SMTP_USER}>`,
            to: email,
            subject: emailTemplates.welcome.subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw new Error('Failed to send welcome email');
    }
};

// Test email connection
const testEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('Email server connection verified');
        return true;
    } catch (error) {
        console.error('Email server connection failed:', error);
        return false;
    }
};
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
// Initialize templates on startup
loadTemplates().catch(console.error);

module.exports = {
    transporter,
    sendVerificationEmail,
    generateVerificationToken,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    testEmailConnection,
    loadTemplates
};