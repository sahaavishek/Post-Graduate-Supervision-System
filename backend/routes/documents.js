const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, PNG are allowed.'));
    }
  }
});

// Get all documents
router.get('/', authenticate, async (req, res) => {
  try {
    const { student_id, supervisor_id, type, status, week_number } = req.query;
    const currentUser = req.user;

    let query = `
      SELECT 
        d.*,
        s.user_id as student_user_id,
        u_student.name as student_name,
        sup.user_id as supervisor_user_id,
        u_supervisor.name as supervisor_name,
        u_uploader.name as uploaded_by_name
      FROM documents d
      LEFT JOIN students s ON d.student_id = s.id
      LEFT JOIN users u_student ON s.user_id = u_student.id
      LEFT JOIN supervisors sup ON d.supervisor_id = sup.id
      LEFT JOIN users u_supervisor ON sup.user_id = u_supervisor.id
      JOIN users u_uploader ON d.uploaded_by = u_uploader.id
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
        query += ' AND (d.student_id = ? OR d.supervisor_id IN (SELECT id FROM supervisors WHERE user_id IN (SELECT supervisor_id FROM students WHERE id = ?)))';
        params.push(student[0].id, student[0].id);
      } else {
        return res.json({ documents: [] });
      }
    } else if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        // Include documents where:
        // 1. supervisor_id matches (documents uploaded by this supervisor)
        // 2. student_id matches students with direct supervisor_id relationship
        // 3. student_id matches students from supervisor_student relationship table (many-to-many)
        query += ` AND (
          d.supervisor_id = ? OR 
          d.student_id IN (
            SELECT id FROM students WHERE supervisor_id = ?
            UNION
            SELECT student_id FROM supervisor_student WHERE supervisor_id = ?
          )
        )`;
        params.push(supervisor[0].id, supervisor[0].id, supervisor[0].id);
      } else {
        return res.json({ documents: [] });
      }
    }

    if (student_id) {
      query += ' AND d.student_id = ?';
      params.push(student_id);
    }

    if (supervisor_id) {
      query += ' AND d.supervisor_id = ?';
      params.push(supervisor_id);
    }

    if (type) {
      query += ' AND d.type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    if (week_number) {
      query += ' AND d.week_number = ?';
      params.push(week_number);
    }

    query += ' ORDER BY d.created_at DESC';

    const [documents] = await pool.query(query, params);
    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    const [documents] = await pool.query(
      `SELECT 
        d.*,
        s.user_id as student_user_id,
        u_student.name as student_name,
        sup.user_id as supervisor_user_id,
        u_supervisor.name as supervisor_name,
        u_uploader.name as uploaded_by_name
      FROM documents d
      LEFT JOIN students s ON d.student_id = s.id
      LEFT JOIN users u_student ON s.user_id = u_student.id
      LEFT JOIN supervisors sup ON d.supervisor_id = sup.id
      LEFT JOIN users u_supervisor ON sup.user_id = u_supervisor.id
      JOIN users u_uploader ON d.uploaded_by = u_uploader.id
      WHERE d.id = ?`,
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get reviews if any
    const [reviews] = await pool.query(
      `SELECT dr.*, u.name as reviewer_name
       FROM document_reviews dr
       JOIN users u ON dr.reviewer_id = u.id
       WHERE dr.document_id = ?
       ORDER BY dr.created_at DESC`,
      [documentId]
    );

    res.json({
      document: {
        ...documents[0],
        reviews
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Upload document
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const currentUser = req.user;
    const { title, description, student_id, supervisor_id, type, week_number } = req.body;

    let finalStudentId = student_id ? parseInt(student_id) : null;
    let finalSupervisorId = supervisor_id ? parseInt(supervisor_id) : null;

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
    } else if (currentUser.role === 'supervisor') {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length === 0) {
        return res.status(404).json({ error: 'Supervisor record not found' });
      }
      finalSupervisorId = supervisor[0].id;
    }

    const [result] = await pool.query(
      `INSERT INTO documents 
       (student_id, supervisor_id, title, description, file_path, file_name, file_size, file_type, week_number, type, uploaded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        finalStudentId,
        finalSupervisorId,
        title || req.file.originalname,
        description || null,
        req.file.path,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        week_number || null,
        type || 'submission',
        currentUser.id
      ]
    );

    // If student uploaded a submission with week_number, create/update weekly submission and update progress
    if (currentUser.role === 'student' && finalStudentId && week_number && type === 'submission') {
      const weekNum = parseInt(week_number);
      
      // Check if weekly submission exists
      const [existing] = await pool.query(
        'SELECT id FROM weekly_submissions WHERE student_id = ? AND week_number = ?',
        [finalStudentId, weekNum]
      );

      if (existing.length > 0) {
        // Update existing weekly submission
        await pool.query(
          `UPDATE weekly_submissions 
           SET file_path = ?, file_name = ?, status = 'submitted', submission_date = CURDATE()
           WHERE id = ?`,
          [req.file.path, req.file.originalname, existing[0].id]
        );
      } else {
        // Create new weekly submission
        await pool.query(
          `INSERT INTO weekly_submissions 
           (student_id, week_number, title, file_path, file_name, status, submission_date)
           VALUES (?, ?, ?, ?, ?, 'submitted', CURDATE())`,
          [finalStudentId, weekNum, title || req.file.originalname, req.file.path, req.file.originalname]
        );
      }

      // Calculate and update student progress based on weekly submissions
      // Total weeks = 6 (as per the system design)
      const TOTAL_WEEKS = 6;
      const [submissions] = await pool.query(
        'SELECT COUNT(*) as count FROM weekly_submissions WHERE student_id = ? AND status = "submitted"',
        [finalStudentId]
      );
      
      const submittedWeeks = submissions[0].count;
      const progress = Math.round((submittedWeeks / TOTAL_WEEKS) * 100);
      
      // Update student progress
      await pool.query(
        'UPDATE students SET progress = ? WHERE id = ?',
        [progress, finalStudentId]
      );
    }

    // Create notification for supervisor if student uploaded
    if (currentUser.role === 'student' && finalStudentId) {
      // Check both direct supervisor_id and supervisor_student relationship
      const [student] = await pool.query(
        'SELECT supervisor_id FROM students WHERE id = ?',
        [finalStudentId]
      );
      
      let supervisorId = null;
      if (student.length > 0 && student[0].supervisor_id) {
        supervisorId = student[0].supervisor_id;
      } else {
        // Check supervisor_student relationship table
        const [relationship] = await pool.query(
          'SELECT supervisor_id FROM supervisor_student WHERE student_id = ? LIMIT 1',
          [finalStudentId]
        );
        if (relationship.length > 0) {
          supervisorId = relationship[0].supervisor_id;
        }
      }
      
      if (supervisorId) {
        const [supervisor] = await pool.query(
          'SELECT user_id FROM supervisors WHERE id = ?',
          [supervisorId]
        );
        if (supervisor.length > 0) {
          // Create a more descriptive notification message
          let notificationMessage = `${currentUser.name} has submitted a new document`;
          if (week_number && type === 'submission') {
            notificationMessage = `${currentUser.name} has submitted Week ${week_number} submission: ${title || req.file.originalname}`;
          } else {
            notificationMessage = `${currentUser.name} has submitted a new document: ${title || req.file.originalname}`;
          }
          
          await pool.query(
            'INSERT INTO notifications (user_id, title, message, type, icon, link) VALUES (?, ?, ?, ?, ?, ?)',
            [
              supervisor[0].user_id,
              'New Document Submitted',
              notificationMessage,
              'submission', // Use 'submission' type to differentiate from other documents
              '📄',
              '/supervisor/dashboard' // Link to dashboard where pending reviews are visible
            ]
          );
        }
      }
    }

    // Create notification for student if supervisor uploaded a resource
    if (currentUser.role === 'supervisor' && finalSupervisorId && type === 'resource' && finalStudentId) {
      const [student] = await pool.query(
        'SELECT user_id FROM students WHERE id = ?',
        [finalStudentId]
      );
      if (student.length > 0) {
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type, icon, link) VALUES (?, ?, ?, ?, ?, ?)',
          [
            student[0].user_id,
            'New Resource Available',
            `${currentUser.name} has shared a new resource: ${title || req.file.originalname}`,
            'document',
            '📄',
            '/student/documents'
          ]
        );
      }
    } else if (currentUser.role === 'supervisor' && finalSupervisorId && type === 'resource' && !finalStudentId) {
      // Supervisor uploaded general resource - notify all their students
      const [students] = await pool.query(
        'SELECT s.user_id FROM students s JOIN supervisor_student ss ON s.id = ss.student_id WHERE ss.supervisor_id = ?',
        [finalSupervisorId]
      );
      for (const student of students) {
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type, icon, link) VALUES (?, ?, ?, ?, ?, ?)',
          [
            student.user_id,
            'New Resource Available',
            `${currentUser.name} has shared a new resource: ${title || req.file.originalname}`,
            'document',
            '📄',
            '/student/documents'
          ]
        );
      }
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: { 
        id: result.insertId,
        file_path: req.file.path,
        file_name: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Download document
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    const [documents] = await pool.query(
      'SELECT file_path, file_name FROM documents WHERE id = ?',
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];
    const filePath = path.join(__dirname, '..', document.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, document.file_name);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Update document
router.put('/:id', authenticate, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const { title, description, status } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(documentId);

    await pool.query(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const currentUser = req.user;

    const [documents] = await pool.query(
      'SELECT * FROM documents WHERE id = ?',
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Check access
    if (document.uploaded_by !== currentUser.id && currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    await pool.query('DELETE FROM documents WHERE id = ?', [documentId]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Add feedback/comment to a document
router.post('/:id/feedback', authenticate, [
  body('feedback').trim().notEmpty().withMessage('Feedback is required')
], async (req, res) => {
  try {
    console.log('=== FEEDBACK ENDPOINT HIT ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Current user:', req.user ? { id: req.user.id, role: req.user.role, name: req.user.name } : 'NO USER');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const documentId = parseInt(req.params.id);
    const { feedback } = req.body;
    const currentUser = req.user;
    
    if (!currentUser) {
      console.error('❌ No user in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!feedback || !feedback.trim()) {
      console.error('❌ No feedback provided');
      return res.status(400).json({ error: 'Feedback is required' });
    }

    // Check if user is supervisor or admin
    if (currentUser.role !== 'supervisor' && currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Only supervisors and administrators can add feedback' });
    }

    // Verify document exists
    const [documents] = await pool.query(
      'SELECT * FROM documents WHERE id = ?',
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Check if supervisor has access to this student's document
    if (currentUser.role === 'supervisor' && document.student_id) {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        const [student] = await pool.query(
          'SELECT supervisor_id FROM students WHERE id = ?',
          [document.student_id]
        );
        if (student.length > 0 && student[0].supervisor_id !== supervisor[0].id) {
          // Check supervisor_student relationship
          const [relationship] = await pool.query(
            'SELECT * FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
            [supervisor[0].id, document.student_id]
          );
          if (relationship.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      }
    }

    // Create document review (always INSERT new - allow multiple feedback entries per document)
    let reviewId;
    try {
      console.log('=== FEEDBACK SAVE ATTEMPT ===');
      console.log('Document ID:', documentId);
      console.log('Reviewer ID (user_id):', currentUser.id);
      console.log('Feedback length:', feedback.length);
      console.log('Feedback preview:', feedback.substring(0, 100));
      
      const [result] = await pool.query(
        `INSERT INTO document_reviews 
         (document_id, reviewer_id, feedback, status, reviewed_at)
         VALUES (?, ?, ?, 'approved', NOW())`,
        [documentId, currentUser.id, feedback]
      );
      reviewId = result.insertId;
      console.log('✅ Document review created successfully with ID:', reviewId);
      console.log('=== FEEDBACK SAVE SUCCESS ===');
    } catch (dbError) {
      console.error('=== FEEDBACK SAVE ERROR ===');
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      console.error('Error stack:', dbError.stack);
      
      // Check if table doesn't exist
      if (dbError.code === 'ER_NO_SUCH_TABLE' || (dbError.message && dbError.message.includes("doesn't exist"))) {
        console.error('❌ document_reviews table does not exist. Please run the migration script.');
        return res.status(500).json({ 
          error: 'Database table missing. Please run: backend/database/create_document_reviews_table.sql' 
        });
      }
      
      // Check for foreign key constraint errors
      if (dbError.code === 'ER_NO_REFERENCED_ROW_2' || dbError.code === '1452') {
        console.error('❌ Foreign key constraint failed. Document or user may not exist.');
        return res.status(400).json({ 
          error: 'Invalid document or user reference',
          details: dbError.message
        });
      }
      
      throw dbError; // Re-throw if it's a different error
    }

    // Update document status to pending_review (correction needed)
    // This indicates the student needs to address the feedback
    await pool.query(
      'UPDATE documents SET status = ? WHERE id = ?',
      ['pending_review', documentId]
    );
    console.log('Document status updated to pending_review (correction needed)');

    // Get reviewer name
    const [reviewer] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [currentUser.id]
    );

    res.status(201).json({
      message: 'Feedback added successfully',
      review: {
        id: reviewId,
        feedback,
        reviewer_name: (reviewer[0] && reviewer[0].name) || currentUser.name,
        reviewed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to add feedback',
      details: error.message 
    });
  }
});

// Approve a document (no correction needed)
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const currentUser = req.user;

    // Check if user is supervisor or admin
    if (currentUser.role !== 'supervisor' && currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Only supervisors and administrators can approve documents' });
    }

    // Verify document exists
    const [documents] = await pool.query(
      'SELECT * FROM documents WHERE id = ?',
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Check if supervisor has access to this student's document
    if (currentUser.role === 'supervisor' && document.student_id) {
      const [supervisor] = await pool.query(
        'SELECT id FROM supervisors WHERE user_id = ?',
        [currentUser.id]
      );
      if (supervisor.length > 0) {
        const [student] = await pool.query(
          'SELECT supervisor_id FROM students WHERE id = ?',
          [document.student_id]
        );
        if (student.length > 0 && student[0].supervisor_id !== supervisor[0].id) {
          // Check supervisor_student relationship
          const [relationship] = await pool.query(
            'SELECT * FROM supervisor_student WHERE supervisor_id = ? AND student_id = ?',
            [supervisor[0].id, document.student_id]
          );
          if (relationship.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      }
    }

    // Update document status to approved
    await pool.query(
      'UPDATE documents SET status = ? WHERE id = ?',
      ['approved', documentId]
    );

    console.log(`Document ${documentId} approved by user ${currentUser.id}`);

    res.json({
      message: 'Document approved successfully',
      document: {
        id: documentId,
        status: 'approved'
      }
    });
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({ error: 'Failed to approve document' });
  }
});

// Get all feedback for a document
router.get('/:id/feedback', authenticate, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const currentUser = req.user;

    // Verify document exists
    const [documents] = await pool.query(
      'SELECT * FROM documents WHERE id = ?',
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Check access - students can only see feedback on their own documents
    if (currentUser.role === 'student' && document.student_id) {
      const [student] = await pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [currentUser.id]
      );
      if (student.length === 0 || student[0].id !== document.student_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get all reviews for this document
    let reviews = [];
    try {
      const [reviewsResult] = await pool.query(
        `SELECT dr.*, u.name as reviewer_name, u.role as reviewer_role
         FROM document_reviews dr
         JOIN users u ON dr.reviewer_id = u.id
         WHERE dr.document_id = ?
         ORDER BY dr.reviewed_at DESC, dr.created_at DESC`,
        [documentId]
      );
      reviews = reviewsResult;
    } catch (dbError) {
      // Check if table doesn't exist
      if (dbError.code === 'ER_NO_SUCH_TABLE' || (dbError.message && dbError.message.includes("doesn't exist"))) {
        console.error('document_reviews table does not exist. Please run the migration script.');
        // Return empty array instead of error - table will be created later
        return res.json({ reviews: [] });
      }
      throw dbError; // Re-throw if it's a different error
    }

    res.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        feedback: review.feedback,
        reviewer_name: review.reviewer_name,
        reviewer_role: review.reviewer_role,
        reviewed_at: review.reviewed_at,
        created_at: review.created_at
      }))
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Test endpoint to check database and table
router.get('/test/feedback-db', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Test 1: Check if table exists
    let tableExists = false;
    try {
      const [tables] = await pool.query(
        "SHOW TABLES LIKE 'document_reviews'"
      );
      tableExists = tables.length > 0;
      console.log('Table exists check:', tableExists);
    } catch (err) {
      console.error('Error checking table:', err);
    }
    
    // Test 2: Check table structure
    let tableStructure = null;
    if (tableExists) {
      try {
        const [structure] = await pool.query('DESCRIBE document_reviews');
        tableStructure = structure;
      } catch (err) {
        console.error('Error getting table structure:', err);
      }
    }
    
    // Test 3: Check if we can query the table
    let canQuery = false;
    let rowCount = 0;
    if (tableExists) {
      try {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM document_reviews');
        rowCount = rows[0].count;
        canQuery = true;
      } catch (err) {
        console.error('Error querying table:', err);
      }
    }
    
    // Test 4: Check if documents table has any records
    let documentCount = 0;
    try {
      const [docs] = await pool.query('SELECT COUNT(*) as count FROM documents');
      documentCount = docs[0].count;
    } catch (err) {
      console.error('Error counting documents:', err);
    }
    
    // Test 5: Check if user exists
    let userExists = false;
    try {
      const [users] = await pool.query('SELECT id, name, role FROM users WHERE id = ?', [currentUser.id]);
      userExists = users.length > 0;
    } catch (err) {
      console.error('Error checking user:', err);
    }
    
    res.json({
      success: true,
      tests: {
        tableExists,
        canQuery,
        rowCount,
        documentCount,
        userExists,
        currentUser: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        },
        tableStructure: tableStructure ? tableStructure.map(col => ({
          field: col.Field,
          type: col.Type,
          null: col.Null,
          key: col.Key
        })) : null
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;

