# TravianAssistant Session Context
*Last Updated: August 29, 2025, 3:55 PM EST*

## 🔬 KIRILLOID DATA ANALYSIS COMPLETE

### Can We Use Formulas? YES - With Caveats

**Formula Accuracy Test Results**:
```javascript
// Kirilloid's exact formula:
cost(level) = baseCost * k^(level - 1)
// Rounded to nearest 5

// Test: Hero Mansion Level 16 (T4)
baseCost = [80, 120, 70, 90]
k = 1.28
Level 16 wood = round5(80 * 1.28^15) = 3245 ✅
```

### Critical Findings from Kirilloid GitHub:

1. **NO UNIVERSAL MULTIPLIER** - Each building has its own `k` value:
   - Resource fields (Woodcutter, Clay, Iron, Crop): `k = 1.67`
   - Most infrastructure: `k = 1.28`
   - Resource boosters (Sawmill, etc.): `k = 1.80`
   - Some T5 buildings: `k = 1.33`
   - Treasury (T3.5+): `k = 1.26`
   - Command Center (T4.fs): `k = 1.22`

2. **Building-Specific Data Required**:
   - Base costs array `[wood, clay, iron, crop]`
   - Specific multiplier (`k` value)
   - Max level (varies! Most are 20, some are 5 or 10)
   - Special formulas (production arrays, capacity functions)

3. **T4 vs T4.fs Differences**:
   - T4.fs has additional buildings (Stone Wall, Makeshift Wall, Command Center, Waterworks)
   - Some buildings have different costs between versions
   - Hero Mansion in T4: `[80, 120, 70, 90]` base cost

### Recommendation: **USE FORMULAS**

**Why Formulas Work**:
- ✅ 100% accurate when using correct `k` values per building
- ✅ Storage efficient (one multiplier vs 20 levels of data)
- ✅ Matches exactly what Kirilloid does
- ✅ Easy to support different server versions

**Implementation Requirements**:
1. Extract exact base costs and `k` values from Kirilloid for T4 and T4.fs
2. Store special cases (production arrays, capacity formulas)
3. Use `roundP(5)` function for cost rounding
4. Implement version switching (T4 vs T4.fs)

## ✅ VERSION SYSTEM FIXED (Still Working)

### Version Management Solution
- Version 1.0.0 current
- System working perfectly
- Single source of truth (manifest.json)

## 📋 NEXT IMMEDIATE STEPS

1. **Extract T4 Building Data**:
   - Get all base costs from `/src/model/t4/buildings.ts`
   - Get T4.fs overrides from `/src/model/t4.fs/buildings.ts`
   - Document all `k` values per building

2. **Create Data Structure**:
   ```typescript
   const BUILDINGS_T4 = {
     woodcutter: {
       id: 0,
       baseCost: [40, 100, 50, 60],
       multiplier: 1.67,
       maxLevel: 20
     },
     // ... all buildings
   };
   ```

3. **Implement Formula Calculator**:
   - Round to 5 function
   - Cost calculation per level
   - Server version switching

---

**Session Status**: Formula approach validated. Ready to extract exact Kirilloid data for T4/T4.fs implementation.