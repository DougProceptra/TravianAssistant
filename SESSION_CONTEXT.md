# SESSION_CONTEXT.md
*Last Updated: August 31, 2025 4:45 PM MT*
*Session Focus: Extension → Backend Server Connection*

## ⚠️ CRITICAL: READ THIS FIRST FOR NEW SESSIONS ⚠️

### Required Context Documents
1. **THIS FILE** (`SESSION_CONTEXT.md`) - Current state and immediate tasks
2. **TravianAssistantV4.md** (in Google Drive) - Overall V4 architecture and design philosophy
3. **DEVELOPMENT_GUIDE.md** (in repo) - Technical implementation details

### GitHub Repository
- **Account**: DougProceptra (NOT dougproctor)
- **Repo**: TravianAssistant
- **All code lives in GitHub** - Do NOT look in Google Drive for code files

### Key Infrastructure
- **Chrome Extension**: In `/extension-v3/` and `/packages/extension/`
- **Backend Server**: Deployed on Replit at `https://TravianAssistant.dougdostal.replit.dev`
- **Vercel Proxy**: Working at `https://travian-proxy-simple.vercel.app`
- **Game Server**: 2x server at lusobr.x2.lusobrasileiro.travian.com

## Current Status (Aug 31, 2025)

### ✅ What's Working
1. **Game Data**: Complete troop/building data for ALL tribes (including Spartans/Vikings)
2. **Chrome Extension**: Scraping game state successfully
3. **Vercel Proxy**: Proxying Claude API calls without CORS issues
4. **Backend Server**: Running on Replit with WebSocket support
5. **Hero Mechanics**: Fully documented in `/data/hero/hero-mechanics.md`

### 🔴 Current Issues

#### 1. Wrong Background Service File
- **Problem**: Extension using old `background.js` (v0.4.2) instead of `service_worker.ts` (v0.5.1)
- **Impact**: Chat doesn't work because old file lacks CHAT_MESSAGE handler
- **Fix**: Update manifest.json to point to correct built file

#### 2. Backend Connection Points to Localhost
- **Problem**: Extension hardcoded to `ws://localhost:3002`
- **Impact**: Can't connect to Replit backend
- **Fix**: Make backend URL configurable, default to Replit

#### 3. Version Mismatch
- **Extension Version**: Shows v0.5.1 in UI
- **Manifest Version**: Shows v0.4.9
- **Background Service**: Running v0.4.2
- **Fix**: Align all versions during build

## V4 Architecture (AI-Powered Assistant)

### Core Philosophy (from TravianAssistantV4.md)
**V4 is NOT a calculator** - it's an AI assistant that:
- Understands context from what page you're viewing
- Asks clarifying questions instead of assuming
- Adapts strategy based on your specific situation
- Learns from your preferences and play style
- Provides conversational help, not fixed formulas

### Key Differences from V3
```javascript
// V3 Approach (Static Calculator)
function calculateSettlementTime(tribe, resources) {
  return fixedFormula(tribe, resources);
}

// V4 Approach (AI Conversation)
"I see you're Egyptian with those fields. Are you racing 
for a specific 15c? What's your gold budget? Based on 
your situation, I'd suggest..."
```

### Technical Architecture
```
Chrome Extension (Scrapes Game)
       ↓
Backend Server (Replit)
       ↓
Claude API (via Vercel Proxy)
       ↓
Contextual AI Response
```

## Immediate Tasks (Priority Order)

### 1. Fix Extension Background Service (30 mins)
```bash
# Check what's actually in dist/
ls -la packages/extension/dist/

# Ensure service_worker.ts is being built correctly
cd packages/extension
npm run build

# Verify manifest points to right file
cat dist/manifest.json | grep service_worker
```

### 2. Configure Backend URL (30 mins)
Update `/packages/extension/src/backend/backend-sync.ts`:
```typescript
// Change from:
const BACKEND_URL = 'ws://localhost:3002';

// To:
const BACKEND_URL = process.env.NODE_ENV === 'development' 
  ? 'ws://localhost:3002'
  : 'wss://TravianAssistant.dougdostal.replit.dev';
```

### 3. Test Chat Functionality (15 mins)
1. Rebuild extension with fixes
2. Load in Chrome
3. Navigate to Travian
4. Open chat interface
5. Verify it connects to Claude via backend

## File Locations Quick Reference

### Extension Files
- **Manifest**: `/packages/extension/manifest.json`
- **Background Service**: `/packages/extension/src/background/service_worker.ts`
- **Chat UI**: `/packages/extension/src/content/conversational-ai.ts`
- **Backend Sync**: `/packages/extension/src/backend/backend-sync.ts`

### Backend Files (on Replit)
- **Main Server**: `/backend/server.js`
- **AI Chat Handler**: `/backend/ai-chat-handler.js`
- **Database**: SQLite at `/backend/travian.db`

### Data Files
- **Troop Data**: `/data/troops/travian_all_tribes_complete.json`
- **Building Data**: `/data/buildings/buildings.json`
- **Hero Mechanics**: `/data/hero/hero-mechanics.md`

## Build & Deploy Process

### Extension Build
```bash
cd packages/extension
./build-simple.sh  # Creates dist/ folder
# Load dist/ folder in Chrome as unpacked extension
```

### Backend Deploy (Replit)
```bash
# Push to GitHub
git add -A
git commit -m "Update backend"
git push

# In Replit
git pull
npm install
# Click Run button
```

## Testing Checklist
- [ ] Extension loads without errors
- [ ] Game state scraping works
- [ ] Backend WebSocket connects
- [ ] Chat messages reach Claude
- [ ] AI responses display in UI
- [ ] Data syncs to backend database

## Common Issues & Solutions

### "Unknown message type: CHAT_MESSAGE"
**Cause**: Old background.js doesn't have handler
**Fix**: Ensure extension uses new service_worker.ts

### "WebSocket connection refused"
**Cause**: Trying to connect to localhost
**Fix**: Update to Replit URL

### "CORS error on API calls"
**Cause**: Direct calls to Anthropic API
**Fix**: Use Vercel proxy URL

### "Chat resets on page refresh"
**Known Issue**: Chat history not persisted yet
**TODO**: Store in backend database

## Session Handoff Notes
- Development happening on 2x speed server (faster for testing)
- Launch target: September 1, 2025 (tomorrow!)
- Doug plays Egyptians on this server
- Focus on getting chat working for user testing
- Backend has all game data, just needs connection

## Next Session Should Start With
1. Check this file for current state
2. Review TravianAssistantV4.md for design context
3. Verify which issues are still open
4. Continue from "Immediate Tasks" section

---
*Remember: The goal is an AI assistant that helps players make decisions, not a calculator that tells them what to do*