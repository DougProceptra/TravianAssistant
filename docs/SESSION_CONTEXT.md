# SESSION_CONTEXT.md
*Last Updated: August 30, 2025 - End of Session*
*Next Session Ready: August 31, 2025*

## Project: TravianAssistant V3
Browser-based AI assistant for Travian Legends gameplay optimization

## Mission Statement
Transform Travian gameplay from tedious spreadsheet calculations to AI-powered strategic excellence, enabling top-20 competitive play in under 2 hours per day.

## CRITICAL SESSION PROGRESS - August 30, 2025

### Session 1: Data Extraction ✅ COMPLETE
Successfully extracted ALL game data from Kirilloid's Travian calculator (http://travian.kirilloid.ru)

### Session 2: Architecture & Data Management Design 🔶 IN PROGRESS

## Current Architecture Decision: LOCAL-FIRST CALCULATION

### Decision Made ✅
- Push base data tables to Chrome extension for local calculations
- Extension performs ALL basic calculations without server calls
- Server only needed for: AI recommendations, map analysis, updates
- Rationale: Instant response (0ms), offline capability, privacy, reduced server costs

## Data Management System Design

### 1. BUILDING SYSTEM COMPONENTS

#### 1.1 Base Data Tables ✅ COMPLETE
- Location: `/data/buildings/`
- Files: `travian_complete_buildings_data.json` (2x), `travian_buildings_SS1X.json` (1x)
- Contents: 50 buildings × 20 levels with costs, times, CP, population

#### 1.2 Calculation Engine ✅ DESIGNED
```javascript
// Main Building Speed Multipliers CONFIRMED
[1.00, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.29, 1.34, 1.39,
 1.44, 1.50, 1.55, 1.61, 1.67, 1.73, 1.80, 1.87, 1.93, 2.01]

// Build Time Formula CONFIRMED
Actual Time = (Base Time / Server Speed) / MB Multiplier / Other Multipliers

// Other Multipliers CONFIRMED
- Gold Club: 1.25x
- Hero Construction: Variable
- Artifacts: Small(1.5x), Large(2x), Unique(3x)
- Watching Ads: 0.75x
```

#### 1.3 Building Dependencies 🔶 PARTIAL
```javascript
// CONFIRMED Dependencies
{
  "Barracks": { "Main Building": 3, "Rally Point": 1 },
  "Stable": { "Barracks": 3, "Academy": 5 },
  "Workshop": { "Academy": 10, "Main Building": 5 },
  "Academy": { "Barracks": 3, "Main Building": 3 },
  "Smithy": { "Academy": 1, "Main Building": 3 },
  "Treasury": { "Main Building": 10 }
  // MORE NEEDED - See questions below
}
```

#### 1.4 Additional Components IDENTIFIED
- **Building Effects/Benefits** - Production bonuses, capacity increases
- **Building Restrictions** - Slot limits, tribe-specific, mutual exclusions
- **Demolition Rules** - MB level 10 required, dependency protection
- **Village Context** - Capital vs regular, artifact, WW villages
- **Build Queue Management** - Roman parallel, Plus features
- **Resource Validation** - Storage capacity, crop balance

### 2. TROOP SYSTEM COMPONENTS

#### 2.1 Base Data Tables ✅ COMPLETE
- Location: `/data/troops/`
- Files: Complete for all 8 tribes, both 1x and 2x servers
- Contents: Attack, defense, speed, carry, cost, time, consumption

#### 2.2 Troop Dependencies 🔴 NOT DEFINED
- Need: Academy level requirements per troop
- Need: Building requirements (Stable, Workshop)
- Need: Research costs and times

#### 2.3 Combat Modifiers 🔴 NOT DEFINED
- Need: Smithy formulas (1.5% per level?)
- Need: Wall defense bonuses
- Need: Hero fighting strength
- Need: Morale bonus

### 3. QUEST SYSTEM 🔶 PARTIALLY DEFINED

Daily quests identified from screenshot:
- Alliance bonus: 5000 resources
- Adventure completion: Variable
- Raid oasis: 3 difficulty levels
- Attack Natarian: 3 levels
- Win auction, Gain/spend gold
- Building upgrades, Military training
- Celebrations

**Decision Made**: Agent can ask player about quest capability rather than pre-calculate

### 4. TRIBE-SPECIFIC FEATURES 🔶 STRUCTURE DEFINED

```javascript
tribeSpecificBuildings = {
  romans: { cityWall, horseDrinkingTrough },
  egyptians: { waterworks },
  teutons: { brewery, earthWall },
  gauls: { trapper, palisade },
  huns: { commandCenter }
}
// VALUES NEEDED for bonuses
```

### 5. CALCULATION APPROACH DECISIONS

#### CP/Resource Efficiency ✅ DECIDED
- Agent calculates on-the-fly (1000 possibilities easily handled)
- No pre-calculation needed

#### API Design Pattern ✅ DECIDED
```
POST /api/calculate/build-time
POST /api/building/can-build
POST /api/calculate/troop-training
POST /api/calculate/combat
```

## MASTER DOCUMENTATION CREATED

### `/docs/data-structures.md` ✅ CREATED
Complete tracking document with:
- All architectural decisions
- Data structures defined
- Outstanding questions marked with ❓
- Progress indicators (✅ 🔶 🔴)

## OUTSTANDING QUESTIONS FOR NEXT SESSION

### High Priority ❗
1. Complete building dependencies - need full list
2. Smithy/Wall/Hero combat formulas - exact percentages
3. Resource production base formulas
4. Should Doug provide additional Kirilloid extraction files?

### Medium Priority
1. Tribe-specific bonus values (exact percentages)
2. Building effects documentation
3. Quest rotation pattern

### Decisions Needed
1. Store dependencies in JSON or SQLite?
2. How to handle tribe-specific building variants?
3. Include quest predictions or ask player?

## FILES READY FOR UPLOAD
Doug has additional Kirilloid extraction files to provide - need to:
1. Determine which files are available
2. Store in `/data/` folder structure
3. Update data-structures.md with new data

## NEXT SESSION ACTION ITEMS

### Immediate Priority
1. **Receive and store** additional Kirilloid extraction files from Doug
2. **Complete building dependencies** from game/documentation
3. **Define troop training requirements** and dependencies

### Implementation Priority
1. **Create calculation engine module** in GitHub (not in chat!)
2. **Build test harness** for validation
3. **Test game start scenario** before Monday server launch

### Key Reminders
- **NO CODE IN CHAT** - All coding happens in GitHub
- **Monday deadline** - New server launches, need game start optimizer
- **Local-first** - Extension does calculations, not server

## Repository Structure Updated
```
/TravianAssistant/
├── /data/
│   ├── buildings/          [✅ Has base data]
│   ├── troops/             [✅ Has base data]
│   ├── dependencies/       [🔴 Needs creation]
│   ├── quests/            [🔴 Needs data]
│   └── tribe-specific/    [🔴 Needs values]
├── /docs/
│   ├── SESSION_CONTEXT.md      [✅ This file]
│   ├── data-structures.md      [✅ Created - master tracking]
│   └── TRAVIAN_ASSISTANT_V3_COMPLETE.md [✅ Original roadmap]
├── /extension-v3/          [🔴 Not started]
├── /backend/              [🔴 Not started]
└── /calculation-engine/   [🔴 Ready to implement]
```

## Session Handoff Notes
1. **Architecture decided**: Local-first with minimal API calls
2. **Data extracted**: Buildings and troops complete
3. **Design documented**: data-structures.md is source of truth
4. **Next step clear**: Implement calculation engine in GitHub
5. **Doug has files**: Additional extraction data ready to provide

---
*Session 2 completed with architecture defined and documented. Ready for implementation in Session 3.*
*Critical: Monday new server launch - game start optimizer needed*