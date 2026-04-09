const pool = require('../config/database');

/**
 * Check for upcoming meetings and send notifications 1 hour before
 * This service checks meetings that are scheduled to start in 1 hour
 * Sends notifications to both student and supervisor
 */
async function checkMeetingReminders() {
  try {
    console.log('🔔 Checking meeting reminders (1 hour before)...');
    
    // Find meetings that start in approximately 1 hour (within a 5-minute window)
    // Only check approved or pending meetings (not completed or cancelled)
    // Check for meetings starting between 55 minutes and 65 minutes from now
    const [meetings] = await pool.query(
      `SELECT 
        m.id,
        m.title,
        m.date,
        m.time,
        m.type,
        m.location,
        m.meeting_link,
        m.agenda,
        m.student_id,
        m.supervisor_id,
        s.user_id as student_user_id,
        sup.user_id as supervisor_user_id,
        u_student.name as student_name,
        u_supervisor.name as supervisor_name
      FROM meetings m
      JOIN students s ON m.student_id = s.id
      JOIN supervisors sup ON m.supervisor_id = sup.id
      JOIN users u_student ON s.user_id = u_student.id
      JOIN users u_supervisor ON sup.user_id = u_supervisor.id
      WHERE m.status IN ('approved', 'pending')
        AND TIMESTAMP(m.date, m.time) BETWEEN DATE_ADD(NOW(), INTERVAL 55 MINUTE) AND DATE_ADD(NOW(), INTERVAL 65 MINUTE)
        AND TIMESTAMP(m.date, m.time) > NOW()`,
      []
    );
    
    if (meetings.length === 0) {
      console.log('✅ No meetings starting in 1 hour');
      return { checked: 0, notified: 0 };
    }
    
    console.log(`📋 Found ${meetings.length} meeting(s) starting in 1 hour`);
    
    let notifiedCount = 0;
    
    for (const meeting of meetings) {
      try {
        // Calculate meeting datetime
        const now = new Date();
        const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
        const timeUntilMeeting = meetingDateTime.getTime() - now.getTime();
        
        // Format meeting time for display
        const meetingTimeStr = meetingDateTime.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        
        // Format meeting details
        const meetingDetails = meeting.type === 'online' && meeting.meeting_link
          ? `Meeting Link: ${meeting.meeting_link}`
          : meeting.type === 'in-person' && meeting.location
          ? `Location: ${meeting.location}`
          : meeting.agenda || 'No additional details';
        
        // Check and notify student
        const studentNotified = await notifyUser(
          meeting.student_user_id,
          meeting.supervisor_name,
          meeting.title,
          meetingTimeStr,
          meetingDetails,
          meeting.type,
          meeting.meeting_link,
          meeting.location,
          '/student/meetings'
        );
        
        if (studentNotified) {
          notifiedCount++;
        }
        
        // Check and notify supervisor
        const supervisorNotified = await notifyUser(
          meeting.supervisor_user_id,
          meeting.student_name,
          meeting.title,
          meetingTimeStr,
          meetingDetails,
          meeting.type,
          meeting.meeting_link,
          meeting.location,
          '/supervisor/meetings'
        );
        
        if (supervisorNotified) {
          notifiedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing meeting reminder for meeting ${meeting.id}:`, error.message);
        // Continue with next meeting
      }
    }
    
    console.log(`✅ Meeting reminder check complete: ${notifiedCount} notifications sent`);
    return { checked: meetings.length, notified: notifiedCount };
  } catch (error) {
    console.error('❌ Error checking meeting reminders:', error);
    return { checked: 0, notified: 0, error: error.message };
  }
}

/**
 * Helper function to notify a user about an upcoming meeting
 */
async function notifyUser(userId, otherPartyName, meetingTitle, meetingTime, meetingDetails, meetingType, meetingLink, location, linkPath) {
  try {
    // Check if user has meeting reminders enabled
    const [prefs] = await pool.query(
      'SELECT meeting_reminders FROM notification_preferences WHERE user_id = ?',
      [userId]
    );
    
    // Check if meeting reminders are enabled
    // Default to true if preferences don't exist (backward compatibility)
    // In MySQL, BOOLEAN is stored as TINYINT(1): 1 = true, 0 = false
    let shouldNotify = true; // Default to enabled
    if (prefs.length > 0) {
      const meetingReminders = prefs[0].meeting_reminders;
      // Handle both boolean and integer values (1/0)
      shouldNotify = meetingReminders === 1 || meetingReminders === true || meetingReminders === '1';
      console.log(`📋 User ${userId} meeting reminders setting: ${meetingReminders} (will notify: ${shouldNotify})`);
    } else {
      console.log(`📋 User ${userId} has no preferences set, defaulting to enabled`);
    }
    
    if (!shouldNotify) {
      console.log(`⏭️  Skipping meeting reminder for user ${userId} - Meeting reminders are DISABLED in notification preferences`);
      return false;
    }
    
    // Check if notification was already sent for this meeting in the last hour
    const [existingNotif] = await pool.query(
      `SELECT id FROM notifications 
       WHERE user_id = ? 
       AND type = 'meeting'
       AND message LIKE ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [userId, `%${meetingTitle}%`]
    );
    
    if (existingNotif.length > 0) {
      console.log(`⏭️  Notification already sent for meeting "${meetingTitle}" to user ${userId}`);
      return false;
    }
    
    // Build meeting message
    let message = `📅 Meeting reminder: "${meetingTitle}" with ${otherPartyName} starts in 1 hour (${meetingTime}).`;
    
    if (meetingType === 'online' && meetingLink) {
      message += ` Join at: ${meetingLink}`;
    } else if (meetingType === 'in-person' && location) {
      message += ` Location: ${location}`;
    }
    
    if (meetingDetails && meetingDetails !== 'No additional details') {
      message += ` ${meetingDetails}`;
    }
    
    // Create notification
    await pool.query(
      `INSERT INTO notifications 
       (user_id, title, message, type, icon, link, unread) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [
        userId,
        'Meeting Reminder - 1 Hour',
        message,
        'meeting',
        '📅',
        linkPath
      ]
    );
    
    console.log(`✅ Sent meeting reminder to user ${userId} for meeting "${meetingTitle}"`);
    return true;
  } catch (error) {
    console.error(`❌ Error notifying user ${userId}:`, error.message);
    return false;
  }
}

module.exports = {
  checkMeetingReminders
};

