import React, { useState, useEffect } from 'react';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';
import ViolationAlert from './ViolationAlert';

const ViolationAlertsPanel = ({ violations, onViolationClick, onAcknowledgeAll, onFilterChange }) => {
  const [filter, setFilter] = useState('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const filterOptions = [
    { value: 'all', label: 'All Alerts', count: violations?.length },
    { value: 'critical', label: 'Critical', count: violations?.filter(v => v?.severity === 'critical')?.length },
    { value: 'unacknowledged', label: 'Unacknowledged', count: violations?.filter(v => v?.status !== 'acknowledged')?.length },
    { value: 'recent', label: 'Last Hour', count: violations?.filter(v => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return new Date(v.timestamp) > hourAgo;
    })?.length }
  ];

  const filteredViolations = violations?.filter(violation => {
    switch (filter) {
      case 'critical':
        return violation?.severity === 'critical';
      case 'unacknowledged':
        return violation?.status !== 'acknowledged';
      case 'recent':
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return new Date(violation.timestamp) > hourAgo;
      default:
        return true;
    }
  });

  const unacknowledgedCount = violations?.filter(v => v?.status !== 'acknowledged')?.length;

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
  }, [filter, onFilterChange]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  return (
    <div className="bg-card border border-border rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-error" />
            <h2 className="text-lg font-semibold text-foreground">
              Safety Alerts
            </h2>
            {unacknowledgedCount > 0 && (
              <span className="bg-error text-white text-xs font-bold px-2 py-1 rounded-full">
                {unacknowledgedCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150 ${
                isAutoRefresh 
                  ? 'bg-success text-white' :'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              title={`Auto-refresh ${isAutoRefresh ? 'enabled' : 'disabled'}`}
            >
              <Icon name="RefreshCw" size={14} className={isAutoRefresh ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1">
          {filterOptions?.map((option) => (
            <button
              key={option?.value}
              onClick={() => handleFilterChange(option?.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                filter === option?.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {option?.label}
              {option?.count > 0 && (
                <span className="ml-1 opacity-75">({option?.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        {unacknowledgedCount > 0 && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              iconName="CheckCircle"
              iconPosition="left"
              onClick={onAcknowledgeAll}
              fullWidth
            >
              Acknowledge All ({unacknowledgedCount})
            </Button>
          </div>
        )}
      </div>
      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredViolations?.length > 0 ? (
          <div className="p-2 space-y-2">
            {filteredViolations?.map((violation) => (
              <ViolationAlert
                key={violation?.id}
                violation={violation}
                onClick={onViolationClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Icon name="Shield" size={48} className="text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-1">
                {filter === 'all' ? 'No Active Alerts' : `No ${filterOptions?.find(f => f?.value === filter)?.label} Alerts`}
              </h3>
              <p className="text-xs text-muted-foreground">
                {filter === 'all' ?'All systems are operating safely' :'Try adjusting your filter criteria'
                }
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Footer Stats */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {filteredViolations?.length} of {violations?.length} alerts
          </span>
          <span>
            Last updated: {new Date()?.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ViolationAlertsPanel;