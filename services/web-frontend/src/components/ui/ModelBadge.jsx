import React from 'react';
import Icon from '../AppIcon';

const modelIcons = {
  ppe_detection: 'Shield',
  fall_detection: 'AlertTriangle',
  fire_smoke_detection: 'Flame',
  restricted_area: 'Ban',
  default: 'Cpu'
};

const modelColors = {
  ppe_detection: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  fall_detection: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  fire_smoke_detection: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  restricted_area: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  default: 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-300'
};

const modelNames = {
  ppe_detection: 'PPE',
  fall_detection: 'Fall',
  fire_smoke_detection: 'Fire/Smoke',
  restricted_area: 'Restricted',
  default: 'AI'
};

const ModelBadge = ({ modelId, showLabel = true, size = 'md' }) => {
  const iconName = modelIcons[modelId] || modelIcons.default;
  const colorClass = modelColors[modelId] || modelColors.default;
  const displayName = modelNames[modelId] || modelNames.default;
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 rounded',
    md: 'text-xs px-2 py-1 rounded-md',
    lg: 'text-sm px-2.5 py-1.5 rounded-md'
  };
  
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size] || sizeClasses.md} ${colorClass}`}>
      <Icon name={iconName} size={iconSizes[size] || iconSizes.md} />
      {showLabel && (
        <span className="font-medium">{displayName}</span>
      )}
    </span>
  );
};

export default ModelBadge;