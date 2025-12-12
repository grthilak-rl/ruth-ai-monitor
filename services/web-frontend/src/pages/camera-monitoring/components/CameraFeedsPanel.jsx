import React, { useState } from 'react';
import VASCameraFeed from './VASCameraFeed';
import CameraGridControls from './CameraGridControls';
import Icon from '../../../components/AppIcon';

const CameraFeedsPanel = ({ cameras, onRefresh, isFullscreen, onToggleFullscreen, onStartStream, onStopStream, activeStreams, onModelToggle }) => {
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [gridSize, setGridSize] = useState('2x2');
  const [fullscreenCamera, setFullscreenCamera] = useState(null);

  const getGridColumns = () => {
    switch (gridSize) {
      case '3x3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case '3x4': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case '4x3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2';
    }
  };

  const getMaxCameras = () => {
    switch (gridSize) {
      case '3x3': return 9;
      case '3x4': return 12;
      case '4x3': return 12;
      default: return 4;
    }
  };

  const displayedCameras = cameras?.filter(camera => selectedCameras?.includes(camera?.id))?.slice(0, getMaxCameras());

  const handleFullscreen = (cameraId) => {
    if (fullscreenCamera === cameraId) {
      setFullscreenCamera(null);
      onToggleFullscreen(false);
    } else {
      setFullscreenCamera(cameraId);
      onToggleFullscreen(true);
    }
  };

  return (
    <>
      <CameraGridControls
        selectedCameras={selectedCameras}
        onCameraSelectionChange={setSelectedCameras}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        isFullscreen={isFullscreen}
        onFullscreenToggle={onToggleFullscreen}
        availableCameras={cameras}
        onRefreshFeeds={onRefresh}
      />

      {/* Camera Grid */}
      {isFullscreen && fullscreenCamera ? (
        <div className="bg-card border border-border rounded-lg p-4">
          <VASCameraFeed
            camera={cameras?.find(c => c?.id === fullscreenCamera)}
            onModelToggle={onModelToggle}
            onFullscreen={handleFullscreen}
            isFullscreen={true}
            onStartStream={onStartStream}
            onStopStream={onStopStream}
            activeStreams={activeStreams}
          />
        </div>
      ) : (
        <div className={`grid ${getGridColumns()} gap-4 ${isFullscreen ? 'hidden' : ''}`}>
          {displayedCameras?.map((camera) => (
            <VASCameraFeed
              key={camera?.id}
              camera={camera}
              onModelToggle={onModelToggle}
              onFullscreen={handleFullscreen}
              isFullscreen={false}
              onStartStream={onStartStream}
              onStopStream={onStopStream}
              activeStreams={activeStreams}
            />
          ))}
        </div>
      )}

      {displayedCameras?.length === 0 && !isFullscreen && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Icon name="Camera" size={32} />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Cameras Selected
            </h3>
            <p className="text-sm">
              Select cameras from the dropdown above to start monitoring
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CameraFeedsPanel;