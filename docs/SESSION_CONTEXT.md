# SESSION_CONTEXT.md
*Last Updated: September 1, 2025 - v1.3.3 RESTORED*

## 🚨 MANDATORY AI WORKFLOW RULES

### NEVER PUT CODE IN CHAT
- **Rule:** Code > 5 lines → Push to GitHub
- **Rule:** Showing existing code → Reference file/line only  
- **Rule:** Fixes → Direct GitHub push + commit message
- **Response Format:** "Fixed [issue] in commit [SHA]"

### WORKFLOW ENFORCEMENT
```
1. AI identifies issue → NO code shown
2. AI pushes fix → GitHub commit
3. AI responds → "Pull latest: git pull"
4. Developer pulls → Continues work
```

### Token Economy
- ❌ BANNED: Downloading files to show, artifacts with implementations
- ✅ REQUIRED: GitHub pushes, commit references, brief summaries

See `/docs/AI_WORKFLOW.md` for complete rules.

---

## 🎯 CURRENT STATE (September 1, 2025)

### ✅ FIXED THIS SESSION
- **Version Regression**: Restored v1.3.3 from incorrect v1.3.0
- **Drag/Resize**: Fully functional via header drag and corner resize
- **Multi-Village Detection**: All 9 villages correctly identified
- **Found Production Source**: `window.resources.production` has real data

### ❌ STILL BROKEN
1. **Production Data**: Scraper using DOM selectors instead of `window.resources.production`
2. **Overview Parser**: Only getting village names, missing production columns
3. **Response Formatting**: Line breaks not preserved in chat responses
4. **Troop Data**: Not collected (needs rally point scraping)

### 🎉 CRITICAL DISCOVERY
**NO CROP CRISIS** - Account produces 178,621 crop/hour across all villages!
Individual villages showing negative crop are misleading without total view.

## 📊 DATA ARCHITECTURE DISCOVERED

### JavaScript Game Objects
```javascript
// PRODUCTION DATA SOURCE FOUND!
window.resources = {
  production: {
    l1: 6500,  // Wood/hour
    l2: 6500,  // Clay/hour  
    l3: 6500,  // Iron/hour
    l4: -2590, // Crop/hour (can be negative per village)
    l5: 5294   // Free crop/hour (after consumption)
  },
  storage: {l1: 125790, l2: 20586, l3: 26762, l4: 240000},
  maxStorage: {...}
}

// 61 properties including Village, RallyPoint, Hero, etc.
Travian.Game = {...}
```

### Data Collection Points
1. **Current Village**: `window.resources` (real-time, accurate)
2. **All Villages**: `/dorf3.php` Resources tab (must be on correct tab)
3. **Troops**: Rally point or troops overview tab
4. **Statistics**: `/village/statistics` (NOT production data)

## 🔧 NEXT STEPS (Priority Order)

### 1. Fix Production Data Collection (CRITICAL)
```javascript
// Replace DOM scraping with:
const production = {
  wood: window.resources?.production?.l1 || 0,
  clay: window.resources?.production?.l2 || 0,
  iron: window.resources?.production?.l3 || 0,
  crop: window.resources?.production?.l4 || 0,
  freeCrop: window.resources?.production?.l5 || 0
};
```

### 2. Fix Overview Parser
- Detect active tab (Resources vs Troops vs Culture)
- Parse only when on Resources tab
- Extract production values from correct columns

### 3. Fix Response Formatting
- Preserve line breaks in chat responses
- Use `<pre>` or proper white-space CSS

### 4. Add Troop Collection
- Check for `#troops` table
- Parse when on rally point
- Store in game state

### 5. Implement Account Totals
- Sum production across all villages
- Show real net crop (178k/hour not -2590!)
- Calculate resource overflow timing

## ❌ MISTAKES THIS SESSION
1. **Version Regression**: Accidentally went from 1.3.3 to 1.3.0
2. **Wrong Crisis Advice**: AI said "crop crisis" based on bad data (0/h)
3. **Wrong Selectors**: Looking for DOM "production" class vs JS objects
4. **Page Confusion**: Thought statistics page was overview resources

## ✅ COMMITS THIS SESSION
- `1ef5b7d` - Restore v1.3.3 with working drag/resize functionality
- `913af30` - Fix: Correct import path and improve logging for multi-village
- `435b942` - Fix: Correct import path for VERSION
- `1e2e433` - Restore version to 1.3.3 - fix regression

## 📋 QUESTIONS FOR NEXT SESSION
1. Should we examine ResourceBar+ to see how it gets data?
2. Use AJAX interceptor to capture game API calls?
3. Detailed troop tracking per village or just totals?
4. Auto-navigate to Resources tab when fetching overview?

## ⚡ CRITICAL REMINDERS
- **ALWAYS** use `window.resources.production` for current village
- **VERIFY** which overview tab before parsing
- **SUM** production across all villages for accurate totals
- **DO NOT** break drag/resize functionality
- **DO NOT** trust individual village crop if negative
- **PUSH** code to GitHub, not in chat

## 🚀 SESSION START PROTOCOL
1. Pull latest: `git pull`
2. Build: `npm run build`
3. Test in browser console:
```javascript
// Verify production data source
console.log('Production from resources:', window.resources?.production);
console.log('Current village only!');
```
4. Navigate to `/dorf3.php` Resources tab for all villages
5. **NO CODE IN CHAT** - Push all fixes to GitHub

---
*Account produces 178k crop/hour - no crisis! Bad data = bad advice.*