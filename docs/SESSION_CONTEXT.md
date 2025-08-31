# SESSION_CONTEXT.md
*Last Updated: August 31, 2025 3:45 PM MT*
*Server Launch: September 1, 2025 (TOMORROW!)*

## 🚨 PARADIGM SHIFT: AI-First Architecture

### What Changed
We are NOT building calculators or static optimization tools.
We ARE building an **AI-powered game assistant** that dynamically analyzes and advises.

## Project: TravianAssistant V4
AI-powered browser assistant for Travian Legends using Claude for dynamic strategy

## Architecture Overview
```
Chrome Extension (scrapes game) → Backend Server (serves data) → Claude AI (analyzes) → Chat HUD (in-game)
```

## ✅ What's Complete

### 1. Game Data Extraction - DONE
- All 9 tribes with complete troop stats
- Building costs and construction times
- Hero mechanics and formulas
- Training time calculations

### 2. Game Data Provider - DONE
- TypeScript class in `/packages/extension/src/ai/game-data-provider.ts`
- Formats all game data for AI consumption
- Provides complete game context to Claude
- Includes formulas and mechanics

### 3. Chrome Extension - EXISTS (needs testing)
- Manifest V3 structure in place
- Content scripts for scraping
- Background service worker
- HUD overlay capability

## 🔴 Critical Tasks for Launch

### 1. Test & Optimize Extension Scraping
- Verify complete game state capture
- Test on actual Travian pages
- Ensure all resources, buildings, troops scraped
- Validate page context detection

### 2. Connect Extension to Backend
- Wire up game-data-provider.ts
- Establish communication channel
- Route AI requests through backend
- Handle response streaming

### 3. Implement AI Chat Interface
- Claude system prompt with game knowledge
- Interactive dialogue in HUD
- Context-aware responses
- Natural language processing

### 4. Deploy Backend Server
- Host game data files
- Proxy Claude API calls
- Manage conversation context
- Store user preferences

## The AI Advantage

### Traditional Approach (V3)
```javascript
// Static calculator
function calculateSettlementTime(tribe, resources) {
  return fixedFormula(tribe, resources);
}
```

### AI Approach (V4)
```
Player: "When should I settle?"

AI: "I see you're Egyptian with 15/15/15/9 fields. Let me understand your situation:
- Are you competing for a specific 15c?
- What's your gold budget?
- Any aggressive neighbors?

Based on your 1200/hour total production and level 7 barracks, 
you could settle by day 6 if you focus on...]"
```

## Key Insights

### AI Asks Questions Instead of Assuming
- Server spawn location relative to center
- Alliance vs solo play
- Gold spending tolerance
- Offensive vs defensive goals
- Risk tolerance for early aggression

### AI Sees Context
- What page the player is viewing
- Current game state in real-time
- Historical patterns from session
- Server-specific conditions

### AI Adapts Strategy
- No fixed "optimal" build order
- Responds to changing conditions
- Learns from player preferences
- Considers unpredictable variables

## Technical Status

### Working Components
- ✅ Complete game data in JSON
- ✅ Data provider class
- ✅ Extension structure
- ✅ Building/troop formulas

### Needs Implementation
- ❌ Extension-to-backend connection
- ❌ Claude AI integration
- ❌ Chat interface in HUD
- ❌ Conversation context management

### Needs Testing
- ⚠️ Game state scraping accuracy
- ⚠️ Real-time data updates
- ⚠️ AI response quality
- ⚠️ Performance under load

## Next Session Actions

1. **Test Extension Scraping**
   - Load extension in Chrome
   - Navigate to Travian pages
   - Verify data extraction
   - Check console for errors

2. **Connect Backend Pipeline**
   - Set up Node.js server
   - Configure Claude API
   - Implement WebSocket/HTTP bridge
   - Test data flow

3. **Configure AI Agent**
   - Write comprehensive system prompt
   - Include all game mechanics
   - Add conversation patterns
   - Test with real scenarios

4. **Package for Team**
   - Extension installation guide
   - Backend deployment steps
   - API key configuration
   - Testing checklist

## Success Metrics

### Launch Day (Sept 1)
- Extension captures game state
- AI provides relevant advice
- Chat interface responds
- No critical errors

### Week 1
- AI helps achieve competitive settlement
- Accurate calculations on demand
- Contextual strategy recommendations
- Learning from interactions

## Quick Reference

### File Locations
- Extension: `/packages/extension/`
- Game Data: `/data/`
- Data Provider: `/packages/extension/src/ai/game-data-provider.ts`
- Documentation: `/docs/`

### Key Formulas
- Training: `base_time * 0.9^(building_level - 1)`
- Great Building: `time / 3`
- Building: `base_time / (1 + MB_level * 0.05)`
- Travel: `distance / (speed * server_speed)`

### Egyptian Quick Facts
- Slave Militia: 15 wood, 45 clay, 60 iron, 30 crop
- 15 min training at Barracks 1
- 15 carry capacity
- 7 fields/hour speed
- Resource bonus: +25% from hero

## Philosophy Change

**OLD**: "Build these exact things in this exact order"
**NEW**: "Tell me your situation, and I'll help you succeed"

**OLD**: Static spreadsheet calculations
**NEW**: Dynamic AI analysis

**OLD**: Generic optimization
**NEW**: Personalized strategy

---
*The game launches tomorrow. We're not building a calculator. We're building an AI advisor that understands Travian better than any spreadsheet ever could.*