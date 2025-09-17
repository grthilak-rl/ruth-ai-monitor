const express = require('express');
const { testConnection } = require('../config/database');
const socketService = require('../services/socket.service');
const notificationService = require('../services/notification.service');

const router = express.Router();

/**
 * Health check endpoint
 * @route GET /health
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const socketStats = socketService.getConnectionStats();
    const channels = notificationService.getChannels();
    
    const healthStatus = {
      status: 'healthy',
      service: 'notification-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
      socket_io: {
        enabled: true,
        total_connections: socketStats.total_connections,
        authenticated_connections: socketStats.authenticated_connections,
        connections_by_role: socketStats.connections_by_role
      },
      notification_channels: {
        total: channels.length,
        enabled: channels.filter(c => c.enabled).length,
        channels: channels
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    const isHealthy = dbStatus;
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'notification-service',
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
        service: 'notification-service',
        timestamp: new Date().toISOString(),
        database: 'connected',
        socket_io: 'enabled'
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'notification-service',
        timestamp: new Date().toISOString(),
        database: 'disconnected'
      });
    }
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      service: 'notification-service',
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
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Socket.IO health check
 * @route GET /health/socket
 */
router.get('/socket', (req, res) => {
  try {
    const socketStats = socketService.getConnectionStats();
    const connectedUsers = socketService.getConnectedUsers();
    
    res.status(200).json({
      status: 'healthy',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      socket_io: {
        enabled: true,
        ...socketStats,
        connected_users: connectedUsers
      }
    });
  } catch (error) {
    console.error('Socket health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Notification channels health check
 * @route GET /health/channels
 */
router.get('/channels', (req, res) => {
  try {
    const channels = notificationService.getChannels();
    const templates = notificationService.getTemplates();
    
    res.status(200).json({
      status: 'healthy',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      channels: {
        total: channels.length,
        enabled: channels.filter(c => c.enabled).length,
        channels: channels
      },
      templates: {
        total: templates.length,
        templates: templates.map(t => ({ id: t.id, title: t.title, channels: t.channels }))
      }
    });
  } catch (error) {
    console.error('Channels health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
