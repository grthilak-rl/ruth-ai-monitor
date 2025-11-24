# Ruth-AI Monitor - Claude Code Instructions

## Code Style
- DO NOT use emojis in code, comments, or commit messages
- Use clear, descriptive variable and function names
- Follow existing code patterns in the repository

## Port Configuration

### Frontend (Web UI)
- **Port**: 3004 (FIXED - configured in vite.config.mjs with strictPort: true)
- **URL**: http://10.30.250.245:3004
- **Note**: Always use port 3004 for Ruth-AI frontend. Do not change to 3008 or any other port.

### Backend Services (Docker)
- API Gateway (Nginx): 3005 (HTTP), 3006 (HTTPS)
- Database (MySQL): 3308
- Redis: 6381
- Auth Service: 3000 (internal)
- Camera Service: 3000 (internal)
- Violation Service: 3000 (internal)
- Notification Service: 3000 (internal)
- AI Models Service: 8000 (internal)

### VAS v2 (External)
- VAS Frontend: http://10.30.250.245:3000
- VAS API: http://10.30.250.245:8080
- MediaSoup WebSocket: ws://10.30.250.245:3001

## VAS Integration
- Ruth-AI Monitor uses VAS v2 for video streaming (MediaSoup-based)
- Cameras are fetched directly from VAS v2 API
- VAS_REQUIRE_AUTH=false for development (no API key needed)
- Stream control is handled through Ruth-AI backend which proxies to VAS v2

## Important Notes
- Frontend must always run on port 3004
- CORS is configured for port 3004 in all backend services
- If port 3004 is occupied, the application will fail to start (strictPort: true)
