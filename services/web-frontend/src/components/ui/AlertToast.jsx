import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const severityStyles = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    icon: 'AlertTriangle',
    iconBg: 'bg-red-200 dark:bg-red-800'
  },
  high: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
    icon: 'AlertCircle',
    iconBg: 'bg-amber-200 dark:bg-amber-800'
  },
  medium: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-300',
    icon: 'AlertOctagon',
    iconBg: 'bg-orange-200 dark:bg-orange-800'
  },
  low: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    icon: 'Info',
    iconBg: 'bg-blue-200 dark:bg-blue-800'
  },
  info: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-800 dark:text-slate-300',
    icon: 'Bell',
    iconBg: 'bg-slate-200 dark:bg-slate-700'
  }
};

const AlertToast = ({ 
  id,
  title, 
  message, 
  severity = 'info', 
  duration = 5000, 
  onClose,
  showProgress = true,
  actionLabel,
  onAction
 }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);
  
  const style = severityStyles[severity] || severityStyles.info;
  
  useEffect(() => {
    if (!duration) return;
    
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressValue = (remaining / duration) * 100;
      
      setTimeLeft(remaining);
      setProgress(progressValue);
      
      if (remaining <= 0) {
        clearInterval(timer);
        handleClose();
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [duration]);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose && onClose(id);
    }, 300); // Allow time for exit animation
  };
  
  const handleAction = () => {
    onAction && onAction(id);
    handleClose();
  };
  
  if (!visible) return null;
  
  return (
    <div 
      className={`
        flex items-start p-4 rounded-lg shadow-md border ${style.bg} ${style.border}
        transform transition-all duration-300 ease-in-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
      role="alert"
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center mr-4`}>
        <Icon name={style.icon} size={20} className={style.text} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h3 className={`text-sm font-medium ${style.text}`}>{title}</h3>
          
          <button 
            type="button" 
            className={`ml-4 inline-flex ${style.text} hover:bg-opacity-20 hover:bg-black rounded p-1`}
            onClick={handleClose}
          >
            <Icon name="X" size={16} />
          </button>
        </div>
        
        <div className={`mt-1 text-sm ${style.text} opacity-90`}>
          {message}
        </div>
        
        {actionLabel && (
          <button
            className={`mt-2 text-sm font-medium ${style.text} hover:underline focus:outline-none`}
            onClick={handleAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
      
      {showProgress && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 overflow-hidden rounded-b-lg">
          <div 
            className={`h-full ${style.iconBg} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default AlertToast;