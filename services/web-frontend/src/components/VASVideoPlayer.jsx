import React, { useRef, useEffect, useState } from 'react';
import vasApiService from '../services/vasApiService';

// VAS WebRTC Client - Load dynamically or use existing
class VASWebRTCClientLocal {
  constructor(vasServerUrl) {
    this.vasServerUrl = vasServerUrl.replace(/\/$/, '');
    this.authToken = null;
    this.janus = null;
    this.streamingHandles = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (!window.Janus) {
      throw new Error('Janus library not loaded. Please include janus.js in your HTML.');
    }

    return new Promise((resolve, reject) => {
      window.Janus.init({
        debug: import.meta.env.DEV ? 'all' : false,
        callback: () => {
          console.log('✅ VAS WebRTC Client initialized');
          this.isInitialized = true;
          resolve();
        },
        error: (error) => {
          console.error('❌ Failed to initialize Janus:', error);
          reject(new Error(`Janus initialization failed: ${error}`));
        }
      });
    });
  }

  async authenticate(username, password) {
    const response = await fetch(`${this.vasServerUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const authData = await response.json();
    this.authToken = authData.access_token;
    return authData;
  }

  async getAllCameras() {
    const response = await fetch(`${this.vasServerUrl}/api/monitoring/cameras`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cameras: ${response.status}`);
    }

    return await response.json();
  }

  async connectToCamera(deviceId, videoElement) {
    if (!this.isInitialized) {
      throw new Error('VAS WebRTC Client not initialized');
    }

    console.log(`🎥 connectToCamera called with deviceId: ${deviceId}, videoElement:`, videoElement);

    // Get camera configuration using new WebRTC API
    const response = await fetch(`${this.vasServerUrl}/api/streams/webrtc/streams/${deviceId}/config`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to get camera config: ${response.status}`);
    }

    const config = await response.json();

    // Fix Janus server URL - replace localhost with server IP
    const janusServerUrl = config.webrtc_config.server.replace('localhost', '10.30.250.245');
    config.webrtc_config.server = janusServerUrl;

    // Create Janus session if not exists
    if (!this.janus) {
      await this.createJanusSession(config.webrtc_config.server);
    }

    // Connect to streaming plugin
    return new Promise((resolve, reject) => {
      this.janus.attach({
        plugin: "janus.plugin.streaming",
        success: (pluginHandle) => {
          console.log(`✅ Connected to streaming plugin for ${config.device_name}`);
          this.streamingHandles.set(deviceId, pluginHandle);

          pluginHandle.send({
            message: { request: "watch", id: config.webrtc_config.stream_id },
            success: (result) => {
              console.log(`📺 Watching stream ${config.webrtc_config.stream_id}:`, result);
            },
            error: (error) => {
              console.error(`❌ Watch request failed:`, error);
              reject(new Error(`Watch request failed: ${JSON.stringify(error)}`));
            }
          });

          resolve(pluginHandle);
        },
        error: (error) => {
          console.error(`❌ Failed to attach to streaming plugin:`, error);
          reject(new Error(`Plugin attach failed: ${error}`));
        },
        onmessage: (msg, jsep) => {
          if (jsep) {
            console.log('🎬 SDP offer received:', jsep);
            // Get the plugin handle for this device
            const handle = this.streamingHandles.get(deviceId);
            if (handle) {
              handle.createAnswer({
                jsep: jsep,
                media: { audioSend: false, videoSend: false, audioRecv: false, videoRecv: true },
                success: (answerJsep) => {
                  console.log('✅ SDP answer created:', answerJsep);
                  
                  // Set up video track handling on the PeerConnection
                  const pc = handle.webrtcStuff.pc;
                  if (pc && videoElement) {
                    console.log('🎥 Setting up PeerConnection track handling');
                    
                    pc.ontrack = (event) => {
                      console.log('🎥 PeerConnection ontrack event:', event);
                      if (event.track && event.track.kind === 'video') {
                        console.log('🎥 Adding video track to element:', videoElement);
                        const stream = new MediaStream([event.track]);
                        videoElement.srcObject = stream;
                        
                        videoElement.play().then(() => {
                          console.log('🎉 Video playing successfully!');
                          console.log('🎉 Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
                        }).catch((error) => {
                          console.error('❌ Video play failed:', error);
                        });
                      }
                    };
                  }
                  
                  handle.send({
                    message: { request: "start" },
                    jsep: answerJsep
                  });
                },
                error: (error) => {
                  console.error('❌ Answer creation failed:', error);
                  reject(new Error(`Answer creation failed: ${error}`));
                }
              });
            } else {
              console.error('❌ Plugin handle not found for device:', deviceId);
            }
          }
        },
        onremotetrack: (track, mid, added) => {
          console.log(`🎥 onremotetrack called - added: ${added}, kind: ${track?.kind}, mid: ${mid}, videoElement: ${!!videoElement}`);
          if (added && track.kind === 'video' && videoElement) {
            console.log(`🎥 Adding video track for ${config.device_name}`);
            console.log(`🎥 Video element:`, videoElement);
            console.log(`🎥 Track:`, track);
            const stream = new MediaStream([track]);
            console.log(`🎥 Stream:`, stream);
            videoElement.srcObject = stream;
            console.log(`🎥 Video srcObject set:`, videoElement.srcObject);
            
            videoElement.play().then(() => {
              console.log(`🎉 Video playing for ${config.device_name}!`);
              console.log(`🎉 Video element dimensions:`, videoElement.videoWidth, 'x', videoElement.videoHeight);
            }).catch((error) => {
              if (error.name !== 'AbortError') {
                console.error(`❌ Video play failed:`, error);
              }
            });
          } else {
            console.log(`🎥 Track event - added: ${added}, kind: ${track?.kind}, videoElement: ${!!videoElement}`);
          }
        },
        oncleanup: () => {
          console.log(`🧹 Cleanup for ${config.device_name}`);
          this.streamingHandles.delete(deviceId);
        }
      });
    });
  }

  async createJanusSession(janusServer) {
    return new Promise((resolve, reject) => {
      this.janus = new window.Janus({
        server: janusServer,
        success: () => {
          console.log('✅ Janus session created');
          resolve();
        },
        error: (error) => {
          console.error('❌ Janus session failed:', error);
          reject(new Error(`Janus session failed: ${error}`));
        },
        destroyed: () => {
          console.log('🛑 Janus session destroyed');
          this.janus = null;
        }
      });
    });
  }

  async disconnectCamera(deviceId) {
    const handle = this.streamingHandles.get(deviceId);
    if (handle) {
      handle.detach();
      this.streamingHandles.delete(deviceId);
    }
  }

  async disconnectAll() {
    const disconnectPromises = Array.from(this.streamingHandles.keys()).map(
      deviceId => this.disconnectCamera(deviceId)
    );
    await Promise.all(disconnectPromises);
    
    if (this.janus) {
      this.janus.destroy();
      this.janus = null;
    }
  }
}

const VASVideoPlayer = ({ 
  camera, 
  width = 640, 
  height = 480, 
  autoStart = false,
  className = "",
  onStatusChange 
}) => {
  const videoRef = useRef(null);
  const vasClientRef = useRef(null);
  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Status handler
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  // Initialize VAS client
  useEffect(() => {
    const initializeVAS = async () => {
      try {
        if (!window.Janus) {
          setError('Janus library not loaded. Please include janus.js in your HTML.');
          return;
        }

        vasClientRef.current = new VASWebRTCClientLocal('http://10.30.250.245:8000');
        await vasClientRef.current.initialize();
        
        if (autoStart && camera?.vasDeviceId) {
          startStream();
        }
      } catch (err) {
        console.error('Failed to initialize VAS:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    initializeVAS();

    return () => {
      if (vasClientRef.current) {
        vasClientRef.current.disconnectAll();
      }
    };
  }, []);

  // Start streaming using VAS integration
  const startStream = async () => {
    if (!vasClientRef.current || !camera?.vasDeviceId) {
      setError('No VAS client or device ID available');
      return;
    }

    try {
      setError(null);
      setStatus('connecting');

      console.log(`Starting VAS stream for device ${camera.vasDeviceId}`);

      // Authenticate with VAS
      await vasClientRef.current.authenticate('admin', 'admin123');
      
      // Connect to camera
      await vasClientRef.current.connectToCamera(camera.vasDeviceId, videoRef.current);
      
      setIsPlaying(true);
      setStatus('streaming');
      handleStatusChange('streaming');
    } catch (err) {
      console.error('Failed to start VAS stream:', err);
      setError(err.message);
      setStatus('error');
      setIsPlaying(false);
    }
  };

  // Stop streaming
  const stopStream = async () => {
    if (vasClientRef.current && camera?.vasDeviceId) {
      await vasClientRef.current.disconnectCamera(camera.vasDeviceId);
    }
    setIsPlaying(false);
    setStatus('connected');
  };

  // Get status display info
  const getStatusInfo = () => {
    switch (status) {
      case 'connecting':
        return { color: 'text-yellow-500', text: 'Connecting...' };
      case 'connected':
        return { color: 'text-green-500', text: 'Connected' };
      case 'streaming':
        return { color: 'text-green-500', text: 'Streaming' };
      case 'error':
        return { color: 'text-red-500', text: 'Error' };
      case 'disconnected':
      default:
        return { color: 'text-gray-500', text: 'Disconnected' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`vas-video-player ${className}`}>
      {/* Video Element */}
      <div className="relative">
        <video
          ref={videoRef}
          width={width}
          height={height}
          autoPlay
          playsInline
          muted
          className="bg-black rounded-lg"
          style={{ width: '100%', height: 'auto' }}
        />
        
        {/* Status Overlay */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-sm">
          <span className={statusInfo.color}>● {statusInfo.text}</span>
        </div>

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center p-4">
              <div className="text-red-400 mb-2">⚠ Stream Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* No Stream Overlay */}
        {!isPlaying && !error && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-gray-300 mb-2">📹</div>
              <div className="text-sm">Camera: {camera?.name || 'Unknown'}</div>
              <div className="text-xs text-gray-400">
                {camera?.location || 'No location'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-2 flex justify-center space-x-2">
        {!isPlaying ? (
          <button
            onClick={startStream}
            disabled={status === 'connecting' || !camera?.vasDeviceId}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {status === 'connecting' ? 'Connecting...' : '▶ Start Stream'}
          </button>
        ) : (
          <button
            onClick={stopStream}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            ⏹ Stop Stream
          </button>
        )}
      </div>

        {/* Debug Info (only in development) */}
        {import.meta.env.DEV && (
          <div className="mt-2 text-xs text-gray-500">
            <div>VAS Device ID: {camera?.vasDeviceId || 'N/A'}</div>
            <div>Status: {status}</div>
            <div>Error: {error || 'None'}</div>
          </div>
        )}
    </div>
  );
};

export default VASVideoPlayer;