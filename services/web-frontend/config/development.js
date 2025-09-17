// Ruth-AI Monitor Frontend - External Development Configuration

export const config = {
  // API Configuration - Pointing to microservices via API Gateway
  API_URL: 'http://localhost:3000/api',
  WS_URL: 'ws://localhost:3000',

  // Service URLs (for direct access during development)
  AUTH_SERVICE_URL: 'http://localhost:3000/api/auth',
  CAMERA_SERVICE_URL: 'http://localhost:3000/api/cameras',
  VIOLATION_SERVICE_URL: 'http://localhost:3000/api/violations',
  AI_MODELS_SERVICE_URL: 'http://localhost:3000/api/ai',
  NOTIFICATION_SERVICE_URL: 'http://localhost:3000/api/notifications',

  // VAS Integration (for camera feeds)
  VAS_API_URL: 'http://10.30.250.245:8000/api',
  VAS_WS_URL: 'ws://10.30.250.245:8188/janus',

  // Development Settings
  ENV: 'development',
  DEBUG: true,
  LOG_LEVEL: 'debug',

  // Feature Flags
  ENABLE_NOTIFICATIONS: true,
  ENABLE_REAL_TIME: true,
  ENABLE_AI_CHAT: true,
  ENABLE_ANALYTICS: true
};

export default config;
