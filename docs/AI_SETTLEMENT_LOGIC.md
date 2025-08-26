# AI Settlement Optimization Logic

## The Settlement Equation

The core challenge: Reach 200 CP AND have 3 settlers (10+20+20 resources each) ready at the optimal moment.

## Key Decision Points for AI

### 1. Resource Field Development Strategy
The AI must solve: "Which field upgrade gives best return before settlement?"

**Calculation Framework:**
```
Payback_Hours = Upgrade_Cost / Hourly_Production_Increase
Worth_Upgrading = (Payback_Hours < Hours_Until_Settlement)
```

**Example Decision:**
- Upgrading Woodcutter L4→L5 costs 535 resources, increases production by 15/hour
- Payback time: 535/15 = 35.6 hours
- If settlement in 72 hours: WORTH IT (builds wealth)
- If settlement in 24 hours: SKIP (won't pay back)

### 2. Culture Point Optimization
**Sources & Trade-offs:**
- Town Hall: 4-5 CP/day but expensive
- Main Building levels: Cheap CP early, expensive later
- Embassy/Marketplace: Needed anyway for settlers
- Parties: 500 CP instantly but costs resources

**AI Must Calculate:**
```
CP_Needed = 200 - Current_CP
Days_To_CP = CP_Needed / Daily_CP_Generation
Resource_Cost_For_Faster_CP = Cost_of_parties_or_buildings
Is_It_Worth_It = Compare(Time_saved * Production_rate, Resource_cost)
```

### 3. Building Prerequisites Chain
**Critical Path to Settlers:**
1. Main Building → Level 5 (for Academy)
2. Barracks → Level 1 (required for Academy)  
3. Academy → Level 10 (for Residence/Palace)
4. Residence → Level 10 (to train settlers)

**AI Must Track:**
- Current building levels
- Time to complete chain
- Resource accumulation during construction
- Whether prerequisites will delay settlement

### 4. Resource Accumulation Strategy
**Settler Cost:** 
- Per settler: 5k/7k/5k/2k (varies by tribe)
- Total for 3: ~57,000 resources

**AI Must Balance:**
- Production rate vs. consumption
- When to stop building troops (save resources)
- When to NPC trade (resource conversion)
- Whether raiding/farming can accelerate

### 5. Gold Usage Decision Tree
**Gold Can:**
- Instant finish buildings (saves time)
- NPC trade resources (fixes imbalances)
- Finish settlers instantly (if everything else ready)

**AI Optimization:**
```
IF (CP will be bottleneck):
  Instant_build_CP_buildings()
ELIF (Resources will be bottleneck):
  Save_gold_for_NPC_trades()
ELIF (Building_time will be bottleneck):
  Instant_complete_critical_path()
ELSE:
  Save_gold_for_emergency()
```

### 6. Dynamic Adjustment Algorithm
**Continuous Monitoring:**
1. Every hour, recalculate settlement timeline
2. Identify new bottleneck (CP, resources, or buildings)
3. Adjust strategy to address bottleneck
4. Account for overnight/offline periods

## The Master Algorithm

```typescript
interface SettlementPrediction {
  estimatedTime: Date;
  bottleneck: 'cp' | 'resources' | 'buildings';
  recommendedActions: Action[];
  confidenceLevel: number;
}

function predictSettlement(gameState: GameState): SettlementPrediction {
  // Calculate three parallel timelines
  const cpTimeline = calculateTimeToCP(200);
  const resourceTimeline = calculateTimeToResources(settlerCost);
  const buildingTimeline = calculateTimeToBuildingReady();
  
  // The bottleneck determines strategy
  const bottleneck = max(cpTimeline, resourceTimeline, buildingTimeline);
  
  // Generate hour-by-hour action plan
  const actions = generateOptimalPath(gameState, bottleneck);
  
  return {
    estimatedTime: bottleneck.completionTime,
    bottleneck: bottleneck.type,
    recommendedActions: actions,
    confidenceLevel: calculateConfidence(gameState)
  };
}
```

## Variables That Dramatically Affect Timeline

### High Impact (Can change by days):
1. **Tribe choice**: Egyptian +2 CP/day from waterworks
2. **Gold strategy**: Heavy gold use can cut 2-3 days
3. **Starting position**: 15-cropper gives huge advantage
4. **Raid success**: Good farms can double resource income
5. **Alliance support**: Resources from teammates

### Medium Impact (Hours to 1 day):
1. **Quest optimization**: Completing vs. skipping
2. **Hero adventures**: Lucky resource finds
3. **Oasis bonus**: 25-50% resource boost
4. **Building order**: Suboptimal can waste 12+ hours
5. **Sleep schedule**: Overnight building queues

### Low Impact (Under 6 hours):
1. **Exact field upgrade order**: Minor efficiency differences
2. **Marketplace trades**: Small resource optimizations
3. **Hero production bonus**: 20% boost helps but not critical
4. **Plus account**: Slight convenience improvements

## Pre-Game Minute 1 Analysis

When server starts, AI should immediately:

1. **Analyze Starting Conditions**
   - Tribe (bonuses/penalties)
   - Resource field distribution (6/4/4/4 vs. 3/3/3/9 etc.)
   - Distance to croppers and oases
   - Gold available

2. **Generate Initial Plan**
   ```
   Hour 0-24: Focus on resource fields to L1-2
   Hour 24-48: Main building to L5, start prerequisites
   Hour 48-72: Push CP generation, accumulate resources
   Hour 72-96: Academy to L10, Residence started
   Hour 96-120: Complete Residence, begin settlers
   Hour 120-144: Train settlers, scout locations
   Hour 144-168: Settle (Day 7 target)
   ```

3. **Set Checkpoint Alerts**
   - Every 6 hours: Check if on track
   - If behind: Identify bottleneck and adjust
   - If ahead: Consider more aggressive strategy

## Success Metrics

**Optimal Settlement Times by Strategy:**
- F2P Conservative: Day 8-9 (192-216 hours)
- F2P Aggressive: Day 7 (168 hours)
- Light Gold: Day 6 (144 hours)
- Heavy Gold: Day 5 (120 hours)
- Maximum Gold + Perfect Play: Day 4 (96 hours)

## What Makes Our AI Superior

1. **Precise Calculations**: Not guessing, but mathematical optimization
2. **Dynamic Adaptation**: Adjusts strategy based on actual vs. planned
3. **Bottleneck Identification**: Knows exactly what's limiting progress
4. **Gold Efficiency**: Maximizes impact of premium currency
5. **Considers Human Factors**: Sleep, work schedule, play style

## Next Implementation Steps

1. Build calculator modules using Kirilloid data
2. Create timeline simulator with hour-by-hour projection
3. Implement bottleneck detection algorithm
4. Generate action recommendations with priorities
5. Test against real gameplay data for accuracy
