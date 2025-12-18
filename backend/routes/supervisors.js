const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all supervisors
router.get('/', authenticate, async (req, res) => {
  try {
    const { department, search } = req.query;

    let query = `
      SELECT 
        s.id, s.user_id, s.department, s.office, s.office_hours,
        s.research_interests, s.capacity, s.current_students,
        u.name, u.email, u.phone, u.avatar, u.status as user_status
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
      WHERE u.status = 'active'
    `;
    const params = [];

    if (department) {
      query += ' AND s.department = ?';
      params.push(department);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR s.department LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY u.name ASC';

    const [supervisors] = await pool.query(query, params);
    res.json({ supervisors });
  } catch (error) {
    console.error('Get supervisors error:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
});

// Get supervisor by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const supervisorId = parseInt(req.params.id);

    const [supervisors] = await pool.query(
      `SELECT 
        s.*, u.name, u.email, u.phone, u.avatar, u.status as user_status
       FROM supervisors s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [supervisorId]
    );

    if (supervisors.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    // Get students
    const [students] = await pool.query(
      `SELECT 
        st.id, st.user_id, st.program, st.progress,
        u.name, u.email, u.avatar
       FROM students st
       JOIN users u ON st.user_id = u.id
       WHERE st.supervisor_id = ?
       ORDER BY u.name ASC`,
      [supervisorId]
    );

    res.json({
      supervisor: {
        ...supervisors[0],
        students
      }
    });
  } catch (error) {
    console.error('Get supervisor error:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor' });
  }
});

// Update supervisor
router.put('/:id', authenticate, async (req, res) => {
  try {
    const supervisorId = parseInt(req.params.id);
    const currentUser = req.user;
    const { department, office, office_hours, research_interests, capacity } = req.body;

    // Check access
    if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length === 0 || supervisor[0].id !== supervisorId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updates = [];
    const params = [];

    if (department !== undefined) {
      updates.push('department = ?');
      params.push(department);
    }
    if (office !== undefined) {
      updates.push('office = ?');
      params.push(office);
    }
    if (office_hours !== undefined) {
      updates.push('office_hours = ?');
      params.push(office_hours);
    }
    if (research_interests !== undefined) {
      updates.push('research_interests = ?');
      params.push(research_interests);
    }
    if (capacity !== undefined && currentUser.role === 'administrator') {
      // Check if new capacity is less than current students
      const [supervisor] = await pool.query(
        'SELECT current_students FROM supervisors WHERE id = ?',
        [supervisorId]
      );
      if (supervisor.length > 0 && capacity < supervisor[0].current_students) {
        return res.status(400).json({ 
          error: `Capacity cannot be less than current student count (${supervisor[0].current_students})` 
        });
      }
      updates.push('capacity = ?');
      params.push(capacity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(supervisorId);

    await pool.query(
      `UPDATE supervisors SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Supervisor updated successfully' });
  } catch (error) {
    console.error('Update supervisor error:', error);
    res.status(500).json({ error: 'Failed to update supervisor' });
  }
});

module.exports = router;

