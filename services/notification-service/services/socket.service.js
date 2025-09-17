const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const axios = require('axios');

class SocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    console.log('🔌 Socket.IO service initialized');

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);
      this.connections.set(socket.id, { socket, userId: null, authenticated: false });

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        try {
          if (data && data.token) {
            const user = await this.verifyToken(data.token);
            if (user) {
              this.connections.set(socket.id, { 
                socket, 
                userId: user.id, 
                userRole: user.role,
                authenticated: true 
              });
              
              // Join user-specific room
              socket.join(`user:${user.id}`);
              
              // Join role-specific room
              socket.join(`role:${user.role}`);
              
              console.log(`✅ User ${user.id} (${user.role}) authenticated on socket ${socket.id}`);
              
              // Send authentication success
              socket.emit('authenticated', { 
                success: true, 
                user: { id: user.id, role: user.role } 
              });
            } else {
              socket.emit('authentication_error', { 
                success: false, 
                message: 'Invalid token' 
              });
            }
          } else {
            socket.emit('authentication_error', { 
              success: false, 
              message: 'Token required' 
            });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_error', { 
            success: false, 
            message: 'Authentication failed' 
          });
        }
      });

      // Handle camera subscription
      socket.on('subscribe:camera', (cameraId) => {
        if (cameraId) {
          socket.join(`camera:${cameraId}`);
          console.log(`📹 Socket ${socket.id} subscribed to camera ${cameraId}`);
        }
      });

      // Handle camera unsubscription
      socket.on('unsubscribe:camera', (cameraId) => {
        if (cameraId) {
          socket.leave(`camera:${cameraId}`);
          console.log(`📹 Socket ${socket.id} unsubscribed from camera ${cameraId}`);
        }
      });

      // Handle violation subscription
      socket.on('subscribe:violations', () => {
        socket.join('violations');
        console.log(`🚨 Socket ${socket.id} subscribed to violations`);
      });

      // Handle violation unsubscription
      socket.on('unsubscribe:violations', () => {
        socket.leave('violations');
        console.log(`🚨 Socket ${socket.id} unsubscribed from violations`);
      });

      // Handle notification subscription
      socket.on('subscribe:notifications', () => {
        socket.join('notifications');
        console.log(`🔔 Socket ${socket.id} subscribed to notifications`);
      });

      // Handle notification unsubscription
      socket.on('unsubscribe:notifications', () => {
        socket.leave('notifications');
        console.log(`🔔 Socket ${socket.id} unsubscribed from notifications`);
      });

      // Handle system status subscription
      socket.on('subscribe:system', () => {
        socket.join('system');
        console.log(`⚙️ Socket ${socket.id} subscribed to system updates`);
      });

      // Handle system status unsubscription
      socket.on('unsubscribe:system', () => {
        socket.leave('system');
        console.log(`⚙️ Socket ${socket.id} unsubscribed from system updates`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connections.delete(socket.id);
      });
    });
  }

  /**
   * Verify JWT token with Auth Service
   */
  async verifyToken(token) {
    try {
      const response = await axios.get(`${this.authServiceUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });

      if (response.status === 200 && response.data.success) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Token verification error:', error.message);
      return null;
    }
  }

  /**
   * Emit event to all connected clients
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToAll(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
    console.log(`📡 Emitted ${event} to all clients`);
  }

  /**
   * Emit event to a specific user
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToUser(userId, event, data) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`📡 Emitted ${event} to user ${userId}`);
  }

  /**
   * Emit event to users with specific role
   * @param {string} role - User role
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToRole(role, event, data) {
    if (!this.io) return;
    this.io.to(`role:${role}`).emit(event, data);
    console.log(`📡 Emitted ${event} to role ${role}`);
  }

  /**
   * Emit event to subscribers of a specific camera
   * @param {string} cameraId - Camera ID
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToCamera(cameraId, event, data) {
    if (!this.io) return;
    this.io.to(`camera:${cameraId}`).emit(event, data);
    console.log(`📡 Emitted ${event} to camera ${cameraId} subscribers`);
  }

  /**
   * Emit event to violation subscribers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToViolations(event, data) {
    if (!this.io) return;
    this.io.to('violations').emit(event, data);
    console.log(`📡 Emitted ${event} to violation subscribers`);
  }

  /**
   * Emit event to notification subscribers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToNotifications(event, data) {
    if (!this.io) return;
    this.io.to('notifications').emit(event, data);
    console.log(`📡 Emitted ${event} to notification subscribers`);
  }

  /**
   * Emit event to system subscribers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToSystem(event, data) {
    if (!this.io) return;
    this.io.to('system').emit(event, data);
    console.log(`📡 Emitted ${event} to system subscribers`);
  }

  /**
   * Send notification to specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  sendNotificationToUser(userId, notification) {
    this.emitToUser(userId, 'notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      severity: notification.severity,
      metadata: notification.metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send violation alert to subscribers
   * @param {Object} violation - Violation data
   */
  sendViolationAlert(violation) {
    this.emitToViolations('violation_detected', {
      id: violation.id,
      type: violation.violation_type,
      severity: violation.severity,
      camera_id: violation.camera_id,
      confidence: violation.ai_confidence,
      timestamp: violation.timestamp,
      description: violation.description
    });
  }

  /**
   * Send camera status update
   * @param {Object} camera - Camera data
   */
  sendCameraStatusUpdate(camera) {
    this.emitToCamera(camera.id, 'camera_status_update', {
      id: camera.id,
      name: camera.name,
      status: camera.status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send system status update
   * @param {Object} status - System status data
   */
  sendSystemStatusUpdate(status) {
    this.emitToSystem('system_status_update', {
      ...status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const connections = Array.from(this.connections.values());
    const authenticated = connections.filter(conn => conn.authenticated);
    const byRole = {};
    
    authenticated.forEach(conn => {
      if (conn.userRole) {
        byRole[conn.userRole] = (byRole[conn.userRole] || 0) + 1;
      }
    });

    return {
      total_connections: connections.length,
      authenticated_connections: authenticated.length,
      unauthenticated_connections: connections.length - authenticated.length,
      connections_by_role: byRole
    };
  }

  /**
   * Get connected users
   */
  getConnectedUsers() {
    const connections = Array.from(this.connections.values());
    return connections
      .filter(conn => conn.authenticated && conn.userId)
      .map(conn => ({
        socket_id: conn.socket.id,
        user_id: conn.userId,
        role: conn.userRole
      }));
  }

  /**
   * Disconnect user by user ID
   * @param {string} userId - User ID
   */
  disconnectUser(userId) {
    const connections = Array.from(this.connections.entries());
    connections.forEach(([socketId, conn]) => {
      if (conn.userId === userId) {
        conn.socket.disconnect();
        this.connections.delete(socketId);
        console.log(`🔌 Disconnected user ${userId} (socket ${socketId})`);
      }
    });
  }

  /**
   * Broadcast maintenance mode
   * @param {boolean} maintenanceMode - Whether system is in maintenance mode
   */
  broadcastMaintenanceMode(maintenanceMode) {
    this.emitToAll('maintenance_mode', {
      maintenance_mode: maintenanceMode,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
module.exports = new SocketService();
