const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Create announcement for a specific field (program)
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('field').trim().notEmpty().withMessage('Field/Program is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, field } = req.body;
    const currentUser = req.user;

    // Only supervisors can create announcements
    if (currentUser.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can create announcements' });
    }

    // Get supervisor ID
    const [supervisor] = await pool.query(
      'SELECT id FROM supervisors WHERE user_id = ?',
      [currentUser.id]
    );
    
    if (supervisor.length === 0) {
      return res.status(403).json({ error: 'Supervisor record not found' });
    }

    const supervisorId = supervisor[0].id;

    // Get all students in the specified field/program
    const [students] = await pool.query(
      `SELECT s.id, s.user_id 
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.program = ? AND u.status = 'active'`,
      [field]
    );

    if (students.length === 0) {
      return res.status(404).json({ 
        error: `No active students found in the field: ${field}` 
      });
    }

    // Check if tables exist
    try {
      await pool.query('SELECT 1 FROM announcements LIMIT 1');
      await pool.query('SELECT 1 FROM announcement_recipients LIMIT 1');
    } catch (tableError) {
      if (tableError.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ 
          error: 'Database tables do not exist. Please run the schema.sql file to create the announcements and announcement_recipients tables.',
          details: tableError.message
        });
      }
      throw tableError;
    }

    // Create announcement
    const [announcementResult] = await pool.query(
      `INSERT INTO announcements (supervisor_id, title, message, target_audience)
       VALUES (?, ?, ?, 'specific_students')`,
      [supervisorId, title, message]
    );

    const announcementId = announcementResult.insertId;

    // Create announcement recipients for all students in the field
    for (const student of students) {
      try {
        await pool.query(
          `INSERT INTO announcement_recipients (announcement_id, student_id, \`read\`)
           VALUES (?, ?, FALSE)`,
          [announcementId, student.id]
        );
      } catch (recipientError) {
        console.error(`Error creating recipient for student ${student.id}:`, recipientError);
        // Continue with other students even if one fails
      }
    }

    // Create notifications for all students in the field
    for (const student of students) {
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, icon, link, unread)
           VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
          [
            student.user_id,
            title,
            message,
            'announcement',
            '📢',
            '/student/dashboard'
          ]
        );
      } catch (notificationError) {
        console.error(`Error creating notification for student ${student.id}:`, notificationError);
        // Continue with other students even if one fails
      }
    }

    res.status(201).json({
      message: `Announcement sent successfully to ${students.length} student(s) in ${field}`,
      announcement: {
        id: announcementId,
        title,
        message,
        field,
        recipientsCount: students.length
      }
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    
    // Return more detailed error in development
    const errorResponse = {
      error: 'Failed to create announcement',
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.message;
      errorResponse.sqlError = error.sqlMessage;
      errorResponse.code = error.code;
    }
    
    res.status(500).json(errorResponse);
  }
});

// Get all fields/programs available for the supervisor
router.get('/fields', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;

    // Only supervisors can get fields
    if (currentUser.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can access this endpoint' });
    }

    // Get supervisor ID
    const [supervisor] = await pool.query(
      'SELECT id FROM supervisors WHERE user_id = ?',
      [currentUser.id]
    );
    
    if (supervisor.length === 0) {
      return res.status(403).json({ error: 'Supervisor record not found' });
    }

    const supervisorId = supervisor[0].id;

    // Get all unique fields/programs from students supervised by this supervisor
    // Check both direct supervisor_id and supervisor_student relationship
    const [fields] = await pool.query(
      `SELECT DISTINCT s.program as field, COUNT(DISTINCT s.id) as student_count
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE u.status = 'active' 
         AND s.program IS NOT NULL 
         AND s.program != ''
         AND (
           s.supervisor_id = ?
           OR s.id IN (
             SELECT student_id FROM supervisor_student WHERE supervisor_id = ?
           )
         )
       GROUP BY s.program
       ORDER BY s.program`,
      [supervisorId, supervisorId]
    );

    res.json({
      fields: fields.map(f => ({
        field: f.field,
        studentCount: f.student_count
      }))
    });
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Get announcements for a student
router.get('/student', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;

    // Only students can get their announcements
    if (currentUser.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access this endpoint' });
    }

    // Get student ID
    const [student] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [currentUser.id]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    const studentId = student[0].id;

    // Get all announcements for this student
    let announcements = [];
    try {
      const [results] = await pool.query(
        `SELECT 
           a.id,
           a.title,
           a.message,
           a.created_at,
           ar.read,
           ar.read_at,
           u.name as supervisor_name,
           u.email as supervisor_email
         FROM announcement_recipients ar
         INNER JOIN announcements a ON ar.announcement_id = a.id
         INNER JOIN supervisors sup ON a.supervisor_id = sup.id
         INNER JOIN users u ON sup.user_id = u.id
         WHERE ar.student_id = ?
         ORDER BY a.created_at DESC`,
        [studentId]
      );
      announcements = Array.isArray(results) ? results : [];
    } catch (queryError) {
      console.error('Get announcements query error:', queryError);
      console.error('Error message:', queryError.message);
      console.error('Error code:', queryError.code);
      console.error('SQL State:', queryError.sqlState);
      // If query fails (e.g., tables don't exist), return empty array
      // This allows the frontend to work even if announcements feature isn't fully set up
      announcements = [];
    }

    res.json({
      announcements: announcements.map(ann => ({
        id: ann.id,
        title: ann.title || '',
        message: ann.message || '',
        createdAt: ann.created_at,
        read: ann.read === 1 || ann.read === true || ann.read === 1,
        readAt: ann.read_at || null,
        supervisorName: ann.supervisor_name || 'Unknown',
        supervisorEmail: ann.supervisor_email || ''
      }))
    });
  } catch (error) {
    console.error('Get student announcements error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch announcements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mark announcement as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    const announcementId = parseInt(req.params.id);

    // Only students can mark announcements as read
    if (currentUser.role !== 'student') {
      return res.status(403).json({ error: 'Only students can mark announcements as read' });
    }

    // Get student ID
    const [student] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [currentUser.id]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    const studentId = student[0].id;

    // Update announcement recipient as read
    const [result] = await pool.query(
      `UPDATE announcement_recipients 
       SET read = TRUE, read_at = NOW()
       WHERE announcement_id = ? AND student_id = ?`,
      [announcementId, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found or already read' });
    }

    res.json({ message: 'Announcement marked as read' });
  } catch (error) {
    console.error('Mark announcement as read error:', error);
    res.status(500).json({ error: 'Failed to mark announcement as read' });
  }
});

module.exports = router;

