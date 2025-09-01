# TravianAssistant v4: AI-First Strategic Advisor
*Version 1.1.0 - September 2025*

## Core Philosophy
**The AI Agent IS the Product** - Everything else is plumbing to feed data to the AI.

## Architecture
```
Game Page → Scraper → Context Builder → AI Agent → Strategic Advice
                              ↓
                     Context Intelligence
                          (Learning)
```

## Success Metrics
- User asks: "What should I do next?"
- AI responds with strategic advice based on ACTUAL game state
- Not displaying data user can already see

## Technical Stack
- **AI Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Context Service:** https://proceptra.app.n8n.cloud/mcp/context-tools
- **Data Pipeline:** Real-time scraping → Context injection → AI
- **Version:** 1.1.0 across all components

## Implementation Focus
1. Fix data pipeline - scrapers find data but AI receives zeros
2. Inject complete game context with every AI query
3. Connect context intelligence for learning
4. Test with real game data and iterate

## What This Is NOT
- NOT a HUD with data displays
- NOT a complex UI system
- NOT automation of game actions
- NOT a replacement for game interface

## What This IS
- Strategic advisor that understands your game state
- Learning system that improves over time
- Natural language interface for complex decisions
- Time-saving analysis tool

## Key Technical Decisions
- Chrome Extension Manifest V3 (required by Chrome)
- Content scripts for data scraping (no ES6 modules)
- Vercel Edge Functions for API proxy (CORS compliance)
- Chat interface as primary UI (no complex HUDs)

## Current State (Sept 1, 2025)
- ✅ Chat interface working (drag/resize functional)
- ✅ Basic scraping finds villages
- ❌ Data pipeline broken (AI receives empty context)
- ❌ Context intelligence not connected
- ⏳ Ready for v1.1.0 implementation

## User Experience
1. User plays Travian normally
2. Clicks chat button when needing advice
3. AI provides strategic recommendations
4. System learns from interactions

## The Critical Bug
```javascript
// Scrapers find data:
[TLA Overview] Successfully parsed 9 villages ✅

// But AI receives empty context:
[TLA Content] Found 0 villages ❌
```

## Build Process (v1.1.0)
```bash
cd packages/extension
npm run build
# Ensure manifest.json shows version 1.1.0
```

## Success Examples
**User**: "What should I build next?"
**AI**: "Based on your crop production deficit of -230/hour in Village 2, build croplands to level 5. This will take 45 minutes and stabilize your economy."

**User**: "When should I settle?"
**AI**: "You have 180 culture points, need 500. At current rate (+12/hour), you'll have enough in 27 hours. Start training settlers now in Village 1."

## What NOT to Build
- ❌ Dashboard displays
- ❌ Resource calculators
- ❌ Complex HUD overlays
- ❌ Automation features
- ❌ Anything that duplicates game UI

## Development Priorities
1. **Fix data pipeline** (Priority 1)
2. **Connect backend validation** (Priority 2)
3. **Integrate context intelligence** (Priority 3)
4. **End-to-end testing** (Priority 4)

---
*Remember: The AI chat is the entire interface. Everything else is invisible plumbing.*