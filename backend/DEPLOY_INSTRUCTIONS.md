# Backend Deployment Instructions

## 📥 Step 1: Pull Latest Changes

```bash
# In your Replit shell or local terminal
cd backend
git pull origin main
```

## 📦 Step 2: Install Dependencies

```bash
npm install
```

## ⚙️ Step 3: Configure Environment

```bash
# Create .env file from template
cp .env.example .env

# Edit .env file with your settings
# Set PORT=3002 or your preferred port
# Add MONGODB_URI if using MongoDB (optional)
```

## 🚀 Step 4: Run the Server

```bash
# For production
node server.js

# For development with auto-reload
npm run dev
```

## 🧪 Step 5: Test the Backend

### Test Health Endpoint
```bash
curl http://localhost:3002/api/health
# Should return: {"status":"healthy","version":"1.0.0",...}
```

### Test from Browser
Open: http://localhost:3002
Should see: API information JSON

### Test WebSocket (in browser console)
```javascript
const ws = new WebSocket('ws://localhost:3002');
ws.onopen = () => {
  console.log('Connected!');
  ws.send(JSON.stringify({ type: 'auth', accountId: 'test123' }));
};
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

## 🌐 For Replit Deployment

After running the server, your URLs will be:
- HTTP: `https://[your-repl-name].[username].repl.co`
- WebSocket: `wss://[your-repl-name].[username].repl.co`

Example:
- HTTP: `https://travianassistant-backend.dougproceptra.repl.co`
- WebSocket: `wss://travianassistant-backend.dougproceptra.repl.co`

## 🔧 Extension Configuration

Once backend is running, update your extension's backend-sync.ts:

```typescript
const config = {
  httpUrl: 'https://your-backend.repl.co',
  wsUrl: 'wss://your-backend.repl.co'
};
```

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Change port in .env file
PORT=3003
```

### MongoDB Connection Failed
- Check MONGODB_URI in .env
- MongoDB is optional - server works without it

### CORS Errors
- Extension ID is already whitelisted
- Check browser console for specific error

### Replit Sleeping
- Use UptimeRobot to ping every 5 minutes
- Or upgrade to Replit's paid plan

## 📝 Notes

- `server.js` - Main configurable server (use this)
- `server-sqlite.js` - Alternative SQLite version (local only)
- MongoDB is optional - server works without database