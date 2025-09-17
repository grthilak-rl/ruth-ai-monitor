import React from 'react';
import Icon from '@/components/AppIcon';

const MetricsCard = ({ title, value, change, changeType, icon, description, loading = false }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return 'TrendingUp';
    if (changeType === 'negative') return 'TrendingDown';
    return 'Minus';
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-8 w-8 bg-muted rounded"></div>
          </div>
          <div className="h-8 bg-muted rounded w-16 mb-2"></div>
          <div className="h-3 bg-muted rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name={icon} size={20} className="text-primary" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        
        {change && (
          <div className="flex items-center space-x-1">
            <Icon name={getChangeIcon()} size={14} className={getChangeColor()} />
            <span className={`text-sm font-medium ${getChangeColor()}`}>
              {Math.abs(change)}%
            </span>
            <span className="text-sm text-muted-foreground">vs last month</span>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;