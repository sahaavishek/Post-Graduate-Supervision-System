const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const logbookDir = path.join(uploadDir, 'logbooks');
    if (!fs.existsSync(logbookDir)) {
      fs.mkdirSync(logbookDir, { recursive: true });
    }
    cb(null, logbookDir);
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
    const allowedTypes = /pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX are allowed.'));
    }
  }
});

// Get logbook for a student
router.get('/:student_id', authenticate, async (req, res) => {
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
    }

    // Get latest logbook version
    const [logbooks] = await pool.query(
      `SELECT l.*, u.name as uploaded_by_name, u.role as uploaded_by_role
       FROM logbooks l
       JOIN users u ON l.uploaded_by = u.id
       WHERE l.student_id = ?
       ORDER BY l.version DESC, l.created_at DESC
       LIMIT 1`,
      [studentId]
    );

    if (logbooks.length === 0) {
      return res.json({ logbook: null });
    }

    res.json({ logbook: logbooks[0] });
  } catch (error) {
    console.error('Get logbook error:', error);
    res.status(500).json({ error: 'Failed to fetch logbook' });
  }
});

// Upload logbook
router.post('/:student_id', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

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
    }

    // Get current version
    const [existing] = await pool.query(
      'SELECT MAX(version) as max_version FROM logbooks WHERE student_id = ?',
      [studentId]
    );
    const nextVersion = existing.length > 0 && existing[0].max_version ? existing[0].max_version + 1 : 1;

    // Insert new logbook entry
    const [result] = await pool.query(
      `INSERT INTO logbooks 
       (student_id, file_path, file_name, file_size, file_type, uploaded_by, version, uploaded_by_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        req.file.path,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        currentUser.id,
        nextVersion,
        currentUser.role
      ]
    );

    // Get the created logbook
    const [logbook] = await pool.query(
      `SELECT l.*, u.name as uploaded_by_name, u.role as uploaded_by_role
       FROM logbooks l
       JOIN users u ON l.uploaded_by = u.id
       WHERE l.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Logbook uploaded successfully',
      logbook: logbook[0]
    });
  } catch (error) {
    console.error('Upload logbook error:', error);
    res.status(500).json({ error: 'Failed to upload logbook' });
  }
});

// Download logbook
router.get('/:student_id/download', authenticate, async (req, res) => {
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
    }

    // Get latest logbook version
    const [logbooks] = await pool.query(
      'SELECT file_path, file_name FROM logbooks WHERE student_id = ? ORDER BY version DESC, created_at DESC LIMIT 1',
      [studentId]
    );

    if (logbooks.length === 0) {
      return res.status(404).json({ error: 'Logbook not found' });
    }

    const logbook = logbooks[0];
    const filePath = path.isAbsolute(logbook.file_path) 
      ? logbook.file_path 
      : path.join(__dirname, '..', logbook.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, logbook.file_name);
  } catch (error) {
    console.error('Download logbook error:', error);
    res.status(500).json({ error: 'Failed to download logbook' });
  }
});

// Get logbook history for a student
router.get('/:student_id/history', authenticate, async (req, res) => {
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
    }

    // Get all logbook versions
    const [logbooks] = await pool.query(
      `SELECT l.*, u.name as uploaded_by_name, u.role as uploaded_by_role
       FROM logbooks l
       JOIN users u ON l.uploaded_by = u.id
       WHERE l.student_id = ?
       ORDER BY l.version DESC, l.created_at DESC`,
      [studentId]
    );

    res.json({ history: logbooks });
  } catch (error) {
    console.error('Get logbook history error:', error);
    res.status(500).json({ error: 'Failed to fetch logbook history' });
  }
});

module.exports = router;

