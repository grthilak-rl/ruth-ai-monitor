const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const notificationRoutes = require('./routes/notification.routes');
const healthRoutes = require('./routes/health.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { verifyToken } = require('./middleware/auth.middleware');
const socketService = require('./services/socket.service');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: 'Too many notification requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/', notificationLimiter);

// Routes
app.use('/notifications', notificationRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'notification-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      notifications: '/notifications',
      'notification-by-id': '/notifications/:id',
      'notification-preferences': '/notifications/preferences',
      'notification-templates': '/notifications/templates',
      'notification-channels': '/notifications/channels',
      'notification-stats': '/notifications/stats',
      'notification-send': '/notifications/send',
      'notification-broadcast': '/notifications/broadcast',
      'notification-mark-read': '/notifications/:id/read',
      'notification-mark-all-read': '/notifications/mark-all-read',
      'notification-delete': '/notifications/:id',
      'socket-io': '/socket.io/'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Initialize Socket.IO
socketService.initialize(server);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🔌 Socket.IO: Enabled`);
  console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE_URL ? 'Enabled' : 'Disabled'}`);
  console.log(`📱 SMS Service: ${process.env.SMS_SERVICE_URL ? 'Enabled' : 'Disabled'}`);
});

module.exports = { app, server };
