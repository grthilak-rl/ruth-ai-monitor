import React, { useState, useEffect, useCallback, useRef } from 'react';
import CameraFeedsPanel from './components/CameraFeedsPanel';
import NavigationHeader from '../../components/ui/NavigationHeader';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import config from '../../config/environment';
import VASV2MediaSoupClient from '../../services/vasV2MediasoupClient';

const CameraMonitoringPage = () => {
  const { user } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeStreams, setActiveStreams] = useState(new Map());
  const mediasoupClients = useRef(new Map());

  // WebRTC polyfills are now handled in index.html

  const fetchCameras = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${config.API_URL}/cameras/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cameras: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched cameras from Ruth-AI:', data.cameras);

      // activeModels is now returned directly from the backend based on subscriptions
      const camerasWithActiveModels = (data.cameras || []).map(cam => ({
        ...cam,
        activeModels: cam.activeModels || []
      }));

      setCameras(camerasWithActiveModels);
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
      setError(`Failed to load cameras: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  // Handle model toggle (subscribe/unsubscribe camera to AI model)
  const handleModelToggle = async (cameraId, modelId, enabled) => {
    try {
      console.log(`${enabled ? 'Subscribing to' : 'Unsubscribing from'} model ${modelId} for camera ${cameraId}`);

      // Update local state immediately for responsive UI
      setCameras(prevCameras =>
        prevCameras.map(cam => {
          if (cam.id === cameraId) {
            const activeModels = cam.activeModels || [];
            return {
              ...cam,
              activeModels: enabled
                ? [...activeModels, modelId]
                : activeModels.filter(id => id !== modelId)
            };
          }
          return cam;
        })
      );

      // Call backend API to subscribe/unsubscribe to model
      const endpoint = enabled ? 'subscribe' : 'unsubscribe';
      const response = await fetch(`${config.API_URL}/cameras/${cameraId}/models/${modelId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${endpoint} to model`);
      }

      const data = await response.json();
      console.log(`Model ${modelId} ${endpoint} result:`, data);

    } catch (error) {
      console.error(`Failed to toggle model ${modelId}:`, error);
      alert(`Failed to ${enabled ? 'subscribe to' : 'unsubscribe from'} model: ${error.message}`);

      // Revert UI state on error
      setCameras(prevCameras =>
        prevCameras.map(cam => {
          if (cam.id === cameraId) {
            const activeModels = cam.activeModels || [];
            return {
              ...cam,
              activeModels: enabled
                ? activeModels.filter(id => id !== modelId)
                : [...activeModels, modelId]
            };
          }
          return cam;
        })
      );
    }
  };

  // Start stream on VAS V2
  const startStream = async (cameraId) => {
    try {
      console.log(`Starting stream for camera ${cameraId}`);

      // Call Ruth-AI backend to start stream on VAS V2
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/cameras/${cameraId}/start-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to start stream: ${response.status}`);
      }

      const data = await response.json();
      console.log('Stream started successfully:', data);

      // Create VAS V2 MediaSoup client and connect via WebSocket
      const mediasoupClient = new VASV2MediaSoupClient();
      const websocketUrl = data.websocket_url || 'ws://10.30.250.245:8080/ws/mediasoup';

      console.log('Connecting to VAS V2 MediaSoup via WebSocket...');
      const track = await mediasoupClient.connect(websocketUrl, data);

      // Attach track to video element
      console.log(`Received track for camera ${cameraId}:`, track);
      const stream = new MediaStream([track]);
      const videoElement = document.getElementById(`video-${cameraId}`);
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play().catch(e => console.error('Error playing video:', e));
      }

      // Store the client
      mediasoupClients.current.set(cameraId, mediasoupClient);

      // Mark stream as active
      setActiveStreams(prev => new Map(prev.set(cameraId, { active: true, data })));

    } catch (error) {
      console.error(`Failed to start stream for camera ${cameraId}:`, error);
      alert(`Failed to start stream: ${error.message}`);
    }
  };

  // Stop stream on VAS V2
  const stopStream = async (cameraId) => {
    try {
      console.log(`Stopping stream for camera ${cameraId}`);

      // Disconnect MediaSoup client
      const mediasoupClient = mediasoupClients.current.get(cameraId);
      if (mediasoupClient) {
        mediasoupClient.disconnect();
        mediasoupClients.current.delete(cameraId);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/cameras/${cameraId}/stop-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to stop stream: ${response.status}`);
      }

      const data = await response.json();
      console.log('Stream stopped successfully:', data);

      // Remove from active streams
      setActiveStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(cameraId);
        return newMap;
      });

    } catch (error) {
      console.error(`Failed to stop stream for camera ${cameraId}:`, error);
      alert(`Failed to stop stream: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={user} onNavigate={() => {}} />
        <div className="pt-[60px] text-center py-8">Loading cameras...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader user={user} onNavigate={() => {}} />
        <div className="pt-[60px] text-center py-8 text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? 'fixed inset-0 bg-black z-50' : ''}`}>
      {!isFullscreen && <NavigationHeader user={user} onNavigate={() => {}} />}
      <div className={`${!isFullscreen ? 'pt-[60px]' : ''} p-4`}>
        {!isFullscreen && <h1 className="text-2xl font-bold mb-4">Camera Live Monitoring</h1>}
        <CameraFeedsPanel
          cameras={cameras}
          onRefresh={fetchCameras}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onStartStream={startStream}
          onStopStream={stopStream}
          activeStreams={activeStreams}
          onModelToggle={handleModelToggle}
        />
      </div>
    </div>
  );
};

export default CameraMonitoringPage;