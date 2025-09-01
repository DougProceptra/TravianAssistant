# TravianAssistant V4: AI-Powered Strategic Advisor
*Last Updated: August 31, 2025*
*Status: Beta - Chat Working, Data Scraping In Progress*

## Vision
Transform Travian gameplay from spreadsheet management to conversational AI strategy, enabling competitive play with minimal time investment.

## Current Implementation Status

### ✅ Working Components
- **Chat Interface**: Draggable, resizable, persistent position
- **AI Integration**: Claude via Vercel proxy providing responses  
- **Village Detection**: Parsing all 9 villages from overview
- **Database Storage**: Account snapshots in IndexedDB
- **Backend Server**: Running on Replit with game data
- **Extension Build**: v1.0.4 stable

### 🔧 In Progress
- **Resource Scraping**: Selectors need updating for current game version
- **Building Detection**: Not reading building levels correctly
- **Page Context**: Need to detect which page/building user is viewing
- **Server Configuration**: Need UI for server URL/speed settings

### 📋 Planned Features
- **Memory System**: Persist conversations and learning
- **Strategy Patterns**: Learn from player corrections
- **Alliance Integration**: Coordinate with alliance members
- **Automation Suggestions**: Queue optimization recommendations

## System Architecture

```
Chrome Extension (v1.0.4)
    ├── Content Script (scrapes game pages)
    │   ├── Overview Parser (gets villages) ✅
    │   ├── Safe Scraper (needs fixes) ⚠️
    │   └── AJAX Interceptor (captures API) ✅
    ├── Background Service (coordinates)
    │   ├── Message routing ✅
    │   └── Vercel API calls ✅
    └── Chat UI (user interface)
        ├── Draggable/Resizable ✅
        ├── Persistent position ✅
        └── Message history ✅
           ↓
    Vercel Proxy (CORS handler) ✅
           ↓
    Claude AI (Anthropic) ✅
           ↓
    Response displayed in chat ✅
    
Parallel Services:
    Replit Backend (port 3000) ✅
    ├── Game mechanics data ✅
    ├── Troop/building stats ✅
    └── Database storage ✅
```

## Key Features

### 1. Conversational Interface ✅
- Natural language questions about strategy
- Context-aware responses based on game state
- No forms or complex UIs - just chat

### 2. Real-Time Analysis ⚠️
- Scrapes current game state (villages only currently)
- Provides immediate recommendations
- Calculates optimal paths dynamically

### 3. Multi-Village Support ✅
- Tracks all 9 villages simultaneously
- Village names and populations detected
- Resource coordination (pending scraping fix)

### 4. Server-Specific Configuration 📋
- Supports 2x server speed (hardcoded currently)
- Multi-tribe village support (T4.6)
- Need UI for configuration

## User Experience Flow

1. **Install Extension** → Load in Chrome ✅
2. **Open Travian** → Extension auto-activates ✅
3. **Chat Appears** → Draggable window ready ✅
4. **Ask Questions** → Natural language input ✅
5. **Get Advice** → AI responds (without full context) ⚠️
6. **Take Action** → Follow recommendations in game

## Current Limitations & Solutions

### Problem: Resource Data Not Captured
**Symptom**: AI doesn't know actual resource amounts
**Cause**: Selectors outdated for current Travian version
**Solution**: Update selectors in `safe-scraper.ts`:
```javascript
// Need to update these selectors
resources: {
  wood: '#stockBar .wood .value',  // Find correct selector
  clay: '#stockBar .clay .value',
  iron: '#stockBar .iron .value', 
  crop: '#stockBar .crop .value'
}
```

### Problem: Building Levels Unknown
**Symptom**: AI can't see building progress
**Cause**: Building parser not implemented
**Solution**: Add building detection to scraper

### Problem: Server Configuration
**Symptom**: Hardcoded to 2x speed
**Cause**: No configuration UI
**Solution**: Add options page with server settings

## Data Scraping Status

### ✅ Working
- Village list from /dorf3.php
- Village names and populations  
- Account ID generation
- Database storage

### ❌ Not Working
- Resource amounts (wood/clay/iron/crop)
- Production rates
- Building levels
- Troop counts
- Current construction queue
- Hero status

### 📋 Needed Selectors
```javascript
// These need to be found and implemented
const selectors = {
  resources: {
    wood: '?', // Find in game
    clay: '?',
    iron: '?',
    crop: '?'
  },
  production: {
    wood: '?',
    clay: '?', 
    iron: '?',
    crop: '?'
  },
  buildings: {
    slots: '.buildingSlot',
    level: '.level',
    underConstruction: '.underConstruction'
  }
};
```

## Deployment Guide

### Chrome Extension
```bash
cd packages/extension
./build-minimal.sh  # Builds v1.0.4
# Load /dist folder in Chrome
```

### Backend Server (Replit)
```bash
cd backend
node server.js  # Runs on port 3000
```

### Vercel Proxy
- Already deployed: travian-proxy-simple.vercel.app
- No action needed

## Testing Checklist

### ✅ Verified Working
- [x] Extension loads without errors
- [x] Chat interface appears
- [x] Can drag and resize chat
- [x] Position persists on refresh
- [x] AI responds to questions
- [x] Villages are detected
- [x] Database stores snapshots

### ⚠️ Needs Verification
- [ ] Resource amounts captured
- [ ] Building levels detected
- [ ] Production rates calculated
- [ ] Troops counted
- [ ] Hero status tracked

### ❌ Known Issues
- [ ] Resource scraping broken
- [ ] No server configuration UI
- [ ] Backend connection not utilized
- [ ] Game mechanics not integrated

## Next Session Priorities

1. **Fix Resource Scraping** (30 mins)
   - Identify correct selectors
   - Update safe-scraper.ts
   - Test data capture

2. **Add Server Config** (30 mins)
   - Create options page
   - Store server URL and speed
   - Apply to calculations

3. **Connect Backend Data** (1 hour)
   - Query Replit for game mechanics
   - Integrate formulas
   - Enhance AI responses

4. **Memory System** (2 hours)
   - Design persistence layer
   - Implement context storage
   - Add learning capabilities

## Success Metrics

### Current Status
- Response time: ~2 seconds ✅
- Accuracy: Limited without game data ⚠️
- Manual entry: None required ✅

### Target Metrics
- Full game state capture
- 95% calculation accuracy
- <2 hours daily playtime
- Top-20 ranking achievement

## File Structure
```
/packages/extension/
├── dist/                    # Built extension (v1.0.4)
│   ├── manifest.json       # v1.0.4
│   ├── content.js          # 87KB bundled
│   └── background.js       # 5KB bundled
├── src/
│   ├── content/
│   │   ├── safe-scraper.ts      # Needs selector fixes
│   │   ├── overview-parser.ts   # Working
│   │   └── conversational-ai.ts # Working
│   └── background.ts             # Working
└── build-minimal.sh              # Build script

/backend/
├── server.js               # Running on port 3000
├── travian.db             # Initialized database
└── game-start-optimizer.js # Strategy engine

/data/
├── troops/                # Complete troop data
└── buildings/            # Complete building data
```

## Development Notes

### Build Process
```bash
# Version management
node scripts/version-manager.cjs set 1.0.5
node scripts/version-manager.cjs sync

# Build extension
./build-minimal.sh  # Simple, works
# OR
npm run build       # Full build, may have issues
```

### Debug Commands
```javascript
// In browser console on Travian
console.log(document.querySelector('#stockBar')); // Find resources
console.log(document.querySelectorAll('.buildingSlot')); // Find buildings
```

---
*"90% there - just needs the final 10% to connect everything together."*