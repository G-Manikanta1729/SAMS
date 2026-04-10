import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';

// Mock the AuthContext BEFORE importing Login
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
  })
}));

// Now import Login after the mock is set up
import Login from '../pages/Login';

describe('SAMS Frontend Tests', () => {
  
  test('Login page should render correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByText(/Smart Academic Management System/i)).toBeInTheDocument();
  });

  test('Should have email and password input fields', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
  });

  test('Role buttons should be present', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByText('student')).toBeInTheDocument();
    expect(screen.getByText('faculty')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
});
