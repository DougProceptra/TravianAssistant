# Hero Mechanics - Complete Documentation
*Last Updated: August 31, 2025*

## Overview
Every player receives a hero at game start - a special unit with unique abilities that grows stronger through experience and equipment. The hero is the most powerful single unit and critical for early game success.

## Core Mechanics

### Hero Attributes (4 Types)
Heroes start with **4 skill points** at level 0, initially allocated to resource production. Each level-up grants **4 additional points** to distribute among:

1. **Fighting Strength**
   - Increases hero's attack AND defense value
   - Each point adds 80 strength (100 for certain tribes)
   - Critical for surviving adventures and battles
   - Reduces health loss in adventures

2. **Resource Production** 
   - **Formula: 3 resources/hour per point** (1 wood, 1 clay, 1 iron, 1 crop)
   - Can be set to all resources equally OR focused on single resource (10/hour)
   - Resources added to hero's home village regardless of hero location
   - Can be freely switched between balanced/focused without Book of Wisdom

3. **Offensive Bonus**
   - Increases attack value of ENTIRE army by **0.2% per point** (max 20% at 100 points)
   - Only applies when hero attacks WITH the army
   - Mid-late game skill (requires substantial army)

4. **Defensive Bonus**
   - Increases defense value of ALL your defending troops by **0.2% per point** (max 20% at 100 points)
   - Only applies when hero defends WITH troops
   - Affects all your troops in that village, regardless of origin
   - Does NOT affect other players' reinforcements

### Attribute Reallocation
- **Book of Wisdom**: Consumable item that resets ALL attributes to 0
- Allows complete redistribution of all accumulated points
- Takes effect instantly when equipped
- Cannot be used to redistribute within resource types without Book
- Essential for switching between economic and military focus

## Hero Health System

### Health Mechanics
- Hero starts with 100% health
- Dies if loses **90% or more health in single battle**
- Cannot see exact health loss in battle reports
- Health loss approximates percentage of accompanying troops killed

### Health Recovery Methods
1. **Level Up**: Instantly restores to 100% health (free)
2. **Ointments**: Each heals 1% health when equipped (stackable)
3. **Natural Regeneration**: Slow passive recovery
4. **Death & Revival**: Returns at 100% after resurrection

### Adventure Health Loss
- Damage increases with adventure number
- "Normal" adventures: Low damage, low experience
- "Heavy" adventures: High damage, double experience
- Fighting Strength reduces damage taken
- Location type (oasis, wilderness, Natarian) doesn't affect damage

## Experience & Leveling

### Experience Sources
1. **Battles**: 1 XP per crop consumption of killed enemy units
   - Offensive: Hero gets 100% of XP from kills
   - Defensive: XP split by army crop consumption ratio
2. **Adventures**: Variable XP based on difficulty
3. **Daily Quests**: Fixed XP rewards
4. **Task System**: Village task completions
5. **Scrolls**: Instant 10 XP per scroll (consumable)

### Experience Modifiers
- **Helmet of Awareness**: +15% to all XP gained
- **Gladiator Helmet**: Additional XP bonus
- Experience bonuses stack and apply to all sources

### Level Progression
- Each level requires progressively more XP
- Level 0→1: Minimal XP required
- Higher levels need exponentially more experience
- No level cap (can exceed level 100)

## Hero Death & Revival

### Death Conditions
- Loses 90%+ health in single battle
- Starvation (no crop in village)
- Cannot die from accumulated damage across multiple battles

### Revival Methods

#### Resource Revival
**Base Formula**: Cost and time depend on hero level and tribe
- Maximum revival time: 24 hours
- After level 100: `Revival Time = 24h × (99 / (99 + (level - 99) × 5))`
- Example: Level 101 = 24h × (99/104) ≈ 22.8 hours

**Tribal Resource Costs** (scales with level):
- Romans: Higher iron costs
- Teutons: Balanced costs, faster revival
- Gauls: Lower overall costs
- Egyptians/Huns: Specific formulas per tribe

#### Bucket Revival
- Instant free resurrection
- Can only use once per 24 hours
- Unlimited buckets can be stored
- Cannot equip while hero is alive

## Hero Equipment System

### Equipment Slots (6 Types)
1. **Helmet**: Culture points, XP bonus, training time reduction
2. **Body Armor**: Combat bonuses, damage reduction
3. **Left Hand**: Maps (speed), shields (defense), bags (capacity)
4. **Right Hand**: Weapons for combat strength
5. **Boots**: Speed bonuses, regeneration
6. **Horse**: Makes hero cavalry, speed bonuses

### Key Equipment Effects
- **Mounted vs Unmounted**: Determines if hero counts as infantry or cavalry
- **Speed Modifications**: Stack with troop speed but hero moves at slowest unit's pace
- **Combat Bonuses**: Add to base fighting strength
- **Special Effects**: Training time reduction, plunder bonus, etc.

## Hero Movement & Control

### Home Village Management
- Hero bound to one village at a time
- Can change home village by:
  1. Send as reinforcement to own village
  2. Check "Change hero home village" box
  3. Hero relocates upon arrival
- Resources always produced in home village

### Speed Calculations
- Base speed depends on tribe
- **Mounted bonuses**:
  - Standard: +5 fields/hour
  - With cavalry army: +3 fields/hour (no infantry allowed)
- Always travels at speed of slowest accompanying unit
- Speed bonuses scale with game world speed

## Consumable Items

### Combat Items
- **Small Bandages**: Heal 1 troop each, max 25% of losses
- **Regular Bandages**: Heal 1 troop each, max 33% of losses
- **Healing time**: Equal to return time, minimum 24 hours
- Must be in hero's bag during battle

### Instant-Use Items
- **Ointments**: 1% health per ointment
- **Scrolls**: 10 XP each
- **Tablets of Law**: +1% loyalty per tablet (max 125%)
- **Artwork**: Culture points equal to daily production (max 2000)

### Strategic Items
- **Cages**: Capture animals from oases (1 per cage)
- **Book of Wisdom**: Reset all attributes
- **Bucket**: Instant revival

## Adventures System

### Adventure Spawning
- Start: 3 adventures
- First 24 hours: 5-6 total adventures
- Daily rate decreases over time
- Spawn around villages with Hero's Mansion
- Never expire but rewards locked at creation time

### First 10 Adventure Rewards (Fixed Order)
1. Horse
2. Resources
3. Troops
4. Silver
5. Ointment
6. Book of Wisdom
7. Resources
8. Silver
9. Cages
10. Experience only

### Random Rewards (After First 10)
- Resources (most common)
- Equipment (rare)
- Silver
- Troops
- Nothing (XP only)

### Item Tiers by Game Age
- **Tier 1**: Available from start
- **Tier 2**: Unlocks based on server age
- **Tier 3**: Late game items
- Artwork: Not available first 14 days (x1 speed)

## Tribe-Specific Bonuses

### Romans
- Hero strength: 100 per point (instead of 80)
- Higher revival costs
- Balanced attributes

### Teutons
- 20% Cranny bypass (plunder bonus)
- Faster revival times
- Combat-oriented bonuses

### Gauls
- +5 speed when mounted (+10 on 3x)
- Lower revival costs
- Defensive advantages

### Egyptians
- Higher resource production modifier
- Unique building interactions
- Special hero abilities (T5)

### Huns
- +3 mounted army speed bonus
- Command center interactions
- Unique cavalry bonuses

## Oasis & Special Abilities

### Oasis Conquest
- Requires Hero's Mansion level 10+
- Hero must survive the battle
- Can lower loyalty by 5% when raiding
- Cannot capture village (needs chief/senator)

### Combat Calculations
- Hero has no base carrying capacity
- Doesn't benefit from smithy/armory upgrades
- Plunder bonus only affects accompanying troops
- Fighting strength calculated separately from troops

## Strategic Recommendations

### Early Game (Days 1-14)
1. **All points in resources** initially (4 points = 12/hour)
2. Add 1-2 points to strength by level 8 (adventure survival)
3. Keep hero alive at all costs - losing hero delays settling

### Resource vs Strength Breakpoint
- Pure resources until ~500 troops for offensive bonus value
- Defensive bonus valuable with 200+ defensive troops
- Keep Books of Wisdom for strategic switches

### Settlement Phase (Days 5-10)
- Maintain resource focus for faster development
- Use adventures for resource/equipment gathering
- Save ointments for emergency healing

### Mid Game (Day 14+)
- Gradually shift to offensive/defensive bonus
- Match hero role to account strategy
- Equipment becomes crucial for effectiveness

## Data Storage Structure

```javascript
heroData = {
  level: 0,
  experience: 0,
  experienceToNext: 100,
  health: 100,
  
  attributes: {
    strength: 0,
    resources: 4,     // Starting points
    offBonus: 0,
    defBonus: 0
  },
  
  resourceProduction: {
    mode: 'balanced', // or 'focused'
    focusResource: null, // 'wood', 'clay', 'iron', 'crop'
    perHour: {
      wood: 3,
      clay: 3,
      iron: 3,
      crop: 3
    }
  },
  
  equipment: {
    helmet: null,
    body: null,
    leftHand: null,
    rightHand: null,
    boots: null,
    horse: null
  },
  
  inventory: {
    ointments: 0,
    smallBandages: 0,
    bandages: 0,
    cages: 0,
    scrolls: 0,
    tabletsOfLaw: 0,
    buckets: 0,
    booksOfWisdom: 0,
    artwork: 0
  },
  
  status: {
    isAlive: true,
    isMounted: false,
    homeVillage: 'v1',
    currentLocation: 'v1',
    isOnAdventure: false
  },
  
  revival: {
    timeRemaining: 0,
    resourceCost: {
      wood: 0,
      clay: 0,
      iron: 0,
      crop: 0
    }
  }
}
```

## Critical Formulas Summary

1. **Resource Production**: `3 × points` per hour (or `10 × points` if focused)
2. **Fighting Strength**: `80 × points` (100 for Romans)
3. **Off/Def Bonus**: `0.2% × points` (max 20%)
4. **Experience from Kills**: `1 XP per crop consumption`
5. **Revival Time (100+)**: `24h × (99 / (99 + (level - 99) × 5))`
6. **Death Threshold**: `90% health loss in single battle`

## Implementation Priority

1. **Critical for Launch**:
   - Resource production calculation
   - Experience/leveling system
   - Basic attribute allocation
   - Health tracking

2. **Important but Deferrable**:
   - Equipment effects
   - Adventure rewards
   - Revival calculations
   - Consumable items

3. **Nice to Have**:
   - Tribe-specific bonuses
   - Oasis interactions
   - Complex battle calculations
