const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Mock data
const testStudent = {
  name: "Test Student",
  rollNumber: "TEST001",
  branch: "IT",
  semester: 3,
  email: "test@test.com",
  password: "test123"
};

// Connect to test database before running tests
beforeAll(async () => {
  const testDBURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sams_test';
  await mongoose.connect(testDBURI);
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('SAMS Backend API Tests', () => {
  
  describe('Marks Calculation Logic (80-20 Rule)', () => {
    test('Internal marks should be 80% of best mid + 20% of other mid', () => {
      const mid1 = 25;
      const mid2 = 20;
      const internal = (0.8 * Math.max(mid1, mid2)) + (0.2 * Math.min(mid1, mid2));
      expect(internal).toBe(24);
    });

    test('Internal marks should never exceed 30', () => {
      const mid1 = 30;
      const mid2 = 30;
      const internal = (0.8 * mid1) + (0.2 * mid2);
      expect(internal).toBe(30);
    });
  });

  describe('Attendance Alert Logic', () => {
    test('Should trigger alert when attendance < 75%', () => {
      const attended = 30;
      const total = 50;
      const percentage = (attended / total) * 100;
      const isLow = percentage < 75;
      expect(isLow).toBe(true);
    });

    test('Should calculate required classes to reach 75%', () => {
      const attended = 30;
      const total = 50;
      const required = Math.ceil((0.75 * total - attended) / 0.25);
      expect(required).toBe(30);
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register/student - should register a new student', async () => {
      const res = await request(app)
        .post('/api/auth/register/student')
        .send(testStudent);
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('role', 'student');
    });

    test('POST /api/auth/login - should login with correct credentials', async () => {
      // First register
      await request(app).post('/api/auth/register/student').send(testStudent);
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@test.com",
          password: "test123",
          role: "student"
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('POST /api/auth/login - should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@test.com",
          password: "wrongpassword",
          role: "student"
        });
      expect(res.statusCode).toBe(401);
    });
  });
});
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Mock data
const testStudent = {
  name: "Test Student",
  rollNumber: "TEST001",
  branch: "IT",
  semester: 3,
  email: "test@test.com",
  password: "test123"
};

// Connect to test database before running tests
beforeAll(async () => {
  const testDBURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sams_test';
  await mongoose.connect(testDBURI);
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('SAMS Backend API Tests', () => {
  
  describe('Marks Calculation Logic (80-20 Rule)', () => {
    test('Internal marks should be 80% of best mid + 20% of other mid', () => {
      const mid1 = 25;
      const mid2 = 20;
      const internal = (0.8 * Math.max(mid1, mid2)) + (0.2 * Math.min(mid1, mid2));
      expect(internal).toBe(24);
    });

    test('Internal marks should never exceed 30', () => {
      const mid1 = 30;
      const mid2 = 30;
      const internal = (0.8 * mid1) + (0.2 * mid2);
      expect(internal).toBe(30);
    });
  });

  describe('Attendance Alert Logic', () => {
    test('Should trigger alert when attendance < 75%', () => {
      const attended = 30;
      const total = 50;
      const percentage = (attended / total) * 100;
      const isLow = percentage < 75;
      expect(isLow).toBe(true);
    });

    test('Should calculate required classes to reach 75%', () => {
      const attended = 30;
      const total = 50;
      const required = Math.ceil((0.75 * total - attended) / 0.25);
      expect(required).toBe(30);
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register/student - should register a new student', async () => {
      const res = await request(app)
        .post('/api/auth/register/student')
        .send(testStudent);
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('role', 'student');
    });

    test('POST /api/auth/login - should login with correct credentials', async () => {
      // First register
      await request(app).post('/api/auth/register/student').send(testStudent);
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@test.com",
          password: "test123",
          role: "student"
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('POST /api/auth/login - should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@test.com",
          password: "wrongpassword",
          role: "student"
        });
      expect(res.statusCode).toBe(401);
    });
  });
  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });
});

