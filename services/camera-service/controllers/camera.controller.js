const { validationResult } = require('express-validator');
const Camera = require('../models/Camera');
const vasIntegrationService = require('../services/vasIntegration.service');
const dockerService = require('../services/docker.service');
const axios = require('axios');

/**
 * Fetch available AI models from model services
 * @returns {Promise<Array>} Array of available models
 */
const getAvailableModels = async () => {
  const modelServices = [
    { url: process.env.FALL_DETECTION_MODEL_URL || 'http://fall-detection-model:8000', id: 'fall-detection', name: 'Fall Detection' },
    { url: process.env.WAH_DETECTION_MODEL_URL || 'http://work-at-height-model:8000', id: 'work-at-height', name: 'Work at Height Detection' }
  ];

  const models = [];

  for (const service of modelServices) {
    try {
      // Check if container is running
      const containerStatus = await dockerService.getModelContainerStatus(service.id);

      // If container is running, try to get model info
      let modelInfo = null;
      if (containerStatus.running) {
        try {
          const response = await axios.get(`${service.url}/info`, { timeout: 2000 });
          modelInfo = response.data;
        } catch (err) {
          console.warn(`Container running but model not responding: ${service.id}`);
        }
      }

      models.push({
        id: service.id,
        name: modelInfo?.name || service.name,
        description: modelInfo?.description || 'AI model for safety monitoring',
        accuracy: modelInfo?.accuracy || 0.85,
        status: containerStatus.running ? 'running' : 'stopped',
        modelLoaded: modelInfo?.model_loaded || false,
        enabled: false // Default to disabled
      });
    } catch (error) {
      console.warn(`Failed to check model status for ${service.id}:`, error.message);
      // Add placeholder for model
      models.push({
        id: service.id,
        name: service.name,
        description: 'Model service unavailable',
        accuracy: 0.85,
        status: 'unknown',
        modelLoaded: false,
        enabled: false
      });
    }
  }

  return models;
};

/**
 * Get all cameras from VAS V2
 * @route GET /cameras
 */
const getAllCameras = async (req, res) => {
  try {
    const { active } = req.query;

    // Fetch devices and available models in parallel
    const [devices, availableModels] = await Promise.all([
      vasIntegrationService.getAllDevices(),
      getAvailableModels()
    ]);

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
      updated_at: device.updated_at,
      availableModels: availableModels // Add available models to each camera
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
    // Use device ID directly from VAS (no database lookup needed)
    const deviceId = req.params.id;

    const dates = await vasIntegrationService.getRecordingDates(deviceId);
    res.json({
      success: true,
      device_id: deviceId,
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
    // Use device ID directly from VAS (no database lookup needed)
    const deviceId = req.params.id;

    // Fetch the actual playlist from VAS and rewrite segment URLs
    const playlistContent = await vasIntegrationService.getRecordingPlaylist(deviceId);
    console.log('Playlist content received, length:', playlistContent?.length || 0);
    console.log('First 100 chars:', playlistContent?.substring(0, 100));

    if (!playlistContent || playlistContent.length === 0) {
      throw new Error('Empty playlist received from VAS');
    }

    // VAS returns relative segment URLs like "segment-1764154612.ts"
    // We need to rewrite these to absolute URLs for HLS.js
    const vasUrl = process.env.VAS_V2_URL || 'http://10.30.250.245:8080';
    const baseUrl = `${vasUrl}/api/v1/recordings/devices/${deviceId}`;

    // Rewrite relative URLs to absolute URLs
    let rewrittenPlaylist = playlistContent.replace(
      /^(segment-\d+\.ts)$/gm,
      `${baseUrl}/$1`
    );

    // CRITICAL: Force VOD mode to enable seek bar
    // Add VOD playlist type if not present
    if (!rewrittenPlaylist.includes('#EXT-X-PLAYLIST-TYPE')) {
      // Insert after #EXTM3U header
      rewrittenPlaylist = rewrittenPlaylist.replace(
        '#EXTM3U',
        '#EXTM3U\n#EXT-X-PLAYLIST-TYPE:VOD'
      );
    }

    // Add end list marker if not present (indicates VOD, not live)
    if (!rewrittenPlaylist.includes('#EXT-X-ENDLIST')) {
      rewrittenPlaylist += '\n#EXT-X-ENDLIST';
    }

    console.log('Rewritten playlist length:', rewrittenPlaylist.length);
    console.log('First 300 chars:', rewrittenPlaylist.substring(0, 300));

    // Return the playlist content directly with proper content type
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(rewrittenPlaylist);
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

/**
 * Get available AI models
 * @route GET /cameras/models
 */
const getAvailableAIModels = async (req, res) => {
  try {
    const models = await getAvailableModels();
    res.json({
      success: true,
      count: models.length,
      models
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch available AI models',
      error_details: error.message
    });
  }
};

/**
 * Start AI model container for a camera
 * @route POST /cameras/:id/models/:modelId/start
 */
const startCameraModel = async (req, res) => {
  try {
    const { id: cameraId, modelId } = req.params;

    console.log(`Starting model ${modelId} for camera ${cameraId}`);

    // Start the model container
    const result = await dockerService.startModelContainer(modelId);

    res.json({
      success: true,
      camera_id: cameraId,
      model_id: modelId,
      ...result
    });
  } catch (error) {
    console.error(`Error starting model ${req.params.modelId}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to start model: ${error.message}`,
      error_details: error.message
    });
  }
};

/**
 * Stop AI model container for a camera
 * @route POST /cameras/:id/models/:modelId/stop
 */
const stopCameraModel = async (req, res) => {
  try {
    const { id: cameraId, modelId } = req.params;

    console.log(`Stopping model ${modelId} for camera ${cameraId}`);

    // Stop the model container
    const result = await dockerService.stopModelContainer(modelId);

    res.json({
      success: true,
      camera_id: cameraId,
      model_id: modelId,
      ...result
    });
  } catch (error) {
    console.error(`Error stopping model ${req.params.modelId}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to stop model: ${error.message}`,
      error_details: error.message
    });
  }
};

/**
 * Get status of AI model container
 * @route GET /cameras/:id/models/:modelId/status
 */
const getCameraModelStatus = async (req, res) => {
  try {
    const { id: cameraId, modelId } = req.params;

    const status = await dockerService.getModelContainerStatus(modelId);

    res.json({
      success: true,
      camera_id: cameraId,
      model_id: modelId,
      ...status
    });
  } catch (error) {
    console.error(`Error getting model status ${req.params.modelId}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to get model status: ${error.message}`,
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
  deleteBookmark,
  getAvailableAIModels,
  startCameraModel,
  stopCameraModel,
  getCameraModelStatus
};
