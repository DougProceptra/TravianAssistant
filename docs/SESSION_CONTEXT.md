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

*Last Updated: August 26, 2025, 15:32 PST*
*Session Status: ACTIVE - Kirilloid Integration Phase*

## PROJECT STATUS SUMMARY

### ✅ WORKING COMPONENTS
1. **Data Collection**: Extension detecting all 7 villages from `/dorf3.php`
2. **Storage**: Villages stored in IndexedDB (accountSnapshots, villageSnapshots)
3. **Parser**: Overview parser fixed and working (v0.5.4)
4. **AI Framework**: Settlement advisor component created
5. **Extension**: v0.5.1 running in safe mode (collecting minimal data)

### 🚀 TODAY'S PROGRESS (Aug 26, Session 2)
1. **Kirilloid Analysis**: Created comprehensive data extraction plan
2. **AI Logic Documentation**: Defined settlement optimization algorithm
3. **Integration Strategy**: Mapped out all available data categories
4. **Scripts Created**: 
   - `/scripts/analyze-kirilloid.sh` - Analyzes available data
   - `/docs/KIRILLOID_INTEGRATION_PLAN.md` - Full integration roadmap
   - `/docs/AI_SETTLEMENT_LOGIC.md` - Detailed optimization logic

## KIRILLOID DATA CATEGORIES DISCOVERED

### Complete Data Available:
1. **Buildings**: Costs, CP, prerequisites, effects, times (levels 1-20)
2. **Troops**: Stats, costs, training times, upkeep, special abilities
3. **Hero**: Skills, items, adventures, experience curves
4. **Server Configs**: 1x/2x/3x/5x/10x speeds, tribes, special features
5. **Game Formulas**: Combat, distance, loyalty, production
6. **Optimization Algorithms**: ROI, building order, defense efficiency

### Key Insight: Settlement Bottleneck Theory
The AI must identify which of three bottlenecks limits settlement:
- **CP Bottleneck**: Need 200 culture points
- **Resource Bottleneck**: Need ~57k resources for settlers
- **Building Bottleneck**: Need prerequisite chain complete

The bottleneck determines the entire strategy!

## SETTLEMENT OPTIMIZATION ALGORITHM

### Core Calculation:
```
Settlement_Time = MAX(
  Time_to_200_CP,
  Time_to_accumulate_resources,
  Time_to_complete_buildings
)
```

### Dynamic Decision Framework:
1. **Every hour**: Recalculate which bottleneck is limiting
2. **Adjust strategy**: Focus on removing current bottleneck
3. **Gold efficiency**: Use premium currency to address bottlenecks
4. **ROI threshold**: Only upgrade if payback < hours to settlement

### Expected Settlement Times:
- F2P Conservative: Day 8-9 (192-216 hours)
- F2P Aggressive: Day 7 (168 hours)  
- Light Gold: Day 6 (144 hours)
- Heavy Gold: Day 5 (120 hours)
- Perfect Play + Max Gold: Day 4 (96 hours)

## IMMEDIATE NEXT STEPS

### 1. Run Kirilloid Analysis (Doug to execute):
```bash
cd ~/workspace
chmod +x scripts/analyze-kirilloid.sh
./scripts/analyze-kirilloid.sh
```

### 2. Extract Core Game Data:
- Building costs/CP for Main Building, Academy, Residence
- Settler costs per tribe
- CP requirements for villages (200, 500, 1000)
- Build time formulas

### 3. Create Calculator Modules:
- `settlement-calculator.ts` - Predicts time to settlement
- `bottleneck-detector.ts` - Identifies limiting factor
- `action-recommender.ts` - Suggests next moves

### 4. Test Pre-Game Analysis:
Have AI generate complete hour-by-hour plan from minute 1

## DATA FLOW ARCHITECTURE
```
Kirilloid Data (Static)
       +
Game State (Dynamic)     →  AI Calculator  →  Recommendations
       +                     
User Preferences
```

## CRITICAL PATH TO BETA (Aug 29)

### Today (Aug 26):
- ✅ Understand Kirilloid structure
- ✅ Define AI optimization logic
- 🔄 Extract game constants to TypeScript
- ⏳ Create basic calculator

### Tomorrow (Aug 27):
- Build preference UI component
- Connect calculators to game state
- Test settlement predictions
- Create hour-by-hour action plan

### Wednesday (Aug 28):
- Connect to Claude via Vercel
- Display recommendations in HUD
- Internal testing and debugging
- Prepare team onboarding

### Thursday (Aug 29):
- Beta release to team
- Monitor performance
- Collect feedback
- Hotfix critical issues

## KEY DECISIONS MADE

1. **AI doesn't just calculate ROI** - It understands the complete game state and identifies bottlenecks dynamically
2. **Kirilloid provides complete game mechanics** - No need to guess formulas
3. **Extension needs minimal additional data** - Mainly building levels and queue status
4. **Settlement optimization is three parallel races** - CP vs Resources vs Buildings

## QUESTIONS RESOLVED

1. **ROI Formula**: Not simple division - must consider time horizon
2. **AI Role**: Not just math, but strategic bottleneck identification  
3. **Data Source**: Kirilloid has everything we need for calculations
4. **Beta Scope**: Focus on settlement, expand to combat later

## TESTING VALIDATION

When Doug runs the analysis script, we expect to find:
- TypeScript models for all game entities
- Calculation functions for game mechanics
- Server configuration variants
- Complete data for T5 (current version)

## SUCCESS CRITERIA FOR SESSION

✅ Comprehensive understanding of available data
✅ Clear AI optimization algorithm defined
✅ Integration plan documented
⏳ Game constants extracted (pending script execution)
⏳ Basic calculator implemented (next step)

---
*Session in progress. Awaiting Kirilloid analysis results.*
