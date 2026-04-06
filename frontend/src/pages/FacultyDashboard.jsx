import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [timetable, setTimetable] = useState({});
  const [swapRequests, setSwapRequests] = useState([]);

  const [facultyList, setFacultyList] = useState([]);               // all faculty for dropdown
  const [targetFacultyId, setTargetFacultyId] = useState('');       // selected target faculty
  const [mySlots, setMySlots] = useState([]);                       // faculty's own slots
  const [targetSlots, setTargetSlots] = useState([]);               // target faculty's slots
  const [selectedMySlot, setSelectedMySlot] = useState(null);       // {day, slot, subject, branch, semester}
  const [selectedTargetSlot, setSelectedTargetSlot] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [outgoingRequests, setOutgoingRequests] = useState([]);     // requests sent by this faculty

  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('mid1');
  const [studentsList, setStudentsList] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [subjectInfo, setSubjectInfo] = useState({ branch: '', semester: '' });

  const [attendanceSubject, setAttendanceSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchTimetable();
    fetchSwapRequests();
    fetchFacultyList();       // new
    fetchOutgoingRequests();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/faculty/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/faculty/timetable');
      // The backend returns an object grouped by day, e.g., { Monday: [...], Tuesday: [...] }
      setTimetable(res.data);
      prepareMySlots(res.data);
    } catch (err) {
      console.error('Error fetching timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const prepareMySlots = (groupedTimetable) => {
    const slots = [];
    Object.entries(groupedTimetable).forEach(([day, daySlots]) => {
      daySlots.forEach(slot => {
        slots.push({ ...slot, day });
      });
    });
    setMySlots(slots);
  };

  const fetchSwapRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/timetable/swap/requests');
      setSwapRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFacultyList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/faculty', {
        headers: { 'x-auth-token': token }
      });
      // exclude current faculty
      setFacultyList(res.data.filter(f => f._id !== user?.id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOutgoingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/faculty/swap-requests/outgoing', {
        headers: { 'x-auth-token': token }
      });
      setOutgoingRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTargetTimetable = async (facultyId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/timetable/faculty/${facultyId}`, {
        headers: { 'x-auth-token': token }
      });
      // res.data.timetable is grouped by day
      const slots = [];
      Object.entries(res.data.timetable).forEach(([day, daySlots]) => {
        daySlots.forEach(slot => {
          slots.push({ ...slot, day });
        });
      });
      setTargetSlots(slots);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptSwap = async (requestId) => {
    try {
      await axios.post(`http://localhost:5000/api/timetable/swap/respond/${requestId}`, { accept: true });
      alert('Swap accepted');
      fetchSwapRequests();
      fetchTimetable();
    } catch (err) {
      alert('Error accepting swap');
    }
  };

  const handleRejectSwap = async (requestId) => {
    try {
      await axios.post(`http://localhost:5000/api/timetable/swap/respond/${requestId}`, { accept: false });
      alert('Swap rejected');
      fetchSwapRequests();
    } catch (err) {
      alert('Error rejecting swap');
    }
  };

  const loadStudentsForSubject = async () => {
    if (!selectedSubject) return;
    const subject = dashboardData?.subjects?.find(s => s.name === selectedSubject);
    if (!subject) return;
    setSubjectInfo({ branch: subject.branch, semester: subject.semester });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/faculty/students?branch=${subject.branch}&semester=${subject.semester}`, {
        headers: { 'x-auth-token': token }
      });
      setStudentsList(res.data);
      // Initialize marksData with empty values
      const initMarks = {};
      res.data.forEach(student => {
        initMarks[student._id] = { descriptive: '', objective: '', assignment: '', marks: '' };
      });
      setMarksData(initMarks);
    } catch (err) {
      console.error(err);
    }
  };

  const submitMarks = async () => {
    if (!selectedSubject || !examType || studentsList.length === 0) {
      alert('Please select subject and exam type');
      return;
    }
    setLoadingMarks(true);
    try {
      const token = localStorage.getItem('token');
      const marksPayload = studentsList.map(student => {
        const data = marksData[student._id] || {};
        if (examType === 'external') {
          return { rollNumber: student.rollNumber, marks: data.marks || 0 };
        } else {
          return {
            rollNumber: student.rollNumber,
            descriptive: data.descriptive || 0,
            objective: data.objective || 0,
            assignment: data.assignment || 0
          };
        }
      });
      await axios.post('http://localhost:5000/api/faculty/marks', {
        subject: selectedSubject,
        branch: subjectInfo.branch,
        semester: subjectInfo.semester,
        examType,
        marks: marksPayload
      }, { headers: { 'x-auth-token': token } });
      alert('Marks submitted successfully');
    } catch (err) {
      alert('Error submitting marks');
    } finally {
      setLoadingMarks(false);
    }
  };

  const sendSwapRequest = async () => {
    if (!selectedMySlot || !selectedTargetSlot || !targetFacultyId) {
      alert('Please select your slot and target slot');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/timetable/swap/request', {
        requestedToId: targetFacultyId,
        originalSlot: {
          day: selectedMySlot.day,
          slot: selectedMySlot.slot,
          subject: selectedMySlot.subject,
          branch: selectedMySlot.branch,
          semester: selectedMySlot.semester,
          room: selectedMySlot.room
        },
        requestedSlot: {
          day: selectedTargetSlot.day,
          slot: selectedTargetSlot.slot
        }
      }, { headers: { 'x-auth-token': token } });
      alert('Swap request sent');
      setShowRequestModal(false);
      setTargetFacultyId('');
      setSelectedMySlot(null);
      setSelectedTargetSlot(null);
      fetchOutgoingRequests();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetFacultyId) {
      fetchTargetTimetable(targetFacultyId);
    } else {
      setTargetSlots([]);
    }
  }, [targetFacultyId]);

  useEffect(() => {
    if (selectedSubject) {
      loadStudentsForSubject();
    }
  }, [selectedSubject]);
  
  useEffect(() => {
    if (attendanceSubject) {
      loadStudentsForAttendance();
    }
  }, [attendanceSubject]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const loadStudentsForAttendance = async () => {
    if (!attendanceSubject) return;
    const subject = dashboardData?.subjects?.find(s => s.name === attendanceSubject);
    if (!subject) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/faculty/students?branch=${subject.branch}&semester=${subject.semester}`, {
        headers: { 'x-auth-token': token }
      });
      setAttendanceStudents(res.data);
      // Initialize attendanceData with default false (absent)
      const initAtt = {};
      res.data.forEach(student => {
        initAtt[student._id] = false;
      });
      setAttendanceData(initAtt);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAttendance = async () => {
    if (!attendanceSubject || attendanceStudents.length === 0) {
      alert('Please select a subject');
      return;
    }
    setLoadingAttendance(true);
    try {
      const subject = dashboardData?.subjects?.find(s => s.name === attendanceSubject);
      const token = localStorage.getItem('token');
      const attendancePayload = attendanceStudents.map(student => ({
        rollNumber: student.rollNumber,
        present: attendanceData[student._id] || false
      }));
      await axios.post('http://localhost:5000/api/faculty/attendance', {
        subject: attendanceSubject,
        branch: subject.branch,
        semester: subject.semester,
        date: attendanceDate,
        attendance: attendancePayload
      }, { headers: { 'x-auth-token': token } });
      alert('Attendance submitted successfully');
      // Reset form or keep as is
    } catch (err) {
      alert('Error submitting attendance');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Helper to sort slots by slot number
  const sortSlots = (slots) => slots.sort((a, b) => a.slot - b.slot);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">SAMS</h1>
              <span className="ml-2 text-gray-500">Faculty Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{dashboardData?.faculty.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {['dashboard', 'timetable', 'swap-requests', 'marks', 'attendance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
              <h2 className="text-2xl font-bold">Welcome, {dashboardData?.faculty.name}!</h2>
              <p>Department: {dashboardData?.faculty.department}</p>
              <p>Employee ID: {dashboardData?.faculty.employeeId}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center">
                <div className="text-3xl font-bold text-primary-600">{dashboardData?.subjects?.length || 0}</div>
                <div className="text-gray-600">Subjects</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-yellow-600">{dashboardData?.pendingRequests || 0}</div>
                <div className="text-gray-600">Pending Swap Requests</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-green-600">{dashboardData?.notifications || 0}</div>
                <div className="text-gray-600">Notifications</div>
              </div>
            </div>
          </div>
        )}

        {/* Timetable Tab – FIXED */}
        {activeTab === 'timetable' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Timetable</h2>
            {Object.keys(timetable).length === 0 ? (
              <div className="card text-center text-gray-500 py-8">
                No timetable assigned yet. Please contact admin.
              </div>
            ) : (
              <div className="grid gap-6">
                {Object.entries(timetable).map(([day, slots]) => (
                  <div key={day} className="card">
                    <h3 className="font-semibold text-lg mb-4 text-primary-600">{day}</h3>
                    <div className="space-y-2">
                      {sortSlots(slots).map((slot, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">Slot {slot.slot}</p>
                            <p className="text-sm text-gray-600">{slot.subject}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Room: {slot.room}</p>
                            <p className="text-xs text-gray-400">Branch: {slot.branch} - Sem {slot.semester}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Swap Requests Tab */}
        {activeTab === 'swap-requests' && (
          <div className="space-y-6">
            {/* Button to open request modal */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowRequestModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg"
              >
                + Request Swap
              </button>
            </div>

            {/* Incoming Requests */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Incoming Requests</h3>
              {swapRequests.pending?.length === 0 ? (
                <p className="text-gray-500">No pending swap requests</p>
              ) : (
                swapRequests.pending.map((req, idx) => (
                  <div key={idx} className="border-b pb-3 mb-3">
                    <p><strong>{req.requestedBy?.name}</strong> wants to swap:</p>
                    <p className="text-sm">Their: {req.originalSlot.day} Slot {req.originalSlot.slot} ({req.originalSlot.subject})</p>
                    <p className="text-sm">Your: {req.requestedSlot.day} Slot {req.requestedSlot.slot}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleAcceptSwap(req._id)} className="bg-green-500 text-white px-3 py-1 rounded">Accept</button>
                      <button onClick={() => handleRejectSwap(req._id)} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Outgoing Requests</h3>
              {outgoingRequests.length === 0 ? (
                <p className="text-gray-500">No requests sent</p>
              ) : (
                outgoingRequests.map((req, idx) => (
                  <div key={idx} className="border-b pb-3 mb-3">
                    <p>To: {req.requestedTo?.name}</p>
                    <p className="text-sm">Your: {req.originalSlot.day} Slot {req.originalSlot.slot}</p>
                    <p className="text-sm">Their: {req.requestedSlot.day} Slot {req.requestedSlot.slot}</p>
                    <p className="text-xs font-medium mt-1">
                      Status: <span className={`${req.status === 'pending' ? 'text-yellow-600' : req.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Request Modal */}
            {showRequestModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Request Timetable Swap</h2>
                  <div className="space-y-4">
                    {/* Select Your Slot */}
                    <div>
                      <label className="block font-medium mb-1">Your Slot</label>
                      <select
                        className="input-field"
                        value={selectedMySlot ? JSON.stringify(selectedMySlot) : ''}
                        onChange={(e) => setSelectedMySlot(JSON.parse(e.target.value))}
                      >
                        <option value="">Select a slot</option>
                        {mySlots.map((slot, idx) => (
                          <option key={idx} value={JSON.stringify(slot)}>
                            {slot.day} - Slot {slot.slot} ({slot.subject})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Target Faculty */}
                    <div>
                      <label className="block font-medium mb-1">Target Faculty</label>
                      <select
                        className="input-field"
                        value={targetFacultyId}
                        onChange={(e) => setTargetFacultyId(e.target.value)}
                      >
                        <option value="">Select faculty</option>
                        {facultyList.map(f => (
                          <option key={f._id} value={f._id}>{f.name} ({f.department})</option>
                        ))}
                      </select>
                    </div>

                    {/* Select Target Slot (if target faculty selected) */}
                    {targetFacultyId && targetSlots.length > 0 && (
                      <div>
                        <label className="block font-medium mb-1">Target Faculty's Slot</label>
                        <select
                          className="input-field"
                          value={selectedTargetSlot ? JSON.stringify(selectedTargetSlot) : ''}
                          onChange={(e) => setSelectedTargetSlot(JSON.parse(e.target.value))}
                        >
                          <option value="">Select a slot</option>
                          {targetSlots.map((slot, idx) => (
                            <option key={idx} value={JSON.stringify(slot)}>
                              {slot.day} - Slot {slot.slot} ({slot.subject})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={sendSwapRequest} className="btn-primary">Send Request</button>
                    <button onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marks & Attendance tabs – simplified for brevity, you can expand later */}
        {activeTab === 'marks' && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Enter Marks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <select
                  className="input-field"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">Select Subject</option>
                  {dashboardData?.subjects?.map(sub => (
                    <option key={sub.name} value={sub.name}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exam Type</label>
                <select
                  className="input-field"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                >
                  <option value="mid1">Mid 1</option>
                  <option value="mid2">Mid 2</option>
                  <option value="external">External</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={submitMarks}
                  disabled={loadingMarks}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg w-full"
                >
                  {loadingMarks ? 'Submitting...' : 'Submit Marks'}
                </button>
              </div>
            </div>

            {studentsList.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2">Roll Number</th>
                      <th className="border p-2">Student Name</th>
                      {examType === 'external' ? (
                        <th className="border p-2">Marks (out of 70)</th>
                      ) : (
                        <>
                          <th className="border p-2">Descriptive (15)</th>
                          <th className="border p-2">Objective (10)</th>
                          <th className="border p-2">Assignment (5)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map(student => (
                      <tr key={student._id}>
                        <td className="border p-2">{student.rollNumber}</td>
                        <td className="border p-2">{student.name}</td>
                        {examType === 'external' ? (
                          <td className="border p-2">
                            <input
                              type="number"
                              className="w-24 p-1 border rounded"
                              value={marksData[student._id]?.marks || ''}
                              onChange={(e) => setMarksData(prev => ({
                                ...prev,
                                [student._id]: { ...prev[student._id], marks: e.target.value }
                              }))}
                            />
                          </td>
                        ) : (
                          <>
                            <td className="border p-2">
                              <input
                                type="number"
                                className="w-16 p-1 border rounded"
                                value={marksData[student._id]?.descriptive || ''}
                                onChange={(e) => setMarksData(prev => ({
                                  ...prev,
                                  [student._id]: { ...prev[student._id], descriptive: e.target.value }
                                }))}
                              />
                            </td>
                            <td className="border p-2">
                              <input
                                type="number"
                                className="w-16 p-1 border rounded"
                                value={marksData[student._id]?.objective || ''}
                                onChange={(e) => setMarksData(prev => ({
                                  ...prev,
                                  [student._id]: { ...prev[student._id], objective: e.target.value }
                                }))}
                              />
                            </td>
                            <td className="border p-2">
                              <input
                                type="number"
                                className="w-16 p-1 border rounded"
                                value={marksData[student._id]?.assignment || ''}
                                onChange={(e) => setMarksData(prev => ({
                                  ...prev,
                                  [student._id]: { ...prev[student._id], assignment: e.target.value }
                                }))}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === 'attendance' && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Mark Attendance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <select
                  className="input-field"
                  value={attendanceSubject}
                  onChange={(e) => setAttendanceSubject(e.target.value)}
                >
                  <option value="">Select Subject</option>
                  {dashboardData?.subjects?.map(sub => (
                    <option key={sub.name} value={sub.name}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={submitAttendance}
                  disabled={loadingAttendance}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg w-full"
                >
                  {loadingAttendance ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </div>

            {attendanceStudents.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2">Roll Number</th>
                      <th className="border p-2">Student Name</th>
                      <th className="border p-2">Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceStudents.map(student => (
                      <tr key={student._id}>
                        <td className="border p-2">{student.rollNumber}</td>
                        <td className="border p-2">{student.name}</td>
                        <td className="border p-2 text-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5"
                            checked={attendanceData[student._id] || false}
                            onChange={(e) => setAttendanceData(prev => ({
                              ...prev,
                              [student._id]: e.target.checked
                            }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyDashboard;


// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';

// const FacultyDashboard = () => {
//   const { user } = useAuth();
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [loading, setLoading] = useState(true);
//   const [dashboardData, setDashboardData] = useState(null);
//   const [timetable, setTimetable] = useState({});
//   const [swapRequests, setSwapRequests] = useState([]);

//   // Marks & Attendance state (always declared)
//   const [selectedSubject, setSelectedSubject] = useState('');
//   const [examType, setExamType] = useState('mid1');
//   const [studentsList, setStudentsList] = useState([]);
//   const [marksData, setMarksData] = useState({});
//   const [loadingMarks, setLoadingMarks] = useState(false);
//   const [subjectInfo, setSubjectInfo] = useState({ branch: '', semester: '' });

//   // Attendance specific state
//   const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
//   const [attendanceData, setAttendanceData] = useState({});

//   // Swap request state
//   const [facultyList, setFacultyList] = useState([]);
//   const [targetFacultyId, setTargetFacultyId] = useState('');
//   const [mySlots, setMySlots] = useState([]);
//   const [targetSlots, setTargetSlots] = useState([]);
//   const [selectedMySlot, setSelectedMySlot] = useState(null);
//   const [selectedTargetSlot, setSelectedTargetSlot] = useState(null);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [outgoingRequests, setOutgoingRequests] = useState([]);

//   // Fetch dashboard data
//   const fetchDashboard = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/faculty/dashboard');
//       setDashboardData(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Fetch faculty's own timetable
//   const fetchTimetable = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/faculty/timetable');
//       setTimetable(res.data);
//       // Prepare flat list of own slots for swap requests
//       const slots = [];
//       Object.entries(res.data).forEach(([day, daySlots]) => {
//         daySlots.forEach(slot => {
//           slots.push({ ...slot, day });
//         });
//       });
//       setMySlots(slots);
//     } catch (err) {
//       console.error('Error fetching timetable:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSwapRequests = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/api/timetable/swap/requests');
//       setSwapRequests(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const fetchFacultyList = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.get('http://localhost:5000/api/admin/faculty', {
//         headers: { 'x-auth-token': token }
//       });
//       setFacultyList(res.data.filter(f => f._id !== user?.id));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const fetchOutgoingRequests = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.get('http://localhost:5000/api/faculty/swap-requests/outgoing', {
//         headers: { 'x-auth-token': token }
//       });
//       setOutgoingRequests(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const fetchTargetTimetable = async (facultyId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.get(`http://localhost:5000/api/timetable/faculty/${facultyId}`, {
//         headers: { 'x-auth-token': token }
//       });
//       const slots = [];
//       Object.entries(res.data.timetable).forEach(([day, daySlots]) => {
//         daySlots.forEach(slot => {
//           slots.push({ ...slot, day });
//         });
//       });
//       setTargetSlots(slots);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const sendSwapRequest = async () => {
//     if (!selectedMySlot || !selectedTargetSlot || !targetFacultyId) {
//       alert('Please select your slot and target slot');
//       return;
//     }
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       await axios.post('http://localhost:5000/api/timetable/swap/request', {
//         requestedToId: targetFacultyId,
//         originalSlot: {
//           day: selectedMySlot.day,
//           slot: selectedMySlot.slot,
//           subject: selectedMySlot.subject,
//           branch: selectedMySlot.branch,
//           semester: selectedMySlot.semester,
//           room: selectedMySlot.room
//         },
//         requestedSlot: {
//           day: selectedTargetSlot.day,
//           slot: selectedTargetSlot.slot
//         }
//       }, { headers: { 'x-auth-token': token } });
//       alert('Swap request sent');
//       setShowRequestModal(false);
//       setTargetFacultyId('');
//       setSelectedMySlot(null);
//       setSelectedTargetSlot(null);
//       fetchOutgoingRequests();
//     } catch (err) {
//       alert('Error: ' + (err.response?.data?.msg || err.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAcceptSwap = async (requestId) => {
//     try {
//       await axios.post(`http://localhost:5000/api/timetable/swap/respond/${requestId}`, { accept: true });
//       alert('Swap accepted');
//       fetchSwapRequests();
//       fetchTimetable();
//     } catch (err) {
//       alert('Error accepting swap');
//     }
//   };

//   const handleRejectSwap = async (requestId) => {
//     try {
//       await axios.post(`http://localhost:5000/api/timetable/swap/respond/${requestId}`, { accept: false });
//       alert('Swap rejected');
//       fetchSwapRequests();
//     } catch (err) {
//       alert('Error rejecting swap');
//     }
//   };

//   // Marks: load students when subject changes
//   const loadStudentsForSubject = async () => {
//     if (!selectedSubject) return;
//     const subject = dashboardData?.subjects?.find(s => s.name === selectedSubject);
//     if (!subject) return;
//     setSubjectInfo({ branch: subject.branch, semester: subject.semester });
//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.get(`http://localhost:5000/api/faculty/students?branch=${subject.branch}&semester=${subject.semester}`, {
//         headers: { 'x-auth-token': token }
//       });
//       setStudentsList(res.data);
//       const initMarks = {};
//       res.data.forEach(student => {
//         initMarks[student._id] = { descriptive: '', objective: '', assignment: '', marks: '' };
//       });
//       setMarksData(initMarks);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const submitMarks = async () => {
//     if (!selectedSubject || !examType || studentsList.length === 0) {
//       alert('Please select subject and exam type');
//       return;
//     }
//     setLoadingMarks(true);
//     try {
//       const token = localStorage.getItem('token');
//       const marksPayload = studentsList.map(student => {
//         const data = marksData[student._id] || {};
//         if (examType === 'external') {
//           return { rollNumber: student.rollNumber, marks: data.marks || 0 };
//         } else {
//           return {
//             rollNumber: student.rollNumber,
//             descriptive: data.descriptive || 0,
//             objective: data.objective || 0,
//             assignment: data.assignment || 0
//           };
//         }
//       });
//       await axios.post('http://localhost:5000/api/faculty/marks', {
//         subject: selectedSubject,
//         branch: subjectInfo.branch,
//         semester: subjectInfo.semester,
//         examType,
//         marks: marksPayload
//       }, { headers: { 'x-auth-token': token } });
//       alert('Marks submitted successfully');
//     } catch (err) {
//       alert('Error submitting marks');
//     } finally {
//       setLoadingMarks(false);
//     }
//   };

//   // Attendance: load students for the selected subject
//   const loadStudentsForAttendance = async () => {
//     if (!selectedSubject) return;
//     const subject = dashboardData?.subjects?.find(s => s.name === selectedSubject);
//     if (!subject) return;
//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.get(`http://localhost:5000/api/faculty/students?branch=${subject.branch}&semester=${subject.semester}`, {
//         headers: { 'x-auth-token': token }
//       });
//       setStudentsList(res.data);
//       const initAttendance = {};
//       res.data.forEach(student => {
//         initAttendance[student._id] = false;
//       });
//       setAttendanceData(initAttendance);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const submitAttendance = async () => {
//     if (!selectedSubject || studentsList.length === 0) {
//       alert('Please select a subject');
//       return;
//     }
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const subjectObj = dashboardData?.subjects?.find(s => s.name === selectedSubject);
//       const attendancePayload = studentsList.map(student => ({
//         rollNumber: student.rollNumber,
//         present: attendanceData[student._id] || false
//       }));
//       await axios.post('http://localhost:5000/api/faculty/attendance', {
//         subject: selectedSubject,
//         branch: subjectObj.branch,
//         semester: subjectObj.semester,
//         date: attendanceDate,
//         attendance: attendancePayload
//       }, { headers: { 'x-auth-token': token } });
//       alert('Attendance submitted successfully');
//     } catch (err) {
//       alert('Error submitting attendance');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // useEffect hooks – all placed unconditionally
//   useEffect(() => {
//     fetchDashboard();
//     fetchTimetable();
//     fetchSwapRequests();
//     fetchFacultyList();
//     fetchOutgoingRequests();
//   }, []);

//   useEffect(() => {
//     if (selectedSubject) {
//       loadStudentsForSubject();
//     }
//   }, [selectedSubject]);

//   useEffect(() => {
//     if (targetFacultyId) {
//       fetchTargetTimetable(targetFacultyId);
//     } else {
//       setTargetSlots([]);
//     }
//   }, [targetFacultyId]);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <nav className="bg-white shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between h-16">
//             <div className="flex items-center">
//               <h1 className="text-xl font-bold text-primary-600">SAMS</h1>
//               <span className="ml-2 text-gray-500">Faculty Dashboard</span>
//             </div>
//             <div className="flex items-center space-x-4">
//               <span className="text-gray-700">{dashboardData?.faculty.name}</span>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <nav className="-mb-px flex space-x-8">
//             {['dashboard', 'timetable', 'swap-requests', 'marks', 'attendance'].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`${
//                   activeTab === tab
//                     ? 'border-primary-500 text-primary-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700'
//                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
//               >
//                 {tab.replace('-', ' ')}
//               </button>
//             ))}
//           </nav>
//         </div>
//       </div>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Dashboard Tab */}
//         {activeTab === 'dashboard' && (
//           <div className="space-y-6">
//             <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
//               <h2 className="text-2xl font-bold">Welcome, {dashboardData?.faculty.name}!</h2>
//               <p>Department: {dashboardData?.faculty.department}</p>
//               <p>Employee ID: {dashboardData?.faculty.employeeId}</p>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <div className="card text-center">
//                 <div className="text-3xl font-bold text-primary-600">{dashboardData?.subjects?.length || 0}</div>
//                 <div className="text-gray-600">Subjects</div>
//               </div>
//               <div className="card text-center">
//                 <div className="text-3xl font-bold text-yellow-600">{dashboardData?.pendingRequests || 0}</div>
//                 <div className="text-gray-600">Pending Swap Requests</div>
//               </div>
//               <div className="card text-center">
//                 <div className="text-3xl font-bold text-green-600">{dashboardData?.notifications || 0}</div>
//                 <div className="text-gray-600">Notifications</div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Timetable Tab */}
//         {activeTab === 'timetable' && (
//           <div className="space-y-6">
//             <h2 className="text-2xl font-bold">My Timetable</h2>
//             {Object.keys(timetable).length === 0 ? (
//               <div className="card text-center text-gray-500 py-8">
//                 No timetable assigned yet. Please contact admin.
//               </div>
//             ) : (
//               <div className="grid gap-6">
//                 {Object.entries(timetable).map(([day, slots]) => (
//                   <div key={day} className="card">
//                     <h3 className="font-semibold text-lg mb-4 text-primary-600">{day}</h3>
//                     <div className="space-y-2">
//                       {slots.sort((a,b)=>a.slot-b.slot).map((slot, idx) => (
//                         <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
//                           <div>
//                             <p className="font-medium">Slot {slot.slot}</p>
//                             <p className="text-sm text-gray-600">{slot.subject}</p>
//                           </div>
//                           <div>
//                             <p className="text-sm text-gray-500">Room: {slot.room}</p>
//                             <p className="text-xs text-gray-400">{slot.startTime} - {slot.endTime}</p>
//                             <p className="text-xs text-gray-400">Branch: {slot.branch} - Sem {slot.semester}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Swap Requests Tab */}
//         {activeTab === 'swap-requests' && (
//           <div className="space-y-6">
//             <div className="flex justify-end">
//               <button onClick={() => setShowRequestModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg">
//                 + Request Swap
//               </button>
//             </div>
//             <div className="card">
//               <h3 className="text-lg font-semibold mb-4">Incoming Requests</h3>
//               {swapRequests.pending?.length === 0 ? (
//                 <p className="text-gray-500">No pending swap requests</p>
//               ) : (
//                 swapRequests.pending.map((req, idx) => (
//                   <div key={idx} className="border-b pb-3 mb-3">
//                     <p><strong>{req.requestedBy?.name}</strong> wants to swap:</p>
//                     <p className="text-sm">Their: {req.originalSlot.day} Slot {req.originalSlot.slot} ({req.originalSlot.subject})</p>
//                     <p className="text-sm">Your: {req.requestedSlot.day} Slot {req.requestedSlot.slot}</p>
//                     <div className="flex gap-2 mt-2">
//                       <button onClick={() => handleAcceptSwap(req._id)} className="bg-green-500 text-white px-3 py-1 rounded">Accept</button>
//                       <button onClick={() => handleRejectSwap(req._id)} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//             <div className="card">
//               <h3 className="text-lg font-semibold mb-4">Outgoing Requests</h3>
//               {outgoingRequests.length === 0 ? (
//                 <p className="text-gray-500">No requests sent</p>
//               ) : (
//                 outgoingRequests.map((req, idx) => (
//                   <div key={idx} className="border-b pb-3 mb-3">
//                     <p>To: {req.requestedTo?.name}</p>
//                     <p className="text-sm">Your: {req.originalSlot.day} Slot {req.originalSlot.slot}</p>
//                     <p className="text-sm">Their: {req.requestedSlot.day} Slot {req.requestedSlot.slot}</p>
//                     <p className="text-xs font-medium mt-1">
//                       Status: <span className={`${req.status === 'pending' ? 'text-yellow-600' : req.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
//                         {req.status.toUpperCase()}
//                       </span>
//                     </p>
//                   </div>
//                 ))
//               )}
//             </div>
//             {showRequestModal && (
//               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                 <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//                   <h2 className="text-xl font-bold mb-4">Request Timetable Swap</h2>
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block font-medium mb-1">Your Slot</label>
//                       <select className="input-field" value={selectedMySlot ? JSON.stringify(selectedMySlot) : ''} onChange={(e) => setSelectedMySlot(JSON.parse(e.target.value))}>
//                         <option value="">Select a slot</option>
//                         {mySlots.map((slot, idx) => (
//                           <option key={idx} value={JSON.stringify(slot)}>{slot.day} - Slot {slot.slot} ({slot.subject})</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block font-medium mb-1">Target Faculty</label>
//                       <select className="input-field" value={targetFacultyId} onChange={(e) => setTargetFacultyId(e.target.value)}>
//                         <option value="">Select faculty</option>
//                         {facultyList.map(f => (<option key={f._id} value={f._id}>{f.name} ({f.department})</option>))}
//                       </select>
//                     </div>
//                     {targetFacultyId && targetSlots.length > 0 && (
//                       <div>
//                         <label className="block font-medium mb-1">Target Faculty's Slot</label>
//                         <select className="input-field" value={selectedTargetSlot ? JSON.stringify(selectedTargetSlot) : ''} onChange={(e) => setSelectedTargetSlot(JSON.parse(e.target.value))}>
//                           <option value="">Select a slot</option>
//                           {targetSlots.map((slot, idx) => (
//                             <option key={idx} value={JSON.stringify(slot)}>{slot.day} - Slot {slot.slot} ({slot.subject})</option>
//                           ))}
//                         </select>
//                       </div>
//                     )}
//                   </div>
//                   <div className="flex justify-end gap-3 mt-6">
//                     <button onClick={sendSwapRequest} className="btn-primary">Send Request</button>
//                     <button onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancel</button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Marks Tab – Full Implementation */}
//         {activeTab === 'marks' && (
//           <div className="card">
//             <h2 className="text-2xl font-bold mb-6">Enter Marks</h2>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Subject</label>
//                 <select className="input-field" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
//                   <option value="">Select Subject</option>
//                   {dashboardData?.subjects?.map(sub => (<option key={sub.name} value={sub.name}>{sub.name}</option>))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Exam Type</label>
//                 <select className="input-field" value={examType} onChange={(e) => setExamType(e.target.value)}>
//                   <option value="mid1">Mid 1</option>
//                   <option value="mid2">Mid 2</option>
//                   <option value="external">External</option>
//                 </select>
//               </div>
//               <div className="flex items-end">
//                 <button onClick={submitMarks} disabled={loadingMarks} className="bg-primary-600 text-white px-4 py-2 rounded-lg w-full">
//                   {loadingMarks ? 'Submitting...' : 'Submit Marks'}
//                 </button>
//               </div>
//             </div>
//             {studentsList.length > 0 && (
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="border p-2">Roll Number</th>
//                       <th className="border p-2">Student Name</th>
//                       {examType === 'external' ? (
//                         <th className="border p-2">Marks (out of 70)</th>
//                       ) : (
//                         <>
//                           <th className="border p-2">Descriptive (15)</th>
//                           <th className="border p-2">Objective (10)</th>
//                           <th className="border p-2">Assignment (5)</th>
//                         </>
//                       )}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {studentsList.map(student => (
//                       <tr key={student._id}>
//                         <td className="border p-2">{student.rollNumber}</td>
//                         <td className="border p-2">{student.name}</td>
//                         {examType === 'external' ? (
//                           <td className="border p-2">
//                             <input type="number" className="w-24 p-1 border rounded" value={marksData[student._id]?.marks || ''} onChange={(e) => setMarksData(prev => ({ ...prev, [student._id]: { ...prev[student._id], marks: e.target.value } }))} />
//                           </td>
//                         ) : (
//                           <>
//                             <td className="border p-2">
//                               <input type="number" className="w-16 p-1 border rounded" value={marksData[student._id]?.descriptive || ''} onChange={(e) => setMarksData(prev => ({ ...prev, [student._id]: { ...prev[student._id], descriptive: e.target.value } }))} />
//                             </td>
//                             <td className="border p-2">
//                               <input type="number" className="w-16 p-1 border rounded" value={marksData[student._id]?.objective || ''} onChange={(e) => setMarksData(prev => ({ ...prev, [student._id]: { ...prev[student._id], objective: e.target.value } }))} />
//                             </td>
//                             <td className="border p-2">
//                               <input type="number" className="w-16 p-1 border rounded" value={marksData[student._id]?.assignment || ''} onChange={(e) => setMarksData(prev => ({ ...prev, [student._id]: { ...prev[student._id], assignment: e.target.value } }))} />
//                             </td>
//                           </>
//                         )}
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Attendance Tab – Complete Implementation */}
//         {activeTab === 'attendance' && (
//           <div className="card">
//             <h2 className="text-2xl font-bold mb-6">Mark Attendance</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Subject</label>
//                 <select className="input-field" value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); loadStudentsForAttendance(); }}>
//                   <option value="">Select Subject</option>
//                   {dashboardData?.subjects?.map(sub => (<option key={sub.name} value={sub.name}>{sub.name}</option>))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Date</label>
//                 <input type="date" className="input-field" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
//               </div>
//             </div>
//             {studentsList.length > 0 && (
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="border p-2">Roll Number</th>
//                       <th className="border p-2">Student Name</th>
//                       <th className="border p-2">Present</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {studentsList.map(student => (
//                       <tr key={student._id}>
//                         <td className="border p-2">{student.rollNumber}</td>
//                         <td className="border p-2">{student.name}</td>
//                         <td className="border p-2 text-center">
//                           <input type="checkbox" className="w-4 h-4" checked={attendanceData[student._id] || false} onChange={(e) => setAttendanceData(prev => ({ ...prev, [student._id]: e.target.checked }))} />
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//             <div className="mt-6">
//               <button onClick={submitAttendance} disabled={loading} className="bg-primary-600 text-white px-4 py-2 rounded-lg">
//                 {loading ? 'Submitting...' : 'Submit Attendance'}
//               </button>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default FacultyDashboard;