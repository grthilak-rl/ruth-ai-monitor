import React, { useState, useEffect } from 'react';

import AppImage from '@/components/AppImage';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import axios from 'axios';
import { Checkbox } from '@/components/ui/Checkbox';
import Icon from '@/components/AppIcon';

const CameraConfigPanel = ({ 
  camera, 
  onCameraUpdate, 
  onCameraDelete 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ipAddress: '',
    port: '554',
    username: '',
    password: '',
    resolution: '1920x1080',
    frameRate: '30',
    aiModels: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  const availableAIModels = [
    {
      id: 'ppe_detection',
      name: 'PPE Detection',
      description: 'Detects hard hats, safety vests, and protective equipment',
      icon: 'Shield'
    },
    {
      id: 'fall_detection',
      name: 'Fall Detection',
      description: 'Identifies worker falls and unsafe positioning',
      icon: 'AlertTriangle'
    },
    {
      id: 'fire_smoke_detection',
      name: 'Fire & Smoke Detection',
      description: 'Monitors for fire hazards and smoke presence',
      icon: 'Flame'
    },
    {
      id: 'restricted_area',
      name: 'Restricted Area Monitoring',
      description: 'Alerts when personnel enter prohibited zones',
      icon: 'Ban'
    },
    {
      id: 'vehicle_detection',
      name: 'Vehicle Safety',
      description: 'Monitors vehicle movement and pedestrian safety',
      icon: 'Truck'
    },
    {
      id: 'crowd_detection',
      name: 'Crowd Analysis',
      description: 'Analyzes crowd density and movement patterns',
      icon: 'Users'
    }
  ];

  const resolutionOptions = [
    '640x480', '1280x720', '1920x1080', '2560x1440', '3840x2160'
  ];

  const frameRateOptions = ['15', '24', '30', '60'];

  useEffect(() => {
    if (camera) {
      setFormData({
        name: camera?.name || '',
        location: camera?.location || '',
        ipAddress: camera?.ipAddress || '',
        port: camera?.port || '554',
        username: camera?.username || '',
        password: camera?.password || '',
        resolution: camera?.resolution || '1920x1080',
        frameRate: camera?.frameRate || '30',
        aiModels: camera?.aiModels || []
      });
      setIsEditing(false);
      setSaveStatus(null);
    }
  }, [camera]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsEditing(true);
  };

  const handleAIModelToggle = (modelId, checked) => {
    const updatedModels = checked
      ? [...formData?.aiModels, modelId]
      : formData?.aiModels?.filter(id => id !== modelId);
    
    handleInputChange('aiModels', updatedModels);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const updatedCamera = {
        ...camera,
        ...formData,
        lastModified: new Date()?.toISOString()
      };
      
      await axios.put(`/api/cameras/${camera.id}`, updatedCamera);
      onCameraUpdate(updatedCamera);
      setIsEditing(false);
      setSaveStatus('success');
      
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving camera:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await axios.post('/api/cameras/test-connection', {
        ipAddress: formData.ipAddress,
        port: formData.port,
        username: formData.username,
        password: formData.password,
      });
      
      setTestResult({
        success: response.data.success,
        latency: response.data.latency,
        resolution: response.data.resolution,
        message: response.data.message,
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete camera "${camera?.name}"? This action cannot be undone.`)) {
      onCameraDelete(camera.id);
    }
  };

  if (!camera) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Icon name="Camera" size={64} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Camera Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a camera from the list to view and edit its configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
              <AppImage
                src={camera?.thumbnail}
                alt={`${camera?.name} preview`}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{camera?.name}</h2>
              <p className="text-sm text-muted-foreground">{camera?.location}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {saveStatus && (
              <div className={`flex items-center space-x-1 text-sm ${
                saveStatus === 'success' ? 'text-success' : 
                saveStatus === 'error' ? 'text-error' : 'text-muted-foreground'
              }`}>
                <Icon 
                  name={saveStatus === 'success' ? 'CheckCircle' : 
                        saveStatus === 'error' ? 'XCircle' : 'Loader2'} 
                  size={16}
                  className={saveStatus === 'saving' ? 'animate-spin' : ''}
                />
                <span>
                  {saveStatus === 'success' ? 'Saved' : 
                   saveStatus === 'error' ? 'Error' : 'Saving...'}
                </span>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              iconName="Trash2"
              onClick={handleDelete}
            >
              Delete
            </Button>
            
            <Button
              variant="default"
              size="sm"
              iconName="Save"
              onClick={handleSave}
              disabled={!isEditing || saveStatus === 'saving'}
              loading={saveStatus === 'saving'}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Live Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Live Preview</h3>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <AppImage
                src={camera?.livePreview || camera?.thumbnail}
                alt={`${camera?.name} live feed`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-black/50 rounded text-white text-xs">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span>LIVE</span>
                    </div>
                    <span className="px-2 py-1 bg-black/50 rounded text-white text-xs">
                      {formData?.resolution} @ {formData?.frameRate}fps
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 bg-black/50 rounded text-white hover:bg-black/70 transition-colors">
                      <Icon name="Maximize" size={16} />
                    </button>
                    <button className="p-2 bg-black/50 rounded text-white hover:bg-black/70 transition-colors">
                      <Icon name="Camera" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Camera Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Camera Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Camera Name"
                type="text"
                value={formData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                placeholder="Enter camera name"
                required
              />
              
              <Input
                label="Location"
                type="text"
                value={formData?.location}
                onChange={(e) => handleInputChange('location', e?.target?.value)}
                placeholder="Enter camera location"
                required
              />
              
              <Input
                label="IP Address"
                type="text"
                value={formData?.ipAddress}
                onChange={(e) => handleInputChange('ipAddress', e?.target?.value)}
                placeholder="192.168.1.100"
                required
              />
              
              <Input
                label="Port"
                type="number"
                value={formData?.port}
                onChange={(e) => handleInputChange('port', e?.target?.value)}
                placeholder="554"
              />
              
              <Input
                label="Username"
                type="text"
                value={formData?.username}
                onChange={(e) => handleInputChange('username', e?.target?.value)}
                placeholder="Camera username"
              />
              
              <Input
                label="Password"
                type="password"
                value={formData?.password}
                onChange={(e) => handleInputChange('password', e?.target?.value)}
                placeholder="Camera password"
              />
            </div>
          </div>

          {/* Video Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Video Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resolution
                </label>
                <select
                  value={formData?.resolution}
                  onChange={(e) => handleInputChange('resolution', e?.target?.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {resolutionOptions?.map(resolution => (
                    <option key={resolution} value={resolution}>
                      {resolution}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Frame Rate (fps)
                </label>
                <select
                  value={formData?.frameRate}
                  onChange={(e) => handleInputChange('frameRate', e?.target?.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {frameRateOptions?.map(rate => (
                    <option key={rate} value={rate}>
                      {rate} fps
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Connection Test */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Connection Test</h3>
              <Button
                variant="outline"
                size="sm"
                iconName="Wifi"
                onClick={handleTestConnection}
                loading={isTesting}
                disabled={!formData?.ipAddress}
              >
                Test Connection
              </Button>
            </div>
            
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult?.success 
                  ? 'border-success/20 bg-success/5' :'border-error/20 bg-error/5'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon 
                    name={testResult?.success ? 'CheckCircle' : 'XCircle'} 
                    size={16}
                    className={testResult?.success ? 'text-success' : 'text-error'}
                  />
                  <span className={`text-sm font-medium ${
                    testResult?.success ? 'text-success' : 'text-error'
                  }`}>
                    {testResult?.message}
                  </span>
                </div>
                
                {testResult?.success && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Latency: {testResult?.latency}ms</div>
                    <div>Resolution: {testResult?.resolution}</div>
                    <div>Status: Connected</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Model Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">AI Detection Models</h3>
            <p className="text-sm text-muted-foreground">
              Select the AI models to enable for this camera. Multiple models can run simultaneously.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableAIModels?.map((model) => (
                <div key={model?.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={formData?.aiModels?.includes(model?.id)}
                      onCheckedChange={(checked) => handleAIModelToggle(model?.id, checked)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon name={model?.icon} size={16} className="text-primary" />
                        <h4 className="text-sm font-medium text-foreground">
                          {model?.name}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {model?.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraConfigPanel;