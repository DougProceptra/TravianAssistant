# SESSION_CONTEXT.md
*Last Updated: August 31, 2025 10:30 AM MT*
*Session Focus: Hero & Troop Mechanics Implementation*

## Current Session Status
Working on completing troop data extraction for AI calculations. Hero mechanics documentation completed with 100% accuracy.

## Critical Timeline
- **Launch Date**: September 1, 2025 (Tomorrow!)
- **Time Remaining**: ~36 hours
- **Priority**: Get troop training calculations integrated TODAY

## ✅ Completed This Session

### Hero Mechanics (DONE)
- Created comprehensive `/data/hero/hero-mechanics.md` with:
  - Exact tribal bonuses (Romans: 100 str/point, Egyptians: 25% resource bonus, etc.)
  - Complete speed calculations with equipment
  - All consumable items and effects
  - Resource production formulas (3/hour standard, 3.75/hour Egyptian)
  - Experience and leveling system
  - Death/revival mechanics with formulas
  - Can switch resource allocation (balanced/focused) WITHOUT Book of Wisdom ✓

### Troop Data Status (IN PROGRESS)
- **Have**: Basic troop stats in `/data/troops/travian_all_tribes_complete.json`
  - Attack/Defense values ✓
  - Speed values ✓
  - Cost values ✓
  - Carrying capacity ✓
  - BUT: Training times are wrong (just "1", "2", etc.)
  - BUT: Consumption values are wrong (too high)

## 🔴 Current Blocker: Incomplete Troop Data

### Extraction Script Issues
1. **Missing Tribes**: Spartans and Vikings not in Kirilloid dropdown
2. **Script Location**: `/scripts/extraction/browser-extract-troops.js`
3. **Target URL**: http://travian.kirilloid.ru/troops.php (set to 1x speed)

### Successfully Extracted (6 tribes):
```javascript
// Data available in browser as window.troopData
{
  "Roman": 10 troops,
  "Teutonic": 10 troops,
  "Gallic": 10 troops,
  "Egyptian": 10 troops,
  "Huns": 10 troops,
  "Nature": 10 troops
}
```

### Still Needed:
- **Spartan troops** (not in dropdown - may need different source)
- **Viking troops** (not in dropdown - may need different source)
- **Natarian troops** (optional, for completeness)
- **Correct training times in seconds** (partially captured)
- **Fix consumption values** (divide by something?)

## Training Time Formula Confirmed
```javascript
Training Time = Base Time × 0.9^(Building Level - 1)
// Each level reduces by 10%
// Great Barracks/Stable: Additional 3× speed
```

## AI Requirements for Scenarios

### What AI Needs to Answer User Scenarios:
1. **Combat calculations**: Attack/defense values ✓
2. **Movement calculations**: Speed values ✓
3. **Economic calculations**: Cost, upkeep, carrying capacity (partial)
4. **Training optimization**: Base training times ✗
5. **Building requirements**: Academy levels, prerequisites ✗

### Example Scenarios to Support:
1. Egyptian slave militia raiding optimization
2. Roman cheap raider selection
3. Gaul hero + Theutates Thunder combinations

## Next Steps (Priority Order)

### 1. Complete Troop Data Extraction (Next 2 hours)
- [ ] Find source for Spartan/Viking troops
- [ ] Fix training_time values to actual seconds
- [ ] Fix consumption values (likely crop/hour upkeep)
- [ ] Add building requirements (Academy levels)

### 2. Alternative Data Sources to Try:
```javascript
// Option 1: Check for different server versions
http://travian.kirilloid.ru/troops.php?s=6  // Version 6?
http://travian.kirilloid.ru/troops.php?s=7  // Version 7?

// Option 2: Direct data files
http://travian.kirilloid.ru/data/troops.json
http://travian.kirilloid.ru/js/troops.js

// Option 3: Official Travian wiki
https://wiki.travian.com/Troops
```

### 3. Create Consolidated Troop Data File:
```javascript
// Target structure: /data/troops/troops_complete.json
{
  "tribes": {
    "romans": {
      "troops": [...],
      "bonuses": {...}
    },
    // ... all 7 tribes
  },
  "mechanics": {
    "training_formula": "base_time * 0.9^(level-1)",
    "great_building_multiplier": 3,
    "combat_formulas": {...}
  },
  "nature_troops": [...],
  "building_requirements": {...}
}
```

## Script Refinement Needed

### Current Script Location:
`/scripts/extraction/browser-extract-troops.js`

### Issues to Fix:
1. **Tribe Detection**: Script can't find Spartans/Vikings in dropdown
2. **Time Parsing**: Successfully parsing MM:SS and H:MM:SS formats ✓
3. **Building Assignment**: Logic for barracks/stable/workshop mostly correct ✓
4. **Async Handling**: Working but could be more robust

### Working Script Pattern:
```javascript
// This part works:
const timeText = cells[12]?.textContent.trim() || '';
let trainingSeconds = 0;

if (timeText && timeText.includes(':')) {
    const parts = timeText.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 2) {
        // MM:SS
        trainingSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        // H:MM:SS
        trainingSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
}
```

## Known Good Data Points (for validation)

### Egyptian Slave Militia (confirmed):
- Attack: 10
- Def Infantry: 30
- Def Cavalry: 20
- Speed: 6 (7 on some servers?)
- Cost: 45 wood, 60 clay, 30 iron, 15 crop
- Consumption: 1 crop/hour
- Training time: ~900 seconds (base)

### Roman Legionnaire (from screenshot):
- Training time: 26:40 (1600 seconds) at level 1

## Files to Update Once Complete

1. `/data/troops/travian_all_tribes_complete.json` - Fix training times
2. `/data/troops/troops_spartans.json` - Add complete Spartan data
3. `/data/troops/troops_vikings.json` - Add complete Viking data
4. `/calculation-engine/index.js` - Integrate troop training calculations

## Database Schema Needed
```sql
CREATE TABLE troops (
  id INTEGER PRIMARY KEY,
  tribe TEXT NOT NULL,
  name TEXT NOT NULL,
  attack INTEGER,
  def_infantry INTEGER,
  def_cavalry INTEGER,
  speed INTEGER,
  cost_wood INTEGER,
  cost_clay INTEGER,
  cost_iron INTEGER,
  cost_crop INTEGER,
  upkeep INTEGER,
  carry_capacity INTEGER,
  training_time INTEGER, -- seconds at level 1
  building TEXT, -- barracks/stable/workshop/residence
  requirements JSON -- {"academy": 5, "blacksmith": 1}
);
```

## Session Goals
- [x] Document hero mechanics with 100% accuracy
- [ ] Complete troop data extraction for all 7 tribes
- [ ] Integrate training time calculations
- [ ] Create test scenarios for AI validation
- [ ] Push everything to GitHub for team testing

## Notes for Next Session
- Spartans/Vikings may be in a different Kirilloid server version
- Check if consumption values need to be divided by crop cost
- Training times are critical for optimization calculations
- Consider manual data entry for missing tribes if needed
- Great Barracks/Stable 3× multiplier needs clarification on stacking

---
*Remember: AI doesn't need every calculation pre-built, just access to accurate data and game mechanics knowledge*