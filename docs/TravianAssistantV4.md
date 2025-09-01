# TravianAssistant V4: AI-Powered Game Assistant
*Last Updated: August 31, 2025*
*Server Launch: September 1, 2025*

## Core Concept: AI Agent, Not Calculator

TravianAssistant V4 is an **AI-powered game assistant** that provides dynamic, contextual advice based on your actual game state. No spreadsheets, no static calculators - just intelligent analysis of YOUR specific situation.

## How It Works

```
1. Chrome Extension scrapes your game state
2. Game Data Provider supplies complete mechanics
3. Claude AI analyzes your specific situation
4. Interactive chat provides personalized advice
5. Recommendations adapt to changing conditions
```

## Architecture Components

### 1. Chrome Extension (Browser Layer)
**Purpose**: Capture real-time game state
- Scrapes resources, buildings, troops, queues
- Detects current page context
- Injects chat HUD overlay
- Sends state to backend

**Key Files**:
- `/packages/extension/manifest.json` - Extension configuration
- `/packages/extension/src/content/index.ts` - Page scraping
- `/packages/extension/src/background/index.ts` - Service worker
- `/packages/extension/src/ai/game-data-provider.ts` - Data access ✅

### 2. Backend Service (AI Layer)
**Purpose**: Process questions with Claude AI
- Receives game state from extension
- Loads complete game mechanics data
- Formats prompts for Claude
- Manages conversation context
- Streams responses back

**Key Files**:
- `/server/ai-service.js` - Express server (TO CREATE)
- Game data files in `/data/` directory ✅

### 3. Game Data Provider (Knowledge Layer) ✅
**Purpose**: Supply complete game mechanics
- All troop stats for 9 tribes
- Building costs and times
- Training formulas
- Combat calculations
- Hero mechanics

**Status**: COMPLETE AND TESTED

### 4. Chat Interface (UI Layer)
**Purpose**: Natural interaction in-game
- Floating HUD overlay
- Message input/output
- Context-aware responses
- Draggable/collapsible

## The AI Difference

### Traditional Tools (What We DON'T Do)
❌ Static build orders  
❌ Fixed optimization paths  
❌ Generic spreadsheet formulas  
❌ One-size-fits-all strategies  

### AI-Powered Approach (What We DO)
✅ Analyzes YOUR current game state  
✅ Asks clarifying questions about YOUR goals  
✅ Calculates based on YOUR specific situation  
✅ Adapts recommendations as conditions change  
✅ Learns from patterns across sessions  

## Example Interactions

### Settlement Timing
```
Player: "When should I settle?"

AI: "I see you're Egyptian with 15/15/15/9 fields and 850 total production/hour.
     
     Questions to optimize my advice:
     1. Are you competing for a specific 15-cropper?
     2. What's your gold spending comfort level?
     3. Any aggressive neighbors spotted?
     
     Based on current state: You need 48,000 total resources for settlers.
     At current production, that's 56 hours of accumulation.
     With Residence at level 3, you need 7 more levels (≈30 hours).
     
     Realistic settlement: Day 6-7 if undisturbed, Day 8-9 if defending."
```

### Troop Composition
```
Player: "Should I build troops or upgrade fields?"

AI: "Looking at your Day 2 status with 200/hour production...
     
     Your neighbors:
     - Player at (5, -3): No alliance, 89 pop (likely inactive)
     - Player at (-2, 4): [ALLY] tag, 156 pop (potential threat)
     
     Recommendation: Build 10 Slave Militia first (2.5 hours of resources).
     This enables safe scouting. After confirming inactive status,
     you can raid for 300-500 resources per trip.
     
     Fields can wait until after your first successful raids."
```

## Current Implementation Status

### ✅ Complete
- Game data extraction (all 9 tribes)
- Data provider class with calculations
- Local testing environment
- Training formulas and combat mechanics

### 🚧 In Progress
- Chrome extension game state scraping
- Backend AI service setup
- Claude API integration
- Chat HUD interface

### 📋 TODO
- Connect extension to backend
- Implement conversation streaming
- Add error recovery
- Performance optimization

## Technical Specifications

### Data Storage
- **Format**: JSON files for game mechanics
- **Location**: `/data/` directory
- **Coverage**: All tribes, buildings, heroes
- **Server Speeds**: Separate tables per speed (1x, 2x, 3x, 5x)

### AI Configuration
```javascript
{
  model: "claude-3-sonnet",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "Complete Travian expert with access to game state...",
  includeGameData: true,
  includeFormulas: true
}
```

### Extension Permissions
```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["*://*.travian.com/*"],
  "content_scripts": [{
    "matches": ["*://*.travian.com/*"],
    "js": ["content.js"]
  }]
}
```

## Quick Start Guide

### 1. Test Locally
```bash
node test-ai-agent-local.js
```

### 2. Start Backend (once created)
```bash
node server/ai-service.js
```

### 3. Load Extension
1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → `/packages/extension/dist`

### 4. Use In-Game
1. Navigate to Travian
2. Look for chat icon or press hotkey
3. Ask questions naturally
4. Get contextual advice

## Success Metrics

### Launch Day (Sept 1)
- Extension loads without errors
- Scrapes game state accurately
- AI provides relevant responses
- Basic calculations work

### Week 1
- Top-20 settler achievement
- <2 hours daily gameplay
- Accurate strategic advice
- Positive user feedback

### Month 1
- Consistent top-20 ranking
- Advanced strategy optimization
- Pattern learning implemented
- Alliance coordination features

## Philosophy

**We don't tell you what to do.**  
We help you understand what you COULD do, based on your unique situation.

**We don't assume optimal conditions.**  
We adapt to reality - aggressive neighbors, limited gold, time constraints.

**We don't provide static solutions.**  
We offer dynamic analysis that evolves with your game.

---

*This is not a calculator. This is your personal Travian strategist, watching every move, understanding every constraint, and optimizing for YOUR success.*