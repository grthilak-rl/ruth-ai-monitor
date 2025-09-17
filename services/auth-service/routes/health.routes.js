const express = require('express');
const { testConnection } = require('../config/database');

const router = express.Router();

/**
 * Health check endpoint
 * @route GET /health
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    const healthStatus = {
      status: 'healthy',
      service: 'auth-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    const statusCode = dbStatus ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Readiness check endpoint
 * @route GET /health/ready
 */
router.get('/ready', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    if (dbStatus) {
      res.status(200).json({
        status: 'ready',
        service: 'auth-service',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        reason: 'Database connection failed'
      });
    }
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Liveness check endpoint
 * @route GET /health/live
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
