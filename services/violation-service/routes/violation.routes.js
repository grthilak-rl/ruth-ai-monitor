const express = require('express');
const { body, param, query } = require('express-validator');
const violationController = require('../controllers/violation.controller');
const { verifyToken, requireOperator } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const createViolationValidation = [
  body('violation_type')
    .notEmpty()
    .withMessage('Violation type is required')
    .isIn(['ppe_missing', 'fall_risk', 'unauthorized_access', 'fire_hazard', 'spill_hazard', 'machine_safety', 'work_at_height'])
    .withMessage('Invalid violation type'),
  body('severity')
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('ai_confidence')
    .isFloat({ min: 0, max: 100 })
    .withMessage('AI confidence must be between 0 and 100'),
  body('camera_id')
    .isInt({ min: 1 })
    .withMessage('Camera ID must be a positive integer'),
  body('description')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .trim(),
  body('ai_model_id')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('AI model ID must be between 1 and 255 characters')
    .trim(),
  body('thumbnail_url')
    .optional()
    .isURL()
    .withMessage('Invalid thumbnail URL format'),
  body('full_image_url')
    .optional()
    .isURL()
    .withMessage('Invalid full image URL format')
];

const updateViolationValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid violation ID'),
  body('status')
    .optional()
    .isIn(['investigating', 'false_positive', 'reviewed', 'resolved'])
    .withMessage('Invalid status'),
  body('description')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .trim(),
  body('notes')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Notes must be between 1 and 2000 characters')
    .trim(),
  body('investigator_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Investigator ID must be a positive integer')
];

const acknowledgeViolationValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid violation ID'),
  body('notes')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Notes must be between 1 and 2000 characters')
    .trim()
];

const resolveViolationValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid violation ID'),
  body('notes')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Notes must be between 1 and 2000 characters')
    .trim()
];

const markFalsePositiveValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid violation ID'),
  body('notes')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Notes must be between 1 and 2000 characters')
    .trim()
];

const bulkUpdateValidation = [
  body('violation_ids')
    .isArray({ min: 1 })
    .withMessage('violation_ids must be a non-empty array'),
  body('violation_ids.*')
    .isInt({ min: 1 })
    .withMessage('Each violation ID must be a positive integer'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['investigating', 'false_positive', 'reviewed', 'resolved'])
    .withMessage('Invalid status'),
  body('investigator_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Investigator ID must be a positive integer'),
  body('notes')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Notes must be between 1 and 2000 characters')
    .trim()
];

const startProcessingValidation = [
  body('camera_id')
    .notEmpty()
    .withMessage('Camera ID is required')
    .isInt({ min: 1 })
    .withMessage('Camera ID must be a positive integer'),
  body('model_type')
    .optional()
    .isIn(['work_at_height', 'fall_detection'])
    .withMessage('Invalid model type'),
  body('interval_ms')
    .optional()
    .isInt({ min: 1000, max: 60000 })
    .withMessage('Interval must be between 1000 and 60000 milliseconds')
];

const stopProcessingValidation = [
  body('camera_id')
    .notEmpty()
    .withMessage('Camera ID is required')
    .isInt({ min: 1 })
    .withMessage('Camera ID must be a positive integer'),
  body('processing_id')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Processing ID must be between 1 and 255 characters')
    .trim()
];

const violationIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid violation ID')
];

const queryValidation = [
  query('status')
    .optional()
    .isIn(['investigating', 'false_positive', 'reviewed', 'resolved'])
    .withMessage('Invalid status filter'),
  query('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity filter'),
  query('violation_type')
    .optional()
    .isIn(['ppe_missing', 'fall_risk', 'unauthorized_access', 'fire_hazard', 'spill_hazard', 'machine_safety', 'work_at_height'])
    .withMessage('Invalid violation type filter'),
  query('camera_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Camera ID must be a positive integer'),
  query('investigator_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Investigator ID must be a positive integer'),
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
    .isIn(['timestamp', 'severity', 'ai_confidence', 'status'])
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
router.get('/stats', violationController.getViolationStats);
router.get('/export', queryValidation, violationController.exportViolations);
router.get('/processing/status', violationController.getProcessingStatus);

// Protected routes (require authentication)
router.get('/', verifyToken, queryValidation, violationController.getAllViolations);
router.get('/:id', verifyToken, violationIdValidation, violationController.getViolationById);
router.post('/', verifyToken, requireOperator, createViolationValidation, violationController.createViolation);
router.put('/:id', verifyToken, requireOperator, updateViolationValidation, violationController.updateViolation);
router.delete('/:id', verifyToken, requireOperator, violationIdValidation, violationController.deleteViolation);

// Violation management routes (require authentication)
router.post('/:id/acknowledge', verifyToken, acknowledgeViolationValidation, violationController.acknowledgeViolation);
router.post('/:id/resolve', verifyToken, resolveViolationValidation, violationController.resolveViolation);
router.post('/:id/false-positive', verifyToken, markFalsePositiveValidation, violationController.markFalsePositive);

// Bulk operations (require operator privileges)
router.post('/bulk-update', verifyToken, requireOperator, bulkUpdateValidation, violationController.bulkUpdateViolations);

// Processing control routes (require operator privileges)
router.post('/processing/start', verifyToken, requireOperator, startProcessingValidation, violationController.startProcessing);
router.post('/processing/stop', verifyToken, requireOperator, stopProcessingValidation, violationController.stopProcessing);

module.exports = router;
