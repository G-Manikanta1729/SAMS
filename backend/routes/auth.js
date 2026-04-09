const express = require('express');
const router = express.Router();
const { registerStudent, registerFaculty, login } = require('../controllers/authController');
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// @route   POST api/auth/register/student
router.post('/register/student', registerStudent);

// @route   POST api/auth/register/faculty
router.post('/register/faculty', registerFaculty);

// @route   POST api/auth/login
router.post('/login', login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.id).select('-password');
      if (!student) {
        return res.status(404).json({ msg: 'Student not found' });
      }
      res.json({ ...student.toObject(), role: 'student' });
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findById(req.user.id).select('-password');
      if (!faculty) {
        return res.status(404).json({ msg: 'Faculty not found' });
      }
      res.json({ ...faculty.toObject(), role: 'faculty' });
    } else if (req.user.role === 'admin') {
      res.json({ name: 'Admin', role: 'admin' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;