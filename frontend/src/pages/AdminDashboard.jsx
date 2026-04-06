import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('student');
  const [generatedTimetables, setGeneratedTimetables] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    branch: 'IT',
    semester: 1,
    employeeId: '',
    department: 'IT',
    subjectName: '',
    subjectCode: ''
  });
  const [viewBranch, setViewBranch] = useState('IT');
  const [viewSemester, setViewSemester] = useState(3);
  const [viewTimetable, setViewTimetable] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [genBranch, setGenBranch] = useState('IT');    // default
  const [genSemester, setGenSemester] = useState(3);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotData, setNewSlotData] = useState({
    day: '',
    slotNumber: '',
    subject: '',
    room: '',
    startTime: '',
    endTime: ''
  });
  const [availableDays, setAvailableDays] = useState([]);
  // Faculty edit/delete state
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deleteFaculty, setDeleteFaculty] = useState(null);
  const [showDeleteOptionsFaculty, setShowDeleteOptionsFaculty] = useState(false);
  const [facultyList, setFacultyList] = useState([]);

  // Subject edit/delete state
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteSubject, setDeleteSubject] = useState(null);
  const [showDeleteOptionsSubject, setShowDeleteOptionsSubject] = useState(false);

  const openEditStudent = (student) => {
    setEditingStudent(student);
  };

  const openDeleteStudent = (student) => {
    setDeleteStudent(student);
    setShowDeleteOptions(true);
  };

  const handleUpdateStudent = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/student/${editingStudent._id}`, editingStudent, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setEditingStudent(null);
      alert('Student updated');
    } catch (err) {
      alert('Error updating student');
    }
  };

  const handleSoftDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/student/soft/${deleteStudent._id}`, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setShowDeleteOptions(false);
      alert('Student soft deleted');
    } catch (err) {
      alert('Error');
    }
  };

  const handleHardDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/student/hard/${deleteStudent._id}`, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setShowDeleteOptions(false);
      alert('Student permanently deleted');
    } catch (err) {
      alert('Error');
    }
  };

  // ==================== FACULTY HANDLERS ====================
  const openEditFaculty = (fac) => setEditingFaculty(fac);
  const openDeleteFaculty = (fac) => {
    setDeleteFaculty(fac);
    setShowDeleteOptionsFaculty(true);
  };

  const handleUpdateFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/faculty/${editingFaculty._id}`, editingFaculty, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setEditingFaculty(null);
      alert('Faculty updated');
    } catch (err) {
      alert('Error updating faculty');
    }
  };

  const handleSoftDeleteFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/faculty/soft/${deleteFaculty._id}`, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setShowDeleteOptionsFaculty(false);
      alert('Faculty soft deleted');
    } catch (err) {
      alert('Error');
    }
  };

  const handleHardDeleteFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/faculty/hard/${deleteFaculty._id}`, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setShowDeleteOptionsFaculty(false);
      alert('Faculty permanently deleted');
    } catch (err) {
      alert('Error');
    }
  };

  // ==================== SUBJECT HANDLERS ====================
  const openEditSubject = (sub) => setEditingSubject(sub);
  const openDeleteSubject = (sub) => {
    setDeleteSubject(sub);
    setShowDeleteOptionsSubject(true);
  };

  const handleUpdateSubject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/subject/${editingSubject._id}`, editingSubject, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setEditingSubject(null);
      alert('Subject updated');
    } catch (err) {
      alert('Error updating subject');
    }
  };

  const handleSoftDeleteSubject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/subject/soft/${deleteSubject._id}`, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setShowDeleteOptionsSubject(false);
      alert('Subject soft deleted');
    } catch (err) {
      alert('Error');
    }
  };

  const handleHardDeleteSubject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/subject/hard/${deleteSubject._id}`, {
        headers: { 'x-auth-token': token }
      });
      await fetchAllData();
      setShowDeleteOptionsSubject(false);
      alert('Subject permanently deleted');
    } catch (err) {
      alert('Error');
    }
  };
  useEffect(() => {
    fetchAllData();
    fetchTimetables();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      const [studentsRes, facultyRes, subjectsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/students', config),
        axios.get('http://localhost:5000/api/admin/faculty', config),
        axios.get('http://localhost:5000/api/admin/subjects', config)
      ]);

      setStudents(studentsRes.data || []);
      setFaculty(facultyRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let endpoint = '';
      let payload = {};

      if (addType === 'student') {
        endpoint = 'http://localhost:5000/api/admin/student';
        payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          rollNumber: formData.rollNumber,
          branch: formData.branch,
          semester: parseInt(formData.semester)
        };
      } else if (addType === 'faculty') {
        endpoint = 'http://localhost:5000/api/admin/faculty';
        payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          employeeId: formData.employeeId,
          department: formData.department,
          subjects: []
        };
      } else if (addType === 'subject') {
        endpoint = 'http://localhost:5000/api/admin/subject';
        payload = {
          name: formData.subjectName,
          code: formData.subjectCode,
          branch: formData.branch,
          semester: parseInt(formData.semester),
          credits: 3
        };
      }

      await axios.post(endpoint, payload);
      await fetchAllData();
      setShowAddModal(false);
      setFormData({
        name: '', email: '', password: '', rollNumber: '',
        branch: 'IT', semester: 1, employeeId: '', department: 'IT',
        subjectName: '', subjectCode: ''
      });
      alert(`${addType} added successfully!`);
    } catch (err) {
      alert(err.response?.data?.msg || 'Error adding data');
    } finally {
      setLoading(false);
    }
  };

  const generateTimetable = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/admin/timetable/generate', {
        branch: genBranch,
        semester: genSemester,
        academicYear: '2024-2025'
      }, {
        headers: { 'x-auth-token': token }
      });
      alert(`✅ Timetable generated for ${genBranch} semester ${genSemester}`);
      await fetchTimetables();  // refresh the list
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch timetable for viewing
  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/timetable?branch=${viewBranch}&semester=${viewSemester}`, {
        headers: { 'x-auth-token': token }
      });
      setViewTimetable(res.data);
    } catch (err) {
      alert('Error fetching timetable: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetables = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/timetables', {
        headers: { 'x-auth-token': token }
      });
      setGeneratedTimetables(res.data);
    } catch (err) {
      console.error('Error fetching timetables:', err);
    }
  };

  // Update a slot after editing
  const updateSlot = async (dayIndex, slotIndex, updatedData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        branch: viewBranch,
        semester: viewSemester,
        day: viewTimetable.weekSchedule[dayIndex].day,
        slotNumber: viewTimetable.weekSchedule[dayIndex].slots[slotIndex].slotNumber,
        subject: updatedData.subject,
        room: updatedData.room,
        startTime: updatedData.startTime,
        endTime: updatedData.endTime,
        facultyId: updatedData.faculty  // backend expects facultyId
      };
      await axios.post('http://localhost:5000/api/admin/timetable/override', payload, {
        headers: { 'x-auth-token': token }
      });
      await fetchTimetable();
      setEditingSlot(null);
    } catch (err) {
      alert('Error updating slot: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!viewTimetable) {
      alert('No timetable loaded to export');
      return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text(`Timetable - ${viewBranch} Semester ${viewSemester}`, pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Academic Year: 2024-2025`, pageWidth / 2, 23, { align: 'center' });

    // Prepare table headers and data
    const days = viewTimetable.weekSchedule.map(day => day.day);
    const slots = viewTimetable.weekSchedule[0]?.slots || [];
    if (slots.length === 0) {
      alert('No slots found in this timetable');
      return;
    }

    const tableData = [];
    for (let i = 0; i < slots.length; i++) {
      const timeSlot = `${slots[i].startTime} - ${slots[i].endTime}`;
      const row = [timeSlot];
      for (let j = 0; j < days.length; j++) {
        const slot = viewTimetable.weekSchedule[j].slots[i];
        row.push(`${slot.subject}\nRoom: ${slot.room}\nFaculty: ${slot.faculty?.name || 'TBD'}`);
      }
      tableData.push(row);
    }

    // Generate table using autoTable function
    autoTable(doc, {
      head: [['Time', ...days]],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle', halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
      },
      margin: { left: 10, right: 10 },
    });

    doc.save(`Timetable_${viewBranch}_Sem${viewSemester}.pdf`);
  };
  const deleteTimetable = async (branch, semester) => {
    if (!window.confirm(`Delete timetable for ${branch} semester ${semester}? This action cannot be undone.`)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/timetable/${branch}/${semester}`, {
        headers: { 'x-auth-token': token }
      });
      await fetchTimetables();
      alert('Timetable deleted successfully');
    } catch (err) {
      alert('Error deleting timetable: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (dayIndex, slotIndex) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        branch: viewBranch,
        semester: viewSemester,
        day: viewTimetable.weekSchedule[dayIndex].day,
        slotNumber: viewTimetable.weekSchedule[dayIndex].slots[slotIndex].slotNumber
      };
      await axios.post('http://localhost:5000/api/admin/timetable/delete-slot', payload, {
        headers: { 'x-auth-token': token }
      });
      await fetchTimetable(); // refresh timetable after deletion
      alert('Slot deleted successfully');
    } catch (err) {
      alert('Error deleting slot: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/timetable/add-slot', {
        branch: viewBranch,
        semester: viewSemester,
        ...newSlotData,
        slotNumber: parseInt(newSlotData.slotNumber)
      }, {
        headers: { 'x-auth-token': token }
      });
      await fetchTimetable(); // refresh after adding
      setShowAddSlotModal(false);
      setNewSlotData({ day: '', slotNumber: '', subject: '', room: '', startTime: '', endTime: '' });
      alert('Slot added successfully');
    } catch (err) {
      alert('Error adding slot: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { name: 'Total Students', value: students.length, icon: UsersIcon, color: 'bg-blue-500' },
    { name: 'Total Faculty', value: faculty.length, icon: AcademicCapIcon, color: 'bg-green-500' },
    { name: 'Total Subjects', value: subjects.length, icon: BookOpenIcon, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  SAMS
                </h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'overview'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'students'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    Students
                  </button>
                  <button
                    onClick={() => setActiveTab('faculty')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'faculty'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    Faculty
                  </button>
                  <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'subjects'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    Subjects
                  </button>
                  <button
                    onClick={() => setActiveTab('timetable')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'timetable'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    Timetable
                  </button>
                  <button
                    onClick={() => setActiveTab('viewTimetable')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'viewTimetable'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    View Timetable
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className={`${stat.color} rounded-lg p-3`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => { setAddType('student'); setShowAddModal(true); }}
                  className="flex items-center justify-center space-x-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-700 font-medium">Add Student</span>
                </button>
                <button
                  onClick={() => { setAddType('faculty'); setShowAddModal(true); }}
                  className="flex items-center justify-center space-x-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">Add Faculty</span>
                </button>
                <button
                  onClick={() => { setAddType('subject'); setShowAddModal(true); }}
                  className="flex items-center justify-center space-x-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 text-purple-600" />
                  <span className="text-purple-700 font-medium">Add Subject</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Students</h2>
              <button
                onClick={() => { setAddType('student'); setShowAddModal(true); }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Student</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.rollNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.branch}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.semester}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <button onClick={() => openEditStudent(student)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                        <button onClick={() => openDeleteStudent(student)} className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="text-center py-8 text-gray-500">No students found</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'faculty' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Faculty</h2>
              <button
                onClick={() => { setAddType('faculty'); setShowAddModal(true); }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Faculty</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {faculty.map((fac) => (
                    <tr key={fac._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{fac.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{fac.employeeId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{fac.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {fac.subjects?.map(s => s.name).join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{fac.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <button onClick={() => openEditFaculty(fac)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                        <button onClick={() => openDeleteFaculty(fac)} className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {faculty.length === 0 && (
                <div className="text-center py-8 text-gray-500">No faculty found</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
              <button
                onClick={() => { setAddType('subject'); setShowAddModal(true); }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Subject</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subjects.map((subject) => (
                    <tr key={subject._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{subject.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subject.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subject.branch}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subject.semester}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subject.credits}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <button onClick={() => openEditSubject(subject)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                        <button onClick={() => openDeleteSubject(subject)} className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">No subjects found</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <div className="space-y-6">
            {/* Generate Timetable Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Timetable</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-600 mb-4">Generate timetable for a branch and semester</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <select
                    className="input-field"
                    value={genBranch}
                    onChange={(e) => setGenBranch(e.target.value)}
                  >
                    {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    className="input-field"
                    value={genSemester}
                    onChange={(e) => setGenSemester(parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                  <button
                    onClick={generateTimetable}
                    disabled={loading}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Timetable'}
                  </button>
                </div>
              </div>
            </div>

            {/* List of Generated Timetables */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Timetables</h2>
              {generatedTimetables.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No timetables generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {generatedTimetables.map((tt) => (
                    <div key={`${tt.branch}-${tt.semester}`} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <span className="font-semibold text-gray-900">{tt.branch}</span>
                        <span className="text-gray-600"> - Semester {tt.semester}</span>
                        <div className="text-sm text-gray-500 mt-1">
                          Generated: {new Date(tt.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setViewBranch(tt.branch);
                            setViewSemester(tt.semester);
                            setActiveTab('viewTimetable');
                            setTimeout(() => fetchTimetable(), 100);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteTimetable(tt.branch, tt.semester)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'viewTimetable' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <select value={viewBranch} onChange={(e) => setViewBranch(e.target.value)} className="input-field">
                  {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(b => <option key={b}>{b}</option>)}
                </select>
                <select value={viewSemester} onChange={(e) => setViewSemester(parseInt(e.target.value))} className="input-field">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={fetchTimetable} className="bg-primary-600 text-white px-4 py-2 rounded-lg">Load Timetable</button>
              </div>

              {viewTimetable && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2">Time</th>
                          {viewTimetable.weekSchedule.map(day => <th key={day.day} className="border p-2">{day.day}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {viewTimetable.weekSchedule[0].slots.map((_, slotIdx) => (
                          <tr key={slotIdx}>
                            <td className="border p-2 font-medium">
                              {viewTimetable.weekSchedule[0].slots[slotIdx].startTime} - {viewTimetable.weekSchedule[0].slots[slotIdx].endTime}
                            </td>
                            {viewTimetable.weekSchedule.map((day, dayIdx) => {
                              const slot = day.slots[slotIdx];
                              const isEditing = editingSlot?.dayIdx === dayIdx && editingSlot?.slotIdx === slotIdx;
                              return (
                                <td key={day.day} className="border p-2">
                                  {isEditing ? (
                                    <div className="space-y-1">
                                      <input type="text" value={editFormData.subject || ''} onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })} placeholder="Subject" className="w-full text-xs border rounded p-1" />
                                      <input type="text" value={editFormData.room || ''} onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })} placeholder="Room" className="w-full text-xs border rounded p-1" />
                                      <input type="text" value={editFormData.startTime || ''} onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })} placeholder="Start Time" className="w-full text-xs border rounded p-1" />
                                      <input type="text" value={editFormData.endTime || ''} onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })} placeholder="End Time" className="w-full text-xs border rounded p-1" />
                                      <select
                                        value={editFormData.faculty || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, faculty: e.target.value })}
                                        className="w-full text-xs border rounded p-1"
                                      >
                                        <option value="">Select Faculty</option>
                                        {facultyList.map(fac => (
                                          <option key={fac._id} value={fac._id}>{fac.name} ({fac.employeeId})</option>
                                        ))}
                                      </select>
                                      <button onClick={() => updateSlot(dayIdx, slotIdx, editFormData)} className="bg-green-500 text-white px-1 py-0.5 rounded text-xs mr-1">Save</button>
                                      <button onClick={() => setEditingSlot(null)} className="bg-gray-500 text-white px-1 py-0.5 rounded text-xs">Cancel</button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="font-semibold">{slot.subject}</div>
                                      <div className="text-sm text-gray-600">Room: {slot.room}</div>
                                      <div className="text-xs text-gray-500">{slot.startTime} - {slot.endTime}</div>
                                      <div className="text-xs text-blue-600">Faculty: {slot.faculty?.name || 'Not assigned'}</div>
                                      <div className="flex gap-2 mt-1">
                                        <button
                                          onClick={async () => {
                                            // Fetch faculty list for the current branch
                                            try {
                                              const token = localStorage.getItem('token');
                                              const res = await axios.get(`http://localhost:5000/api/admin/faculty?branch=${viewBranch}`, {
                                                headers: { 'x-auth-token': token }
                                              });
                                              setFacultyList(res.data);
                                            } catch (err) {
                                              console.error('Error fetching faculty:', err);
                                            }
                                            setEditingSlot({ dayIdx, slotIdx });
                                            setEditFormData({
                                              subject: slot.subject,
                                              room: slot.room,
                                              startTime: slot.startTime,
                                              endTime: slot.endTime,
                                              faculty: slot.faculty?._id || ''  // store current faculty ID
                                            });
                                          }}
                                          className="text-blue-600 text-xs mt-1 hover:underline"
                                        >
                                          Edit
                                        </button>
                                        <button onClick={() => deleteSlot(dayIdx, slotIdx)} className="text-red-600 text-xs hover:underline">Delete</button>
                                      </div>
                                    </>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={exportToPDF} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg">Export to PDF</button>
                  <button onClick={() => setShowAddSlotModal(true)} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg ml-2">
                    Add New Slot
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add {addType}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              {addType === 'student' && (
                <>
                  <input type="text" name="name" placeholder="Full Name" className="input-field"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  <input type="email" name="email" placeholder="Email" className="input-field"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  <input type="password" name="password" placeholder="Password" className="input-field"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  <input type="text" name="rollNumber" placeholder="Roll Number" className="input-field"
                    value={formData.rollNumber} onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} required />
                  <select name="branch" className="input-field" value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}>
                    <option>IT</option><option>CSE</option><option>ECE</option>
                  </select>
                  <select name="semester" className="input-field" value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s}>{s}</option>)}
                  </select>
                </>
              )}
              {addType === 'faculty' && (
                <>
                  <input type="text" name="name" placeholder="Full Name" className="input-field"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  <input type="email" name="email" placeholder="Email" className="input-field"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  <input type="password" name="password" placeholder="Password" className="input-field"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  <input type="text" name="employeeId" placeholder="Employee ID" className="input-field"
                    value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} required />
                  <select name="department" className="input-field" value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                    <option>IT</option><option>CSE</option><option>ECE</option>
                  </select>
                </>
              )}
              {addType === 'subject' && (
                <>
                  <input type="text" name="subjectName" placeholder="Subject Name" className="input-field"
                    value={formData.subjectName} onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })} required />
                  <input type="text" name="subjectCode" placeholder="Subject Code" className="input-field"
                    value={formData.subjectCode} onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })} required />
                  <select name="branch" className="input-field" value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}>
                    <option>IT</option><option>CSE</option><option>ECE</option>
                  </select>
                  <select name="semester" className="input-field" value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s}>{s}</option>)}
                  </select>
                </>
              )}
              <div className="flex space-x-3 pt-4">
                <button type="submit" disabled={loading} className="btn-primary flex-1">Add</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Slot</h2>
            <div className="space-y-3">
              <select
                className="input-field"
                value={newSlotData.day}
                onChange={(e) => setNewSlotData({ ...newSlotData, day: e.target.value })}
              >
                <option value="">Select Day</option>
                {viewTimetable?.weekSchedule.map(day => (
                  <option key={day.day} value={day.day}>{day.day}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Slot Number"
                className="input-field"
                value={newSlotData.slotNumber}
                onChange={(e) => setNewSlotData({ ...newSlotData, slotNumber: e.target.value })}
              />
              <input
                type="text"
                placeholder="Subject"
                className="input-field"
                value={newSlotData.subject}
                onChange={(e) => setNewSlotData({ ...newSlotData, subject: e.target.value })}
              />
              <input
                type="text"
                placeholder="Room"
                className="input-field"
                value={newSlotData.room}
                onChange={(e) => setNewSlotData({ ...newSlotData, room: e.target.value })}
              />
              <input
                type="text"
                placeholder="Start Time (HH:MM)"
                className="input-field"
                value={newSlotData.startTime}
                onChange={(e) => setNewSlotData({ ...newSlotData, startTime: e.target.value })}
              />
              <input
                type="text"
                placeholder="End Time (HH:MM)"
                className="input-field"
                value={newSlotData.endTime}
                onChange={(e) => setNewSlotData({ ...newSlotData, endTime: e.target.value })}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button onClick={handleAddSlot} className="btn-primary flex-1">Add</button>
              <button onClick={() => setShowAddSlotModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Student</h2>
            <div className="space-y-3">
              <input type="text" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="input-field" />
              <input type="email" value={editingStudent.email} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} className="input-field" />
              <input type="text" value={editingStudent.rollNumber} onChange={(e) => setEditingStudent({ ...editingStudent, rollNumber: e.target.value })} className="input-field" />
              <select value={editingStudent.branch} onChange={(e) => setEditingStudent({ ...editingStudent, branch: e.target.value })} className="input-field">
                {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(b => <option key={b}>{b}</option>)}
              </select>
              <select value={editingStudent.semester} onChange={(e) => setEditingStudent({ ...editingStudent, semester: parseInt(e.target.value) })} className="input-field">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex space-x-3 pt-4">
              <button onClick={handleUpdateStudent} className="btn-primary flex-1">Save</button>
              <button onClick={() => setEditingStudent(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Modal */}
      {showDeleteOptions && deleteStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete {deleteStudent.name}</h2>
            <div className="flex space-x-3">
              <button onClick={handleSoftDelete} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex-1">Soft Delete</button>
              <button onClick={handleHardDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg flex-1">Hard Delete</button>
              <button onClick={() => setShowDeleteOptions(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {editingFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Faculty</h2>
            <div className="space-y-3">
              <input type="text" value={editingFaculty.name} onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })} className="input-field" />
              <input type="email" value={editingFaculty.email} onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })} className="input-field" />
              <input type="text" value={editingFaculty.employeeId} onChange={(e) => setEditingFaculty({ ...editingFaculty, employeeId: e.target.value })} className="input-field" />
              <select value={editingFaculty.department} onChange={(e) => setEditingFaculty({ ...editingFaculty, department: e.target.value })} className="input-field">
                {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex space-x-3 pt-4">
              <button onClick={handleUpdateFaculty} className="btn-primary flex-1">Save</button>
              <button onClick={() => setEditingFaculty(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Faculty Modal */}
      {showDeleteOptionsFaculty && deleteFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete {deleteFaculty.name}</h2>
            <div className="flex space-x-3">
              <button onClick={handleSoftDeleteFaculty} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex-1">Soft Delete</button>
              <button onClick={handleHardDeleteFaculty} className="bg-red-500 text-white px-4 py-2 rounded-lg flex-1">Hard Delete</button>
              <button onClick={() => setShowDeleteOptionsFaculty(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Subject</h2>
            <div className="space-y-3">
              <input type="text" value={editingSubject.name} onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })} className="input-field" />
              <input type="text" value={editingSubject.code} onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })} className="input-field" />
              <select value={editingSubject.branch} onChange={(e) => setEditingSubject({ ...editingSubject, branch: e.target.value })} className="input-field">
                {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(b => <option key={b}>{b}</option>)}
              </select>
              <select value={editingSubject.semester} onChange={(e) => setEditingSubject({ ...editingSubject, semester: parseInt(e.target.value) })} className="input-field">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s}>{s}</option>)}
              </select>
              <input type="number" value={editingSubject.credits} onChange={(e) => setEditingSubject({ ...editingSubject, credits: parseInt(e.target.value) })} className="input-field" />
            </div>
            <div className="flex space-x-3 pt-4">
              <button onClick={handleUpdateSubject} className="btn-primary flex-1">Save</button>
              <button onClick={() => setEditingSubject(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subject Modal */}
      {showDeleteOptionsSubject && deleteSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete {deleteSubject.name}</h2>
            <div className="flex space-x-3">
              <button onClick={handleSoftDeleteSubject} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex-1">Soft Delete</button>
              <button onClick={handleHardDeleteSubject} className="bg-red-500 text-white px-4 py-2 rounded-lg flex-1">Hard Delete</button>
              <button onClick={() => setShowDeleteOptionsSubject(false)} className="bg-gray-500 text-white px-4 py-2 rounded-lg flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;