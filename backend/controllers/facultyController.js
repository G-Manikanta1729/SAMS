const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable');
const AttendanceLog = require('../models/AttendanceLog');

// Get faculty dashboard
exports.getDashboard = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id).select('-password');
    
    if (!faculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }

    res.json({
      faculty: {
        name: faculty.name,
        employeeId: faculty.employeeId,
        department: faculty.department,
        email: faculty.email
      },
      subjects: faculty.subjects || [],
      timetable: faculty.timetable || [],
      pendingRequests: (faculty.swapRequests || []).filter(r => r.status === 'pending').length,
      notifications: (faculty.notifications || []).filter(n => !n.read).length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get faculty timetable
exports.getTimetable = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id);
    if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });

    // Group timetable by day
    const grouped = {};
    (faculty.timetable || []).forEach(slot => {
      if (!grouped[slot.day]) grouped[slot.day] = [];
      grouped[slot.day].push(slot);
    });
    // Sort slots within each day by slot number
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.slot - b.slot);
    });
    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Enter marks
// exports.enterMarks = async (req, res) => {
//   try {
//     const { subject, branch, semester, examType, marks } = req.body;
    
//     for (const mark of marks) {
//       const student = await Student.findOne({ rollNumber: mark.rollNumber });
      
//       if (student) {
//         if (examType === 'mid1') {
//           if (!student.marks.mid1) student.marks.mid1 = new Map();
//           student.marks.mid1.set(subject, {
//             descriptive: mark.descriptive || 0,
//             objective: mark.objective || 0,
//             assignment: mark.assignment || 0,
//             total: (mark.descriptive || 0) + (mark.objective || 0) + (mark.assignment || 0)
//           });
//         } else if (examType === 'mid2') {
//           if (!student.marks.mid2) student.marks.mid2 = new Map();
//           student.marks.mid2.set(subject, {
//             descriptive: mark.descriptive || 0,
//             objective: mark.objective || 0,
//             assignment: mark.assignment || 0,
//             total: (mark.descriptive || 0) + (mark.objective || 0) + (mark.assignment || 0)
//           });
//         } else if (examType === 'external') {
//           if (!student.marks.external) student.marks.external = new Map();
//           student.marks.external.set(subject, mark.marks || 0);
//         }
        
//         student.calculateInternalMarks();
//         student.calculateFinalMarks();
        
//         if (!student.notifications) student.notifications = [];
//         student.notifications.unshift({
//           message: `📝 Your ${examType} marks for ${subject} have been updated`,
//           type: 'marks',
//           read: false,
//           createdAt: new Date()
//         });
        
//         await student.save();
//       }
//     }
    
//     res.json({ msg: 'Marks entered successfully' });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ msg: 'Server error', error: err.message });
//   }
// };
// Enter marks with validation
exports.enterMarks = async (req, res) => {
  try {
    const { subject, branch, semester, examType, marks } = req.body;

    for (const mark of marks) {
      let descriptive = 0, objective = 0, assignment = 0, total = 0;

      if (examType === 'mid1' || examType === 'mid2') {
        descriptive = Math.min(Number(mark.descriptive) || 0, 15);
        objective  = Math.min(Number(mark.objective) || 0, 10);
        assignment = Math.min(Number(mark.assignment) || 0, 5);
        total = descriptive + objective + assignment;
        // Cap total at 30 (safety)
        if (total > 30) total = 30;
      } else if (examType === 'external') {
        total = Math.min(Number(mark.marks) || 0, 70);
      }

      const student = await Student.findOne({ rollNumber: mark.rollNumber });
      if (!student) continue;

      if (examType === 'mid1') {
        if (!student.marks.mid1) student.marks.mid1 = new Map();
        student.marks.mid1.set(subject, { descriptive, objective, assignment, total });
      } else if (examType === 'mid2') {
        if (!student.marks.mid2) student.marks.mid2 = new Map();
        student.marks.mid2.set(subject, { descriptive, objective, assignment, total });
      } else if (examType === 'external') {
        if (!student.marks.external) student.marks.external = new Map();
        student.marks.external.set(subject, total);
      }

      student.calculateInternalMarks();
      student.calculateFinalMarks();

      if (!student.notifications) student.notifications = [];
      student.notifications.unshift({
        message: `📝 Your ${examType} marks for ${subject} have been updated`,
        type: 'marks',
        read: false,
        createdAt: new Date()
      });

      await student.save();
    }
    res.json({ msg: 'Marks entered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Enter attendance

exports.enterAttendance = async (req, res) => {
  try {
    const { subject, branch, semester, date, attendance } = req.body;
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    for (const record of attendance) {
      const student = await Student.findOne({ rollNumber: record.rollNumber });
      if (!student) continue;

      // 1. Save daily log (upsert to avoid duplicates)
      await AttendanceLog.updateOne(
        { studentId: student._id, subject, date: selectedDate },
        { $set: { status: record.present ? 'present' : 'absent', branch, semester } },
        { upsert: true }
      );

      // 2. Update cumulative attendance (for backward compatibility)
      let attendanceRecord = student.attendance.find(a => a.subject === subject);
      if (!attendanceRecord) {
        student.attendance.push({ subject, attended: 0, total: 0 });
        attendanceRecord = student.attendance[student.attendance.length - 1];
      }

      // Check if this date was already counted
      const existingLog = await AttendanceLog.findOne({ studentId: student._id, subject, date: selectedDate });
      if (!existingLog) {
        attendanceRecord.total += 1;
        if (record.present) attendanceRecord.attended += 1;
      } else if (existingLog.status !== (record.present ? 'present' : 'absent')) {
        // Status changed – adjust cumulative counts
        const delta = (record.present ? 1 : 0) - (existingLog.status === 'present' ? 1 : 0);
        attendanceRecord.attended += delta;
      }
      attendanceRecord.percentage = (attendanceRecord.attended / attendanceRecord.total) * 100;
      await student.save();
    }
    res.json({ msg: 'Attendance recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Request timetable swap
exports.requestSwap = async (req, res) => {
  try {
    const { requestedTo, originalSlot, requestedSlot } = req.body;
    
    const faculty = await Faculty.findById(req.user.id);
    const targetFaculty = await Faculty.findById(requestedTo);
    
    if (!faculty || !targetFaculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }
    
    const swapRequest = {
      requestedBy: req.user.id,
      requestedTo,
      originalSlot,
      requestedSlot,
      status: 'pending',
      createdAt: new Date()
    };
    
    if (!targetFaculty.swapRequests) targetFaculty.swapRequests = [];
    targetFaculty.swapRequests.push(swapRequest);
    
    if (!targetFaculty.notifications) targetFaculty.notifications = [];
    targetFaculty.notifications.unshift({
      message: `🔄 ${faculty.name} requested a timetable swap`,
      type: 'swap',
      read: false,
      createdAt: new Date()
    });
    
    await targetFaculty.save();
    
    res.json({ msg: 'Swap request sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Respond to swap request
exports.respondToSwap = async (req, res) => {
  try {
    const { requestId, accept } = req.body;
    
    const faculty = await Faculty.findById(req.user.id);
    
    if (!faculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }
    
    const request = faculty.swapRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }
    
    request.status = accept ? 'accepted' : 'rejected';
    await faculty.save();
    
    res.json({ msg: accept ? 'Swap accepted' : 'Swap rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get outgoing swap requests (requests sent by this faculty)
exports.getOutgoingSwapRequests = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id)
      .populate('swapRequests.requestedTo', 'name employeeId');
    if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });
    res.json(faculty.swapRequests || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get students by branch and semester (for marks entry)
exports.getStudentsByBranchSemester = async (req, res) => {
  try {
    const { branch, semester } = req.query;
    const students = await Student.find({ branch, semester }).select('name rollNumber');
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};