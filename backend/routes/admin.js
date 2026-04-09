const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subject = require('../models/Subject'); // <-- ADD THIS
const {
  addStudent,
  addFaculty,
  addSubject,
  generateTimetable,
  getStudents,
  getFaculty,
  updateStudent,
  softDeleteStudent,
  hardDeleteStudent,
  restoreStudent,
  updateFaculty,
  softDeleteFaculty,
  hardDeleteFaculty,
  restoreFaculty,
  updateSubject,
  softDeleteSubject,
  hardDeleteSubject,
  restoreSubject,
  getAllTimetables,
  deleteTimetable,
  overrideTimetableSlot,
  addTimetableSlot,
  getSubjects   // make sure you have this
} = require('../controllers/adminController');

router.use(auth);

router.post('/student', addStudent);
router.post('/faculty', addFaculty);
router.post('/subject', addSubject);
router.post('/timetable/generate', generateTimetable);
router.get('/students', getStudents);
router.get('/faculty', getFaculty);

// ✅ Fixed /subjects route
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find();
    console.log(`[Admin] Found ${subjects.length} subjects`);
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Student edit/delete/restore
router.put('/student/:id', updateStudent);
router.delete('/student/soft/:id', softDeleteStudent);
router.delete('/student/hard/:id', hardDeleteStudent);
router.put('/student/restore/:id', restoreStudent);

// Faculty edit/delete/restore
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/soft/:id', softDeleteFaculty);
router.delete('/faculty/hard/:id', hardDeleteFaculty);
router.put('/faculty/restore/:id', restoreFaculty);

// Subject edit/delete/restore
router.put('/subject/:id', updateSubject);
router.delete('/subject/soft/:id', softDeleteSubject);
router.delete('/subject/hard/:id', hardDeleteSubject);
router.put('/subject/restore/:id', restoreSubject);

// Get all timetables
router.get('/timetables', getAllTimetables);
// Delete a timetable
router.delete('/timetable/:branch/:semester', deleteTimetable);

router.post('/timetable/override', overrideTimetableSlot);

router.post('/timetable/add-slot', addTimetableSlot);

// @route   POST api/admin/timetable/override
// @desc    Admin override to modify a specific slot
router.post('/timetable/override', auth, async (req, res) => {
  try {
    const { branch, semester, day, slotNumber, subject, room, startTime, endTime } = req.body;
    const timetable = await Timetable.findOne({ branch, semester, isActive: true });
    if (!timetable) return res.status(404).json({ msg: 'Timetable not found' });

    const daySchedule = timetable.weekSchedule.find(d => d.day === day);
    if (!daySchedule) return res.status(404).json({ msg: 'Day not found' });

    const slot = daySchedule.slots.find(s => s.slotNumber === slotNumber);
    if (!slot) return res.status(404).json({ msg: 'Slot not found' });

    // Update slot
    if (subject) slot.subject = subject;
    if (room) slot.room = room;
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;

    await timetable.save();

    // Also update faculty timetables (remove old, add new)
    // For simplicity, we can regenerate faculty timetables or update selectively
    // We'll update the faculty assigned to this slot
    if (slot.faculty) {
      await Faculty.updateOne(
        { _id: slot.faculty, 'timetable.day': day, 'timetable.slot': slotNumber },
        { $set: { 'timetable.$.subject': subject, 'timetable.$.room': room, 'timetable.$.startTime': startTime, 'timetable.$.endTime': endTime } }
      );
    }

    res.json({ msg: 'Timetable updated successfully', slot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/admin/timetable/delete-slot
// @desc    Delete a specific slot from timetable
router.post('/timetable/delete-slot', auth, async (req, res) => {
  try {
    const { branch, semester, day, slotNumber } = req.body;
    const timetable = await Timetable.findOne({ branch, semester, isActive: true });
    if (!timetable) return res.status(404).json({ msg: 'Timetable not found' });

    const daySchedule = timetable.weekSchedule.find(d => d.day === day);
    if (!daySchedule) return res.status(404).json({ msg: 'Day not found' });

    const slotIndex = daySchedule.slots.findIndex(s => s.slotNumber === slotNumber);
    if (slotIndex === -1) return res.status(404).json({ msg: 'Slot not found' });

    // Remove the slot
    daySchedule.slots.splice(slotIndex, 1);
    await timetable.save();

    res.json({ msg: 'Slot deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;