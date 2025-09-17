import React from 'react';
import Icon from '@/components/AppIcon';
import SafetyMetricsCard from './SafetyMetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const SafetyMetricsPanel = ({ metrics, onMetricClick }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="BarChart3" size={20} className="text-accent" />
        <h2 className="text-lg font-semibold text-foreground">
          Live Safety Metrics
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          Today
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(metrics)?.map((metric) => (
          <SafetyMetricsCard 
            key={metric?.id} 
            metric={metric} 
            onClick={metric?.id === 'unacknowledgedAlerts' ? () => onMetricClick(metric?.id) : undefined}
          />
        ))}
      </div>
      {/* Quick Summary */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-muted-foreground">System Status: Operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Clock" size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">
                Updated: {new Date()?.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="text-muted-foreground">
            Monitoring {metrics?.find(m => m?.type === 'cameras')?.value || 0} cameras
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyMetricsPanel;