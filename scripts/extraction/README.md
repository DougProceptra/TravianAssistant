# TravianAssistant Data Extraction: Complete Guide
*Created: August 30, 2025*
*Beta Deadline: September 1, 2025*

## 🚨 CRITICAL: Read This First

You need to extract EXACT game data from travian.kirilloid.ru for the **T4.6 2x server**. The Main Building costs MUST match these values exactly or the extraction is wrong:

- **Level 6**: 240 wood, 135 clay, 205 iron, 70 crop
- **Level 7**: 310 wood, 175 clay, 265 iron, 90 crop  
- **Level 8**: 395 wood, 225 clay, 340 iron, 115 crop
- **Level 9**: 505 wood, 290 clay, 430 iron, 145 crop
- **Level 10**: 645 wood, 370 iron, 555 iron, 185 crop

## 📋 Quick Start (If You're In a Hurry)

### Step 1: Extract Main Building (5 minutes)
1. Open Chrome
2. Navigate to: `http://travian.kirilloid.ru/build.php?s=5&a=t`
3. Click on "Main Building" in the building list
4. Open DevTools Console (F12)
5. Copy entire contents of `scripts/extraction/browser-extract-main-building.js`
6. Paste in console and press Enter
7. Save the copied JSON as `data/extracted/main_building_t46_2x.json`

### Step 2: Extract All Buildings (10 minutes)
1. Stay on the same page
2. Copy entire contents of `scripts/extraction/browser-extract-all-buildings.js`
3. Paste in console and press Enter
4. Click through buildings if prompted
5. Save the copied JSON as `data/extracted/buildings_t46_2x.json`

### Step 3: Extract Troops (5 minutes)
1. Navigate to: `http://travian.kirilloid.ru/troops.php?s=5&a=t`
2. Copy entire contents of `scripts/extraction/browser-extract-troops.js`
3. Paste in console and press Enter
4. Save the copied JSON as `data/extracted/troops_t46_2x.json`

### Step 4: Extract Game Mechanics (2 minutes)
1. On any Kirilloid page
2. Copy entire contents of `scripts/extraction/browser-extract-game-mechanics.js`
3. Paste in console and press Enter
4. Save the copied JSON as `data/extracted/game_mechanics_t46_2x.json`

### Step 5: Validate (1 minute)
```bash
node scripts/extraction/validate-extracted-data.js
```

## 📁 File Structure

Create this structure in your project:
```
TravianAssistant/
├── data/
│   └── extracted/
│       ├── main_building_t46_2x.json     ✅ Priority 1
│       ├── buildings_t46_2x.json         ✅ Priority 1
│       ├── troops_t46_2x.json            ✅ Priority 2
│       ├── game_mechanics_t46_2x.json    ✅ Priority 3
│       └── travian_data_t46_2x.json      (consolidated)
└── scripts/
    └── extraction/
        ├── browser-extract-main-building.js
        ├── browser-extract-all-buildings.js
        ├── browser-extract-troops.js
        ├── browser-extract-game-mechanics.js
        └── validate-extracted-data.js
```

## 🔧 Detailed Instructions

### Phase 1: Main Building Extraction (CRITICAL)

**Why this matters:** If Main Building data doesn't match Doug's screenshot, everything else is wrong.

1. **Navigate to correct server:**
   - URL MUST be: `http://travian.kirilloid.ru/build.php?s=5&a=t`
   - The `s=5` means T4.6 2x server
   - Verify "T4.6 2x" is selected in dropdown

2. **Select Main Building:**
   - Building ID #15
   - Should show table with 20 levels

3. **Run extraction:**
   ```javascript
   // This is in browser-extract-main-building.js
   // It will automatically validate against Doug's values
   ```

4. **Check validation output:**
   - MUST show "✅ All validation tests passed!"
   - If not, you're on wrong server

### Phase 2: All Buildings Extraction

**Buildings to extract (40+ total):**
- Resource fields (woodcutter, clay_pit, iron_mine, cropland)
- Production buildings (sawmill, brickyard, iron_foundry, grain_mill, bakery)
- Infrastructure (warehouse, granary, marketplace, main_building)
- Military (barracks, stable, workshop, academy)
- Special (palace, residence, treasury, town_hall)
- Tribe-specific (brewery, horse_drinking_trough)
- Great buildings (great_warehouse, great_granary, wonder_of_the_world)

**If automated extraction fails:**
1. Manually click each building in the interface
2. For each building, run in console:
   ```javascript
   const table = document.querySelector('table');
   const data = [];
   // ... extraction code from script
   copy(JSON.stringify(data));
   ```

### Phase 3: Troop Data Extraction

**Must extract for all 5 tribes:**
- Romans (10 units)
- Teutons (10 units)
- Gauls (10 units)
- Egyptians (10 units)
- Huns (10 units)

**Egyptian units for validation:**
- Slave Militia: 10 attack, 30 def infantry, 20 def cavalry
- Ash Warden: 30 attack, 55 def infantry, 40 def cavalry
- Khopesh Warrior: 65 attack, 50 def infantry, 20 def cavalry

### Phase 4: Game Mechanics

**Data to extract:**
- Culture points per village (2nd village = 200 CP)
- Hero XP levels (formula: 50 * (level² + level))
- Merchant capacities (Romans: 500, Teutons: 1000, Gauls: 750)
- Celebration costs
- Oasis bonuses
- Artifact effects

## 🐛 Troubleshooting

### "Table not found" error
- Make sure building is selected
- Try different selector: `document.querySelector('table.f6')`
- Check if data loads via AJAX (wait 2 seconds)

### Values don't match screenshot
- **CRITICAL**: Verify server is T4.6 2x (s=5)
- Check URL: Must include `s=5&a=t`
- Try clearing cache and reloading

### Can't copy to clipboard
- Use `console.log(JSON.stringify(data))` instead
- Copy from console output manually
- Or assign to window: `window.myData = data`

### JavaScript variables not found
```javascript
// Nuclear option - find all data
for (let key in window) {
  if (typeof window[key] === 'object') {
    console.log(key, window[key]);
  }
}
```

## ✅ Success Criteria

Your extraction is complete when:

1. **Main Building validation:** ✅ All 5 levels match exactly
2. **Buildings count:** ✅ At least 30 buildings extracted
3. **Troop count:** ✅ All 5 tribes with 10 units each
4. **Validation passes:** ✅ `node scripts/extraction/validate-extracted-data.js`

## 🚀 After Extraction

1. **Run validation:**
   ```bash
   cd TravianAssistant
   node scripts/extraction/validate-extracted-data.js
   ```

2. **If validation passes:**
   - Commit data files to Git
   - Update SESSION_CONTEXT.md with completion status

3. **If validation fails:**
   - Check server selection (MUST be T4.6 2x)
   - Re-run extraction for failed components
   - Contact Doug with specific errors

## 📞 Emergency Fallback

If Kirilloid is down or blocked:

1. **Use existing partial data** in `packages/extension/src/game-data/`
2. **Manual formulas:**
   - Build time: `base_time / (1 + main_building_bonus)`
   - Culture points: Buildings produce CP based on level
   - Resource production: `base * (1.163118 ^ level)`

3. **Contact Doug** - he may have cached data

## 🎯 Priority for Beta

**MUST HAVE:**
1. ✅ Main Building costs (for build optimizer)
2. ✅ Resource field costs (woodcutter, clay_pit, iron_mine, cropland)
3. ✅ Warehouse/Granary costs (for storage management)

**NICE TO HAVE:**
- Complete troop data
- All buildings
- Game mechanics

**CAN SKIP FOR BETA:**
- Artifact effects
- Hero items
- Adventure rewards

---

**Remember:** Beta is September 1st. Focus on getting Main Building data correct first. Everything else is secondary.

**Files created for you:**
- `scripts/extraction/browser-extract-main-building.js` - Start here!
- `scripts/extraction/browser-extract-all-buildings.js` - Then this
- `scripts/extraction/browser-extract-troops.js` - If time permits
- `scripts/extraction/browser-extract-game-mechanics.js` - Bonus
- `scripts/extraction/validate-extracted-data.js` - Verify success

Good luck! 🚀
