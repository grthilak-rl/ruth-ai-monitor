import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import Select from "@/components/ui/Select";
import { Label } from '@radix-ui/react-label';
import Icon from '@/components/AppIcon';



const AddCameraModal = ({ isOpen, onClose, onCameraAdd }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const resolutionOptions = [
    '640x480', '1280x720', '1920x1080', '2560x1440', '3840x2160'
  ];

  const frameRateOptions = ['15', '24', '30', '60'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData?.name?.trim()) newErrors.name = 'Camera name is required';
      if (!formData?.location?.trim()) newErrors.location = 'Location is required';
      if (!formData?.ipAddress?.trim()) {
        newErrors.ipAddress = 'IP address is required';
      } else if (!/^(\d{1,3}\.){3}\d{1,3}$/?.test(formData?.ipAddress)) {
        newErrors.ipAddress = 'Invalid IP address format';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/cameras', formData);
      onCameraAdd(response.data);
      handleClose();
    } catch (error) {
      console.error('Error adding camera:', error);
      setErrors(prev => ({ ...prev, api: error.response?.data?.message || 'Failed to add camera.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      location: '',
      ipAddress: '',
      port: '554',
      username: '',
      password: '',
      resolution: '1920x1080',
      frameRate: '30',
    });
    setErrors({});
    setCurrentStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Modal */}
      <div className="relative w-full sm:max-w-lg md:max-w-2xl mx-auto bg-card border border-border rounded-lg shadow-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="Camera" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Add New Camera</h2>
              <p className="text-sm text-muted-foreground">
                Configure a new camera for safety monitoring
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-border"></div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Basic Info</span>
            </div>
            
            <div className="flex-1 h-px bg-border" />
            
            <div className={`flex items-center space-x-2 ${
              currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Review & Save</span>
            </div>
          </div>

        {/* Content */} 
        <div className="p-6 overflow-y-auto flex-1">
          {currentStep === 1 && (
            <div className="space-y-4">
              {errors.api && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline"> {errors.api}</span>
                </div>
              )}
              <div>
                <Label htmlFor="name">Camera Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Entrance Camera"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Warehouse A, Section 3"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="mt-1"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>
              <div>
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  placeholder="e.g., 192.168.1.100"
                  value={formData.ipAddress}
                  onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                  className="mt-1"
                />
                {errors.ipAddress && <p className="text-red-500 text-xs mt-1">{errors.ipAddress}</p>}
              </div>
              <div>
                <Label htmlFor="port">Port (RTSP)</Label>
                <Input
                  id="port"
                  placeholder="e.g., 554"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="username">Username (Optional)</Label>
                <Input
                  id="username"
                  placeholder="Camera username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Camera password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="mt-1"
                />
              </div>
              <h3 className="text-lg font-semibold text-foreground mt-6">Video Stream Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select
                    value={formData.resolution}
                    onValueChange={(value) => handleInputChange('resolution', value)}
                    options={resolutionOptions.map(res => ({ label: res, value: res }))}
                    placeholder="Select resolution"
                  />
                </div>
                <div>
                  <Label htmlFor="frameRate">Frame Rate (FPS)</Label>
                  <Select
                    value={formData.frameRate}
                    onValueChange={(value) => handleInputChange('frameRate', value)}
                    options={frameRateOptions.map(rate => ({ label: rate, value: rate }))}
                    placeholder="Select frame rate"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Review Camera Details</h3>
              <p className="text-sm text-muted-foreground">Please review the details before adding the camera.</p>
              <div className="space-y-2">
                <p><span className="font-medium">Camera Name:</span> {formData.name}</p>
                <p><span className="font-medium">Location:</span> {formData.location}</p>
                <p><span className="font-medium">IP Address:</span> {formData.ipAddress}</p>
                <p><span className="font-medium">Port:</span> {formData.port}</p>
                {formData.username && <p><span className="font-medium">Username:</span> {formData.username}</p>}
                <p><span className="font-medium">Resolution:</span> {formData.resolution}</p>
                <p><span className="font-medium">Frame Rate:</span> {formData.frameRate} FPS</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */} 
        <div className="flex justify-between p-6 border-t border-border">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          <div className="flex-grow" />
          {currentStep < 2 && (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
          {currentStep === 2 && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Adding Camera...' : 'Add Camera'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCameraModal;
