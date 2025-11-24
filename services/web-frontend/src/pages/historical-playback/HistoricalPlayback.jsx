import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import vasV2ApiService from '../../services/vasV2ApiService';
import microservicesApi from '../../services/microservicesApi';

const HistoricalPlayback = () => {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [recordingDates, setRecordingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    fetchCameras();
  }, []);

  useEffect(() => {
    if (selectedCamera) {
      fetchRecordingDates();
    }
  }, [selectedCamera]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const response = await microservicesApi.cameras.getAll();
      setCameras(response.cameras || []);
    } catch (err) {
      setError('Failed to fetch cameras');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordingDates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vasV2ApiService.getRecordingDates(selectedCamera.id);

      if (response.success && response.dates) {
        setRecordingDates(response.dates);
        if (response.dates.length > 0) {
          setSelectedDate(response.dates[0].date);
        }
      }
    } catch (err) {
      setError('Failed to fetch recording dates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await vasV2ApiService.getRecordingPlaylist(selectedCamera.id);

      if (!response.success || !response.playlist_url) {
        throw new Error('Failed to get playlist URL');
      }

      const vasUrl = import.meta.env.VITE_VAS_URL || 'http://10.30.250.245:8080';
      const playlistUrl = `${vasUrl}${response.playlist_url}`;

      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        hlsRef.current = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
        });

        hlsRef.current.loadSource(playlistUrl);
        hlsRef.current.attachMedia(videoRef.current);

        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed');
          setPlaying(true);
        });

        hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Network error occurred');
                hlsRef.current.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Media error occurred');
                hlsRef.current.recoverMediaError();
                break;
              default:
                setError('Fatal error occurred');
                hlsRef.current.destroy();
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = playlistUrl;
        setPlaying(true);
      } else {
        setError('HLS is not supported in this browser');
      }
    } catch (err) {
      setError(err.message || 'Failed to load playlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stopPlayback = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setPlaying(false);
  };

  const captureSnapshot = async () => {
    if (!selectedCamera || !videoRef.current) return;

    try {
      const currentTime = videoRef.current.currentTime;
      const timestamp = new Date(Date.now() - (videoRef.current.duration - currentTime) * 1000).toISOString();

      const response = await vasV2ApiService.captureSnapshotHistorical(selectedCamera.id, timestamp);

      if (response.success) {
        alert('Snapshot captured successfully!');
      }
    } catch (err) {
      setError('Failed to capture snapshot');
      console.error(err);
    }
  };

  const captureBookmark = async () => {
    if (!selectedCamera || !videoRef.current) return;

    try {
      const currentTime = videoRef.current.currentTime;
      const timestamp = new Date(Date.now() - (videoRef.current.duration - currentTime) * 1000).toISOString();

      const label = prompt('Enter bookmark label:');
      if (!label) return;

      const response = await vasV2ApiService.captureBookmarkHistorical(
        selectedCamera.id,
        timestamp,
        label
      );

      if (response.success) {
        alert('Bookmark captured successfully!');
      }
    } catch (err) {
      setError('Failed to capture bookmark');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Historical Playback</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Select Camera</h2>
            <div className="space-y-2">
              {cameras.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setSelectedCamera(camera)}
                  className={`w-full text-left px-4 py-2 rounded transition-colors ${
                    selectedCamera?.id === camera.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {camera.name}
                </button>
              ))}
            </div>

            {selectedCamera && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Recording Dates</h2>
                {loading && <p className="text-gray-600">Loading...</p>}
                {recordingDates.length === 0 && !loading && (
                  <p className="text-gray-600">No recordings available</p>
                )}
                <div className="space-y-2">
                  {recordingDates.map((date) => (
                    <button
                      key={date.date}
                      onClick={() => setSelectedDate(date.date)}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${
                        selectedDate === date.date
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-medium">{date.formatted}</div>
                      <div className="text-sm opacity-75">
                        {date.segments_count} segments
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selectedCamera ? selectedCamera.name : 'Select a camera'}
              </h2>
              <div className="space-x-2">
                {!playing ? (
                  <button
                    onClick={loadPlaylist}
                    disabled={!selectedCamera || !selectedDate || loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Load Recording
                  </button>
                ) : (
                  <>
                    <button
                      onClick={captureSnapshot}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Capture Snapshot
                    </button>
                    <button
                      onClick={captureBookmark}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      Create Bookmark
                    </button>
                    <button
                      onClick={stopPlayback}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
                style={{ maxHeight: '70vh' }}
              >
                Your browser does not support the video element.
              </video>
            </div>

            {!selectedCamera && (
              <div className="text-center text-gray-500 mt-8">
                Select a camera from the left panel to view historical recordings
              </div>
            )}

            {selectedCamera && recordingDates.length === 0 && !loading && (
              <div className="text-center text-gray-500 mt-8">
                No recordings available for this camera
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalPlayback;
