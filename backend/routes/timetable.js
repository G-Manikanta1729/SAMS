const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

// @route   GET api/timetable
// @desc    Get timetable for specific branch and semester
// @access  Public (but with role-based filtering)
router.get('/', async (req, res) => {
  try {
    const { branch, semester, academicYear } = req.query;
    
    let query = { isActive: true };
    if (branch) query.branch = branch;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    
    const timetable = await Timetable.findOne(query)
      .populate('weekSchedule.slots.faculty', 'name employeeId');
    
    if (!timetable) {
      return res.status(404).json({ msg: 'Timetable not found for the given criteria' });
    }
    
    res.json(timetable);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timetable/faculty/:facultyId
// @desc    Get timetable for specific faculty
// @access  Private
router.get('/faculty/:facultyId', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.facultyId)
      .select('timetable name employeeId');
    
    if (!faculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }
    
    // Group timetable by day
    const groupedTimetable = {};
    faculty.timetable.forEach(slot => {
      if (!groupedTimetable[slot.day]) {
        groupedTimetable[slot.day] = [];
      }
      groupedTimetable[slot.day].push(slot);
    });
    
    // Sort slots by slot number
    Object.keys(groupedTimetable).forEach(day => {
      groupedTimetable[day].sort((a, b) => a.slot - b.slot);
    });
    
    res.json({
      faculty: {
        name: faculty.name,
        employeeId: faculty.employeeId
      },
      timetable: groupedTimetable
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timetable/student/:studentId
// @desc    Get timetable for specific student
// @access  Private
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .select('branch semester');
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    const timetable = await Timetable.findOne({
      branch: student.branch,
      semester: student.semester,
      isActive: true
    }).populate('weekSchedule.slots.faculty', 'name');
    
    if (!timetable) {
      return res.status(404).json({ msg: 'Timetable not found' });
    }
    
    res.json(timetable);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timetable/day/:day
// @desc    Get timetable for specific day
// @access  Private
router.get('/day/:day', auth, async (req, res) => {
  try {
    const { day } = req.params;
    const { branch, semester } = req.query;
    
    const timetable = await Timetable.findOne({
      branch,
      semester,
      isActive: true
    }).populate('weekSchedule.slots.faculty', 'name');
    
    if (!timetable) {
      return res.status(404).json({ msg: 'Timetable not found' });
    }
    
    const daySchedule = timetable.weekSchedule.find(d => d.day === day);
    
    if (!daySchedule) {
      return res.status(404).json({ msg: 'Schedule not found for this day' });
    }
    
    res.json(daySchedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timetable/current
// @desc    Get current day's timetable
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const { branch, semester } = req.query;
    
    const timetable = await Timetable.findOne({
      branch,
      semester,
      isActive: true
    }).populate('weekSchedule.slots.faculty', 'name');
    
    if (!timetable) {
      return res.status(404).json({ msg: 'Timetable not found' });
    }
    
    const todaySchedule = timetable.weekSchedule.find(d => d.day === today);
    
    if (!todaySchedule) {
      return res.status(404).json({ msg: 'No classes scheduled for today' });
    }
    
    // Get current time to show upcoming/ongoing classes
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    const enhancedSlots = todaySchedule.slots.map(slot => {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      let status = 'upcoming';
      if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
        status = 'ongoing';
      } else if (currentTimeInMinutes > endTimeInMinutes) {
        status = 'completed';
      }
      
      return {
        ...slot.toObject(),
        status
      };
    });
    
    res.json({
      day: today,
      date: new Date().toISOString().split('T')[0],
      slots: enhancedSlots
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/timetable/swap/request
// @desc    Request a timetable swap between faculty
// @access  Private (Faculty only)
router.post('/swap/request', auth, async (req, res) => {
  try {
    const { 
      requestedToId, 
      originalSlot: { day: originalDay, slot: originalSlotNumber, subject, branch, semester, room },
      requestedSlot: { day: requestedDay, slot: requestedSlotNumber }
    } = req.body;
    
    // Check if both faculty exist
    const requestingFaculty = await Faculty.findById(req.user.id);
    const targetFaculty = await Faculty.findById(requestedToId);
    
    if (!requestingFaculty || !targetFaculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }
    
    // Verify that the requesting faculty actually has the original slot
    const hasOriginalSlot = requestingFaculty.timetable.some(
      slot => slot.day === originalDay && 
              slot.slot === originalSlotNumber &&
              slot.subject === subject
    );
    
    if (!hasOriginalSlot) {
      return res.status(400).json({ msg: 'You do not have this slot in your timetable' });
    }
    
    // Verify that the target faculty has the requested slot
    const hasRequestedSlot = targetFaculty.timetable.some(
      slot => slot.day === requestedDay && 
              slot.slot === requestedSlotNumber
    );
    
    if (!hasRequestedSlot) {
      return res.status(400).json({ msg: 'Target faculty does not have this slot' });
    }
    
    // Create swap request
    const swapRequest = {
      requestedBy: req.user.id,
      requestedTo: requestedToId,
      originalSlot: {
        day: originalDay,
        slot: originalSlotNumber,
        subject,
        branch,
        semester,
        room
      },
      requestedSlot: {
        day: requestedDay,
        slot: requestedSlotNumber,
        subject: targetFaculty.timetable.find(
          s => s.day === requestedDay && s.slot === requestedSlotNumber
        )?.subject,
        branch: targetFaculty.timetable.find(
          s => s.day === requestedDay && s.slot === requestedSlotNumber
        )?.branch,
        semester: targetFaculty.timetable.find(
          s => s.day === requestedDay && s.slot === requestedSlotNumber
        )?.semester
      },
      status: 'pending',
      createdAt: new Date()
    };
    
    // Add to target faculty's swap requests
    targetFaculty.swapRequests.push(swapRequest);
    await targetFaculty.save();
    
    // Add notification for target faculty
    targetFaculty.notifications.unshift({
      message: `🔄 ${requestingFaculty.name} requested to swap ${originalDay} slot ${originalSlotNumber} with your ${requestedDay} slot ${requestedSlotNumber}`,
      type: 'swap',
      read: false,
      createdAt: new Date()
    });
    await targetFaculty.save();
    
    res.json({ 
      msg: 'Swap request sent successfully',
      requestId: targetFaculty.swapRequests[targetFaculty.swapRequests.length - 1]._id
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/timetable/swap/respond/:requestId
// @desc    Accept or reject a swap request
// @access  Private (Faculty only)
router.post('/swap/respond/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { accept } = req.body;
    
    const faculty = await Faculty.findById(req.user.id);
    
    if (!faculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }
    
    const request = faculty.swapRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({ msg: 'Swap request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ msg: 'This request has already been processed' });
    }
    
    request.status = accept ? 'accepted' : 'rejected';
    
    if (accept) {
      const requestingFaculty = await Faculty.findById(request.requestedBy);
      
      if (!requestingFaculty) {
        return res.status(404).json({ msg: 'Requesting faculty not found' });
      }
      
      // Find the slots to swap
      const requestingSlotIndex = requestingFaculty.timetable.findIndex(
        slot => slot.day === request.originalSlot.day && 
                slot.slot === request.originalSlot.slot
      );
      
      const currentSlotIndex = faculty.timetable.findIndex(
        slot => slot.day === request.requestedSlot.day && 
                slot.slot === request.requestedSlot.slot
      );
      
      if (requestingSlotIndex === -1 || currentSlotIndex === -1) {
        return res.status(400).json({ msg: 'One of the slots no longer exists' });
      }
      
      // Store the slots
      const requestingSlot = { ...requestingFaculty.timetable[requestingSlotIndex] };
      const currentSlot = { ...faculty.timetable[currentSlotIndex] };
      
      // Perform the swap in requesting faculty's timetable
      requestingFaculty.timetable[requestingSlotIndex] = {
        ...currentSlot,
        faculty: requestingFaculty._id
      };
      
      // Perform the swap in current faculty's timetable
      faculty.timetable[currentSlotIndex] = {
        ...requestingSlot,
        faculty: faculty._id
      };
      
      await requestingFaculty.save();
      await faculty.save();
      
      // Update the main timetable
      const mainTimetable = await Timetable.findOne({
        branch: request.originalSlot.branch,
        semester: request.originalSlot.semester,
        isActive: true
      });
      
      if (mainTimetable) {
        // Update original slot
        const originalDay = mainTimetable.weekSchedule.find(
          d => d.day === request.originalSlot.day
        );
        if (originalDay) {
          const originalSlot = originalDay.slots.find(
            s => s.slotNumber === request.originalSlot.slot
          );
          if (originalSlot) {
            originalSlot.faculty = faculty._id;
          }
        }
        
        // Update requested slot
        const requestedDay = mainTimetable.weekSchedule.find(
          d => d.day === request.requestedSlot.day
        );
        if (requestedDay) {
          const requestedSlot = requestedDay.slots.find(
            s => s.slotNumber === request.requestedSlot.slot
          );
          if (requestedSlot) {
            requestedSlot.faculty = request.requestedBy;
          }
        }
        
        await mainTimetable.save();
      }
      
      // Notify requesting faculty
      requestingFaculty.notifications.unshift({
        message: `✅ Your swap request for ${request.originalSlot.day} slot ${request.originalSlot.slot} was accepted by ${faculty.name}`,
        type: 'swap',
        read: false,
        createdAt: new Date()
      });
      await requestingFaculty.save();
      
      // Notify all students in affected branches
      const affectedBranches = [request.originalSlot.branch, request.requestedSlot.branch];
      const affectedSemesters = [request.originalSlot.semester, request.requestedSlot.semester];
      
      for (let i = 0; i < affectedBranches.length; i++) {
        const students = await Student.find({
          branch: affectedBranches[i],
          semester: affectedSemesters[i]
        });
        
        for (const student of students) {
          student.notifications.unshift({
            message: `🔄 Timetable update: ${request.originalSlot.day} ${request.originalSlot.slot} period has been swapped`,
            type: 'timetable',
            read: false,
            createdAt: new Date()
          });
          await student.save();
        }
      }
    }
    
    await faculty.save();
    
    res.json({ 
      msg: accept ? 'Swap accepted and executed' : 'Swap rejected',
      request
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timetable/swap/requests
// @desc    Get all pending swap requests for a faculty
// @access  Private (Faculty only)
router.get('/swap/requests', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id)
      .populate('swapRequests.requestedBy', 'name employeeId')
      .populate('swapRequests.requestedTo', 'name employeeId');
    
    if (!faculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }
    
    const pendingRequests = faculty.swapRequests.filter(r => r.status === 'pending');
    const acceptedRequests = faculty.swapRequests.filter(r => r.status === 'accepted');
    const rejectedRequests = faculty.swapRequests.filter(r => r.status === 'rejected');
    
    res.json({
      pending: pendingRequests,
      accepted: acceptedRequests,
      rejected: rejectedRequests,
      total: faculty.swapRequests.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timetable/availability
// @desc    Check faculty availability for a given slot
// @access  Private (Admin only)
router.get('/availability', auth, async (req, res) => {
  try {
    const { facultyId, day, slot } = req.query;
    
    const faculty = await Faculty.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }
    
    const isBusy = faculty.timetable.some(
      s => s.day === day && s.slot === parseInt(slot)
    );
    
    res.json({
      facultyId,
      facultyName: faculty.name,
      day,
      slot,
      available: !isBusy
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/timetable/override
// @desc    Admin override to manually modify timetable
// @access  Private (Admin only)
router.post('/override', auth, async (req, res) => {
  try {
    const { branch, semester, day, slotNumber, subject, facultyId, room } = req.body;
    
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    
    const timetable = await Timetable.findOne({
      branch,
      semester,
      isActive: true
    });
    
    if (!timetable) {
      return res.status(404).json({ msg: 'Timetable not found' });
    }
    
    const daySchedule = timetable.weekSchedule.find(d => d.day === day);
    
    if (!daySchedule) {
      return res.status(404).json({ msg: 'Day not found in timetable' });
    }
    
    const slot = daySchedule.slots.find(s => s.slotNumber === slotNumber);
    
    if (!slot) {
      return res.status(404).json({ msg: 'Slot not found' });
    }
    
    // Update the slot
    slot.subject = subject;
    slot.faculty = facultyId;
    slot.room = room;
    
    await timetable.save();
    
    // Update faculty timetables
    const oldFaculty = await Faculty.findById(slot.faculty);
    const newFaculty = await Faculty.findById(facultyId);
    
    if (oldFaculty) {
      // Remove from old faculty
      oldFaculty.timetable = oldFaculty.timetable.filter(
        s => !(s.day === day && s.slot === slotNumber)
      );
      await oldFaculty.save();
      
      // Notify old faculty
      oldFaculty.notifications.unshift({
        message: `📅 Admin modified your ${day} slot ${slotNumber}`,
        type: 'timetable',
        read: false,
        createdAt: new Date()
      });
      await oldFaculty.save();
    }
    
    if (newFaculty) {
      // Add to new faculty
      newFaculty.timetable.push({
        day,
        slot: slotNumber,
        subject,
        branch,
        semester,
        room
      });
      await newFaculty.save();
      
      // Notify new faculty
      newFaculty.notifications.unshift({
        message: `📅 You have been assigned a new class on ${day} slot ${slotNumber}: ${subject}`,
        type: 'timetable',
        read: false,
        createdAt: new Date()
      });
      await newFaculty.save();
    }
    
    // Notify students
    const students = await Student.find({ branch, semester });
    for (const student of students) {
      student.notifications.unshift({
        message: `📅 Timetable updated for ${day} slot ${slotNumber}`,
        type: 'timetable',
        read: false,
        createdAt: new Date()
      });
      await student.save();
    }
    
    res.json({ msg: 'Timetable updated successfully', slot });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/timetable/export
// @desc    Export timetable as JSON or CSV
// @access  Private (Admin only)
router.post('/export', auth, async (req, res) => {
  try {
    const { branch, semester, format = 'json' } = req.body;
    
    const timetable = await Timetable.findOne({
      branch,
      semester,
      isActive: true
    }).populate('weekSchedule.slots.faculty', 'name');
    
    if (!timetable) {
      return res.status(404).json({ msg: 'Timetable not found' });
    }
    
    if (format === 'csv') {
      // Generate CSV
      let csv = 'Day,Slot,Subject,Faculty,Room,Start Time,End Time\n';
      
      timetable.weekSchedule.forEach(day => {
        day.slots.forEach(slot => {
          csv += `${day.day},${slot.slotNumber},${slot.subject},${slot.faculty?.name || 'TBD'},${slot.room},${slot.startTime},${slot.endTime}\n`;
        });
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=timetable_${branch}_sem${semester}.csv`);
      return res.send(csv);
    }
    
    // Default: JSON
    res.json(timetable);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;