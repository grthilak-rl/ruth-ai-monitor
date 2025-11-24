const { validationResult } = require('express-validator');
const Camera = require('../models/Camera');
const vasIntegrationService = require('../services/vasIntegration.service');

/**
 * Get all cameras from VAS V2
 * @route GET /cameras
 */
const getAllCameras = async (req, res) => {
  try {
    const { active } = req.query;

    const devices = await vasIntegrationService.getAllDevices();

    let filteredDevices = devices;
    if (active !== undefined) {
      const isActive = active === 'true';
      filteredDevices = devices.filter(device => device.is_active === isActive);
    }

    const cameras = filteredDevices.map(device => ({
      id: device.id,
      name: device.name,
      location: device.location || 'Unknown',
      description: device.description,
      rtsp_url: device.rtsp_url,
      is_active: device.is_active,
      status: device.is_active ? 'ONLINE' : 'OFFLINE',
      vas_device_id: device.id,
      created_at: device.created_at,
      updated_at: device.updated_at
    }));

    res.json({
      success: true,
      count: cameras.length,
      cameras
    });
  } catch (error) {
    console.error('Error fetching cameras from VAS:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch cameras from VAS V2'
    });
  }
};

/**
 * Get camera by ID
 * @route GET /cameras/:id
 */
const getCameraById = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);

    if (!camera) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Camera not found' 
      });
    }

    res.json({
      success: true,
      camera: camera.getPublicInfo()
    });
  } catch (error) {
    console.error('Error fetching camera:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch camera' 
    });
  }
};

/**
 * Create a new camera
 * @route POST /cameras
 */
const createCamera = async (req, res) => {
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
      name, 
      location, 
      ip_address, 
      port, 
      username, 
      password, 
      resolution, 
      frame_rate, 
      status, 
      feed_url, 
      last_maintenance, 
      installation_date, 
      is_active 
    } = req.body;

    // Create new camera
    const newCamera = await Camera.create({
      name,
      location,
      ip_address,
      port,
      username,
      password,
      resolution,
      frame_rate,
      status: status || 'offline',
      feed_url,
      last_maintenance,
      installation_date: installation_date || new Date(),
      is_active: is_active !== undefined ? is_active : true
    });

    // Create corresponding camera in VAS
    try {
      const vasDevice = await vasIntegrationService.createCameraInVAS(newCamera);
      
      // Update camera with VAS device ID
      await newCamera.update({
        vas_device_id: vasDevice.id,
        janus_stream_id: vasDevice.id
      });
      
      console.log(`✅ Camera ${newCamera.id} successfully synced with VAS`);
    } catch (vasError) {
      console.error(`⚠️ Failed to sync camera ${newCamera.id} with VAS:`, vasError.message);
      // Don't fail the camera creation if VAS sync fails
    }

    res.status(201).json({
      success: true,
      message: 'Camera created successfully',
      camera: newCamera.getPublicInfo()
    });
  } catch (error) {
    console.error('Error creating camera:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to create camera' 
    });
  }
};

/**
 * Update camera
 * @route PUT /cameras/:id
 */
const updateCamera = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Camera not found' 
      });
    }

    const { 
      name, 
      location, 
      status, 
      feed_url, 
      last_maintenance, 
      installation_date, 
      is_active,
      ip_address,
      port,
      username,
      password,
      resolution,
      frame_rate
    } = req.body;

    // Update camera
    await camera.update({
      name: name || camera.name,
      location: location || camera.location,
      status: status || camera.status,
      feed_url: feed_url || camera.feed_url,
      last_maintenance: last_maintenance || camera.last_maintenance,
      installation_date: installation_date || camera.installation_date,
      is_active: is_active !== undefined ? is_active : camera.is_active,
      ip_address: ip_address || camera.ip_address,
      port: port || camera.port,
      username: username || camera.username,
      password: password || camera.password,
      resolution: resolution || camera.resolution,
      frame_rate: frame_rate || camera.frame_rate
    });

    // Update corresponding camera in VAS
    try {
      await vasIntegrationService.updateCameraInVAS(camera);
      console.log(`✅ Camera ${camera.id} successfully updated in VAS`);
    } catch (vasError) {
      console.error(`⚠️ Failed to update camera ${camera.id} in VAS:`, vasError.message);
      // Don't fail the camera update if VAS sync fails
    }

    res.json({
      success: true,
      message: 'Camera updated successfully',
      camera: camera.getPublicInfo()
    });
  } catch (error) {
    console.error('Error updating camera:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update camera' 
    });
  }
};

/**
 * Delete camera
 * @route DELETE /cameras/:id
 */
const deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Camera not found' 
      });
    }

    // Delete corresponding camera in VAS first
    try {
      await vasIntegrationService.deleteCameraInVAS(camera);
      console.log(`✅ Camera ${camera.id} successfully deleted from VAS`);
    } catch (vasError) {
      console.error(`⚠️ Failed to delete camera ${camera.id} from VAS:`, vasError.message);
      // Continue with Ruth-AI Monitor deletion even if VAS deletion fails
    }

    await camera.destroy();

    res.json({
      success: true,
      message: 'Camera deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting camera:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete camera' 
    });
  }
};

/**
 * Bulk update camera status
 * @route POST /cameras/bulk-update-status
 */
const bulkUpdateCameraStatus = async (req, res) => {
  try {
    const { camera_ids, status } = req.body;

    if (!Array.isArray(camera_ids) || camera_ids.length === 0) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'camera_ids must be a non-empty array' 
      });
    }

    if (!['online', 'offline', 'maintenance'].includes(status)) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid status provided' 
      });
    }

    const [updatedCount] = await Camera.update(
      { status },
      {
        where: {
          id: { [require('sequelize').Op.in]: camera_ids }
        }
      }
    );

    res.json({
      success: true,
      message: `${updatedCount} cameras updated successfully`,
      updated_count: updatedCount
    });
  } catch (error) {
    console.error('Error bulk updating camera status:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update camera status' 
    });
  }
};

/**
 * Sync cameras with VAS
 * @route POST /cameras/sync-vas
 */
const syncCamerasWithVAS = async (req, res) => {
  try {
    const result = await vasIntegrationService.syncExistingCameras(Camera);
    res.json({
      success: true,
      message: 'Camera sync with VAS completed successfully',
      ...result
    });
  } catch (error) {
    console.error('Error syncing cameras with VAS:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to sync cameras with VAS',
      error_details: error.message 
    });
  }
};

/**
 * Get VAS integration health status
 * @route GET /cameras/vas-health
 */
const getVASHealth = async (req, res) => {
  try {
    const healthStatus = await vasIntegrationService.healthCheck();
    res.json({
      success: true,
      ...healthStatus
    });
  } catch (error) {
    console.error('Error checking VAS health:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to check VAS health',
      error_details: error.message 
    });
  }
};

/**
 * Get camera stream status from VAS
 * @route GET /cameras/:id/stream-status
 */
const getCameraStreamStatus = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Camera not found' 
      });
    }

    if (!camera.vas_device_id) {
      return res.json({ 
        success: true,
        status: 'not_synced',
        message: 'Camera not synced with VAS'
      });
    }

    const streamStatus = await vasIntegrationService.getCameraStreamStatus(camera.vas_device_id);
    res.json({
      success: true,
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
      ...(streamStatus || { status: 'unknown' })
    });
  } catch (error) {
    console.error('Error getting camera stream status:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get camera stream status' 
    });
  }
};

/**
 * Start camera stream in VAS
 * @route POST /cameras/:id/start-stream
 */
const startCameraStream = async (req, res) => {
  try {
    const deviceId = req.params.id;

    const streamResult = await vasIntegrationService.startCameraStream(deviceId);
    res.json({
      success: true,
      message: 'Camera stream started successfully',
      device_id: deviceId,
      ...streamResult
    });
  } catch (error) {
    console.error('Error starting camera stream:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start camera stream',
      error_details: error.message
    });
  }
};

/**
 * Stop camera stream in VAS
 * @route POST /cameras/:id/stop-stream
 */
const stopCameraStream = async (req, res) => {
  try {
    const deviceId = req.params.id;

    const streamResult = await vasIntegrationService.stopCameraStream(deviceId);
    res.json({
      success: true,
      message: 'Camera stream stopped successfully',
      device_id: deviceId,
      ...streamResult
    });
  } catch (error) {
    console.error('Error stopping camera stream:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to stop camera stream',
      error_details: error.message
    });
  }
};

/**
 * Get camera statistics
 * @route GET /cameras/stats
 */
const getCameraStats = async (req, res) => {
  try {
    const stats = await Camera.getCameraStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting camera stats:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get camera statistics' 
    });
  }
};

/**
 * Get WebRTC streams from VAS
 * @route GET /cameras/webrtc/streams
 */
const getWebRTCStreams = async (req, res) => {
  try {
    const streams = await vasIntegrationService.getWebRTCStreams();
    res.json({
      success: true,
      ...streams
    });
  } catch (error) {
    console.error('Error getting WebRTC streams:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get WebRTC streams',
      error_details: error.message 
    });
  }
};

/**
 * Get WebRTC stream configuration
 * @route GET /cameras/webrtc/streams/:streamId/config
 */
const getWebRTCStreamConfig = async (req, res) => {
  try {
    const { streamId } = req.params;
    const config = await vasIntegrationService.getWebRTCStreamConfig(streamId);
    res.json({
      success: true,
      ...config
    });
  } catch (error) {
    console.error('Error getting WebRTC stream config:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get WebRTC stream configuration',
      error_details: error.message 
    });
  }
};

/**
 * Get WebRTC stream status
 * @route GET /cameras/webrtc/streams/:streamId/status
 */
const getWebRTCStreamStatus = async (req, res) => {
  try {
    const { streamId } = req.params;
    const status = await vasIntegrationService.getWebRTCStreamStatus(streamId);
    res.json({
      success: true,
      stream_id: streamId,
      ...status
    });
  } catch (error) {
    console.error('Error getting WebRTC stream status:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get WebRTC stream status',
      error_details: error.message 
    });
  }
};

/**
 * Get WebRTC system status
 * @route GET /cameras/webrtc/system/status
 */
const getWebRTCSystemStatus = async (req, res) => {
  try {
    const status = await vasIntegrationService.getWebRTCSystemStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error getting WebRTC system status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get WebRTC system status',
      error_details: error.message
    });
  }
};

/**
 * Get recording dates for a camera
 * @route GET /cameras/:id/recordings/dates
 */
const getRecordingDates = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Camera not found'
      });
    }

    if (!camera.vas_device_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Camera not synced with VAS'
      });
    }

    const dates = await vasIntegrationService.getRecordingDates(camera.vas_device_id);
    res.json({
      success: true,
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
      ...dates
    });
  } catch (error) {
    console.error('Error getting recording dates:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get recording dates',
      error_details: error.message
    });
  }
};

/**
 * Get recording playlist for a camera
 * @route GET /cameras/:id/recordings/playlist
 */
const getRecordingPlaylist = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Camera not found'
      });
    }

    if (!camera.vas_device_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Camera not synced with VAS'
      });
    }

    const playlist = await vasIntegrationService.getRecordingPlaylist(camera.vas_device_id);
    res.json({
      success: true,
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
      ...playlist
    });
  } catch (error) {
    console.error('Error getting recording playlist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get recording playlist',
      error_details: error.message
    });
  }
};

/**
 * Capture live snapshot from camera
 * @route POST /cameras/:id/snapshots/live
 */
const captureSnapshotLive = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Camera not found'
      });
    }

    if (!camera.vas_device_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Camera not synced with VAS'
      });
    }

    const snapshot = await vasIntegrationService.captureSnapshotLive(camera.vas_device_id);
    res.json({
      success: true,
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
      ...snapshot
    });
  } catch (error) {
    console.error('Error capturing live snapshot:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to capture live snapshot',
      error_details: error.message
    });
  }
};

/**
 * Capture historical snapshot from camera
 * @route POST /cameras/:id/snapshots/historical
 */
const captureSnapshotHistorical = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Camera not found'
      });
    }

    if (!camera.vas_device_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Camera not synced with VAS'
      });
    }

    const { timestamp } = req.body;
    if (!timestamp) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Timestamp is required'
      });
    }

    const snapshot = await vasIntegrationService.captureSnapshotHistorical(camera.vas_device_id, timestamp);
    res.json({
      success: true,
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
      ...snapshot
    });
  } catch (error) {
    console.error('Error capturing historical snapshot:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to capture historical snapshot',
      error_details: error.message
    });
  }
};

/**
 * Get all snapshots with optional filtering
 * @route GET /cameras/snapshots
 */
const getSnapshots = async (req, res) => {
  try {
    const { device_id, limit, skip } = req.query;
    const filters = {};

    if (device_id) filters.deviceId = device_id;
    if (limit) filters.limit = parseInt(limit);
    if (skip) filters.skip = parseInt(skip);

    const snapshots = await vasIntegrationService.getSnapshots(filters);
    res.json({
      success: true,
      ...snapshots
    });
  } catch (error) {
    console.error('Error getting snapshots:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get snapshots',
      error_details: error.message
    });
  }
};

/**
 * Get snapshot details
 * @route GET /cameras/snapshots/:snapshotId
 */
const getSnapshot = async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const snapshot = await vasIntegrationService.getSnapshot(snapshotId);
    res.json({
      success: true,
      snapshot
    });
  } catch (error) {
    console.error('Error getting snapshot:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get snapshot',
      error_details: error.message
    });
  }
};

/**
 * Delete snapshot
 * @route DELETE /cameras/snapshots/:snapshotId
 */
const deleteSnapshot = async (req, res) => {
  try {
    const { snapshotId } = req.params;
    await vasIntegrationService.deleteSnapshot(snapshotId);
    res.json({
      success: true,
      message: 'Snapshot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete snapshot',
      error_details: error.message
    });
  }
};

/**
 * Capture live bookmark from camera
 * @route POST /cameras/:id/bookmarks/live
 */
const captureBookmarkLive = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Camera not found'
      });
    }

    if (!camera.vas_device_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Camera not synced with VAS'
      });
    }

    const { label } = req.body;
    const bookmark = await vasIntegrationService.captureBookmarkLive(camera.vas_device_id, label);
    res.json({
      success: true,
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
      ...bookmark
    });
  } catch (error) {
    console.error('Error capturing live bookmark:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to capture live bookmark',
      error_details: error.message
    });
  }
};

/**
 * Capture historical bookmark from camera
 * @route POST /cameras/:id/bookmarks/historical
 */
const captureBookmarkHistorical = async (req, res) => {
  try {
    const camera = await Camera.findByPk(req.params.id);
    if (!camera) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Camera not found'
      });
    }

    if (!camera.vas_device_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Camera not synced with VAS'
      });
    }

    const { center_timestamp, label } = req.body;
    if (!center_timestamp) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'center_timestamp is required'
      });
    }

    const bookmark = await vasIntegrationService.captureBookmarkHistorical(
      camera.vas_device_id,
      center_timestamp,
      label
    );
    res.json({
      success: true,
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
      ...bookmark
    });
  } catch (error) {
    console.error('Error capturing historical bookmark:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to capture historical bookmark',
      error_details: error.message
    });
  }
};

/**
 * Get all bookmarks with optional filtering
 * @route GET /cameras/bookmarks
 */
const getBookmarks = async (req, res) => {
  try {
    const { device_id, limit, skip } = req.query;
    const filters = {};

    if (device_id) filters.deviceId = device_id;
    if (limit) filters.limit = parseInt(limit);
    if (skip) filters.skip = parseInt(skip);

    const bookmarks = await vasIntegrationService.getBookmarks(filters);
    res.json({
      success: true,
      ...bookmarks
    });
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get bookmarks',
      error_details: error.message
    });
  }
};

/**
 * Get bookmark details
 * @route GET /cameras/bookmarks/:bookmarkId
 */
const getBookmark = async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const bookmark = await vasIntegrationService.getBookmark(bookmarkId);
    res.json({
      success: true,
      bookmark
    });
  } catch (error) {
    console.error('Error getting bookmark:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get bookmark',
      error_details: error.message
    });
  }
};

/**
 * Update bookmark label
 * @route PUT /cameras/bookmarks/:bookmarkId
 */
const updateBookmark = async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const { label } = req.body;

    if (!label) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Label is required'
      });
    }

    const bookmark = await vasIntegrationService.updateBookmark(bookmarkId, label);
    res.json({
      success: true,
      message: 'Bookmark updated successfully',
      bookmark
    });
  } catch (error) {
    console.error('Error updating bookmark:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update bookmark',
      error_details: error.message
    });
  }
};

/**
 * Delete bookmark
 * @route DELETE /cameras/bookmarks/:bookmarkId
 */
const deleteBookmark = async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    await vasIntegrationService.deleteBookmark(bookmarkId);
    res.json({
      success: true,
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete bookmark',
      error_details: error.message
    });
  }
};

module.exports = {
  getAllCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera,
  bulkUpdateCameraStatus,
  syncCamerasWithVAS,
  getVASHealth,
  getCameraStreamStatus,
  startCameraStream,
  stopCameraStream,
  getCameraStats,
  getWebRTCStreams,
  getWebRTCStreamConfig,
  getWebRTCStreamStatus,
  getWebRTCSystemStatus,
  getRecordingDates,
  getRecordingPlaylist,
  captureSnapshotLive,
  captureSnapshotHistorical,
  getSnapshots,
  getSnapshot,
  deleteSnapshot,
  captureBookmarkLive,
  captureBookmarkHistorical,
  getBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark
};
