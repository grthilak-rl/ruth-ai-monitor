import React, { useState, useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Icon from '@/components/AppIcon';
import { Checkbox } from '@/components/ui/Checkbox';
import vasV2ApiService from '../../../services/vasV2ApiService';

const VASCameraFeed = ({ camera, onModelToggle, onFullscreen, isFullscreen, onStartStream, onStopStream, activeStreams }) => {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [vasStatus, setVasStatus] = useState(null);
  const [error, setError] = useState(null);
  const [feedMode, setFeedMode] = useState('live'); // 'live' or 'historical'
  const [recordingDates, setRecordingDates] = useState([]);
  const videoRef = useRef(null);
  const hlsPlayerRef = useRef(null);
  const videojsPlayerRef = useRef(null);
  const canvasRef = useRef(null);
  const frameProcessingRef = useRef(null);
  const lastDetectionRef = useRef(null);

  // Handle VAS connection status changes
  const handleVASStatusChange = (status) => {
    setVasStatus(status);
    setConnectionStatus(status);
  };

  // Track if a detection request is in progress
  const processingRef = useRef(false);

  // Frame processing for AI model detection
  const processFrameForDetection = async () => {
    // Skip if already processing a frame
    if (processingRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement || feedMode !== 'live' || connectionStatus !== 'streaming') {
      return;
    }

    // Check if any models are active
    const activeModels = camera?.activeModels || [];
    if (activeModels.length === 0) {
      // Clear canvas if no models active
      const ctx = canvasElement.getContext('2d');
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      return;
    }

    // Check if video has valid dimensions
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      return;
    }

    processingRef.current = true;

    try {
      // Capture frame from video
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);

      // Convert to blob
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));

      // Send to first active model
      const modelId = activeModels[0];
      const modelPort = modelId === 'fall-detection' ? 8001 : 8002;

      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      const response = await fetch(`http://10.30.250.245:${modelPort}/detect`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        lastDetectionRef.current = result;

        // Draw detections on canvas overlay
        drawDetections(result, canvasElement, videoElement);
      }
    } catch (err) {
      // Silently handle errors to avoid console spam
    } finally {
      processingRef.current = false;
    }
  };

  // Draw detection results on canvas
  const drawDetections = (result, canvas, video) => {
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!result.success || !result.detections || result.detections.length === 0) {
      return;
    }

    // Scale factors (model processes at 640x640, need to scale back to video dimensions)
    const scaleX = video.videoWidth / 640;
    const scaleY = video.videoHeight / 640;

    // Draw each detection
    result.detections.forEach((detection) => {
      // Draw bounding box
      if (detection.bbox) {
        const [x1, y1, x2, y2] = detection.bbox;
        const width = (x2 - x1) * scaleX;
        const height = (y2 - y1) * scaleY;
        const x = x1 * scaleX;
        const y = y1 * scaleY;

        ctx.strokeStyle = result.violation_detected ? '#ef4444' : '#22c55e';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw confidence label
        if (detection.confidence) {
          ctx.fillStyle = result.violation_detected ? '#ef4444' : '#22c55e';
          ctx.fillRect(x, y - 25, 100, 25);
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px sans-serif';
          ctx.fillText(
            `${(detection.confidence * 100).toFixed(0)}%`,
            x + 5,
            y - 7
          );
        }
      }

      // Draw keypoints and skeleton (for pose estimation models)
      if (detection.keypoints && detection.keypoints.length > 0) {
        // Draw skeleton connections
        const skeleton = [
          [16, 14], [14, 12], [17, 15], [15, 13], [12, 13],
          [6, 12], [7, 13], [6, 7], [6, 8], [7, 9],
          [8, 10], [9, 11], [2, 3], [1, 2], [1, 3],
          [2, 4], [3, 5], [4, 6], [5, 7]
        ];

        ctx.strokeStyle = result.violation_detected ? '#ef4444' : '#3b82f6';
        ctx.lineWidth = 2;

        skeleton.forEach(([i, j]) => {
          const kp1 = detection.keypoints[i - 1];
          const kp2 = detection.keypoints[j - 1];

          if (kp1 && kp2 && kp1.confidence > 0.5 && kp2.confidence > 0.5) {
            ctx.beginPath();
            ctx.moveTo(kp1.x * scaleX, kp1.y * scaleY);
            ctx.lineTo(kp2.x * scaleX, kp2.y * scaleY);
            ctx.stroke();
          }
        });

        // Draw keypoints
        detection.keypoints.forEach((kp) => {
          if (kp && kp.confidence > 0.5) {
            ctx.fillStyle = result.violation_detected ? '#ef4444' : '#3b82f6';
            ctx.beginPath();
            ctx.arc(kp.x * scaleX, kp.y * scaleY, 4, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }
    });

    // Draw violation alert
    if (result.violation_detected) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIOLATION DETECTED', canvas.width / 2, 40);
    }
  };

  // Start/stop frame processing based on active models and connection status
  useEffect(() => {
    console.log('Frame processing check:', {
      feedMode,
      connectionStatus,
      activeModelsCount: camera?.activeModels?.length,
      cameraId: camera?.id
    });

    if (feedMode === 'live' && connectionStatus === 'streaming' && camera?.activeModels?.length > 0) {
      // Start frame processing at 2 FPS (every 500ms) - model processing takes time
      console.log('✅ Starting frame processing for camera', camera?.id);
      frameProcessingRef.current = setInterval(processFrameForDetection, 500);
    } else {
      // Stop frame processing
      console.log('❌ Stopping frame processing. Reason:', {
        isLive: feedMode === 'live',
        isStreaming: connectionStatus === 'streaming',
        hasActiveModels: camera?.activeModels?.length > 0
      });

      if (frameProcessingRef.current) {
        clearInterval(frameProcessingRef.current);
        frameProcessingRef.current = null;
      }

      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    return () => {
      if (frameProcessingRef.current) {
        clearInterval(frameProcessingRef.current);
      }
    };
  }, [feedMode, connectionStatus, camera?.activeModels, camera?.id]);

  // Monitor video playback state for live streams
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || feedMode !== 'live') return;

    const handlePlaying = () => {
      console.log('✅ Video is now playing - setting status to streaming');
      setConnectionStatus('streaming');
    };

    const handlePause = () => {
      console.log('⏸️ Video paused');
    };

    const handleWaiting = () => {
      console.log('⏳ Video waiting/buffering');
    };

    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);

    return () => {
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('waiting', handleWaiting);
    };
  }, [feedMode, camera?.id]);

  // Cleanup HLS player on unmount only
  useEffect(() => {
    return () => {
      if (hlsPlayerRef.current) {
        hlsPlayerRef.current.destroy();
      }
    };
  }, []);

  // Toggle between live and historical feed
  const toggleFeedMode = async () => {
    if (feedMode === 'live') {
      // Switch to historical
      await loadHistoricalFeed();
    } else {
      // Switch to live
      stopHistoricalFeed();
      setFeedMode('live');
    }
  };

  const loadHistoricalFeed = async () => {
    try {
      setError(null);

      // Check available recording dates
      const datesResponse = await vasV2ApiService.getRecordingDates(camera.id);

      if (!datesResponse.success || !datesResponse.dates || datesResponse.dates.length === 0) {
        setError('No recordings available for this camera');
        return;
      }

      setRecordingDates(datesResponse.dates);

      // Get HLS playlist from Ruth-AI backend (which rewrites URLs to absolute)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://10.30.250.245:3005/api';
      const playlistUrl = `${apiUrl}/cameras/${camera.id}/recordings/playlist`;

      console.log('Historical feed - Playlist URL:', playlistUrl);

      // Historical playback is completely independent from live streaming
      // Do NOT stop the live stream - they can coexist
      // Historical reads from disk, live streams from camera via MediaSoup

      // Clean up existing players
      if (videojsPlayerRef.current) {
        videojsPlayerRef.current.dispose();
        videojsPlayerRef.current = null;
      }

      // Get video element
      const videoElement = document.getElementById(`video-${camera.id}`);

      if (!videoElement) {
        console.error('Video element not found');
        setError('Video element not found');
        return;
      }

      // Reset video element before Video.js initialization
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();

      console.log('Initializing Video.js player for historical feed...');

      // Initialize Video.js player
      // Video.js handles HLS.js internally and properly manages MediaSource duration
      // Initialize Video.js with HLS source
      // Video.js handles all the complexity of HLS playback and properly manages duration/seek bar
      const player = videojs(videoElement, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: false,
        responsive: true,
        html5: {
          vhs: {
            // Video.js HLS (VHS) configuration for VOD
            limitRenditionByPlayerDimensions: false,
            smoothQualityChange: true,
            overrideNative: true
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false
        }
      });

      // Set the HLS source
      player.src({
        src: playlistUrl,
        type: 'application/x-mpegURL'
      });

      // Event listeners for debugging and state management
      player.ready(() => {
        console.log('✅ Video.js player ready');
        setFeedMode('historical');
        setConnectionStatus('streaming');
      });

      player.on('loadedmetadata', () => {
        console.log('Video.js: Metadata loaded', {
          duration: player.duration(),
          videoWidth: player.videoWidth(),
          videoHeight: player.videoHeight()
        });
      });

      player.on('durationchange', () => {
        console.log('Video.js: Duration changed to:', player.duration());
      });

      player.on('error', (error) => {
        console.error('Video.js error:', player.error());
        setError(`Playback error: ${player.error()?.message || 'Unknown error'}`);
      });

      player.on('playing', () => {
        console.log('Video.js: Playing started');
      });

      // Store player reference for cleanup
      videojsPlayerRef.current = player;
    } catch (err) {
      console.error('Failed to load historical feed:', err);
      setError('Failed to load historical recordings');
    }
  };

  const stopHistoricalFeed = () => {
    // Clean up Video.js player
    if (videojsPlayerRef.current) {
      videojsPlayerRef.current.dispose();
      videojsPlayerRef.current = null;
      console.log('Video.js player disposed');
    }

    // Clean up HLS.js player (legacy, if any)
    if (hlsPlayerRef.current) {
      hlsPlayerRef.current.destroy();
      hlsPlayerRef.current = null;
    }

    const videoElement = document.getElementById(`video-${camera.id}`);
    if (videoElement) {
      videoElement.pause();
      videoElement.src = '';
    }

    setConnectionStatus('disconnected');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'streaming': return 'bg-green-500';
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (feedMode === 'historical') {
      return 'Historical';
    }
    switch (connectionStatus) {
      case 'streaming': return 'Live';
      case 'connected': return 'Connected';
      case 'disconnected': return 'Offline';
      case 'connecting': return 'Connecting';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const handleModelChange = (modelId, checked) => {
    onModelToggle(camera?.id, modelId, checked);
  };

  return (
    <div className={`relative bg-card border border-border rounded-lg ${feedMode === 'historical' ? 'overflow-visible' : 'overflow-hidden'} group`}>
      {/* Camera Feed Area */}
      <div className="relative aspect-video bg-slate-900">
        <div className={`relative w-full ${feedMode === 'historical' ? 'h-auto' : 'h-full'}`}>
          {/* Video Player (supports both WebRTC live and Video.js HLS historical) */}
          <video
            id={`video-${camera?.id}`}
            ref={videoRef}
            className={`w-full ${feedMode === 'historical' ? 'video-js vjs-default-skin h-auto' : 'h-full object-cover'}`}
            autoPlay={feedMode === 'live'}
            playsInline
            muted={feedMode === 'live'}
            controls={feedMode === 'historical'}
            controlsList="nodownload"
            preload={feedMode === 'historical' ? 'none' : 'auto'}
            style={{ backgroundColor: '#1e293b' }}
            data-setup="{}"
          />

          {/* Canvas Overlay for AI Detection Drawings */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: 'cover' }}
          />

          {/* Stream Controls */}
          <div className={`absolute ${feedMode === 'historical' ? 'top-3' : 'bottom-3'} right-3 z-10 flex gap-2`}>
            {/* Feed Mode Toggle */}
            <button
              onClick={toggleFeedMode}
              className={`px-3 py-1 rounded text-xs font-medium ${
                feedMode === 'live'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {feedMode === 'live' ? 'View Historical' : 'Back to Live'}
            </button>

            {/* Live Stream Control (only show in live mode) */}
            {feedMode === 'live' && (
              activeStreams?.has(camera?.id) ? (
                <button
                  onClick={() => onStopStream(camera?.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                >
                  Stop Stream
                </button>
              ) : (
                <button
                  onClick={() => onStartStream(camera?.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                >
                  Start Stream
                </button>
              )
            )}
          </div>

          {/* Live Feed Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Status Indicator */}
          <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'streaming' ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
              {getStatusText()}
            </span>
            {/* Feed Mode Indicator */}
            <span className={`text-xs font-medium text-white px-2 py-1 rounded ${
              feedMode === 'live' ? 'bg-green-600' : 'bg-purple-600'
            }`}>
              {feedMode === 'live' ? 'LIVE' : 'HISTORICAL'}
            </span>
          </div>

          {/* Recording Info (Historical Mode) */}
          {feedMode === 'historical' && recordingDates.length > 0 && (
            <div className="absolute top-3 right-12 z-10">
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                {recordingDates.length} day(s) available
              </span>
            </div>
          )}

          {/* Camera Name */}
          <div className="absolute bottom-10 left-3 z-10">
            <h3 className="text-sm font-semibold text-white bg-black/50 px-2 py-1 rounded">
              {camera?.name}
            </h3>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => onFullscreen(camera?.id)}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            title="Fullscreen view"
          >
            <Icon name={isFullscreen ? "Minimize2" : "Maximize2"} size={16} />
          </button>

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/75 z-20">
              <div className="text-center text-white p-4">
                <div className="text-red-400 mb-2">
                  <Icon name="AlertTriangle" size={24} />
                </div>
                <p className="text-sm mb-2">Error</p>
                <p className="text-xs opacity-75">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Violation Alert Overlay */}
          {camera?.hasActiveViolation && feedMode === 'live' && (
            <div className="absolute inset-0 border-2 border-error animate-pulse z-10">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-error text-white px-3 py-1 rounded-md text-sm font-medium">
                VIOLATION DETECTED
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Models Control Panel */}
      <div className="p-3 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            AI Models {feedMode === 'historical' && '(Live Only)'}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {camera?.activeModels?.length} active
            </span>
            {/* VAS Integration Status */}
            <div className="flex items-center space-x-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'streaming' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-xs text-muted-foreground">VAS</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {camera?.availableModels?.map((model) => (
            <div key={model?.id} className="flex items-center space-x-2">
              <Checkbox
                size="sm"
                checked={!!(camera?.activeModels?.includes(model?.id))}
                onCheckedChange={(e) => handleModelChange(model?.id, e?.target?.checked)}
                disabled={feedMode === 'historical'}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground truncate block">
                  {model?.name}
                </span>
                <span className={`text-xs ${model?.status === 'running' ? 'text-green-500' : 'text-gray-400'}`}>
                  {model?.status === 'running' ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* VAS Connection Details (Development Mode) */}
        {import.meta.env.DEV && vasStatus && feedMode === 'live' && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer">VAS Debug Info</summary>
              <div className="mt-1 space-y-1 text-muted-foreground">
                <div>API: {vasStatus.connected ? 'Connected' : 'Disconnected'}</div>
                <div>Janus: {vasStatus.janus_connected ? 'Connected' : 'Disconnected'}</div>
                <div>Last Ping: {new Date(vasStatus.last_ping).toLocaleTimeString()}</div>
                {camera?.vasDeviceId && <div>VAS ID: {camera.vasDeviceId}</div>}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default VASCameraFeed;
