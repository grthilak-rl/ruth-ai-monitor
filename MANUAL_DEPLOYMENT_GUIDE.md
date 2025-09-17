# Ruth-AI Monitor - Manual Deployment Guide

## 🚀 Quick Deployment Steps

### 1. **Backend Services (Docker)**
```bash
# Clone repository
git clone https://github.com/grthilak-rl/ruth-ai-monitor.git
cd ruth-ai-monitor

# Start backend services
docker-compose up -d

# Check services are running
docker-compose ps
```

### 2. **Frontend (Manual Development)**
```bash
# Navigate to frontend directory
cd services/web-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. **Access Points**
- **Frontend**: http://localhost:3004 or http://10.30.250.245:3004
- **API Gateway**: http://localhost:3005
- **Database**: localhost:3308
- **Redis**: localhost:6381

## 🔧 Environment Configuration

### Frontend Environment Variables
Create `.env` file in `services/web-frontend/`:
```env
VITE_VAS_API_URL=http://10.30.250.245:8000/api
VITE_VAS_WS_URL=ws://10.30.250.245:8188/janus
VITE_API_URL=http://localhost:3005/api
VITE_WS_URL=ws://localhost:3005
```

### Backend Environment Variables
Create `.env` file in root directory:
```env
# Database
MYSQL_ROOT_PASSWORD=ruth_monitor_root
MYSQL_DATABASE=ruth_monitor
MYSQL_USER=ruth_monitor
MYSQL_PASSWORD=ruth_monitor_pass

# JWT
JWT_SECRET=ruth_monitor_jwt_secret_key
JWT_EXPIRES_IN=24h

# VAS Integration
VAS_API_URL=http://10.30.250.245:8000/api
VAS_USERNAME=admin
VAS_PASSWORD=admin123

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3004,http://localhost:3007,http://10.30.250.245:3004,http://10.30.250.245:3007
```

## 📋 Service Status Check

### Backend Services
```bash
# Check all services
docker-compose ps

# Check logs
docker-compose logs -f

# Health check
curl http://localhost:3005/health
```

### Frontend Development Server
```bash
# Check if running
curl http://localhost:3004

# View logs in terminal where npm run dev is running
```

## 🔐 Default Login Credentials

- **Email**: admin@industrial-safety.com
- **Password**: password

## 🎯 VAS Integration

The system automatically connects to VAS at:
- **VAS API**: http://10.30.250.245:8000/api
- **VAS WebRTC**: ws://10.30.250.245:8188/janus

## 🛠️ Development Commands

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Services
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart auth-service

# View logs
docker-compose logs -f auth-service
```

## 🚨 Troubleshooting

### Frontend Issues
1. **Port already in use**: Change port in `vite.config.mjs`
2. **Dependencies missing**: Run `npm install`
3. **VAS connection failed**: Check VAS server is running

### Backend Issues
1. **Database connection failed**: Check MySQL container is running
2. **Service not starting**: Check logs with `docker-compose logs service-name`
3. **Port conflicts**: Check if ports 3005, 3308, 6381 are available

## 📁 Project Structure

```
ruth-ai-monitor/
├── services/
│   ├── web-frontend/          # React frontend (manual deployment)
│   ├── auth-service/          # Authentication service
│   ├── camera-service/        # Camera management
│   ├── violation-service/     # Violation detection
│   ├── ai-models-service/     # AI models
│   └── notification-service/  # Notifications
├── shared/
│   └── database/             # Database data and init scripts
├── configs/
│   └── nginx/                # Nginx configuration
└── docker-compose.yml        # Backend services
```

## 🎉 Success Indicators

✅ **Backend**: All containers running (`docker-compose ps`)
✅ **Frontend**: Development server running (`npm run dev`)
✅ **Database**: MySQL accessible on port 3308
✅ **VAS Integration**: Camera feeds visible in frontend
✅ **Authentication**: Login working with admin credentials

## 📞 Support

For issues:
1. Check service logs: `docker-compose logs -f`
2. Verify VAS server is running: http://10.30.250.245:8000/api/health
3. Check network connectivity between services
4. Review environment variables configuration
