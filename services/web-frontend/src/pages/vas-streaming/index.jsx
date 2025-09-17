import React, { useState, useEffect } from 'react';
import VASVideoPlayer from '../../components/VASVideoPlayer';
import { vasApiService } from '../../services/vasApiService';

const VASStreamingPage = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First authenticate with VAS
      const authResult = await vasApiService.authenticate('admin', 'admin123');
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`);
      }
      
      // Use our new VAS API service to get cameras
      const response = await vasApiService.getCameras();
      setCameras(response.data || []);
      
      // Select first camera by default
      if (response.data && response.data.length > 0) {
        setSelectedCamera(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to load cameras:', err);
      setError(`Failed to load cameras: ${err.message}. Please check VAS connection.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraSelect = (camera) => {
    setSelectedCamera(camera);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VAS cameras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadCameras}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            VAS WebRTC Streaming
          </h1>
          <p className="text-gray-600">
            Real-time video streaming from VAS cameras using WebRTC API Gateway
          </p>
        </div>

        {/* Camera Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Select Camera ({cameras.length} available)
          </h2>
          
          {cameras.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-xl mb-2">📹</div>
              <p className="text-gray-600">No cameras available</p>
              <p className="text-sm text-gray-500 mt-2">
                Make sure VAS is running and cameras are configured
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  onClick={() => handleCameraSelect(camera)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCamera?.id === camera.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {camera.name || `Camera ${camera.id}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {camera.id}
                      </p>
                      <p className="text-xs text-gray-400">
                        Status: {camera.status || 'Active'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video Player */}
        {selectedCamera && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Live Stream: {selectedCamera.name || `Camera ${selectedCamera.id}`}
            </h2>
            
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <VASVideoPlayer 
                camera={{
                  vasDeviceId: selectedCamera.id,
                  name: selectedCamera.name || `Camera ${selectedCamera.id}`,
                  location: selectedCamera.location || 'Unknown'
                }}
                width="100%"
                height="100%"
                autoStart={true}
                className="w-full h-full"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Camera ID:</strong> {selectedCamera.id}</p>
              <p><strong>Status:</strong> {selectedCamera.status || 'Active'}</p>
              <p><strong>Stream Type:</strong> WebRTC via VAS API Gateway</p>
            </div>
          </div>
        )}

        {/* API Status */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            API Connection Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 text-xl mb-2">✅</div>
              <p className="font-medium text-green-800">VAS Backend</p>
              <p className="text-sm text-green-600">Connected</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 text-xl mb-2">✅</div>
              <p className="font-medium text-green-800">WebRTC Gateway</p>
              <p className="text-sm text-green-600">Active</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 text-xl mb-2">✅</div>
              <p className="font-medium text-green-800">Janus Gateway</p>
              <p className="text-sm text-green-600">Streaming</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VASStreamingPage;
