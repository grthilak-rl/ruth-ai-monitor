# Ruth-AI Monitor Frontend

A React-based frontend application for the Ruth-AI Monitor microservices architecture, providing a comprehensive interface for industrial safety monitoring.

## Overview

This frontend application connects to the Ruth-AI Monitor microservices backend to provide:
- **Real-time Camera Monitoring** with VAS integration
- **AI-powered Violation Detection** and alerts
- **User Authentication** and role-based access control
- **Analytics and Reporting** for safety metrics
- **Notification Management** with real-time updates
- **Camera Management** and configuration

## Architecture

```
Frontend (React + Vite)
├── Authentication (Auth Service)
├── Camera Management (Camera Service)
├── Violation Monitoring (Violation Service)
├── AI Model Integration (AI Models Service)
├── Real-time Notifications (Notification Service)
└── VAS Integration (Direct API)
```

## Features

### Core Functionality
- ✅ **User Authentication** - Login, registration, profile management
- ✅ **Camera Management** - Add, edit, delete cameras
- ✅ **Live Monitoring** - Real-time camera feeds via VAS
- ✅ **Violation Detection** - AI-powered safety monitoring
- ✅ **Analytics Dashboard** - Safety metrics and reports
- ✅ **Notification Center** - Real-time alerts and updates
- ✅ **User Management** - Role-based access control

### UI Components
- ✅ **Responsive Design** - Mobile and desktop optimized
- ✅ **Modern UI** - Tailwind CSS with custom components
- ✅ **Real-time Updates** - Socket.IO integration
- ✅ **Interactive Charts** - Recharts for data visualization
- ✅ **Toast Notifications** - User feedback system
- ✅ **Loading States** - Smooth user experience

## Technology Stack

- **Frontend Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Styling**: Tailwind CSS 3.4.6
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM 6.0.2
- **HTTP Client**: Axios 1.8.4
- **Real-time**: Socket.IO Client 4.8.1
- **Charts**: Recharts 2.15.2
- **Icons**: Lucide React 0.484.0
- **Forms**: React Hook Form 7.55.0
- **Validation**: Zod 3.22.4

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Running microservices backend

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env.local` file (or use the development config):

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

# VAS Integration
VITE_VAS_API_URL=http://10.30.250.245:8000/api
VITE_VAS_WS_URL=ws://10.30.250.245:8188/janus

# Feature Flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_ANALYTICS=true
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Input, etc.)
│   ├── Layout.jsx       # Main layout component
│   ├── VASVideoPlayer.jsx # VAS video player
│   └── ViolationCharts.jsx # Violation visualization
├── pages/               # Page components
│   ├── login/           # Authentication pages
│   ├── camera-management/ # Camera management
│   ├── camera-monitoring/ # Live monitoring
│   ├── violation-history/ # Violation management
│   ├── analytics-reports/ # Analytics dashboard
│   └── settings/        # User settings
├── services/            # API services
│   ├── microservicesApi.js # Microservices API client
│   ├── vasApiService.js    # VAS integration
│   └── socketService.js    # Socket.IO service
├── contexts/            # React contexts
│   ├── AuthContext.jsx  # Authentication context
│   └── AlertContext.jsx # Alert/notification context
├── config/              # Configuration
│   └── environment.js   # Environment variables
├── utils/               # Utility functions
└── styles/              # Global styles
    ├── index.css        # Main styles
    └── tailwind.css     # Tailwind imports
```

## API Integration

### Microservices API Client

The frontend uses a centralized API client (`microservicesApi.js`) that provides:

- **Auth Service**: User authentication and management
- **Camera Service**: Camera CRUD operations and VAS sync
- **Violation Service**: Violation management and analytics
- **AI Models Service**: AI model integration
- **Notification Service**: Real-time notifications
- **VAS API**: Direct VAS integration for camera feeds

### Socket.IO Integration

Real-time communication via Socket.IO:

```javascript
import { socketService } from './services/microservicesApi';

// Connect to notifications
socketService.onNotification((notification) => {
  console.log('New notification:', notification);
});

// Join camera room
socketService.joinCameraRoom('camera-123');

// Listen for violations
socketService.onViolationDetected((violation) => {
  console.log('Violation detected:', violation);
});
```

## Development Workflow

### External Development (Current)

```bash
# 1. Start microservices backend
cd /home/atgin-rnd-ubuntu/ruth-ai-monitor
docker-compose up -d

# 2. Start frontend development server
cd services/web-frontend
npm run dev
```

### Benefits of External Development
- ✅ **Fast Hot Reload** - Instant changes
- ✅ **Better Debugging** - Browser dev tools
- ✅ **Easy Testing** - Direct component access
- ✅ **No Docker Build Time** - Faster iteration

### Migration to Microservice (Later)

When ready for production:

```bash
# Add Dockerfile
# Update docker-compose.yml
# Switch to microservice
docker-compose up -d
```

## Key Features

### 1. Authentication
- JWT-based authentication
- Role-based access control (Admin, Manager, Supervisor, Operator)
- Secure token management
- Auto-logout on token expiry

### 2. Camera Management
- Add/edit/delete cameras
- VAS integration for RTSP streams
- AI model assignment
- Real-time status monitoring

### 3. Live Monitoring
- Multi-camera grid view
- VAS WebRTC video streams
- Real-time violation alerts
- Camera status indicators

### 4. Violation Management
- AI-powered detection
- Violation acknowledgment/resolution
- Analytics and reporting
- Export functionality

### 5. Real-time Notifications
- Socket.IO integration
- Toast notifications
- Notification center
- User preferences

## Testing

### Manual Testing

```bash
# Test authentication
curl http://localhost:3000/api/auth/login

# Test camera API
curl http://localhost:3000/api/cameras

# Test notifications
curl http://localhost:3000/api/notifications/stats
```

### Frontend Testing

```bash
# Run tests
npm test

# Test specific component
npm test -- --testNamePattern="CameraManagement"
```

## Deployment

### Development Deployment

```bash
# Build for development
npm run build

# Preview build
npm run preview
```

### Production Deployment

```bash
# Build for production
npm run build

# Serve static files
npm run serve
```

### Docker Deployment (Future)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Integration with Microservices

### API Gateway Routing

The frontend connects to microservices through the API Gateway:

- `/api/auth/*` → Auth Service
- `/api/cameras/*` → Camera Service  
- `/api/violations/*` → Violation Service
- `/api/ai/*` → AI Models Service
- `/api/notifications/*` → Notification Service

### Real-time Communication

Socket.IO events for real-time updates:

- `notification` - New notifications
- `violation_detected` - AI violation alerts
- `camera_status_update` - Camera status changes
- `system_status_update` - System updates

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check API Gateway configuration
   - Verify service URLs in environment config

2. **Socket.IO Connection Failed**
   - Check WebSocket URL configuration
   - Verify authentication token

3. **VAS Integration Issues**
   - Check VAS API URL
   - Verify Janus WebSocket connection

### Debug Mode

```bash
# Enable debug logging
VITE_DEBUG=true npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
