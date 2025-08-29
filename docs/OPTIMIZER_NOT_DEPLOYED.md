# Game Start Optimizer Implementation

This document describes the Game Start Optimizer system created for TravianAssistant but **NOT YET INTEGRATED** with the backend server.

## Status: CREATED BUT NOT DEPLOYED

Created on: August 28, 2025
Purpose: Achieve top-5 settlement on server within 168 hours
Current State: **Files exist but are not connected to backend or fully integrated**

## Files Created

### 1. `packages/extension/src/game-start-optimizer.ts`
- **Purpose**: Core algorithm for game start optimization
- **Features**:
  - 4-phase system (Initial → Acceleration → CP Rush → Settlement)
  - Egyptian-specific field development sequences
  - Settlement time prediction
  - Resource balancing detection
  - Quest prioritization
  - Gold usage strategy per phase
- **Status**: ✅ Complete algorithm, ❌ No real game data input

### 2. `packages/extension/src/ai-prompt-enhancer.ts`
- **Purpose**: Enhance AI prompts with strategic context
- **Features**:
  - Phase-aware prompt generation
  - Quick analysis summaries
  - Action plan generation (immediate/daily/weekly)
  - Competitive positioning metrics
- **Status**: ✅ Complete logic, ❌ Not connected to chat

### 3. `packages/extension/src/content/game-integration.ts`
- **Purpose**: Connect scraper → optimizer → AI
- **Features**:
  - Process game state for optimizer
  - Generate AI-ready context
  - Provide recommendations
- **Status**: ✅ Integration layer ready, ❌ Missing backend connection

### 4. `packages/extension/src/content/conversational-ai-integrated.ts`
- **Purpose**: Enhanced chat UI with optimizer integration
- **Features**:
  - Special commands ("analyze", "plan")
  - Quick analysis display
  - Strategic recommendations
- **Status**: ✅ UI complete, ❌ Not replacing current chat

### 5. `packages/extension/build-optimizer.sh`
- **Purpose**: Build script for v1.1.0 with optimizer
- **Status**: ✅ Script ready, ⚠️ Not tested

## What's Missing

### 1. Backend Server Connection
```typescript
// NEEDED: Connection to port 3002
async syncWithBackend(gameState) {
  await fetch('http://localhost:3002/api/snapshot', {
    method: 'POST',
    body: JSON.stringify(gameState)
  });
}
```

### 2. Comprehensive Data Scraping
Currently missing:
- Resource field levels
- Building queue status
- Troop counts
- Hero status
- Quest list
- Gold amount
- Incoming attacks

### 3. Real Game State Input
The optimizer expects:
```typescript
interface GameState {
  serverAge: number;
  resources: { wood, clay, iron, crop };
  production: { wood, clay, iron, crop };
  culturePoints: number;
  buildings: BuildingSlot[];
  fields: ResourceField[];
  // etc...
}
```

But we only have:
- Village names and populations
- Basic overview data

## How to Use in Future

### When Ready to Integrate:

1. **First complete backend connection**:
   - Connect chat to backend server
   - Ensure data flows: Game → Extension → Backend → AI

2. **Expand data scraping**:
   - Implement comprehensive game state capture
   - Test on multiple game pages

3. **Then integrate optimizer**:
   ```bash
   # Build with optimizer
   chmod +x build-optimizer.sh
   ./build-optimizer.sh
   ```

4. **Wire up the integration**:
   - Import game-integration in conversational-ai-fixed.ts
   - Replace mock data with real scraped data
   - Test recommendations accuracy

## Algorithm Details

### Phase System
```
INITIAL (0-24h): Resource fields to level 1-2
ACCELERATION (24-72h): Crop to level 5, others to 3
CP_RUSH (72-144h): Build Embassy, Main Building for CP
SETTLEMENT (144-168h): Train settlers, find location
```

### Egyptian Field Sequence
Optimized order for Egyptians:
1. Crop fields first (food bonus)
2. Balanced wood/clay
3. Iron last (least needed early)

### Settlement Prediction
Calculates hours to 2nd village based on:
- Current CP and production rate
- Building queue
- Quest completion rate

## Testing When Ready

```javascript
// Test optimizer standalone
const mockState = {
  serverAge: 48,
  resources: { wood: 500, clay: 500, iron: 500, crop: 500 },
  production: { wood: 50, clay: 50, iron: 40, crop: 60 },
  // ... etc
};

const optimizer = new GameStartOptimizer(mockState);
const plan = optimizer.generateDetailedPlan();
console.log(plan);
```

## Notes for Next Session

**Priority**: Do NOT deploy these files yet. Instead:

1. Focus on backend connection first
2. Expand data scraping capabilities
3. Test with real game data
4. Then integrate optimizer

The optimizer is theoretically sound but needs the data infrastructure to support it. Keep these files as reference for when the foundation is ready.
