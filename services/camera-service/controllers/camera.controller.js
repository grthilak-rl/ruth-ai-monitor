const { validationResult } = require('express-validator');
const Camera = require('../models/Camera');
const vasIntegrationService = require('../services/vasIntegration.service');

/**
 * Get all cameras
 * @route GET /cameras
 */
const getAllCameras = async (req, res) => {
  try {
    const { status, active } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (active !== undefined) {
      whereClause.is_active = active === 'true';
    }

    const cameras = await Camera.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: cameras.length,
      cameras: cameras.map(camera => camera.getPublicInfo())
    });
  } catch (error) {
    console.error('Error fetching cameras:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch cameras' 
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
        message: 'Camera not synced with VAS. Please sync first.' 
      });
    }

    const streamResult = await vasIntegrationService.startCameraStream(camera.vas_device_id);
    res.json({
      success: true,
      message: 'Camera stream started successfully',
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
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

    const streamResult = await vasIntegrationService.stopCameraStream(camera.vas_device_id);
    res.json({
      success: true,
      message: 'Camera stream stopped successfully',
      camera_id: camera.id,
      vas_device_id: camera.vas_device_id,
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
  getWebRTCSystemStatus
};
