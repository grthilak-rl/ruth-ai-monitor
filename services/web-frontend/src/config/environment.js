// Environment configuration for Ruth-AI Monitor (Microservices)
// This file handles environment variables in a Vite-compatible way

export const config = {
  // Microservices API URLs (via API Gateway)
  API_URL: import.meta.env.VITE_API_URL || 'http://10.30.250.245:3005/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://10.30.250.245:3005',
  
  // Individual Service URLs (for direct access during development)
  AUTH_SERVICE_URL: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://10.30.250.245:3005/api/auth',
  CAMERA_SERVICE_URL: import.meta.env.VITE_CAMERA_SERVICE_URL || 'http://10.30.250.245:3005/api/cameras',
  VIOLATION_SERVICE_URL: import.meta.env.VITE_VIOLATION_SERVICE_URL || 'http://10.30.250.245:3005/api/violations',
  AI_MODELS_SERVICE_URL: import.meta.env.VITE_AI_MODELS_SERVICE_URL || 'http://10.30.250.245:3005/api/ai',
  NOTIFICATION_SERVICE_URL: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://10.30.250.245:3005/api/notifications',
  
  // VAS Integration (for camera feeds)
  VAS_API_URL: import.meta.env.VITE_VAS_API_URL || 'http://10.30.250.245:8000/api',
  VAS_WS_URL: import.meta.env.VITE_VAS_WS_URL || 'ws://10.30.250.245:8188/janus',
  
  // Development flags
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  
  // Feature Flags
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME !== 'false',
  ENABLE_AI_CHAT: import.meta.env.VITE_ENABLE_AI_CHAT !== 'false',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  
  // Default VAS credentials (for development)
  VAS_DEFAULT_USERNAME: 'admin',
  VAS_DEFAULT_PASSWORD: 'admin123'
};

export default config;
