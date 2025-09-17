// VAS API Service for Ruth-AI
// Handles communication with VAS Backend APIs for device and stream management

import axios from 'axios';
import config from '../config/environment';

const VAS_BASE_URL = config.VAS_API_URL;

class VASApiService {
  constructor() {
    this.client = axios.create({
      baseURL: VAS_BASE_URL,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('vasAuthToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Authentication with VAS
  async authenticate(username, password) {
    try {
      const response = await this.client.post('/auth/login-json', {
        username,
        password
      });
      
      if (response.data.access_token) {
        localStorage.setItem('vasAuthToken', response.data.access_token);
        return { success: true, token: response.data.access_token };
      }
      
      return { success: false, error: 'No token received' };
    } catch (error) {
      console.error('VAS authentication failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Authentication failed' 
      };
    }
  }

  // Get all devices from VAS
  async getDevices() {
    try {
      const response = await this.client.get('/devices/');
      return {
        success: true,
        devices: response.data.devices || response.data
      };
    } catch (error) {
      console.error('Failed to fetch VAS devices:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch devices'
      };
    }
  }

  // Get cameras (alias for getDevices for compatibility)
  async getCameras() {
    try {
      const response = await this.client.get('/devices/');
      return {
        success: true,
        data: response.data.devices || response.data
      };
    } catch (error) {
      console.error('Failed to fetch VAS cameras:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch cameras'
      };
    }
  }

  // Get specific device by ID
  async getDevice(deviceId) {
    try {
      const response = await this.client.get(`/devices/${deviceId}`);
      return {
        success: true,
        device: response.data
      };
    } catch (error) {
      console.error(`Failed to fetch device ${deviceId}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch device'
      };
    }
  }

  // Get all streams from VAS
  async getStreams() {
    try {
      const response = await this.client.get('/streams/');
      return {
        success: true,
        streams: response.data
      };
    } catch (error) {
      console.error('Failed to fetch VAS streams:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch streams'
      };
    }
  }

  // Start streaming for a device
  async startStream(deviceId) {
    try {
      const response = await this.client.post(`/streams/${deviceId}/start`);
      return {
        success: true,
        stream: response.data
      };
    } catch (error) {
      console.error(`Failed to start stream for device ${deviceId}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to start stream'
      };
    }
  }

  // Stop streaming for a device
  async stopStream(deviceId) {
    try {
      const response = await this.client.post(`/streams/${deviceId}/stop`);
      return {
        success: true,
        stream: response.data
      };
    } catch (error) {
      console.error(`Failed to stop stream for device ${deviceId}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to stop stream'
      };
    }
  }

  // Get stream status for a device
  async getStreamStatus(deviceId) {
    try {
      const response = await this.client.get(`/streams/${deviceId}/status`);
      return {
        success: true,
        stream: response.data
      };
    } catch (error) {
      console.error(`Failed to get stream status for device ${deviceId}:`, error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get stream status'
      };
    }
  }

  // Check VAS health
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        health: response.data
      };
    } catch (error) {
      console.error('VAS health check failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Health check failed'
      };
    }
  }

  // Check Janus health through VAS
  async checkJanusHealth() {
    try {
      const response = await this.client.get('/streams/janus/health');
      return {
        success: true,
        health: response.data
      };
    } catch (error) {
      console.error('Janus health check failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Janus health check failed'
      };
    }
  }
}

export const vasApiService = new VASApiService();
export default vasApiService;
