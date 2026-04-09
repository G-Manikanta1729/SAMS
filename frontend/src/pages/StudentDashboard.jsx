import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ChartBarIcon,
  CalendarIcon,
  BellIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Line, Bar } from 'recharts';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dailyAttendance, setDailyAttendance] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [dashboardRes, attendanceRes, marksRes, timetableRes, notificationsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/students/dashboard'),
        axios.get('http://localhost:5000/api/students/attendance'),
        axios.get('http://localhost:5000/api/students/marks'),
        axios.get('http://localhost:5000/api/students/timetable'),
        axios.get('http://localhost:5000/api/students/notifications'),
        axios.get('http://localhost:5000/api/students/attendance/daily')
      ]);
      setDashboardData(dashboardRes.data);
      setAttendance(attendanceRes.data);
      setMarks(marksRes.data);
      setTimetable(timetableRes.data);
      setNotifications(notificationsRes.data);
      setDailyAttendance(dailyAttRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyAttendance = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/students/attendance/daily');
      setDailyAttendance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const overallAttendance = attendance.length > 0
    ? (attendance.reduce((acc, curr) => acc + curr.percentage, 0) / attendance.length).toFixed(1)
    : 0;

  const lowAttendanceSubjects = attendance.filter(a => a.status === 'LOW').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                SAMS
              </h1>
              <span className="ml-3 text-sm text-gray-500">Student Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <BellIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
                {dashboardData?.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {dashboardData.notifications}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {dashboardData?.student.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{dashboardData?.student.name}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {['overview', 'attendance', 'marks', 'timetable', 'notifications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Welcome back, {dashboardData?.student.name}! 👋</h1>
              <p className="text-primary-100">
                Roll Number: {dashboardData?.student.rollNumber} | {dashboardData?.student.branch} - Semester {dashboardData?.student.semester}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Overall Attendance</p>
                    <p className="text-3xl font-bold text-gray-900">{overallAttendance}%</p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                {lowAttendanceSubjects > 0 && (
                  <div className="mt-4 flex items-center text-sm text-red-600">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    <span>{lowAttendanceSubjects} subjects below 75%</span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Average Marks</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {marks.length > 0 ? (marks.reduce((acc, curr) => acc + curr.final, 0) / marks.length).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3">
                    <AcademicCapIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Today's Classes</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {timetable.find(d => d.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }))?.slots?.length || 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-lg p-3">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => setActiveTab('attendance')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-medium">View Attendance</span>
                </button>
                <button onClick={() => setActiveTab('marks')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
                  <AcademicCapIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium">View Marks</span>
                </button>
                <button onClick={() => setActiveTab('timetable')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
                  <CalendarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-medium">View Timetable</span>
                </button>
                <button onClick={() => setActiveTab('notifications')} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
                  <BellIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <span className="text-sm font-medium">Notifications</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Attendance Details</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {attendance.map((record, idx) => (
                <div key={idx} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{record.subject}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${record.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {record.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${record.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(record.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-sm text-gray-600">
                    <span>Attended: {record.attended} / {record.total} classes</span>
                    {record.status === 'LOW' && (
                      <span className="text-red-600">Need {record.requiredClasses} more classes to reach 75%</span>
                    )}
                  </div>
                  {/* Daily Attendance Records */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Daily Attendance Records</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border p-2 text-left">Date</th>
                            <th className="border p-2 text-left">Subject</th>
                            <th className="border p-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyAttendance.map((record, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="border p-2">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="border p-2">{record.subject}</td>
                              <td className={`border p-2 font-semibold ${record.status === 'present' ? 'text-green-600' : 'text-red-600'}`}>
                                {record.status.toUpperCase()}
                              </td>
                            </tr>
                          ))}
                          {dailyAttendance.length === 0 && (
                            <tr>
                              <td colSpan="3" className="text-center py-4 text-gray-500">No daily attendance records found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
              {attendance.length === 0 && (
                <div className="text-center py-12 text-gray-500">No attendance records found</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="space-y-6">
            {marks.map((record, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">{record.subject}</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Mid 1</p>
                      <p className="text-2xl font-bold text-blue-600">{record.mid1.total}/30</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Mid 2</p>
                      <p className="text-2xl font-bold text-blue-600">{record.mid2.total}/30</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Internal (80-20)</p>
                      <p className="text-2xl font-bold text-green-600">{record.internal.toFixed(1)}/30</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">External</p>
                      <p className="text-2xl font-bold text-purple-600">{record.external}/70</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Final Marks</span>
                      <span className="text-2xl font-bold text-primary-600">{record.final}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {marks.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">No marks records found</div>
            )}
          </div>
        )}

        {activeTab === 'timetable' && (
          <div className="space-y-6">
            {timetable.map((day, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600">
                  <h3 className="font-semibold text-white text-lg">{day.day}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {day.slots?.map((slot, slotIdx) => (
                    <div key={slotIdx} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{slot.subject}</p>
                        <p className="text-sm text-gray-500">Room: {slot.room}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{slot.startTime} - {slot.endTime}</p>
                        <p className="text-xs text-gray-400">Slot {slot.slotNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {timetable.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">No timetable found</div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {notifications.map((notification, idx) => (
                <div key={idx} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'attendance' && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                      )}
                      {notification.type === 'marks' && (
                        <AcademicCapIcon className="h-5 w-5 text-red-500" />
                      )}
                      {notification.type === 'timetable' && (
                        <CalendarIcon className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12 text-gray-500">No notifications</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;