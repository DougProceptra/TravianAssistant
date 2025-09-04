# TravianAssistant Session Context
*Last Updated: September 4, 2025, 2:15 PM*

## Current Status: mem0 Integration Partially Working

### What's Working ✅
1. **Vercel Proxy**: Updated with full mem0 integration code at `travian-proxy-simple/api/proxy.js`
2. **Environment Variables**: `MEM0_API_KEY` is set in Vercel, `ANTHROPIC_API_KEY` working
3. **AI Chat**: Basic chat functionality working without memory
4. **HUD Display**: Shows resources, culture points, hero data (with some bugs)

### Critical Issue Identified 🔴
**The extension is using the WRONG content.js file!**

#### Investigation Results (Sept 4, 2025)
Vercel logs showed:
```
[Config] MEM0_API_KEY: Present
[Proxy] Request body keys: [ 'model', 'max_tokens', 'system', 'messages' ]
[Proxy] userId: NOT PROVIDED
[Proxy] Has gameState: false
[mem0] Skipping - userId: null MEM0_API_KEY: true
```

**Root Cause**: The extension is using the old `content.js` which:
- Uses `accountId` instead of `userId`
- Doesn't capture email for userId generation
- Doesn't send `gameState` with messages
- Sends old message format without mem0 fields

## Solution Ready to Implement

### Two Files Exist:
1. **`packages/extension/dist/content.js`** (Currently Active - OLD VERSION)
   - No email capture
   - No userId system
   - No gameState in messages
   - Uses deprecated `/api/anthropic` endpoint

2. **`packages/extension/dist/content-mem0.js`** (CORRECT VERSION)
   - Has email capture and hashing
   - Generates userId from hashed email
   - Sends full gameState with every message
   - Uses correct `/api/proxy` endpoint
   - Includes all mem0 integration code

### Implementation Steps for Next Session

#### Option A: Simple File Replacement (Quick but Risky)
```bash
# In the extension directory
cd packages/extension/dist/
cp content.js content-backup.js  # Backup first!
cp content-mem0.js content.js    # Replace with mem0 version

# Then in Chrome:
# 1. Go to chrome://extensions
# 2. Reload TravianAssistant
# 3. Clear localStorage and test
```

**⚠️ RISK**: The `content-mem0.js` file might be incomplete (it was truncated in the last check and shows "... rest of the existing methods stay the same ...")

#### Option B: Surgical Update (Safer)
Update the current working `content.js` with just the mem0 parts:

1. **Add to top of content.js**:
```javascript
// Email capture and hashing functions
async function getUserId() {
  let userId = localStorage.getItem('TLA_USER_ID');
  
  if (!userId) {
    const email = await showEmailPrompt();
    if (email) {
      userId = await hashEmail(email);
      localStorage.setItem('TLA_USER_ID', userId);
      localStorage.setItem('TLA_USER_EMAIL_MASKED', email.split('@')[0] + '@***');
    } else {
      userId = 'anon_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('TLA_USER_ID', userId);
    }
  }
  return userId;
}

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return 'user_' + hashHex.substring(0, 16);
}

function showEmailPrompt() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'tla-email-modal-wrapper';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 100000;
      "></div>
      <div style="
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 100001;
        max-width: 400px;
      ">
        <h3 style="margin-top: 0; color: #333;">TravianAssistant Setup</h3>
        <p style="color: #666;">Enter your email for personalized AI memory across sessions:</p>
        <input type="email" id="tla-email-input" placeholder="your.email@example.com" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          margin: 10px 0;
          box-sizing: border-box;
        "/>
        <p style="font-size: 11px; color: #999;">
          Your email is hashed locally for privacy. We never store or see your actual email.
        </p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="tla-email-skip" style="
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
          ">Skip (No Memory)</button>
          <button id="tla-email-submit" style="
            padding: 8px 16px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">Start</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('tla-email-submit').addEventListener('click', () => {
      const email = document.getElementById('tla-email-input').value;
      if (email && email.includes('@')) {
        modal.remove();
        resolve(email);
      } else {
        alert('Please enter a valid email address');
      }
    });
    
    document.getElementById('tla-email-skip').addEventListener('click', () => {
      modal.remove();
      resolve(null);
    });
    
    document.getElementById('tla-email-input').focus();
  });
}
```

2. **Update CONFIG object**:
```javascript
const CONFIG = {
  // ... existing fields ...
  userId: null,  // ADD THIS
  // accountId: localStorage.getItem('TLA_ACCOUNT_ID') || generateAccountId(), // REMOVE THIS
  proxyUrl: 'https://travian-proxy-simple.vercel.app/api/proxy', // CHANGE FROM /api/anthropic
};
```

3. **Add initUser method** to TravianHUD class:
```javascript
async initUser() {
  CONFIG.userId = await getUserId();
  console.log('[TLA] User initialized:', CONFIG.userId);
}
```

4. **Update constructor** to call initUser:
```javascript
constructor() {
  // ... existing code ...
  this.initUser().then(() => this.init()); // Replace this.init() with this
}
```

5. **Replace sendMessage method** with version that sends full context:
```javascript
async sendMessage() {
  const input = document.querySelector('.ta-chat-input input');
  const message = input.value.trim();
  if (!message) return;
  
  this.addMessage('user', message);
  input.value = '';
  
  const loadingMessage = this.addMessage('ai', '...');
  
  try {
    // Build comprehensive context for mem0
    const fullContext = {
      userId: CONFIG.userId,
      message: message,
      gameState: this.gameData,
      conversationId: sessionStorage.getItem('TLA_CONVERSATION_ID') || 
                     'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    
    // Send to Vercel proxy (which will handle mem0)
    const response = await fetch(CONFIG.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullContext)
    });
    
    if (!response.ok) throw new Error('API error: ' + response.status);
    
    const data = await response.json();
    this.removeLoadingMessage(loadingMessage);
    
    if (data.content && data.content[0]) {
      const aiResponse = data.content[0].text;
      this.addMessage('ai', aiResponse);
      
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      );
      
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }
    }
  } catch (error) {
    console.error('[TLA] AI Error:', error);
    this.removeLoadingMessage(loadingMessage);
    this.addMessage('ai', 'Error: ' + error.message);
  }
}
```

## Testing Checklist

1. **Clear Old Data**:
```javascript
// In Chrome DevTools Console
localStorage.removeItem('TLA_ACCOUNT_ID');
localStorage.removeItem('TLA_USER_ID');
```

2. **Reload Extension**:
   - Go to `chrome://extensions`
   - Click refresh on TravianAssistant

3. **Verify Email Prompt**:
   - Should appear on first load
   - Enter email or skip

4. **Check Vercel Logs** for successful mem0 operations:
```
[Proxy] userId: user_xxxxx
[Proxy] Has gameState: true
[mem0] Processing request for user: user_xxxxx...
✅ Retrieved X memories
✅ Memory stored successfully
```

5. **Test Memory**:
   - Say: "Remember I prefer defensive strategies"
   - Then: "What strategy do I prefer?"
   - Should recall the preference

## Related Files and Repositories

### GitHub Repositories
1. **Main App**: `DougProceptra/TravianAssistant`
   - Extension code in `/packages/extension/dist/`
   - Key files: `content.js`, `content-mem0.js`, `manifest.json`

2. **Vercel Proxy**: `DougProceptra/travian-proxy-simple`
   - Single file: `/api/proxy.js`
   - Auto-deploys to Vercel on push

### Important URLs
- **Vercel Proxy**: https://travian-proxy-simple.vercel.app/api/proxy
- **Replit Backend**: https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev

### Environment Variables
- **Vercel**: `MEM0_API_KEY`, `ANTHROPIC_API_KEY` (both set)
- **Replit**: `TLA_ANTHROPIC_API_KEY` (not needed for mem0)

## Known Issues to Address

1. **Hero Data Collection**: Some bugs in capturing hero stats
2. **Content-mem0.js Completeness**: File appears truncated, verify it has all methods
3. **Backend Endpoint**: Check if `/api/game-mechanics-context` exists in Replit

## Working Commit Reference

**Commit with working mem0**: `05b7d1b27f80ea493cbb198d1638e7be9c636877` (Sept 3, 2025)
- This commit had the complete working mem0 integration
- Can be used as reference if current files are incomplete

## Next Session Priority

1. **Implement Option B** (surgical update) to safely add mem0 to working extension
2. **Test mem0 memory storage and retrieval**
3. **Fix hero data collection bugs** (separate issue)
4. **Verify all game data is being captured and sent**

## Session Success Criteria

✅ Extension sends `userId` and `gameState` to proxy
✅ Vercel logs show mem0 operations (search and store)
✅ AI remembers information across messages
✅ No loss of existing functionality

---

## Previous Working State (Before mem0 Work)

### Chrome Extension HUD
- Fully functional drag-and-drop interface
- Displays: Resources, production, culture points, population, hero stats
- Hero window: Shows all stats including resource production
- Chat interface: Opens, sends messages, gets AI responses

### Data Collection
Successfully captures from game pages:
- Culture Points: Current/needed, daily rate, hours to settlement
- Resources: Current amounts and production rates
- Hero Data: Level, experience, health, fighting strength, bonuses
- Villages: List with coordinates
- Population: Current village population

### Technical Details
- **Chrome Extension**: `/packages/extension/dist/content.js`
- **Vercel Proxy**: `travian-proxy-simple/api/proxy.js`
- **Backend**: Replit server at provided URL
- **Game Server**: ts20.x1.international.travian.com (2x speed)

---

*Note: All code and configuration needed for implementation is included above. The mem0 integration in the Vercel proxy is complete and working - only the extension needs updating to send the correct data format.*