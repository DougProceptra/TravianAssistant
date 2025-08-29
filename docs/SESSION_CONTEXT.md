# TravianAssistant Session Context
*Last Updated: August 29, 2025, 5:45 PM EST*

## 🎯 FORMULAS VALIDATED (Working)

### Core Formulas
```javascript
// Resource Costs
cost = round5(baseCost * k^(level-1))
round5(n) = 5 * Math.round(n/5)

// Population (Upkeep)
Level 1: baseUpkeep
Level 2+: Math.round((5 * baseUpkeep + level - 1) / 10)

// Culture Points
CP = Math.round(baseCP * 1.2^level)

// Build Time (99.5% accurate)
time = (a * k^(level-1) - b) * 0.964^(MB-1) / serverSpeed
// Most buildings: a=3875, k=1.16, b=1875
// Small discrepancy (~4 seconds) at low levels with high MB
```

### Multiplier Values by Building Type
- Resource fields (Woodcutter, Clay, Iron, Crop): `k = 1.67`
- Most infrastructure/military: `k = 1.28`
- Resource boosters (Sawmill, etc.): `k = 1.80`
- Hero Mansion: `k = 1.33`
- Treasury: `k = 1.26`
- World Wonder: `k = 1.0275`

## ❌ T4 EXTEND INCONSISTENCIES

### What We Tested
| Building | T4 Extend Says | Actually Uses | Status |
|----------|---------------|---------------|---------|
| Hero Mansion | `[80, 120, 70, 90]` | `[700, 670, 700, 240]` (T3) | ❌ NOT Applied |
| Smithy | `[180, 250, 500, 160]` | `[180, 250, 500, 160]` | ✅ Applied |
| Barracks prereqs | Smithy 3, Academy 5 | MB 3, Rally Point 1 | ❌ NOT Applied |
| Stonemason prereqs | MB 5 | MB 5 | ✅ Applied |

**Conclusion**: Can't predict which extends work without testing each building.

## 🏗️ ADDITIONAL COMPLEXITY DISCOVERED

### Max Levels
- Resource boosters (Sawmill, Brickyard, etc.): Max level **5**
- Clay Pit & Cropland: Max level **21** (not 20)
- Most others: Max level **20**
- World Wonder: Max level **100**

### Special Cases
- Capital-only buildings (levels 11+ for fields)
- Building durability (Stonemason effect)
- Tribe-specific buildings
- Multi-building restrictions
- Slot restrictions

## 🚫 SCRAPING ATTEMPTS FAILED

### What Didn't Work
- Firecrawl couldn't handle Kirilloid's JavaScript-heavy site
- Dynamic content loads client-side from URL fragments
- No sitemap or API discovered

### Why It's Hard
- Kirilloid uses fragments (`#b=21&mb=1&s=2.46`)
- Content loads entirely via JavaScript
- Hundreds of combinations (buildings × MB levels × speeds)

## 📋 NEXT STEPS OPTIONS

### Option 1: Manual Data Collection
- Run JavaScript in browser console on Kirilloid pages
- Extract table data for each building
- Time-consuming but 100% accurate

### Option 2: Use Formulas with Known Values
- ~95% accurate
- Handle exceptions case-by-case
- Good enough for most gameplay optimization

### Option 3: Focus on Essential Buildings
- Only implement what matters for early/mid game
- Ignore edge cases and special buildings
- Practical approach

## ✅ VERSION SYSTEM (Still Working)
- Version 1.0.0 current
- System working perfectly
- Single source of truth (manifest.json)

---

**Session Status**: Formulas validated but T4 extends are inconsistently applied. Automated scraping failed due to JavaScript complexity. Need to decide between manual data extraction or accepting formula-based approach with known limitations.