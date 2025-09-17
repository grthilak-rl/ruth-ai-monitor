const express = require('express');
const { testConnection } = require('../config/database');
const vasIntegrationService = require('../services/vasIntegration.service');

const router = express.Router();

/**
 * Health check endpoint
 * @route GET /health
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const vasHealth = await vasIntegrationService.healthCheck();
    
    const healthStatus = {
      status: 'healthy',
      service: 'camera-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
      vas_integration: {
        enabled: !!process.env.VAS_API_URL,
        status: vasHealth.vas_backend ? 'connected' : 'disconnected',
        authentication: vasHealth.authentication ? 'authenticated' : 'not_authenticated',
        janus_gateway: vasHealth.janus_gateway ? 'healthy' : 'unhealthy'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    const isHealthy = dbStatus && vasHealth.vas_backend;
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'camera-service',
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
    const vasHealth = await vasIntegrationService.healthCheck();
    
    if (dbStatus && vasHealth.vas_backend) {
      res.status(200).json({
        status: 'ready',
        service: 'camera-service',
        timestamp: new Date().toISOString(),
        database: 'connected',
        vas_integration: 'connected'
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'camera-service',
        timestamp: new Date().toISOString(),
        database: dbStatus ? 'connected' : 'disconnected',
        vas_integration: vasHealth.vas_backend ? 'connected' : 'disconnected'
      });
    }
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      service: 'camera-service',
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
    service: 'camera-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * VAS integration health check
 * @route GET /health/vas
 */
router.get('/vas', async (req, res) => {
  try {
    const vasHealth = await vasIntegrationService.healthCheck();
    
    res.status(200).json({
      status: 'healthy',
      service: 'camera-service',
      timestamp: new Date().toISOString(),
      vas_integration: vasHealth
    });
  } catch (error) {
    console.error('VAS health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'camera-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
