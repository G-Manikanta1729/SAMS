const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const bcrypt = require('bcryptjs');

// Add student
exports.addStudent = async (req, res) => {
  try {
    const { name, rollNumber, branch, semester, email, password } = req.body;

    let student = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (student) {
      return res.status(400).json({ msg: 'Student already exists' });
    }

    student = new Student({
      name,
      rollNumber,
      branch,
      semester,
      email,
      password
    });

    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(password, salt);

    await student.save();

    res.json({ msg: 'Student added successfully', student });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Add faculty
exports.addFaculty = async (req, res) => {
  try {
    const { name, employeeId, department, email, password, subjects } = req.body;

    let faculty = await Faculty.findOne({ $or: [{ email }, { employeeId }] });
    if (faculty) {
      return res.status(400).json({ msg: 'Faculty already exists' });
    }

    faculty = new Faculty({
      name,
      employeeId,
      department,
      email,
      password,
      subjects: subjects || []
    });

    const salt = await bcrypt.genSalt(10);
    faculty.password = await bcrypt.hash(password, salt);
    await faculty.save();

    // ✅ Create subjects in Subject collection
    if (subjects && subjects.length) {
      for (const subj of subjects) {
        const existing = await Subject.findOne({ code: subj.code });
        if (!existing) {
          await Subject.create({
            name: subj.name,
            code: subj.code,
            branch: subj.branch,
            semester: subj.semester,
            credits: 3,
            slotsPerWeek: 4
          });
        }
      }
    }

    res.json({ msg: 'Faculty added successfully', faculty });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
// Add subject
exports.addSubject = async (req, res) => {
  try {
    const { name, code, branch, semester, credits, slotsPerWeek } = req.body;

    let subject = await Subject.findOne({ code });
    if (subject) {
      return res.status(400).json({ msg: 'Subject already exists' });
    }

    subject = new Subject({
      name,
      code,
      branch,
      semester,
      credits: credits || 3,
      slotsPerWeek: slotsPerWeek || 4
    });

    await subject.save();

    res.json({ msg: 'Subject added successfully', subject });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Generate timetable
// Generate timetable
// Generate timetable
exports.generateTimetable = async (req, res) => {
  try {
    const { branch, semester, academicYear } = req.body;
    console.log(`[generateTimetable] Starting for ${branch} semester ${semester}`);

    // 1. Ensure at least 5 subjects
    let subjects = await Subject.find({ branch, semester, isDeleted: false });
    const minRequired = 5;
    if (subjects.length < minRequired) {
      const toCreate = minRequired - subjects.length;
      for (let i = 1; i <= toCreate; i++) {
        const newSubj = new Subject({
          name: `Auto Subject ${subjects.length + i}`,
          code: `${branch}${semester}${Date.now()}${i}`,
          branch,
          semester,
          credits: 3,
          slotsPerWeek: 4
        });
        await newSubj.save();
        subjects.push(newSubj);
      }
    }

    // 2. Get faculty for this branch
    let faculty = await Faculty.find({ department: branch });
    if (faculty.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const dummy = new Faculty({
        name: `Dummy ${branch}`,
        employeeId: `DUM${branch}001`,
        department: branch,
        email: `dummy.${branch}@college.edu`,
        password: hashedPassword,
        subjects: []
      });
      await dummy.save();
      faculty = [dummy];
    }

    // 3. Build faculty-subject mapping (exact matches)
    const facultySubjectMap = {};
    faculty.forEach(f => {
      if (f.subjects) {
        f.subjects.forEach(s => {
          if (s.branch === branch && s.semester === semester) {
            facultySubjectMap[s.name] = f._id;
          }
        });
      }
    });

    // 4. Assign unmapped subjects to faculty using round-robin
    const mappedSubjects = new Set(Object.keys(facultySubjectMap));
    const unmappedSubjects = subjects.filter(s => !mappedSubjects.has(s.name));
    const facultyIds = faculty.map(f => f._id);
    let facultyIndex = 0;
    const subjectFacultyMap = { ...facultySubjectMap };
    for (const subject of unmappedSubjects) {
      subjectFacultyMap[subject.name] = facultyIds[facultyIndex % facultyIds.length];
      facultyIndex++;
    }

    // 5. Generate timetable slots
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const slotsPerDay = 6;
    const rooms = ['A101', 'A102', 'A103', 'B201', 'B202', 'B203'];
    const weekSchedule = [];
    let subjectIndex = 0;

    for (const day of days) {
      const daySlots = [];
      for (let slot = 1; slot <= slotsPerDay; slot++) {
        const subject = subjects[subjectIndex % subjects.length];
        subjectIndex++;

        const startHour = 9 + Math.floor((slot - 1) / 2);
        const startMinute = (slot - 1) % 2 === 0 ? 0 : 30;
        const endHour = startHour + (startMinute === 0 ? 1 : 0);
        const endMinute = startMinute === 0 ? 30 : 0;
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        daySlots.push({
          slotNumber: slot,
          subject: subject.name,
          faculty: subjectFacultyMap[subject.name],
          room: rooms[Math.floor(Math.random() * rooms.length)],
          startTime,
          endTime
        });
      }
      weekSchedule.push({ day, slots: daySlots });
    }

    // 6. Save timetable
    let timetable = await Timetable.findOne({ branch, semester, academicYear });
    if (timetable) {
      timetable.weekSchedule = weekSchedule;
      timetable.isActive = true;
    } else {
      timetable = new Timetable({ branch, semester, academicYear, weekSchedule });
    }
    await timetable.save();

    // 7. Update faculty timetables
    // Clear existing faculty timetables for this branch & semester (using department, not subjects)
await Faculty.updateMany(
  { department: branch },
  { $pull: { timetable: { branch: branch, semester: semester } } }
);

// Add new slots to each faculty's timetable
for (const day of weekSchedule) {
  for (const slot of day.slots) {
    if (slot.faculty) {
      // Ensure we don't duplicate the same day+slot
      await Faculty.updateOne(
        { _id: slot.faculty },
        {
          $pull: { timetable: { day: day.day, slot: slot.slotNumber, branch: branch, semester: semester } }
        }
      );
      await Faculty.updateOne(
        { _id: slot.faculty },
        {
          $push: {
            timetable: {
              day: day.day,
              slot: slot.slotNumber,
              subject: slot.subject,
              branch: branch,
              semester: semester,
              room: slot.room,
              startTime: slot.startTime,
              endTime: slot.endTime
            }
          }
        }
      );
    }
  }
}

    res.json({ msg: 'Timetable generated successfully', timetable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get all generated timetables (list of branches & semesters)
exports.getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find({ isActive: true })
      .select('branch semester academicYear createdAt updatedAt')
      .sort({ createdAt: -1 });
    res.json(timetables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

// Delete a specific timetable
exports.deleteTimetable = async (req, res) => {
  try {
    const { branch, semester } = req.params;
    const deleted = await Timetable.findOneAndDelete({ branch, semester: parseInt(semester) });
    if (!deleted) return res.status(404).json({ msg: 'Timetable not found' });
    res.json({ msg: 'Timetable deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    console.log(`[Admin] Found ${students.length} students`);
    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get all faculty
exports.getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().select('-password');
    console.log(`[Admin] Found ${faculty.length} faculty members`);
    res.json(faculty);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isDeleted: false });
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// ==================== UPDATE, SOFT DELETE, HARD DELETE, RESTORE ====================

// ---------- STUDENT ----------
exports.updateStudent = async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.softDeleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ msg: 'Student soft deleted (can be restored)' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.hardDeleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Student permanently deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.restoreStudent = async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isDeleted: false });
    res.json({ msg: 'Student restored' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ---------- FACULTY ----------
exports.updateFaculty = async (req, res) => {
  try {
    const updated = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.softDeleteFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ msg: 'Faculty soft deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.hardDeleteFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Faculty permanently deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.restoreFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndUpdate(req.params.id, { isDeleted: false });
    res.json({ msg: 'Faculty restored' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ---------- SUBJECT ----------
exports.updateSubject = async (req, res) => {
  try {
    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.softDeleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ msg: 'Subject soft deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.hardDeleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Subject permanently deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.restoreSubject = async (req, res) => {
  try {
    await Subject.findByIdAndUpdate(req.params.id, { isDeleted: false });
    res.json({ msg: 'Subject restored' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.addTimetableSlot = async (req, res) => {
  try {
    const { branch, semester, day, slotNumber, subject, room, startTime, endTime } = req.body;
    const timetable = await Timetable.findOne({ branch, semester, isActive: true });
    if (!timetable) return res.status(404).json({ msg: 'Timetable not found' });

    const daySchedule = timetable.weekSchedule.find(d => d.day === day);
    if (!daySchedule) return res.status(404).json({ msg: 'Day not found' });

    // Check if slot number already exists
    const existing = daySchedule.slots.find(s => s.slotNumber === slotNumber);
    if (existing) return res.status(400).json({ msg: 'Slot number already exists for this day' });

    // Add new slot
    daySchedule.slots.push({
      slotNumber,
      subject,
      room,
      startTime,
      endTime,
      faculty: null // or assign default faculty
    });
    // Sort slots by slotNumber
    daySchedule.slots.sort((a, b) => a.slotNumber - b.slotNumber);
    await timetable.save();
    res.json({ msg: 'Slot added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Override a specific timetable slot (admin edit)
exports.overrideTimetableSlot = async (req, res) => {
  try {
    const { branch, semester, day, slotNumber, subject, room, startTime, endTime } = req.body;
    const timetable = await Timetable.findOne({ branch, semester, isActive: true });
    if (!timetable) return res.status(404).json({ msg: 'Timetable not found' });

    const daySchedule = timetable.weekSchedule.find(d => d.day === day);
    if (!daySchedule) return res.status(404).json({ msg: 'Day not found' });

    const slot = daySchedule.slots.find(s => s.slotNumber === slotNumber);
    if (!slot) return res.status(404).json({ msg: 'Slot not found' });

    // Update fields
    if (subject) slot.subject = subject;
    if (room) slot.room = room;
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;

    await timetable.save();

    // Also update faculty timetable if faculty is assigned
    if (slot.faculty) {
      await Faculty.updateOne(
        { _id: slot.faculty, 'timetable.day': day, 'timetable.slot': slotNumber },
        { $set: { 'timetable.$.subject': subject, 'timetable.$.room': room, 'timetable.$.startTime': startTime, 'timetable.$.endTime': endTime } }
      );
    }

    res.json({ msg: 'Slot updated successfully', slot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};