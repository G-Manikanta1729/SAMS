const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getDashboard,
  getAttendance,
  getMarks,
  getTimetable,
  getNotifications,
  getDailyAttendance
} = require('../controllers/studentController');

// All routes require authentication
router.use(auth);

// @route   GET api/students/dashboard
// @desc    Get student dashboard
router.get('/dashboard', getDashboard);

// @route   GET api/students/attendance
// @desc    Get attendance with alerts
router.get('/attendance', getAttendance);

router.get('/attendance/daily', getDailyAttendance);

// @route   GET api/students/marks
// @desc    Get marks with calculations
router.get('/marks', getMarks);

// @route   GET api/students/timetable
// @desc    Get student timetable
router.get('/timetable', getTimetable);

// @route   GET api/students/notifications
// @desc    Get notifications
router.get('/notifications', getNotifications);

module.exports = router;