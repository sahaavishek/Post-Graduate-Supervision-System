const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Test database connection on startup
const pool = require('./config/database');

// Import reminder services
const { checkDeadlineReminders, checkOverdueDeadlines } = require('./services/deadlineReminderService');
const { checkMeetingReminders } = require('./services/meetingReminderService');

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with CORS headers for images
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students'));
app.use('/api/supervisors', require('./routes/supervisors'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/logbook', require('./routes/logbook'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/notification-preferences', require('./routes/notification-preferences'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/announcements', require('./routes/announcements'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'UTMGradient API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start server after database connection is verified
async function startServer() {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection verified');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      
      // Start deadline reminder scheduler
      startDeadlineReminderScheduler();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('⚠️  Server will start but database operations may fail.');
    console.log('💡 Make sure MySQL is running and database credentials are correct in .env');
    
    // Start server anyway (for development - allows frontend to work)
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (without database connection)`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Start deadline reminder scheduler (will fail gracefully if DB not connected)
      startDeadlineReminderScheduler();
    });
  }
}

/**
 * Start the reminder schedulers
 * Checks for upcoming deadlines and meetings every 5 minutes
 */
function startDeadlineReminderScheduler() {
  // Run immediately on startup (after a short delay to ensure DB is ready)
  setTimeout(async () => {
    try {
      await checkDeadlineReminders();
      await checkOverdueDeadlines();
      await checkMeetingReminders();
    } catch (error) {
      console.error('Error running initial reminder check:', error.message);
    }
  }, 5000); // Wait 5 seconds after server starts
  
  // Run deadline checks every hour (3600000 ms)
  const deadlineCheckInterval = parseInt(process.env.DEADLINE_CHECK_INTERVAL) || 3600000; // Default: 1 hour
  setInterval(async () => {
    try {
      await checkDeadlineReminders();
      await checkOverdueDeadlines();
    } catch (error) {
      console.error('Error running scheduled deadline check:', error.message);
    }
  }, deadlineCheckInterval);
  
  // Run meeting reminders every 5 minutes (300000 ms) for more accurate timing
  const meetingCheckInterval = parseInt(process.env.MEETING_CHECK_INTERVAL) || 300000; // Default: 5 minutes
  setInterval(async () => {
    try {
      await checkMeetingReminders();
    } catch (error) {
      console.error('Error running scheduled meeting check:', error.message);
    }
  }, meetingCheckInterval);
  
  console.log(`⏰ Reminder schedulers started:`);
  console.log(`   - Deadline reminders: every ${deadlineCheckInterval / 1000 / 60} minutes`);
  console.log(`   - Meeting reminders: every ${meetingCheckInterval / 1000 / 60} minutes`);
}

startServer();

module.exports = app;

