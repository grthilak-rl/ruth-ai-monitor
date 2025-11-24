import React, { useState, useEffect } from 'react';
import vasV2ApiService from '../../services/vasV2ApiService';
import microservicesApi from '../../services/microservicesApi';

const Snapshots = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  useEffect(() => {
    fetchCameras();
    fetchSnapshots();
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [selectedCamera, currentPage]);

  const fetchCameras = async () => {
    try {
      const response = await microservicesApi.cameras.getAll();
      setCameras(response.cameras || []);
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
    }
  };

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        limit: pageSize,
        skip: (currentPage - 1) * pageSize,
      };

      if (selectedCamera) {
        filters.deviceId = selectedCamera.vas_device_id;
      }

      const response = await vasV2ApiService.getSnapshots(filters);

      if (response.success) {
        setSnapshots(response.snapshots || []);
      }
    } catch (err) {
      setError('Failed to fetch snapshots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (snapshotId) => {
    if (!confirm('Are you sure you want to delete this snapshot?')) {
      return;
    }

    try {
      await vasV2ApiService.deleteSnapshot(snapshotId);
      if (selectedSnapshot?.id === snapshotId) {
        setSelectedSnapshot(null);
      }
      fetchSnapshots();
    } catch (err) {
      setError('Failed to delete snapshot');
      console.error(err);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSnapshotClick = async (snapshot) => {
    try {
      const response = await vasV2ApiService.getSnapshot(snapshot.id);
      if (response.success) {
        setSelectedSnapshot(response.snapshot);
      }
    } catch (err) {
      setError('Failed to fetch snapshot details');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Snapshots</h1>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCamera?.id || ''}
              onChange={(e) => {
                const camera = cameras.find((c) => c.id === parseInt(e.target.value));
                setSelectedCamera(camera || null);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cameras</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.name}
                </option>
              ))}
            </select>
            <button
              onClick={fetchSnapshots}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading snapshots...</p>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No snapshots found</p>
            <p className="text-gray-500 mt-2">
              Capture snapshots from live or historical footage to see them here
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSnapshotClick(snapshot)}
                >
                  <div className="relative" style={{ paddingTop: '75%' }}>
                    <img
                      src={vasV2ApiService.getSnapshotImageUrl(snapshot.id)}
                      alt="Snapshot"
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          snapshot.source === 'live'
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {snapshot.source}
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-600 truncate">
                      {new Date(snapshot.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">Page {currentPage}</span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={snapshots.length < pageSize}
                className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {selectedSnapshot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Snapshot Details</h2>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <img
                src={vasV2ApiService.getSnapshotImageUrl(selectedSnapshot.id)}
                alt="Snapshot"
                className="w-full rounded-lg mb-4"
              />

              <div className="space-y-2 text-gray-700 mb-4">
                <p>
                  <span className="font-medium">ID:</span> {selectedSnapshot.id}
                </p>
                <p>
                  <span className="font-medium">Device ID:</span> {selectedSnapshot.device_id}
                </p>
                <p>
                  <span className="font-medium">Timestamp:</span>{' '}
                  {formatTimestamp(selectedSnapshot.timestamp)}
                </p>
                <p>
                  <span className="font-medium">Source:</span>{' '}
                  <span className="capitalize">{selectedSnapshot.source}</span>
                </p>
                <p>
                  <span className="font-medium">File Size:</span>{' '}
                  {formatFileSize(selectedSnapshot.file_size)}
                </p>
              </div>

              <div className="flex space-x-3">
                <a
                  href={vasV2ApiService.getSnapshotImageUrl(selectedSnapshot.id)}
                  download
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(selectedSnapshot.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Snapshots;
