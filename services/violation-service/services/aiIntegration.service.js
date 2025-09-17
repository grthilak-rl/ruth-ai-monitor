const axios = require('axios');

class AIIntegrationService {
  constructor() {
    this.aiModelsServiceUrl = process.env.AI_MODELS_SERVICE_URL || 'http://ai-models-service:8000';
    this.cameraServiceUrl = process.env.CAMERA_SERVICE_URL || 'http://camera-service:3000';
    this.isConnected = false;
    this.availableModels = [];
    this.lastHealthCheck = null;
  }

  /**
   * Check AI Models Service health
   */
  async checkHealth() {
    try {
      console.log('🔍 Checking AI Models Service health...');
      
      const response = await axios.get(`${this.aiModelsServiceUrl}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.status === 'healthy') {
        this.isConnected = true;
        this.availableModels = response.data.models_loaded || [];
        this.lastHealthCheck = new Date();
        console.log('✅ AI Models Service is healthy');
        return true;
      } else {
        this.isConnected = false;
        console.log('❌ AI Models Service health check failed');
        return false;
      }
    } catch (error) {
      this.isConnected = false;
      console.error('❌ AI Models Service health check error:', error.message);
      return false;
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels() {
    try {
      if (!this.isConnected) {
        await this.checkHealth();
      }

      const response = await axios.get(`${this.aiModelsServiceUrl}/models`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.availableModels = response.data.models || [];
        return this.availableModels;
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to get available models:', error.message);
      return [];
    }
  }

  /**
   * Process camera frame for violations
   */
  async processFrameForViolations(frameData, cameraId, modelType = 'work_at_height') {
    try {
      if (!this.isConnected) {
        await this.checkHealth();
        if (!this.isConnected) {
          throw new Error('AI Models Service is not available');
        }
      }

      console.log(`🤖 Processing frame for camera ${cameraId} with model ${modelType}`);

      // Determine the correct endpoint based on model type
      let endpoint;
      switch (modelType) {
        case 'work_at_height':
          endpoint = '/detect/work-at-height';
          break;
        case 'fall_detection':
          endpoint = '/detect/fall';
          break;
        default:
          endpoint = '/detect/work-at-height'; // Default to work at height
      }

      const response = await axios.post(`${this.aiModelsServiceUrl}${endpoint}`, {
        image_data: frameData,
        camera_id: cameraId,
        timestamp: new Date().toISOString()
      }, {
        timeout: 30000, // 30 second timeout for AI processing
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        const result = response.data;
        console.log(`✅ AI processing completed for camera ${cameraId}`);
        return {
          success: true,
          violations: result.violations || [],
          confidence: result.confidence || 0,
          processing_time: result.processing_time || 0,
          model_used: result.model_used || modelType,
          bounding_boxes: result.bounding_boxes || [],
          detection_data: result.detection_data || {}
        };
      } else {
        throw new Error(`AI processing failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ AI frame processing error:', error.message);
      return {
        success: false,
        error: error.message,
        violations: [],
        confidence: 0
      };
    }
  }

  /**
   * Process multiple frames for violations
   */
  async processFramesForViolations(framesData, cameraId, modelType = 'work_at_height') {
    try {
      const results = [];
      
      for (const frameData of framesData) {
        const result = await this.processFrameForViolations(frameData, cameraId, modelType);
        results.push(result);
        
        // Add small delay between processing to avoid overwhelming the AI service
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    } catch (error) {
      console.error('❌ Batch AI processing error:', error.message);
      return [];
    }
  }

  /**
   * Get camera feed for processing
   */
  async getCameraFeed(cameraId) {
    try {
      console.log(`📹 Getting camera feed for camera ${cameraId}`);
      
      const response = await axios.get(`${this.cameraServiceUrl}/cameras/${cameraId}`, {
        timeout: 10000
      });
      
      if (response.status === 200) {
        const camera = response.data.camera;
        return {
          success: true,
          camera: camera,
          feed_url: camera.feed_url,
          vas_device_id: camera.vas_device_id,
          janus_stream_id: camera.janus_stream_id
        };
      } else {
        throw new Error(`Failed to get camera ${cameraId}`);
      }
    } catch (error) {
      console.error('❌ Failed to get camera feed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start violation processing for a camera
   */
  async startViolationProcessing(cameraId, modelType = 'work_at_height', intervalMs = 5000) {
    try {
      console.log(`🚨 Starting violation processing for camera ${cameraId}`);
      
      // Get camera information
      const cameraInfo = await this.getCameraFeed(cameraId);
      if (!cameraInfo.success) {
        throw new Error(`Failed to get camera ${cameraId} information`);
      }

      // Check if AI service is available
      if (!this.isConnected) {
        await this.checkHealth();
        if (!this.isConnected) {
          throw new Error('AI Models Service is not available');
        }
      }

      // Start processing loop
      const processingId = `camera_${cameraId}_${Date.now()}`;
      
      return {
        success: true,
        processing_id: processingId,
        camera_id: cameraId,
        model_type: modelType,
        interval_ms: intervalMs,
        camera_info: cameraInfo.camera,
        status: 'started'
      };
    } catch (error) {
      console.error('❌ Failed to start violation processing:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop violation processing for a camera
   */
  async stopViolationProcessing(cameraId, processingId) {
    try {
      console.log(`🛑 Stopping violation processing for camera ${cameraId}`);
      
      // In a real implementation, this would stop the processing loop
      // For now, we'll just return success
      
      return {
        success: true,
        processing_id: processingId,
        camera_id: cameraId,
        status: 'stopped'
      };
    } catch (error) {
      console.error('❌ Failed to stop violation processing:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get processing status for a camera
   */
  async getProcessingStatus(cameraId) {
    try {
      // In a real implementation, this would check the actual processing status
      // For now, we'll return a mock status
      
      return {
        success: true,
        camera_id: cameraId,
        is_processing: false,
        model_type: 'work_at_height',
        last_processed: new Date(),
        violations_detected: 0,
        processing_errors: 0
      };
    } catch (error) {
      console.error('❌ Failed to get processing status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get AI service statistics
   */
  async getAIStats() {
    try {
      if (!this.isConnected) {
        await this.checkHealth();
      }

      const response = await axios.get(`${this.aiModelsServiceUrl}/stats`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        return {
          success: true,
          ...response.data
        };
      } else {
        return {
          success: false,
          error: 'Failed to get AI stats'
        };
      }
    } catch (error) {
      console.error('❌ Failed to get AI stats:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for AI integration
   */
  async healthCheck() {
    try {
      const aiHealth = await this.checkHealth();
      const models = await this.getAvailableModels();
      
      return {
        ai_models_service: aiHealth,
        available_models: models.length,
        models_list: models,
        last_health_check: this.lastHealthCheck,
        camera_service: true // Assume camera service is available
      };
    } catch (error) {
      return {
        ai_models_service: false,
        available_models: 0,
        models_list: [],
        last_health_check: null,
        camera_service: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new AIIntegrationService();
