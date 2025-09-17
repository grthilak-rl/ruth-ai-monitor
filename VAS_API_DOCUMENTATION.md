# Video Aggregation Service (VAS) - Complete API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [WebRTC Integration](#webrtc-integration)
6. [Client Libraries](#client-libraries)
7. [Error Handling](#error-handling)
8. [Integration Examples](#integration-examples)
9. [Security](#security)
10. [Deployment](#deployment)

## Overview

The Video Aggregation Service (VAS) is a comprehensive video management platform that provides REST APIs and WebRTC streaming capabilities for managing IP cameras, RTSP devices, and live video streams. VAS is designed for seamless integration with third-party applications like Ruth-AI, monitoring systems, and custom video analytics platforms.

### Key Features
- **Device Discovery**: Automatic detection of RTSP-capable devices on networks
- **Stream Management**: Start/stop video streams with WebRTC delivery
- **Real-time Monitoring**: Live device health and stream status
- **Authentication**: JWT-based secure access control
- **Client Libraries**: Ready-to-use JavaScript libraries for integration
- **Scalable Architecture**: Built with FastAPI and Janus Gateway

### Base URLs
- **Development**: `http://localhost:8000`
- **Production**: `http://10.30.250.245:8000`
- **WebRTC Gateway**: `ws://10.30.250.245:8188`

## Architecture

```
┌─────────────────────────────────────────┐    ┌──────────────────────────────────────┐
│            VAS Service                  │    │        External Applications         │
│                                         │    │                                      │
│  ┌─────────────────────────────────────┐│    │  ┌─────────────────────────────────┐ │
│  │       FastAPI Backend               ││◄───┤  │        REST Client              │ │
│  │      (Port 8000)                    ││    │  │     (HTTP/HTTPS)                │ │
│  └─────────────────────────────────────┘│    │  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐│    │  ┌─────────────────────────────────┐ │
│  │      Janus Gateway                  ││◄───┤  │      WebRTC Client              │ │
│  │      (Port 8188)                    ││    │  │   (vas-webrtc-client.js)        │ │
│  └─────────────────────────────────────┘│    │  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐│    │                                      │
│  │      PostgreSQL                     ││    │                                      │
│  │      (Device Data)                  ││    │                                      │
│  └─────────────────────────────────────┘│    │                                      │
└─────────────────────────────────────────┘    └──────────────────────────────────────┘
```

## Authentication

VAS uses JWT (JSON Web Tokens) for secure API access. All API endpoints (except login and health) require authentication.

### Login Endpoint

**POST** `/api/auth/login-json`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "username": "admin",
    "role": "admin",
    "full_name": "Administrator"
  }
}
```

**Usage:**
Include the token in all subsequent requests:
```
Authorization: Bearer <access_token>
```

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

## API Endpoints

### Health & Status

#### Service Health Check
**GET** `/api/health`

Check the overall health of VAS and its dependencies.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "ffprobe": "available"
}
```

#### Janus Gateway Health
**GET** `/api/streams/janus/health`

Check Janus WebRTC Gateway health status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "janus_healthy": true,
  "status": "healthy"
}
```

### Device Management

#### List Devices
**GET** `/api/devices/`

Retrieve a paginated list of all registered devices.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `skip` (int, default: 0): Number of records to skip
- `limit` (int, default: 100, max: 1000): Number of records to return
- `status_filter` (string): Filter by device status (`ONLINE`, `OFFLINE`, `UNREACHABLE`)
- `vendor_filter` (string): Filter by vendor name

**Example Request:**
```
GET /api/devices/?skip=0&limit=20&status_filter=ONLINE
```

**Response:**
```json
{
  "devices": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Front Door Camera",
      "device_type": "ip_camera",
      "manufacturer": "Hikvision",
      "model": "DS-2CD2385G1-I",
      "ip_address": "192.168.1.100",
      "port": 554,
      "rtsp_url": "rtsp://admin:password@192.168.1.100:554/h264Preview_01_main",
      "username": "admin",
      "location": "Front Entrance",
      "description": "Main entrance security camera",
      "tags": ["security", "entrance"],
      "metadata": {
        "resolution": "1920x1080",
        "night_vision": true,
        "ptz": false
      },
      "hostname": "camera-01.local",
      "vendor": "Hikvision",
      "resolution": "1920x1080",
      "codec": "h264",
      "fps": 25,
      "last_seen": "2023-12-01T10:00:00Z",
      "status": "ONLINE",
      "credentials_secure": true,
      "created_at": "2023-12-01T09:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}
```

#### Get Device Details
**GET** `/api/devices/{device_id}`

Retrieve detailed information about a specific device.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `device_id` (string): UUID of the device

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Front Door Camera",
  "device_type": "ip_camera",
  "manufacturer": "Hikvision",
  "model": "DS-2CD2385G1-I",
  "ip_address": "192.168.1.100",
  "port": 554,
  "rtsp_url": "rtsp://admin:password@192.168.1.100:554/h264Preview_01_main",
  "username": "admin",
  "location": "Front Entrance",
  "description": "Main entrance security camera",
  "tags": ["security", "entrance"],
  "metadata": {
    "resolution": "1920x1080",
    "night_vision": true
  },
  "status": "ONLINE",
  "created_at": "2023-12-01T09:00:00Z",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

#### Create Device
**POST** `/api/devices/`

Register a new device manually.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New IP Camera",
  "device_type": "ip_camera",
  "manufacturer": "Hikvision",
  "model": "DS-2CD2142FWD-I",
  "ip_address": "192.168.1.101",
  "port": 554,
  "rtsp_url": "rtsp://admin:password123@192.168.1.101:554/Streaming/Channels/101",
  "username": "admin",
  "password": "password123",
  "location": "Back Door",
  "description": "Rear entrance security camera",
  "tags": ["security", "rear"],
  "metadata": {
    "resolution": "1080p",
    "night_vision": true,
    "ptz": false
  }
}
```

**Response:** Same as Get Device Details response with the newly created device.

#### Update Device
**PATCH** `/api/devices/{device_id}`

Update device metadata and configuration.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `device_id` (string): UUID of the device

**Request Body:** (Only include fields to update)
```json
{
  "location": "Updated Location",
  "description": "Updated description",
  "tags": ["updated", "tag"]
}
```

**Response:** Updated device object.

#### Delete Device
**DELETE** `/api/devices/{device_id}`

Remove a device from the system.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `device_id` (string): UUID of the device

**Response:**
```json
{
  "message": "Device deleted successfully"
}
```

#### Validate Device RTSP Stream
**POST** `/api/devices/validate`

Test and validate an RTSP stream before adding a device.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ip_address": "192.168.1.100",
  "username": "admin",
  "password": "password123",
  "rtsp_url": "rtsp://admin:password123@192.168.1.100:554/stream1"
}
```

**Response:**
```json
{
  "ip_address": "192.168.1.100",
  "is_valid": true,
  "rtsp_url": "rtsp://admin:password123@192.168.1.100:554/h264Preview_01_main",
  "resolution": "1920x1080",
  "codec": "h264",
  "fps": 25,
  "error_message": null
}
```

#### Get Device Status
**GET** `/api/devices/{device_id}/status`

Check the current health and connectivity status of a device.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `device_id` (string): UUID of the device

**Response:**
```json
{
  "device_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "ONLINE",
  "error": null,
  "last_checked": "2023-12-01T10:00:00Z"
}
```

### Stream Management

#### List All Streams
**GET** `/api/streams/`

Get all available streams with their WebRTC connection information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Front Door Camera",
    "device_type": "ip_camera",
    "manufacturer": "Hikvision",
    "model": "DS-2CD2385G1-I",
    "ip_address": "192.168.1.100",
    "port": 554,
    "rtsp_url": "rtsp://admin:password@192.168.1.100:554/h264Preview_01_main",
    "location": "Front Entrance",
    "status": "ACTIVE",
    "mountpoint_info": {
      "id": 1,
      "description": "Front Door Camera Stream",
      "streaming": true,
      "enabled": true
    },
    "webrtc_url": "ws://10.30.250.245:8188"
  }
]
```

#### Start Stream
**POST** `/api/streams/{device_id}/start`

Activate streaming for a specific device.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `device_id` (string): UUID of the device

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Front Door Camera",
  "status": "ACTIVE",
  "mountpoint_info": {
    "id": 1,
    "description": "Front Door Camera Stream",
    "streaming": true
  },
  "webrtc_url": "ws://10.30.250.245:8188"
}
```

#### Stop Stream
**POST** `/api/streams/{device_id}/stop`

Deactivate streaming for a specific device.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `device_id` (string): UUID of the device

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Front Door Camera",
  "status": "INACTIVE",
  "mountpoint_info": null
}
```

#### Get Stream Status
**GET** `/api/streams/{device_id}/status`

Check the current streaming status of a device.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `device_id` (string): UUID of the device

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Front Door Camera",
  "status": "ACTIVE",
  "mountpoint_info": {
    "id": 1,
    "description": "Front Door Camera Stream",
    "streaming": true
  },
  "webrtc_url": "ws://10.30.250.245:8188"
}
```

#### List Janus Mountpoints
**GET** `/api/streams/janus/mountpoints`

Get all Janus Gateway mountpoints (for debugging and monitoring).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "mountpoints": [
    {
      "id": 1,
      "description": "Front Door Camera Stream",
      "streaming": true,
      "enabled": true,
      "media": [
        {
          "type": "video",
          "codec": "h264",
          "pt": 96
        }
      ]
    }
  ]
}
```

### Device Discovery

#### Start Network Discovery
**POST** `/api/discover/`

Initiate automatic discovery of RTSP devices on specified network ranges.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "network_range": "192.168.1.0/24",
  "scan_ports": [554, 80, 443],
  "timeout": 30
}
```

**Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Discovery started",
  "network_range": "192.168.1.0/24",
  "estimated_duration": 45
}
```

#### Get Discovery Task Status
**GET** `/api/discover/{task_id}`

Check the progress and results of a discovery task.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `task_id` (string): UUID of the discovery task

**Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "network_range": "192.168.1.0/24",
  "results": [
    {
      "ip_address": "192.168.1.100",
      "hostname": "camera-01.local",
      "vendor": "Hikvision",
      "rtsp_url": "rtsp://192.168.1.100:554/h264Preview_01_main",
      "rtsp_ports": [554],
      "discovered_at": "2023-12-01T10:00:00Z"
    }
  ]
}
```

#### List Discovery Tasks
**GET** `/api/discover/`

Get all discovery tasks and their status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "progress": 100,
    "network_range": "192.168.1.0/24",
    "created_at": "2023-12-01T09:30:00Z"
  }
]
```

## WebRTC Integration

VAS provides real-time video streaming through Janus Gateway using WebRTC protocol. This enables low-latency, high-quality video streaming directly to web browsers and applications.

### WebRTC Connection Flow

1. **Authenticate** with VAS API to get JWT token
2. **Get device list** and select cameras to stream
3. **Start stream** for specific devices via API
4. **Connect WebRTC client** to Janus Gateway
5. **Receive video stream** in HTML video element

### Janus Gateway Endpoints

- **WebSocket URL**: `ws://10.30.250.245:8188`
- **HTTP URL**: `http://10.30.250.245:8088`
- **Admin API**: `ws://10.30.250.245:7188/admin`

### Stream Mountpoints

Each device gets a unique mountpoint ID in Janus Gateway:
- **Mountpoint 1**: Device ID `550e8400-e29b-41d4-a716-446655440001`
- **Mountpoint 2**: Device ID `550e8400-e29b-41d4-a716-446655440002`
- And so on...

## Client Libraries

VAS provides ready-to-use JavaScript libraries for seamless integration with external applications.

### VAS WebRTC Client Library

**File**: `vas-webrtc-client.js`
**Location**: Available at `http://10.30.250.245:8000/static/js/vas-webrtc-client.js`

#### Core Class: VASWebRTCClient

```javascript
class VASWebRTCClient {
  constructor(vasServerUrl, authToken = null)
  
  // Authentication
  async initialize()
  async authenticate(username, password)
  
  // Camera Management
  async getAllCameras()
  async getCameraById(deviceId)
  
  // Streaming
  async connectToCamera(deviceId, videoElement)
  async disconnectCamera(deviceId)
  async disconnectAll()
  
  // Events
  onConnectionStateChange(callback)
  onError(callback)
}
```

#### Basic Usage Example

```javascript
// Initialize client
const vasClient = new VASWebRTCClient('http://10.30.250.245:8000');

// Authenticate
await vasClient.initialize();
await vasClient.authenticate('admin', 'admin123');

// Get available cameras
const cameras = await vasClient.getAllCameras();
console.log('Available cameras:', cameras);

// Connect to first camera
const videoElement = document.getElementById('video');
await vasClient.connectToCamera(cameras[0].id, videoElement);

// Handle events
vasClient.onConnectionStateChange((deviceId, state) => {
  console.log(`Camera ${deviceId} state: ${state}`);
});

vasClient.onError((error) => {
  console.error('VAS WebRTC Error:', error);
});
```

### Required Dependencies

Include these scripts before using VAS WebRTC Client:

```html
<!-- WebRTC Adapter for cross-browser compatibility -->
<script src="http://10.30.250.245:8000/static/js/adapter.js"></script>

<!-- Janus Gateway JavaScript library -->
<script src="http://10.30.250.245:8000/static/js/janus.js"></script>

<!-- VAS WebRTC Client -->
<script src="http://10.30.250.245:8000/static/js/vas-webrtc-client.js"></script>
```

### Complete Integration Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>VAS Integration Example</title>
</head>
<body>
    <div id="cameras-container"></div>
    
    <!-- Required Scripts -->
    <script src="http://10.30.250.245:8000/static/js/adapter.js"></script>
    <script src="http://10.30.250.245:8000/static/js/janus.js"></script>
    <script src="http://10.30.250.245:8000/static/js/vas-webrtc-client.js"></script>
    
    <script>
        async function initializeVAS() {
            const vasClient = new VASWebRTCClient('http://10.30.250.245:8000');
            
            try {
                // Initialize and authenticate
                await vasClient.initialize();
                await vasClient.authenticate('admin', 'admin123');
                
                // Get cameras
                const cameras = await vasClient.getAllCameras();
                
                // Create video elements and connect
                cameras.forEach(async (camera, index) => {
                    const videoElement = document.createElement('video');
                    videoElement.id = `video-${camera.id}`;
                    videoElement.width = 640;
                    videoElement.height = 480;
                    videoElement.autoplay = true;
                    videoElement.controls = true;
                    
                    const container = document.getElementById('cameras-container');
                    const cameraDiv = document.createElement('div');
                    cameraDiv.innerHTML = `<h3>${camera.name}</h3>`;
                    cameraDiv.appendChild(videoElement);
                    container.appendChild(cameraDiv);
                    
                    // Connect to camera
                    await vasClient.connectToCamera(camera.id, videoElement);
                });
                
            } catch (error) {
                console.error('VAS initialization failed:', error);
            }
        }
        
        // Initialize when page loads
        window.addEventListener('load', initializeVAS);
    </script>
</body>
</html>
```

## Error Handling

VAS provides consistent error responses across all endpoints.

### Standard Error Response Format

```json
{
  "error": "Error message",
  "detail": "Additional error details",
  "timestamp": "2023-12-01T10:00:00Z",
  "path": "/api/devices"
}
```

### HTTP Status Codes

| Code | Status | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Authentication required or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `422` | Validation Error | Request validation failed |
| `500` | Internal Server Error | Server error |
| `503` | Service Unavailable | Service temporarily unavailable |

### Common Error Scenarios

#### Authentication Errors
```json
{
  "error": "Incorrect username or password",
  "detail": "Authentication failed",
  "timestamp": "2023-12-01T10:00:00Z",
  "path": "/api/auth/login-json"
}
```

#### Validation Errors
```json
{
  "error": "Validation Error",
  "detail": [
    {
      "loc": ["body", "ip_address"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ],
  "timestamp": "2023-12-01T10:00:00Z",
  "path": "/api/devices/"
}
```

#### Device Not Found
```json
{
  "error": "Device not found",
  "timestamp": "2023-12-01T10:00:00Z",
  "path": "/api/devices/invalid-id"
}
```

## Integration Examples

### Python Integration Example

```python
import requests
import json

class VASClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
    
    def authenticate(self, username, password):
        """Authenticate and store JWT token"""
        response = self.session.post(
            f"{self.base_url}/api/auth/login-json",
            json={"username": username, "password": password}
        )
        response.raise_for_status()
        
        data = response.json()
        self.token = data["access_token"]
        self.session.headers.update({
            "Authorization": f"Bearer {self.token}"
        })
        return data["user"]
    
    def get_devices(self, status_filter=None, limit=100):
        """Get list of devices"""
        params = {"limit": limit}
        if status_filter:
            params["status_filter"] = status_filter
        
        response = self.session.get(
            f"{self.base_url}/api/devices/",
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def create_device(self, device_data):
        """Create a new device"""
        response = self.session.post(
            f"{self.base_url}/api/devices/",
            json=device_data
        )
        response.raise_for_status()
        return response.json()
    
    def start_stream(self, device_id):
        """Start streaming for a device"""
        response = self.session.post(
            f"{self.base_url}/api/streams/{device_id}/start"
        )
        response.raise_for_status()
        return response.json()
    
    def get_stream_status(self, device_id):
        """Get stream status"""
        response = self.session.get(
            f"{self.base_url}/api/streams/{device_id}/status"
        )
        response.raise_for_status()
        return response.json()

# Usage Example
vas_client = VASClient("http://10.30.250.245:8000")

# Authenticate
user = vas_client.authenticate("admin", "admin123")
print(f"Authenticated as: {user['username']}")

# Get devices
devices_response = vas_client.get_devices(status_filter="ONLINE")
devices = devices_response["devices"]
print(f"Found {len(devices)} online devices")

# Start streaming for first device
if devices:
    device = devices[0]
    stream_info = vas_client.start_stream(device["id"])
    print(f"Started stream for {device['name']}: {stream_info['webrtc_url']}")
```

### Node.js Integration Example

```javascript
const axios = require('axios');

class VASClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Add request interceptor for auth token
        this.client.interceptors.request.use(config => {
            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            return config;
        });
    }
    
    async authenticate(username, password) {
        try {
            const response = await this.client.post('/api/auth/login-json', {
                username,
                password
            });
            
            this.token = response.data.access_token;
            return response.data.user;
        } catch (error) {
            throw new Error(`Authentication failed: ${error.response?.data?.error || error.message}`);
        }
    }
    
    async getDevices(options = {}) {
        try {
            const response = await this.client.get('/api/devices/', {
                params: options
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get devices: ${error.response?.data?.error || error.message}`);
        }
    }
    
    async createDevice(deviceData) {
        try {
            const response = await this.client.post('/api/devices/', deviceData);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create device: ${error.response?.data?.error || error.message}`);
        }
    }
    
    async startStream(deviceId) {
        try {
            const response = await this.client.post(`/api/streams/${deviceId}/start`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to start stream: ${error.response?.data?.error || error.message}`);
        }
    }
    
    async getHealth() {
        try {
            const response = await this.client.get('/api/health');
            return response.data;
        } catch (error) {
            throw new Error(`Health check failed: ${error.response?.data?.error || error.message}`);
        }
    }
}

// Usage Example
async function main() {
    const vasClient = new VASClient('http://10.30.250.245:8000');
    
    try {
        // Check service health
        const health = await vasClient.getHealth();
        console.log('VAS Health:', health);
        
        // Authenticate
        const user = await vasClient.authenticate('admin', 'admin123');
        console.log(`Authenticated as: ${user.username}`);
        
        // Get devices
        const devicesResponse = await vasClient.getDevices({
            status_filter: 'ONLINE',
            limit: 10
        });
        console.log(`Found ${devicesResponse.devices.length} devices`);
        
        // Start streams for all online devices
        for (const device of devicesResponse.devices) {
            try {
                const streamInfo = await vasClient.startStream(device.id);
                console.log(`Started stream for ${device.name}: ${streamInfo.status}`);
            } catch (error) {
                console.error(`Failed to start stream for ${device.name}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('VAS integration error:', error.message);
    }
}

main();
```

### Ruth-AI Integration Pattern

For Ruth-AI specifically, the integration should follow this pattern:

```javascript
// ruth-ai/packages/web-app/src/services/vasApiService.js
class VASApiService {
    constructor() {
        this.baseURL = process.env.VAS_API_URL || 'http://10.30.250.245:8000';
        // ... existing implementation
    }
    
    // Use existing methods but ensure they align with VAS API spec
    async getDevices() {
        const response = await this.client.get('/api/devices/');
        return response.data.devices; // Return devices array directly
    }
    
    async startStream(deviceId) {
        const response = await this.client.post(`/api/streams/${deviceId}/start`);
        return response.data; // Returns stream info with webrtc_url
    }
}

// ruth-ai/packages/web-app/src/components/VASVideoPlayer.jsx
class VASVideoPlayer extends React.Component {
    async componentDidMount() {
        // Load VAS WebRTC client from VAS server (not local copy)
        await this.loadVASClient();
        await this.initializeStream();
    }
    
    async loadVASClient() {
        // Load scripts from VAS server
        await this.loadScript(`${VAS_BASE_URL}/static/js/adapter.js`);
        await this.loadScript(`${VAS_BASE_URL}/static/js/janus.js`);
        await this.loadScript(`${VAS_BASE_URL}/static/js/vas-webrtc-client.js`);
    }
    
    async initializeStream() {
        this.vasClient = new window.VASWebRTCClient(VAS_BASE_URL);
        await this.vasClient.initialize();
        await this.vasClient.authenticate('admin', 'admin123');
        await this.vasClient.connectToCamera(this.props.camera.id, this.videoRef.current);
    }
}
```

## Security

### Authentication Security
- **JWT Tokens**: Industry-standard JSON Web Tokens with configurable expiration
- **Password Encryption**: Device passwords are encrypted in the database
- **Role-based Access**: Admin and user roles with different permissions
- **HTTPS Support**: Production deployments should use HTTPS

### Network Security
- **CORS Configuration**: Configurable allowed origins for cross-origin requests
- **Rate Limiting**: Built-in rate limiting (10 requests/second per IP)
- **Input Validation**: Comprehensive request validation using Pydantic schemas
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection attacks

### WebRTC Security
- **Secure WebSocket**: WebRTC connections can use WSS (WebSocket Secure)
- **STUN/TURN**: Configurable STUN/TURN servers for NAT traversal
- **ICE Candidates**: Secure ICE candidate exchange through Janus Gateway

### Production Security Recommendations

1. **Use HTTPS/WSS**: Enable SSL/TLS for all connections
2. **Change Default Credentials**: Update default admin password
3. **Network Isolation**: Run VAS in isolated network segments
4. **Regular Updates**: Keep dependencies and base images updated
5. **Access Logs**: Monitor API access logs for suspicious activity
6. **Firewall Rules**: Restrict access to necessary ports only

## Deployment

### Docker Deployment

VAS is designed to run in Docker containers with the following services:

```yaml
# docker-compose.yml
version: '3.8'
services:
  vas-backend:
    build: ./vas/backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://vas:password@postgres:5432/vas
      - JANUS_WS_URL=ws://janus:8188
    depends_on:
      - postgres
      - janus
  
  vas-frontend:
    build: ./vas/frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
  
  janus:
    image: janus-gateway:latest
    ports:
      - "8188:8188"  # WebSocket
      - "8088:8088"  # HTTP
      - "7188:7188"  # Admin API
    volumes:
      - ./janus/config:/usr/local/etc/janus
  
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=vas
      - POSTGRES_USER=vas
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Environment Variables

#### Backend Configuration
```env
# Database
DATABASE_URL=postgresql://vas:password@postgres:5432/vas

# Janus Gateway
JANUS_WS_URL=ws://janus:8188
JANUS_HTTP_URL=http://janus:8088
JANUS_ADMIN_SECRET=your-admin-secret

# Security
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_HOSTS=["*"]  # Configure for production

# Debug
DEBUG=false
```

#### Frontend Configuration
```env
REACT_APP_API_URL=http://10.30.250.245:8000
REACT_APP_WS_URL=ws://10.30.250.245:8188
```

### Production Deployment Checklist

- [ ] Change default admin credentials
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up proper CORS origins
- [ ] Configure database backups
- [ ] Set up log aggregation
- [ ] Configure monitoring and alerting
- [ ] Set up firewall rules
- [ ] Configure STUN/TURN servers for WebRTC
- [ ] Test failover scenarios
- [ ] Document backup/restore procedures

### Scaling Considerations

1. **Database**: Use PostgreSQL with read replicas for high load
2. **Janus Gateway**: Multiple Janus instances behind load balancer
3. **API Backend**: Horizontal scaling with multiple FastAPI instances
4. **Caching**: Redis for session management and caching
5. **Load Balancing**: NGINX or similar for API load balancing
6. **Monitoring**: Prometheus + Grafana for metrics and monitoring

---

## Support and Documentation

### Interactive API Documentation
- **Swagger UI**: `http://10.30.250.245:8000/docs`
- **ReDoc**: `http://10.30.250.245:8000/redoc`

### Additional Resources
- **Source Code**: Available in VAS repository
- **Example Integrations**: See `external-portal-example.html`
- **Client Libraries**: Available at `/static/js/` endpoint

### Contact Information
For technical support and integration assistance, please refer to the VAS development team or create issues in the project repository.

## Testing with cURL Commands

This section provides ready-to-use cURL commands for testing all major VAS API endpoints. Replace `10.30.250.245:8000` with your actual VAS server address.

### Prerequisites

Before running these commands, ensure VAS is running and accessible:

```bash
# Test if VAS is running
curl -s http://10.30.250.245:8000/api/health
```

### Authentication

#### 1. Login and Get JWT Token
```bash
# Login to get authentication token
curl -X POST "http://10.30.250.245:8000/api/auth/login-json" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' | jq .

# Save token to environment variable for subsequent requests
export VAS_TOKEN=$(curl -s -X POST "http://10.30.250.245:8000/api/auth/login-json" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r '.access_token')

echo "Token: $VAS_TOKEN"
```

### Device Management

#### 2. List All Devices
```bash
# Get all devices
curl -X GET "http://10.30.250.245:8000/api/devices/" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .

# Get devices with pagination
curl -X GET "http://10.30.250.245:8000/api/devices/?skip=0&limit=10" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .

# Filter devices by status
curl -X GET "http://10.30.250.245:8000/api/devices/?status_filter=ONLINE" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .

# Filter devices by vendor
curl -X GET "http://10.30.250.245:8000/api/devices/?vendor_filter=Hikvision" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

#### 3. Get Individual Device Details
```bash
# First, get a device ID from the list
export DEVICE_ID=$(curl -s -X GET "http://10.30.250.245:8000/api/devices/" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq -r '.devices[0].id')

echo "Using Device ID: $DEVICE_ID"

# Get specific device details
curl -X GET "http://10.30.250.245:8000/api/devices/$DEVICE_ID" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

#### 4. Create New Device
```bash
# Add a new IP camera
curl -X POST "http://10.30.250.245:8000/api/devices/" \
  -H "Authorization: Bearer $VAS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test IP Camera",
    "device_type": "ip_camera",
    "manufacturer": "Hikvision",
    "model": "DS-2CD2142FWD-I",
    "ip_address": "192.168.1.100",
    "port": 554,
    "rtsp_url": "rtsp://admin:password123@192.168.1.100:554/Streaming/Channels/101",
    "username": "admin",
    "password": "password123",
    "location": "Test Location",
    "description": "Test camera for API testing",
    "tags": ["test", "api"],
    "metadata": {
      "resolution": "1080p",
      "night_vision": true,
      "ptz": false
    }
  }' | jq .
```

#### 5. Update Device
```bash
# Update device information
curl -X PATCH "http://10.30.250.245:8000/api/devices/$DEVICE_ID" \
  -H "Authorization: Bearer $VAS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Updated Location",
    "description": "Updated via API test",
    "tags": ["updated", "test"]
  }' | jq .
```

#### 6. Validate RTSP Stream
```bash
# Test RTSP stream validation
curl -X POST "http://10.30.250.245:8000/api/devices/validate" \
  -H "Authorization: Bearer $VAS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ip_address": "192.168.1.100",
    "username": "admin",
    "password": "password123",
    "rtsp_url": "rtsp://admin:password123@192.168.1.100:554/stream1"
  }' | jq .

# Validate public test stream (no authentication needed)
curl -X POST "http://10.30.250.245:8000/api/devices/validate" \
  -H "Authorization: Bearer $VAS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ip_address": "demo.openrtsp.com",
    "username": "",
    "password": "",
    "rtsp_url": "rtsp://demo.openrtsp.com:554/live"
  }' | jq .
```

#### 7. Get Device Status
```bash
# Check device health status
curl -X GET "http://10.30.250.245:8000/api/devices/$DEVICE_ID/status" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

#### 8. Delete Device
```bash
# Delete a device (be careful with this!)
# curl -X DELETE "http://10.30.250.245:8000/api/devices/$DEVICE_ID" \
#   -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

### Stream Management

#### 9. List All Streams
```bash
# Get all available streams
curl -X GET "http://10.30.250.245:8000/api/streams/" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

#### 10. Start Camera Stream
```bash
# Start streaming for a specific device
curl -X POST "http://10.30.250.245:8000/api/streams/$DEVICE_ID/start" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

#### 11. Get Stream Status
```bash
# Check stream status for a device
curl -X GET "http://10.30.250.245:8000/api/streams/$DEVICE_ID/status" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

#### 12. Stop Camera Stream
```bash
# Stop streaming for a device
curl -X POST "http://10.30.250.245:8000/api/streams/$DEVICE_ID/stop" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

### Janus Gateway Integration

#### 13. List Janus Mountpoints
```bash
# Get all Janus mountpoints (for debugging)
curl -X GET "http://10.30.250.245:8000/api/streams/janus/mountpoints" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

#### 14. Check Janus Health
```bash
# Check Janus Gateway health
curl -X GET "http://10.30.250.245:8000/api/streams/janus/health" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

### Device Discovery

#### 15. Start Network Discovery
```bash
# Start discovering devices on network
curl -X POST "http://10.30.250.245:8000/api/discover/" \
  -H "Authorization: Bearer $VAS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "network_range": "192.168.1.0/24",
    "scan_ports": [554, 80, 443],
    "timeout": 30
  }' | jq .

# Save the task ID for checking status
export DISCOVERY_TASK_ID=$(curl -s -X POST "http://10.30.250.245:8000/api/discover/" \
  -H "Authorization: Bearer $VAS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"network_range": "192.168.1.0/24", "scan_ports": [554], "timeout": 30}' | jq -r '.task_id')

echo "Discovery Task ID: $DISCOVERY_TASK_ID"
```

#### 16. Check Discovery Status
```bash
# Check discovery task progress
curl -X GET "http://10.30.250.245:8000/api/discover/$DISCOVERY_TASK_ID" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .

# List all discovery tasks
curl -X GET "http://10.30.250.245:8000/api/discover/" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

### Health and Monitoring

#### 17. Service Health Check
```bash
# Check overall VAS health (no authentication required)
curl -X GET "http://10.30.250.245:8000/api/health" | jq .
```

#### 18. Get Metrics
```bash
# Get operational metrics (if implemented)
curl -X GET "http://10.30.250.245:8000/api/metrics" \
  -H "Authorization: Bearer $VAS_TOKEN" | jq .
```

### Complete Testing Script

Here's a complete bash script that tests the entire VAS API workflow:

```bash
#!/bin/bash

# VAS API Testing Script
VAS_BASE_URL="http://10.30.250.245:8000"

echo "=== VAS API Testing Script ==="
echo "Testing VAS at: $VAS_BASE_URL"
echo

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "Warning: jq is not installed. JSON output will not be formatted."
    JQ_CMD="cat"
else
    JQ_CMD="jq ."
fi

# 1. Health Check
echo "1. Checking VAS Health..."
curl -s "$VAS_BASE_URL/api/health" | $JQ_CMD
echo

# 2. Authentication
echo "2. Authenticating..."
VAS_TOKEN=$(curl -s -X POST "$VAS_BASE_URL/api/auth/login-json" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r '.access_token')

if [ "$VAS_TOKEN" = "null" ] || [ -z "$VAS_TOKEN" ]; then
    echo "❌ Authentication failed!"
    exit 1
fi

echo "✅ Authentication successful"
echo "Token: ${VAS_TOKEN:0:20}..."
echo

# 3. List Devices
echo "3. Listing devices..."
DEVICES_RESPONSE=$(curl -s -X GET "$VAS_BASE_URL/api/devices/" \
  -H "Authorization: Bearer $VAS_TOKEN")

echo "$DEVICES_RESPONSE" | $JQ_CMD
echo

# Get first device ID if available
DEVICE_ID=$(echo "$DEVICES_RESPONSE" | jq -r '.devices[0].id // empty')

if [ -n "$DEVICE_ID" ] && [ "$DEVICE_ID" != "null" ]; then
    echo "✅ Found devices. Using device ID: $DEVICE_ID"
    
    # 4. Get Device Details
    echo
    echo "4. Getting device details..."
    curl -s -X GET "$VAS_BASE_URL/api/devices/$DEVICE_ID" \
      -H "Authorization: Bearer $VAS_TOKEN" | $JQ_CMD
    echo
    
    # 5. Check Device Status
    echo "5. Checking device status..."
    curl -s -X GET "$VAS_BASE_URL/api/devices/$DEVICE_ID/status" \
      -H "Authorization: Bearer $VAS_TOKEN" | $JQ_CMD
    echo
    
    # 6. List Streams
    echo "6. Listing streams..."
    curl -s -X GET "$VAS_BASE_URL/api/streams/" \
      -H "Authorization: Bearer $VAS_TOKEN" | $JQ_CMD
    echo
    
    # 7. Start Stream
    echo "7. Starting stream..."
    curl -s -X POST "$VAS_BASE_URL/api/streams/$DEVICE_ID/start" \
      -H "Authorization: Bearer $VAS_TOKEN" | $JQ_CMD
    echo
    
    # 8. Check Stream Status
    echo "8. Checking stream status..."
    curl -s -X GET "$VAS_BASE_URL/api/streams/$DEVICE_ID/status" \
      -H "Authorization: Bearer $VAS_TOKEN" | $JQ_CMD
    echo
    
else
    echo "⚠️  No devices found. Skipping device-specific tests."
fi

# 9. Check Janus Health
echo "9. Checking Janus health..."
curl -s -X GET "$VAS_BASE_URL/api/streams/janus/health" \
  -H "Authorization: Bearer $VAS_TOKEN" | $JQ_CMD
echo

# 10. List Janus Mountpoints
echo "10. Listing Janus mountpoints..."
curl -s -X GET "$VAS_BASE_URL/api/streams/janus/mountpoints" \
  -H "Authorization: Bearer $VAS_TOKEN" | $JQ_CMD
echo

echo "=== Testing Complete ==="
```

### Save and Run the Test Script

```bash
# Save the script
cat > vas_api_test.sh << 'EOF'
# [Insert the complete testing script above]
EOF

# Make it executable
chmod +x vas_api_test.sh

# Run the test
./vas_api_test.sh
```

### WebRTC Stream Testing

To test the actual video stream, you can use the WebRTC client:

```bash
# Get the WebRTC client library
curl -o vas-webrtc-client.js "http://10.30.250.245:8000/static/js/vas-webrtc-client.js"
curl -o janus.js "http://10.30.250.245:8000/static/js/janus.js"
curl -o adapter.js "http://10.30.250.245:8000/static/js/adapter.js"

# Create a simple test HTML file
cat > test_webrtc.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>VAS WebRTC Test</title>
</head>
<body>
    <h1>VAS WebRTC Stream Test</h1>
    <video id="video" width="640" height="480" autoplay controls></video>
    <br><br>
    <button onclick="connectToCamera()">Connect to Camera</button>
    <button onclick="disconnect()">Disconnect</button>
    
    <script src="adapter.js"></script>
    <script src="janus.js"></script>
    <script src="vas-webrtc-client.js"></script>
    
    <script>
        let vasClient;
        
        async function connectToCamera() {
            try {
                vasClient = new VASWebRTCClient('http://10.30.250.245:8000');
                await vasClient.initialize();
                await vasClient.authenticate('admin', 'admin123');
                
                const cameras = await vasClient.getAllCameras();
                if (cameras.length > 0) {
                    const video = document.getElementById('video');
                    await vasClient.connectToCamera(cameras[0].id, video);
                    console.log('Connected to camera:', cameras[0].name);
                } else {
                    console.log('No cameras available');
                }
            } catch (error) {
                console.error('Connection failed:', error);
            }
        }
        
        function disconnect() {
            if (vasClient) {
                vasClient.disconnectAll();
            }
        }
    </script>
</body>
</html>
EOF

# Open in browser or serve with a simple HTTP server
python3 -m http.server 8080
# Then visit: http://localhost:8080/test_webrtc.html
```

### Troubleshooting Commands

```bash
# Check if VAS services are running
curl -s http://10.30.250.245:8000/api/health | jq '.status'

# Check if Janus is responding
curl -s http://10.30.250.245:8000/api/streams/janus/health | jq '.janus_healthy'

# Test WebSocket connection to Janus
# (Use websocat or similar tool)
# websocat ws://10.30.250.245:8188

# Check VAS logs (if using Docker)
docker logs vas_backend_1

# Check Janus logs
docker logs vas_janus_1
```

### Notes

- Replace `10.30.250.245:8000` with your actual VAS server address
- Install `jq` for better JSON formatting: `sudo apt-get install jq`
- Some commands may require devices to be registered first
- WebRTC testing requires a web browser environment
- Always check the health endpoints before running other tests

---

*This documentation is current as of December 2023. For the latest updates, please refer to the interactive API documentation at `/docs`.*
