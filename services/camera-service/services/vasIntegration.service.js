const axios = require('axios');

class VASIntegrationService {
  constructor() {
    this.vasApiUrl = process.env.VAS_API_URL || 'http://10.30.250.245:8080';
    this.vasApiVersion = process.env.VAS_API_VERSION || 'v1';
    this.vasApiKey = process.env.VAS_API_KEY || null;
    this.vasRequireAuth = process.env.VAS_REQUIRE_AUTH !== 'false';
    this.mediasoupUrl = process.env.MEDIASOUP_URL || 'ws://10.30.250.245:3001';
  }

  /**
   * Get axios instance with API key authentication for VAS V2
   */
  getAuthenticatedAxios() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.vasRequireAuth && this.vasApiKey) {
      headers['X-API-Key'] = this.vasApiKey;
    }

    return axios.create({
      baseURL: `${this.vasApiUrl}/api/${this.vasApiVersion}`,
      headers,
      timeout: 30000
    });
  }

  /**
   * Get axios instance for compatibility endpoints
   */
  getCompatibilityAxios() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.vasRequireAuth && this.vasApiKey) {
      headers['X-API-Key'] = this.vasApiKey;
    }

    return axios.create({
      baseURL: `${this.vasApiUrl}/api`,
      headers,
      timeout: 30000
    });
  }

  /**
   * Validate RTSP URL before creating device
   */
  async validateRTSPUrl(name, rtspUrl) {
    try {
      const api = this.getAuthenticatedAxios();

      console.log(`Validating RTSP URL for device: ${name}`);
      const response = await api.post('/devices/validate', {
        name,
        rtsp_url: rtspUrl
      });

      console.log(`RTSP URL validation successful for: ${name}`);
      return response.data;
    } catch (error) {
      console.error('Failed to validate RTSP URL:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create camera in VAS when created in Ruth-AI Monitor
   */
  async createCameraInVAS(ruthAICamera) {
    try {
      const api = this.getAuthenticatedAxios();

      const vasDevice = {
        name: ruthAICamera.name,
        rtsp_url: ruthAICamera.feed_url || `rtsp://${ruthAICamera.ip_address || '192.168.1.100'}:554/live`,
        location: ruthAICamera.location,
        description: `Camera imported from Ruth-AI Monitor (ID: ${ruthAICamera.id})`,
        is_active: true
      };

      console.log(`Creating VAS device for camera: ${ruthAICamera.name}`);
      const response = await api.post('/devices', vasDevice);

      console.log(`Created VAS device ${response.data.id} for Ruth-AI Monitor camera ${ruthAICamera.id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to create camera in VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update camera in VAS when updated in Ruth-AI Monitor
   */
  async updateCameraInVAS(ruthAICamera) {
    try {
      if (!ruthAICamera.vas_device_id) {
        console.log('Camera has no VAS device ID, creating new VAS device');
        return await this.createCameraInVAS(ruthAICamera);
      }

      const api = this.getAuthenticatedAxios();

      const vasDevice = {
        name: ruthAICamera.name,
        rtsp_url: ruthAICamera.feed_url || `rtsp://${ruthAICamera.ip_address || '192.168.1.100'}:554/live`,
        location: ruthAICamera.location,
        description: `Camera imported from Ruth-AI Monitor (ID: ${ruthAICamera.id})`,
        is_active: true
      };

      console.log(`Updating VAS device ${ruthAICamera.vas_device_id} for camera: ${ruthAICamera.name}`);
      const response = await api.put(`/devices/${ruthAICamera.vas_device_id}`, vasDevice);

      console.log(`Updated VAS device ${ruthAICamera.vas_device_id} for Ruth-AI Monitor camera ${ruthAICamera.id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to update camera in VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete camera in VAS when deleted in Ruth-AI Monitor
   */
  async deleteCameraInVAS(ruthAICamera) {
    try {
      if (!ruthAICamera.vas_device_id) {
        console.log('Camera has no VAS device ID, nothing to delete in VAS');
        return;
      }

      const api = this.getAuthenticatedAxios();

      console.log(`Deleting VAS device ${ruthAICamera.vas_device_id} for camera: ${ruthAICamera.name}`);
      await api.delete(`/devices/${ruthAICamera.vas_device_id}`);

      console.log(`Deleted VAS device ${ruthAICamera.vas_device_id} for Ruth-AI Monitor camera ${ruthAICamera.id}`);
    } catch (error) {
      console.error('Failed to delete camera in VAS:', error.response?.data || error.message);
    }
  }

  /**
   * Get all devices from VAS V2
   */
  async getAllDevices() {
    try {
      const api = this.getAuthenticatedAxios();
      const response = await api.get('/devices');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get devices from VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get device details including streaming status
   */
  async getDeviceStatus(vasDeviceId) {
    try {
      const api = this.getAuthenticatedAxios();

      const response = await api.get(`/devices/${vasDeviceId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get device status from VAS:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Import VAS cameras into Ruth-AI Monitor and sync existing cameras
   */
  async syncExistingCameras(Camera) {
    try {
      console.log('Starting camera sync with VAS V2...');
      const api = this.getAuthenticatedAxios();

      const vasDevicesResponse = await api.get('/devices');
      console.log(`Found ${vasDevicesResponse.data.length || 0} VAS devices`);

      const vasDevices = Array.isArray(vasDevicesResponse.data)
        ? vasDevicesResponse.data
        : vasDevicesResponse.data.devices || [];

      const ruthAICameras = await Camera.findAll();

      const ruthCameraMap = new Map();
      ruthAICameras.forEach(camera => {
        if (camera.vas_device_id) {
          ruthCameraMap.set(camera.vas_device_id, camera);
        }
      });

      let syncedCount = 0;
      let importedCount = 0;

      for (const vasDevice of vasDevices) {
        if (ruthCameraMap.has(vasDevice.id)) {
          syncedCount++;
          continue;
        }

        try {
          console.log(`Importing VAS device: ${vasDevice.name} (${vasDevice.id})`);
          const cameraData = {
            name: vasDevice.name || `Camera ${vasDevice.id}`,
            location: vasDevice.location || 'Unknown',
            status: vasDevice.is_active ? 'online' : 'offline',
            feed_url: vasDevice.rtsp_url,
            vas_device_id: vasDevice.id,
            janus_stream_id: vasDevice.id,
            ip_address: this.extractIPFromRTSP(vasDevice.rtsp_url),
            port: this.extractPortFromRTSP(vasDevice.rtsp_url),
            is_active: vasDevice.is_active,
            installation_date: new Date(vasDevice.created_at || Date.now())
          };

          const newCamera = await Camera.create(cameraData, {
            validate: false,
            individualHooks: false
          });

          importedCount++;
          console.log(`Imported VAS device ${vasDevice.id} as Ruth-AI Monitor camera ${newCamera.id}`);
        } catch (error) {
          console.error(`Failed to import VAS device ${vasDevice.id}:`, error.message);
        }
      }

      console.log(`Camera sync completed: ${syncedCount} already synced, ${importedCount} imported from VAS`);
      return { syncedCount, createdCount: importedCount };
    } catch (error) {
      console.error('Failed to sync cameras with VAS:', error.message);
      throw error;
    }
  }

  /**
   * Start camera stream in VAS V2 (MediaSoup)
   */
  async startCameraStream(vasDeviceId) {
    try {
      const api = this.getAuthenticatedAxios();

      console.log(`Starting MediaSoup stream for VAS device: ${vasDeviceId}`);
      const response = await api.post(`/devices/${vasDeviceId}/start-stream`);

      console.log(`Started MediaSoup stream for VAS device: ${vasDeviceId}`);

      // Construct WebSocket URL from VAS API URL
      // Convert http://10.30.250.245:8080 to ws://10.30.250.245:8080/ws/mediasoup
      const websocketUrl = this.vasApiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/mediasoup';
      console.log(`WebSocket URL: ${websocketUrl}`);

      return {
        ...response.data,
        device_id: vasDeviceId,
        websocket_url: websocketUrl,
        room_id: response.data.room_id || vasDeviceId,
        vas_api_url: `${this.vasApiUrl}/api/${this.vasApiVersion}`
      };
    } catch (error) {
      console.error('Failed to start camera stream in VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Stop camera stream in VAS V2
   */
  async stopCameraStream(vasDeviceId) {
    try {
      const api = this.getAuthenticatedAxios();

      console.log(`Stopping stream for VAS device: ${vasDeviceId}`);
      const response = await api.post(`/devices/${vasDeviceId}/stop-stream`);

      console.log(`Stopped stream for VAS device: ${vasDeviceId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to stop camera stream in VAS:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get available recording dates for a device
   */
  async getRecordingDates(vasDeviceId) {
    try {
      const api = this.getAuthenticatedAxios();

      const response = await api.get(`/recordings/devices/${vasDeviceId}/dates`);
      return response.data;
    } catch (error) {
      console.error('Failed to get recording dates:', error.response?.data || error.message);
      return { dates: [] };
    }
  }

  /**
   * Get HLS playlist for historical recordings
   */
  async getRecordingPlaylist(vasDeviceId) {
    try {
      const api = this.getAuthenticatedAxios();

      const response = await api.get(`/recordings/devices/${vasDeviceId}/playlist`, {
        responseType: 'text'  // Ensure we get text, not parsed JSON
      });
      console.log('Fetched playlist from VAS, length:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('Failed to get recording playlist:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Capture snapshot from live stream
   */
  async captureSnapshotLive(vasDeviceId) {
    try {
      const api = this.getAuthenticatedAxios();

      console.log(`Capturing live snapshot for device: ${vasDeviceId}`);
      const response = await api.post(`/snapshots/devices/${vasDeviceId}/capture/live`);

      console.log(`Captured live snapshot: ${response.data.snapshot.id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to capture live snapshot:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Capture snapshot from historical footage
   */
  async captureSnapshotHistorical(vasDeviceId, timestamp) {
    try {
      const api = this.getAuthenticatedAxios();

      console.log(`Capturing historical snapshot for device: ${vasDeviceId} at ${timestamp}`);
      const response = await api.post(`/snapshots/devices/${vasDeviceId}/capture/historical`, {
        timestamp
      });

      console.log(`Captured historical snapshot: ${response.data.snapshot.id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to capture historical snapshot:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all snapshots
   */
  async getSnapshots(filters = {}) {
    try {
      const api = this.getAuthenticatedAxios();

      const params = {};
      if (filters.deviceId) params.device_id = filters.deviceId;
      if (filters.limit) params.limit = filters.limit;
      if (filters.skip) params.skip = filters.skip;

      const response = await api.get('/snapshots', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get snapshots:', error.response?.data || error.message);
      return { snapshots: [] };
    }
  }

  /**
   * Get snapshot details
   */
  async getSnapshot(snapshotId) {
    try {
      const api = this.getAuthenticatedAxios();

      const response = await api.get(`/snapshots/${snapshotId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get snapshot details:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(snapshotId) {
    try {
      const api = this.getAuthenticatedAxios();

      await api.delete(`/snapshots/${snapshotId}`);
      console.log(`Deleted snapshot: ${snapshotId}`);
    } catch (error) {
      console.error('Failed to delete snapshot:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Capture bookmark from live stream
   */
  async captureBookmarkLive(vasDeviceId, label) {
    try {
      const api = this.getAuthenticatedAxios();

      console.log(`Capturing live bookmark for device: ${vasDeviceId}`);
      const response = await api.post(`/bookmarks/devices/${vasDeviceId}/capture/live`, {
        label
      });

      console.log(`Captured live bookmark: ${response.data.bookmark.id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to capture live bookmark:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Capture bookmark from historical footage
   */
  async captureBookmarkHistorical(vasDeviceId, centerTimestamp, label) {
    try {
      const api = this.getAuthenticatedAxios();

      console.log(`Capturing historical bookmark for device: ${vasDeviceId} at ${centerTimestamp}`);
      const response = await api.post(`/bookmarks/devices/${vasDeviceId}/capture/historical`, {
        center_timestamp: centerTimestamp,
        label
      });

      console.log(`Captured historical bookmark: ${response.data.bookmark.id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to capture historical bookmark:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all bookmarks
   */
  async getBookmarks(filters = {}) {
    try {
      const api = this.getAuthenticatedAxios();

      const params = {};
      if (filters.deviceId) params.device_id = filters.deviceId;
      if (filters.limit) params.limit = filters.limit;
      if (filters.skip) params.skip = filters.skip;

      const response = await api.get('/bookmarks', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get bookmarks:', error.response?.data || error.message);
      return { bookmarks: [], total: 0 };
    }
  }

  /**
   * Get bookmark details
   */
  async getBookmark(bookmarkId) {
    try {
      const api = this.getAuthenticatedAxios();

      const response = await api.get(`/bookmarks/${bookmarkId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get bookmark details:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update bookmark label
   */
  async updateBookmark(bookmarkId, label) {
    try {
      const api = this.getAuthenticatedAxios();

      const response = await api.put(`/bookmarks/${bookmarkId}`, { label });
      return response.data;
    } catch (error) {
      console.error('Failed to update bookmark:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete bookmark
   */
  async deleteBookmark(bookmarkId) {
    try {
      const api = this.getAuthenticatedAxios();

      await api.delete(`/bookmarks/${bookmarkId}`);
      console.log(`Deleted bookmark: ${bookmarkId}`);
    } catch (error) {
      console.error('Failed to delete bookmark:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Health check for VAS V2 integration
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.vasApiUrl}/health`, { timeout: 5000 });

      return {
        vas_backend: response.data.status === 'healthy' || response.status === 200,
        mediasoup_configured: !!this.mediasoupUrl,
        api_version: this.vasApiVersion,
        authentication_enabled: this.vasRequireAuth,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        vas_backend: false,
        mediasoup_configured: false,
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed health status
   */
  async getDetailedHealth() {
    try {
      const response = await axios.get(`${this.vasApiUrl}/health/detailed`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.error('Failed to get detailed health:', error.message);
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Helper: Extract IP from RTSP URL
   */
  extractIPFromRTSP(rtspUrl) {
    try {
      const match = rtspUrl.match(/rtsp:\/\/(?:[^:]+:[^@]+@)?([^:\/]+)/);
      return match ? match[1] : '192.168.1.100';
    } catch {
      return '192.168.1.100';
    }
  }

  /**
   * Helper: Extract port from RTSP URL
   */
  extractPortFromRTSP(rtspUrl) {
    try {
      const match = rtspUrl.match(/:(\d+)\//);
      return match ? parseInt(match[1]) : 554;
    } catch {
      return 554;
    }
  }
}

module.exports = new VASIntegrationService();
