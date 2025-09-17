# Violation Service

The Violation Service provides violation detection, reporting, and management for the Ruth-AI Monitor microservices architecture.

## 🎯 Overview

This service handles:
- **Violation Detection**: AI-powered safety violation detection
- **Violation Reporting**: Create and manage violation reports
- **Violation Management**: Acknowledge, resolve, and track violations
- **AI Integration**: Process camera feeds with AI models
- **Data Export**: Export violation data for analysis

## 🏗️ Architecture

```
Violation Service (Node.js/Express)
├── Violation Management (/violations)
├── AI Integration (/violations/processing)
├── Data Export (/violations/export)
├── Statistics (/violations/stats)
├── Authentication Middleware
└── Database (MySQL)
```

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run service
npm run dev

# Test service
node test_service.js
```

### Docker
```bash
# Build image
docker build -t ruth-ai-violation-service .

# Run container
docker run -d --name violation-service -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e AI_MODELS_SERVICE_URL="http://ai-models-service:8000" \
  -e CAMERA_SERVICE_URL="http://camera-service:3000" \
  -e AUTH_SERVICE_URL="http://auth-service:3000" \
  ruth-ai-violation-service

# Test
node test_service.js http://localhost:3000
```

## 📡 API Endpoints

### Violation Management
- `GET /violations` - Get all violations
- `GET /violations/:id` - Get violation by ID
- `POST /violations` - Create new violation
- `PUT /violations/:id` - Update violation
- `DELETE /violations/:id` - Delete violation

### Violation Actions
- `POST /violations/:id/acknowledge` - Acknowledge violation
- `POST /violations/:id/resolve` - Resolve violation
- `POST /violations/:id/false-positive` - Mark as false positive

### Bulk Operations
- `POST /violations/bulk-update` - Bulk update violations

### Data & Analytics
- `GET /violations/stats` - Get violation statistics
- `GET /violations/export` - Export violations to CSV

### AI Processing
- `GET /violations/processing/status` - Get processing status
- `POST /violations/processing/start` - Start violation processing
- `POST /violations/processing/stop` - Stop violation processing

### Health & Status
- `GET /health` - Service health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check
- `GET /health/ai` - AI integration health

## 🔐 Authentication

All endpoints except public ones require JWT authentication via Auth Service:

```bash
# Get auth token from Auth Service
curl -X POST "http://auth-service:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Use token in requests
curl -X GET "http://violation-service:3000/violations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 Violation Management

### Create Violation
```bash
curl -X POST "http://localhost:3000/violations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "violation_type": "work_at_height",
    "severity": "high",
    "ai_confidence": 85.5,
    "description": "Worker detected at height without proper safety equipment",
    "camera_id": 1,
    "ai_model_id": "work_at_height_v1",
    "detection_data": {
      "confidence": 85.5,
      "bounding_boxes": [
        {"x": 100, "y": 100, "width": 200, "height": 300, "confidence": 85.5}
      ]
    },
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "full_image_url": "https://example.com/full_image.jpg"
  }'
```

### Get All Violations
```bash
curl -X GET "http://localhost:3000/violations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Acknowledge Violation
```bash
curl -X POST "http://localhost:3000/violations/1/acknowledge" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Violation acknowledged and under investigation"
  }'
```

### Resolve Violation
```bash
curl -X POST "http://localhost:3000/violations/1/resolve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Violation resolved - safety measures implemented"
  }'
```

## 🤖 AI Integration

### Start Violation Processing
```bash
curl -X POST "http://localhost:3000/violations/processing/start" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "camera_id": 1,
    "model_type": "work_at_height",
    "interval_ms": 5000
  }'
```

### Get Processing Status
```bash
curl -X GET "http://localhost:3000/violations/processing/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Stop Processing
```bash
curl -X POST "http://localhost:3000/violations/processing/stop" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "camera_id": 1,
    "processing_id": "camera_1_1234567890"
  }'
```

## 📊 Data Export

### Export Violations to CSV
```bash
curl -X GET "http://localhost:3000/violations/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output violations.csv
```

### Export with Filters
```bash
curl -X GET "http://localhost:3000/violations/export?start_date=2024-01-01&end_date=2024-01-31&severity=high" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output high_severity_violations.csv
```

## 🗄️ Database Schema

### Violation Reports Table
```sql
CREATE TABLE violation_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  violation_type ENUM('ppe_missing', 'fall_risk', 'unauthorized_access', 'fire_hazard', 'spill_hazard', 'machine_safety', 'work_at_height') NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  status ENUM('investigating', 'false_positive', 'reviewed', 'resolved') DEFAULT 'investigating',
  ai_confidence FLOAT NOT NULL,
  description TEXT,
  notes TEXT,
  thumbnail_url VARCHAR(500),
  full_image_url VARCHAR(500),
  resolution_date TIMESTAMP NULL,
  camera_id INT UNSIGNED NOT NULL,
  investigator_id INT UNSIGNED NULL,
  ai_model_id VARCHAR(255),
  detection_data JSON,
  bounding_boxes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_violation_type (violation_type),
  INDEX idx_severity (severity),
  INDEX idx_status (status),
  INDEX idx_camera_id (camera_id),
  INDEX idx_investigator_id (investigator_id),
  INDEX idx_ai_confidence (ai_confidence)
);
```

## ⚙️ Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=mysql://user:pass@host:3306/database
DB_HOST=database
DB_PORT=3306
DB_NAME=ruth_monitor
DB_USER=ruth_monitor
DB_PASSWORD=ruth_monitor_pass

# AI Integration
AI_MODELS_SERVICE_URL=http://ai-models-service:8000

# Camera Service
CAMERA_SERVICE_URL=http://camera-service:3000

# Auth Service
AUTH_SERVICE_URL=http://auth-service:3000

# Service
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🔄 AI Integration Flow

### 1. Violation Detection
```
Camera Feed → AI Models Service → Violation Detection → Violation Report
```

### 2. Violation Processing
```
Start Processing → Camera Feed → AI Analysis → Violation Detection → Database Storage
```

### 3. Violation Management
```
Violation Report → Acknowledge → Investigate → Resolve/False Positive
```

## 🧪 Testing

### Automated Tests
```bash
# Run all tests
node test_service.js

# Test specific endpoint
node test_service.js http://localhost:3000
```

### Manual Testing
```bash
# Health check
curl http://localhost:3000/health

# Get violation stats
curl http://localhost:3000/violations/stats

# Get processing status
curl http://localhost:3000/violations/processing/status

# Export violations
curl http://localhost:3000/violations/export
```

## 🔗 Integration

### With Other Services
- **Auth Service**: User authentication and authorization
- **AI Models Service**: Violation detection processing
- **Camera Service**: Camera feed access and management
- **Notification Service**: Violation alerts and notifications

### With AI Models
- **Work at Height Detection**: Detect unsafe work at height
- **Fall Detection**: Detect fall risks and incidents
- **PPE Detection**: Detect missing personal protective equipment
- **Fire/Smoke Detection**: Detect fire hazards

## 📊 Performance

### Benchmarks
- **Violation Creation**: ~50ms
- **AI Processing**: ~2-5s per frame
- **Violation Query**: ~100ms
- **Export Generation**: ~500ms
- **Concurrent Violations**: ~100

### Optimization
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient DB connections
- **AI Caching**: Reduce AI service calls
- **Rate Limiting**: Prevent abuse

## 🛠️ Development

### Project Structure
```
violation-service/
├── app.js                    # Main application
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   └── violation.controller.js # Violation logic
├── middleware/
│   ├── auth.middleware.js   # Auth Service integration
│   └── error.middleware.js  # Error handling
├── models/
│   └── ViolationReport.js   # Violation model
├── routes/
│   ├── violation.routes.js  # Violation endpoints
│   └── health.routes.js     # Health endpoints
├── services/
│   └── aiIntegration.service.js # AI integration
├── Dockerfile               # Container definition
├── package.json             # Dependencies
├── test_service.js         # Testing script
└── README.md               # This file
```

### Adding New Features
1. Add new routes in `routes/`
2. Implement logic in `controllers/`
3. Add AI integration in `services/`
4. Update tests
5. Update documentation

## 🚨 Troubleshooting

### Common Issues

#### AI Integration Errors
```bash
# Check AI service health
curl http://localhost:3000/health/ai

# Check AI models service
curl http://ai-models-service:8000/health
```

#### Database Connection Errors
```bash
# Check database status
curl http://localhost:3000/health

# Check database logs
docker logs database
```

#### Authentication Errors
```bash
# Check Auth Service
curl http://auth-service:3000/health

# Verify token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://auth-service:3000/auth/me
```

### Debug Mode
```bash
# Run with debug logging
NODE_ENV=development npm run dev

# Check service logs
docker logs violation-service -f
```

## 📝 Logs

### Log Levels
- `INFO`: Service startup, violation operations
- `WARN`: AI processing issues, validation errors
- `ERROR`: Authentication failures, system errors

### Log Format
```
[2024-01-01T12:00:00.000Z] INFO: Violation Service running on port 3000
[2024-01-01T12:00:01.000Z] INFO: Database connection established
[2024-01-01T12:00:02.000Z] INFO: AI Models Service connected
[2024-01-01T12:00:03.000Z] INFO: Violation work_at_height created successfully
```

## 🔒 Security Best Practices

### Production Deployment
1. **Secure AI Credentials**: Use environment variables
2. **HTTPS Only**: Never send data over HTTP
3. **Token Validation**: Verify JWT tokens with Auth Service
4. **Rate Limiting**: Prevent abuse
5. **Input Validation**: Validate all inputs
6. **Error Handling**: Don't leak sensitive information

### Monitoring
- **AI Connectivity**: Monitor AI service integration
- **Violation Processing**: Track processing performance
- **Authentication**: Monitor auth failures
- **Performance**: Track response times

## 📈 Monitoring

### Health Metrics
- Service uptime
- Database connectivity
- AI integration status
- Violation processing rate
- Response times

### Alerts
- Service down
- Database connection failures
- AI integration issues
- High violation rates
- Processing errors

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Test AI integration
5. Security review for auth changes

## 📄 License

Same as Ruth-AI Monitor project.
