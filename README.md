# Ruth-AI Monitor - Microservices Architecture

A microservices-based industrial safety monitoring system built from the Ruth-AI monolith.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   API Gateway   │    │   Auth Service  │
│   (React)       │◄──►│   (Nginx)       │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │Camera Service│ │Violation    │ │AI Models   │
        │(Node.js)     │ │Service      │ │Service     │
        │              │ │(Node.js)    │ │(Python)    │
        └───────┬──────┘ └──────┬──────┘ └─────┬──────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                        ┌───────▼──────┐
                        │Notification  │
                        │Service       │
                        │(Socket.IO)   │
                        └───────┬──────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │   Database   │ │    Redis    │ │   VAS      │
        │   (MySQL)    │ │   (Cache)   │ │(External)  │
        └──────────────┘ └─────────────┘ └────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- Python 3.9+ (for AI models)

### 1. Clone and Setup
```bash
cd /home/atgin-rnd-ubuntu/ruth-ai-monitor
cp env.example .env
# Edit .env with your configuration
```

### 2. Start Services
```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 📁 Project Structure

```
ruth-ai-monitor/
├── services/                    # Individual microservices
│   ├── api-gateway/            # Nginx reverse proxy
│   ├── auth-service/           # Authentication & authorization
│   ├── camera-service/         # Camera management & VAS integration
│   ├── violation-service/      # Violation detection & reporting
│   ├── ai-models-service/      # AI model inference (Python)
│   ├── notification-service/   # Real-time notifications (Socket.IO)
│   └── web-frontend/          # React frontend
├── shared/                     # Shared resources
│   ├── database/              # Database initialization scripts
│   ├── redis/                 # Redis configuration
│   └── configs/               # Shared configurations
├── configs/                    # Configuration files
│   ├── nginx/                 # Nginx configuration
│   └── env-templates/         # Environment templates
├── docker-compose.yml         # Main orchestration file
├── env.example               # Environment variables template
└── README.md                # This file
```

## 🔧 Services Overview

### API Gateway (Nginx)
- **Port**: 3000
- **Purpose**: Route requests to appropriate services
- **Features**: Rate limiting, SSL termination, load balancing

### Auth Service (Node.js)
- **Port**: 3000 (internal)
- **Purpose**: User authentication & JWT token management
- **Endpoints**: `/api/auth/*`

### Camera Service (Node.js)
- **Port**: 3000 (internal)
- **Purpose**: Camera management & VAS integration
- **Endpoints**: `/api/cameras/*`
- **Dependencies**: VAS API, Database

### Violation Service (Node.js)
- **Port**: 3000 (internal)
- **Purpose**: Violation detection & reporting
- **Endpoints**: `/api/violations/*`
- **Dependencies**: AI Models Service, Database

### AI Models Service (Python)
- **Port**: 8000 (internal)
- **Purpose**: AI model inference (Fall Detection, Work at Height)
- **Endpoints**: `/api/ai/*`
- **Framework**: FastAPI

### Notification Service (Node.js)
- **Port**: 3000 (internal)
- **Purpose**: Real-time notifications via Socket.IO
- **Endpoints**: `/api/notifications/*`, WebSocket: `/socket.io/`

### Web Frontend (React)
- **Port**: 80 (internal)
- **Purpose**: User interface
- **Framework**: React with Vite

## 🗄️ Data Storage

### Database (MySQL)
- **Port**: 3306
- **Purpose**: Persistent data storage
- **Databases**: `ruth_monitor`

### Redis
- **Port**: 6379
- **Purpose**: Caching, session storage, real-time data

## 🔗 External Integrations

### VAS (Video Analytics System)
- **URL**: http://10.30.250.245:8000/api
- **Purpose**: Camera feeds, video streaming
- **Integration**: Camera Service communicates with VAS

## 🛠️ Development

### Adding a New Service
1. Create service directory in `services/`
2. Add Dockerfile
3. Update `docker-compose.yml`
4. Add nginx routing in `configs/nginx/nginx.conf`
5. Update environment variables

### Service Communication
- **Internal**: Use service names (e.g., `http://auth-service:3000`)
- **External**: Use API Gateway (e.g., `http://localhost:3000/api/auth/`)

### Database Migrations
- Place SQL scripts in `shared/database/init/`
- They will run automatically on container startup

## 📊 Monitoring

### Health Checks
- All services have health check endpoints
- Check service status: `docker-compose ps`
- View logs: `docker-compose logs [service-name]`

### Logs
- **Location**: `docker-compose logs`
- **Format**: Structured JSON logs
- **Levels**: error, warn, info, debug

## 🔒 Security

### Authentication
- JWT tokens for API access
- Token expiration: 24 hours (configurable)
- Secure token storage in Redis

### Network Security
- Internal Docker network isolation
- Rate limiting on API endpoints
- Security headers via Nginx

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Update `.env` with production values
2. **SSL Certificates**: Add SSL certificates to `configs/nginx/ssl/`
3. **Database Backups**: Implement regular backup strategy
4. **Monitoring**: Add application monitoring (Prometheus, Grafana)
5. **Logging**: Centralized logging (ELK stack)

### Scaling
- **Horizontal**: Add more instances of stateless services
- **Database**: Use read replicas for read-heavy workloads
- **Cache**: Redis clustering for high availability

## 🐛 Troubleshooting

### Common Issues
1. **Service won't start**: Check logs with `docker-compose logs [service]`
2. **Database connection**: Verify MySQL is healthy with `docker-compose ps`
3. **VAS integration**: Check VAS server connectivity
4. **Port conflicts**: Ensure ports 3000, 3306, 6379 are available

### Debug Commands
```bash
# Check all services
docker-compose ps

# View specific service logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Rebuild a service
docker-compose build [service-name]

# Access service shell
docker-compose exec [service-name] sh
```

## 📝 Migration from Ruth-AI

This microservices architecture is built by extracting services from the original Ruth-AI monolith:

1. **Auth Service**: Extracted from `packages/web-app/server/controllers/auth.controller.js`
2. **Camera Service**: Extracted from `packages/web-app/server/controllers/camera.controller.js`
3. **Violation Service**: Extracted from `packages/web-app/server/controllers/violation.controller.js`
4. **AI Models Service**: Copied from `packages/ai-models/`
5. **Notification Service**: Extracted from `packages/web-app/server/services/socket.service.js`
6. **Web Frontend**: Copied from `packages/web-app/src/`

## 🤝 Contributing

1. Follow the existing service patterns
2. Add health check endpoints to new services
3. Update nginx configuration for new routes
4. Add environment variables to `env.example`
5. Update this README with new services

## 📄 License

Same as original Ruth-AI project.
