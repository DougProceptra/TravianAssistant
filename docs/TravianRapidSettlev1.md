# TravianRapidSettle v1.0 - Technical Design Document
*Last Updated: September 2, 2025*

## Executive Summary
TravianRapidSettle is a focused Chrome extension that helps players achieve the fastest possible second village settlement in Travian Legends. It uses RBP-style data persistence combined with AI-powered strategic recommendations.

## Project Pivot Rationale
After extensive testing, we discovered:
1. **Multi-village data collection is technically limited** - Travian only exposes current village data
2. **Statistics page doesn't contain production data** - Only player rankings
3. **window.resources IS accessible** - Via script injection from content script
4. **Early game is most critical** - First 7 days determine competitive success

## Core Architecture

### Data Flow
```
Page Context (window.resources)
    ↓ [Script Injection]
Content Script (Data Provider)
    ↓ [Message Passing]
Background Service Worker
    ↓ [API Call]
Claude AI (Strategy Engine)
    ↓ [Recommendations]
HUD Display (User Interface)
```

### Key Components

#### 1. SettlementDataProvider (`/content/settlement-data-provider.ts`)
- **Purpose**: Collect raw game data without interpretation
- **Method**: RBP-style localStorage persistence
- **Frequency**: Every page load + every 60 seconds
- **Data Captured**:
  - Resources (production, storage, current)
  - Buildings (type, level, queue)
  - Hero (level, stats, health)
  - Adventures available
  - Village information
  - Troops (if visible)
  - Field levels

#### 2. AI Strategy Engine (Claude Integration)
- **Purpose**: Analyze data and provide strategic recommendations
- **Approach**: Raw data in, contextual advice out
- **Key Decisions**:
  - Build order optimization
  - Resource balance timing
  - Hero adventure priority
  - Oasis attack risk/reward
  - CP generation path

#### 3. HUD Interface
- **Purpose**: Display AI recommendations clearly
- **Features**:
  - Current phase indicator
  - Next critical action
  - Time until settlement
  - Resource requirements
  - Hero recommendations

## Game Constants & Algorithms

### Settlement Requirements
- **CP Needed**: 500 culture points
- **Settlers**: 3 units at 5000/4000/5000/3000 each
- **Residence**: Level 10 required
- **Academy**: Level 1 required

### CP Generation (per building level)
```javascript
{
  main_building: 5,
  embassy: 24,    // Priority!
  marketplace: 20, // Priority!
  cranny: 2,
  warehouse: 1,
  granary: 1,
  barracks: 4,
  residence: 2
}
```

### Oasis Mechanics
- **Resource Reward**: 40 of each resource per animal level killed
- **Hero Combat**: Strength = (level × 100) + strength_points + equipment
- **Animal Strength**: See GAME_CONSTANTS.ANIMALS in data provider

### Time Phases
1. **Foundation (0-24h)**: Resource base establishment
2. **CP Rush (24-72h)**: Culture point building focus
3. **Residence Prep (72-120h)**: Residence to level 10
4. **Settler Training (120-168h)**: Train 3 settlers
5. **Settlement (168h+)**: Execute settlement

## Data Collection Strategy

### What We Collect
```javascript
snapshot = {
  timestamp: Date.now(),
  resources: window.resources,
  buildings: [...],  // All building slots
  hero: {...},       // Complete hero state
  village: {...},    // Current village only
  queue: [...],      // Construction queue
  movements: [...]   // Attacks/reinforcements
}
```

### What We DON'T Collect
- Other villages' production (not available)
- Future projections (AI calculates)
- Strategic decisions (AI determines)
- Risk assessments (AI evaluates)

## AI Integration Points

### Input to AI
```javascript
{
  current: latestSnapshot,
  history: last24HoursOfSnapshots,
  serverAge: hourssinceStart,
  constants: gameConstants,
  events: playerActions
}
```

### Expected AI Output
```javascript
{
  phase: "CP_RUSH",
  urgentActions: ["Build Embassy NOW"],
  recommendations: ["Clear 2-rat oasis", "Queue Marketplace"],
  projections: {
    settlementDay: 6.5,
    cpPerDay: 72,
    resourceShortfall: {wood: 500}
  }
}
```

## Implementation Status

### Completed
- ✅ Context bridge for window.resources access
- ✅ Settlement data provider (clean data collection)
- ✅ Game constants and formulas
- ✅ RBP-style localStorage persistence

### In Progress
- 🔄 AI prompt template for Claude
- 🔄 HUD interface implementation
- 🔄 Integration with existing extension

### Not Started
- ❌ Fresh server detection
- ❌ Multi-account support
- ❌ Alliance coordination features

## Testing Strategy

### Current Server Testing
1. Deploy data provider
2. Verify snapshot collection
3. Test on existing village (hour 1000+)
4. Validate data accuracy

### Fresh Server Testing
1. Join new server at start
2. Reset localStorage
3. Track from hour 0
4. Validate phase transitions
5. Measure settlement achievement

## File Structure
```
/packages/extension/src/content/
  ├── settlement-data-provider.ts    # Clean data collection
  ├── settlement-ai-interface.ts     # AI communication (TODO)
  ├── settlement-hud.ts              # UI display (TODO)
  └── index.ts                       # Integration point

/docs/
  ├── TravianRapidSettlev1.md       # This document
  ├── SESSION_CONTEXT.md             # Session continuity
  └── DATA_CAPTURE_STRATEGY.md      # Technical exploration
```

## Critical Decisions Made

1. **Focus on single village** - Multi-village not technically feasible
2. **RBP-style storage** - Accumulate data over time
3. **AI-driven strategy** - No hardcoded decision trees
4. **Settlement race focus** - Most critical game phase
5. **Hero/oasis integration** - Major resource accelerator

## Next Session Requirements

1. Review this document first
2. Check SESSION_CONTEXT.md for current state
3. Test data provider on live game
4. Do NOT attempt multi-village collection
5. Focus on AI integration for recommendations

## Success Metrics

- **Primary**: Achieve second village by day 6
- **Secondary**: Top-10 settler on server
- **Tertiary**: <30 minutes daily management time

## Known Limitations

1. Cannot get other villages' data without navigation
2. Statistics page has no production data
3. Must inject script for window.resources access
4. CSP prevents some injection methods
5. Game updates may break selectors

## Risk Mitigation

- **Selector changes**: Use multiple fallback selectors
- **Game updates**: Version detection and compatibility modes
- **Data loss**: Regular localStorage backups
- **AI availability**: Fallback to basic recommendations

---

*This document represents the pivoted approach after discovering technical limitations with multi-village data collection. The focus is now on maximizing early game efficiency for fastest settlement.*