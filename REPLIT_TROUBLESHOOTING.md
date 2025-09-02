# Replit Troubleshooting Guide

## ✅ YES, This Setup Solves the Previous Issues!

### What Was Fixed:

1. **Server Start Issues** ✅
   - Now uses `replit-start.js` wrapper that handles initialization
   - Automatically creates directories on first run
   - Installs dependencies if missing
   - Initializes database automatically

2. **Preview Window Issues** ✅
   - Server binds to `0.0.0.0:3000` (required for Replit)
   - HTML landing page shows immediately
   - Admin dashboard accessible at `/admin.html`
   - All endpoints return proper responses

3. **Port Configuration Issues** ✅
   - Fixed duplicate port mappings in `.replit`
   - Server uses PORT environment variable
   - Correct internal/external port mapping

4. **URL Detection Issues** ✅
   - Auto-detects Replit environment variables
   - Shows correct public URL in console
   - Landing page displays proper URLs

## 🚀 How to Use Replit's Interface

### Using the Run Button
1. Click the green **Run** button at the top
2. Wait for "Server running on 0.0.0.0:3000" message
3. The preview window will automatically open
4. You'll see the TravianAssistant dashboard

### Using the Preview Window
- **Webview tab**: Shows your server's landing page
- **Console tab**: Shows server logs
- **Shell tab**: For running commands

### Getting Your Public URL
Your server is accessible at:
```
https://workspace.dougdostal.repl.co
```
This URL is:
- Shown in the console when server starts
- Displayed on the landing page
- Used for Chrome extension configuration

## 🔧 Common Issues & Solutions

### Issue: "Cannot GET /" in preview
**Solution**: Server is still starting. Wait 5-10 seconds and refresh.

### Issue: Preview window is blank
**Solution**: 
1. Check Console tab for errors
2. Click refresh button in preview window
3. Open in new tab using the external link icon

### Issue: "Port 3000 already in use"
**Solution**:
```bash
# In Shell tab:
pkill node
npm start
```

### Issue: Database not found
**Solution**:
```bash
# In Shell tab:
npm run reset:db
npm start
```

### Issue: Dependencies missing
**Solution**:
```bash
# In Shell tab:
npm install
npm start
```

### Issue: Server crashes immediately
**Solution**:
1. Check for syntax errors in console
2. Run setup script:
```bash
npm run setup
npm start
```

## 📊 Verifying Everything Works

### Quick Health Check
1. Visit: `https://workspace.dougdostal.repl.co/health`
2. Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected",
  "uptime": ...
}
```

### Admin Dashboard Check
1. Visit: `https://workspace.dougdostal.repl.co/admin.html`
2. Should show:
   - Database statistics
   - Player count
   - System status

### API Endpoint Check
1. Visit: `https://workspace.dougdostal.repl.co/api/status`
2. Should return JSON with server info

## 🎯 Step-by-Step First Run

1. **In Replit:**
   - Fork/Import the repository
   - Wait for environment to load

2. **Click Run Button:**
   - First run will take 30-60 seconds
   - Watch console for progress messages
   - Preview will open automatically

3. **Verify in Preview:**
   - See "TravianAssistant Backend Server"
   - Note your URLs
   - Check database statistics

4. **Configure Extension:**
   - Build extension: `npm run build:extension`
   - Load in Chrome
   - Set backend URL from preview page

## 🆘 Emergency Reset

If nothing else works:
```bash
# Complete reset
rm -rf node_modules db/ package-lock.json
npm install
npm run init:db
npm start
```

## 📝 What's Different from Standard Node Setup

1. **Port Binding**: Must use `0.0.0.0` not `localhost`
2. **Environment**: Replit provides special env variables
3. **File System**: Persistent in `/home/runner/workspace`
4. **URLs**: Public URL is `https://[REPL_SLUG].[REPL_OWNER].repl.co`
5. **Preview**: Automatically opens when server starts on port 3000

## ✅ Success Indicators

You know it's working when:
1. ✅ Console shows "Server running on 0.0.0.0:3000"
2. ✅ Preview window shows the dashboard
3. ✅ URLs are displayed in console
4. ✅ Health check returns "healthy"
5. ✅ No red errors in console

## 🎉 It Should Just Work!

With these fixes, you should be able to:
1. Click **Run** in Replit
2. See the server start successfully
3. View the preview window with dashboard
4. Copy your URL for extension config
5. Start testing immediately!

No more manual server management needed - Replit's Run button handles everything!
