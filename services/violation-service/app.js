const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const violationRoutes = require('./routes/violation.routes');
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
const violationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  message: 'Too many violation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/', violationLimiter);

// Routes
app.use('/violations', violationRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'violation-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      violations: '/violations',
      'violation-by-id': '/violations/:id',
      'violation-stats': '/violations/stats',
      'violation-export': '/violations/export',
      'violation-acknowledge': '/violations/:id/acknowledge',
      'violation-resolve': '/violations/:id/resolve',
      'violation-false-positive': '/violations/:id/false-positive',
      'violation-bulk-update': '/violations/bulk-update',
      'violation-processing': '/violations/processing/status',
      'violation-start-processing': '/violations/processing/start',
      'violation-stop-processing': '/violations/processing/stop'
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
  console.log(`🚨 Violation Service running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🤖 AI Models Service: ${process.env.AI_MODELS_SERVICE_URL ? 'Enabled' : 'Disabled'}`);
  console.log(`📹 Camera Service: ${process.env.CAMERA_SERVICE_URL ? 'Enabled' : 'Disabled'}`);
});

module.exports = app;
