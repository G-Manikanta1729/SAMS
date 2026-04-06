const Student = require('../models/Student');
const Timetable = require('../models/Timetable');
const AttendanceLog = require('../models/AttendanceLog');

// Get student dashboard data
exports.getDashboard = async (req, res) => {
  try {
    console.log('Fetching dashboard for student:', req.user.id);
    
    const student = await Student.findById(req.user.id).select('-password');
    
    if (!student) {
      console.log('Student not found');
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Initialize marks if they don't exist
    if (!student.marks.mid1) student.marks.mid1 = new Map();
    if (!student.marks.mid2) student.marks.mid2 = new Map();
    if (!student.marks.external) student.marks.external = new Map();
    if (!student.internalMarks) student.internalMarks = new Map();
    if (!student.finalMarks) student.finalMarks = new Map();

    // Calculate all marks
    student.calculateInternalMarks();
    student.calculateFinalMarks();
    await student.save();

    const response = {
      student: {
        name: student.name,
        rollNumber: student.rollNumber,
        branch: student.branch,
        semester: student.semester,
        email: student.email
      },
      attendance: student.attendance || [],
      marks: {
        mid1: Object.fromEntries(student.marks.mid1 || new Map()),
        mid2: Object.fromEntries(student.marks.mid2 || new Map()),
        internal: Object.fromEntries(student.internalMarks || new Map()),
        external: Object.fromEntries(student.marks.external || new Map()),
        final: Object.fromEntries(student.finalMarks || new Map())
      },
      notifications: (student.notifications || []).filter(n => !n.read).length
    };
    
    console.log('Dashboard data sent successfully');
    res.json(response);
  } catch (err) {
    console.error('Error in getDashboard:', err.message);
    console.error(err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get attendance with alerts
exports.getAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    const attendanceWithAlerts = (student.attendance || []).map(record => {
      const required = Math.ceil((0.75 * record.total - record.attended) / 0.25);
      return {
        subject: record.subject,
        attended: record.attended,
        total: record.total,
        percentage: record.percentage || 0,
        status: (record.percentage || 0) < 75 ? 'LOW' : 'OK',
        requiredClasses: required > 0 ? required : 0
      };
    });

    res.json(attendanceWithAlerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getDailyAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ msg: 'Student not found' });

    const logs = await AttendanceLog.find({ studentId: student._id })
      .sort({ date: -1 })
      .select('subject date status');
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get marks with calculation
exports.getMarks = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    student.calculateInternalMarks();
    student.calculateFinalMarks();
    await student.save();

    const marksData = [];
    
    // Get all unique subjects from mid1, mid2, and external
    const allSubjects = new Set();
    if (student.marks.mid1) {
      for (let key of student.marks.mid1.keys()) allSubjects.add(key);
    }
    if (student.marks.mid2) {
      for (let key of student.marks.mid2.keys()) allSubjects.add(key);
    }
    if (student.marks.external) {
      for (let key of student.marks.external.keys()) allSubjects.add(key);
    }
    
    for (let subject of allSubjects) {
      const mid1 = student.marks.mid1?.get(subject) || { descriptive: 0, objective: 0, assignment: 0, total: 0 };
      const mid2 = student.marks.mid2?.get(subject) || { descriptive: 0, objective: 0, assignment: 0, total: 0 };
      const internal = student.internalMarks?.get(subject) || 0;
      const external = student.marks.external?.get(subject) || 0;
      const final = student.finalMarks?.get(subject) || 0;
      
      marksData.push({
        subject,
        mid1,
        mid2,
        internal: internal,
        external: external,
        final: final
      });
    }

    res.json(marksData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get timetable
exports.getTimetable = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    const timetable = await Timetable.findOne({
      branch: student.branch,
      semester: student.semester,
      isActive: true
    }).populate('weekSchedule.slots.faculty', 'name');

    if (!timetable) {
      return res.json([]); // Return empty array instead of 404
    }

    res.json(timetable.weekSchedule || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    // Mark all as read
    if (student.notifications) {
      student.notifications.forEach(n => n.read = true);
      await student.save();
    }

    res.json(student.notifications || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};