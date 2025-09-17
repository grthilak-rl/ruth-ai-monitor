const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const cameraRoutes = require('./routes/camera.routes');
const healthRoutes = require('./routes/health.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { verifyToken } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const cameraLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: 'Too many camera requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/', cameraLimiter);

// Routes
app.use('/cameras', cameraRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'camera-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      cameras: '/cameras',
      'camera-by-id': '/cameras/:id',
      'camera-models': '/cameras/:id/models',
      'vas-sync': '/cameras/sync-vas',
      'vas-health': '/cameras/vas-health',
      'stream-status': '/cameras/:id/stream-status',
      'start-stream': '/cameras/:id/start-stream',
      'stop-stream': '/cameras/:id/stop-stream'
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📹 Camera Service running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🎥 VAS Integration: ${process.env.VAS_API_URL ? 'Enabled' : 'Disabled'}`);
});

module.exports = app;
