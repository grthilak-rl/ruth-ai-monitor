import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Icon from '../../components/AppIcon';

const CameraManagement = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vasHealth, setVasHealth] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [camerasResponse, vasHealthResponse] = await Promise.all([
          axios.get('/api/cameras'),
          axios.get('/api/cameras/vas-health').catch(() => ({ data: { vasBackend: false } }))
        ]);
        
        setCameras(camerasResponse.data);
        setVasHealth(vasHealthResponse.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSyncWithVAS = async () => {
    setSyncing(true);
    try {
      const response = await axios.post('/api/cameras/sync-vas');
      alert(`Sync completed: ${response.data.syncedCount} linked, ${response.data.createdCount} created`);
      
      // Refresh cameras list
      const camerasResponse = await axios.get('/api/cameras');
      setCameras(camerasResponse.data);
    } catch (err) {
      alert('Failed to sync with VAS: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const getVASStatusBadge = (camera) => {
    if (camera.vasDeviceId) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Icon name="CheckCircle" size={12} className="mr-1" />
          VAS Synced
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Icon name="AlertCircle" size={12} className="mr-1" />
        Not Synced
      </span>
    );
  };

  if (loading) return <div className="text-center mt-8">Loading cameras...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Camera Management</h1>
        
        {/* VAS Health Status */}
        {vasHealth && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">VAS Status:</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              vasHealth.vasBackend && vasHealth.janusGateway 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <Icon 
                name={vasHealth.vasBackend && vasHealth.janusGateway ? "CheckCircle" : "XCircle"} 
                size={12} 
                className="mr-1" 
              />
              {vasHealth.vasBackend && vasHealth.janusGateway ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        )}
      </div>
      
      <div className="mb-4 flex space-x-4">
        <Link
          to="/camera-management/add"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Icon name="Plus" size={16} className="mr-2" />
          Add New Camera
        </Link>
        
        <button
          onClick={handleSyncWithVAS}
          disabled={syncing}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <Icon name={syncing ? "Loader2" : "RefreshCw"} size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync with VAS'}
        </button>
      </div>
      {cameras.length === 0 ? (
        <p>No cameras found. Add a new camera to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((camera) => (
            <div key={camera.id} className="bg-white shadow-md rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold">{camera.name}</h2>
                {getVASStatusBadge(camera)}
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <Icon name="MapPin" size={14} className="inline mr-1" />
                  Location: {camera.location}
                </p>
                
                <p className="text-gray-600">
                  <Icon name="Activity" size={14} className="inline mr-1" />
                  Status: <span className={`font-medium ${
                    camera.status === 'online' ? 'text-green-600' : 
                    camera.status === 'offline' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>{camera.status}</span>
                </p>
                
                {camera.feedUrl && (
                  <p className="text-gray-600">
                    <Icon name="Video" size={14} className="inline mr-1" />
                    Feed URL: <a href={camera.feedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{camera.feedUrl}</a>
                  </p>
                )}
                
                {camera.vasDeviceId && (
                  <p className="text-gray-600">
                    <Icon name="Link" size={14} className="inline mr-1" />
                    VAS ID: <span className="font-mono text-xs">{camera.vasDeviceId}</span>
                  </p>
                )}
                
                {camera.janusStreamId && (
                  <p className="text-gray-600">
                    <Icon name="Play" size={14} className="inline mr-1" />
                    Stream ID: <span className="font-mono text-xs">{camera.janusStreamId}</span>
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Link
                    to={`/camera-management/edit/${camera.id}`}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Icon name="Edit" size={12} className="mr-1" />
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this camera?')) {
                        // Handle delete
                      }
                    }}
                    className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                  >
                    <Icon name="Trash2" size={12} className="mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CameraManagement;