const express = require('express');
const { body, param, query } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { verifyToken, requireOperator } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const createNotificationValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .trim(),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['violation', 'system', 'maintenance', 'alert', 'info'])
    .withMessage('Invalid notification type'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('channels')
    .optional()
    .isArray()
    .withMessage('Channels must be an array'),
  body('channels.*')
    .optional()
    .isIn(['in_app', 'email', 'sms', 'push'])
    .withMessage('Invalid channel type'),
  body('recipient_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Recipient ID must be a positive integer'),
  body('recipient_type')
    .optional()
    .isIn(['user', 'role', 'all'])
    .withMessage('Invalid recipient type'),
  body('recipient_value')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Recipient value must be between 1 and 255 characters')
    .trim(),
  body('template_id')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Template ID must be between 1 and 255 characters')
    .trim(),
  body('scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires date must be a valid ISO 8601 date')
];

const updateNotificationValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid notification ID'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  body('message')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .trim(),
  body('status')
    .optional()
    .isIn(['pending', 'sent', 'delivered', 'failed', 'read'])
    .withMessage('Invalid status')
];

const sendNotificationValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .trim(),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['violation', 'system', 'maintenance', 'alert', 'info'])
    .withMessage('Invalid notification type'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('channels')
    .optional()
    .isArray()
    .withMessage('Channels must be an array'),
  body('channels.*')
    .optional()
    .isIn(['in_app', 'email', 'sms', 'push'])
    .withMessage('Invalid channel type'),
  body('recipient_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Recipient ID must be a positive integer'),
  body('recipient_type')
    .optional()
    .isIn(['user', 'role', 'all'])
    .withMessage('Invalid recipient type'),
  body('recipient_value')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Recipient value must be between 1 and 255 characters')
    .trim()
];

const broadcastNotificationValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .trim(),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['violation', 'system', 'maintenance', 'alert', 'info'])
    .withMessage('Invalid notification type'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('channels')
    .optional()
    .isArray()
    .withMessage('Channels must be an array'),
  body('channels.*')
    .optional()
    .isIn(['in_app', 'email', 'sms', 'push'])
    .withMessage('Invalid channel type')
];

const markAllReadValidation = [
  body('recipient_id')
    .notEmpty()
    .withMessage('Recipient ID is required')
    .isInt({ min: 1 })
    .withMessage('Recipient ID must be a positive integer')
];

const notificationIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid notification ID')
];

const queryValidation = [
  query('type')
    .optional()
    .isIn(['violation', 'system', 'maintenance', 'alert', 'info'])
    .withMessage('Invalid type filter'),
  query('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity filter'),
  query('status')
    .optional()
    .isIn(['pending', 'sent', 'delivered', 'failed', 'read'])
    .withMessage('Invalid status filter'),
  query('recipient_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Recipient ID must be a positive integer'),
  query('recipient_type')
    .optional()
    .isIn(['user', 'role', 'all'])
    .withMessage('Invalid recipient type filter'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('sort_by')
    .optional()
    .isIn(['created_at', 'title', 'type', 'severity', 'status'])
    .withMessage('Invalid sort field'),
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

// Public routes (no authentication required)
router.get('/stats', notificationController.getNotificationStats);
router.get('/templates', notificationController.getNotificationTemplates);
router.get('/channels', notificationController.getNotificationChannels);

// Protected routes (require authentication)
router.get('/', verifyToken, queryValidation, notificationController.getAllNotifications);
router.get('/unread', verifyToken, notificationController.getUnreadNotifications);
router.get('/:id', verifyToken, notificationIdValidation, notificationController.getNotificationById);
router.post('/', verifyToken, requireOperator, createNotificationValidation, notificationController.createNotification);
router.put('/:id', verifyToken, requireOperator, updateNotificationValidation, notificationController.updateNotification);
router.delete('/:id', verifyToken, requireOperator, notificationIdValidation, notificationController.deleteNotification);

// Notification management routes (require authentication)
router.post('/:id/read', verifyToken, notificationIdValidation, notificationController.markNotificationAsRead);
router.post('/mark-all-read', verifyToken, markAllReadValidation, notificationController.markAllNotificationsAsRead);

// Notification sending routes (require operator privileges)
router.post('/send', verifyToken, requireOperator, sendNotificationValidation, notificationController.sendNotification);
router.post('/broadcast', verifyToken, requireOperator, broadcastNotificationValidation, notificationController.broadcastNotification);

module.exports = router;
