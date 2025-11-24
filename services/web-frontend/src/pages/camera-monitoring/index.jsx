import React, { useState, useEffect, useCallback, useRef } from 'react';
import CameraFeedsPanel from './components/CameraFeedsPanel';
import axios from 'axios';
import config from '../../config/environment';
import VASV2MediaSoupClient from '../../services/vasV2MediasoupClient';

const CameraMonitoringPage = () => {
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
      setCameras(data.cameras || []);
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
    return <div className="text-center py-8">Loading cameras...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className={`p-4 ${isFullscreen ? 'fixed inset-0 bg-black z-50' : ''}`}>
      {!isFullscreen && <h1 className="text-2xl font-bold mb-4">Camera Live Monitoring</h1>}
      <CameraFeedsPanel
        cameras={cameras}
        onRefresh={fetchCameras}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onStartStream={startStream}
        onStopStream={stopStream}
        activeStreams={activeStreams}
      />
    </div>
  );
};

export default CameraMonitoringPage;