const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get milestones for a student
router.get('/milestones/:student_id', authenticate, async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id);
    const currentUser = req.user;

    // Check access
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (currentUser.role === 'supervisor') {
      const [student] = await pool.query(
        'SELECT supervisor_id FROM students WHERE id = ?',
        [studentId]
      );
      if (student.length > 0) {
        const [supervisor] = await pool.query(
          'SELECT id FROM supervisors WHERE user_id = ?',
          [currentUser.id]
        );
        if (supervisor.length === 0 || student[0].supervisor_id !== supervisor[0].id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
    }

    const [milestones] = await pool.query(
      'SELECT * FROM milestones WHERE student_id = ? ORDER BY created_at ASC',
      [studentId]
    );

    res.json({ milestones });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// Create milestone
router.post('/milestones', authenticate, [
  body('student_id').isInt(),
  body('name').trim().notEmpty(),
  body('due_date').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, name, description, due_date, progress } = req.body;
    const currentUser = req.user;

    // Check access (admin or supervisor only)
    if (currentUser.role === 'student') {
      return res.status(403).json({ error: 'Students cannot create milestones' });
    }

    if (currentUser.role === 'supervisor') {
      const [student] = await pool.query(
        'SELECT supervisor_id FROM students WHERE id = ?',
        [student_id]
      );
      if (student.length > 0) {
        const [supervisor] = await pool.query(
          'SELECT id FROM supervisors WHERE user_id = ?',
          [currentUser.id]
        );
        if (supervisor.length === 0 || student[0].supervisor_id !== supervisor[0].id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
    }

    const [result] = await pool.query(
      `INSERT INTO milestones (student_id, name, description, due_date, progress, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        name,
        description || null,
        due_date || null,
        progress || 0,
        progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'pending'
      ]
    );

    res.status(201).json({
      message: 'Milestone created successfully',
      milestone: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// Update milestone
router.put('/milestones/:id', authenticate, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id);
    const { name, description, progress, status, due_date, completed_date } = req.body;
    const currentUser = req.user;

    // Get milestone
    const [milestones] = await pool.query(
      'SELECT * FROM milestones WHERE id = ?',
      [milestoneId]
    );

    if (milestones.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Check access
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== milestones[0].student_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (progress !== undefined) {
      updates.push('progress = ?');
      params.push(progress);
      // Auto-update status based on progress
      if (progress === 100) {
        updates.push('status = ?, completed_date = CURDATE()');
        params.push('completed');
      } else if (progress > 0) {
        updates.push('status = ?');
        params.push('in-progress');
      }
    }
    if (status !== undefined && currentUser.role !== 'student') {
      updates.push('status = ?');
      params.push(status);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(due_date);
    }
    if (completed_date !== undefined) {
      updates.push('completed_date = ?');
      params.push(completed_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(milestoneId);

    await pool.query(
      `UPDATE milestones SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Update student overall progress
    if (progress !== undefined) {
      const [allMilestones] = await pool.query(
        'SELECT progress FROM milestones WHERE student_id = ?',
        [milestones[0].student_id]
      );
      const avgProgress = allMilestones.length > 0
        ? Math.round(allMilestones.reduce((sum, m) => sum + m.progress, 0) / allMilestones.length)
        : 0;
      
      await pool.query(
        'UPDATE students SET progress = ? WHERE id = ?',
        [avgProgress, milestones[0].student_id]
      );
    }

    res.json({ message: 'Milestone updated successfully' });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// Get progress logs
router.get('/logs/:student_id', authenticate, async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id);
    const currentUser = req.user;

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

    const [logs] = await pool.query(
      'SELECT * FROM progress_logs WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );

    res.json({ logs });
  } catch (error) {
    console.error('Get progress logs error:', error);
    res.status(500).json({ error: 'Failed to fetch progress logs' });
  }
});

// Create progress log
router.post('/logs', authenticate, [
  body('student_id').isInt(),
  body('title').trim().notEmpty(),
  body('category').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, title, category, description } = req.body;
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

    const [result] = await pool.query(
      `INSERT INTO progress_logs (student_id, title, category, description)
       VALUES (?, ?, ?, ?)`,
      [student_id, title, category || null, description || null]
    );

    res.status(201).json({
      message: 'Progress log created successfully',
      log: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create progress log error:', error);
    res.status(500).json({ error: 'Failed to create progress log' });
  }
});

// Get weekly submissions
router.get('/weekly/:student_id', authenticate, async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id);
    const currentUser = req.user;

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

    const [submissions] = await pool.query(
      'SELECT * FROM weekly_submissions WHERE student_id = ? ORDER BY week_number ASC',
      [studentId]
    );

    res.json({ submissions });
  } catch (error) {
    console.error('Get weekly submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly submissions' });
  }
});

// Create/update weekly submission
router.post('/weekly', authenticate, [
  body('student_id').isInt(),
  body('week_number').isInt({ min: 1, max: 52 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, week_number, title, description, due_date, student_comments, file_path, file_name } = req.body;
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

    // Check if submission exists
    const [existing] = await pool.query(
      'SELECT id FROM weekly_submissions WHERE student_id = ? AND week_number = ?',
      [student_id, week_number]
    );

    let submissionId;
    if (existing.length > 0) {
      // Update existing
      await pool.query(
        `UPDATE weekly_submissions 
         SET title = ?, description = ?, student_comments = ?, status = 'submitted', submission_date = CURDATE(),
             file_path = COALESCE(?, file_path), file_name = COALESCE(?, file_name)
         WHERE id = ?`,
        [title || null, description || null, student_comments || null, file_path || null, file_name || null, existing[0].id]
      );
      submissionId = existing[0].id;
    } else {
      // Create new
      const [result] = await pool.query(
        `INSERT INTO weekly_submissions 
         (student_id, week_number, title, description, due_date, student_comments, status, submission_date, file_path, file_name)
         VALUES (?, ?, ?, ?, ?, ?, 'submitted', CURDATE(), ?, ?)`,
        [student_id, week_number, title || null, description || null, due_date || null, student_comments || null, file_path || null, file_name || null]
      );
      submissionId = result.insertId;
    }

    // Calculate and update student progress based on weekly submissions
    // Total weeks = 6 (as per the system design)
    const TOTAL_WEEKS = 6;
    const [submissions] = await pool.query(
      'SELECT COUNT(*) as count FROM weekly_submissions WHERE student_id = ? AND status = "submitted"',
      [student_id]
    );
    
    const submittedWeeks = submissions[0].count;
    const progress = Math.round((submittedWeeks / TOTAL_WEEKS) * 100);
    
    // Update student progress
    await pool.query(
      'UPDATE students SET progress = ? WHERE id = ?',
      [progress, student_id]
    );

    if (existing.length > 0) {
      res.json({ 
        message: 'Weekly submission updated successfully',
        progress: progress
      });
    } else {
      res.status(201).json({
        message: 'Weekly submission created successfully',
        submission: { id: submissionId },
        progress: progress
      });
    }
  } catch (error) {
    console.error('Create weekly submission error:', error);
    res.status(500).json({ error: 'Failed to create weekly submission' });
  }
});

// Delete weekly submission
router.delete('/weekly/:student_id/:week_number', authenticate, async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id);
    const weekNumber = parseInt(req.params.week_number);
    const currentUser = req.user;

    // Check access
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (currentUser.role === 'supervisor') {
      const [student] = await pool.query(
        'SELECT supervisor_id FROM students WHERE id = ?',
        [studentId]
      );
      if (student.length > 0) {
        const [supervisor] = await pool.query(
          'SELECT id FROM supervisors WHERE user_id = ?',
          [currentUser.id]
        );
        if (supervisor.length === 0 || student[0].supervisor_id !== supervisor[0].id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
    }

    // Get the submission to check if it exists
    const [submissions] = await pool.query(
      'SELECT * FROM weekly_submissions WHERE student_id = ? AND week_number = ?',
      [studentId, weekNumber]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Weekly submission not found' });
    }

    // Delete the weekly submission
    await pool.query(
      'DELETE FROM weekly_submissions WHERE student_id = ? AND week_number = ?',
      [studentId, weekNumber]
    );

    // Recalculate and update student progress
    const TOTAL_WEEKS = 6;
    const [submittedCount] = await pool.query(
      'SELECT COUNT(*) as count FROM weekly_submissions WHERE student_id = ? AND status = "submitted"',
      [studentId]
    );
    
    const submittedWeeks = submittedCount[0].count;
    const progress = Math.round((submittedWeeks / TOTAL_WEEKS) * 100);
    
    // Update student progress
    await pool.query(
      'UPDATE students SET progress = ? WHERE id = ?',
      [progress, studentId]
    );

    res.json({ 
      message: 'Weekly submission deleted successfully',
      progress: progress
    });
  } catch (error) {
    console.error('Delete weekly submission error:', error);
    res.status(500).json({ error: 'Failed to delete weekly submission' });
  }
});

// ==================== WEEKLY TASKS MANAGEMENT ====================

// Get all weekly tasks for a student
router.get('/tasks/:student_id', authenticate, async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id);
    const currentUser = req.user;

    // Check access
    if (currentUser.role === 'student') {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        const [student] = await pool.query(
          'SELECT supervisor_id FROM students WHERE id = ?',
          [studentId]
        );
        if (student.length > 0 && student[0].supervisor_id !== supervisor[0].id) {
          const [relationship] = await pool.query(
            'SELECT * FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
            [supervisor[0].id, studentId]
          );
          if (relationship.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      }
    } else if (currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if table exists, if not return empty array
    let tasks = [];
    try {
      const [results] = await pool.query(
        `SELECT wt.*, u.name as created_by_name
         FROM weekly_tasks wt
         LEFT JOIN users u ON wt.created_by = u.id
         WHERE wt.student_id = ? AND wt.is_active = TRUE
         ORDER BY wt.week_number ASC`,
        [studentId]
      );
      tasks = results;
    } catch (dbError) {
      // If table doesn't exist, return empty array
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return res.json({ tasks: [] });
      }
      throw dbError;
    }

    res.json({ tasks });
  } catch (error) {
    console.error('Get weekly tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly tasks' });
  }
});

// Create or update weekly task (supervisor/admin only)
router.post('/tasks', authenticate, [
  body('student_id').isInt(),
  body('week_number').isInt({ min: 1 }),
  body('title').trim().notEmpty(),
  body('description').optional().trim(),
  body('due_date').optional().isISO8601().toDate(),
  body('upload_date').optional().isISO8601().toDate(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, week_number, title, description, due_date, upload_date } = req.body;
    const currentUser = req.user;

    // Only supervisors and admins can create tasks
    if (currentUser.role !== 'supervisor' && currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Only supervisors and administrators can manage weekly tasks' });
    }

    // Check supervisor access
    if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        const [student] = await pool.query(
          'SELECT supervisor_id FROM students WHERE id = ?',
          [student_id]
        );
        if (student.length > 0 && student[0].supervisor_id !== supervisor[0].id) {
          const [relationship] = await pool.query(
            'SELECT * FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
            [supervisor[0].id, student_id]
          );
          if (relationship.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      }
    }

    // Check if table exists, create if not
    try {
      await pool.query('SELECT 1 FROM weekly_tasks LIMIT 1');
    } catch (dbError) {
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        // Table doesn't exist, return error asking to run migration
        return res.status(500).json({ 
          error: 'weekly_tasks table does not exist. Please run: backend/database/create_weekly_tasks_table.sql' 
        });
      }
      throw dbError;
    }

    // Check if task exists
    const [existing] = await pool.query(
      'SELECT id FROM weekly_tasks WHERE student_id = ? AND week_number = ?',
      [student_id, week_number]
    );

    let taskId;
    if (existing.length > 0) {
      // Update existing
      await pool.query(
        `UPDATE weekly_tasks 
         SET title = ?, description = ?, due_date = ?, upload_date = ?, is_active = TRUE, updated_at = NOW()
         WHERE id = ?`,
        [title, description || null, due_date || null, upload_date || null, existing[0].id]
      );
      taskId = existing[0].id;
    } else {
      // Create new
      const [result] = await pool.query(
        `INSERT INTO weekly_tasks 
         (student_id, week_number, title, description, due_date, upload_date, created_by, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [student_id, week_number, title, description || null, due_date || null, upload_date || null, currentUser.id]
      );
      taskId = result.insertId;
    }

    // Get the created/updated task
    const [task] = await pool.query(
      `SELECT wt.*, u.name as created_by_name
       FROM weekly_tasks wt
       LEFT JOIN users u ON wt.created_by = u.id
       WHERE wt.id = ?`,
      [taskId]
    );

    res.status(existing.length > 0 ? 200 : 201).json({
      message: existing.length > 0 ? 'Weekly task updated successfully' : 'Weekly task created successfully',
      task: task[0]
    });
  } catch (error) {
    console.error('Create/update weekly task error:', error);
    res.status(500).json({ error: 'Failed to save weekly task' });
  }
});

// Delete weekly task (supervisor/admin only)
router.delete('/tasks/:student_id/:week_number', authenticate, async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id);
    const weekNumber = parseInt(req.params.week_number);
    const currentUser = req.user;

    // Only supervisors and admins can delete tasks
    if (currentUser.role !== 'supervisor' && currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check supervisor access
    if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        const [student] = await pool.query(
          'SELECT supervisor_id FROM students WHERE id = ?',
          [studentId]
        );
        if (student.length > 0 && student[0].supervisor_id !== supervisor[0].id) {
          const [relationship] = await pool.query(
            'SELECT * FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
            [supervisor[0].id, studentId]
          );
          if (relationship.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      }
    }

    // Soft delete (set is_active to false) instead of hard delete
    await pool.query(
      'UPDATE weekly_tasks SET is_active = FALSE WHERE student_id = ? AND week_number = ?',
      [studentId, weekNumber]
    );

    res.json({ message: 'Weekly task deleted successfully' });
  } catch (error) {
    console.error('Delete weekly task error:', error);
    res.status(500).json({ error: 'Failed to delete weekly task' });
  }
});

module.exports = router;

