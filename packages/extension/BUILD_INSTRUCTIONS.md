# Extension Build & Deploy Instructions

## 📥 Step 1: Pull Latest Changes

```bash
cd ~/workspace
git pull origin main
```

## 🔨 Step 2: Build the Extension

```bash
cd packages/extension
npm install
npm run build
```

## 📦 Step 3: Files Created

After building, check the `dist` folder:
```bash
ls -la dist/
# Should contain:
# - manifest.json
# - background.js
# - content.js
# - options.html
# - popup.html
# - *.png (icons)
```

## 🔧 Step 4: Load in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `packages/extension/dist` folder
5. Extension should appear with version 0.4.4

## ✅ Step 5: Test Backend Connection

1. Go to any Travian page
2. Open Chrome DevTools (F12)
3. Go to Console
4. Look for messages like:
   - `[TLA Backend] Using API URL: https://TravianAssistant.dougdostal.replit.dev/api`
   - `[TLA Backend] WebSocket connected`
   - `[TLA Backend] Initialized with account: account_...`

## 🧪 Step 6: Test Features

### Test AI Analysis:
1. Click on extension icon
2. Click "Analyze Current State"
3. Should see AI recommendations

### Test Backend Sync:
1. The extension automatically syncs every 5 minutes
2. Check console for `[TLA Backend] Sync complete`
3. Check your Replit server logs for incoming data

## 🚀 Step 7: Production Deployment

When ready for others to use:

1. Create release build:
```bash
npm run build:prod
```

2. Create ZIP for distribution:
```bash
cd dist
zip -r ../TravianAssistant-v0.4.4.zip *
```

3. Share the ZIP file with others

## 🔍 Troubleshooting

### Extension not loading?
- Check manifest.json is valid JSON
- Ensure all files are in dist/ folder
- Try removing and re-adding extension

### Backend not connecting?
- Check Replit server is running
- Verify URL in console logs
- Check for CORS errors

### WebSocket not connecting?
- Ensure Replit server shows WebSocket running
- Check browser console for WebSocket errors
- Try refreshing the page

## 📝 Notes

- Backend URL is set to: `https://TravianAssistant.dougdostal.replit.dev`
- Backend is enabled by default
- WebSocket uses same URL with wss:// protocol
- Data syncs every 5 minutes automatically