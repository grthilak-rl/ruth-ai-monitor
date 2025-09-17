import React, { useState, useEffect } from 'react';
import Icon from '@/components/AppIcon';
import AppImage from '@/components/AppImage';
import { Checkbox } from '@/components/ui/Checkbox';

const CameraFeed = ({ camera, onModelToggle, onFullscreen, isFullscreen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(camera?.status || 'disconnected');

  useEffect(() => {
    if (camera?.feedUrl) {
      setIsLoading(false);
      setConnectionStatus(camera?.status || 'connected');
    } else {
      setIsLoading(false);
      setConnectionStatus('disconnected');
    }
  }, [camera]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-success';
      case 'disconnected': return 'bg-error';
      case 'connecting': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live';
      case 'disconnected': return 'Offline';
      case 'connecting': return 'Connecting';
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
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-300">Loading Feed...</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {camera?.feedUrl ? (
              <video
                src={camera?.feedUrl}
                alt={`${camera?.name} live feed`}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <span className="text-sm text-slate-300">No Feed Available</span>
              </div>
            )}
            
            {/* Live Feed Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            
            {/* Status Indicator */}
            <div className="absolute top-3 left-3 flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
                {getStatusText()}
              </span>
            </div>

            {/* Camera Name */}
            <div className="absolute bottom-3 left-3">
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
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Fullscreen view"
            >
              <Icon name={isFullscreen ? "Minimize2" : "Maximize2"} size={16} />
            </button>

            {/* Violation Alert Overlay */}
            {camera?.hasActiveViolation && (
              <div className="absolute inset-0 border-2 border-error animate-pulse">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-error text-white px-3 py-1 rounded-md text-sm font-medium">
                  VIOLATION DETECTED
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* AI Models Control Panel */}
      <div className="p-3 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            AI Models
          </span>
          <span className="text-xs text-muted-foreground">
            {camera?.activeModels?.length} active
          </span>
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
      </div>
    </div>
  );
};

export default CameraFeed;