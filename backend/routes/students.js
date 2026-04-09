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
        COALESCE(sup.user_id, (
          SELECT ss_sup_inner.user_id 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_user_id,
        COALESCE(sup_user.name, (
          SELECT ss_sup_user_inner.name 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          JOIN users ss_sup_user_inner ON ss_sup_inner.user_id = ss_sup_user_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_name,
        COALESCE(sup_user.email, (
          SELECT ss_sup_user_inner.email 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          JOIN users ss_sup_user_inner ON ss_sup_inner.user_id = ss_sup_user_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_email,
        COALESCE(sup.department, (
          SELECT ss_sup_inner.department 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_department,
        COALESCE(sup_user.avatar, (
          SELECT ss_sup_user_inner.avatar 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          JOIN users ss_sup_user_inner ON ss_sup_inner.user_id = ss_sup_user_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_avatar,
        COALESCE(sup_user.phone, (
          SELECT ss_sup_user_inner.phone 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          JOIN users ss_sup_user_inner ON ss_sup_inner.user_id = ss_sup_user_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_phone,
        COALESCE(sup.position, (
          SELECT ss_sup_inner.position 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_position,
        COALESCE(sup.office, (
          SELECT ss_sup_inner.office 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_office,
        COALESCE(sup.research_interests, (
          SELECT ss_sup_inner.research_interests 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_research_interests,
        COALESCE(sup.biography, (
          SELECT ss_sup_inner.biography 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_biography
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN supervisors sup ON s.supervisor_id = sup.id
      LEFT JOIN users sup_user ON sup.user_id = sup_user.id
      WHERE 1=1
    `;
    const params = [];

    // Supervisors can only see their own students (using supervisor_student table)
    if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        // Use supervisor_student table for many-to-many relationship
        query += ` AND s.id IN (SELECT student_id FROM supervisor_student WHERE supervisor_id = ?)`;
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
    // Set cache headers to prevent caching and ensure real-time data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
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
        COALESCE(sup.user_id, (
          SELECT ss_sup_inner.user_id 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_user_id,
        COALESCE(sup_user.name, (
          SELECT ss_sup_user_inner.name 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          JOIN users ss_sup_user_inner ON ss_sup_inner.user_id = ss_sup_user_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_name,
        COALESCE(sup_user.email, (
          SELECT ss_sup_user_inner.email 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          JOIN users ss_sup_user_inner ON ss_sup_inner.user_id = ss_sup_user_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_email,
        COALESCE(sup.department, (
          SELECT ss_sup_inner.department 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_department,
        COALESCE(sup_user.avatar, (
          SELECT ss_sup_user_inner.avatar 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          JOIN users ss_sup_user_inner ON ss_sup_inner.user_id = ss_sup_user_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_avatar,
        COALESCE(sup_user.phone, (
          SELECT ss_sup_user_inner.phone 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          JOIN users ss_sup_user_inner ON ss_sup_inner.user_id = ss_sup_user_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_phone,
        COALESCE(sup.position, (
          SELECT ss_sup_inner.position 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_position,
        COALESCE(sup.office, (
          SELECT ss_sup_inner.office 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_office,
        COALESCE(sup.research_interests, (
          SELECT ss_sup_inner.research_interests 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_research_interests,
        COALESCE(sup.biography, (
          SELECT ss_sup_inner.biography 
          FROM supervisor_student ss_inner
          JOIN supervisors ss_sup_inner ON ss_inner.supervisor_id = ss_sup_inner.id
          WHERE ss_inner.student_id = s.id
          LIMIT 1
        )) as supervisor_biography
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN supervisors sup ON s.supervisor_id = sup.id
      LEFT JOIN users sup_user ON sup.user_id = sup_user.id
      WHERE s.id = ?
      LIMIT 1
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
      if (supervisor.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Check if student is in supervisor_student relationship table
      const [relationship] = await pool.query(
        'SELECT id FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
        [supervisor[0].id, studentId]
      );
      if (relationship.length === 0) {
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
    const { program, start_date, expected_completion, supervisor_id, progress, research_area } = req.body;

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
    if (research_area !== undefined) {
      updates.push('research_area = ?');
      params.push(research_area);
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

    // Get current supervisor if exists
    const [currentStudent] = await pool.query(
      'SELECT supervisor_id FROM students WHERE id = ?',
      [studentId]
    );

    if (currentStudent.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const oldSupervisorId = currentStudent[0].supervisor_id;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get ALL current supervisors for this student from supervisor_student table
      // Do this INSIDE the transaction to ensure we get the latest data
      const [allSupervisorRelations] = await connection.query(
        'SELECT supervisor_id FROM supervisor_student WHERE student_id = ?',
        [studentId]
      );

      // Remove ALL entries from supervisor_student table for this student
      // This ensures no old supervisor relationships remain
      const [deleteResult] = await connection.query(
        'DELETE FROM supervisor_student WHERE student_id = ?',
        [studentId]
      );

      // Verify deletion - log for debugging
      console.log(`Deleted ${deleteResult.affectedRows} supervisor relationships for student ${studentId}`);

      // Decrease student count for ALL old supervisors
      const affectedSupervisorIds = new Set();
      if (oldSupervisorId) {
        affectedSupervisorIds.add(oldSupervisorId);
      }
      allSupervisorRelations.forEach((rel) => {
        affectedSupervisorIds.add(rel.supervisor_id);
      });

      // Update each affected supervisor's student count
      for (const supId of affectedSupervisorIds) {
        await connection.query(
          'UPDATE supervisors SET current_students = GREATEST(0, current_students - 1) WHERE id = ?',
          [supId]
        );
      }

      // Update student's supervisor_id
      await connection.query(
        'UPDATE students SET supervisor_id = ? WHERE id = ?',
        [supervisor_id, studentId]
      );

      // Add new relationship to supervisor_student table
      await connection.query(
        'INSERT INTO supervisor_student (supervisor_id, student_id) VALUES (?, ?)',
        [supervisor_id, studentId]
      );

      // Update new supervisor's student count
      await connection.query(
        'UPDATE supervisors SET current_students = current_students + 1 WHERE id = ?',
        [supervisor_id]
      );

      await connection.commit();
      connection.release();

      res.json({ message: 'Supervisor assigned successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Assign supervisor error:', error);
    res.status(500).json({ error: 'Failed to assign supervisor' });
  }
});

// Remove supervisor from student (admin only)
router.post('/:id/remove-supervisor', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    // Check if student exists
    const [student] = await pool.query(
      'SELECT supervisor_id FROM students WHERE id = ?',
      [studentId]
    );

    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get ALL current supervisors for this student from supervisor_student table
    const [allSupervisorRelations] = await pool.query(
      'SELECT supervisor_id FROM supervisor_student WHERE student_id = ?',
      [studentId]
    );

    const supervisorId = student[0].supervisor_id;
    const hasSupervisorInTable = supervisorId !== null;
    const hasSupervisorRelations = allSupervisorRelations.length > 0;

    // Check if student has any supervisor (either in students.supervisor_id or supervisor_student table)
    if (!hasSupervisorInTable && !hasSupervisorRelations) {
      return res.status(400).json({ error: 'Student does not have a supervisor assigned' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Remove ALL entries from supervisor_student table for this student
      // (in case there are multiple supervisor relationships)
      const [deleteResult] = await connection.query(
        'DELETE FROM supervisor_student WHERE student_id = ?',
        [studentId]
      );

      // Update student's supervisor_id to NULL
      await connection.query(
        'UPDATE students SET supervisor_id = NULL WHERE id = ?',
        [studentId]
      );

      // Decrease student count for all affected supervisors
      // First, get unique supervisor IDs that were removed
      const affectedSupervisorIds = new Set();
      if (supervisorId) {
        affectedSupervisorIds.add(supervisorId);
      }
      allSupervisorRelations.forEach((rel) => {
        affectedSupervisorIds.add(rel.supervisor_id);
      });

      // Update each affected supervisor's student count
      for (const supId of affectedSupervisorIds) {
        await connection.query(
          'UPDATE supervisors SET current_students = GREATEST(0, current_students - 1) WHERE id = ?',
          [supId]
        );
      }

      await connection.commit();
      connection.release();

      res.json({ message: 'Supervisor removed successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Remove supervisor error:', error);
    res.status(500).json({ error: 'Failed to remove supervisor' });
  }
});

// Change supervisor for student (admin only) - removes old and assigns new
router.post('/:id/change-supervisor', authenticate, authorize('administrator'), async (req, res) => {
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

    // Get current student and supervisor
    const [student] = await pool.query(
      'SELECT supervisor_id FROM students WHERE id = ?',
      [studentId]
    );

    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const oldSupervisorId = student[0].supervisor_id;

    // If trying to assign the same supervisor
    if (oldSupervisorId === supervisor_id) {
      return res.status(400).json({ error: 'Student already has this supervisor assigned' });
    }

    // Check capacity (only if assigning a different supervisor)
    if (supervisor[0].current_students >= supervisor[0].capacity) {
      return res.status(400).json({ error: 'Supervisor has reached capacity' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get ALL current supervisors for this student from supervisor_student table
      // Do this INSIDE the transaction to ensure we get the latest data
      const [allSupervisorRelations] = await connection.query(
        'SELECT supervisor_id FROM supervisor_student WHERE student_id = ?',
        [studentId]
      );

      // Remove ALL entries from supervisor_student table for this student
      // This ensures no old supervisor relationships remain
      const [deleteResult] = await connection.query(
        'DELETE FROM supervisor_student WHERE student_id = ?',
        [studentId]
      );

      // Verify deletion - log for debugging
      console.log(`Deleted ${deleteResult.affectedRows} supervisor relationships for student ${studentId}`);

      // Decrease student count for ALL old supervisors
      const affectedSupervisorIds = new Set();
      if (oldSupervisorId) {
        affectedSupervisorIds.add(oldSupervisorId);
      }
      allSupervisorRelations.forEach((rel) => {
        affectedSupervisorIds.add(rel.supervisor_id);
      });

      // Update each affected supervisor's student count
      for (const supId of affectedSupervisorIds) {
        await connection.query(
          'UPDATE supervisors SET current_students = GREATEST(0, current_students - 1) WHERE id = ?',
          [supId]
        );
      }

      // Update student's supervisor_id
      await connection.query(
        'UPDATE students SET supervisor_id = ? WHERE id = ?',
        [supervisor_id, studentId]
      );

      // Add new relationship to supervisor_student table
      await connection.query(
        'INSERT INTO supervisor_student (supervisor_id, student_id) VALUES (?, ?)',
        [supervisor_id, studentId]
      );

      // Update new supervisor's student count
      await connection.query(
        'UPDATE supervisors SET current_students = current_students + 1 WHERE id = ?',
        [supervisor_id]
      );

      // Verify that only the new supervisor relationship exists
      const [verifyRelations] = await connection.query(
        'SELECT supervisor_id FROM supervisor_student WHERE student_id = ?',
        [studentId]
      );

      if (verifyRelations.length > 1) {
        console.warn(`Warning: Student ${studentId} still has multiple supervisor relationships after change`);
        // Clean up any duplicates
        await connection.query(
          'DELETE FROM supervisor_student WHERE student_id = ? AND supervisor_id != ?',
          [studentId, supervisor_id]
        );
      }

      await connection.commit();
      connection.release();

      res.json({ message: 'Supervisor changed successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Change supervisor error:', error);
    res.status(500).json({ error: 'Failed to change supervisor' });
  }
});

// Cleanup orphaned supervisor-student relationships (admin only)
// This fixes any data inconsistencies where students have multiple supervisors
router.post('/cleanup-relationships', authenticate, authorize('administrator'), async (req, res) => {
  try {
    // Find students with multiple supervisor relationships
    const [duplicates] = await pool.query(`
      SELECT student_id, COUNT(*) as count, GROUP_CONCAT(supervisor_id) as supervisor_ids
      FROM supervisor_student
      GROUP BY student_id
      HAVING count > 1
    `);

    let fixed = 0;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const dup of duplicates) {
        // Get the student's current supervisor_id from students table
        const [student] = await connection.query(
          'SELECT supervisor_id FROM students WHERE id = ?',
          [dup.student_id]
        );

        const correctSupervisorId = student[0]?.supervisor_id;

        if (correctSupervisorId) {
          // Remove all relationships except the correct one
          await connection.query(
            'DELETE FROM supervisor_student WHERE student_id = ? AND supervisor_id != ?',
            [dup.student_id, correctSupervisorId]
          );
          fixed++;
        } else {
          // If no supervisor_id in students table, remove all relationships
          await connection.query(
            'DELETE FROM supervisor_student WHERE student_id = ?',
            [dup.student_id]
          );
          fixed++;
        }
      }

      await connection.commit();
      connection.release();

      res.json({ 
        message: 'Cleanup completed successfully',
        fixed: fixed,
        duplicatesFound: duplicates.length
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Cleanup relationships error:', error);
    res.status(500).json({ error: 'Failed to cleanup relationships' });
  }
});

module.exports = router;

