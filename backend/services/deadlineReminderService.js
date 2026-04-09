const pool = require('../config/database');

/**
 * Check for upcoming deadlines and send notifications to students
 * This service checks weekly_tasks for tasks due in 1 day or today
 */
async function checkDeadlineReminders() {
  try {
    console.log('🔔 Checking deadline reminders...');
    
    // Get today's and tomorrow's dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Find all weekly tasks due today or tomorrow that haven't been submitted
    // Use DATE() function to compare date portion only (works for both DATE and DATETIME columns)
    const [tasks] = await pool.query(
      `SELECT 
        wt.id,
        wt.student_id,
        wt.week_number,
        wt.title,
        wt.due_date,
        s.user_id as student_user_id,
        u.name as student_name
      FROM weekly_tasks wt
      JOIN students s ON wt.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE (DATE(wt.due_date) = ? OR DATE(wt.due_date) = ?)
        AND wt.is_active = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM weekly_submissions ws
          WHERE ws.student_id = wt.student_id
            AND ws.week_number = wt.week_number
            AND ws.status = 'submitted'
        )`,
      [todayStr, tomorrowStr]
    );
    
    if (tasks.length === 0) {
      console.log('✅ No deadlines due today or tomorrow');
      return { checked: 0, notified: 0 };
    }
    
    console.log(`📋 Found ${tasks.length} tasks due today or tomorrow`);
    
    let notifiedCount = 0;
    
    for (const task of tasks) {
      try {
        // Check if student has deadline reminders enabled
        const [prefs] = await pool.query(
          'SELECT deadline_reminders FROM notification_preferences WHERE user_id = ?',
          [task.student_user_id]
        );
        
        // Default to true if preferences don't exist (backward compatibility)
        const shouldNotify = prefs.length === 0 || prefs[0].deadline_reminders === 1;
        
        if (!shouldNotify) {
          console.log(`⏭️  Skipping notification for student ${task.student_name} (deadline reminders disabled)`);
          continue;
        }
        
        // Check if notification was already sent for this task today
        const [existingNotif] = await pool.query(
          `SELECT id FROM notifications 
           WHERE user_id = ? 
           AND type = 'reminder' 
           AND message LIKE ?
           AND DATE(created_at) = CURDATE()`,
          [task.student_user_id, `%Week ${task.week_number}%`]
        );
        
        if (existingNotif.length > 0) {
          console.log(`⏭️  Notification already sent today for Week ${task.week_number} to ${task.student_name}`);
          continue;
        }
        
        // Format due date for display
        const dueDate = new Date(task.due_date);
        const dueDateStr = dueDate.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric" 
        });
        
        // Determine if it's due today or tomorrow (compare date portion only)
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        const taskDueDateStr = taskDueDate.toISOString().split('T')[0];
        const isDueToday = taskDueDateStr === todayStr;
        const reminderText = isDueToday 
          ? `⚠️ URGENT: Your submission for "${task.title}" (Week ${task.week_number}) is due TODAY (${dueDateStr}). Please submit your document immediately!`
          : `Reminder: Your submission for "${task.title}" (Week ${task.week_number}) is due tomorrow (${dueDateStr}). Please submit your document before the deadline.`;
        
        // Create notification
        await pool.query(
          `INSERT INTO notifications 
           (user_id, title, message, type, icon, link, unread) 
           VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
          [
            task.student_user_id,
            isDueToday ? 'Deadline Today!' : 'Deadline Reminder',
            reminderText,
            'reminder',
            isDueToday ? '⚠️' : '⏰',
            '/student/documents'
          ]
        );
        
        console.log(`✅ Sent deadline reminder to ${task.student_name} for Week ${task.week_number}`);
        notifiedCount++;
      } catch (error) {
        console.error(`❌ Error sending reminder for task ${task.id}:`, error.message);
        // Continue with next task
      }
    }
    
    console.log(`✅ Deadline reminder check complete: ${notifiedCount} notifications sent`);
    return { checked: tasks.length, notified: notifiedCount };
  } catch (error) {
    console.error('❌ Error checking deadline reminders:', error);
    return { checked: 0, notified: 0, error: error.message };
  }
}

/**
 * Check for overdue deadlines and send notifications
 * This checks for tasks that are past due but not submitted
 */
async function checkOverdueDeadlines() {
  try {
    console.log('🔔 Checking overdue deadlines...');
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Find all weekly tasks that are overdue and not submitted
    // Use DATE() function to compare date portion only (works for both DATE and DATETIME columns)
    const [tasks] = await pool.query(
      `SELECT 
        wt.id,
        wt.student_id,
        wt.week_number,
        wt.title,
        wt.due_date,
        s.user_id as student_user_id,
        u.name as student_name
      FROM weekly_tasks wt
      JOIN students s ON wt.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE DATE(wt.due_date) < ?
        AND wt.is_active = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM weekly_submissions ws
          WHERE ws.student_id = wt.student_id
            AND ws.week_number = wt.week_number
            AND ws.status = 'submitted'
        )`,
      [todayStr]
    );
    
    if (tasks.length === 0) {
      console.log('✅ No overdue deadlines');
      return { checked: 0, notified: 0 };
    }
    
    console.log(`📋 Found ${tasks.length} overdue tasks`);
    
    let notifiedCount = 0;
    
    for (const task of tasks) {
      try {
        // Check if student has deadline reminders enabled
        const [prefs] = await pool.query(
          'SELECT deadline_reminders FROM notification_preferences WHERE user_id = ?',
          [task.student_user_id]
        );
        
        const shouldNotify = prefs.length === 0 || prefs[0].deadline_reminders === 1;
        
        if (!shouldNotify) {
          continue;
        }
        
        // Check if notification was already sent for this overdue task (ever, not just today)
        // This ensures we only send one overdue reminder per task
        const [existingNotif] = await pool.query(
          `SELECT id FROM notifications 
           WHERE user_id = ? 
           AND type = 'reminder' 
           AND title = 'Overdue Deadline'
           AND message LIKE ?`,
          [task.student_user_id, `%Week ${task.week_number}%`]
        );
        
        if (existingNotif.length > 0) {
          console.log(`⏭️  Overdue notification already sent for Week ${task.week_number} to ${task.student_name}`);
          continue;
        }
        
        // Calculate days overdue
        const dueDate = new Date(task.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Format due date for display
        const dueDateStr = dueDate.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric" 
        });
        
        // Create notification
        await pool.query(
          `INSERT INTO notifications 
           (user_id, title, message, type, icon, link, unread) 
           VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
          [
            task.student_user_id,
            'Overdue Deadline',
            `⚠️ Your submission for "${task.title}" (Week ${task.week_number}) was due on ${dueDateStr} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). Please submit your document as soon as possible.`,
            'reminder',
            '⚠️',
            '/student/documents'
          ]
        );
        
        console.log(`✅ Sent overdue reminder to ${task.student_name} for Week ${task.week_number}`);
        notifiedCount++;
      } catch (error) {
        console.error(`❌ Error sending overdue reminder for task ${task.id}:`, error.message);
      }
    }
    
    console.log(`✅ Overdue deadline check complete: ${notifiedCount} notifications sent`);
    return { checked: tasks.length, notified: notifiedCount };
  } catch (error) {
    console.error('❌ Error checking overdue deadlines:', error);
    return { checked: 0, notified: 0, error: error.message };
  }
}

/**
 * Check a specific task and send notification if due date is today or tomorrow
 * This is called immediately when a task is created/updated
 */
async function checkSpecificTaskReminder(taskId, studentId) {
  try {
    // Get the task details
    const [tasks] = await pool.query(
      `SELECT 
        wt.id,
        wt.student_id,
        wt.week_number,
        wt.title,
        wt.due_date,
        s.user_id as student_user_id,
        u.name as student_name
      FROM weekly_tasks wt
      JOIN students s ON wt.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE wt.id = ? AND wt.student_id = ? AND wt.is_active = TRUE`,
      [taskId, studentId]
    );

    if (tasks.length === 0) {
      return { notified: false, reason: 'Task not found' };
    }

    const task = tasks[0];

    // Check if task has been submitted
    const [submissions] = await pool.query(
      `SELECT id FROM weekly_submissions 
       WHERE student_id = ? AND week_number = ? AND status = 'submitted'`,
      [task.student_id, task.week_number]
    );

    if (submissions.length > 0) {
      return { notified: false, reason: 'Task already submitted' };
    }

    // Check if due_date is set
    if (!task.due_date) {
      return { notified: false, reason: 'No due date set' };
    }

    // Get today's and tomorrow's dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Check if due date is today or tomorrow
    const taskDueDate = new Date(task.due_date);
    taskDueDate.setHours(0, 0, 0, 0);
    const taskDueDateStr = taskDueDate.toISOString().split('T')[0];

    if (taskDueDateStr !== todayStr && taskDueDateStr !== tomorrowStr) {
      return { notified: false, reason: 'Due date is not today or tomorrow' };
    }

    // Check if student has deadline reminders enabled
    const [prefs] = await pool.query(
      'SELECT deadline_reminders FROM notification_preferences WHERE user_id = ?',
      [task.student_user_id]
    );

    const shouldNotify = prefs.length === 0 || prefs[0].deadline_reminders === 1;

    if (!shouldNotify) {
      return { notified: false, reason: 'Deadline reminders disabled' };
    }

    // Check if notification was already sent for this task today
    const [existingNotif] = await pool.query(
      `SELECT id FROM notifications 
       WHERE user_id = ? 
       AND type = 'reminder' 
       AND message LIKE ?
       AND DATE(created_at) = CURDATE()`,
      [task.student_user_id, `%Week ${task.week_number}%`]
    );

    if (existingNotif.length > 0) {
      return { notified: false, reason: 'Notification already sent today' };
    }

    // Format due date for display
    const dueDate = new Date(task.due_date);
    const dueDateStr = dueDate.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Determine if it's due today or tomorrow
    const isDueToday = taskDueDateStr === todayStr;
    const reminderText = isDueToday 
      ? `⚠️ URGENT: Your submission for "${task.title}" (Week ${task.week_number}) is due TODAY (${dueDateStr}). Please submit your document immediately!`
      : `Reminder: Your submission for "${task.title}" (Week ${task.week_number}) is due tomorrow (${dueDateStr}). Please submit your document before the deadline.`;

    // Create notification
    await pool.query(
      `INSERT INTO notifications 
       (user_id, title, message, type, icon, link, unread) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [
        task.student_user_id,
        isDueToday ? 'Deadline Today!' : 'Deadline Reminder',
        reminderText,
        'reminder',
        isDueToday ? '⚠️' : '⏰',
        '/student/documents'
      ]
    );

    console.log(`✅ Sent immediate deadline reminder to ${task.student_name} for Week ${task.week_number} (task updated)`);
    return { notified: true, message: 'Notification sent' };
  } catch (error) {
    console.error(`❌ Error checking specific task reminder for task ${taskId}:`, error.message);
    return { notified: false, reason: error.message };
  }
}

module.exports = {
  checkDeadlineReminders,
  checkOverdueDeadlines,
  checkSpecificTaskReminder
};

