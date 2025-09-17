# Notification Service

A microservice for managing notifications, alerts, and real-time communication in the Ruth-AI Monitor system.

## Overview

The Notification Service handles:
- **Notification Management**: CRUD operations for notifications
- **Real-time Communication**: Socket.IO for live updates
- **Multi-channel Delivery**: In-app, email, SMS, webhook notifications
- **User Preferences**: Customizable notification settings
- **Templates**: Predefined notification formats
- **Broadcasting**: System-wide announcements
- **Analytics**: Notification statistics and metrics

## Features

### Core Functionality
- ✅ Create, read, update, delete notifications
- ✅ Real-time Socket.IO communication
- ✅ Multi-channel notification delivery
- ✅ User notification preferences
- ✅ Notification templates
- ✅ Broadcast notifications
- ✅ Notification statistics
- ✅ Health monitoring

### Notification Types
- **Violation Alerts**: Safety violations detected by AI
- **System Alerts**: Service status, errors, maintenance
- **User Notifications**: Account updates, password changes
- **Broadcast Messages**: System-wide announcements

### Channels
- **In-App**: Real-time notifications in the web interface
- **Email**: SMTP email delivery
- **SMS**: Twilio SMS integration
- **Webhook**: HTTP POST to external systems

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client   │    │  External API   │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │    Notification Service    │
                    │  ┌─────────────────────────┐│
                    │  │     Express.js API      ││
                    │  └─────────────────────────┘│
                    │  ┌─────────────────────────┐│
                    │  │     Socket.IO Server    ││
                    │  └─────────────────────────┘│
                    │  ┌─────────────────────────┐│
                    │  │   Notification Engine   ││
                    │  └─────────────────────────┘│
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │      MySQL Database        │
                    │  ┌─────────────────────────┐│
                    │  │    notifications        ││
                    │  │  notification_prefs     ││
                    │  │  notification_templates ││
                    │  └─────────────────────────┘│
                    └─────────────────────────────┘
```

## API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /health/socket` - Socket.IO health check
- `GET /` - Service information

### Notifications
- `GET /notifications` - List notifications (paginated)
- `GET /notifications/:id` - Get specific notification
- `POST /notifications` - Create notification
- `PUT /notifications/:id` - Update notification
- `DELETE /notifications/:id` - Delete notification
- `POST /notifications/broadcast` - Broadcast notification
- `GET /notifications/stats` - Get notification statistics

### User Preferences
- `GET /notifications/preferences` - Get user preferences
- `PUT /notifications/preferences` - Update user preferences
- `POST /notifications/preferences/reset` - Reset to defaults

### Templates
- `GET /notifications/templates` - List notification templates
- `GET /notifications/templates/:id` - Get specific template
- `POST /notifications/templates` - Create template
- `PUT /notifications/templates/:id` - Update template
- `DELETE /notifications/templates/:id` - Delete template

### Channels
- `GET /notifications/channels` - List notification channels
- `PUT /notifications/channels/:id` - Update channel settings

## Socket.IO Events

### Client → Server
- `join_room` - Join notification room
- `leave_room` - Leave notification room
- `mark_read` - Mark notification as read
- `get_preferences` - Get user preferences

### Server → Client
- `notification` - New notification received
- `notification_read` - Notification marked as read
- `notification_deleted` - Notification deleted
- `preferences_updated` - User preferences updated
- `broadcast` - System broadcast message

## Database Schema

### notifications
```sql
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('violation', 'system', 'user', 'broadcast') NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  channels JSON NOT NULL,
  recipient_type ENUM('user', 'role', 'all') NOT NULL,
  recipient_id VARCHAR(36),
  recipient_role VARCHAR(50),
  metadata JSON,
  scheduled_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### notification_preferences
```sql
CREATE TABLE notification_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_channel (user_id, channel)
);
```

### notification_templates
```sql
CREATE TABLE notification_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('violation', 'system', 'user', 'broadcast') NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables JSON,
  channels JSON NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Environment Variables

```bash
# Service Configuration
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ruth_ai_monitor
DB_USER=ruth_ai_user
DB_PASSWORD=your_password

# JWT Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:3000

# Notification Channels
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

WEBHOOK_URL=https://your-webhook-endpoint.com/notifications
```

## Installation

### Using Docker (Recommended)

```bash
# Build the image
docker build -t notification-service .

# Run the container
docker run -d \
  --name notification-service \
  -p 3000:3000 \
  -e DB_HOST=your_db_host \
  -e DB_USER=your_db_user \
  -e DB_PASSWORD=your_db_password \
  -e JWT_SECRET=your_jwt_secret \
  notification-service
```

### Manual Installation

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the service
npm start
```

## Testing

### Run Test Suite

```bash
# Test the service
node test_service.js

# Test with custom URL
node test_service.js http://localhost:3000
```

### Test Coverage

The test suite covers:
- ✅ Health endpoints
- ✅ Notification CRUD operations
- ✅ Socket.IO functionality
- ✅ Authentication
- ✅ Error handling
- ✅ Data validation

### Manual Testing

```bash
# Health check
curl http://localhost:3000/health

# Get notification stats
curl http://localhost:3000/notifications/stats

# Get notification templates
curl http://localhost:3000/notifications/templates

# Get notification channels
curl http://localhost:3000/notifications/channels

# Socket health check
curl http://localhost:3000/health/socket
```

## Usage Examples

### Create Notification

```javascript
const notification = {
  title: 'Safety Violation Detected',
  message: 'Person detected without safety helmet in Zone A',
  type: 'violation',
  severity: 'high',
  channels: ['in_app', 'email'],
  recipient_type: 'role',
  recipient_role: 'safety_manager',
  metadata: {
    camera_id: 'cam-001',
    zone: 'Zone A',
    violation_type: 'no_helmet',
    confidence: 0.95
  }
};

const response = await fetch('/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(notification)
});
```

### Socket.IO Client

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Update UI, show toast, etc.
});

// Join notification room
socket.emit('join_room', 'notifications');

// Mark notification as read
socket.emit('mark_read', notificationId);
```

### Broadcast Notification

```javascript
const broadcast = {
  title: 'System Maintenance',
  message: 'Scheduled maintenance will begin at 2:00 AM',
  type: 'system',
  severity: 'medium',
  channels: ['in_app', 'email']
};

const response = await fetch('/notifications/broadcast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(broadcast)
});
```

## Integration

### With Other Services

The Notification Service integrates with:

- **Auth Service**: User authentication and authorization
- **Violation Service**: Safety violation notifications
- **Camera Service**: Camera status notifications
- **AI Models Service**: AI detection notifications

### API Gateway

```javascript
// Route notifications through API Gateway
app.use('/api/notifications', proxy('http://notification-service:3000'));
```

### Frontend Integration

```javascript
// React component for notifications
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <div className="notification-center">
      {notifications.map(notification => (
        <div key={notification.id} className="notification">
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
}
```

## Monitoring

### Health Checks

```bash
# Service health
curl http://localhost:3000/health

# Socket.IO health
curl http://localhost:3000/health/socket

# Database health
curl http://localhost:3000/health/database
```

### Metrics

The service provides metrics for:
- Total notifications sent
- Notification delivery success rate
- Socket.IO connection count
- Database query performance
- Channel-specific statistics

### Logging

Logs are structured JSON format:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "notification-service",
  "message": "Notification sent successfully",
  "notification_id": "123e4567-e89b-12d3-a456-426614174000",
  "channel": "in_app",
  "recipient": "user-123"
}
```

## Troubleshooting

### Common Issues

1. **Socket.IO Connection Failed**
   - Check CORS configuration
   - Verify JWT token validity
   - Ensure port 3000 is accessible

2. **Database Connection Error**
   - Verify database credentials
   - Check network connectivity
   - Ensure database is running

3. **Notification Not Sent**
   - Check channel configuration
   - Verify recipient exists
   - Review error logs

### Debug Mode

```bash
# Enable debug logging
DEBUG=notification-service:* npm start
```

### Performance Tuning

- **Database Indexing**: Add indexes on frequently queried columns
- **Connection Pooling**: Configure database connection pool
- **Caching**: Implement Redis for notification caching
- **Rate Limiting**: Add rate limiting for notification creation

## Security

### Authentication
- JWT token validation
- Role-based access control
- API key authentication for webhooks

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Rate Limiting
- Per-user notification limits
- Channel-specific rate limits
- API endpoint rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
