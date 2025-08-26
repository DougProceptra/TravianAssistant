# TravianAssistant Session Context

## ⚠️ CRITICAL: CODE DEVELOPMENT RULES ⚠️
**ALL CODE IS WRITTEN TO GITHUB - NEVER DUMP CODE IN SESSION**
- Code goes in GitHub repos, NOT in chat sessions
- Use git commits for all implementation work
- Session is for discussion, decisions, and architecture
- Small script snippets for Replit execution are OK
- Full implementations must go directly to GitHub files
- Workflow: GitHub → Pull to Replit → Deploy

---

*Last Updated: August 26, 2025, 14:55 PST*
*Session Status: COMPLETE - Ready for handoff*

## PROJECT STATUS SUMMARY

### ✅ WORKING COMPONENTS
1. **Data Collection**: Extension detecting all 7 villages from `/dorf3.php`
2. **Storage**: Villages stored in IndexedDB (accountSnapshots, villageSnapshots)
3. **Parser**: Overview parser fixed and working (v0.5.4)
4. **AI Framework**: Settlement advisor component created
5. **Extension**: v0.5.1 running in safe mode in Doug's browser

### 📊 VERIFIED DATA FLOW
```
Travian Game → Extension Scraper → IndexedDB → Master Collector → Settlement Advisor → AI Recommendations
```

## CRITICAL DISCOVERIES

### 1. Kirilloid's Travian Calculator (http://travian.kirilloid.ru/)
**GAME CHANGER** - Complete game mechanics database including:
- Building costs and CP values at every level
- Troop stats, costs, and training times
- Hero equipment and adventure data
- ROI calculators for resource fields
- Prerequisites and unlock conditions
- Server speed variants (1x, 2x, 3x, etc.)

**Integration Strategy**:
1. Extract static data for core buildings (Main Building, Embassy, etc.)
2. Create `travian-game-data.ts` with constants
3. Use for ROI calculations and CP optimization
4. Reference for accurate game mechanics

### 2. Travian Map Data (map.sql)
- Daily download available from server
- Contains ALL villages, coordinates, players, alliances
- Identifies croppers (7c, 9c, 15c)
- Can be used for:
  - Finding optimal settlement locations
  - Identifying abandoned villages for farming
  - Tracking competitor growth
  - Alliance territory mapping

## DATA REQUIREMENTS FOR SETTLEMENT OPTIMIZATION

### Currently Collecting ✅
- Village count and IDs
- Current resources (wood, clay, iron, crop)
- Basic production rates
- Culture points (current)

### Need to Add for Beta 🔄
1. **Building levels** - Scrape from dorf2.php
2. **Tribe selection** - User preference input
3. **Gold strategy** - User willingness to spend
4. **Game constants** - From Kirilloid data
5. **Building queue** - What's currently building

### Future Enhancements 📈
- Hero stats and adventures
- Oasis information and farming
- Daily quest optimization
- Multi-village CP coordination
- Alliance coordination features

## SETTLEMENT OPTIMIZATION FACTORS

Doug identified key variables for faster settling:
1. **Tribe bonuses** (Egyptian waterworks, etc.)
2. **Gold usage strategy** (NPC, instant build, etc.)
3. **Resource production optimization** (ROI calculations)
4. **Culture point generation** (building priorities)
5. **Building prerequisites** and unlock paths
6. **Cost/benefit analysis** (payback periods)
7. **Settlement equation** (balance resources, CP, settlers)
8. **Hero optimization** (adventures, resource bonus, oasis)
9. **Raiding strategy** (troop production vs. resource gain)
10. **Quest rewards** optimization

## FILES CREATED THIS SESSION
- `/packages/extension/src/collectors/master-collector.ts`
- `/packages/extension/src/content/overview-parser.ts` (fixed v0.5.4)
- `/packages/extension/src/ai/settlement-advisor.ts`
- `/docs/DATA_DOMAIN_SPEC.md`
- `/scripts/fix-build-and-test.sh`

## NEXT SESSION PRIORITIES

### 1. Integrate Kirilloid Data
```javascript
// Create travian-game-data.ts with:
- Building costs and CP values
- Troop statistics
- Hero data
- Tribe-specific bonuses
```

### 2. Enhance Data Collection
```javascript
// Add collectors for:
- Building levels (dorf2.php scraper)
- Hero stats
- Quest progress
- Gold balance
```

### 3. Build User Preference UI
```javascript
// Collect from user:
- Tribe selection
- Gold spending strategy
- Target settlement day
- Play hours per day
```

### 4. Connect AI to UI
- Add "Get Settlement Advice" button
- Display recommendations in HUD
- Connect to Claude via Vercel proxy
- Show time to settlement

### 5. Implement ROI Calculator
```javascript
// Using Kirilloid data:
ROI = (Resource gain * Hours until settlement) / Upgrade cost
CP efficiency = CP gained / (Resource cost * Build time)
```

## BETA TIMELINE
- **Aug 26**: ✅ Data collection working, AI framework built
- **Aug 27**: Integrate Kirilloid data + preference UI
- **Aug 28**: Connect AI + test with team
- **Aug 29**: Beta release target

## SUCCESS METRICS
- **Goal**: 4-8 hours faster settlement
- **Current**: Can collect game state and analyze
- **Needed**: Game constants + user prefs + AI connection
- **Confidence**: HIGH with Kirilloid data integration

## TESTING COMMANDS
```bash
# In Replit
cd ~/workspace
git pull origin main
cd packages/extension
npm install
npm run build

# Extension location: packages/extension/dist/
# Load in Chrome: chrome://extensions/ → Load unpacked
```

## KEY INSIGHTS
1. **Kirilloid is the missing piece** - Provides all game mechanics data
2. **map.sql enables strategic planning** - Find optimal settlement spots
3. **ROI calculation is critical** - Don't upgrade if won't pay back before settlement
4. **User preferences matter** - Gold strategy dramatically affects approach
5. **Extension is working** - Data collection successful, just need AI integration

## ARCHITECTURE DECISIONS
1. **Integrated, not standalone** - Settlement advisor part of extension
2. **Three-tier data approach**:
   - Static (game constants from Kirilloid)
   - Dynamic (scraped game state)
   - Preferences (user configuration)
3. **Hybrid data strategy** - Ship with static, add dynamic post-beta

## HANDOFF READY ✅
All context preserved. Next session can start with Kirilloid data integration and continue toward beta release on Aug 29.

---
*Session complete. All discoveries documented. Ready for next session.*