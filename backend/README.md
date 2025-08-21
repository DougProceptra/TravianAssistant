# TravianAssistant Backend Server

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run Locally
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

## Deploy to Replit

### Method 1: Import from GitHub
1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Choose "Import from GitHub"
4. Enter: `https://github.com/DougProceptra/TravianAssistant`
5. Replit will detect the backend folder

### Method 2: Manual Setup
1. Create new Repl (Node.js)
2. Copy these files:
   - `server-configurable.js` (rename to `server.js`)
   - `package.json`
   - `.env.example` (rename to `.env`)
3. Run in Shell: `npm install`
4. Click Run button

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string (optional)
- `EXTENSION_ID`: Your Chrome extension ID

### URLs After Deployment
Your Replit URLs will be:
- HTTP: `https://[repl-name].[username].repl.co`
- WebSocket: `wss://[repl-name].[username].repl.co`

Example:
- HTTP: `https://travianassistant-backend.dougproceptra.repl.co`
- WebSocket: `wss://travianassistant-backend.dougproceptra.repl.co`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and version.

### Sync Village Data
```
POST /api/villages
Body: {
  "accountId": "string",
  "village": { ... }
}
```

### Get Villages
```
GET /api/villages/:accountId
```

## WebSocket Events

### Client → Server
- `auth`: Authenticate with accountId
- `village_update`: Broadcast village update

### Server → Client
- `connection_established`: Initial connection
- `auth_success`: Authentication confirmed
- `village_update`: Village data update broadcast

## Testing

### Test Health Endpoint
```bash
curl https://your-backend.repl.co/api/health
```

### Test WebSocket
```javascript
const ws = new WebSocket('wss://your-backend.repl.co');
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', accountId: 'test123' }));
};
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## Troubleshooting

### Port Already in Use
Change PORT in .env file

### CORS Errors
Ensure your extension ID is in CORS origin list

### WebSocket Connection Failed
Check that both HTTP and WS use same port

### Replit Sleeping
Use UptimeRobot to ping every 5 minutes