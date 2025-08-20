# Testing the Extension Connection

## Quick Test Steps

### 1. Pull this branch in Replit
```bash
cd ~/workspace
git fetch origin
git checkout fix/connect-extension-to-proxy
```

### 2. Build the extension
```bash
cd packages/extension
npm install
npm run build
```

### 3. Load in Chrome
1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select the `packages/extension/dist` folder

### 4. Test the connection
1. Go to your Travian game page
2. Open Chrome DevTools (F12)
3. Go to the Console
4. You should see `[TLA BG] Background service initialized`
5. Click the AI Analysis button on the HUD

### 5. If it doesn't work, test manually
In the extension's background service console:
```javascript
// Test the proxy directly
fetch('https://travian-proxy-efheqvbxk-doug-dosta-proceptras-projects.vercel.app/api/anthropic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: 'Say "Connection successful"'
    }]
  })
}).then(r => r.json()).then(console.log);
```

## What was fixed
1. ✅ **manifest.json** - Added Vercel proxy URL to host_permissions
2. ✅ **background.ts** - Updated PROXY_URL to correct Vercel URL
3. ✅ **background.ts** - Fixed ANALYZE_GAME_STATE handler to use payload

## Troubleshooting

### "Server configuration error" 
- API key not set in Vercel environment variables
- Go to Vercel dashboard → Settings → Environment Variables
- Add `ANTHROPIC_API_KEY`

### CORS errors
- Make sure the URL in manifest.json matches exactly
- Rebuild the extension after changes

### No response
- Check Chrome DevTools → Network tab
- Look for the POST request to Vercel
- Check the response
