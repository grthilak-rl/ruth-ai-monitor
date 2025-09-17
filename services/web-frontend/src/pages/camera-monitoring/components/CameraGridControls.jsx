import React from 'react';
import Icon from '@/components/AppIcon';
import { Button } from '@/components/ui/Button';
import Select from '@/components/ui/Select';

const CameraGridControls = ({ 
  selectedCameras, 
  onCameraSelectionChange, 
  gridSize, 
  onGridSizeChange, 
  isFullscreen, 
  onFullscreenToggle,
  availableCameras,
  onRefreshFeeds
}) => {
  const gridSizeOptions = [
    { value: '2x2', label: '2×2 Grid (4 cameras)' },
    { value: '3x3', label: '3×3 Grid (9 cameras)' },
    { value: '3x4', label: '3×4 Grid (12 cameras)' },
    { value: '4x3', label: '4×3 Grid (12 cameras)' }
  ];

  const cameraOptions = availableCameras?.map(camera => ({
    value: camera?.id,
    label: `${camera?.name} - ${camera?.location}`,
    description: camera?.status === 'ONLINE' ? 'Online' : 'Offline',
    disabled: camera?.status !== 'ONLINE'
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Left Section - Camera Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="Camera" size={20} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Camera Selection
            </span>
          </div>
          
          <div className="w-full sm:w-80">
            <Select
              placeholder="Select cameras to monitor"
              options={cameraOptions}
              value={selectedCameras}
              onChange={onCameraSelectionChange}
              multiple
              searchable
              clearable
              className="text-sm"
            />
          </div>
        </div>

        {/* Right Section - Grid Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Grid Size Selector */}
          <div className="flex items-center space-x-2">
            <Icon name="Grid3X3" size={16} className="text-muted-foreground" />
            <Select
              options={gridSizeOptions}
              value={gridSize}
              onChange={onGridSizeChange}
              className="w-40"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="RefreshCw"
              iconPosition="left"
              onClick={onRefreshFeeds}
              className="flex-shrink-0"
            >
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              iconName={isFullscreen ? "Minimize2" : "Maximize2"}
              iconPosition="left"
              onClick={onFullscreenToggle}
              className="flex-shrink-0"
            >
              {isFullscreen ? "Exit" : "Fullscreen"}
            </Button>
          </div>
        </div>
      </div>
      {/* Status Summary */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-muted-foreground">
              {availableCameras?.filter(c => c?.status === 'online')?.length} Online
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-error rounded-full" />
            <span className="text-muted-foreground">
              {availableCameras?.filter(c => c?.status === 'offline')?.length} Offline
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-warning rounded-full" />
            <span className="text-muted-foreground">
              {availableCameras?.filter(c => c?.status === 'maintenance')?.length} Maintenance
            </span>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Displaying {selectedCameras?.length} of {availableCameras?.length} cameras
        </div>
      </div>
    </div>
  );
};

export default CameraGridControls;