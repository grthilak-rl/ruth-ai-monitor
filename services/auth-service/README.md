# Auth Service

The Auth Service provides JWT-based authentication and authorization for the Ruth-AI Monitor microservices architecture.

## 🎯 Overview

This service handles:
- **User Registration**: Create new user accounts
- **User Authentication**: Login with username/email and password
- **JWT Token Management**: Generate, validate, and refresh tokens
- **Authorization**: Role-based access control (admin, operator, viewer)
- **User Profile Management**: Update profile and change password

## 🏗️ Architecture

```
Auth Service (Node.js/Express)
├── Authentication (/auth/login)
├── Registration (/auth/register)
├── Token Management (/auth/refresh-token)
├── User Profile (/auth/me)
├── Authorization Middleware
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
docker build -t ruth-ai-auth-service .

# Run container
docker run -d --name auth-service -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e JWT_SECRET="your-secret-key" \
  ruth-ai-auth-service

# Test
node test_service.js http://localhost:3000
```

## 📡 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh-token` - Refresh access token

### User Management
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password

### Health & Status
- `GET /health` - Service health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check
- `GET /` - Service info

## 🔐 Authentication Flow

### 1. User Registration
```bash
curl -X POST "http://localhost:3000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "viewer"
  }'
```

### 2. User Login
```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123"
  }'
```

### 3. Access Protected Endpoints
```bash
curl -X GET "http://localhost:3000/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛡️ Security Features

### Password Security
- **Bcrypt Hashing**: Passwords hashed with salt rounds
- **Strong Password Policy**: Minimum 8 characters, mixed case, numbers
- **Password Validation**: Server-side validation

### JWT Security
- **Secure Tokens**: Signed with secret key
- **Token Expiration**: Configurable expiration times
- **Refresh Tokens**: Separate refresh token mechanism
- **Token Rotation**: New refresh token on each refresh

### Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes
- **General Requests**: 100 requests per 15 minutes
- **IP-based Limiting**: Per IP address

### Input Validation
- **Express Validator**: Comprehensive input validation
- **SQL Injection Protection**: Sequelize ORM protection
- **XSS Protection**: Helmet.js security headers

## 👥 User Roles

### Admin
- Full system access
- User management
- System configuration
- All operations

### Operator
- Camera management
- Violation handling
- Report generation
- Limited user management

### Viewer
- Read-only access
- View cameras and violations
- Basic reporting
- Profile management

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role ENUM('admin', 'operator', 'viewer') DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Service
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### JWT Token Structure
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "viewer",
  "iat": 1234567890,
  "exp": 1234654290
}
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

# Register user
curl -X POST "http://localhost:3000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123","role":"viewer"}'

# Login
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123"}'

# Get profile
curl -X GET "http://localhost:3000/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔗 Integration

### With Other Services
- **Camera Service**: Validates user permissions
- **Violation Service**: Checks user roles for operations
- **Notification Service**: User-based notifications
- **Web Frontend**: Authentication state management

### API Gateway
Routes `/api/auth/*` requests to this service.

## 📊 Performance

### Benchmarks
- **Registration**: ~50ms
- **Login**: ~100ms
- **Token Validation**: ~10ms
- **Concurrent Users**: ~1000
- **Memory Usage**: ~50MB

### Optimization
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient DB connections
- **Token Caching**: Redis for token blacklisting
- **Rate Limiting**: Prevents abuse

## 🛠️ Development

### Project Structure
```
auth-service/
├── app.js                 # Main application
├── config/
│   └── database.js       # Database configuration
├── controllers/
│   └── auth.controller.js # Authentication logic
├── middleware/
│   ├── auth.middleware.js # JWT validation
│   └── error.middleware.js # Error handling
├── models/
│   └── User.js           # User model
├── routes/
│   ├── auth.routes.js    # Auth endpoints
│   └── health.routes.js  # Health endpoints
├── Dockerfile            # Container definition
├── package.json          # Dependencies
├── test_service.js       # Testing script
└── README.md            # This file
```

### Adding New Features
1. Add new routes in `routes/`
2. Implement logic in `controllers/`
3. Add middleware if needed
4. Update tests
5. Update documentation

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database status
curl http://localhost:3000/health

# Check database logs
docker logs database
```

#### JWT Token Errors
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Verify token format
echo "YOUR_TOKEN" | base64 -d
```

#### Rate Limiting Issues
```bash
# Check rate limit headers
curl -I http://localhost:3000/auth/login

# Wait for rate limit reset
```

### Debug Mode
```bash
# Run with debug logging
NODE_ENV=development npm run dev

# Check service logs
docker logs auth-service -f
```

## 📝 Logs

### Log Levels
- `INFO`: Service startup, user actions
- `WARN`: Rate limiting, validation errors
- `ERROR`: Authentication failures, system errors

### Log Format
```
[2024-01-01T12:00:00.000Z] INFO: Auth Service running on port 3000
[2024-01-01T12:00:01.000Z] INFO: Database connection established
[2024-01-01T12:00:02.000Z] INFO: User john_doe logged in successfully
```

## 🔒 Security Best Practices

### Production Deployment
1. **Strong JWT Secret**: Use cryptographically secure secret
2. **HTTPS Only**: Never send tokens over HTTP
3. **Token Expiration**: Short-lived access tokens
4. **Rate Limiting**: Prevent brute force attacks
5. **Input Validation**: Validate all inputs
6. **Error Handling**: Don't leak sensitive information

### Monitoring
- **Failed Login Attempts**: Monitor for attacks
- **Token Usage**: Track token patterns
- **Rate Limit Hits**: Monitor abuse
- **Database Performance**: Query optimization

## 📈 Monitoring

### Health Metrics
- Service uptime
- Database connectivity
- Authentication success rate
- Response times

### Alerts
- Service down
- Database connection failures
- High error rates
- Rate limit violations

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Test with different user roles
5. Security review for auth changes

## 📄 License

Same as Ruth-AI Monitor project.
