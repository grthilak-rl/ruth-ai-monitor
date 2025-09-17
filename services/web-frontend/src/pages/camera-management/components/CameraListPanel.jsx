import axios from 'axios';
import Icon from '@/components/AppIcon';
import AppImage from '@/components/AppImage';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ModelBadge from '@/components/ui/ModelBadge';
import React, { useState } from 'react';

const CameraListPanel = ({
  cameras,
  selectedCamera,
  onCameraSelect,
  onCameraAdd,
  onCameraDelete,
  searchQuery,
  onSearchChange,
  fetchCameras
}) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedCameras, setSelectedCameras] = useState([]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-success';
      case 'offline': return 'text-error';
      case 'maintenance': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return 'CheckCircle';
      case 'offline': return 'XCircle';
      case 'maintenance': return 'AlertTriangle';
      default: return 'Circle';
    }
  };

  const filteredCameras = cameras?.filter(camera =>
    camera?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    camera?.location?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  const handleDragStart = (e, camera) => {
    setDraggedItem(camera);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetCamera) => {
    e?.preventDefault();
    if (draggedItem && draggedItem?.id !== targetCamera?.id) {
      // Handle reordering logic here
      console.log('Reordering cameras:', draggedItem?.id, 'to', targetCamera?.id);
    }
    setDraggedItem(null);
  };

  const handleCameraSelection = (cameraId, isSelected) => {
    if (isSelected) {
      setSelectedCameras([...selectedCameras, cameraId]);
    } else {
      setSelectedCameras(selectedCameras?.filter(id => id !== cameraId));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedCameras.map(cameraId => axios.delete(`/api/cameras/${cameraId}`)));
      fetchCameras(); // Call fetchCameras to refresh the list
      setSelectedCameras([]);
    } catch (error) {
      console.error('Error deleting cameras:', error);
      // Optionally, show an error message to the user
    }
  };

  const handleToggleCameraStatus = async (cameraId, newStatus) => {
    try {
      await axios.put(`/api/cameras/${cameraId}`, { status: newStatus });
      fetchCameras(); // Refresh the camera list after status update
    } catch (error) {
      console.error(`Failed to update camera status for ${cameraId}:`, error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Camera List</h2>
          <span className="text-sm text-muted-foreground">
            {filteredCameras?.length} cameras
          </span>
        </div>

        {/* Search */}
        <Input
          type="search"
          placeholder="Search cameras..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e?.target?.value)}
          className="mb-3"
        />

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={onCameraAdd}
            className="flex-1"
          >
            Add Camera
          </Button>
          {selectedCameras?.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              iconName="Trash2"
              onClick={handleBulkDelete}
            >
              Delete ({selectedCameras?.length})
            </Button>
          )}
        </div>
      </div>
      {/* Camera List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCameras?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Icon name="Camera" size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Cameras Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'No cameras match your search criteria.' : 'Add your first camera to get started.'}
            </p>
            {!searchQuery && (
              <Button variant="outline" iconName="Plus" onClick={onCameraAdd}>
                Add Camera
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredCameras?.map((camera) => (
              <div
                key={camera?.id}
                draggable
                onDragStart={(e) => handleDragStart(e, camera)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, camera)}
                className={`
                  relative p-3 rounded-lg border cursor-pointer transition-all duration-150
                  ${selectedCamera?.id === camera?.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                  ${draggedItem?.id === camera?.id ? 'opacity-50' : ''}
                `}
                onClick={() => onCameraSelect(camera)}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 right-2">
                  <input
                    type="checkbox"
                    checked={selectedCameras?.includes(camera?.id)}
                    onChange={(e) => {
                      e?.stopPropagation();
                      handleCameraSelection(camera?.id, e?.target?.checked);
                    }}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                  />
                </div>

                {/* Camera Info */}
                <div className="flex items-start space-x-3 pr-6">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <AppImage
                      src={camera?.thumbnail}
                      alt={`${camera?.name} preview`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {camera?.name}
                      </h3>
                      <Icon
                        name={getStatusIcon(camera?.status)}
                        size={14}
                        className={getStatusColor(camera?.status)}
                      />
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCameraStatus(camera?.id, camera?.status === 'online' ? 'offline' : 'online');
                        }}
                      >
                        {camera?.status === 'online' ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {camera?.location}
                    </p>
                    
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Icon name="Wifi" size={12} />
                        <span>{camera?.ipAddress}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Icon name="Zap" size={12} />
                        <span className={getStatusColor(camera?.status)}>
                          {camera?.status}
                        </span>
                      </span>
                    </div>

                    {/* AI Models */}
                    {camera?.aiModels && camera?.aiModels?.length > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        {camera?.aiModels?.slice(0, 3)?.map((modelId, index) => (
                          <ModelBadge 
                            key={index}
                            modelId={modelId}
                            size="sm"
                            showLabel={false}
                          />
                        ))}
                        {camera?.aiModels?.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{camera?.aiModels?.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Drag Handle */}
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="GripVertical" size={16} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraListPanel;