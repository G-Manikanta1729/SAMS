const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
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
  department: {
    type: String,
    required: true
  },
  subjects: [{
    name: String,
    code: String,
    branch: String,
    semester: Number
  }],
  timetable: [{
    day: String,
    slot: Number,
    subject: String,
    branch: String,
    room: String,
    semester: Number
  }],
  swapRequests: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    requestedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    originalSlot: {
      day: String,
      slot: Number,
      subject: String,
      branch: String
    },
    requestedSlot: {
      day: String,
      slot: Number,
      subject: String,
      branch: String
    },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  notifications: [{
    message: String,
    type: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Faculty', facultySchema);