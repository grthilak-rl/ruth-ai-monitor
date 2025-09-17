// Microservices API Client for Ruth-AI Monitor
import axios from 'axios';
import config from '../config/environment';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service API
export const authApi = {
  // Login
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await apiClient.put('/auth/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiClient.put('/auth/password', passwordData);
    return response.data;
  }
};

// Camera Service API
export const cameraApi = {
  // Get all cameras
  getCameras: async (params = {}) => {
    const response = await apiClient.get('/cameras', { params });
    return response.data;
  },

  // Get camera by ID
  getCamera: async (id) => {
    const response = await apiClient.get(`/cameras/${id}`);
    return response.data;
  },

  // Create camera
  createCamera: async (cameraData) => {
    const response = await apiClient.post('/cameras', cameraData);
    return response.data;
  },

  // Update camera
  updateCamera: async (id, cameraData) => {
    const response = await apiClient.put(`/cameras/${id}`, cameraData);
    return response.data;
  },

  // Delete camera
  deleteCamera: async (id) => {
    const response = await apiClient.delete(`/cameras/${id}`);
    return response.data;
  },

  // Assign AI model to camera
  assignModel: async (cameraId, modelId) => {
    const response = await apiClient.post(`/cameras/${cameraId}/models`, { modelId });
    return response.data;
  },

  // Remove AI model from camera
  removeModel: async (cameraId, modelId) => {
    const response = await apiClient.delete(`/cameras/${cameraId}/models/${modelId}`);
    return response.data;
  },

  // Sync with VAS
  syncWithVAS: async (cameraId) => {
    const response = await apiClient.post(`/cameras/${cameraId}/sync-vas`);
    return response.data;
  },

  // Get camera status
  getCameraStatus: async (id) => {
    const response = await apiClient.get(`/cameras/${id}/status`);
    return response.data;
  }
};

// Violation Service API
export const violationApi = {
  // Get all violations
  getViolations: async (params = {}) => {
    const response = await apiClient.get('/violations', { params });
    return response.data;
  },

  // Get violation by ID
  getViolation: async (id) => {
    const response = await apiClient.get(`/violations/${id}`);
    return response.data;
  },

  // Create violation
  createViolation: async (violationData) => {
    const response = await apiClient.post('/violations', violationData);
    return response.data;
  },

  // Update violation
  updateViolation: async (id, violationData) => {
    const response = await apiClient.put(`/violations/${id}`, violationData);
    return response.data;
  },

  // Delete violation
  deleteViolation: async (id) => {
    const response = await apiClient.delete(`/violations/${id}`);
    return response.data;
  },

  // Acknowledge violation
  acknowledgeViolation: async (id, data) => {
    const response = await apiClient.post(`/violations/${id}/acknowledge`, data);
    return response.data;
  },

  // Resolve violation
  resolveViolation: async (id, data) => {
    const response = await apiClient.post(`/violations/${id}/resolve`, data);
    return response.data;
  },

  // Get violation analytics
  getAnalytics: async (params = {}) => {
    const response = await apiClient.get('/violations/analytics', { params });
    return response.data;
  },

  // Export violations
  exportViolations: async (params = {}) => {
    const response = await apiClient.get('/violations/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

// AI Models Service API
export const aiModelsApi = {
  // Get available models
  getModels: async () => {
    const response = await apiClient.get('/ai/models');
    return response.data;
  },

  // Get model info
  getModelInfo: async (modelName) => {
    const response = await apiClient.get(`/ai/models/${modelName}`);
    return response.data;
  },

  // Predict with model
  predict: async (modelName, data) => {
    const response = await apiClient.post(`/ai/predict/${modelName}`, data);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/ai/health');
    return response.data;
  }
};

// Notification Service API
export const notificationApi = {
  // Get notifications
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  // Get notification by ID
  getNotification: async (id) => {
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await apiClient.post(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (userId) => {
    const response = await apiClient.post('/notifications/mark-all-read', { recipient_id: userId });
    return response.data;
  },

  // Get notification stats
  getStats: async () => {
    const response = await apiClient.get('/notifications/stats');
    return response.data;
  },

  // Get notification templates
  getTemplates: async () => {
    const response = await apiClient.get('/notifications/templates');
    return response.data;
  },

  // Get notification channels
  getChannels: async () => {
    const response = await apiClient.get('/notifications/channels');
    return response.data;
  },

  // Send notification
  sendNotification: async (notificationData) => {
    const response = await apiClient.post('/notifications/send', notificationData);
    return response.data;
  },

  // Broadcast notification
  broadcastNotification: async (notificationData) => {
    const response = await apiClient.post('/notifications/broadcast', notificationData);
    return response.data;
  }
};

// VAS Integration API (direct to VAS)
export const vasApi = {
  // Get VAS devices
  getDevices: async () => {
    const response = await axios.get(`${config.VAS_API_URL}/devices`);
    return response.data;
  },

  // Get device by ID
  getDevice: async (id) => {
    const response = await axios.get(`${config.VAS_API_URL}/devices/${id}`);
    return response.data;
  },

  // Create device
  createDevice: async (deviceData) => {
    const response = await axios.post(`${config.VAS_API_URL}/devices`, deviceData);
    return response.data;
  },

  // Update device
  updateDevice: async (id, deviceData) => {
    const response = await axios.put(`${config.VAS_API_URL}/devices/${id}`, deviceData);
    return response.data;
  },

  // Delete device
  deleteDevice: async (id) => {
    const response = await axios.delete(`${config.VAS_API_URL}/devices/${id}`);
    return response.data;
  },

  // Get device streams
  getStreams: async (deviceId) => {
    const response = await axios.get(`${config.VAS_API_URL}/devices/${deviceId}/streams`);
    return response.data;
  },

  // Start stream
  startStream: async (deviceId, streamId) => {
    const response = await axios.post(`${config.VAS_API_URL}/devices/${deviceId}/streams/${streamId}/start`);
    return response.data;
  },

  // Stop stream
  stopStream: async (deviceId, streamId) => {
    const response = await axios.post(`${config.VAS_API_URL}/devices/${deviceId}/streams/${streamId}/stop`);
    return response.data;
  }
};

// Socket.IO Service for real-time communication
export const socketService = {
  socket: null,
  
  connect: () => {
    if (!socketService.socket) {
      const { io } = require('socket.io-client');
      socketService.socket = io(config.WS_URL, {
        auth: {
          token: localStorage.getItem('authToken')
        }
      });
    }
    return socketService.socket;
  },

  disconnect: () => {
    if (socketService.socket) {
      socketService.socket.disconnect();
      socketService.socket = null;
    }
  },

  // Notification events
  onNotification: (callback) => {
    const socket = socketService.connect();
    socket.on('notification', callback);
  },

  onViolationDetected: (callback) => {
    const socket = socketService.connect();
    socket.on('violation_detected', callback);
  },

  onCameraStatusUpdate: (callback) => {
    const socket = socketService.connect();
    socket.on('camera_status_update', callback);
  },

  onSystemStatusUpdate: (callback) => {
    const socket = socketService.connect();
    socket.on('system_status_update', callback);
  },

  // Join rooms
  joinCameraRoom: (cameraId) => {
    const socket = socketService.connect();
    socket.emit('subscribe:camera', cameraId);
  },

  joinViolationsRoom: () => {
    const socket = socketService.connect();
    socket.emit('subscribe:violations');
  },

  joinNotificationsRoom: () => {
    const socket = socketService.connect();
    socket.emit('subscribe:notifications');
  },

  // Leave rooms
  leaveCameraRoom: (cameraId) => {
    const socket = socketService.connect();
    socket.emit('unsubscribe:camera', cameraId);
  },

  leaveViolationsRoom: () => {
    const socket = socketService.connect();
    socket.emit('unsubscribe:violations');
  },

  leaveNotificationsRoom: () => {
    const socket = socketService.connect();
    socket.emit('unsubscribe:notifications');
  }
};

export default {
  authApi,
  cameraApi,
  violationApi,
  aiModelsApi,
  notificationApi,
  vasApi,
  socketService
};
