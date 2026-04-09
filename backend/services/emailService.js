const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your email address
    pass: process.env.SMTP_PASSWORD, // Your email password or app password
  },
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email service configuration error:', error.message);
    console.log('⚠️  Email sending will fail. Please check your SMTP configuration in .env');
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});

/**
 * Send email verification email
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} token - Verification token
 * @returns {Promise}
 */
async function sendVerificationEmail(to, name, token) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'UTMGradient'}" <${process.env.SMTP_USER}>`,
    to: to,
    subject: 'Verify Your Email Address - UTMGradient',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">UTMGradient</h1>
          <p style="color: white; margin: 10px 0 0 0;">Post Graduate Supervision System</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #667eea; margin-top: 0;">Welcome, ${name}!</h2>
          <p>Thank you for registering with UTMGradient. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This verification link will expire in 24 hours.</p>
          <p style="color: #666; font-size: 14px;">If you didn't create an account with UTMGradient, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} UTMGradient. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to UTMGradient, ${name}!
      
      Thank you for registering. To complete your registration, please verify your email address by visiting the following link:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with UTMGradient, please ignore this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send password reset code email
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} code - 6-digit verification code
 * @returns {Promise}
 */
async function sendPasswordResetEmail(to, name, code) {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'UTMGradient'}" <${process.env.SMTP_USER}>`,
    to: to,
    subject: 'Password Reset Verification Code - UTMGradient',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">UTMGradient</h1>
          <p style="color: white; margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #667eea; margin-top: 0;">Hello, ${name}!</h2>
          <p>We received a request to reset your password for your UTMGradient account. Use the verification code below to proceed:</p>
          <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
            <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</p>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} UTMGradient. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name},
      
      We received a request to reset your password for your UTMGradient account.
      
      Your verification code is: ${code}
      
      This code will expire in 15 minutes.
      
      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

