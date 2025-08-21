# TravianAssistant Team Testing Guide

## Quick Start (5 Minutes)

### Step 1: Download Extension
```bash
# Clone the repository
git clone https://github.com/DougProceptra/TravianAssistant.git

# Or download the zip from GitHub
```

### Step 2: Build Extension
```bash
cd TravianAssistant/packages/extension
npm install
npm run build
```

### Step 3: Load in Chrome
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `TravianAssistant/packages/extension/dist` folder
5. You should see the TravianAssistant icon in your extensions

### Step 4: Configure API Access
The extension uses a shared proxy at `https://travian-proxy-simple.vercel.app/api/proxy` - no API key needed on your end!

### Step 5: Test on Travian
1. Navigate to your Travian game
2. Look for the AI Assistant HUD on the right side
3. Click "Analyze Now" for instant recommendations
4. Click "Full Account Scan" to analyze all villages (takes ~30 seconds)

---

## Features to Test

### 1. 🎯 Multi-Village Analysis
- **Full Account Scan**: Analyzes all your villages
- **Smart Caching**: Updates every 30 minutes automatically
- **Resource Tracking**: Aggregates resources across all villages
- **Alert System**: Warns about resource overflow and incoming attacks

### 2. 💬 Conversational AI (Coming This Week)
Ask natural questions like:
- "How can I increase troop production?"
- "When can I settle my next village?"
- "What buildings should I prioritize?"
- "Should I focus on economy or military?"

### 3. 📊 Historical Tracking
- Stores 7 days of game data
- Tracks growth trends
- Identifies patterns in your gameplay

---

## What to Test and Report

### Priority Testing Areas

1. **Village Detection**
   - Does it find all your villages?
   - Does village switching work?
   - Check console for any errors

2. **Data Accuracy**
   - Are resources correct?
   - Is production calculated properly?
   - Do alerts make sense?

3. **AI Recommendations**
   - Are suggestions relevant?
   - Do they consider your full account?
   - Are they actionable?

4. **Performance**
   - How long does full scan take?
   - Any lag or freezing?
   - Memory usage reasonable?

### How to Report Issues

Please include:
1. **What happened**: Describe the issue
2. **Expected behavior**: What should have happened
3. **Steps to reproduce**: How can we recreate it
4. **Screenshots**: If applicable
5. **Console logs**: Press F12, go to Console tab, copy any red errors

Report via:
- GitHub Issues: https://github.com/DougProceptra/TravianAssistant/issues
- Direct message to Doug
- Team Discord/Slack channel

---

## Console Commands for Debugging

Open Chrome DevTools (F12) and try these in Console:

```javascript
// Check if extension loaded
console.log('[TLA Test] Extension loaded:', typeof enhancedScraper);

// Test current village scraping
enhancedScraper.scrapeCurrentVillage();

// Check IndexedDB data
indexedDB.open('TravianAssistantDB').onsuccess = (e) => {
  console.log('Database opened:', e.target.result);
};

// Force full account scan
enhancedScraper.scrapeFullAccount(true).then(console.log);

// Check village detection
villageNavigator.getVillages();
```

---

## Common Issues & Solutions

### Extension Not Loading
- Make sure you're in Developer Mode
- Check that you selected the `dist` folder, not `src`
- Try refreshing the extension

### No HUD Appearing
- Refresh the Travian page
- Check if you're on a supported page (village view, not login)
- Look for errors in console (F12)

### Village Switching Fails
- The selectors might be different on your server
- Send us the HTML of your village list for debugging
- Try manual full scan button instead

### API Errors
- The shared proxy should work automatically
- If you see "Proxy error", the Vercel function might be rate limited
- Wait 1 minute and try again

---

## Feature Requests

We want your input! What would make this more useful?

Current ideas:
- **Map Scanner**: Find farms and threats automatically
- **Alliance Coordination**: Share data with alliance members
- **Attack Planner**: Coordinate attacks with travel time calculator
- **Resource Balancer**: Auto-calculate optimal NPC trades
- **Building Queue Optimizer**: Plan building order for next 24 hours

---

## Privacy & Security

- **Local Storage**: Your game data is stored locally in your browser
- **API Calls**: Only sent when you click analyze (not automatic)
- **No Account Access**: Extension only reads visible page data
- **Open Source**: All code is available for review on GitHub

---

## Advanced Features (Optional)

### Export Your Data
```javascript
// In console:
dataStore.exportData().then(data => {
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `travian-data-${Date.now()}.json`;
  a.click();
});
```

### Clear Old Data
```javascript
// Remove data older than 1 day
dataStore.cleanOldData(1);
```

### Check Storage Usage
```javascript
navigator.storage.estimate().then(estimate => {
  console.log(`Using ${(estimate.usage/1024/1024).toFixed(2)}MB of ${(estimate.quota/1024/1024).toFixed(2)}MB`);
});
```

---

## Contact & Support

- **GitHub**: https://github.com/DougProceptra/TravianAssistant
- **Lead Developer**: Doug (via Discord/Slack)
- **Response Time**: Usually within 24 hours

---

## Version Info
- **Current Version**: v0.4.0 (Multi-village support)
- **Next Release**: v0.5.0 (Conversational AI) - Expected by Aug 28
- **Future**: v0.6.0 (Map Intelligence) - Early September

---

*Thank you for testing! Your feedback will help make this tool amazing for all Travian players.*
