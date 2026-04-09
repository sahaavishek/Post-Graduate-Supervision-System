const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Helper function to convert MySQL boolean to JavaScript boolean
const toBoolean = (value) => {
  if (value === null || value === undefined) return true; // Default to true
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return Boolean(value);
};

// Get notification preferences for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [preferences] = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId]
    );

    if (preferences.length === 0) {
      // Create default preferences if they don't exist
      await pool.query(
        `INSERT INTO notification_preferences 
         (user_id, email_notifications, meeting_reminders, progress_updates, document_reviews, deadline_reminders)
         VALUES (?, 1, 1, 1, 1, 1)`,
        [userId]
      );

      const [newPreferences] = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = ?',
        [userId]
      );

      return res.json({
        preferences: {
          emailNotifications: toBoolean(newPreferences[0].email_notifications),
          meetingReminders: toBoolean(newPreferences[0].meeting_reminders),
          progressUpdates: toBoolean(newPreferences[0].progress_updates),
          documentReviews: toBoolean(newPreferences[0].document_reviews),
          deadlineReminders: toBoolean(newPreferences[0].deadline_reminders),
        }
      });
    }

    res.json({
      preferences: {
        emailNotifications: toBoolean(preferences[0].email_notifications),
        meetingReminders: toBoolean(preferences[0].meeting_reminders),
        progressUpdates: toBoolean(preferences[0].progress_updates),
        documentReviews: toBoolean(preferences[0].document_reviews),
        deadlineReminders: toBoolean(preferences[0].deadline_reminders),
      }
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    // Log more details about the error
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Table notification_preferences does not exist. Please run the database schema.');
      return res.status(500).json({ error: 'Notification preferences table not found. Please contact administrator.' });
    }
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.put('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      meetingReminders,
      progressUpdates,
      documentReviews,
      deadlineReminders
    } = req.body;

    // Check if preferences exist
    const [existing] = await pool.query(
      'SELECT id FROM notification_preferences WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Create new preferences
      await pool.query(
        `INSERT INTO notification_preferences 
         (user_id, email_notifications, meeting_reminders, progress_updates, document_reviews, deadline_reminders)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          emailNotifications ? 1 : 0,
          meetingReminders ? 1 : 0,
          progressUpdates ? 1 : 0,
          documentReviews ? 1 : 0,
          deadlineReminders ? 1 : 0
        ]
      );
    } else {
      // Update existing preferences
      await pool.query(
        `UPDATE notification_preferences 
         SET email_notifications = ?,
             meeting_reminders = ?,
             progress_updates = ?,
             document_reviews = ?,
             deadline_reminders = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          emailNotifications ? 1 : 0,
          meetingReminders ? 1 : 0,
          progressUpdates ? 1 : 0,
          documentReviews ? 1 : 0,
          deadlineReminders ? 1 : 0,
          userId
        ]
      );
    }

    res.json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

module.exports = router;

