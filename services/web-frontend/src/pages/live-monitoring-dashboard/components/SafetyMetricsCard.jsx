import React from 'react';
import Icon from '@/components/AppIcon';

const SafetyMetricsCard = ({ metric, onClick }) => {
  const getTrendIcon = () => {
    switch (metric?.changeType) {
      case 'positive': return 'TrendingUp';
      case 'negative': return 'TrendingDown';
      case 'neutral': return 'Minus';
      default: return 'Minus';
    }
  };

  const getMetricColor = () => {
    if (metric?.changeType === 'positive') return 'text-success';
    if (metric?.changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getIconColor = () => {
    return metric?.color || 'text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200" onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center ${getIconColor()}`}>
          <Icon name={metric?.icon} size={20} />
        </div>
        <div className={`flex items-center space-x-1 text-sm ${getMetricColor()}`}>
          <Icon name={getTrendIcon()} size={14} />
          <span className="font-medium">
            {metric?.changeType === 'neutral' ? '0%' : `${metric?.change?.toFixed(2)}%`}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-foreground">
          {metric?.value?.toLocaleString()}
        </h3>
        <p className="text-sm font-medium text-foreground">
          {metric?.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {metric?.subtitle}
        </p>
      </div>
      {/* Progress Bar for Compliance Metrics */}
      {metric?.percentage !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Compliance Rate</span>
            <span>{metric?.percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                metric?.percentage >= 90 ? 'bg-success' :
                metric?.percentage >= 70 ? 'bg-warning' : 'bg-error'
              }`}
              style={{ width: `${metric?.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyMetricsCard;