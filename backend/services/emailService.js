import nodemailer from 'nodemailer';
import { errors } from '../utils/errorHandler.js';
import config from '../config/index.js';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify SMTP connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('SMTP connection error:', error);
    } else {
        console.log('SMTP server is ready to take our messages');
    }
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"Radiology Lab" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw errors.InternalServerError('Failed to send email');
    }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
    // Use the validated frontend URL from config
    const frontendUrl = config.frontendUrl.replace(/\/$/, ''); // Remove trailing slash if present
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const subject = 'Password Reset Request';
    const text = `You are receiving this email because you (or someone else) has requested to reset your password.\n\n
        Please click on the following link to reset your password:\n\n${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n\n
        This link will expire in 1 hour.`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
            <p>Please click on the following link to reset your password:</p>
            <p>
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 10px 20px; background-color: #007bff; 
                          color: white; text-decoration: none; border-radius: 5px;">
                    Reset Password
                </a>
            </p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <p><strong>Note:</strong> This link will expire in 1 hour.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
                This is an automated email, please do not reply.
            </p>
        </div>
    `;

    return sendEmail({ to: email, subject, text, html });
}; 