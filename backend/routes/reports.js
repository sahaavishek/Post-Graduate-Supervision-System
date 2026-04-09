const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Generate student progress report
router.post('/student-progress', authenticate, [
  body('student_id').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id } = req.body;
    const currentUser = req.user;

    // Check access
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== student_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get student data
    const [students] = await pool.query(
      `SELECT 
        s.*, u.name, u.email, u.phone,
        sup_user.name as supervisor_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN supervisors sup ON s.supervisor_id = sup.id
      LEFT JOIN users sup_user ON sup.user_id = sup_user.id
      WHERE s.id = ?`,
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = students[0];

    // Get milestones
    const [milestones] = await pool.query(
      'SELECT * FROM milestones WHERE student_id = ? ORDER BY created_at ASC',
      [student_id]
    );

    // Get meetings count
    const [meetings] = await pool.query(
      'SELECT COUNT(*) as count FROM meetings WHERE student_id = ? AND status = "completed"',
      [student_id]
    );

    // Get documents count
    const [documents] = await pool.query(
      'SELECT COUNT(*) as count FROM documents WHERE student_id = ?',
      [student_id]
    );

    // Get pending reviews
    const [pendingReviews] = await pool.query(
      'SELECT COUNT(*) as count FROM documents WHERE student_id = ? AND status = "pending_review"',
      [student_id]
    );

    // Generate report data
    const reportData = {
      student: {
        name: student.name,
        email: student.email,
        program: student.program,
        startDate: student.start_date,
        expectedCompletion: student.expected_completion,
        progress: student.progress,
        supervisor: student.supervisor_name
      },
      milestones,
      statistics: {
        meetingsCompleted: meetings[0].count,
        documentsSubmitted: documents[0].count,
        pendingReviews: pendingReviews[0].count
      },
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.name
    };

    // Save report to database
    await pool.query(
      'INSERT INTO system_reports (generated_by, report_type, report_data) VALUES (?, ?, ?)',
      [currentUser.id, 'student_progress', JSON.stringify(reportData)]
    );

    res.json({ report: reportData });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Generate system analytics report (admin only)
router.post('/analytics', authenticate, authorize('administrator'), async (req, res) => {
  try {
    // Get total students
    const [totalStudents] = await pool.query('SELECT COUNT(*) as count FROM students');
    
    // Get active supervisors
    const [activeSupervisors] = await pool.query(
      'SELECT COUNT(*) as count FROM supervisors s JOIN users u ON s.user_id = u.id WHERE u.status = "active"'
    );

    // Get pending reviews
    const [pendingReviews] = await pool.query(
      'SELECT COUNT(*) as count FROM documents WHERE status = "pending_review"'
    );

    // Get average progress
    const [avgProgress] = await pool.query(
      'SELECT AVG(progress) as avg FROM students'
    );

    // Get students by program
    const [studentsByProgram] = await pool.query(
      'SELECT program, COUNT(*) as count FROM students GROUP BY program'
    );

    // Get meetings statistics
    const [meetingsStats] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM meetings`
    );

    const reportData = {
      statistics: {
        totalStudents: totalStudents[0].count,
        activeSupervisors: activeSupervisors[0].count,
        pendingReviews: pendingReviews[0].count,
        averageProgress: Math.round(avgProgress[0].avg || 0)
      },
      studentsByProgram,
      meetings: meetingsStats[0],
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name
    };

    // Save report
    await pool.query(
      'INSERT INTO system_reports (generated_by, report_type, report_data) VALUES (?, ?, ?)',
      [req.user.id, 'analytics', JSON.stringify(reportData)]
    );

    res.json({ report: reportData });
  } catch (error) {
    console.error('Generate analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics report' });
  }
});

// Get report history
router.get('/history', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    let query = 'SELECT * FROM system_reports';
    const params = [];

    // Non-admins can only see their own reports
    if (currentUser.role !== 'administrator') {
      query += ' WHERE generated_by = ?';
      params.push(currentUser.id);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [reports] = await pool.query(query, params);
    res.json({ reports });
  } catch (error) {
    console.error('Get report history error:', error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
});

module.exports = router;

