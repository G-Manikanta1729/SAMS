const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  branch: {
    type: String,
    required: true,
    enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isDeleted: { type: Boolean, default: false },
  attendance: [{
    subject: String,
    attended: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  }],
  marks: {
    mid1: {
      type: Map,
      of: new mongoose.Schema({
        descriptive: Number,
        objective: Number,
        assignment: Number,
        total: Number
      }, { _id: false })
    },
    mid2: {
      type: Map,
      of: new mongoose.Schema({
        descriptive: Number,
        objective: Number,
        assignment: Number,
        total: Number
      }, { _id: false })
    },
    external: {
      type: Map,
      of: Number
    }
  },
  internalMarks: {
    type: Map,
    of: Number
  },
  finalMarks: {
    type: Map,
    of: Number
  },
  notifications: [{
    message: String,
    type: { type: String, enum: ['attendance', 'marks', 'timetable', 'general'] },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate attendance percentage
studentSchema.methods.calculateAttendance = function() {
  this.attendance.forEach(record => {
    if (record.total > 0) {
      record.percentage = (record.attended / record.total) * 100;
    }
  });
};

// Calculate internal marks (80-20 rule)
studentSchema.methods.calculateInternalMarks = function() {
  const subjects = [...this.marks.mid1.keys()];
  
  subjects.forEach(subject => {
    const mid1 = this.marks.mid1.get(subject) || { total: 0 };
    const mid2 = this.marks.mid2.get(subject) || { total: 0 };
    
    // Best mid gets 80%, other gets 20%
    if (mid1.total >= mid2.total) {
      this.internalMarks.set(subject, (0.8 * mid1.total) + (0.2 * mid2.total));
    } else {
      this.internalMarks.set(subject, (0.8 * mid2.total) + (0.2 * mid1.total));
    }
  });
};

// Calculate final marks
studentSchema.methods.calculateFinalMarks = function() {
  const subjects = [...this.internalMarks.keys()];
  
  subjects.forEach(subject => {
    const internal = this.internalMarks.get(subject) || 0;
    const external = this.marks.external.get(subject) || 0;
    this.finalMarks.set(subject, internal + external);
  });
};

module.exports = mongoose.model('Student', studentSchema);