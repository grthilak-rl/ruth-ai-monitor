import React, { useState, useEffect } from 'react';
import vasV2ApiService from '../../services/vasV2ApiService';
import microservicesApi from '../../services/microservicesApi';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchCameras();
    fetchBookmarks();
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [selectedCamera, currentPage]);

  const fetchCameras = async () => {
    try {
      const response = await microservicesApi.cameras.getAll();
      setCameras(response.cameras || []);
    } catch (err) {
      console.error('Failed to fetch cameras:', err);
    }
  };

  const fetchBookmarks = async () => {
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

      const response = await vasV2ApiService.getBookmarks(filters);

      if (response.success) {
        setBookmarks(response.bookmarks || []);
        setTotalBookmarks(response.total || 0);
      }
    } catch (err) {
      setError('Failed to fetch bookmarks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookmarkId) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return;
    }

    try {
      await vasV2ApiService.deleteBookmark(bookmarkId);
      fetchBookmarks();
    } catch (err) {
      setError('Failed to delete bookmark');
      console.error(err);
    }
  };

  const handleEdit = (bookmark) => {
    setEditingBookmark(bookmark.id);
    setEditLabel(bookmark.label || '');
  };

  const handleSaveEdit = async (bookmarkId) => {
    try {
      await vasV2ApiService.updateBookmark(bookmarkId, editLabel);
      setEditingBookmark(null);
      setEditLabel('');
      fetchBookmarks();
    } catch (err) {
      setError('Failed to update bookmark');
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingBookmark(null);
    setEditLabel('');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration) => {
    return `${duration.toFixed(1)}s`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalPages = Math.ceil(totalBookmarks / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bookmarks</h1>
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
              onClick={fetchBookmarks}
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
            <p className="mt-4 text-gray-600">Loading bookmarks...</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No bookmarks found</p>
            <p className="text-gray-500 mt-2">
              Capture bookmarks from live or historical footage to see them here
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative" style={{ paddingTop: '56.25%' }}>
                    <img
                      src={vasV2ApiService.getBookmarkThumbnailUrl(bookmark.id)}
                      alt={bookmark.label || 'Bookmark'}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      {formatDuration(bookmark.duration)}
                    </div>
                  </div>

                  <div className="p-4">
                    {editingBookmark === bookmark.id ? (
                      <div className="mb-3">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter label"
                          autoFocus
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleSaveEdit(bookmark.id)}
                            className="flex-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-gray-900 mb-2 truncate">
                        {bookmark.label || 'Untitled Bookmark'}
                      </h3>
                    )}

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p>
                        <span className="font-medium">Camera:</span> {bookmark.device_name}
                      </p>
                      <p>
                        <span className="font-medium">Time:</span> {formatTimestamp(bookmark.center_timestamp)}
                      </p>
                      <p>
                        <span className="font-medium">Source:</span>{' '}
                        <span className="capitalize">{bookmark.source}</span>
                      </p>
                      <p>
                        <span className="font-medium">Size:</span> {formatFileSize(bookmark.file_size)}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <a
                        href={vasV2ApiService.getBookmarkVideoUrl(bookmark.id)}
                        download
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center text-sm"
                      >
                        Download
                      </a>
                      {editingBookmark !== bookmark.id && (
                        <>
                          <button
                            onClick={() => handleEdit(bookmark)}
                            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(bookmark.id)}
                            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
