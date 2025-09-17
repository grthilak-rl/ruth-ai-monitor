import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Placeholder for actual authentication logic
  useEffect(() => {
    // In a real application, you would check for a token in localStorage or a cookie
    // and validate it with your backend.
    const token = localStorage.getItem('authToken');
    if (token) {
      // Simulate a successful login
      setIsAuthenticated(true);
      setUser({ username: 'testuser' }); // Replace with actual user data
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.token && response.data.refreshToken) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        console.log('Auth Token set in localStorage:', response.data.token);
        console.log('Refresh Token set in localStorage:', response.data.refreshToken);
        setIsAuthenticated(true);
        setUser(response.data.user); // Assuming backend returns user data
        return { success: true };
      } else {
        return { success: false, message: 'No token received' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authToken');
    // Optionally, redirect to login page or refresh
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);