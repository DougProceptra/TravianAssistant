# TravianAssistantV4 - AI Agent First Architecture
*Last Updated: September 1, 2025 - Corrected after v1.0.6 disaster*

## ⚠️ CRITICAL: This Document Was Wrong

The previous version of this document led to over-engineering and the wrong approach. The corrected philosophy is below.

## Core Philosophy: AI AGENT IS THE PRODUCT

The extension is just plumbing to get game data to the AI. The AI chat interface is the entire user experience.

## What This Is
- **AI Strategic Advisor** that understands your game state
- **Chat-based interface** for all interactions  
- **Intelligent recommendations** based on complete game data

## What This Is NOT
- ❌ NOT a HUD with data displays
- ❌ NOT a collection of calculators
- ❌ NOT a dashboard of statistics
- ❌ NOT automation tools

## Current Working Version: v0.9.5

### ✅ What Works
- Chat interface (draggable, resizable, persistent)
- Basic AI responses via Claude
- Village detection from overview page (9 villages found)
- Vercel proxy for API calls

### ❌ What's Broken
- Data pipeline (scrapers find data but AI receives incomplete state)
- AI gets 0 population for 9 villages (connection issue)
- Version management (keeps resetting to 1.0.0)

## Architecture (Simplified - What Actually Matters)

```
Travian Game Page
       ↓
  Data Scrapers (find 9 villages) ✅
       ↓
  Content Script (sees 0 villages) ❌ <- THE BUG IS HERE
       ↓
  Background Script
       ↓
  Vercel Proxy ✅
       ↓
   Claude AI ✅
       ↓
  Chat Response ✅
```

## The One Bug That Matters

```javascript
// Console output showing the disconnect:
content.js:48 [TLA Overview] Successfully parsed 9 villages  ✅
content.js:2474 [TLA Content] Found 0 villages              ❌

// The fix is probably something like:
// Current (broken):
const villages = overviewParser.getAllCachedVillages(); 

// Should be:
const villages = await overviewParser.getAllVillages();
// Or whatever the correct method is
```

## User Experience (The Only Thing That Matters)

1. User opens Travian
2. Chat button appears
3. User asks: "What should I build?"
4. AI responds with specific advice based on ALL villages

That's it. No HUDs. No displays. Just intelligent conversation.

## Build Instructions That Work

```bash
cd packages/extension

# Use the working version
git checkout a00eca9
./build-minimal.sh

# Fix the version that keeps getting reset
sed -i 's/"version": "1.0.0"/"version": "0.9.5"/' dist/manifest.json
```

## What NOT to Build

Based on today's failures:
- ❌ Data quality indicators
- ❌ Village overview panels  
- ❌ Resource displays
- ❌ Any UI that isn't the chat
- ❌ "Comprehensive" anything

## Success Looks Like This

**User**: "What's my total production?"

**AI**: "Your 9 villages produce 45,000 resources per hour: 12k wood, 11k clay, 10k iron, 12k crop net. Village 003 at (50|-30) is your strongest producer."

NOT: A HUD showing numbers.

## Critical Rules

1. **The v0.9.5 chat UI works** - DON'T BREAK IT
2. **The AI is the interface** - NO OTHER UI
3. **Fix data, not UI** - The bug is in data passing, not display

## Deprecated Sections

Everything below this line is the OLD approach that led to disaster. Kept for reference of what NOT to do.

---

### ❌ OLD WRONG APPROACH (Don't Do This)

The sections about:
- Multiple scrapers and collectors
- HUD displays
- Data quality metrics
- Complex architecture
- "Comprehensive" features

All wrong. The AI agent is the product. Everything else is plumbing.

---
*Remember: Users have the game UI. They need an advisor, not another dashboard.*