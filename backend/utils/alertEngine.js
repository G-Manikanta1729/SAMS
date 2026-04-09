const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

class AlertEngine {
  // Check attendance alerts for all students
  static async checkAttendanceAlerts() {
    try {
      const students = await Student.find({});
      
      for (const student of students) {
        for (const attendance of student.attendance) {
          if (attendance.percentage < 75) {
            // Calculate required classes to reach 75%
            const required = Math.ceil((0.75 * attendance.total - attendance.attended) / 0.25);
            
            const message = `⚠️ Low attendance in ${attendance.subject}: ${attendance.percentage.toFixed(1)}%. Need to attend ${required} more classes to reach 75%`;
            
            // Check if alert already exists
            const exists = student.notifications.some(n => 
              n.message === message && n.type === 'attendance'
            );
            
            if (!exists) {
              student.notifications.unshift({
                message,
                type: 'attendance',
                read: false
              });
            }
          }
        }
        await student.save();
      }
      console.log('✅ Attendance alerts checked');
    } catch (err) {
      console.error('Error checking attendance alerts:', err);
    }
  }

  // Check marks alerts
  static async checkMarksAlerts() {
    try {
      const students = await Student.find({});
      
      for (const student of students) {
        if (student.internalMarks) {
          for (const [subject, marks] of student.internalMarks) {
            if (marks < 20) {
              const message = `📚 Low internal marks in ${subject}: ${marks}/30. Need to improve!`;
              
              const exists = student.notifications.some(n => 
                n.message === message && n.type === 'marks'
              );
              
              if (!exists) {
                student.notifications.unshift({
                  message,
                  type: 'marks',
                  read: false
                });
              }
            }
          }
        }
        await student.save();
      }
      console.log('✅ Marks alerts checked');
    } catch (err) {
      console.error('Error checking marks alerts:', err);
    }
  }

  // Run all alerts
  static async runAllAlerts() {
    await this.checkAttendanceAlerts();
    await this.checkMarksAlerts();
  }
}

module.exports = AlertEngine;