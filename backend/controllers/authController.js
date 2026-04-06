const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');

// Register Student
exports.registerStudent = async (req, res) => {
  try {
    const { name, rollNumber, branch, semester, email, password } = req.body;

    // Validate required fields
    if (!name || !rollNumber || !branch || !semester || !email || !password) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Check if student exists
    let student = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (student) {
      return res.status(400).json({ msg: 'Student already exists' });
    }

    // Create new student
    student = new Student({
      name,
      rollNumber,
      branch,
      semester,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(password, salt);
    
    // Initialize empty structures
    student.attendance = [];
    student.marks = {
      mid1: new Map(),
      mid2: new Map(),
      external: new Map()
    };
    student.internalMarks = new Map();
    student.finalMarks = new Map();
    student.notifications = [];

    await student.save();

    // Create JWT
    const payload = {
      user: {
        id: student.id,
        role: 'student'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: student.id, 
            name: student.name, 
            role: 'student',
            email: student.email
          } 
        });
      }
    );
  } catch (err) {
    console.error('Register student error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Register Faculty
exports.registerFaculty = async (req, res) => {
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

    // ✅ NEW: Create subjects in Subject collection if they don't exist
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

    const payload = { user: { id: faculty.id, role: 'faculty' } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: faculty.id, name: faculty.name, role: 'faculty', email: faculty.email } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log('Login attempt:', { email, role }); // Debug log

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ 
        msg: 'Please provide email, password and role',
        received: { email: !!email, password: !!password, role: !!role }
      });
    }

    let user;
    let userRole = role;

    // Admin login
    if (role === 'admin') {
      if (email === 'admin@college.edu' && password === 'admin123') {
        const payload = {
          user: {
            id: 'admin',
            role: 'admin'
          }
        };
        
        jwt.sign(
          payload,
          process.env.JWT_SECRET || 'your_jwt_secret_key_here',
          { expiresIn: '7d' },
          (err, token) => {
            if (err) throw err;
            return res.json({ 
              token, 
              user: { 
                id: 'admin', 
                name: 'Admin', 
                role: 'admin',
                email: 'admin@college.edu'
              } 
            });
          }
        );
        return;
      } else {
        return res.status(401).json({ msg: 'Invalid admin credentials' });
      }
    }

    // Student login
    if (role === 'student') {
      user = await Student.findOne({ email });
      if (!user) {
        console.log('Student not found:', email);
        return res.status(401).json({ msg: 'Invalid credentials' });
      }
    } 
    // Faculty login
    else if (role === 'faculty') {
      user = await Faculty.findOne({ email });
      if (!user) {
        console.log('Faculty not found:', email);
        return res.status(401).json({ msg: 'Invalid credentials' });
      }
    } 
    else {
      return res.status(400).json({ msg: 'Invalid role. Must be student, faculty, or admin' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        role: userRole
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            role: userRole,
            email: user.email
          } 
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};