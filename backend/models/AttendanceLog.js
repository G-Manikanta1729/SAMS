const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
  branch: { type: String, required: true },
  semester: { type: Number, required: true }
}, { timestamps: true });

// Prevent duplicate entries for same student/subject/date
attendanceLogSchema.index({ studentId: 1, subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);