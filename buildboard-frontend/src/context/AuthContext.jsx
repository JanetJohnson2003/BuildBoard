import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const mockUser = {
      id: 'mock-user-id',
      username: email.split('@')[0],
      name: 'Test User',
      email,
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Test+User'
    };
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('refreshToken', 'mock-refresh');
    setUser(mockUser);
    return { token: 'mock-token', refreshToken: 'mock-refresh', user: mockUser };
  };

  const register = async (userData) => {
    const mockUser = {
      id: 'mock-user-id',
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
      avatar: `https://ui-avatars.com/api/?name=${userData.name}`
    };
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('refreshToken', 'mock-refresh');
    setUser(mockUser);
    return { token: 'mock-token', refreshToken: 'mock-refresh', user: mockUser };
  };

  const sendOtp = async (email) => {
    return { message: 'OTP sent', devOtp: '123456' };
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, sendOtp, logout, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
