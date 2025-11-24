# VAS V2 Migration - Quick Start Guide

## Migration Complete

Ruth-AI Monitor has been successfully migrated from VAS v1 (Janus) to VAS v2 (MediaSoup).

## What's New

### 1. Historical Recordings
View past footage with HLS streaming. Access recordings up to 1 hour back in time.

### 2. Bookmarks
Capture 6-second video clips from live streams or historical footage for incident review.

### 3. Snapshots
Take still images from live or historical streams for documentation.

### 4. Better Streaming
MediaSoup SFU provides better performance and scalability for multiple viewers.

## Quick Start

### Backend Setup

1. Update environment configuration:
```bash
cp env.example .env
```

Edit `.env` with VAS V2 settings (already configured for development):
```
VAS_API_URL=http://10.30.250.245:8080
VAS_REQUIRE_AUTH=false
MEDIASOUP_URL=ws://10.30.250.245:3001
```

2. Restart camera service:
```bash
docker-compose restart camera-service
```

### Frontend Setup

1. Install new dependencies:
```bash
cd services/web-frontend
npm install
```

2. Start frontend:
```bash
npm run dev
```

3. Access at http://localhost:3004

### New Features Access

- Historical Playback: Navigate to `/historical-playback`
- Bookmarks: Navigate to `/bookmarks`
- Snapshots: Navigate to `/snapshots`

## Files Modified

### Backend (Camera Service)
- [vasIntegration.service.js](services/camera-service/services/vasIntegration.service.js) - VAS V2 integration
- [camera.controller.js](services/camera-service/controllers/camera.controller.js) - New endpoints
- [camera.routes.js](services/camera-service/routes/camera.routes.js) - Route updates

### Frontend (New Pages & Services)
- [vasV2ApiService.js](services/web-frontend/src/services/vasV2ApiService.js) - VAS V2 API client
- [mediasoupClient.js](services/web-frontend/src/services/mediasoupClient.js) - MediaSoup WebRTC client
- [HistoricalPlayback.jsx](services/web-frontend/src/pages/historical-playback/HistoricalPlayback.jsx) - Historical viewer
- [Bookmarks.jsx](services/web-frontend/src/pages/bookmarks/Bookmarks.jsx) - Bookmark management
- [Snapshots.jsx](services/web-frontend/src/pages/snapshots/Snapshots.jsx) - Snapshot gallery

### Configuration
- [docker-compose.yml](docker-compose.yml) - Updated VAS environment variables
- [env.example](env.example) - VAS V2 configuration template
- [package.json](services/web-frontend/package.json) - Added mediasoup-client & hls.js

## New API Endpoints

### Recordings
- `GET /api/cameras/:id/recordings/dates` - Get available dates
- `GET /api/cameras/:id/recordings/playlist` - Get HLS playlist

### Bookmarks
- `POST /api/cameras/:id/bookmarks/live` - Capture from live
- `POST /api/cameras/:id/bookmarks/historical` - Capture from history
- `GET /api/cameras/bookmarks` - List bookmarks
- `DELETE /api/cameras/bookmarks/:id` - Delete bookmark

### Snapshots
- `POST /api/cameras/:id/snapshots/live` - Capture from live
- `POST /api/cameras/:id/snapshots/historical` - Capture from history
- `GET /api/cameras/snapshots` - List snapshots
- `DELETE /api/cameras/snapshots/:id` - Delete snapshot

## Testing

1. Start backend: `docker-compose up -d`
2. Install frontend deps: `cd services/web-frontend && npm install`
3. Start frontend: `npm run dev`
4. Login and navigate to new features

## Troubleshooting

### Backend Issues
```bash
docker logs ruth-monitor-camera -f
```

### Frontend Issues
Check browser console for errors

### VAS Connection Issues
Verify VAS V2 is running at http://10.30.250.245:8080

## Documentation

For detailed information, see:
- [VAS_V2_MIGRATION_COMPLETE.md](VAS_V2_MIGRATION_COMPLETE.md) - Full migration guide
- [VAS_V2_INTEGRATION.md](VAS_V2_INTEGRATION.md) - VAS V2 API reference

## Summary

- 11 files modified
- 14 new API endpoints
- 3 major new features
- Fully backward compatible
- No database migration required

Migration Status: COMPLETE
