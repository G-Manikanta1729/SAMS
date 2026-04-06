import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios default header
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  }

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const role = localStorage.getItem('role');
      
      if (role === 'student') {
        const res = await axios.get('http://localhost:5000/api/students/dashboard');
        if (res.data && res.data.student) {
          setUser({ ...res.data.student, role: 'student' });
        }
      } else if (role === 'faculty') {
        const res = await axios.get('http://localhost:5000/api/faculty/dashboard');
        if (res.data && res.data.faculty) {
          setUser({ ...res.data.faculty, role: 'faculty' });
        }
      } else if (role === 'admin') {
        setUser({ name: 'Admin', role: 'admin', email: 'admin@college.edu' });
      }
    } catch (err) {
      console.error('Load user error:', err.response?.data || err.message);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      delete axios.defaults.headers.common['x-auth-token'];
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    try {
      console.log('Sending login request:', { email, role });
      
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        role
      });
      
      console.log('Login response:', res.data);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', role);
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setToken(res.data.token);
        setUser(res.data.user);
        
        return { success: true };
      } else {
        return { success: false, error: 'No token received' };
      }
    } catch (err) {
      console.error('Login error details:', err.response?.data);
      const errorMsg = err.response?.data?.msg || err.message || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    delete axios.defaults.headers.common['x-auth-token'];
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};