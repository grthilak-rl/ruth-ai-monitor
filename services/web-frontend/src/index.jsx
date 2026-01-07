import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/index.css';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider } from './contexts/AuthContext';
import axios from 'axios';

// Configure Axios to include the authentication token and set base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://10.30.250.245:3005/api';
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('Axios Interceptor: Token being sent:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const authToken = localStorage.getItem('authToken');

    // Skip authentication redirects if using demo bypass token
    const isDemoMode = authToken === 'demo-bypass-token';

    if (isDemoMode) {
      // In demo mode, just log errors without redirecting
      console.warn('API call failed in demo mode:', error.response?.status, originalRequest.url);
      return Promise.reject(error);
    }

    // Only attempt token refresh if:
    // 1. Error is 401 Unauthorized
    // 2. Request hasn't been retried already
    // 3. We have a refresh token
    // 4. This isn't a login or refresh token request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/refresh-token')
    ) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const response = await axios.post('/api/auth/refresh-token', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('authToken', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear tokens and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userSession');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userSession');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>
          <App />
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
