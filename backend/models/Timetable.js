const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  branch: { type: String, required: true },
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true },
  weekSchedule: [{
    day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
    slots: [{
      slotNumber: Number,
      subject: { type: String, required: true },
      faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
      room: { type: String, required: true },
      startTime: String,
      endTime: String
    }]
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);