const express = require('express');
const { testConnection } = require('../config/database');
const aiIntegrationService = require('../services/aiIntegration.service');

const router = express.Router();

/**
 * Health check endpoint
 * @route GET /health
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const aiHealth = await aiIntegrationService.healthCheck();
    
    const healthStatus = {
      status: 'healthy',
      service: 'violation-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
      ai_integration: {
        enabled: !!process.env.AI_MODELS_SERVICE_URL,
        ai_models_service: aiHealth.ai_models_service ? 'connected' : 'disconnected',
        available_models: aiHealth.available_models || 0,
        camera_service: aiHealth.camera_service ? 'connected' : 'disconnected',
        last_health_check: aiHealth.last_health_check
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    const isHealthy = dbStatus && aiHealth.ai_models_service;
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'violation-service',
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
    const aiHealth = await aiIntegrationService.healthCheck();
    
    if (dbStatus && aiHealth.ai_models_service) {
      res.status(200).json({
        status: 'ready',
        service: 'violation-service',
        timestamp: new Date().toISOString(),
        database: 'connected',
        ai_models_service: 'connected',
        camera_service: 'connected'
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'violation-service',
        timestamp: new Date().toISOString(),
        database: dbStatus ? 'connected' : 'disconnected',
        ai_models_service: aiHealth.ai_models_service ? 'connected' : 'disconnected',
        camera_service: aiHealth.camera_service ? 'connected' : 'disconnected'
      });
    }
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      service: 'violation-service',
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
    service: 'violation-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * AI integration health check
 * @route GET /health/ai
 */
router.get('/ai', async (req, res) => {
  try {
    const aiHealth = await aiIntegrationService.healthCheck();
    
    res.status(200).json({
      status: 'healthy',
      service: 'violation-service',
      timestamp: new Date().toISOString(),
      ai_integration: aiHealth
    });
  } catch (error) {
    console.error('AI health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'violation-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
