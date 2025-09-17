const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const socketService = require('../services/socket.service');
const notificationService = require('../services/notification.service');

/**
 * Get all notifications
 * @route GET /notifications
 */
const getAllNotifications = async (req, res) => {
  try {
    const { 
      type, 
      severity, 
      status, 
      recipient_id,
      recipient_type,
      start_date, 
      end_date, 
      limit,
      offset,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;
    
    // Build filter conditions
    const whereConditions = {};
    
    if (type) {
      whereConditions.type = type;
    }
    
    if (severity) {
      whereConditions.severity = severity;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (recipient_id) {
      whereConditions.recipient_id = recipient_id;
    }
    
    if (recipient_type) {
      whereConditions.recipient_type = recipient_type;
    }
    
    // Date range filter
    if (start_date || end_date) {
      whereConditions.created_at = {};
      
      if (start_date) {
        whereConditions.created_at[require('sequelize').Op.gte] = new Date(start_date);
      }
      
      if (end_date) {
        whereConditions.created_at[require('sequelize').Op.lte] = new Date(end_date);
      }
    }

    // Build order clause
    const orderClause = [[sort_by, sort_order.toUpperCase()]];

    // Build limit and offset
    const queryOptions = {
      where: whereConditions,
      order: orderClause
    };

    if (limit) {
      queryOptions.limit = parseInt(limit);
    }

    if (offset) {
      queryOptions.offset = parseInt(offset);
    }

    const notifications = await Notification.findAll(queryOptions);
    const totalCount = await Notification.count({ where: whereConditions });

    res.json({
      success: true,
      count: notifications.length,
      total: totalCount,
      notifications: notifications.map(notification => notification.getPublicInfo())
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch notifications' 
    });
  }
};

/**
 * Get notification by ID
 * @route GET /notifications/:id
 */
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      notification: notification.getPublicInfo()
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch notification' 
    });
  }
};

/**
 * Create a new notification
 * @route POST /notifications
 */
const createNotification = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { 
      title, 
      message, 
      type, 
      severity, 
      channels, 
      recipient_id, 
      recipient_type, 
      recipient_value,
      metadata,
      template_id,
      scheduled_at,
      expires_at
    } = req.body;

    // Create new notification
    const newNotification = await Notification.create({
      title,
      message,
      type,
      severity,
      channels: channels || ['in_app'],
      recipient_id,
      recipient_type: recipient_type || 'all',
      recipient_value,
      metadata,
      template_id,
      scheduled_at,
      expires_at
    });

    // Send notification via Socket.IO
    if (newNotification.recipient_type === 'user' && newNotification.recipient_id) {
      socketService.sendNotificationToUser(newNotification.recipient_id, newNotification);
    } else if (newNotification.recipient_type === 'role' && newNotification.recipient_value) {
      socketService.emitToRole(newNotification.recipient_value, 'notification', {
        id: newNotification.id,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        severity: newNotification.severity,
        metadata: newNotification.metadata,
        timestamp: new Date().toISOString()
      });
    } else {
      socketService.emitToAll('notification', {
        id: newNotification.id,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        severity: newNotification.severity,
        metadata: newNotification.metadata,
        timestamp: new Date().toISOString()
      });
    }

    // Process notification through notification service
    await notificationService.processNotification(newNotification);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification: newNotification.getPublicInfo()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to create notification' 
    });
  }
};

/**
 * Update notification
 * @route PUT /notifications/:id
 */
const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Notification not found' 
      });
    }

    const { 
      title, 
      message, 
      status, 
      metadata,
      error_message
    } = req.body;

    // Update notification
    await notification.update({
      title: title || notification.title,
      message: message || notification.message,
      status: status || notification.status,
      metadata: metadata || notification.metadata,
      error_message: error_message || notification.error_message
    });

    res.json({
      success: true,
      message: 'Notification updated successfully',
      notification: notification.getPublicInfo()
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update notification' 
    });
  }
};

/**
 * Delete notification
 * @route DELETE /notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Notification not found' 
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete notification' 
    });
  }
};

/**
 * Mark notification as read
 * @route POST /notifications/:id/read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Notification not found' 
      });
    }

    await notification.update({
      status: 'read',
      read_at: new Date()
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: notification.getPublicInfo()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to mark notification as read' 
    });
  }
};

/**
 * Mark all notifications as read for a user
 * @route POST /notifications/mark-all-read
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { recipient_id } = req.body;

    if (!recipient_id) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'recipient_id is required' 
      });
    }

    const [updatedCount] = await Notification.update(
      { 
        status: 'read',
        read_at: new Date()
      },
      {
        where: {
          recipient_id,
          status: { [require('sequelize').Op.in]: ['sent', 'delivered'] },
          read_at: null
        }
      }
    );

    res.json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      updated_count: updatedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to mark all notifications as read' 
    });
  }
};

/**
 * Send notification
 * @route POST /notifications/send
 */
const sendNotification = async (req, res) => {
  try {
    const { 
      title, 
      message, 
      type, 
      severity, 
      channels, 
      recipient_id, 
      recipient_type, 
      recipient_value,
      metadata
    } = req.body;

    // Create and send notification
    const notification = await Notification.create({
      title,
      message,
      type,
      severity,
      channels: channels || ['in_app'],
      recipient_id,
      recipient_type: recipient_type || 'all',
      recipient_value,
      metadata
    });

    // Send via Socket.IO
    if (notification.recipient_type === 'user' && notification.recipient_id) {
      socketService.sendNotificationToUser(notification.recipient_id, notification);
    } else if (notification.recipient_type === 'role' && notification.recipient_value) {
      socketService.emitToRole(notification.recipient_value, 'notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        severity: notification.severity,
        metadata: notification.metadata,
        timestamp: new Date().toISOString()
      });
    } else {
      socketService.emitToAll('notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        severity: notification.severity,
        metadata: notification.metadata,
        timestamp: new Date().toISOString()
      });
    }

    // Process through notification service
    await notificationService.processNotification(notification);

    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification: notification.getPublicInfo()
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to send notification' 
    });
  }
};

/**
 * Broadcast notification to all users
 * @route POST /notifications/broadcast
 */
const broadcastNotification = async (req, res) => {
  try {
    const { 
      title, 
      message, 
      type, 
      severity, 
      channels, 
      metadata
    } = req.body;

    // Create broadcast notification
    const notification = await Notification.create({
      title,
      message,
      type,
      severity,
      channels: channels || ['in_app'],
      recipient_type: 'all',
      metadata
    });

    // Broadcast via Socket.IO
    socketService.emitToAll('notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      severity: notification.severity,
      metadata: notification.metadata,
      timestamp: new Date().toISOString()
    });

    // Process through notification service
    await notificationService.processNotification(notification);

    res.json({
      success: true,
      message: 'Notification broadcasted successfully',
      notification: notification.getPublicInfo()
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to broadcast notification' 
    });
  }
};

/**
 * Get notification statistics
 * @route GET /notifications/stats
 */
const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.getNotificationStats();
    const socketStats = socketService.getConnectionStats();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        socket_connections: socketStats
      }
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get notification statistics' 
    });
  }
};

/**
 * Get user's unread notifications
 * @route GET /notifications/unread
 */
const getUnreadNotifications = async (req, res) => {
  try {
    const { recipient_id } = req.query;

    if (!recipient_id) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'recipient_id is required' 
      });
    }

    const notifications = await Notification.findUnread(recipient_id);

    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications.map(notification => notification.getPublicInfo())
    });
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get unread notifications' 
    });
  }
};

/**
 * Get notification templates
 * @route GET /notifications/templates
 */
const getNotificationTemplates = async (req, res) => {
  try {
    const templates = await notificationService.getTemplates();
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting notification templates:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get notification templates' 
    });
  }
};

/**
 * Get notification channels
 * @route GET /notifications/channels
 */
const getNotificationChannels = async (req, res) => {
  try {
    const channels = await notificationService.getChannels();
    
    res.json({
      success: true,
      channels
    });
  } catch (error) {
    console.error('Error getting notification channels:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get notification channels' 
    });
  }
};

module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNotification,
  broadcastNotification,
  getNotificationStats,
  getUnreadNotifications,
  getNotificationTemplates,
  getNotificationChannels
};
