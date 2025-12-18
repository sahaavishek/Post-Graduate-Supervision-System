const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all students
router.get('/', authenticate, async (req, res) => {
  try {
    const { supervisor_id, search, status } = req.query;
    const currentUser = req.user;

    let query = `
      SELECT 
        s.id, s.user_id, s.program, s.start_date, s.expected_completion,
        s.supervisor_id, s.progress, s.enrollment_date,
        u.name, u.email, u.phone, u.avatar, u.status as user_status,
        sup.user_id as supervisor_user_id,
        sup_user.name as supervisor_name,
        sup_user.email as supervisor_email
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN supervisors sup ON s.supervisor_id = sup.id
      LEFT JOIN users sup_user ON sup.user_id = sup_user.id
      WHERE 1=1
    `;
    const params = [];

    // Supervisors can only see their own students
    if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        query += ' AND s.supervisor_id = ?';
        params.push(supervisor[0].id);
      } else {
        return res.json({ students: [] });
      }
    }

    // Students can only see their own data
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length > 0) {
        query += ' AND s.id = ?';
        params.push(student[0].id);
      } else {
        return res.json({ students: [] });
      }
    }

    if (supervisor_id) {
      query += ' AND s.supervisor_id = ?';
      params.push(supervisor_id);
    }

    if (status) {
      query += ' AND u.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR s.program LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY u.name ASC';

    const [students] = await pool.query(query, params);
    res.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get student by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const currentUser = req.user;

    let query = `
      SELECT 
        s.*, u.name, u.email, u.phone, u.avatar, u.status as user_status,
        sup.user_id as supervisor_user_id,
        sup_user.name as supervisor_name,
        sup_user.email as supervisor_email,
        sup.department as supervisor_department
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN supervisors sup ON s.supervisor_id = sup.id
      LEFT JOIN users sup_user ON sup.user_id = sup_user.id
      WHERE s.id = ?
    `;

    const [students] = await pool.query(query, [studentId]);

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = students[0];

    // Check access permissions
    if (currentUser.role === 'student') {
      const [currentStudent] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (currentStudent.length === 0 || currentStudent[0].id !== studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length === 0 || student.supervisor_id !== supervisor[0].id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get milestones
    const [milestones] = await pool.query(
      'SELECT * FROM milestones WHERE student_id = ? ORDER BY created_at ASC',
      [studentId]
    );

    // Get recent progress logs
    const [progressLogs] = await pool.query(
      'SELECT * FROM progress_logs WHERE student_id = ? ORDER BY created_at DESC LIMIT 10',
      [studentId]
    );

    res.json({
      student: {
        ...student,
        milestones,
        recentProgressLogs: progressLogs
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Update student
router.put('/:id', authenticate, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const currentUser = req.user;
    const { program, start_date, expected_completion, supervisor_id, progress } = req.body;

    // Check access
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updates = [];
    const params = [];

    if (program !== undefined) {
      updates.push('program = ?');
      params.push(program);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(start_date);
    }
    if (expected_completion !== undefined) {
      updates.push('expected_completion = ?');
      params.push(expected_completion);
    }
    if (supervisor_id !== undefined && currentUser.role === 'administrator') {
      updates.push('supervisor_id = ?');
      params.push(supervisor_id);
    }
    if (progress !== undefined) {
      updates.push('progress = ?');
      params.push(progress);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(studentId);

    await pool.query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Assign supervisor to student (admin only)
router.post('/:id/assign-supervisor', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { supervisor_id } = req.body;

    if (!supervisor_id) {
      return res.status(400).json({ error: 'Supervisor ID is required' });
    }

    // Check if supervisor has capacity
    const [supervisor] = await pool.query(
      'SELECT capacity, current_students FROM supervisors WHERE id = ?',
      [supervisor_id]
    );

    if (supervisor.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    if (supervisor[0].current_students >= supervisor[0].capacity) {
      return res.status(400).json({ error: 'Supervisor has reached capacity' });
    }

    // Update student
    await pool.query(
      'UPDATE students SET supervisor_id = ? WHERE id = ?',
      [supervisor_id, studentId]
    );

    // Update supervisor student count
    await pool.query(
      'UPDATE supervisors SET current_students = current_students + 1 WHERE id = ?',
      [supervisor_id]
    );

    res.json({ message: 'Supervisor assigned successfully' });
  } catch (error) {
    console.error('Assign supervisor error:', error);
    res.status(500).json({ error: 'Failed to assign supervisor' });
  }
});

module.exports = router;

