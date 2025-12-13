const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['student', 'supervisor', 'administrator'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, phone, program, department } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert user with email_verified = false and status = 'inactive'
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password, name, role, phone, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, name, role, phone || null, 'inactive', false]
      );

      const userId = userResult.insertId;

      // Insert role-specific data
      if (role === 'student') {
        await connection.query(
          'INSERT INTO students (user_id, program, enrollment_date) VALUES (?, ?, CURDATE())',
          [userId, program || null]
        );
      } else if (role === 'supervisor') {
        await connection.query(
          'INSERT INTO supervisors (user_id, department) VALUES (?, ?)',
          [userId, department || null]
        );
      } else if (role === 'administrator') {
        await connection.query(
          'INSERT INTO administrators (user_id, department) VALUES (?, ?)',
          [userId, department || null]
        );
      }

      // Insert verification token
      await connection.query(
        'INSERT INTO email_verification_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
        [userId, email, verificationToken, expiresAt]
      );

      await connection.commit();
      connection.release();

      // Send verification email
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails, but log it
      }

      res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        emailSent: true,
        // In development, return token for testing (remove in production)
        ...(process.env.NODE_ENV === 'development' && { verificationToken })
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return specific validation error
      const firstError = errors.array()[0];
      if (firstError.param === 'email') {
        return res.status(400).json({ error: 'Invalid email format' });
      } else if (firstError.param === 'password') {
        return res.status(400).json({ error: 'Password is required' });
      }
      return res.status(400).json({ error: firstError.msg || 'Validation error' });
    }

    const { email, password, role } = req.body;

    // Get user
    const [users] = await pool.query(
      'SELECT id, email, password, role, name, status FROM users WHERE email = ?',
      [email]
    );

    // Check if email exists
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email not found' });
    }

    const user = users[0];

    // Check role if provided
    if (role && user.role !== role) {
      return res.status(401).json({ error: 'Role incorrect' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Password incorrect' });
    }

    // Check if email is verified
    const [userDetails] = await pool.query(
      'SELECT email_verified, status FROM users WHERE id = ?',
      [user.id]
    );

    if (userDetails.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!userDetails[0].email_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in. Check your inbox for the verification email.',
        requiresVerification: true
      });
    }

    // Check status
    if (userDetails[0].status !== 'active') {
      return res.status(403).json({ 
        error: 'Your account has been deactivated. Please contact your administrator.' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Get additional user data based on role
    let additionalData = {};
    if (user.role === 'student') {
      const [students] = await pool.query(
        `SELECT s.*, u.name, u.email, u.phone 
         FROM students s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.user_id = ?`,
        [user.id]
      );
      if (students.length > 0) {
        additionalData = students[0];
      }
    } else if (user.role === 'supervisor') {
      const [supervisors] = await pool.query(
        `SELECT s.*, u.name, u.email, u.phone 
         FROM supervisors s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.user_id = ?`,
        [user.id]
      );
      if (supervisors.length > 0) {
        additionalData = supervisors[0];
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = '';
    if (role === 'student') {
      query = `
        SELECT s.*, u.name, u.email, u.phone, u.avatar, u.status, u.id as user_id,
               sup.id as supervisor_id, sup_user.name as supervisor_name, sup_user.email as supervisor_email
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN supervisors sup ON s.supervisor_id = sup.id
        LEFT JOIN users sup_user ON sup.user_id = sup_user.id
        WHERE s.user_id = ?
      `;
    } else if (role === 'supervisor') {
      query = `
        SELECT s.*, u.name, u.email, u.phone, u.avatar, u.status
        FROM supervisors s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
      `;
    } else {
      query = `
        SELECT a.*, u.name, u.email, u.phone, u.avatar, u.status
        FROM administrators a
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ?
      `;
    }

    const [results] = await pool.query(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'User data not found' });
    }

    res.json({ user: results[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current password
    const [users] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request password reset (send code to email)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const { email } = req.body;

    // Check if user exists
    const [users] = await pool.query(
      'SELECT id, email, name FROM users WHERE email = ? AND status = ?',
      [email, 'active']
    );

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: 'If the email exists, a verification code has been sent.' 
      });
    }

    const user = users[0];

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Delete any existing unused codes for this user
    await pool.query(
      'DELETE FROM password_reset_codes WHERE user_id = ? AND used = FALSE',
      [user.id]
    );

    // Insert new reset code
    await pool.query(
      'INSERT INTO password_reset_codes (user_id, email, code, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, user.email, code, expiresAt]
    );

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, code);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Still return success message for security (don't reveal if email failed)
    }

    res.json({ 
      message: 'If the email exists, a verification code has been sent to your email address.',
      // In development, return code for testing (remove in production)
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify reset code
router.post('/verify-reset-code', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email or code format' });
    }

    const { email, code } = req.body;

    // Find valid reset code
    const [codes] = await pool.query(
      `SELECT prc.*, u.id as user_id 
       FROM password_reset_codes prc
       JOIN users u ON prc.user_id = u.id
       WHERE prc.email = ? AND prc.code = ? AND prc.used = FALSE AND prc.expires_at > NOW()`,
      [email, code]
    );

    if (codes.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    res.json({ 
      message: 'Verification code is valid',
      verified: true
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Reset password with code
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input. Please check your email, code, and password.' });
    }

    const { email, code, newPassword } = req.body;

    // Find valid reset code
    const [codes] = await pool.query(
      `SELECT prc.*, u.id as user_id 
       FROM password_reset_codes prc
       JOIN users u ON prc.user_id = u.id
       WHERE prc.email = ? AND prc.code = ? AND prc.used = FALSE AND prc.expires_at > NOW()`,
      [email, code]
    );

    if (codes.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const resetCode = codes[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, resetCode.user_id]
    );

    // Mark code as used
    await pool.query(
      'UPDATE password_reset_codes SET used = TRUE WHERE id = ?',
      [resetCode.id]
    );

    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify email with token
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find valid verification token
    const [tokens] = await pool.query(
      `SELECT evt.*, u.id as user_id, u.email_verified
       FROM email_verification_tokens evt
       JOIN users u ON evt.user_id = u.id
       WHERE evt.token = ? AND evt.used = FALSE AND evt.expires_at > NOW()`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const verificationToken = tokens[0];

    // Check if already verified
    if (verificationToken.email_verified) {
      return res.status(400).json({ error: 'Email has already been verified' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Mark email as verified and activate account
      await connection.query(
        'UPDATE users SET email_verified = TRUE, status = ? WHERE id = ?',
        ['active', verificationToken.user_id]
      );

      // Mark token as used
      await connection.query(
        'UPDATE email_verification_tokens SET used = TRUE WHERE id = ?',
        [verificationToken.id]
      );

      await connection.commit();
      connection.release();

      res.json({ 
        message: 'Email verified successfully! Your account has been activated. You can now log in.',
        verified: true
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const { email } = req.body;

    // Check if user exists
    const [users] = await pool.query(
      'SELECT id, email, name, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: 'If the email exists and is not verified, a verification email has been sent.' 
      });
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email has already been verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete old unused tokens for this user
    await pool.query(
      'DELETE FROM email_verification_tokens WHERE user_id = ? AND used = FALSE',
      [user.id]
    );

    // Insert new verification token
    await pool.query(
      'INSERT INTO email_verification_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, user.email, verificationToken, expiresAt]
    );

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({ 
      message: 'If the email exists and is not verified, a verification email has been sent.',
      // In development, return token for testing (remove in production)
      ...(process.env.NODE_ENV === 'development' && { verificationToken })
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

module.exports = router;

