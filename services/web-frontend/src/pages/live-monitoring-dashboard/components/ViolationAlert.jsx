import React from 'react';
import Icon from '@/components/AppIcon';
import AppImage from '@/components/AppImage';

const ViolationAlert = ({ violation, onClick }) => {
  const getSeverityColor = () => {
    switch (violation?.severity) {
      case 'critical': return 'border-l-destructive bg-destructive/5';
      case 'high': return 'border-l-error bg-error/5';
      case 'medium': return 'border-l-warning bg-warning/5';
      case 'low': return 'border-l-accent bg-accent/5';
      default: return 'border-l-muted bg-muted/5';
    }
  };

  const getSeverityIcon = () => {
    switch (violation?.severity) {
      case 'critical': return 'AlertTriangle';
      case 'high': return 'AlertCircle';
      case 'medium': return 'AlertTriangle';
      case 'low': return 'Info';
      default: return 'Bell';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - alertTime) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div 
      className={`border-l-4 ${getSeverityColor()} p-3 rounded-r-md cursor-pointer hover:bg-opacity-80 transition-all duration-150`}
      onClick={() => onClick(violation)}
    >
      <div className="flex items-start space-x-3">
        {/* Violation Thumbnail */}
        <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted">
          <AppImage
            src={violation?.thumbnail}
            alt={`${violation?.type} violation`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Violation Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Icon 
              name={getSeverityIcon()} 
              size={14} 
              className={`${violation?.severity === 'critical' ? 'text-destructive' : 
                         violation?.severity === 'high' ? 'text-error' :
                         violation?.severity === 'medium' ? 'text-warning' : 'text-accent'}`}
            />
            <span className="text-sm font-semibold text-foreground truncate">
              {violation?.type}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {violation?.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icon name="Camera" size={12} />
              <span className="truncate">{violation?.cameraName}</span>
            </div>
            <span className="flex-shrink-0">{formatTimeAgo(violation?.timestamp)}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex-shrink-0">
          {violation?.status === 'acknowledged' ? (
            <Icon name="CheckCircle" size={16} className="text-success" />
          ) : (
            <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationAlert;