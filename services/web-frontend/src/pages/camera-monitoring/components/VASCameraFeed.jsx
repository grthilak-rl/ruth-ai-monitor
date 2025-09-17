import React, { useState, useEffect } from 'react';
import Icon from '@/components/AppIcon';
import { Checkbox } from '@/components/ui/Checkbox';
import VASVideoPlayer from '../../../components/VASVideoPlayer';

const VASCameraFeed = ({ camera, onModelToggle, onFullscreen, isFullscreen, onStartStream, onStopStream, activeStreams }) => {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [vasStatus, setVasStatus] = useState(null);
  const [error, setError] = useState(null);

  // Handle VAS connection status changes
  const handleVASStatusChange = (status) => {
    setVasStatus(status);
    setConnectionStatus(status);
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
    <div className="relative bg-card border border-border rounded-lg overflow-hidden group">
      {/* Camera Feed Area */}
      <div className="relative aspect-video bg-slate-900">
        <div className="relative w-full h-full">
          {/* VAS WebRTC Video Player */}
          <video
            id={`video-${camera?.id}`}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
            style={{ backgroundColor: '#1e293b' }}
          />
          
          {/* WebRTC Controls */}
          <div className="absolute bottom-3 right-3 z-10">
            {activeStreams?.has(camera?.id) ? (
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
            )}
          </div>
          
          {/* Live Feed Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
          
          {/* Status Indicator */}
          <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
              {getStatusText()}
            </span>
            {/* VAS Connection Indicator */}
            {vasStatus && (
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                VAS: {vasStatus.janus_connected ? 'WebRTC' : vasStatus.connected ? 'API' : 'Offline'}
              </span>
            )}
          </div>

          {/* Camera Name */}
          <div className="absolute bottom-3 left-3 z-10">
            <h3 className="text-sm font-semibold text-white bg-black/50 px-2 py-1 rounded">
              {camera?.name}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {camera?.location}
            </p>
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
                <p className="text-sm mb-2">Connection Error</p>
                <p className="text-xs opacity-75">{error}</p>
              </div>
            </div>
          )}

          {/* Violation Alert Overlay */}
          {camera?.hasActiveViolation && (
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
            AI Models
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {camera?.activeModels?.length} active
            </span>
            {/* VAS Integration Status */}
            <div className="flex items-center space-x-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
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
                checked={camera?.activeModels?.includes(model?.id)}
                onChange={(e) => handleModelChange(model?.id, e?.target?.checked)}
                disabled={connectionStatus !== 'connected'}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground truncate block">
                  {model?.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {model?.accuracy}% acc
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* VAS Connection Details (Development Mode) */}
        {import.meta.env.DEV && vasStatus && (
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


