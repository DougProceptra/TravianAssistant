# TravianAssistant v0.4.0 - Quick Start Guide

## What's Fixed in This Session

✅ **Conversational AI** - Chat interface now works with Claude
✅ **Alert System** - Alerts stored in SQLite database and displayed in UI
✅ **Backend Storage** - Simple local SQLite database for persistent data
✅ **Multi-Village Support** - Village navigator for switching between villages
✅ **WebSocket Updates** - Real-time sync between extension and backend

## Setup Instructions (10 minutes)

### 1. Start the Backend Server

```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Start the server
npm start
```

You should see:
```
Database initialized
Backend server running on http://localhost:3001
WebSocket server running on ws://localhost:3002
```

### 2. Build and Load the Extension

```bash
# In another terminal, navigate to extension
cd packages/extension

# Install dependencies (if not done already)
npm install

# Build the extension
npm run build
```

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `packages/extension/dist` folder
5. You should see "Travian Legends Assistant v0.4.0" in your extensions

### 4. Test on Travian

1. Go to your Travian game: https://lusobr.x2.lusobrasileiro.travian.com/dorf1.php
2. You should see the TLA HUD in the top-right corner
3. Click "🔄 Quick Analyze" to scrape current village
4. Click "💬 Ask Question" to test the chat AI
5. Click "📊 Full Scan" to collect all villages (if you have multiple)

## Features Now Working

### 1. Chat with AI
- Click the "💬 Ask Question" button
- Type questions like:
  - "What should I build next?"
  - "How can I increase wood production?"
  - "When should I settle my next village?"
- AI responds with context from your actual game state

### 2. Alert System
- Automatic overflow warnings when resources near capacity
- Starvation alerts when crop goes negative
- Alerts stored in database and displayed in HUD
- Critical alerts shown in red, high priority in orange

### 3. Data Persistence
- All village data saved to `backend/travian.db` (SQLite)
- Historical tracking for trend analysis
- Data survives browser/extension restarts
- Can export/analyze data with any SQLite tool

### 4. Backend Dashboard (Optional)

View your data in the backend:

```bash
# Check your account data
curl http://localhost:3001/api/account/[your-account-id]

# View village history
curl http://localhost:3001/api/history/[village-id]?hours=24
```

## Architecture Overview

```
[Travian Game Page]
        ↓
[Content Script] → Scrapes game data
        ↓
[Background Service] → Processes data
        ↓
    ┌───┴───┐
    ↓       ↓
[Claude AI] [Local Backend]
    ↓       ↓
[Analysis] [SQLite DB]
    ↓       ↓
    └───┬───┘
        ↓
[HUD Display] → Shows recommendations & alerts
```

## Database Structure

SQLite database at `backend/travian.db` contains:

- **accounts** - Your game accounts
- **villages** - All villages in your account
- **village_snapshots** - Historical data every 5 minutes
- **alerts** - All generated alerts with severity

## Troubleshooting

### Chat not working?
1. Check backend is running: `http://localhost:3001`
2. Check Chrome console for errors (F12)
3. Verify Vercel proxy is accessible

### No data syncing?
1. Ensure backend server is running
2. Check WebSocket connection on port 3002
3. Look for "[TLA Backend]" messages in console

### Alerts not showing?
1. Run "Quick Analyze" first to collect data
2. Check backend logs for alert generation
3. Alerts only trigger when resources are near limits

## Next Development Steps

### High Priority
1. **Fix scraping accuracy** - Get actual warehouse/granary capacities
2. **Troop tracking** - Scrape barracks and rally point
3. **Building details** - Get actual building levels and queues

### Medium Priority
1. **Web dashboard** - Visual interface for data analysis
2. **Multi-account** - Support multiple Travian accounts
3. **Alliance features** - Share data with friends

### Low Priority
1. **Mobile app** - View alerts on phone
2. **Advanced AI** - Pattern learning and predictions
3. **Auto-actions** - Queue management assistance

## Data You Can Now Access

With the backend running, you have:

1. **Real-time game state** in the extension
2. **Historical data** in SQLite database
3. **Trend analysis** via API endpoints
4. **Alert history** for pattern detection
5. **Multi-village aggregates** for empire overview

## For Your Testing Friends

To share with friends:

1. Give them this repository
2. They run their own backend locally
3. Extension will create unique account IDs
4. Later: Add multi-tenant support to share a backend

## Support

Issues? Check:
- Chrome Console: F12 → Console tab
- Backend logs: Terminal where you ran `npm start`
- Database: Use any SQLite viewer to inspect `travian.db`

---

**Ready to test!** The core features are now working. The priority is improving data collection accuracy for better AI recommendations.