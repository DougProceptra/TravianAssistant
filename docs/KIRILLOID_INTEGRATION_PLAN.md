# Kirilloid Data Integration Plan

## Available Data Categories

### 1. **Buildings Data**
- **Structure**: Cost (wood, clay, iron, crop) per level 1-20
- **Culture Points**: CP generated per level
- **Prerequisites**: Required buildings to unlock
- **Effects**: Production bonuses, storage increases, etc.
- **Build Times**: Base time + formula for each level
- **Special Properties**: Multiple allowed, unique per account, etc.

### 2. **Troops Data**
- **Stats**: Attack, defense (infantry/cavalry), speed
- **Costs**: Training resources (wood, clay, iron, crop)
- **Training Time**: Base time in barracks/stable/workshop
- **Upkeep**: Crop consumption per unit
- **Carry Capacity**: Resources each unit can carry
- **Special Abilities**: Ram, catapult targets, scouting, etc.

### 3. **Hero Data**
- **Base Stats**: Per tribe
- **Skills**: Resource production, offense, defense bonuses
- **Items/Equipment**: Weapons, armor, horses with effects
- **Adventures**: Difficulty levels, rewards probability
- **Experience**: Levels, revival costs and times

### 4. **Server Configurations**
- **Speed Variants**: 1x, 2x, 3x, 5x, 10x, special servers
- **Tribe Options**: Romans, Gauls, Teutons, Egyptians, Huns, Spartans, Vikings
- **Special Features**: City system, artifacts, regions

### 5. **Game Mechanics/Formulas**
- **Combat Calculations**: Battle simulator logic
- **Distance Calculations**: Travel time formulas
- **Loyalty/Conquering**: Chief effectiveness
- **Culture Points**: Accumulation and village slot requirements
- **Resource Production**: Field output by level
- **Population**: Building population requirements

### 6. **Optimization Algorithms**
- **ROI Calculations**: Resource field upgrade priorities
- **Building Order**: Optimal construction sequences
- **Defense Efficiency**: Best defensive units per crop
- **Offense Planning**: Rally point timings

## Integration Strategy

### Phase 1: Static Data Extraction (TODAY)
Create `packages/extension/src/game-data/`:
- `buildings.ts` - All building costs, CP, prerequisites
- `troops.ts` - Unit stats, costs, times
- `tribes.ts` - Tribe-specific bonuses
- `formulas.ts` - Game calculations
- `constants.ts` - Server speeds, CP requirements

### Phase 2: Smart Calculator (TOMORROW)
Create `packages/extension/src/calculators/`:
- `settlement-calculator.ts` - Time to settlement predictor
- `roi-calculator.ts` - Upgrade priority calculator
- `combat-simulator.ts` - Battle outcome predictor
- `resource-optimizer.ts` - Production optimization

### Phase 3: AI Integration
The AI will use this data to:
1. Calculate exact resource requirements for any goal
2. Predict time to achieve milestones (settlement, artifacts, etc.)
3. Recommend optimal build/train orders
4. Identify bottlenecks and suggest solutions

## Key Insights for Settlement Optimization

### Critical Variables
1. **Culture Points Generation Rate**
   - Which buildings to prioritize for CP
   - When to build festivities vs. permanent CP

2. **Resource Balance**
   - Maintaining positive crop while maximizing other resources
   - NPC trader timing for resource conversion

3. **Building Prerequisites Chain**
   - Unlocking settlers (Academy → Level 10, etc.)
   - Avoiding bottlenecks in construction

4. **Gold Efficiency**
   - When instant build provides best ROI
   - NPC trader vs. marketplace rates
   - Gold club benefits utilization

5. **Quest Optimization**
   - Which quests to complete for resources
   - Skip vs. complete decisions

## Settlement Time Formula (Conceptual)

```
Settlement Time = MAX(
  Time to 200 CP,
  Time to accumulate settler resources,
  Time to build required buildings
)

Where:
- CP accumulation = Daily CP from buildings + Events
- Resource accumulation = Production - Consumption - Building costs
- Building time = Sum of construction times (considering prerequisites)
```

## Data We Need From Game State

### Current State (What we have)
✅ Villages count
✅ Current resources
✅ Basic production
✅ Culture points

### Missing Critical Data (Need to add)
❌ Building levels in each village
❌ Building queue status
❌ Hero level and skills
❌ Gold balance
❌ Active adventures
❌ Quest progress
❌ Troop counts

## Next Steps

1. **Extract Kirilloid data** → TypeScript constants
2. **Create calculator modules** using the data
3. **Connect to game state** from extension
4. **Feed to AI** for recommendations
5. **Test predictions** vs. actual gameplay

## Expected Outcome

With complete Kirilloid data + current game state, the AI can:
- Predict settlement time within 1-2 hours accuracy
- Recommend exact build order for fastest progress
- Calculate when to use gold for maximum impact
- Identify if current strategy will meet goals
- Suggest corrections to get back on track

This transforms Travian from guesswork to precise mathematical optimization.
