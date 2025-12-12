import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState({
    username: 'demo_user',
    email: 'demo@ruth-ai.com',
    role: 'admin'
  });

  // Authentication bypassed for development - auto-login as demo user
  useEffect(() => {
    const demoUser = {
      username: 'demo_user',
      email: 'demo@ruth-ai.com',
      role: 'admin'
    };

    // Auto-authenticate with demo user
    setIsAuthenticated(true);
    setUser(demoUser);

    // Set placeholder tokens to prevent axios interceptor redirects and login page checks
    if (!localStorage.getItem('authToken')) {
      localStorage.setItem('authToken', 'demo-bypass-token');
    }
    if (!localStorage.getItem('userSession')) {
      localStorage.setItem('userSession', JSON.stringify(demoUser));
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