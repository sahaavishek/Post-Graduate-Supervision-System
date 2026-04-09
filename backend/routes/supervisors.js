const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');

const router = express.Router();

// Get all supervisors
router.get('/', authenticate, async (req, res) => {
  try {
    const { department, search, status } = req.query;
    const currentUser = req.user;

    let query = `
      SELECT 
        s.id, s.user_id, s.department, s.office, s.office_hours,
        s.research_interests, s.capacity,
        COALESCE(COUNT(DISTINCT ss.student_id), 0) as current_students,
        u.name, u.email, u.phone, u.avatar, u.status as user_status
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN supervisor_student ss ON s.id = ss.supervisor_id
      WHERE 1=1
    `;
    const params = [];

    // Filter by status if provided, otherwise only filter by active status for non-admin users
    if (status) {
      query += ' AND u.status = ?';
      params.push(status);
    } else if (currentUser.role !== 'administrator') {
      query += ' AND u.status = ?';
      params.push('active');
    }

    if (department) {
      query += ' AND s.department = ?';
      params.push(department);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR s.department LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' GROUP BY s.id, s.user_id, s.department, s.office, s.office_hours, s.research_interests, s.capacity, u.name, u.email, u.phone, u.avatar, u.status';
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

    // Calculate current_students dynamically from supervisor_student table (live count)
    const [supervisors] = await pool.query(
      `SELECT 
        s.id, s.user_id, s.department, s.office, s.office_hours,
        s.research_interests, s.capacity,
        COALESCE(COUNT(DISTINCT ss.student_id), 0) as current_students,
        u.name, u.email, u.phone, u.avatar, u.status as user_status
       FROM supervisors s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN supervisor_student ss ON s.id = ss.supervisor_id
       WHERE s.id = ?
       GROUP BY s.id, s.user_id, s.department, s.office, s.office_hours, s.research_interests, s.capacity, u.name, u.email, u.phone, u.avatar, u.status`,
      [supervisorId]
    );

    if (supervisors.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    // Get students (using supervisor_student table for many-to-many relationship)
    const [students] = await pool.query(
      `SELECT 
        st.id, st.user_id, st.program, st.progress,
        u.name, u.email, u.avatar
       FROM students st
       JOIN users u ON st.user_id = u.id
       JOIN supervisor_student ss ON st.id = ss.student_id
       WHERE ss.supervisor_id = ?
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
    const { department, office, office_hours, research_interests, capacity, position, qualifications, biography } = req.body;

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
    if (position !== undefined) {
      updates.push('position = ?');
      params.push(position);
    }
    if (qualifications !== undefined) {
      updates.push('qualifications = ?');
      params.push(qualifications);
    }
    if (biography !== undefined) {
      updates.push('biography = ?');
      params.push(biography);
    }
    if (capacity !== undefined) {
      // Allow both administrators and supervisors to update capacity
      // Supervisors can only update their own capacity (access already checked above in lines 111-119)
      // Administrators can update any supervisor's capacity
      
      // Check if new capacity is less than current students (for both admin and supervisor)
      // Calculate current_students dynamically from supervisor_student table (live count)
      const [studentCountResult] = await pool.query(
        'SELECT COUNT(DISTINCT student_id) as current_students FROM supervisor_student WHERE supervisor_id = ?',
        [supervisorId]
      );
      const currentStudents = studentCountResult[0]?.current_students || 0;
      if (capacity < currentStudents) {
        return res.status(400).json({ 
          error: `Capacity cannot be less than current student count (${currentStudents})` 
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

// Add student to supervisor (supervisor can add students under their supervision)
router.post('/add-student', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Only supervisors can add students
    if (currentUser.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can add students' });
    }

    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    // Get supervisor ID
    const [supervisor] = await pool.query(
      'SELECT id, capacity, current_students FROM supervisors WHERE user_id = ?',
      [currentUser.id]
    );

    if (supervisor.length === 0) {
      return res.status(404).json({ error: 'Supervisor record not found' });
    }

    const supervisorId = supervisor[0].id;
    const capacity = supervisor[0].capacity;
    const currentStudents = supervisor[0].current_students;

    // Check capacity
    if (currentStudents >= capacity) {
      return res.status(400).json({ 
        error: 'You have reached your maximum student capacity. Please contact admin to increase capacity.' 
      });
    }

    // Find student by email or phone
    let studentQuery = `
      SELECT s.id, s.user_id, u.name, u.email, u.phone
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.role = 'student' AND u.status = 'active'
    `;
    const studentParams = [];

    if (email) {
      studentQuery += ' AND u.email = ?';
      studentParams.push(email);
    } else if (phone) {
      studentQuery += ' AND u.phone = ?';
      studentParams.push(phone);
    }

    const [students] = await pool.query(studentQuery, studentParams);

    if (students.length === 0) {
      return res.status(404).json({ 
        error: 'Student not found. The user is not registered in the system.' 
      });
    }

    const student = students[0];

    // Check if student is already under ANY supervisor's supervision
    const [existingRelationships] = await pool.query(
      `SELECT ss.supervisor_id, u.name as supervisor_name
       FROM supervisor_student ss
       JOIN supervisors s ON ss.supervisor_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE ss.student_id = ?`,
      [student.id]
    );

    // Also check students.supervisor_id as backup
    const [studentRecord] = await pool.query(
      'SELECT supervisor_id FROM students WHERE id = ?',
      [student.id]
    );

    // If student has any supervisor relationship, prevent adding
    if (existingRelationships.length > 0) {
      const supervisorName = existingRelationships[0].supervisor_name || 'another supervisor';
      return res.status(400).json({ 
        error: `This student is already under supervision of ${supervisorName}. Please contact an administrator to change the student's supervisor.` 
      });
    }

    // Check if student has supervisor_id set (even if no supervisor_student entry exists)
    if (studentRecord.length > 0 && studentRecord[0].supervisor_id) {
      const [supervisorInfo] = await pool.query(
        `SELECT u.name 
         FROM supervisors s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = ?`,
        [studentRecord[0].supervisor_id]
      );
      const supervisorName = supervisorInfo.length > 0 ? supervisorInfo[0].name : 'another supervisor';
      return res.status(400).json({ 
        error: `This student is already assigned to ${supervisorName}. Please contact an administrator to change the student's supervisor.` 
      });
    }

    // Check if relationship already exists with current supervisor (redundant check but kept for safety)
    const [existingWithCurrent] = await pool.query(
      'SELECT id FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
      [supervisorId, student.id]
    );

    if (existingWithCurrent.length > 0) {
      return res.status(400).json({ 
        error: 'This student is already under your supervision.' 
      });
    }

    // Create relationship in supervisor_student table
    await pool.query(
      'INSERT INTO supervisor_student (supervisor_id, student_id) VALUES (?, ?)',
      [supervisorId, student.id]
    );

    // Update supervisor's current_students count
    await pool.query(
      'UPDATE supervisors SET current_students = current_students + 1 WHERE id = ?',
      [supervisorId]
    );

    res.json({ 
      message: 'Student added successfully',
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone
      }
    });
  } catch (error) {
    console.error('Add student error:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This student is already under your supervision.' });
    }
    
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Remove student from supervisor (supervisor can remove students from their supervision)
router.delete('/remove-student/:student_id', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Only supervisors can remove students
    if (currentUser.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can remove students' });
    }

    const studentId = parseInt(req.params.student_id);

    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    // Get supervisor ID
    const [supervisor] = await pool.query(
      'SELECT id FROM supervisors WHERE user_id = ?',
      [currentUser.id]
    );

    if (supervisor.length === 0) {
      return res.status(404).json({ error: 'Supervisor record not found' });
    }

    const supervisorId = supervisor[0].id;

    // Check if relationship exists
    const [existing] = await pool.query(
      'SELECT id FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
      [supervisorId, studentId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'This student is not under your supervision' });
    }

    // Remove relationship from supervisor_student table
    await pool.query(
      'DELETE FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
      [supervisorId, studentId]
    );

    // If student's direct supervisor_id matches, set it to NULL
    const [student] = await pool.query(
      'SELECT supervisor_id FROM students WHERE id = ?',
      [studentId]
    );

    if (student.length > 0 && student[0].supervisor_id === supervisorId) {
      await pool.query(
        'UPDATE students SET supervisor_id = NULL WHERE id = ?',
        [studentId]
      );
    }

    // Update supervisor's current_students count
    await pool.query(
      'UPDATE supervisors SET current_students = GREATEST(0, current_students - 1) WHERE id = ?',
      [supervisorId]
    );

    res.json({ 
      message: 'Student removed from supervision successfully'
    });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Failed to remove student' });
  }
});

// Create new student account (supervisor can create new student accounts)
router.post('/create-student', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Only supervisors can create students
    if (currentUser.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can create student accounts' });
    }

    const { email, password, name, phone, program } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Get supervisor ID
    const [supervisor] = await pool.query(
      'SELECT id, capacity, current_students FROM supervisors WHERE user_id = ?',
      [currentUser.id]
    );

    if (supervisor.length === 0) {
      return res.status(404).json({ error: 'Supervisor record not found' });
    }

    const supervisorId = supervisor[0].id;
    const capacity = supervisor[0].capacity;
    const currentStudents = supervisor[0].current_students;

    // Check capacity
    if (currentStudents >= capacity) {
      return res.status(400).json({ 
        error: 'You have reached your maximum student capacity. Please contact admin to increase capacity.' 
      });
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert user with email_verified = false and status = 'inactive' (requires email verification)
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password, name, role, phone, status, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, name, 'student', phone || null, 'inactive', false]
      );

      const userId = userResult.insertId;

      // Insert student record
      await connection.query(
        'INSERT INTO students (user_id, program, enrollment_date) VALUES (?, ?, CURDATE())',
        [userId, program || null]
      );

      // Get the student ID
      const [studentResult] = await connection.query(
        'SELECT id FROM students WHERE user_id = ?',
        [userId]
      );

      const studentId = studentResult[0].id;

      // Create relationship in supervisor_student table
      await connection.query(
        'INSERT INTO supervisor_student (supervisor_id, student_id) VALUES (?, ?)',
        [supervisorId, studentId]
      );

      // Update supervisor's current_students count
      await connection.query(
        'UPDATE supervisors SET current_students = current_students + 1 WHERE id = ?',
        [supervisorId]
      );

      // Insert verification token
      await connection.query(
        'INSERT INTO email_verification_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
        [userId, email, verificationToken, expiresAt]
      );

      await connection.commit();
      connection.release();

      // Send verification email
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail account creation if email fails, but log it
      }

      res.json({ 
        message: 'Student account created successfully! A verification email has been sent to the student.',
        emailSent: true,
        student: {
          id: studentId,
          user_id: userId,
          name,
          email,
          phone: phone || null,
          program: program || null
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create student error:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This student is already under your supervision.' });
    }
    
    res.status(500).json({ error: 'Failed to create student account' });
  }
});

module.exports = router;

