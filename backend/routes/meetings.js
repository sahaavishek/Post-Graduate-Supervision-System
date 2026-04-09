const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all meetings
router.get('/', authenticate, async (req, res) => {
  try {
    const { student_id, supervisor_id, status, date_from, date_to } = req.query;
    const currentUser = req.user;

    let query = `
      SELECT 
        m.*,
        s.user_id as student_user_id,
        u_student.name as student_name,
        u_student.email as student_email,
        sup.user_id as supervisor_user_id,
        u_supervisor.name as supervisor_name,
        u_supervisor.email as supervisor_email
      FROM meetings m
      JOIN students s ON m.student_id = s.id
      JOIN users u_student ON s.user_id = u_student.id
      JOIN supervisors sup ON m.supervisor_id = sup.id
      JOIN users u_supervisor ON sup.user_id = u_supervisor.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by role
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length > 0) {
        query += ' AND m.student_id = ?';
        params.push(student[0].id);
      } else {
        return res.json({ meetings: [] });
      }
    } else if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        query += ' AND m.supervisor_id = ?';
        params.push(supervisor[0].id);
      } else {
        return res.json({ meetings: [] });
      }
    }

    if (student_id) {
      query += ' AND m.student_id = ?';
      params.push(student_id);
    }

    if (supervisor_id) {
      query += ' AND m.supervisor_id = ?';
      params.push(supervisor_id);
    }

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    if (date_from) {
      query += ' AND m.date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND m.date <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY m.date DESC, m.time DESC';

    const [meetings] = await pool.query(query, params);
    
    // Automatically mark meetings as completed if date/time has passed
    const now = new Date()
    for (const meeting of meetings) {
      if (meeting.status !== 'completed' && meeting.status !== 'cancelled') {
        const meetingDateTime = new Date(`${meeting.date} ${meeting.time}`)
        // Mark as completed if meeting date/time has passed
        if (meetingDateTime < now) {
          await pool.query(
            'UPDATE meetings SET status = ? WHERE id = ?',
            ['completed', meeting.id]
          )
          meeting.status = 'completed'
        }
      }
    }
    
    res.json({ meetings });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meeting by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);

    const [meetings] = await pool.query(
      `SELECT 
        m.*,
        s.user_id as student_user_id,
        u_student.name as student_name,
        u_student.email as student_email,
        sup.user_id as supervisor_user_id,
        u_supervisor.name as supervisor_name,
        u_supervisor.email as supervisor_email
      FROM meetings m
      JOIN students s ON m.student_id = s.id
      JOIN users u_student ON s.user_id = u_student.id
      JOIN supervisors sup ON m.supervisor_id = sup.id
      JOIN users u_supervisor ON sup.user_id = u_supervisor.id
      WHERE m.id = ?`,
      [meetingId]
    );

    if (meetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ meeting: meetings[0] });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Create meeting
router.post('/', authenticate, [
  body('student_id').optional().isInt(),
  body('title').trim().notEmpty(),
  body('date').isISO8601(),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('duration').optional().isInt({ min: 15, max: 480 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const currentUser = req.user;
    const { student_id, supervisor_id, title, date, time, duration, type, location, meeting_link, agenda } = req.body;

    let finalSupervisorId = supervisor_id;
    let finalStudentId = student_id;

    // Determine IDs based on role
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      finalStudentId = student[0].id;

      if (!supervisor_id) {
        // Check if student has a supervisor via students.supervisor_id
        const [studentData] = await pool.query(
          'SELECT supervisor_id FROM students WHERE id = ?',
          [finalStudentId]
        );
        if (studentData.length === 0) {
          return res.status(404).json({ error: 'Student record not found' });
        }
        
        // If student has supervisor_id, use it
        if (studentData[0].supervisor_id) {
          finalSupervisorId = studentData[0].supervisor_id;
        } else {
          // Check supervisor_student table for supervisor relationships
          const [supervisorRelations] = await pool.query(
            'SELECT supervisor_id FROM supervisor_student WHERE student_id = ? LIMIT 1',
            [finalStudentId]
          );
          
          if (supervisorRelations.length === 0) {
            return res.status(400).json({ 
              error: 'You do not have a supervisor assigned yet. Please wait for a supervisor to add you to their supervision before creating meetings.' 
            });
          }
          
          finalSupervisorId = supervisorRelations[0].supervisor_id;
        }
      }
    } else if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length === 0) {
        return res.status(404).json({ error: 'Supervisor record not found' });
      }
      finalSupervisorId = supervisor[0].id;

      if (!student_id) {
        return res.status(400).json({ error: 'Student ID is required' });
      }
    }

    // Set status: 'approved' if supervisor creates, 'pending' if student creates
    const meetingStatus = currentUser.role === 'supervisor' ? 'approved' : 'pending';

    const [result] = await pool.query(
      `INSERT INTO meetings 
       (student_id, supervisor_id, title, date, time, duration, type, location, meeting_link, agenda, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalStudentId,
        finalSupervisorId,
        title,
        date,
        time,
        duration || 60,
        type || 'online',
        location || null,
        meeting_link || null,
        agenda || null,
        meetingStatus
      ]
    );

    // Create notification
    const [student] = await pool.query(
      'SELECT user_id FROM students WHERE id = ?',
      [finalStudentId]
    );
    const [supervisor] = await pool.query(
      'SELECT user_id FROM supervisors WHERE id = ?',
      [finalSupervisorId]
    );

    if (currentUser.role === 'student' && supervisor.length > 0) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, icon, link) VALUES (?, ?, ?, ?, ?, ?)',
        [
          supervisor[0].user_id,
          'New Meeting Request',
          `${currentUser.name} has requested a meeting: ${title}`,
          'meeting',
          '📅',
          '/supervisor/meetings'
        ]
      );
    } else if (currentUser.role === 'supervisor' && student.length > 0) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, icon, link) VALUES (?, ?, ?, ?, ?, ?)',
        [
          student[0].user_id,
          'Meeting Scheduled',
          `${currentUser.name} has scheduled a meeting: ${title}`,
          'meeting',
          '📅',
          '/student/meetings'
        ]
      );
    }

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Update meeting
router.put('/:id', authenticate, async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const currentUser = req.user;
    const { title, date, time, duration, type, location, meeting_link, agenda, status, notes } = req.body;

    // Get meeting
    const [meetings] = await pool.query(
      'SELECT * FROM meetings WHERE id = ?',
      [meetingId]
    );

    if (meetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetings[0];

    // Check access
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== meeting.student_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length === 0 || supervisor[0].id !== meeting.supervisor_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }
    if (time !== undefined) {
      updates.push('time = ?');
      params.push(time);
    }
    if (duration !== undefined) {
      updates.push('duration = ?');
      params.push(duration);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (meeting_link !== undefined) {
      updates.push('meeting_link = ?');
      params.push(meeting_link);
    }
    if (agenda !== undefined) {
      updates.push('agenda = ?');
      params.push(agenda);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(meetingId);

    await pool.query(
      `UPDATE meetings SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Create notification if status changed or meeting was rescheduled
    const wasRescheduled = (date !== undefined && date !== meeting.date) || (time !== undefined && time !== meeting.time);
    
    if (status && status !== meeting.status) {
      const [student] = await pool.query(
        'SELECT user_id FROM students WHERE id = ?',
        [meeting.student_id]
      );
      const [supervisor] = await pool.query(
        'SELECT user_id FROM supervisors WHERE id = ?',
        [meeting.supervisor_id]
      );

      const targetUserId = currentUser.role === 'student' 
        ? supervisor[0]?.user_id 
        : student[0]?.user_id;
      
      const targetRole = currentUser.role === 'student' ? 'supervisor' : 'student'
      const link = `/${targetRole}/meetings`

      if (targetUserId) {
        let statusMessage = `Meeting "${meeting.title}" status changed to ${status}`
        if (status === 'approved') {
          statusMessage = `Your meeting request "${meeting.title}" has been approved`
        } else if (status === 'confirmed') {
          statusMessage = `Meeting "${meeting.title}" has been confirmed`
        } else if (status === 'completed') {
          statusMessage = `Meeting "${meeting.title}" has been marked as completed`
        } else if (status === 'cancelled') {
          statusMessage = `Meeting "${meeting.title}" has been cancelled`
        } else if (status === 'pending' && currentUser.role === 'student') {
          // Student rescheduled - meeting back to pending
          const newDate = date || meeting.date;
          const newTime = time || meeting.time;
          statusMessage = `${currentUser.name} has rescheduled the meeting "${meeting.title}" to ${newDate} at ${newTime}. Please review and approve.`
        }
        
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type, icon, link) VALUES (?, ?, ?, ?, ?, ?)',
          [
            targetUserId,
            status === 'pending' && currentUser.role === 'student' ? 'Meeting Rescheduled' : 'Meeting Status Updated',
            statusMessage,
            'meeting',
            '📅',
            link
          ]
        );
      }
    } else if (wasRescheduled && !status) {
      // Meeting was rescheduled without status change (supervisor rescheduling)
      const [student] = await pool.query(
        'SELECT user_id FROM students WHERE id = ?',
        [meeting.student_id]
      );
      const [supervisor] = await pool.query(
        'SELECT user_id FROM supervisors WHERE id = ?',
        [meeting.supervisor_id]
      );

      const targetUserId = currentUser.role === 'supervisor' 
        ? student[0]?.user_id 
        : supervisor[0]?.user_id;
      
      const targetRole = currentUser.role === 'supervisor' ? 'student' : 'supervisor'
      const link = `/${targetRole}/meetings`

      if (targetUserId) {
        const newDate = date || meeting.date;
        const newTime = time || meeting.time;
        const rescheduleMessage = currentUser.role === 'supervisor'
          ? `${currentUser.name} has rescheduled the meeting "${meeting.title}" to ${newDate} at ${newTime}.`
          : `${currentUser.name} has rescheduled the meeting "${meeting.title}" to ${newDate} at ${newTime}.`;
        
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type, icon, link) VALUES (?, ?, ?, ?, ?, ?)',
          [
            targetUserId,
            'Meeting Rescheduled',
            rescheduleMessage,
            'meeting',
            '📅',
            link
          ]
        );
      }
    }

    res.json({ message: 'Meeting updated successfully' });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete meeting
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const currentUser = req.user;

    // Get meeting
    const [meetings] = await pool.query(
      'SELECT * FROM meetings WHERE id = ?',
      [meetingId]
    );

    if (meetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetings[0];

    // Check access
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== meeting.student_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length === 0 || supervisor[0].id !== meeting.supervisor_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await pool.query('DELETE FROM meetings WHERE id = ?', [meetingId]);

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

module.exports = router;

