# Deploying TravianAssistant Backend

## Option 1: Deploy to Replit (Recommended for Quick Start)

### Step 1: Create Replit Account
1. Go to https://replit.com and sign up (free)
2. Click "+ Create Repl"
3. Choose "Import from GitHub"
4. Paste: `https://github.com/DougProceptra/TravianAssistant`
5. Name it: `travian-backend`
6. Click "Import from GitHub"

### Step 2: Configure Replit
1. In Replit, navigate to the `backend` folder
2. Open the Shell (bottom panel) and run:
```bash
cd backend
npm install
```

### Step 3: Create Start Script
1. In Replit, click "+ New File" 
2. Name it `.replit` (in root, not backend folder)
3. Add this content:
```toml
run = "cd backend && npm start"

[nix]
channel = "stable-22_11"

[env]
PORT = "3000"
```

### Step 4: Start the Server
1. Click the green "Run" button at the top
2. You should see:
```
Database initialized
Backend server running on http://localhost:3000
WebSocket server running on ws://localhost:3002
```

### Step 5: Get Your Server URL
1. In the Webview panel, you'll see your app
2. Copy the URL - it will be something like:
   `https://travian-backend.YOUR-USERNAME.repl.co`

### Step 6: Configure Extension
1. In Chrome, right-click the TLA extension icon
2. Click "Options" or go to `chrome-extension://[extension-id]/src/options/index.html`
3. Check "Enable Backend Sync"
4. Enter your Replit URL: `https://travian-backend.YOUR-USERNAME.repl.co`
5. Click "Test Connection"
6. You should see "✅ Backend connection successful!"

---

## Option 2: Local Development

### Requirements
- Node.js 16+ installed
- Git installed

### Setup
```bash
# Clone the repository
git clone https://github.com/DougProceptra/TravianAssistant.git
cd TravianAssistant/backend

# Install dependencies
npm install

# Start the server
npm start
```

### Configure Extension for Local
1. Open extension options
2. Check "Enable Backend Sync"
3. Use URL: `http://localhost:3001`
4. Click "Test Connection"

---

## Option 3: Deploy to Production (Advanced)

### Using Railway.app
1. Go to https://railway.app
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select your forked TravianAssistant repo
5. Add environment variable: `PORT=3001`
6. Deploy

### Using Render.com
1. Go to https://render.com
2. New > Web Service
3. Connect GitHub repo
4. Build Command: `cd backend && npm install`
5. Start Command: `cd backend && npm start`
6. Deploy

---

## Troubleshooting

### "Connection Refused" Error
- Make sure backend server is running (check Replit console)
- Verify the URL in extension settings matches your server
- Check if Replit app is awake (free tier sleeps after inactivity)

### WebSocket Not Connecting
- Replit uses same port for HTTP and WebSocket
- Extension automatically handles this for Replit URLs
- For local development, WebSocket runs on port 3002

### Database Issues
- SQLite database is created automatically as `travian.db`
- On Replit, database persists between restarts
- To reset database, delete `travian.db` file and restart

### Replit Free Tier Limitations
- Server sleeps after ~30 minutes of inactivity
- First request after sleep takes ~10 seconds to wake up
- Solution: Upgrade to Replit Hacker plan ($7/month) for always-on

---

## Testing Backend

Once deployed, test these endpoints:

1. **Health Check**:
   ```
   https://your-server.repl.co/api/account/test
   ```
   Should return: `{"message":"Backend is working!"}`

2. **In Extension**:
   - Open any Travian page
   - Click "Quick Analyze"
   - Check Chrome DevTools Console for:
     ```
     [TLA Backend] Sync complete
     ```

3. **View Your Data**:
   ```
   https://your-server.repl.co/api/account/YOUR_ACCOUNT_ID
   ```

---

## Multi-User Setup

The backend supports multiple users automatically:

1. Each browser/extension gets unique account ID
2. Data is isolated per account
3. Share your backend URL with friends
4. They configure their extension with your URL
5. Everyone's data stays separate

To share:
1. Give friends your Replit URL
2. They install the extension
3. They enter your URL in settings
4. Each person's game data is tracked separately

---

## Monitoring

### Check Server Status
- Replit: Check the Console tab for logs
- Local: Check terminal output
- Database: Download `travian.db` and open with SQLite viewer

### View Logs
```bash
# In Replit Shell or local terminal
cd backend
tail -f console.log  # If you redirect output
```

### Database Inspection
```bash
# In Replit Shell
cd backend
sqlite3 travian.db
.tables  # Show all tables
SELECT * FROM villages;  # View villages
.quit
```