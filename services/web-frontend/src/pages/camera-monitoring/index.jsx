import React, { useState, useEffect, useCallback, useRef } from 'react';
import CameraFeedsPanel from './components/CameraFeedsPanel';
import axios from 'axios';
import config from '../../config/environment';

const CameraMonitoringPage = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [activeStreams, setActiveStreams] = useState(new Map());
  const janusRef = useRef(null);

  // WebRTC polyfills are now handled in index.html

  const authenticateWithVAS = async () => {
    try {
      const response = await fetch(`${config.VAS_API_URL}/auth/login-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      const authData = await response.json();
      setAuthToken(authData.access_token);
      return authData.access_token;
    } catch (err) {
      console.error('VAS authentication failed:', err);
      throw err;
    }
  };

  const fetchCameras = async () => {
    setLoading(true);
    setError(null);
    try {
      // Authenticate with VAS first
      const token = await authenticateWithVAS();
      
      // Fetch cameras from VAS
      const response = await fetch(`${config.VAS_API_URL}/devices/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cameras: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched cameras from VAS:', data.devices);
      setCameras(data.devices || []);
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

  // Initialize Janus (same as working test page)
  const initJanus = async () => {
    if (janusRef.current) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      if (typeof window.Janus === 'undefined') {
        reject(new Error('Janus library not loaded'));
        return;
      }
      
      window.Janus.init({
        debug: "all",
        callback: function() {
          console.log('Janus initialized successfully');
          resolve();
        }
      });
    });
  };

  // Start WebRTC stream (replicated from working test page)
  const startStream = async (cameraId) => {
    if (!authToken) {
      console.error('No auth token available');
      return;
    }

    try {
      // Initialize Janus if not already done
      await initJanus();
      
      // Get WebRTC configuration
      const configResponse = await fetch(`${config.VAS_API_URL}/streams/webrtc/streams/${cameraId}/config`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!configResponse.ok) {
        throw new Error(`HTTP ${configResponse.status}: ${configResponse.statusText}`);
      }
      
      const streamConfig = await configResponse.json();
      console.log(`Got WebRTC config for camera ${cameraId}`);
      
      // Create Janus session
      const janus = new window.Janus({
        server: streamConfig.janus_websocket_url,
        success: function() {
          console.log(`Connected to Janus for camera ${cameraId}`);
          
          // Attach to streaming plugin
          janus.attach({
            plugin: streamConfig.plugin,
            success: function(pluginHandle) {
              console.log(`Attached to streaming plugin for camera ${cameraId}`);
              
              // Send watch request
              pluginHandle.send({
                message: { request: "watch", id: streamConfig.stream_id },
                success: function(result) {
                  console.log(`Watching stream ${streamConfig.stream_id}:`, result);
                },
                error: function(error) {
                  console.error(`Watch request failed:`, error);
                }
              });
              
              // Store the plugin handle
              setActiveStreams(prev => new Map(prev.set(cameraId, pluginHandle)));
              
              // Handle incoming media
              pluginHandle.onmessage = function(msg, jsep) {
                console.log(`Received message for camera ${cameraId}:`, msg);
                
                if (jsep) {
                  pluginHandle.createAnswer({
                    jsep: jsep,
                    media: { audioSend: false, videoSend: false, audioRecv: true, videoRecv: true },
                    success: function(jsep) {
                      pluginHandle.send({
                        message: { request: "start" },
                        jsep: jsep
                      });
                    },
                    error: function(error) {
                      console.error(`Error creating answer for camera ${cameraId}:`, error);
                    }
                  });
                }
              };
              
              // Handle remote stream
              pluginHandle.onremotestream = function(stream) {
                console.log(`Received remote stream for ${cameraId}`);
                console.log(`Stream tracks: ${stream.getTracks().length}`);
                console.log(`Video tracks: ${stream.getVideoTracks().length}`);
                
                // Check if video element exists in DOM
                const videoElement = document.getElementById(`video-${cameraId}`);
                if (videoElement) {
                  console.log(`Setting video element srcObject for ${cameraId}`);
                  videoElement.srcObject = stream;
                  
                  // Try to play the video
                  videoElement.play().then(() => {
                    console.log(`Video play() successful for ${cameraId}`);
                  }).catch(e => {
                    console.error(`Video play() failed for ${cameraId}:`, e);
                  });
                } else {
                  console.error(`Video element not found in DOM for ${cameraId}`);
                }
              };
              
              // Handle remote track (alternative method)
              pluginHandle.onremotetrack = function(track, mid, on) {
                console.log(`Received remote track for ${cameraId}: ${track.kind} (${on ? 'on' : 'off'})`);
                
                if (track.kind === 'video' && on) {
                  // Create a new MediaStream with this track
                  const stream = new MediaStream([track]);
                  console.log(`Created MediaStream with ${stream.getTracks().length} tracks for ${cameraId}`);
                  
                  // Check if video element exists in DOM
                  const videoElement = document.getElementById(`video-${cameraId}`);
                  if (videoElement) {
                    console.log(`Setting video element srcObject for ${cameraId}`);
                    videoElement.srcObject = stream;
                    
                    // Try to play the video
                    videoElement.play().then(() => {
                      console.log(`Video play() successful for ${cameraId}`);
                    }).catch(e => {
                      console.error(`Video play() failed for ${cameraId}:`, e);
                    });
                  } else {
                    console.error(`Video element not found in DOM for ${cameraId}`);
                  }
                }
              };
              
              // Handle cleanup
              pluginHandle.oncleanup = function() {
                console.log(`Cleanup for camera ${cameraId}`);
                setActiveStreams(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(cameraId);
                  return newMap;
                });
              };
            },
            error: function(error) {
              console.error(`Failed to attach to streaming plugin:`, error);
            }
          });
        },
        error: function(error) {
          console.error(`Janus session failed:`, error);
        },
        destroyed: function() {
          console.log(`Janus session destroyed for camera ${cameraId}`);
        }
      });
      
    } catch (error) {
      console.error(`Failed to start stream for camera ${cameraId}:`, error);
    }
  };

  // Stop WebRTC stream
  const stopStream = (cameraId) => {
    const pluginHandle = activeStreams.get(cameraId);
    if (pluginHandle) {
      pluginHandle.detach();
      setActiveStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(cameraId);
        return newMap;
      });
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