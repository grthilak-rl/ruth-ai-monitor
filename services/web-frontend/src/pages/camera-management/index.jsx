import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import { Button } from '../../components/ui/Button';
import CameraListPanel from './components/CameraListPanel';
import CameraConfigPanel from './components/CameraConfigPanel';
import CameraActionToolbar from './components/CameraActionToolbar';
import AddCameraModal from './components/AddCameraModal';
import axios from 'axios';

import { useAuth } from '../../contexts/AuthContext';

const CameraManagement = () => {
  const { user } = useAuth();

  const mockBreadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Camera Management', path: '/camera-management' },
  ];
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [alertCount] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);




  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await axios.get('/cameras/');
      // Transform camera data to use camelCase for frontend components
      const transformedCameras = (response.data.cameras || []).map(camera => ({
        ...camera,
        vasDeviceId: camera.vas_device_id,
        janusStreamId: camera.janus_stream_id,
        installationDate: camera.installation_date,
        lastMaintenance: camera.last_maintenance,
        isActive: camera.is_active
      }));
      setCameras(transformedCameras);
      if (transformedCameras && transformedCameras.length > 0 && !selectedCamera) {
        setSelectedCamera(transformedCameras[0]);
      }
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
      setError('Failed to load cameras. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedCamera]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleCameraSelect = (camera) => {
    setSelectedCamera(camera);
  };

  const handleCameraAdd = async (newCamera) => {
    try {
      await axios.post('/api/cameras', newCamera);
      setIsAddModalOpen(false);
      fetchCameras();
    } catch (err) {
      console.error('Failed to add camera:', err);
      setError('Failed to add camera. Please check the input and try again.');
    }
  };

  const handleCameraUpdate = async (updatedCamera) => {
    try {
      await axios.put(`/api/cameras/${updatedCamera.id}`, updatedCamera);
      fetchCameras();
    } catch (err) {
      console.error('Failed to update camera:', err);
      setError('Failed to update camera. Please try again.');
    }
  };

  const handleCameraDelete = async (cameraId) => {
    try {
      await axios.delete(`/api/cameras/${cameraId}`);
      fetchCameras();
    } catch (err) {
      console.error('Failed to delete camera:', err);
      setError('Failed to delete camera. Please try again.');
    }
  };

  const handleBulkOperation = (operationId) => {
    console.log('Bulk operation:', operationId);
    // Handle bulk operations like enable_all, disable_all, etc.
    switch (operationId) {
      case 'enable_all':
        (async () => {
          try {
            await axios.post('/api/cameras/bulk-update-status', { status: 'online' });
            fetchCameras();
          } catch (err) {
            console.error('Failed to enable all cameras:', err);
            setError('Failed to enable all cameras. Please try again.');
          }
        })();
        break;
      case 'disable_all':
        (async () => {
          try {
            await axios.post('/api/cameras/bulk-update-status', { status: 'offline' });
            fetchCameras();
          } catch (err) {
            console.error('Failed to disable all cameras:', err);
            setError('Failed to disable all cameras. Please try again.');
          }
        })();
        break;
      case 'restart_all':
        (async () => {
          try {
            await axios.post('/api/cameras/bulk-update-status', { status: 'maintenance' });
            fetchCameras();
          } catch (err) {
            console.error('Failed to restart all cameras:', err);
            setError('Failed to restart all cameras. Please try again.');
          }
        })();
        break;
      case 'export_config':
        // Simulate config export
        const config = JSON.stringify(cameras, null, 2);
        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `camera-config-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
        a?.click();
        URL.revokeObjectURL(url);
        break;
      default:
        break;
    }
  };

  const handleRefresh = () => {
    // Simulate refresh
    console.log('Refreshing camera data...');
  };

  const handleExport = () => {
    // Simulate export
    console.log('Exporting camera data...');
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Camera Management - Industrial Safety Monitor</title>
        <meta name="description" content="Configure camera infrastructure and assign AI detection models for industrial safety monitoring" />
      </Helmet>

      <NavigationHeader 
        user={user}
        alertCount={alertCount} 
        onNavigate={() => {}}
      />
      
      <div className="pt-[60px]">
        <div className="p-6">
          <BreadcrumbNavigation 
            paths={mockBreadcrumbs}
          />
          
          <div className="space-y-6">
            <CameraActionToolbar
              cameras={cameras}
              onBulkOperation={handleBulkOperation}
              onRefresh={handleRefresh}
              onExport={handleExport}
            />
            <Link to="/camera-monitoring">
              <Button variant="default" className="w-full mt-4">
                Go to Live Camera Monitoring
              </Button>
            </Link>

            <div className="flex h-[calc(100vh-200px)] bg-card rounded-lg border border-border overflow-hidden">
              {/* Left Panel - Camera List */}
              <div className="w-full md:w-[30%] border-r border-border">
                {loading && <p>Loading cameras...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!loading && !error && (
            <CameraListPanel
              cameras={cameras}
              selectedCamera={selectedCamera}
              onCameraSelect={handleCameraSelect}
              onCameraAdd={() => setIsAddModalOpen(true)}
              onCameraDelete={handleCameraDelete}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              fetchCameras={fetchCameras}
            />
          )}
              </div>

              {/* Right Panel - Camera Configuration */}
              <div className="hidden md:block w-[70%]">
                {!loading && !error && (
            <CameraConfigPanel
              camera={selectedCamera}
              onCameraUpdate={handleCameraUpdate}
              onCameraDelete={handleCameraDelete}
            />
          )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCameraAdd={handleCameraAdd}
      />
    </div>
  );
};

export default CameraManagement;