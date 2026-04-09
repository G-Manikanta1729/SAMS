const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
require('dotenv').config();

// ==================== CONFIGURATION ====================
const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const STUDENTS_PER_BRANCH = 60;
const FACULTY_PER_BRANCH = 12;

// Name pools
const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Aditya', 'Sai', 'Pooja', 'Rahul', 'Priya',
  'Karthik', 'Sneha', 'Rohan', 'Meera', 'Arjun', 'Neha', 'Vikram', 'Anjali', 'Kunal', 'Divya'
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Reddy', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Joshi', 'Nair', 'Menon',
  'Rao', 'Naidu', 'Shetty', 'Iyer', 'Malhotra', 'Kapoor', 'Choudhary', 'Mishra', 'Tripathi', 'Yadav'
];

// Subjects per branch (realistic – each branch has 15 subjects)
const SUBJECTS_BY_BRANCH = {
  CSE: [
    'Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems',
    'Computer Networks', 'Software Engineering', 'Web Technologies', 'Machine Learning',
    'Artificial Intelligence', 'Cloud Computing', 'Cybersecurity', 'Big Data',
    'Internet of Things', 'Blockchain', 'DevOps'
  ],
  IT: [
    'Programming Fundamentals', 'Data Structures', 'Web Development', 'Database Management',
    'Computer Networks', 'Software Testing', 'Mobile App Development', 'Cloud Computing',
    'Information Security', 'Data Mining', 'UI/UX Design', 'IT Project Management',
    'E-commerce', 'Digital Marketing', 'Big Data Analytics'
  ],
  ECE: [
    'Analog Circuits', 'Digital Electronics', 'Signals & Systems', 'Microprocessors',
    'Communication Systems', 'VLSI Design', 'Embedded Systems', 'Digital Signal Processing',
    'Control Systems', 'Microwave Engineering', 'Optical Communication', 'Wireless Communication',
    'IoT', 'Robotics', 'Medical Electronics'
  ],
  EEE: [
    'Circuit Theory', 'Electrical Machines', 'Power Systems', 'Control Systems',
    'Power Electronics', 'Renewable Energy', 'High Voltage Engineering', 'Switchgear & Protection',
    'Electric Vehicles', 'Smart Grid', 'HVDC', 'FACTS', 'Energy Management',
    'Electrical Safety', 'Industrial Drives'
  ],
  MECH: [
    'Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Manufacturing Processes',
    'Machine Design', 'Heat Transfer', 'IC Engines', 'CAD/CAM', 'Robotics',
    'Mechatronics', 'Refrigeration & Air Conditioning', 'Automobile Engineering',
    'Composite Materials', 'Finite Element Analysis', 'Additive Manufacturing'
  ],
  CIVIL: [
    'Surveying', 'Structural Analysis', 'Geotechnical Engineering', 'Fluid Mechanics',
    'Transportation Engineering', 'Environmental Engineering', 'Construction Management',
    'Reinforced Concrete Structures', 'Steel Structures', 'Hydrology', 'Water Resources Engineering',
    'Building Materials', 'Earthquake Engineering', 'Project Planning', 'Quantity Surveying'
  ]
};

// Helper: random item
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: random semester 1-8
const randomSemester = () => Math.floor(Math.random() * 8) + 1;

// Generate roll number
const generateRollNumber = (branch, index) => {
  const branchCode = { CSE: 'CS', IT: 'IT', ECE: 'EC', EEE: 'EE', MECH: 'ME', CIVIL: 'CE' }[branch];
  return `2024${branchCode}${String(index + 1).padStart(3, '0')}`;
};

// Generate employee ID
const generateEmployeeId = (branch, index) => `FAC-${branch}-${String(index + 1).padStart(3, '0')}`;

// Generate unique email for faculty
const generateUniqueFacultyEmail = (branch, index, usedEmails) => {
  let counter = 0;
  let email;
  do {
    const f = randomItem(FIRST_NAMES);
    const l = randomItem(LAST_NAMES);
    email = counter === 0 ? `${f.toLowerCase()}.${l.toLowerCase()}@${branch.toLowerCase()}.edu` : `${f.toLowerCase()}.${l.toLowerCase()}${counter}@${branch.toLowerCase()}.edu`;
    counter++;
  } while (usedEmails.has(email));
  usedEmails.add(email);
  return email;
};

// Pick random subjects for a faculty (4-6 subjects)
const pickSubjectsForFaculty = (branch) => {
  const pool = SUBJECTS_BY_BRANCH[branch];
  if (!pool) return [];
  const num = Math.floor(Math.random() * 3) + 4;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, num).map((name, idx) => ({
    name,
    code: `${branch}${String(idx + 1).padStart(3, '0')}`,
    branch,
    semester: randomSemester()
  }));
};

// ==================== MAIN ====================
const populateData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sams');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('⚠️  Clearing existing students, faculty, subjects...');
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Subject.deleteMany({});
    console.log('✅ Cleared');

    // 1. Insert Students (360)
    console.log('\n📚 Inserting students...');
    let studentCount = 0;
    for (const branch of BRANCHES) {
      for (let i = 0; i < STUDENTS_PER_BRANCH; i++) {
        const f = randomItem(FIRST_NAMES);
        const l = randomItem(LAST_NAMES);
        const name = `${f} ${l}`;
        const roll = generateRollNumber(branch, i);
        const email = `${f.toLowerCase()}.${l.toLowerCase()}${i+1}@${branch.toLowerCase()}.edu`;
        const sem = randomSemester();
        const hashed = await bcrypt.hash('password123', 10);
        const student = new Student({
          name, rollNumber: roll, branch, semester: sem, email,
          password: hashed, attendance: [],
          marks: { mid1: new Map(), mid2: new Map(), external: new Map() },
          internalMarks: new Map(), finalMarks: new Map(), notifications: []
        });
        await student.save();
        studentCount++;
      }
      console.log(`   ${branch}: ${STUDENTS_PER_BRANCH} students`);
    }
    console.log(`✅ Total students: ${studentCount}`);

    // 2. Insert Faculty (72) and their subjects
    console.log('\n👨‍🏫 Inserting faculty...');
    let facultyCount = 0;
    const usedFacultyEmails = new Set();
    for (const branch of BRANCHES) {
      for (let i = 0; i < FACULTY_PER_BRANCH; i++) {
        const title = randomItem(['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.']);
        const f = randomItem(FIRST_NAMES);
        const l = randomItem(LAST_NAMES);
        const name = `${title} ${f} ${l}`;
        const empId = generateEmployeeId(branch, i);
        const email = generateUniqueFacultyEmail(branch, i, usedFacultyEmails);
        const hashed = await bcrypt.hash('password123', 10);
        const subjects = pickSubjectsForFaculty(branch);
        const faculty = new Faculty({
          name, employeeId: empId, department: branch, email,
          password: hashed, subjects, timetable: [], swapRequests: [], notifications: []
        });
        await faculty.save();
        facultyCount++;
      }
      console.log(`   ${branch}: ${FACULTY_PER_BRANCH} faculty`);
    }
    console.log(`✅ Total faculty: ${facultyCount}`);

    // 3. ✅ CRITICAL FIX: Create subjects for ALL semesters (1-8) for each branch
    console.log('\n📖 Creating subjects for all semesters (1-8) for each branch...');
    let subjectCount = 0;
    for (const branch of BRANCHES) {
      const pool = SUBJECTS_BY_BRANCH[branch];
      if (!pool) continue;
      // Distribute the 15 subjects across 8 semesters (first 5 semesters get 2 each, last 3 get 1 each, etc.)
      // Simpler: assign subjects cyclically or just take first 2 per semester for demonstration.
      // But to ensure each semester has at least 1 subject, we'll assign sequentially.
      for (let sem = 1; sem <= 8; sem++) {
        // Take 2 subjects per semester (except last few may have fewer)
        const startIdx = (sem - 1) * 2;
        const endIdx = startIdx + 2;
        const semSubjects = pool.slice(startIdx, endIdx);
        for (let idx = 0; idx < semSubjects.length; idx++) {
          const name = semSubjects[idx];
          const code = `${branch}${String(sem).padStart(2,'0')}${String(idx+1).padStart(2,'0')}`;
          const existing = await Subject.findOne({ code });
          if (!existing) {
            await Subject.create({
              name, code, branch, semester: sem, credits: 3, slotsPerWeek: 4
            });
            subjectCount++;
          }
        }
      }
      console.log(`   ${branch}: subjects created for all 8 semesters`);
    }
    console.log(`✅ Total subjects created (new): ${subjectCount}`);

    // Final summary
    const finalStudents = await Student.countDocuments();
    const finalFaculty = await Faculty.countDocuments();
    const finalSubjects = await Subject.countDocuments();
    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`   Students: ${finalStudents}`);
    console.log(`   Faculty: ${finalFaculty}`);
    console.log(`   Subjects: ${finalSubjects}`);
    console.log('\n🎉 Database population completed successfully!');
    console.log('🔑 All passwords: password123');
    console.log('👑 Admin: admin@college.edu / admin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error populating data:', err);
    process.exit(1);
  }
};

populateData();