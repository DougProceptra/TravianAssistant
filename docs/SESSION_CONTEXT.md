# TravianAssistant Session Context
*Last Updated: August 29, 2025, 4:30 PM EST*

## 🔬 KIRILLOID FORMULA UNDERSTANDING - CORRECTED

### The `extend()` Function Clarification

The confusion from the last session was about how `extend()` works:
- It's a **deep merge** function that recursively merges properties
- For T4 Hero Mansion: it ONLY replaces the `c` (cost) array
- The `k` multiplier (1.33) is **inherited from T3** and NOT changed

### Correct Building Data Structure

**Hero Mansion in T4**:
```javascript
// T3 defines:
heroMansion: {
  c: [700, 670, 700, 240],  // Base costs
  k: 1.33,                  // Multiplier
}

// T4 extends with:
[ID.HERO_MANSION]: {
  c: [80, 120, 70, 90]     // ONLY replaces cost array
}

// Result in T4:
heroMansion: {
  c: [80, 120, 70, 90],    // New from T4
  k: 1.33,                 // Inherited from T3!
}
```

**Academy** - NOT modified in T4:
```javascript
academy: {
  c: [220, 160, 90, 40],
  k: 1.28,
  // Same in T3, T3.5, and T4
}
```

### Building Multipliers by Type

Each building category has its own `k` value:
- **Resource fields** (Woodcutter, Clay, Iron, Crop): `k = 1.67`
- **Most infrastructure/military**: `k = 1.28`
- **Resource boosters** (Sawmill, etc.): `k = 1.80`
- **Hero Mansion**: `k = 1.33`
- **Treasury** (T3.5+): `k = 1.26`
- **World Wonder**: `k = 1.0275`

### Formula Implementation

```javascript
// Correct formula from Kirilloid
const round5 = (n) => 5 * Math.round(n / 5);
const calculateCost = (baseCost, k, level) => {
  return baseCost.map(res => round5(res * Math.pow(k, level - 1)));
};
```

## ✅ VERSION SYSTEM (Still Working)
- Version 1.0.0 current
- System working perfectly
- Single source of truth (manifest.json)

## 📋 NEXT STEPS

1. **Validate Calculations Against Game**:
   - Test Academy at various levels (k=1.28)
   - Test Hero Mansion L16 with correct values (base [80,120,70,90], k=1.33)
   - Test a resource field (k=1.67)
   - Test a military building (k=1.28)

2. **Create Comprehensive Building Data**:
   - Extract all buildings from Kirilloid
   - Document which ones are modified in T4
   - Store both T4 and T4.fs variations

3. **Implement in Extension**:
   - Replace incorrect constants with validated data
   - Add server version detection (T4 vs T4.fs)
   - Test with actual game data

## ❌ PREVIOUS MISTAKES TO AVOID

1. **Don't assume universal k=1.28** - Each building type has its own multiplier
2. **Don't ignore inheritance** - T4 extends T3, keeping unmodified properties
3. **Don't make up numbers** - Always validate against Kirilloid source or game data
4. **Don't compile broken TypeScript** - Fix errors before proceeding

---

**Session Status**: Formula approach understood correctly. Need to validate calculations against actual game data before implementation.