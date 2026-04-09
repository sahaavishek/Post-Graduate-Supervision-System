const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Create notification (for supervisors and administrators)
router.post('/', authenticate, [
  body('user_id').isInt().withMessage('User ID must be an integer'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('type').optional().isString(),
  body('icon').optional().isString(),
  body('link').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id, title, message, type, icon, link } = req.body;
    const currentUser = req.user;

    // Only supervisors and administrators can create notifications
    if (currentUser.role !== 'supervisor' && currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Only supervisors and administrators can create notifications' });
    }

    // If supervisor, verify they have access to this student
    if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length === 0) {
        return res.status(403).json({ error: 'Supervisor record not found' });
      }

      // Check if student is assigned to this supervisor
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [user_id]
      );
      if (student.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Check supervisor-student relationship
      const [relationship] = await pool.query(
        'SELECT id FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
        [supervisor[0].id, student[0].id]
      );
      
      // Also check direct supervisor_id in students table
      const [directRelation] = await pool.query(
        'SELECT id FROM students WHERE id = ? AND supervisor_id = ?',
        [student[0].id, supervisor[0].id]
      );

      if (relationship.length === 0 && directRelation.length === 0) {
        return res.status(403).json({ error: 'Access denied. Student is not assigned to you.' });
      }
    }

    // Create notification
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, icon, link, unread)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [user_id, title, message, type || 'reminder', icon || '🔔', link || null]
    );

    res.status(201).json({
      message: 'Notification sent successfully',
      notification: {
        id: result.insertId,
        user_id,
        title,
        message,
        type: type || 'reminder',
        icon: icon || '🔔'
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get all notifications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { unread_only } = req.query;
    const userId = req.user.id;

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unread_only === 'true') {
      query += ' AND unread = TRUE';
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const [notifications] = await pool.query(query, params);

    // Get unread count
    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND unread = TRUE',
      [userId]
    );

    res.json({
      notifications,
      unreadCount: unreadCount[0].count
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    const [result] = await pool.query(
      'UPDATE notifications SET unread = FALSE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET unread = FALSE WHERE user_id = ?',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all notifications
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [userId]
    );

    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
});

// Manual trigger for deadline reminders (admin only, for testing)
router.post('/check-deadlines', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;

    // Only administrators can manually trigger deadline checks
    if (currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Only administrators can trigger deadline checks' });
    }

    const { checkDeadlineReminders, checkOverdueDeadlines } = require('../../services/deadlineReminderService');
    
    const upcomingResult = await checkDeadlineReminders();
    const overdueResult = await checkOverdueDeadlines();

    res.json({
      message: 'Deadline check completed',
      upcoming: upcomingResult,
      overdue: overdueResult
    });
  } catch (error) {
    console.error('Manual deadline check error:', error);
    res.status(500).json({ error: 'Failed to check deadlines' });
  }
});

module.exports = router;

