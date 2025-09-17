import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const AlertNotificationBadge = ({ count = 0, onAlertClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousCount, setPreviousCount] = useState(count);

  // Animate when count changes
  useEffect(() => {
    if (count !== previousCount && count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      setPreviousCount(count);
      return () => clearTimeout(timer);
    }
  }, [count, previousCount]);

  const getSeverityColor = () => {
    if (count === 0) return 'text-muted-foreground';
    if (count <= 5) return 'text-warning';
    if (count <= 15) return 'text-error';
    return 'text-destructive';
  };

  const getSeverityBadgeColor = () => {
    if (count === 0) return 'bg-muted';
    if (count <= 5) return 'bg-warning';
    if (count <= 15) return 'bg-error';
    return 'bg-destructive animate-pulse-slow';
  };

  const handleClick = () => {
    if (onAlertClick) {
      onAlertClick(count);
    }
  };

  const formatCount = (num) => {
    if (num > 999) return '999+';
    if (num > 99) return '99+';
    return num?.toString();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`
          flex items-center justify-center w-10 h-10 rounded-md
          transition-all duration-150 ease-industrial
          hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${count > 0 ? 'hover:scale-105' : ''}
          ${isAnimating ? 'animate-pulse' : ''}
        `}
      >
        <div className="relative">
          <Icon 
            name="AlertTriangle" 
            size={20} 
            className={`${getSeverityColor()} transition-colors duration-150`}
          />
          
          {/* Alert Count Badge */}
          {count > 0 && (
            <span 
              className={`
                absolute -top-2 -right-2 flex items-center justify-center
                min-w-[18px] h-[18px] px-1 text-xs font-bold text-white rounded-full
                ${getSeverityBadgeColor()}
                ${isAnimating ? 'animate-bounce' : ''}
              `}
            >
              {formatCount(count)}
            </span>
          )}
        </div>
      </button>

      {/* Live Status Indicator */}
      {count > 0 && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3">
          <div className="w-full h-full bg-success rounded-full animate-pulse-slow" />
          <div className="absolute inset-0 w-full h-full bg-success rounded-full animate-ping opacity-75" />
        </div>
      )}
    </div>
  );
};

export default AlertNotificationBadge;