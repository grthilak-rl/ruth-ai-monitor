import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

const vasV2Api = axios.create({
  baseURL: `${API_BASE_URL}/cameras`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

vasV2Api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

vasV2Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const vasV2ApiService = {
  startStream: async (cameraId) => {
    const response = await vasV2Api.post(`/${cameraId}/start-stream`);
    return response.data;
  },

  stopStream: async (cameraId) => {
    const response = await vasV2Api.post(`/${cameraId}/stop-stream`);
    return response.data;
  },

  getStreamStatus: async (cameraId) => {
    const response = await vasV2Api.get(`/${cameraId}/stream-status`);
    return response.data;
  },

  getRecordingDates: async (cameraId) => {
    const response = await vasV2Api.get(`/${cameraId}/recordings/dates`);
    return response.data;
  },

  getRecordingPlaylist: async (cameraId) => {
    const response = await vasV2Api.get(`/${cameraId}/recordings/playlist`);
    return response.data;
  },

  captureSnapshotLive: async (cameraId) => {
    const response = await vasV2Api.post(`/${cameraId}/snapshots/live`);
    return response.data;
  },

  captureSnapshotHistorical: async (cameraId, timestamp) => {
    const response = await vasV2Api.post(`/${cameraId}/snapshots/historical`, {
      timestamp,
    });
    return response.data;
  },

  getSnapshots: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.deviceId) params.append('device_id', filters.deviceId);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const response = await vasV2Api.get(`/snapshots?${params.toString()}`);
    return response.data;
  },

  getSnapshot: async (snapshotId) => {
    const response = await vasV2Api.get(`/snapshots/${snapshotId}`);
    return response.data;
  },

  deleteSnapshot: async (snapshotId) => {
    const response = await vasV2Api.delete(`/snapshots/${snapshotId}`);
    return response.data;
  },

  getSnapshotImageUrl: (snapshotId) => {
    const vasUrl = import.meta.env.VITE_VAS_URL || 'http://10.30.250.245:8080';
    return `${vasUrl}/api/v1/snapshots/${snapshotId}/image`;
  },

  captureBookmarkLive: async (cameraId, label) => {
    const response = await vasV2Api.post(`/${cameraId}/bookmarks/live`, {
      label,
    });
    return response.data;
  },

  captureBookmarkHistorical: async (cameraId, centerTimestamp, label) => {
    const response = await vasV2Api.post(`/${cameraId}/bookmarks/historical`, {
      center_timestamp: centerTimestamp,
      label,
    });
    return response.data;
  },

  getBookmarks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.deviceId) params.append('device_id', filters.deviceId);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const response = await vasV2Api.get(`/bookmarks?${params.toString()}`);
    return response.data;
  },

  getBookmark: async (bookmarkId) => {
    const response = await vasV2Api.get(`/bookmarks/${bookmarkId}`);
    return response.data;
  },

  updateBookmark: async (bookmarkId, label) => {
    const response = await vasV2Api.put(`/bookmarks/${bookmarkId}`, {
      label,
    });
    return response.data;
  },

  deleteBookmark: async (bookmarkId) => {
    const response = await vasV2Api.delete(`/bookmarks/${bookmarkId}`);
    return response.data;
  },

  getBookmarkVideoUrl: (bookmarkId) => {
    const vasUrl = import.meta.env.VITE_VAS_URL || 'http://10.30.250.245:8080';
    return `${vasUrl}/api/v1/bookmarks/${bookmarkId}/video`;
  },

  getBookmarkThumbnailUrl: (bookmarkId) => {
    const vasUrl = import.meta.env.VITE_VAS_URL || 'http://10.30.250.245:8080';
    return `${vasUrl}/api/v1/bookmarks/${bookmarkId}/thumbnail`;
  },

  getVASHealth: async () => {
    const response = await vasV2Api.get('/vas-health');
    return response.data;
  },
};

export default vasV2ApiService;
