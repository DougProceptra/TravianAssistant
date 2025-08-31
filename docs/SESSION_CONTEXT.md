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

### What's MISSING for Launch 🔴

#### 1. TROOP CALCULATIONS (Critical)
- **Training time formulas** - How long to train each unit
- **Training costs** - Resources needed per unit
- **Barracks/Stable queue optimization** - Parallel training
- **Hero interaction with troops** - Fighting strength bonus
- **Troop upkeep impact** - Crop consumption calculations
- **Settler training optimization** - Critical for 7-day goal

#### 2. HERO MECHANICS (Critical for Early Game)
- **Hero resource production** - How much bonus per point
- **Hero adventure rewards** - Expected value calculations
- **Hero fighting strength** - Impact on early raids
- **Hero item management** - Which items to keep/use
- **Hero experience optimization** - Adventure vs combat
- **Skill point allocation** - Resource vs strength early game

#### 3. EARLY GAME SPECIFICS
- **Quest optimization path** - Which quests when
- **Adventure timing** - When to send hero
- **First raid timing** - When to build troops vs economy
- **Robber hideout strategies** - Clear or ignore?
- **Oasis capture timing** - When is it worth it?
- **Resource field vs building priorities** - Exact breakpoints

#### 4. TRIBE-SPECIFIC CALCULATIONS
- **Egyptian waterworks** - When to build, impact
- **Roman double build queue** - How to optimize
- **Teuton raiding bonus** - Changes early strategy
- **Gaul defensive benefits** - Impact on troop choices
- **Hun command center** - Settlement strategy changes

## SESSION 3 TO-DO LIST (Next 36 Hours)

### Immediate Priority (Next 4 hours)
1. **Integrate troop calculations into engine**
   - Training time formulas with barracks/stable levels
   - Exact resource costs from loaded data
   - Upkeep calculations affecting economy

2. **Add hero system**
   - Resource production bonus formula
   - Fighting strength calculations
   - Adventure probability tables
   - Experience requirements per level

3. **Calculate settler timing precisely**
   - Residence build requirements
   - Resource accumulation needed (5000/7000/5000/4000)
   - Training time with modifiers
   - Optimal timing for top-5 finish

### Before Launch (Next 32 hours)
1. **Test complete 7-day simulation**
   - Hour-by-hour build order
   - Resource balance checkpoints
   - CP accumulation tracking
   - Settler readiness confirmation

2. **Create quick reference guide**
   - First 24 hours exact steps
   - Gold spending priorities
   - Hero point allocation
   - Raid timing guidelines

3. **Package for easy use**
   - Simple HTML interface if no extension
   - Copy-paste build orders
   - Calculator for current state input

## Key Questions to Resolve

### Troop Questions
1. What's the exact formula for troop training time?
2. How do barracks/stable levels affect training speed?
3. What's the Great Barracks/Stable speed bonus?
4. How does hero helmet affect training time?

### Hero Questions
1. Resource production: Is it 4 resources/hour per point at 1x?
2. Fighting strength: What's the combat formula?
3. Adventure rewards: What's the probability distribution?
4. When should hero switch from adventures to raiding?

### Early Game Decisions
1. First troop: When? (Usually day 2-3)
2. Raid vs pure economy: Breakpoint calculation
3. Oasis: 25% bonus worth the troops?
4. Second village location: How far is optimal?

## Data Still Needed

### From Kirilloid or Game Knowledge
1. **Hero formulas** - Production, strength, experience
2. **Training speed formulas** - Per building level
3. **Combat formulas** - For early raids
4. **Quest rewards** - Exact values for planning
5. **Adventure rewards** - Probability tables

### From Game Experience
1. **Optimal opening moves** per tribe
2. **Gold spending priorities** for top-5
3. **Hero skill distribution** for fast start
4. **Raid timing** for server start

## Current File Structure
```
/calculation-engine/
├── index.js           [🔶 Needs troop/hero integration]
└── test.js            [🔶 Needs troop/hero tests]

/data/
├── buildings/         [✅ Complete]
├── troops/           [✅ Loaded, 🔴 Not integrated]
├── production/       [🔴 Need base formulas]
├── combat/           [🔴 Need hero/combat formulas]
├── quests/           [🔴 Need quest data]
└── tribe-specific/   [🔴 Need bonus values]
```

## Server Launch Countdown

### September 1, 2025 - Launch Day
- **Time Remaining**: ~36 hours
- **Critical Path**: Troop calculations → Hero mechanics → Full test
- **Minimum Viable**: Building optimizer + manual troop timing
- **Goal**: Complete system with troop/hero optimization

### If We Run Out of Time
**Fallback Plan**: 
- Use building optimizer for economy
- Manual calculations for troops/hero
- Reference sheet for key timings
- Update system during first week

## Session Notes

### Current Blockers
1. Don't have troop training formulas
2. Don't have hero mechanics formulas  
3. Haven't integrated troop data yet
4. Need to test complete 7-day simulation

### What's Working
- Building calculations are accurate
- Data structure is solid
- Architecture is extensible
- Core optimizer logic is sound

### Next 4 Hours Focus
1. Research/extract troop training formulas
2. Integrate troop data into calculator
3. Add hero mechanics
4. Test settler timing calculations

---
*Session 3 continues. 36 hours to server launch. Focus on troops and hero mechanics.*
*Building system complete, troop system critical for launch readiness.*