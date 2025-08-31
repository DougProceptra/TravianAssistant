# SESSION_CONTEXT.md
*Last Updated: August 30, 2025 - Session 3 In Progress*
*Server Launch: September 1, 2025 (36 hours remaining)*

## Project: TravianAssistant V3
Browser-based AI assistant for Travian Legends gameplay optimization

## Mission Statement
Transform Travian gameplay from tedious spreadsheet calculations to AI-powered strategic excellence, enabling top-20 competitive play in under 2 hours per day.

## CRITICAL STATUS - 36 HOURS TO LAUNCH

### What's Complete ✅
1. **Building Calculation Engine** 
   - Build time formulas with modifiers
   - Resource costs and requirements
   - Basic ROI calculations
   - Building data fully loaded

2. **Basic Game Start Framework**
   - Phase detection system
   - Build order generation (buildings only)
   - Resource optimization

3. **Data Organization**
   - Building data: Complete
   - Troop data: Loaded but NOT integrated
   - Folder structure: Ready

4. **Troop Training Time Formula ✅ DISCOVERED**
   - Formula: `Training Time = Base Time × 0.9^(Building Level - 1)`
   - Each building level reduces training time by 10% (multiplicative)
   - Applies to: Barracks (military), Stable (cavalry), Workshop (siege), Residence/Palace (settlers)
   - Verified with Kirilloid data across 6 levels

### Critical Training Time Insights

#### Settler Training (Residence/Palace)
- **Base time**: ~7.5 hours per settler
- **Residence 10** (required for settlers): ~3.5 hours per settler
- **Residence 15**: ~2.3 hours per settler
- **Residence 20**: ~1.5 hours per settler
- **Total for 3 settlers at Res 10**: ~10.5 hours

#### Military Units (Barracks)
- **Legionnaire base**: 28 minutes
- **Barracks 5**: ~18 minutes per unit
- **Barracks 10**: ~12 minutes per unit
- **Early raids possible**: 10 troops in 3-5 hours

#### Research Costs (Academy)
- Level 1 research: 940 wood, 800 clay, 1250 iron, 370 crop
- Must factor into settlement resource planning
- Research time also affected by Academy level

### What's MISSING for Launch 🔴

#### 1. HERO MECHANICS (Critical for Early Game)
- **Hero resource production** - How much bonus per point (likely 4/hour at 1x)
- **Hero fighting strength** - Impact on early raids
- **Hero adventure rewards** - Expected value calculations
- **Hero experience optimization** - Adventure vs combat
- **Skill point allocation** - Resource vs strength early game
- **Hero item management** - Which items to keep/use

#### 2. EARLY GAME SPECIFICS
- **Quest optimization path** - Which quests when
- **Adventure timing** - When to send hero
- **First raid timing** - When to build troops vs economy
- **Robber hideout strategies** - Clear or ignore?
- **Oasis capture timing** - When is it worth it?
- **Resource field vs building priorities** - Exact breakpoints

#### 3. TRIBE-SPECIFIC CALCULATIONS
- **Egyptian waterworks** - When to build, impact
- **Roman double build queue** - How to optimize
- **Teuton raiding bonus** - Changes early strategy
- **Gaul defensive benefits** - Impact on troop choices
- **Hun command center** - Settlement strategy changes

#### 4. INTEGRATION TASKS
- **Add troop training calculations to engine**
- **Connect troop data to calculator**
- **Implement Great Barracks/Stable modifiers**
- **Add troop upkeep calculations**

## SESSION 3 TO-DO LIST (Next 36 Hours)

### Immediate Priority (Next 4 hours)
1. **Integrate troop calculations into engine**
   - ✅ Training time formula discovered: `Base × 0.9^(Level-1)`
   - Need to implement in calculator
   - Add Great Barracks/Stable 3x speed bonus
   - Calculate total resource costs including research

2. **Add hero system**
   - Resource production bonus formula (4/hour per point?)
   - Fighting strength calculations
   - Adventure probability tables
   - Experience requirements per level

3. **Calculate precise settlement timing**
   - Residence 10 build path
   - Resource accumulation (13800/16200/12600/11700 total for 3 settlers)
   - Training time: 10.5 hours at Residence 10
   - Optimal timing for top-5 finish

### Before Launch (Next 32 hours)
1. **Test complete 7-day simulation**
   - Hour-by-hour build order
   - Resource balance checkpoints
   - CP accumulation tracking
   - Settler training schedule

2. **Create quick reference guide**
   - First 24 hours exact steps
   - Gold spending priorities
   - Hero point allocation
   - Raid timing guidelines

3. **Package for easy use**
   - Simple HTML interface if no extension
   - Copy-paste build orders
   - Calculator for current state input

## Key Formulas Confirmed

### Building Construction
```javascript
Build Time = (Base Time / Server Speed) / MB Multiplier / Other Multipliers
MB Multipliers = [1.00, 1.00, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.29, 1.34, 1.39, 1.44, 1.50, 1.55, 1.61, 1.67, 1.73, 1.80, 1.87, 1.93, 2.01]
```

### Troop Training
```javascript
Training Time = Base Time × 0.9^(Building Level - 1)
// Each level reduces time by 10% multiplicatively
// Great Barracks/Stable: Additional 3x speed bonus
```

## Settlement Critical Path

### Resource Requirements (3 Settlers)
- Wood: 13,800
- Clay: 16,200  
- Iron: 12,600
- Crop: 11,700
- Training Time: ~10.5 hours at Residence 10

### Optimal Timeline
1. **Day 1-2**: Resource field development
2. **Day 3-4**: CP buildings, Main Building push
3. **Day 5**: Residence to 10
4. **Day 6**: Resource accumulation
5. **Day 6-7**: Train settlers (10.5 hours)
6. **Day 7**: SETTLE!

## Current File Structure
```
/calculation-engine/
├── index.js           [🔶 Needs troop training integration]
└── test.js            [🔶 Needs troop training tests]

/data/
├── buildings/         [✅ Complete]
├── troops/           [✅ Loaded, 🔶 Needs integration]
├── production/       [🔴 Need base formulas]
├── combat/           [🔴 Need hero/combat formulas]
├── quests/           [🔴 Need quest data]
└── tribe-specific/   [🔴 Need bonus values]
```

## Server Launch Countdown

### September 1, 2025 - Launch Day
- **Time Remaining**: ~36 hours
- **Critical Path**: Integrate troop training → Hero mechanics → Full test
- **Minimum Viable**: Building + Troop calculators working
- **Goal**: Complete system with troop/hero optimization

### If We Run Out of Time
**Fallback Plan**: 
- Use building optimizer for economy
- Manual calculation for troops using formula: `Base × 0.9^(Level-1)`
- Reference sheet for hero decisions
- Update system during first week

## Session Notes

### Major Discoveries
- **Troop training formula confirmed**: 10% reduction per building level
- **Settlers train in Residence**, not Barracks (important correction)
- **Residence 10 gives automatic speed boost** for settler training
- **Total settler time is manageable**: 10.5 hours at Res 10

### Current Blockers
1. Hero mechanics formulas not confirmed
2. Troop calculator not yet integrated
3. Quest optimization path unclear
4. Tribe-specific bonuses not quantified

### What's Working
- Building calculations are accurate
- Troop training formula discovered and verified
- Data structure is solid
- Core optimizer logic is sound

### Next Hour Focus
1. Implement troop training formula in calculator
2. Add settler timing calculations
3. Test full 7-day simulation with troops
4. Create hero mechanics framework

---
*Session 3 continues. 36 hours to server launch.*
*Major progress: Troop training formula discovered. Next: Integration and hero mechanics.*