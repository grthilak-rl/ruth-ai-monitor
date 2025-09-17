import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const VASStreamingTest = () => {
  const [vasToken, setVasToken] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const videoRef = useRef(null);
  const janusRef = useRef(null);
  const pluginHandleRef = useRef(null);

  const VAS_API_URL = 'http://10.30.250.245:8000/api';
  const JANUS_WS_URL = 'ws://10.30.250.245:8188/janus';

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Authenticate with VAS
  const authenticateWithVAS = async () => {
    try {
      addLog('🔐 Authenticating with VAS...');
      const response = await fetch(`${VAS_API_URL}/auth/login-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      setVasToken(data.access_token);
      addLog('✅ VAS Authentication successful');
      return data.access_token;
    } catch (error) {
      addLog(`❌ VAS Authentication failed: ${error.message}`);
      setError(`Authentication failed: ${error.message}`);
      return null;
    }
  };

  // Fetch VAS devices
  const fetchVASDevices = async () => {
    if (!vasToken) return;

    try {
      addLog('📱 Fetching VAS devices...');
      const response = await fetch(`${VAS_API_URL}/devices/`, {
        headers: {
          'Authorization': `Bearer ${vasToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status}`);
      }

      const data = await response.json();
      setDevices(data.devices || []);
      addLog(`✅ Found ${data.devices?.length || 0} VAS devices`);
    } catch (error) {
      addLog(`❌ Failed to fetch VAS devices: ${error.message}`);
      setError(`Failed to fetch devices: ${error.message}`);
    }
  };

  // Initialize Janus
  const initializeJanus = () => {
    return new Promise((resolve, reject) => {
      if (typeof Janus === 'undefined') {
        reject(new Error('Janus library not loaded'));
        return;
      }

      Janus.init({
        debug: "all",
        callback: () => {
          addLog('✅ Janus library initialized');
          resolve();
        }
      });
    });
  };

  // Create Janus session
  const createJanusSession = () => {
    return new Promise((resolve, reject) => {
      const janus = new Janus({
        server: JANUS_WS_URL,
        success: () => {
          addLog('✅ Janus session created');
          janusRef.current = janus;
          resolve(janus);
        },
        error: (error) => {
          addLog(`❌ Janus session creation failed: ${error}`);
          reject(error);
        },
        destroyed: () => {
          addLog('🧹 Janus session destroyed');
          janusRef.current = null;
        }
      });
    });
  };

  // Start streaming for a device
  const startStreaming = async (device) => {
    if (!janusRef.current || !vasToken) {
      setError('Janus session or VAS token not available');
      return;
    }

    try {
      setStreaming(true);
      setError(null);
      addLog(`🎬 Starting stream for ${device.name}...`);

      // Get WebRTC config from VAS
      const configResponse = await fetch(`${VAS_API_URL}/monitoring/${device.id}/webrtc`, {
        headers: {
          'Authorization': `Bearer ${vasToken}`
        }
      });

      if (!configResponse.ok) {
        throw new Error(`Failed to get WebRTC config: ${configResponse.status}`);
      }

      const config = await configResponse.json();
      addLog(`📺 WebRTC Config received for stream ${config.webrtc_config.stream_id}`);

      // Attach to streaming plugin
      janusRef.current.attach({
        plugin: "janus.plugin.streaming",
        success: (pluginHandle) => {
          addLog('✅ Connected to streaming plugin');
          pluginHandleRef.current = pluginHandle;

          // Watch the stream
          pluginHandle.send({
            message: { request: "watch", id: config.webrtc_config.stream_id },
            success: (result) => {
              addLog('📺 Watch request sent successfully');
            },
            error: (error) => {
              addLog(`❌ Watch request failed: ${JSON.stringify(error)}`);
              setError(`Watch request failed: ${JSON.stringify(error)}`);
            }
          });
        },
        error: (error) => {
          addLog(`❌ Plugin attach failed: ${error}`);
          setError(`Plugin attach failed: ${error}`);
          setStreaming(false);
        },
        onmessage: (msg, jsep) => {
          addLog('📨 Plugin message received');
          
          if (jsep) {
            addLog('🎬 SDP offer received');
            pluginHandleRef.current.createAnswer({
              jsep: jsep,
              media: { audioSend: false, videoSend: false, audioRecv: false, videoRecv: true },
              success: (answerJsep) => {
                addLog('✅ SDP answer created');
                
                // Set up video track handling
                const pc = pluginHandleRef.current.webrtcStuff.pc;
                if (pc && videoRef.current) {
                  addLog('🎥 Setting up video track handling');
                  
                  pc.ontrack = (event) => {
                    addLog('🎥 Video track received!');
                    if (event.track && event.track.kind === 'video') {
                      addLog('🎥 Adding video to element');
                      const stream = new MediaStream([event.track]);
                      videoRef.current.srcObject = stream;
                      
                      videoRef.current.play().then(() => {
                        addLog('🎉 Video playing successfully!');
                      }).catch((error) => {
                        addLog(`❌ Video play failed: ${error.message}`);
                        setError(`Video play failed: ${error.message}`);
                      });
                    }
                  };
                }
                
                pluginHandleRef.current.send({
                  message: { request: "start" },
                  jsep: answerJsep
                });
              },
              error: (error) => {
                addLog(`❌ Answer creation failed: ${error}`);
                setError(`Answer creation failed: ${error}`);
              }
            });
          }
        },
        onremotetrack: (track, mid, added) => {
          addLog(`🎥 Remote track: ${track?.kind}, added: ${added}`);
          if (added && track.kind === 'video' && videoRef.current) {
            addLog('🎥 Adding video track via onremotetrack');
            const stream = new MediaStream([track]);
            videoRef.current.srcObject = stream;
            
            videoRef.current.play().then(() => {
              addLog('🎉 Video playing via onremotetrack!');
            }).catch((error) => {
              addLog(`❌ Video play failed: ${error.message}`);
            });
          }
        },
        oncleanup: () => {
          addLog('🧹 Plugin cleanup');
          pluginHandleRef.current = null;
          setStreaming(false);
        }
      });

    } catch (error) {
      addLog(`❌ Streaming failed: ${error.message}`);
      setError(`Streaming failed: ${error.message}`);
      setStreaming(false);
    }
  };

  // Stop streaming
  const stopStreaming = () => {
    addLog('🛑 Stopping stream...');
    if (pluginHandleRef.current) {
      pluginHandleRef.current.detach();
      pluginHandleRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    setSelectedDevice(null);
  };

  // Initialize everything
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeJanus();
        const token = await authenticateWithVAS();
        if (token) {
          await fetchVASDevices();
          await createJanusSession();
        }
      } catch (error) {
        addLog(`❌ Initialization failed: ${error.message}`);
        setError(`Initialization failed: ${error.message}`);
      }
    };

    initialize();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>VAS Video Streaming Test</h1>
      
      {/* Status */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <span style={{ 
          padding: '5px 10px', 
          borderRadius: '5px', 
          backgroundColor: vasToken ? '#4CAF50' : '#f44336',
          color: 'white'
        }}>
          VAS: {vasToken ? "Connected" : "Disconnected"}
        </span>
        <span style={{ 
          padding: '5px 10px', 
          borderRadius: '5px', 
          backgroundColor: janusRef.current ? '#4CAF50' : '#f44336',
          color: 'white'
        }}>
          Janus: {janusRef.current ? "Connected" : "Disconnected"}
        </span>
        <span style={{ 
          padding: '5px 10px', 
          borderRadius: '5px', 
          backgroundColor: streaming ? '#4CAF50' : '#f44336',
          color: 'white'
        }}>
          Stream: {streaming ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336', 
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#d32f2f'
        }}>
          {error}
        </div>
      )}

      {/* Device Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Select Device:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {devices.map((device) => (
            <div 
              key={device.id} 
              style={{
                padding: '10px',
                border: selectedDevice?.id === device.id ? '2px solid #2196F3' : '1px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                backgroundColor: selectedDevice?.id === device.id ? '#e3f2fd' : '#fff'
              }}
              onClick={() => setSelectedDevice(device)}
            >
              <h4>{device.name}</h4>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{device.location}</p>
              <span style={{ 
                padding: '2px 6px', 
                borderRadius: '3px', 
                fontSize: '12px',
                backgroundColor: device.status === 'online' ? '#4CAF50' : '#f44336',
                color: 'white'
              }}>
                {device.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => startStreaming(selectedDevice)}
          disabled={!selectedDevice || !vasToken || !janusRef.current || streaming}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !selectedDevice || !vasToken || !janusRef.current || streaming ? 'not-allowed' : 'pointer',
            opacity: !selectedDevice || !vasToken || !janusRef.current || streaming ? 0.5 : 1
          }}
        >
          Start Stream
        </button>
        <button 
          onClick={stopStreaming}
          disabled={!streaming}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !streaming ? 'not-allowed' : 'pointer',
            opacity: !streaming ? 0.5 : 1
          }}
        >
          Stop Stream
        </button>
      </div>

      {/* Video Display */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Video Feed:</h3>
        <div style={{ backgroundColor: '#000', borderRadius: '5px', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxHeight: '600px' }}
          />
        </div>
      </div>

      {/* Logs */}
      <div>
        <h3>Logs:</h3>
        <div style={{ 
          height: '300px', 
          overflowY: 'auto', 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <VASStreamingTest />
    </div>
  );
}

export default App;