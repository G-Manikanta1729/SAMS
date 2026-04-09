const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getDashboard,
  enterMarks,
  enterAttendance,
  requestSwap,
  respondToSwap,
  getTimetable,
   getOutgoingSwapRequests,
  getStudentsByBranchSemester
} = require('../controllers/facultyController');

// All routes require authentication
router.use(auth);

// @route   GET api/faculty/dashboard
router.get('/dashboard', getDashboard);

// @route   POST api/faculty/marks
router.post('/marks', enterMarks);

// @route   POST api/faculty/attendance
router.post('/attendance', enterAttendance);

// @route   POST api/faculty/swap/request
router.post('/swap/request', requestSwap);

// @route   POST api/faculty/swap/respond
router.post('/swap/respond', respondToSwap);

// @route   GET api/faculty/timetable
router.get('/timetable', getTimetable);

router.get('/swap-requests/outgoing', auth, getOutgoingSwapRequests);

router.get('/students', auth, getStudentsByBranchSemester);

module.exports = router;