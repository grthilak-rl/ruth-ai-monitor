import React, { useState } from 'react';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';

const CameraActionToolbar = ({ 
  cameras, 
  onBulkOperation, 
  onRefresh, 
  onExport 
}) => {
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  const getHealthStats = () => {
    const online = cameras?.filter(c => c?.status === 'online')?.length;
    const offline = cameras?.filter(c => c?.status === 'offline')?.length;
    const maintenance = cameras?.filter(c => c?.status === 'maintenance')?.length;
    
    return { online, offline, maintenance, total: cameras?.length };
  };

  const stats = getHealthStats();

  const bulkOperations = [
    {
      id: 'enable_all',
      label: 'Enable All Cameras',
      icon: 'Play',
      description: 'Start monitoring on all cameras'
    },
    {
      id: 'disable_all',
      label: 'Disable All Cameras',
      icon: 'Pause',
      description: 'Stop monitoring on all cameras'
    },
    {
      id: 'restart_all',
      label: 'Restart All Cameras',
      icon: 'RotateCcw',
      description: 'Restart all camera connections'
    },

    {
      id: 'export_config',
      label: 'Export Configuration',
      icon: 'FileDown',
      description: 'Download camera configuration backup'
    }
  ];

  const handleBulkOperation = (operationId) => {
    setBulkMenuOpen(false);
    onBulkOperation(operationId);
  };

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        {/* Left: Health Status Summary */}
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-semibold text-foreground">Camera Management</h1>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-muted-foreground">Online:</span>
              <span className="font-medium text-success">{stats?.online}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-error rounded-full" />
              <span className="text-muted-foreground">Offline:</span>
              <span className="font-medium text-error">{stats?.offline}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-warning rounded-full" />
              <span className="text-muted-foreground">Maintenance:</span>
              <span className="font-medium text-warning">{stats?.maintenance}</span>
            </div>
            
            <div className="h-4 w-px bg-border" />
            
            <div className="flex items-center space-x-1">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium text-foreground">{stats?.total}</span>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            onClick={onRefresh}
          >
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            onClick={onExport}
          >
            Export
          </Button>
          
          {/* Bulk Operations Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              iconName="MoreVertical"
              onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
            >
              Bulk Actions
            </Button>
            
            {bulkMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-md shadow-lg z-50">
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                    Bulk Operations
                  </div>
                  
                  {bulkOperations?.map((operation) => (
                    <button
                      key={operation?.id}
                      onClick={() => handleBulkOperation(operation?.id)}
                      className="w-full flex items-start space-x-3 px-3 py-2 text-left hover:bg-muted transition-colors duration-150"
                    >
                      <Icon name={operation?.icon} size={16} className="text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-popover-foreground">
                          {operation?.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {operation?.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Health Status Bar */}
      <div className="mt-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm text-muted-foreground">System Health:</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-success" 
                style={{ width: `${(stats?.online / stats?.total) * 100}%` }}
              />
              <div 
                className="bg-warning" 
                style={{ width: `${(stats?.maintenance / stats?.total) * 100}%` }}
              />
              <div 
                className="bg-error" 
                style={{ width: `${(stats?.offline / stats?.total) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground">
            {Math.round((stats?.online / stats?.total) * 100)}%
          </span>
        </div>
      </div>
      {/* Click outside handler */}
      {bulkMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setBulkMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default CameraActionToolbar;