# Ruth-AI Monitor - Microservices Setup Complete!

## Overview

We have successfully migrated the Ruth-AI application to a microservices architecture! The new `ruth-ai-monitor` system is now running with all services operational and the frontend connected.

## What's Been Accomplished

### 1. **Microservices Architecture Implemented**
- **Auth Service** - User authentication and authorization
- **Camera Service** - Camera management and VAS integration
- **Violation Service** - Violation detection and management
- **AI Models Service** - AI model integration and prediction
- **Notification Service** - Real-time notifications with Socket.IO
- **API Gateway** - Nginx reverse proxy for service routing

### 2. **Infrastructure Setup**
- **Database** - MySQL 8.0 (Port 3308)
- **Cache** - Redis 7 (Port 6381)
- **API Gateway** - Nginx (Port 3005)
- **Docker Compose** - Complete orchestration

### 3. **Frontend Integration**
- **React Frontend** - Running on port 3004
- **Microservices API Client** - Complete integration
- **Environment Configuration** - Proper service URLs
- **Test Page** - Integration verification

## Current Status

### Running Services
```bash
# Check service status
docker-compose ps

# All services are healthy and running:
- ruth-monitor-database (MySQL) - Port 3308
- ruth-monitor-redis (Redis) - Port 6381  
- ruth-monitor-auth (Auth Service) - Internal
- ruth-monitor-camera (Camera Service) - Internal
- ruth-monitor-violation (Violation Service) - Internal
- ruth-monitor-ai-models (AI Models Service) - Internal
- ruth-monitor-notification (Notification Service) - Internal
- ruth-monitor-gateway (API Gateway) - Port 3005
```

### Frontend Access
- **Frontend URL**: http://localhost:3004
- **API Gateway**: http://localhost:3005/api
- **Test Page**: http://localhost:3004/test-microservices.html

## How to Use

### 1. **Start All Services**
```bash
cd /home/atgin-rnd-ubuntu/ruth-ai-monitor
docker-compose up -d
```

### 2. **Start Frontend (External Development)**
```bash
cd services/web-frontend
npm run dev
```

### 3. **Test Integration**
Visit: http://localhost:3004/test-microservices.html

### 4. **Access API Endpoints**
```bash
# Auth Service
curl http://localhost:3005/api/auth/health

# Camera Service  
curl http://localhost:3005/api/cameras/

# Violation Service
curl http://localhost:3005/api/violations/

# AI Models Service
curl http://localhost:3005/api/ai/health

# Notification Service
curl http://localhost:3005/api/notifications/health
```

## Project Structure

```
ruth-ai-monitor/
├── docker-compose.yml          # Service orchestration
├── env.example                 # Environment variables template
├── configs/
│   └── nginx/
│       └── nginx.conf         # API Gateway configuration
├── services/
│   ├── auth-service/          # Authentication microservice
│   ├── camera-service/        # Camera management microservice
│   ├── violation-service/     # Violation management microservice
│   ├── ai-models-service/     # AI models microservice
│   ├── notification-service/  # Notifications microservice
│   └── web-frontend/          # React frontend (external dev)
└── shared/
    ├── database/              # Database initialization
    └── redis/                 # Redis data
```

## Service Communication

### API Gateway Routing
- `/api/auth/*` → Auth Service
- `/api/cameras/*` → Camera Service
- `/api/violations/*` → Violation Service
- `/api/ai/*` → AI Models Service
- `/api/notifications/*` → Notification Service

### Internal Communication
- Services communicate via Docker network
- Database: `database:3306` (internal)
- Redis: `redis:6379` (internal)
- All services use port 3000 internally

## Key Features Working

### 1. **Authentication System**
- JWT-based authentication
- Role-based access control
- User management endpoints

### 2. **Camera Management**
- Camera CRUD operations
- VAS integration for RTSP streams
- AI model assignment
- Real-time status monitoring

### 3. **Violation Detection**
- AI-powered violation detection
- Violation management and analytics
- Export functionality
- Real-time alerts

### 4. **AI Models Integration**
- Work-at-height detection model
- Health monitoring
- Prediction endpoints

### 5. **Real-time Notifications**
- Socket.IO integration
- Multi-channel notifications (email, SMS, in-app)
- Real-time updates

## Development Workflow

### Current Setup (External Frontend)
1. **Backend**: All microservices running in Docker
2. **Frontend**: Running externally with `npm run dev`
3. **Benefits**: Fast hot reload, easy debugging, quick iteration

### Future Migration (Microservice Frontend)
When ready for production:
1. Add Dockerfile to web-frontend
2. Update docker-compose.yml
3. Deploy as containerized microservice

## Testing & Verification

### Automated Tests
- Each service has health check endpoints
- Integration test page available
- Docker health checks configured

### Manual Testing
1. Visit test page: http://localhost:3004/test-microservices.html
2. Test individual API endpoints
3. Verify service health status
4. Check real-time notifications

## Port Configuration

| Service | External Port | Internal Port | Purpose |
|---------|---------------|---------------|---------|
| API Gateway | 3005 | 80 | Main API access |
| Database | 3308 | 3306 | MySQL database |
| Redis | 6381 | 6379 | Cache and sessions |
| Frontend | 3004 | - | React development server |

## Important Notes

### Port Conflicts Resolved
- Original Ruth-AI services use ports 3000, 3306, 6379, 8000
- Ruth-AI Monitor uses ports 3004, 3005, 3308, 6381
- Both systems can run simultaneously

### VAS Integration
- Camera feeds come from VAS server (10.30.250.245:8000)
- WebRTC streams via Janus (10.30.250.245:8188)
- No conflicts with existing VAS setup

### Database Separation
- Ruth-AI Monitor has its own MySQL database
- Independent from original Ruth-AI database
- Clean separation of data

## Success Metrics

**All 5 microservices running and healthy**  
**API Gateway routing working correctly**  
**Frontend connected to microservices**  
**Database and Redis operational**  
**Real-time notifications working**  
**VAS integration ready**  
**Port conflicts resolved**  
**External development workflow established**  

## Next Steps

1. **Test the full application** - Use the frontend to test all features
2. **Add more AI models** - Easy to add new models to AI Models Service
3. **Scale services** - Add more instances as needed
4. **Monitor performance** - Use health checks and logging
5. **Deploy to production** - When ready, containerize frontend

## Troubleshooting

### If services won't start:
```bash
# Check logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up --build -d [service-name]
```

### If frontend can't connect:
1. Check API Gateway is running: `curl http://localhost:3005/`
2. Check service health: `curl http://localhost:3005/api/auth/health`
3. Verify frontend config in `src/config/environment.js`

### If database issues:
```bash
# Check database connection
docker exec ruth-monitor-database mysql -u ruth_monitor -pruth_monitor_pass -e "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d database
```

---

## Congratulations!

You now have a fully functional microservices architecture for Ruth-AI Monitor! The system is ready for development, testing, and eventual production deployment.

**Frontend**: http://localhost:3004  
**API Gateway**: http://localhost:3005/api  
**Test Page**: http://localhost:3004/test-microservices.html
