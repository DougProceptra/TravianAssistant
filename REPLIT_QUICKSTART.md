# TravianAssistant Replit Quick Start Guide

## 🚀 Setup in 60 Seconds

### Step 1: Clone to Replit
1. Go to [Replit](https://replit.com)
2. Click "Create Repl" → "Import from GitHub"
3. Paste: `https://github.com/DougProceptra/TravianAssistant`
4. Click "Import from GitHub"

### Step 2: Initialize Backend
Run in Replit Shell:
```bash
chmod +x setup-replit.sh
./setup-replit.sh
```

### Step 3: Start Server
```bash
npm start
```

Your server is now running! Check the output for your URLs.

## 📱 Important URLs

Based on your Replit environment variables:
- **Backend URL**: `https://workspace.dougdostal.repl.co`
- **Admin Panel**: `https://workspace.dougdostal.repl.co/admin.html`
- **Health Check**: `https://workspace.dougdostal.repl.co/health`

## 🎮 Chrome Extension Setup

### Install Extension
1. Open Chrome → Extensions → Manage Extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `/packages/extension/dist` folder

### Configure Extension
1. Click extension icon in Chrome
2. Enter backend URL: `https://workspace.dougdostal.repl.co`
3. Enter your email (will be hashed for privacy)
4. Visit any Travian page to start!

## 🧪 Testing on New Server

Perfect timing for your new server! The Settlement Race Optimizer will:
- Track your CP accumulation
- Calculate optimal build orders
- Predict settlement time
- Manage hero adventures
- Plan oasis clearing

### Quick Test
1. Visit your Travian village
2. Open extension popup
3. Check "Settlement Race" tab
4. See real-time recommendations!

## 👥 Multi-Player Support

This backend supports 3-5 players simultaneously:
- Each player uses their own email
- Data is completely separated
- No cross-contamination
- Share the backend URL with teammates!

## 🔧 Troubleshooting

### Database Issues
```bash
# Reset database
rm -rf db/
node scripts/init-v3-database.js
```

### Port Already in Use
```bash
# Kill existing process
pkill node
npm start
```

### Extension Not Connecting
1. Check backend URL matches exactly
2. Verify CORS is enabled (it is by default)
3. Check browser console for errors

## 📊 Admin Dashboard

Visit `/admin.html` to see:
- Active players
- Village data
- AI recommendations
- System health
- Database statistics

## 🆘 Support

- GitHub Issues: [Create Issue](https://github.com/DougProceptra/TravianAssistant/issues)
- Documentation: `/docs` folder
- Session Context: `/docs/SESSION_CONTEXT.md`

## 🎯 What's Next?

1. **Test Settlement Optimizer**: Focus on fastest second village
2. **Import map.sql**: Get full server overview
3. **Configure AI**: Add Anthropic API key for smart recommendations
4. **Track Progress**: Use admin panel to monitor performance

---

*Ready to dominate the server? The race to settle begins NOW!* 🏰
