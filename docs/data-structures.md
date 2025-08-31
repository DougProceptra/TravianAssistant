# TravianAssistant Data Structures & Architecture
*Last Updated: August 30, 2025*
*Status: Design Phase - Pre-Implementation*

## Overview
This document serves as the single source of truth for all data structures, architectural decisions, and system design for TravianAssistant. It tracks what has been decided, what remains to be determined, and what questions need answers.

## 1. Architecture Decision: Local-First Calculation

### Decision Made ✅
- Push base data tables to Chrome extension for local calculations
- Extension performs all basic calculations without server calls
- Server only needed for: AI recommendations, map analysis, updates

### Rationale
- Instant response time (0ms vs 50-200ms network latency)
- Offline capability
- Privacy (game data stays local)
- Reduced server costs

## 2. Building System

### 2.1 Base Data Tables ✅ COMPLETE
**Location:** `/data/buildings/`
**Status:** Extracted from Kirilloid

**Files:**
- `travian_complete_buildings_data.json` - 2x server, 50 buildings
- `travian_buildings_SS1X.json` - 1x server speeds

**Contents per building:**
- Resource costs (wood, clay, iron, crop) per level
- Build time (base) per level
- Culture points per level
- Population cost per level

### 2.2 Building Calculation Engine

#### Main Building Speed Multipliers ✅ DECIDED
```javascript
mainBuildingMultipliers = {
  0: 1.00,  // Destroyed
  1: 1.00,  2: 1.04,  3: 1.08,  4: 1.12,  5: 1.16,
  6: 1.20,  7: 1.25,  8: 1.29,  9: 1.34,  10: 1.39,
  11: 1.44, 12: 1.50, 13: 1.55, 14: 1.61, 15: 1.67,
  16: 1.73, 17: 1.80, 18: 1.87, 19: 1.93, 20: 2.01
}
```

#### Build Time Formula ✅ DECIDED
```
Actual Time = (Base Time / Server Speed) / MB Multiplier / Other Multipliers
```

#### Optional Multipliers ✅ DECIDED
- Gold Club: 1.25x faster
- Hero Construction Bonus: Variable based on items/points
- Artifacts: Small (1.5x), Large (2x), Unique (3x)
- Watching Ads: 0.75x time (25% reduction)

### 2.3 Building Dependencies 🔶 PARTIALLY COMPLETE

**Known Dependencies:**
```javascript
{
  "Barracks": { "Main Building": 3, "Rally Point": 1 },
  "Stable": { "Barracks": 3, "Academy": 5 },
  "Workshop": { "Academy": 10, "Main Building": 5 },
  "Academy": { "Barracks": 3, "Main Building": 3 },
  "Smithy": { "Academy": 1, "Main Building": 3 },
  "Treasury": { "Main Building": 10 },
  // ... more needed
}
```

**❓ QUESTIONS:**
1. Should we extract complete dependencies from game or documentation?
2. Include level requirements for all buildings?
3. How to handle tribe-specific building dependencies?

### 2.4 Building Restrictions 🔶 PARTIALLY DEFINED

**Slot Restrictions:**
- Rally Point: Fixed location only
- Walls: One per village, type depends on tribe

**Mutual Exclusions:**
- Palace OR Residence (not both)
- Command Center replaces Palace/Residence for Huns

**❓ QUESTIONS:**
1. Complete list of fixed-slot buildings?
2. All mutual exclusions documented?

### 2.5 Building Effects 🔴 NOT COMPLETE

**❓ NEEDS DEFINITION:**
- Production bonuses per building level
- Storage capacity formulas
- Special effects (Trade Office, Tournament Square, etc.)

## 3. Troop System

### 3.1 Base Data Tables ✅ COMPLETE
**Location:** `/data/troops/`
**Status:** Extracted from Kirilloid

**Files:**
- `travian_all_tribes_complete.json` - 7 tribes, 2x server
- `travian_spartans_troops.json` - Spartan troops, 2x server
- `travian_troops_SS1X.json` - All 8 tribes, 1x server

**Contents per troop:**
- Attack, Defense (vs infantry/cavalry)
- Speed, Carry capacity
- Training cost, Training time
- Crop consumption

### 3.2 Troop Training Dependencies 🔴 NOT DEFINED

**❓ NEEDS:**
1. Academy level requirements for each troop
2. Building requirements (Stable for cavalry, Workshop for siege)
3. Research costs and times

### 3.3 Combat Modifiers 🔴 NOT DEFINED

**❓ NEEDS:**
1. Smithy upgrade formulas (1.5% per level?)
2. Wall defense bonuses by tribe
3. Hero fighting strength calculation
4. Morale bonus formula

## 4. Quest System 🔶 PARTIALLY DEFINED

### Daily Quests (from screenshot)
- Alliance bonus: 5000 resources
- Adventure completion: Variable rewards
- Raid oasis: 3 difficulty levels
- Attack Natarian: 3 levels
- Win auction: Gold reward
- Gain/spend gold: Resource rewards
- Building upgrades: Resource/gold
- Military training: Infantry/cavalry
- Celebration: Small/big

**❓ QUESTIONS:**
1. Load complete quest rotation data?
2. How to predict quest availability?
3. Include tutorial quest sequence?

## 5. Tribe-Specific Features 🔶 PARTIALLY DEFINED

### Proposed Structure:
```javascript
tribeSpecificBuildings = {
  romans: {
    cityWall: { defenseBonus: ? },
    horseDrinkingTrough: { 
      cavalryTrainingSpeed: ?,
      cavalryUpkeep: ?
    }
  },
  egyptians: {
    waterworks: {
      oasisBonus: ?,
      requires: "oasis_annexed"
    }
  },
  // ... etc
}
```

**❓ NEEDS:**
1. Complete bonus values for each tribe
2. Special building effects documentation
3. Tribe-specific gameplay mechanics

## 6. Resource & Production System 🔴 NOT DEFINED

**❓ NEEDS:**
1. Base production formulas
2. Oasis bonus calculations (25%, 50%)
3. Hero resource production bonus
4. Gold/Silver membership effects
5. Artifact production bonuses

## 7. API Design 🔶 PARTIALLY DEFINED

### Proposed Endpoints:
```
GET /api/calculate/build-time
POST /api/building/can-build
POST /api/calculate/troop-training
POST /api/calculate/combat
POST /api/game-state/update
POST /api/ai/analyze
```

**❓ QUESTIONS:**
1. RESTful or GraphQL?
2. Authentication strategy?
3. Rate limiting approach?

## 8. Data Storage Strategy

### Local (Extension):
- Base game data (buildings, troops)
- Calculation formulas
- Current village state

### Server (Backend):
- User profiles
- Historical data
- AI recommendations
- Map data

**❓ QUESTIONS:**
1. Use IndexedDB or chrome.storage?
2. Sync strategy between local and server?
3. Data compression approach?

## 9. Outstanding Decisions

### High Priority ❗
1. Complete building dependencies mapping
2. Smithy/Wall/Hero combat formulas
3. Resource production calculations
4. Quest system implementation approach

### Medium Priority
1. Tribe-specific bonuses values
2. Building effects documentation
3. API authentication method

### Low Priority
1. Advanced features (farm lists, trade routes)
2. Alliance coordination features
3. Subscription model

## 10. Next Steps

1. **Immediate:** Complete building dependencies from game/documentation
2. **Next Session:** Define troop training requirements and combat formulas
3. **Following:** Implement calculation engine with all multipliers
4. **Then:** Build Chrome extension with local calculation capability

## Notes
- This document is source of truth - update as decisions are made
- Mark items ✅ COMPLETE, 🔶 PARTIAL, or 🔴 NOT DEFINED
- Add ❓ QUESTIONS for items needing clarification
- Include rationale for architectural decisions

---
*End of Document - Version 1.0*