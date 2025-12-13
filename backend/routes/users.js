const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const { role, status, search } = req.query;
    
    let query = `
      SELECT u.id, u.email, u.name, u.role, u.phone, u.avatar, u.status, u.created_at
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND u.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY u.created_at DESC';

    const [users] = await pool.query(query, params);
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUser = req.user;

    // Users can only view their own profile unless they're admin
    if (currentUser.role !== 'administrator' && currentUser.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [users] = await pool.query(
      'SELECT id, email, name, role, phone, avatar, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUser = req.user;
    const { name, phone, avatar, email } = req.body;

    // Users can only update their own profile unless they're admin
    if (currentUser.role !== 'administrator' && currentUser.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(avatar);
    }
    if (email) {
      // Check if email is already taken by another user
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
      updates.push('email = ?');
      params.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(userId);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user status (admin only)
router.put('/:id/status', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin: Add student (check if user exists in database)
router.post('/admin/add-student', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    // Find user by email or phone
    let userQuery = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.status
      FROM users u
      WHERE u.status = 'active'
    `;
    const userParams = [];

    if (email) {
      userQuery += ' AND u.email = ?';
      userParams.push(email);
    } else if (phone) {
      userQuery += ' AND u.phone = ?';
      userParams.push(phone);
    }

    const [users] = await pool.query(userQuery, userParams);

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User not found. The user is not registered in the system.' 
      });
    }

    const user = users[0];

    // Check if user is already a student
    if (user.role !== 'student') {
      return res.status(400).json({ 
        error: `This user is registered as a ${user.role}, not a student.` 
      });
    }

    // Check if student record already exists
    const [existingStudent] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [user.id]
    );

    if (existingStudent.length > 0) {
      return res.status(400).json({ 
        error: 'This user is already registered as a student.' 
      });
    }

    // Create student record (with default values)
    const [result] = await pool.query(
      'INSERT INTO students (user_id, program, progress) VALUES (?, ?, ?)',
      [user.id, 'PhD Computer Science', 0]
    );

    res.json({ 
      message: 'Student added successfully',
      student: {
        id: result.insertId,
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Admin add student error:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'This user is already registered as a student.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Admin: Add supervisor (check if user exists in database)
router.post('/admin/add-supervisor', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    // Find user by email or phone
    let userQuery = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.status
      FROM users u
      WHERE u.status = 'active'
    `;
    const userParams = [];

    if (email) {
      userQuery += ' AND u.email = ?';
      userParams.push(email);
    } else if (phone) {
      userQuery += ' AND u.phone = ?';
      userParams.push(phone);
    }

    const [users] = await pool.query(userQuery, userParams);

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User not found. The user is not registered in the system.' 
      });
    }

    const user = users[0];

    // Check if user is already a supervisor
    if (user.role !== 'supervisor') {
      return res.status(400).json({ 
        error: `This user is registered as a ${user.role}, not a supervisor.` 
      });
    }

    // Check if supervisor record already exists
    const [existingSupervisor] = await pool.query(
      'SELECT id FROM supervisors WHERE user_id = ?',
      [user.id]
    );

    if (existingSupervisor.length > 0) {
      return res.status(400).json({ 
        error: 'This user is already registered as a supervisor.' 
      });
    }

    // Create supervisor record (with default values)
    const [result] = await pool.query(
      'INSERT INTO supervisors (user_id, department, capacity, current_students) VALUES (?, ?, ?, ?)',
      [user.id, 'Computer Science', 10, 0]
    );

    res.json({ 
      message: 'Supervisor added successfully',
      supervisor: {
        id: result.insertId,
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Admin add supervisor error:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'This user is already registered as a supervisor.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to add supervisor' });
  }
});

// Admin: Create new user account (student, supervisor, or administrator)
router.post('/admin/create-user', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const { email, password, name, role, phone, program, department, supervisor_id } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!['student', 'supervisor', 'administrator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student, supervisor, or administrator.' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert user with email_verified = true and status = 'active' (admin-created accounts are auto-verified)
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password, name, role, phone, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, name, role, phone || null, 'active', true]
      );

      const userId = userResult.insertId;

      // Insert role-specific data
      if (role === 'student') {
        // Get the student ID after insertion
        const [studentResult] = await connection.query(
          'INSERT INTO students (user_id, program, enrollment_date) VALUES (?, ?, CURDATE())',
          [userId, program || null]
        );
        
        const studentId = studentResult.insertId;
        
        // If supervisor_id is provided, create the relationship
        if (supervisor_id) {
          // Verify supervisor exists
          const [supervisorCheck] = await connection.query(
            'SELECT id, capacity, current_students FROM supervisors WHERE id = ?',
            [supervisor_id]
          );
          
          if (supervisorCheck.length > 0) {
            const supervisor = supervisorCheck[0];
            
            // Check capacity
            if (supervisor.current_students >= supervisor.capacity) {
              await connection.rollback();
              connection.release();
              return res.status(400).json({ 
                error: 'Supervisor has reached maximum capacity. Please select another supervisor or increase capacity.' 
              });
            }
            
            // Create relationship in supervisor_student table
            await connection.query(
              'INSERT INTO supervisor_student (supervisor_id, student_id) VALUES (?, ?)',
              [supervisor_id, studentId]
            );
            
            // Update supervisor's current_students count
            await connection.query(
              'UPDATE supervisors SET current_students = current_students + 1 WHERE id = ?',
              [supervisor_id]
            );
          }
        }
      } else if (role === 'supervisor') {
        await connection.query(
          'INSERT INTO supervisors (user_id, department, capacity, current_students) VALUES (?, ?, ?, ?)',
          [userId, department || null, 10, 0]
        );
      } else if (role === 'administrator') {
        await connection.query(
          'INSERT INTO administrators (user_id, department) VALUES (?, ?)',
          [userId, department || null]
        );
      }

      await connection.commit();
      connection.release();

      res.json({ 
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
        user: {
          id: userId,
          name,
          email,
          phone: phone || null,
          role
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Admin create user error:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Admin: Remove user from role (delete from role table but keep in users table)
router.delete('/:id/role', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!role || !['student', 'supervisor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student or supervisor.' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove your own role' });
    }

    // Get user to verify they exist
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    if (user.role !== role) {
      return res.status(400).json({ error: `User is not a ${role}` });
    }

    if (role === 'student') {
      // Get student ID
      const [students] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
      if (students.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }

      const studentId = students[0].id;

      // Get supervisors who have this student before deleting relationships
      const [supervisorRelations] = await pool.query(
        'SELECT supervisor_id FROM supervisor_student WHERE student_id = ?',
        [studentId]
      );

      // Remove from supervisor_student relationships
      await pool.query('DELETE FROM supervisor_student WHERE student_id = ?', [studentId]);

      // Update supervisor current_students count for any supervisors who had this student
      for (const rel of supervisorRelations) {
        await pool.query(
          'UPDATE supervisors SET current_students = GREATEST(0, current_students - 1) WHERE id = ?',
          [rel.supervisor_id]
        );
      }

      // Delete student record
      await pool.query('DELETE FROM students WHERE id = ?', [studentId]);
    } else if (role === 'supervisor') {
      // Get supervisor ID
      const [supervisors] = await pool.query('SELECT id FROM supervisors WHERE user_id = ?', [userId]);
      if (supervisors.length === 0) {
        return res.status(404).json({ error: 'Supervisor record not found' });
      }

      const supervisorId = supervisors[0].id;

      // Remove from supervisor_student relationships
      await pool.query('DELETE FROM supervisor_student WHERE supervisor_id = ?', [supervisorId]);

      // Update students to remove supervisor_id
      await pool.query('UPDATE students SET supervisor_id = NULL WHERE supervisor_id = ?', [supervisorId]);

      // Delete supervisor record
      await pool.query('DELETE FROM supervisors WHERE id = ?', [supervisorId]);
    }

    // Update user role to null or a default role (keeping them in users table)
    // We'll keep the role in users table but they won't have a role-specific record
    // Optionally, you could set role to 'inactive' or keep it as is

    res.json({ message: `User removed from ${role} role successfully` });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ error: 'Failed to remove user from role' });
  }
});

module.exports = router;

