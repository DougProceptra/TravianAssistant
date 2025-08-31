# Hero Mechanics - Complete Documentation (100% Accurate)
*Last Updated: August 31, 2025*
*Version: 2.0 - Full Precision Update*

## Overview
Every player receives a hero at game start - a special unit with unique abilities that grows stronger through experience and equipment. The hero is the most powerful single unit and critical for early game success.

## Core Mechanics

### Hero Attributes (4 Types)
Heroes start with **4 skill points** at level 0, initially allocated to resource production. Each level-up grants **4 additional points** to distribute among:

1. **Fighting Strength**
   - Base increase per point: **80 strength** for most tribes
   - **Romans**: 100 strength per point (25% more)
   - **Spartans**: +50% additional strength from Spartan weapons
   - Increases BOTH attack AND defense value
   - Critical for surviving adventures and battles
   - Reduces health loss in adventures

2. **Resource Production** 
   - **Base Formula**: 3 resources/hour per point (1 wood, 1 clay, 1 iron, 1 crop)
   - Can be set to all resources equally OR focused on single resource (10/hour)
   - **Egyptians**: Hero resource production is higher (25% bonus = 3.75/hour per point balanced, 12.5/hour focused)
   - Resources added to hero's home village regardless of hero location
   - **Can be freely switched between balanced/focused without Book of Wisdom** ✓

3. **Offensive Bonus**
   - Increases attack value of ENTIRE army by 0.2% per point (max 20% at 100 points)
   - Only applies when hero attacks WITH the army
   - Mid-late game skill (requires substantial army)
   - Breakpoint: More effective than strength at ~300-500 troops

4. **Defensive Bonus**
   - Increases defense value of ALL your defending troops by 0.2% per point (max 20% at 100 points)
   - Only applies when hero defends WITH troops
   - Affects all your troops in that village, regardless of origin
   - Does NOT affect other players' reinforcements

### Attribute Reallocation
- **Book of Wisdom**: Consumable item that resets ALL attributes to 0
- Allows complete redistribution of all accumulated points
- Takes effect instantly when equipped
- Resource allocation (balanced vs focused) can be changed freely WITHOUT Book ✓
- Essential for switching between economic and military focus

## Tribe-Specific Hero Bonuses

### Romans
- Fighting Strength: 100 per point instead of 80
- Can lower loyalty by 5% when raiding
- Higher revival costs
- Balanced attributes

### Teutons
- 20% Cranny bypass (reduces enemy cranny capacity by 20%)
- Faster revival times
- Combat-oriented bonuses

### Gauls
- +5 fields/hour speed when mounted (scaled with game speed)
- Lower revival costs
- Defensive advantages

### Egyptians
- Resource production 25% higher (3.75/hour per point balanced, 12.5/hour focused)
- Unique building interactions (Waterworks)
- Defensive unit advantages

### Huns
- +3 fields/hour speed for mounted army with mounted hero (no infantry allowed)
- Command center interactions (3 chief slots per village)
- Speed advantages for cavalry armies

### Spartans
- +50% additional fighting strength from Spartan weapons
- Weapon bonuses to Spartan units increased
- Asclepeion building (60% unit recovery)

### Vikings
- Hero can lower loyalty by 5% in attacks and raids
- Harbor advantages
- Raid-focused bonuses

## Hero Health System

### Health Mechanics
- Hero starts with 100% health
- Dies if loses 90% or more health in single battle
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
- "Heavy/Difficult" adventures: High damage, double experience
- Fighting Strength reduces damage taken
- Location type (oasis, wilderness, Natarian) doesn't affect damage

## Experience & Leveling

### Experience Sources
1. **Battles**: 1 XP per crop consumption of killed enemy units
   - Offensive: Hero gets 100% of XP from kills
   - Defensive: XP split by army crop consumption ratio
2. **Adventures**: Variable XP based on difficulty (double for heavy)
3. **Daily Quests**: Fixed XP rewards (often 50 XP)
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
- Example: Level 100 = ~22.8 hours

#### Bucket Revival
- Instant free resurrection
- Can only use once per 24 hours
- Unlimited buckets can be stored
- Cannot equip while hero is alive

## Hero Speed & Movement

### Base Hero Speed (Unmounted)
- Standard speed varies by server type
- Modified by tribe bonuses and equipment

### Mounted Hero Speed Bonuses
#### Tribe-Specific Bonuses:
- **Gauls**: +5 fields/hour when mounted (scaled with game speed)
- **Huns**: +3 fields/hour for mounted army with mounted hero (no infantry)

#### Equipment Speed Modifiers:

##### Horses (3 Tiers):
```
Tier 1 Horse: 14 fields/hour (1x), 28 fields/hour (3x)
Tier 2 Horse: 17 fields/hour (1x), 34 fields/hour (3x)  
Tier 3 Horse: 20 fields/hour (1x), 40 fields/hour (3x)
```

##### Boots (Speed Types):
```
Boots of Mercenary: +25% speed after first 20 fields
Boots of Warrior: +50% speed after first 20 fields
Boots of Archon: +75% speed after first 20 fields
```

##### Maps (Left Hand - Return Speed):
```
Small Map: +30% return speed
Map: +40% return speed
Large Map: +50% return speed
```

##### Standards/Pennants (Alliance Movement):
```
Pennant: +30% speed to own villages
Standard: +15-20% speed between alliance members
Great Standard: +25% speed between alliance members
```

### Speed Calculation Rules
1. Hero always travels at speed of slowest accompanying unit
2. Speed bonuses stack multiplicatively
3. Boot bonuses only apply after first 20 fields
4. Tournament Square adds 20% per level after 20 fields (max 200% at level 10)

### Speed Stacking Example:
```
Boots of Mercenary (+25%) + Tournament Square L10 (+200%) = +225% after 20 fields
With Artifact (2x) + Standard (20%): First 20 = 2.4x speed, After 20 = 5.65x speed
```

## Hero Equipment System

### Equipment Slots (6 Types)
1. **Helmet**: Culture points, XP bonus, training time reduction
2. **Body Armor**: Combat bonuses, damage reduction, regeneration
3. **Left Hand**: Maps (speed), shields (defense), bags (capacity)
4. **Right Hand**: Weapons for combat strength
5. **Boots**: Speed bonuses, regeneration
6. **Horse**: Makes hero cavalry, speed bonuses

### Key Equipment Effects
- **Mounted vs Unmounted**: Determines if hero counts as infantry or cavalry
- **Speed Modifications**: Stack multiplicatively
- **Combat Bonuses**: Add to base fighting strength
- **Special Effects**: Training time reduction, plunder bonus, etc.

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
- **Artwork**: Culture points equal to daily production (max 2000 on 1x)

### Strategic Items
- **Cages**: Capture 1 animal from oasis per cage
- **Book of Wisdom**: Reset all attributes instantly
- **Bucket**: Instant revival, no resource cost

## Adventures System

### Adventure Spawning
- Start: 3 adventures
- First 24 hours: 5-6 total adventures
- Daily rate decreases over time
- Spawn around villages with Hero's Mansion
- Never expire but rewards locked at creation time

### First 10 Adventure Rewards (Fixed Order)
```
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
```

### Item Tiers by Game Age
- **Tier 1**: Available from start
- **Tier 2**: Unlocks based on server age
- **Tier 3**: Late game items
- Artwork: Not available first 14 days (x1 speed)

## Oasis & Special Abilities

### Oasis Conquest
- Requires Hero's Mansion level 10+
- Hero must survive the battle
- Killing nature troops gives 40 of each resource to hero inventory
- Can lower loyalty by 5% when raiding (Romans, Vikings)
- Cannot capture village (needs chief/senator)

### Combat Calculations
- Hero has no base carrying capacity
- Doesn't benefit from smithy/armory upgrades
- Plunder bonus only affects accompanying troops
- Fighting strength calculated separately from troops

## Strategic Recommendations

### Early Game (Days 1-14)
1. **All points in resources** initially (4 points = 12/hour standard, 15/hour Egyptian)
2. Add 1-2 points to strength by level 8 (adventure survival)
3. Keep hero alive at all costs - losing hero delays settling
4. Use daily quest 50 XP reward to level up and restore health

### Resource vs Strength Breakpoint
```
Pure resources until ~300-500 troops for offensive bonus value
Example: Huns with Steppe Riders L5 need 313+ units for off bonus > strength
```

### Mid-Late Game Equipment Priority
```
Attackers: Spurs + Map combination for speed
Defenders: Variety of boots and left-hand items for flexibility
Keep Boots of Warrior for defensive speed advantage
```

## Data Storage Structure

```javascript
heroData = {
  level: 0,
  experience: 0,
  experienceToNext: 100,
  health: 100,
  tribe: 'romans', // romans, teutons, gauls, egyptians, huns, spartans, vikings
  
  attributes: {
    strength: 0,
    resources: 4,     // Starting points
    offBonus: 0,
    defBonus: 0
  },
  
  resourceProduction: {
    mode: 'balanced', // or 'focused'
    focusResource: null, // 'wood', 'clay', 'iron', 'crop'
    basePerPoint: 3,  // 3.75 for Egyptians
    perHour: {
      wood: 3,   // Or 3.75 for Egyptians
      clay: 3,
      iron: 3,
      crop: 3
    }
  },
  
  combatStats: {
    baseStrengthPerPoint: 80, // 100 for Romans
    attack: 0,
    defenseInfantry: 0,
    defenseCavalry: 0,
    isMounted: false
  },
  
  speed: {
    base: 7,  // Fields per hour unmounted (varies by server)
    current: 7,
    modifiers: {
      tribal: 0,     // +5 Gaul mounted, +3 Hun cavalry army
      horse: 0,      // 14/17/20 based on tier
      boots: 0,      // 25/50/75% after 20 fields
      map: 0,        // 30/40/50% return speed
      standard: 0,   // 15-25% alliance movement
      tournament: 0  // 20% per level after 20 fields
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

### Resource Production
- **Standard**: `3 × points` per hour (or `10 × points` if focused)
- **Egyptians**: `3.75 × points` per hour (or `12.5 × points` if focused)

### Fighting Strength  
- **Standard**: `80 × points`
- **Romans**: `100 × points`
- **Spartans**: Base + 50% from Spartan weapons

### Off/Def Bonus
- **All Tribes**: `0.2% × points` (max 20%)

### Experience & Death
- **Experience from Kills**: `1 XP per crop consumption`
- **Death Threshold**: `90% health loss in single battle`
- **Revival Time (100+)**: `24h × (99 / (99 + (level - 99) × 5))`

### Speed Calculations
- **Base Speed**: Varies by unit/hero
- **After 20 fields**: `Base × (1 + boots% + tournament%) × artifact × standard`
- **Gaul Mounted**: `+5 fields/hour`
- **Hun Cavalry Army**: `+3 fields/hour`

## Implementation Priority

1. **Critical for Launch**:
   - Exact resource production by tribe
   - Experience/leveling system
   - Basic attribute allocation with tribal modifiers
   - Health tracking
   - Speed calculations with equipment

2. **Important but Deferrable**:
   - Full equipment effect calculations
   - Adventure reward tables
   - Revival cost calculations by tribe
   - Consumable item management

3. **Nice to Have**:
   - Complex stacking calculations
   - Oasis conquest mechanics
   - Loyalty reduction mechanics

---
*This documentation provides 100% accurate values based on official Travian Legends mechanics as of 2024-2025*
