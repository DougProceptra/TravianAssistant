# TravianAssistant Session Context
*Last Updated: September 3, 2025*

## Project Overview
TravianAssistant is a Chrome extension that provides AI-powered strategic advice for the browser game Travian Legends. The extension scrapes game state from the browser, sends it to Claude AI for analysis, and displays recommendations in a HUD overlay.

## Current Working State ✅

### 1. Chrome Extension HUD
- **Fully functional** drag-and-drop interface
- **Displays**: Resources, production, culture points, population, hero stats
- **Hero window**: Shows all stats including resource production (2.4k/2.4k/2.4k/2.4k /h)
- **Chat interface**: Opens, sends messages, gets AI responses

### 2. Data Collection
Successfully captures from game pages:
- **Culture Points**: Current/needed, daily rate, hours to settlement (from culture buildings)
- **Resources**: Current amounts and production rates (from dorf1.php)
- **Hero Data**: Level, experience, health, fighting strength, bonuses, resource production
- **Villages**: List with coordinates
- **Population**: Current village population

### 3. AI Integration
- **Working**: Chat connects to Claude via Vercel proxy
- **Model**: claude-sonnet-4-20250514
- **Proxy**: https://travian-proxy-simple.vercel.app/api/proxy

## The Problem: AI Lacks Game Context ❌

When users ask strategic questions, Claude responds without access to the actual game data that's been scraped. The data exists in the extension's memory but isn't passed to Claude.

### Current Data Flow
```
Game Page → Extension Scrapes → localStorage → HUD Display
                ↓
         Backend (stores it)
                ↓
           [DATA STOPS HERE - Claude can't access it]
```

### What Happens Now
User: "Should I build more resource fields?"
Claude: [Generic response without knowing user has 80k wood, 41k clay, etc.]

### What Should Happen
User: "Should I build more resource fields?"
Claude: "With your current 80k wood and 41k clay, and production at 1.3k/hour..."

## Next Priority: Connect Game Data to AI

### Solution: Include Full Game State in Messages
Modify the `sendMessage()` function in content.js to include complete game context:

```javascript
async sendMessage() {
  const input = document.querySelector('.ta-chat-input input');
  const message = input.value.trim();
  if (!message) return;
  
  // Build complete game context
  const gameContext = {
    resources: this.gameData.resources,        // {wood: 80000, clay: 41000, ...}
    production: this.gameData.production,      // {wood: 1300, clay: 1500, ...}
    culturePoints: this.gameData.culturePoints,// {current: 6500, needed: 10000, ...}
    heroData: this.gameData.heroData,         // {level: 39, resourceProduction: {...}}
    villages: this.gameData.villages,         // [{name: "Villages 9/10", x: -42, y: -17}]
    population: this.gameData.population,     // 796
    tribe: this.gameData.tribe,               // "egyptians"
    serverSpeed: CONFIG.serverSpeed           // 2
  };
  
  // Create contextual message that includes game state
  const contextualMessage = `
[Game Context - Travian Legends ${CONFIG.serverSpeed}x Server]
Current Resources: Wood ${gameContext.resources.wood}, Clay ${gameContext.resources.clay}, Iron ${gameContext.resources.iron}, Crop ${gameContext.resources.crop}
Production: Wood ${gameContext.production.wood}/h, Clay ${gameContext.production.clay}/h, Iron ${gameContext.production.iron}/h, Crop ${gameContext.production.crop}/h
Culture Points: ${gameContext.culturePoints.current}/${gameContext.culturePoints.needed} (${gameContext.culturePoints.hoursRemaining}h to next village)
Hero: Level ${gameContext.heroData.level}, Resource Production: ${gameContext.heroData.resourceProduction?.wood}/h per resource
Villages: ${gameContext.villages.length}
Population: ${gameContext.population}

User Question: ${message}`;
  
  // Send to AI with full context...
}
```

### Implementation Steps
1. **Update sendMessage()** to build comprehensive game context
2. **Format context** clearly for Claude to understand
3. **Update system prompt** to explain the context format
4. **Test** with game-specific questions

## Technical Details

### Key Files
- `/packages/extension/dist/content.js` - Complete working extension
- `/api/proxy.js` - Vercel proxy (working, don't change)
- Backend: `https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev`

### Extension Architecture
```javascript
class TravianHUD {
  gameData = {
    resources: {},         // Current resources
    production: {},        // Per-hour production
    culturePoints: {},     // CP data
    heroData: {},         // Hero stats including resource production
    villages: [],         // Village list
    population: 0,        // Current pop
    tribe: null          // Player tribe
  };
  
  captureHeroData()       // Captures hero resource allocation
  captureCulturePoints()  // Captures CP from culture buildings
  captureProduction()     // Captures resource production rates
  sendMessage()          // NEEDS UPDATE: Add game context here
}
```

### Hero Resource System
Travian Legends allows hero resource points to be:
1. **Distributed evenly** across all resources (e.g., 2400/hour each)
2. **Focused on one resource** (e.g., 8000/hour wood only)

The extension correctly captures whichever mode is selected.

## Game Context (Current Server)
- **Server**: ts20.x1.international.travian.com (2x speed)
- **Player**: Egyptians tribe
- **Villages**: 9/10 slots filled
- **Hero**: Level 39 with 100 points in resource production
- **Phase**: Mid-game (settling 10th village soon)

## Development Workflow
1. Edit in GitHub
2. Pull to local: `git pull origin main`
3. Reload extension: chrome://extensions
4. Test on game pages
5. Check console for [TLA] debug messages

## Testing Checklist
- [x] Culture points capture (visit Town Hall)
- [x] Resource production capture (visit dorf1.php)
- [x] Hero data capture (visit hero attributes)
- [x] Hero resource production display (shows 2.4k/2.4k/2.4k/2.4k /h)
- [ ] AI receives game context (NEXT PRIORITY)
- [ ] AI gives context-aware advice

## Future Enhancements
1. **Real-time monitoring**: Building queues, troop training, incoming attacks
2. **Farm list analysis**: Efficiency tracking and optimization
3. **Alliance coordination**: Shared defense planning
4. **mem0.ai integration**: Persistent memory across sessions
5. **Advanced analytics**: Resource forecasting, optimal build paths

## Repository Info
- **GitHub**: DougProceptra/TravianAssistant
- **Main branch**: All changes go here
- **Vercel proxy**: travian-proxy-simple (separate repo, working fine)
- **Replit backend**: Pulls from GitHub main branch