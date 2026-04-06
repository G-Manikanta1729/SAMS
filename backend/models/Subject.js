const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  branch: { type: String, required: true, enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'] },
  semester: { type: Number, required: true, min: 1, max: 8 },
  credits: { type: Number, default: 3 },
  slotsPerWeek: { type: Number, default: 4 },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema);