const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all messages (sent and received)
router.get('/', authenticate, async (req, res) => {
  try {
    const { conversation_with } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT 
        m.*,
        u_sender.name as sender_name,
        u_sender.email as sender_email,
        u_receiver.name as receiver_name,
        u_receiver.email as receiver_email
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_receiver ON m.receiver_id = u_receiver.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
    `;
    const params = [userId, userId];

    if (conversation_with) {
      query += ' AND (m.sender_id = ? OR m.receiver_id = ?)';
      params.push(conversation_with, conversation_with);
    }

    query += ' ORDER BY m.created_at DESC';

    const [messages] = await pool.query(query, params);
    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversation with specific user
router.get('/conversation/:user_id', authenticate, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.user_id);
    const userId = req.user.id;

    const [messages] = await pool.query(
      `SELECT 
        m.*,
        u_sender.name as sender_name,
        u_sender.email as sender_email,
        u_receiver.name as receiver_name,
        u_receiver.email as receiver_email
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_receiver ON m.receiver_id = u_receiver.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC`,
      [userId, otherUserId, otherUserId, userId]
    );

    // Mark messages as read
    await pool.query(
      'UPDATE messages SET read = TRUE WHERE receiver_id = ? AND sender_id = ? AND read = FALSE',
      [userId, otherUserId]
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send message
router.post('/', authenticate, [
  body('receiver_id').isInt(),
  body('content').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const senderId = req.user.id;
    const { receiver_id, subject, content } = req.body;

    if (senderId === receiver_id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const [result] = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, subject, content)
       VALUES (?, ?, ?, ?)`,
      [senderId, receiver_id, subject || null, content]
    );

    // Create notification for receiver
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, icon) VALUES (?, ?, ?, ?, ?)',
      [
        receiver_id,
        'New Message',
        `You have a new message from ${req.user.name}`,
        'message',
        '💬'
      ]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.insertId
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark message as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const userId = req.user.id;

    const [result] = await pool.query(
      'UPDATE messages SET read = TRUE WHERE id = ? AND receiver_id = ?',
      [messageId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Get unread messages count
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = FALSE',
      [userId]
    );

    res.json({ unreadCount: result[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Delete message
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const userId = req.user.id;

    const [result] = await pool.query(
      'DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
      [messageId, userId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;

