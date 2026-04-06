const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Timetable = require('../models/Timetable');
require('dotenv').config();

const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const academicYear = '2024-2025';

const ensureSubjects = async (branch, semester) => {
  let subjects = await Subject.find({ branch, semester, isDeleted: false });
  if (subjects.length < 5) {
    for (let i = subjects.length + 1; i <= 5; i++) {
      const name = `Subject ${i}`;
      const code = `${branch}${semester}${i}`;
      const existing = await Subject.findOne({ code });
      if (!existing) {
        await Subject.create({ name, code, branch, semester, credits: 3, slotsPerWeek: 4 });
      }
    }
    subjects = await Subject.find({ branch, semester });
  }
  return subjects;
};

const ensureFaculty = async (branch) => {
  let faculty = await Faculty.find({ department: branch });
  if (faculty.length === 0) {
    const hashed = await bcrypt.hash('password123', 10);
    const dummy = new Faculty({
      name: `Dummy ${branch}`,
      employeeId: `DUM${branch}001`,
      department: branch,
      email: `dummy.${branch}@college.edu`,
      password: hashed,
      subjects: []
    });
    await dummy.save();
    faculty = [dummy];
  }
  return faculty;
};

const generateTimetableForBranchSem = async (branch, semester) => {
  console.log(`Generating for ${branch} semester ${semester}`);
  const subjects = await ensureSubjects(branch, semester);
  const faculty = await ensureFaculty(branch);
  const fallbackFacultyId = faculty[0]._id;

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const slotsPerDay = 6;
  const rooms = ['A101','A102','A103','B201','B202','B203'];
  const weekSchedule = [];
  let subjectIndex = 0;

  for (const day of days) {
    const daySlots = [];
    for (let slot = 1; slot <= slotsPerDay; slot++) {
      const subject = subjects[subjectIndex % subjects.length];
      subjectIndex++;
      const startHour = 9 + Math.floor((slot-1)/2);
      const startMinute = (slot-1)%2 === 0 ? 0 : 30;
      const endHour = startHour + (startMinute === 0 ? 1 : 0);
      const endMinute = startMinute === 0 ? 30 : 0;
      daySlots.push({
        slotNumber: slot,
        subject: subject.name,
        faculty: fallbackFacultyId,
        room: rooms[Math.floor(Math.random() * rooms.length)],
        startTime: `${startHour.toString().padStart(2,'0')}:${startMinute.toString().padStart(2,'0')}`,
        endTime: `${endHour.toString().padStart(2,'0')}:${endMinute.toString().padStart(2,'0')}`
      });
    }
    weekSchedule.push({ day, slots: daySlots });
  }

  const existing = await Timetable.findOne({ branch, semester, academicYear });
  if (existing) {
    existing.weekSchedule = weekSchedule;
    await existing.save();
  } else {
    const tt = new Timetable({ branch, semester, academicYear, weekSchedule });
    await tt.save();
  }
  console.log(`✅ Saved timetable for ${branch} semester ${semester}`);
};

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/sams');
  console.log('Connected to MongoDB');
  for (const branch of branches) {
    for (let sem = 1; sem <= 8; sem++) {
      await generateTimetableForBranchSem(branch, sem);
    }
  }
  console.log('🎉 All timetables generated successfully!');
  process.exit();
};

run();