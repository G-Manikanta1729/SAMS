import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Student specific
    rollNumber: '',
    branch: 'IT',
    semester: 1,
    
    // Faculty specific
    employeeId: '',
    department: 'IT',
    subjects: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
  const departments = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Mathematics', 'Physics', 'English'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubjectAdd = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { name: '', code: '', branch: formData.branch, semester: formData.semester }]
    });
  };
  
  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index][field] = value;
    setFormData({ ...formData, subjects: updatedSubjects });
  };
  
  const handleSubjectRemove = (index) => {
    const updatedSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData({ ...formData, subjects: updatedSubjects });
  };
  
  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    setError('');
    setCurrentStep(currentStep + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      let endpoint = '';
      let payload = {};
      
      if (role === 'student') {
        endpoint = 'http://localhost:5000/api/auth/register/student';
        payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          rollNumber: formData.rollNumber,
          branch: formData.branch,
          semester: parseInt(formData.semester)
        };
      } else if (role === 'faculty') {
        endpoint = 'http://localhost:5000/api/auth/register/faculty';
        payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          employeeId: formData.employeeId,
          department: formData.department,
          subjects: formData.subjects.filter(s => s.name && s.code)
        };
      }
      
      await axios.post(endpoint, payload);
      
      setSuccess(`${role === 'student' ? 'Student' : 'Faculty'} registered successfully! Redirecting to login...`);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 py-12 px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block"
            >
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-primary-100">Join Smart Academic Management System</p>
          </div>
          
          {/* Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Progress Steps */}
            <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`flex-1 text-center ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                    1
                  </div>
                  <p className="text-xs mt-1">Basic Info</p>
                </div>
                <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                    2
                  </div>
                  <p className="text-xs mt-1">Role Details</p>
                </div>
                {role === 'faculty' && (
                  <>
                    <div className={`flex-1 h-0.5 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                    <div className={`flex-1 text-center ${currentStep >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                        3
                      </div>
                      <p className="text-xs mt-1">Subjects</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
              
              {success && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg"
                >
                  {success}
                </motion.div>
              )}
              
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        I am registering as
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {['student', 'faculty'].map((r) => (
                          <motion.button
                            key={r}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRole(r)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              role === r
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            <div className="text-3xl mb-2">
                              {r === 'student' ? '👨‍🎓' : '👨‍🏫'}
                            </div>
                            <div className="font-semibold capitalize">{r}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                          placeholder="Minimum 6 characters"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                          placeholder="Re-enter password"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {currentStep === 2 && role === 'student' && (
                  <motion.div
                    key="step2-student"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Roll Number *
                      </label>
                      <input
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="e.g., 2024001"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Branch *
                        </label>
                        <select
                          name="branch"
                          value={formData.branch}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                          required
                        >
                          {branches.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Semester *
                        </label>
                        <select
                          name="semester"
                          value={formData.semester}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                          required
                        >
                          {semesters.map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {currentStep === 2 && role === 'faculty' && (
                  <motion.div
                    key="step2-faculty"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Employee ID *
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="e.g., FAC001"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department *
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        required
                      >
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
                
                {currentStep === 3 && role === 'faculty' && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-semibold text-gray-700">
                        Subjects You Teach
                      </label>
                      <button
                        type="button"
                        onClick={handleSubjectAdd}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Subject
                      </button>
                    </div>
                    
                    {formData.subjects.map((subject, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl">
                        <input
                          type="text"
                          placeholder="Subject Name"
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="text"
                          placeholder="Subject Code"
                          value={subject.code}
                          onChange={(e) => handleSubjectChange(index, 'code', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <select
                          value={subject.branch}
                          onChange={(e) => handleSubjectChange(index, 'branch', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {branches.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <select
                            value={subject.semester}
                            onChange={(e) => handleSubjectChange(index, 'semester', parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {semesters.map(s => (
                              <option key={s} value={s}>Sem {s}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSubjectRemove(index)}
                            className="bg-red-500 text-white px-3 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {formData.subjects.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-gray-500">No subjects added. Click "Add Subject" to add subjects you teach.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < (role === 'faculty' ? 3 : 2) ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Account...
                      </div>
                    ) : (
                      'Register'
                    )}
                  </button>
                )}
              </div>
            </form>
            
            {/* Login Link */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;