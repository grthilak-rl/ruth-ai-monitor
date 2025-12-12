const express = require('express');
const { body, param, query } = require('express-validator');
const cameraController = require('../controllers/camera.controller');
const { verifyToken, requireOperator } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const createCameraValidation = [
  body('name')
    .notEmpty()
    .withMessage('Camera name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Camera name must be between 1 and 255 characters')
    .trim(),
  body('location')
    .notEmpty()
    .withMessage('Camera location is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Camera location must be between 1 and 255 characters')
    .trim(),
  body('ip_address')
    .optional()
    .custom((value) => {
      if (value && !value.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
        throw new Error('Invalid IP address format');
      }
      return true;
    }),
  body('port')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port must be between 1 and 65535'),
  body('username')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Username must be between 1 and 255 characters')
    .trim(),
  body('password')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Password must be between 1 and 255 characters'),
  body('resolution')
    .optional()
    .isIn(['1920x1080', '1280x720', '640x480', '320x240'])
    .withMessage('Invalid resolution format'),
  body('frame_rate')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Frame rate must be between 1 and 60'),
  body('status')
    .optional()
    .isIn(['online', 'offline', 'maintenance'])
    .withMessage('Status must be online, offline, or maintenance'),
  body('feed_url')
    .optional()
    .custom((value) => {
      if (value && !value.match(/^(rtsp|http|https):\/\/.+/)) {
        throw new Error('Invalid feed URL format');
      }
      return true;
    }),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const updateCameraValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid camera ID'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Camera name must be between 1 and 255 characters')
    .trim(),
  body('location')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Camera location must be between 1 and 255 characters')
    .trim(),
  body('ip_address')
    .optional()
    .custom((value) => {
      if (value && !value.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
        throw new Error('Invalid IP address format');
      }
      return true;
    }),
  body('port')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port must be between 1 and 65535'),
  body('username')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Username must be between 1 and 255 characters')
    .trim(),
  body('password')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Password must be between 1 and 255 characters'),
  body('resolution')
    .optional()
    .isIn(['1920x1080', '1280x720', '640x480', '320x240'])
    .withMessage('Invalid resolution format'),
  body('frame_rate')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Frame rate must be between 1 and 60'),
  body('status')
    .optional()
    .isIn(['online', 'offline', 'maintenance'])
    .withMessage('Status must be online, offline, or maintenance'),
  body('feed_url')
    .optional()
    .custom((value) => {
      if (value && !value.match(/^(rtsp|http|https):\/\/.+/)) {
        throw new Error('Invalid feed URL format');
      }
      return true;
    }),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const bulkUpdateValidation = [
  body('camera_ids')
    .isArray({ min: 1 })
    .withMessage('camera_ids must be a non-empty array'),
  body('camera_ids.*')
    .isInt({ min: 1 })
    .withMessage('Each camera ID must be a positive integer'),
  body('status')
    .isIn(['online', 'offline', 'maintenance'])
    .withMessage('Status must be online, offline, or maintenance')
];

const cameraIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid camera ID')
];

const queryValidation = [
  query('status')
    .optional()
    .isIn(['online', 'offline', 'maintenance'])
    .withMessage('Invalid status filter'),
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active filter must be a boolean')
];

// Public routes (no authentication required)
router.get('/', queryValidation, cameraController.getAllCameras);
router.get('/models', cameraController.getAvailableAIModels);
router.get('/stats', cameraController.getCameraStats);
router.get('/vas-health', cameraController.getVASHealth);

// WebRTC API routes (require authentication) - MUST be before /:id routes
router.get('/webrtc/streams', verifyToken, cameraController.getWebRTCStreams);
router.get('/webrtc/streams/:streamId/config', verifyToken, cameraController.getWebRTCStreamConfig);
router.get('/webrtc/streams/:streamId/status', verifyToken, cameraController.getWebRTCStreamStatus);
router.get('/webrtc/system/status', verifyToken, cameraController.getWebRTCSystemStatus);

// Bulk operations (require operator privileges)
router.post('/bulk-update-status', verifyToken, requireOperator, bulkUpdateValidation, cameraController.bulkUpdateCameraStatus);

// VAS integration routes (require authentication)
router.post('/sync-vas', verifyToken, requireOperator, cameraController.syncCamerasWithVAS);

// Bookmarks routes (require authentication) - MUST be before /:id routes
router.get('/bookmarks', verifyToken, cameraController.getBookmarks);
router.get('/bookmarks/:bookmarkId', verifyToken, cameraController.getBookmark);
router.put('/bookmarks/:bookmarkId', verifyToken, requireOperator, cameraController.updateBookmark);
router.delete('/bookmarks/:bookmarkId', verifyToken, requireOperator, cameraController.deleteBookmark);

// Snapshots routes (require authentication) - MUST be before /:id routes
router.get('/snapshots', verifyToken, cameraController.getSnapshots);
router.get('/snapshots/:snapshotId', verifyToken, cameraController.getSnapshot);
router.delete('/snapshots/:snapshotId', verifyToken, requireOperator, cameraController.deleteSnapshot);

// Protected routes (require authentication) - MUST be after specific routes
router.get('/:id', verifyToken, cameraIdValidation, cameraController.getCameraById);
router.post('/', verifyToken, requireOperator, createCameraValidation, cameraController.createCamera);
router.put('/:id', verifyToken, requireOperator, updateCameraValidation, cameraController.updateCamera);
router.delete('/:id', verifyToken, requireOperator, cameraIdValidation, cameraController.deleteCamera);
router.get('/:id/stream-status', cameraIdValidation, cameraController.getCameraStreamStatus);
router.post('/:id/start-stream', cameraIdValidation, cameraController.startCameraStream);
router.post('/:id/stop-stream', cameraIdValidation, cameraController.stopCameraStream);

// Recordings routes
router.get('/:id/recordings/dates', cameraIdValidation, cameraController.getRecordingDates);
router.get('/:id/recordings/playlist', cameraIdValidation, cameraController.getRecordingPlaylist);

// Snapshots for specific camera (require authentication)
router.post('/:id/snapshots/live', verifyToken, requireOperator, cameraIdValidation, cameraController.captureSnapshotLive);
router.post('/:id/snapshots/historical', verifyToken, requireOperator, cameraIdValidation, cameraController.captureSnapshotHistorical);

// Bookmarks for specific camera (require authentication)
router.post('/:id/bookmarks/live', verifyToken, requireOperator, cameraIdValidation, cameraController.captureBookmarkLive);
router.post('/:id/bookmarks/historical', verifyToken, requireOperator, cameraIdValidation, cameraController.captureBookmarkHistorical);

// AI Model container management routes
router.post('/:id/models/:modelId/start', cameraIdValidation, cameraController.startCameraModel);
router.post('/:id/models/:modelId/stop', cameraIdValidation, cameraController.stopCameraModel);
router.get('/:id/models/:modelId/status', cameraIdValidation, cameraController.getCameraModelStatus);

module.exports = router;
