const axios = require('axios');

class VASIntegrationService {
  constructor() {
    this.vasApiUrl = process.env.VAS_API_URL || 'http://10.30.250.245:8000/api';
    this.vasAuthToken = null;
    this.isAuthenticated = false;
    this.authRetryCount = 0;
    this.maxAuthRetries = 3;
  }

  /**
   * Authenticate with VAS API
   */
  async authenticate() {
    try {
      console.log('🔐 Authenticating with VAS...');
      
      const response = await axios.post(`${this.vasApiUrl}/auth/login-json`, 
        {
          username: process.env.VAS_USERNAME || 'admin',
          password: process.env.VAS_PASSWORD || 'admin123'
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      this.vasAuthToken = response.data.access_token;
      this.isAuthenticated = true;
      this.authRetryCount = 0;
      console.log('✅ VAS authentication successful');
      return true;
    } catch (error) {
      this.authRetryCount++;
      console.error('❌ VAS authentication failed:', error.response?.data || error.message);
      this.isAuthenticated = false;
      
      if (this.authRetryCount < this.maxAuthRetries) {
        console.log(`🔄 Retrying authentication (${this.authRetryCount}/${this.maxAuthRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return await this.authenticate();
      }
      
      return false;
    }
  }

  /**
   * Get authenticated axios instance
   */
  getAuthenticatedAxios() {
    return axios.create({
      baseURL: this.vasApiUrl,
      headers: {
        'Authorization': `Bearer ${this.vasAuthToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 second timeout
    });
  }

  /**
   * Ensure authentication before API calls
   */
  async ensureAuthenticated() {
    if (!this.isAuthenticated) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('Failed to authenticate with VAS');
      }
    }
  }

  /**
   * Create camera in VAS when created in Ruth-AI Monitor
   */
  async createCameraInVAS(ruthAICamera) {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();

      const vasDevice = {
        name: ruthAICamera.name,
        device_type: 'ip_camera',
        manufacturer: 'Generic',
        model: 'IP Camera',
        ip_address: ruthAICamera.ip_address || '192.168.1.100',
        port: ruthAICamera.port || 554,
        rtsp_url: ruthAICamera.feed_url || `rtsp://${ruthAICamera.ip_address || '192.168.1.100'}:554/live`,
        username: ruthAICamera.username || 'admin',
        password: ruthAICamera.password || 'password',
        location: ruthAICamera.location,
        description: `Camera imported from Ruth-AI Monitor (ID: ${ruthAICamera.id})`,
        tags: ['ruth-ai-monitor', 'imported'],
        metadata: { ruthAI_id: ruthAICamera.id }
      };

      console.log(`📹 Creating VAS device for camera: ${ruthAICamera.name}`);
      const response = await api.post('/devices/', vasDevice);
      
      console.log(`✅ Created VAS device ${response.data.id} for Ruth-AI Monitor camera ${ruthAICamera.id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create camera in VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update camera in VAS when updated in Ruth-AI Monitor
   */
  async updateCameraInVAS(ruthAICamera) {
    try {
      if (!ruthAICamera.vas_device_id) {
        console.log('📹 Camera has no VAS device ID, creating new VAS device');
        return await this.createCameraInVAS(ruthAICamera);
      }

      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();

      const vasDevice = {
        name: ruthAICamera.name,
        device_type: 'ip_camera',
        manufacturer: 'Generic',
        model: 'IP Camera',
        ip_address: ruthAICamera.ip_address || '192.168.1.100',
        port: ruthAICamera.port || 554,
        rtsp_url: ruthAICamera.feed_url || `rtsp://${ruthAICamera.ip_address || '192.168.1.100'}:554/live`,
        username: ruthAICamera.username || 'admin',
        password: ruthAICamera.password || 'password',
        location: ruthAICamera.location,
        description: `Camera imported from Ruth-AI Monitor (ID: ${ruthAICamera.id})`,
        tags: ['ruth-ai-monitor', 'imported'],
        metadata: { ruthAI_id: ruthAICamera.id }
      };

      console.log(`📹 Updating VAS device ${ruthAICamera.vas_device_id} for camera: ${ruthAICamera.name}`);
      const response = await api.put(`/devices/${ruthAICamera.vas_device_id}`, vasDevice);
      
      console.log(`✅ Updated VAS device ${ruthAICamera.vas_device_id} for Ruth-AI Monitor camera ${ruthAICamera.id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update camera in VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete camera in VAS when deleted in Ruth-AI Monitor
   */
  async deleteCameraInVAS(ruthAICamera) {
    try {
      if (!ruthAICamera.vas_device_id) {
        console.log('📹 Camera has no VAS device ID, nothing to delete in VAS');
        return;
      }

      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();

      console.log(`📹 Deleting VAS device ${ruthAICamera.vas_device_id} for camera: ${ruthAICamera.name}`);
      await api.delete(`/devices/${ruthAICamera.vas_device_id}`);
      
      console.log(`✅ Deleted VAS device ${ruthAICamera.vas_device_id} for Ruth-AI Monitor camera ${ruthAICamera.id}`);
    } catch (error) {
      console.error('❌ Failed to delete camera in VAS:', error.response?.data || error.message);
      // Don't throw error for delete operations to avoid blocking Ruth-AI Monitor camera deletion
    }
  }

  /**
   * Import VAS cameras into Ruth-AI Monitor and sync existing cameras
   */
  async syncExistingCameras(Camera) {
    try {
      console.log('🔄 Starting camera sync with VAS...');
      await this.ensureAuthenticated();
      
      const api = this.getAuthenticatedAxios();
      
      // Get all VAS devices
      const vasDevicesResponse = await api.get('/devices/');
      console.log(`📹 Found ${vasDevicesResponse.data.length || 0} VAS devices`);
      
      const vasDevices = Array.isArray(vasDevicesResponse.data) 
        ? vasDevicesResponse.data 
        : vasDevicesResponse.data.devices || [];
      
      // Get all Ruth-AI Monitor cameras
      const ruthAICameras = await Camera.findAll();
      
      // Create a map of existing Ruth-AI Monitor cameras by VAS device ID
      const ruthCameraMap = new Map();
      ruthAICameras.forEach(camera => {
        if (camera.vas_device_id) {
          ruthCameraMap.set(camera.vas_device_id, camera);
        }
      });

      let syncedCount = 0;
      let importedCount = 0;

      // Import VAS cameras into Ruth-AI Monitor
      for (const vasDevice of vasDevices) {
        if (ruthCameraMap.has(vasDevice.id)) {
          // Camera already exists in Ruth-AI Monitor, skip
          syncedCount++;
          continue;
        }

        // Import VAS device as new Ruth-AI Monitor camera
        try {
          console.log(`📹 Importing VAS device: ${vasDevice.name} (${vasDevice.id})`);
          console.log(`📹 VAS device data:`, JSON.stringify(vasDevice, null, 2));
          const cameraData = {
            name: vasDevice.name || `Camera ${vasDevice.id}`,
            location: vasDevice.location || 'Unknown',
            status: vasDevice.status?.toLowerCase() === 'online' ? 'online' : 'offline',
            feed_url: vasDevice.rtsp_url || `rtsp://${vasDevice.ip_address || '192.168.1.100'}:554/live`,
            vas_device_id: vasDevice.id,
            janus_stream_id: vasDevice.id,
            ip_address: vasDevice.ip_address || '192.168.1.100',
            port: vasDevice.port || 554,
            username: vasDevice.username || 'admin',
            is_active: true,
            installation_date: new Date(vasDevice.created_at || Date.now())
          };
          console.log(`📹 Camera data to create:`, JSON.stringify(cameraData, null, 2));
          
          const newCamera = await Camera.create(cameraData, { 
            validate: false,
            individualHooks: false 
          });
          
          importedCount++;
          console.log(`✅ Imported VAS device ${vasDevice.id} as Ruth-AI Monitor camera ${newCamera.id}`);
        } catch (error) {
          console.error(`❌ Failed to import VAS device ${vasDevice.id}:`, error.message);
        }
      }

      console.log(`🔄 Camera sync completed: ${syncedCount} already synced, ${importedCount} imported from VAS`);
      return { syncedCount, createdCount: importedCount };
    } catch (error) {
      console.error('❌ Failed to sync cameras with VAS:', error.message);
      throw error;
    }
  }

  /**
   * Get camera stream status from VAS
   */
  async getCameraStreamStatus(vasDeviceId) {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();

      const response = await api.get(`/streams/${vasDeviceId}/status`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get camera stream status from VAS:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Start camera stream in VAS
   */
  async startCameraStream(vasDeviceId) {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();

      console.log(`📹 Starting stream for VAS device: ${vasDeviceId}`);
      const response = await api.post(`/streams/${vasDeviceId}/start`);
      
      console.log(`✅ Started stream for VAS device: ${vasDeviceId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to start camera stream in VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Stop camera stream in VAS
   */
  async stopCameraStream(vasDeviceId) {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();

      console.log(`📹 Stopping stream for VAS device: ${vasDeviceId}`);
      const response = await api.post(`/streams/${vasDeviceId}/stop`);
      
      console.log(`✅ Stopped stream for VAS device: ${vasDeviceId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to stop camera stream in VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Janus mountpoints from VAS
   */
  async getJanusMountpoints() {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();

      const response = await api.get('/streams/janus/mountpoints');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get Janus mountpoints from VAS:', error.response?.data || error.message);
      return { mountpoints: [] };
    }
  }

  /**
   * Health check for VAS integration
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.vasApiUrl}/health`, { timeout: 5000 });
      const janusHealth = await this.getJanusHealth();
      
      return {
        vas_backend: response.data.status === 'healthy',
        janus_gateway: janusHealth.janus_healthy,
        authentication: this.isAuthenticated,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        vas_backend: false,
        janus_gateway: false,
        authentication: false,
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  /**
   * Get Janus Gateway health from VAS
   */
  async getJanusHealth() {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();

      const response = await api.get('/streams/janus/health');
      return response.data;
    } catch (error) {
      return { janus_healthy: false, error: error.message };
    }
  }

  /**
   * Get WebRTC streams using new API
   */
  async getWebRTCStreams() {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();
      
      const response = await api.get('/streams/webrtc/streams');
      return response.data;
    } catch (error) {
      console.error('Failed to get WebRTC streams:', error.response?.data || error.message);
      return { streams: [] };
    }
  }

  /**
   * Get WebRTC stream configuration
   */
  async getWebRTCStreamConfig(streamId) {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();
      
      const response = await api.get(`/streams/webrtc/streams/${streamId}/config`);
      return response.data;
    } catch (error) {
      console.error('Failed to get WebRTC stream config:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get WebRTC stream status
   */
  async getWebRTCStreamStatus(streamId) {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();
      
      const response = await api.get(`/streams/webrtc/streams/${streamId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get WebRTC stream status:', error.response?.data || error.message);
      return { status: 'unknown' };
    }
  }

  /**
   * Get system status from VAS WebRTC API
   */
  async getWebRTCSystemStatus() {
    try {
      await this.ensureAuthenticated();
      const api = this.getAuthenticatedAxios();
      
      const response = await api.get('/streams/webrtc/system/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get WebRTC system status:', error.response?.data || error.message);
      return { status: 'unknown' };
    }
  }
}

// Export singleton instance
module.exports = new VASIntegrationService();
