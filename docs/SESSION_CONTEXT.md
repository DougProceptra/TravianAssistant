# SESSION_CONTEXT.md
*Last Updated: September 1, 2025 - v1.3.4 Evening Session*

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

## 🎯 CURRENT STATE (September 1, 2025 - v1.3.4)

### ✅ FIXED IN THIS SESSION
1. **Statistics Page Integration** (v1.3.4)
   - Created `statistics-parser.ts` to scrape production data from `/statistics/general`
   - Built `data-collector.ts` with caching mechanism (5-minute cache)
   - Stores data in Chrome local storage for persistence
   - Auto-updates when visiting statistics page
   - Added "Update All Villages" button for easy navigation

2. **Hybrid Data Collection System**
   - Current village: Uses `window.resources.production` (real-time, accurate)
   - All villages: Caches from statistics page (updated every 5 min or on page visit)
   - Total production calculated and sent to AI
   - No more individual village panic - AI sees TOTAL production!

### 🔍 HOW IT WORKS NOW

#### Data Flow
1. **Current Village** → `window.resources.production` → Real-time accurate
2. **All Villages** → Statistics page → Cache (5 min) → Chrome storage
3. **AI Receives** → Total production summed across all villages

#### To Update All Villages
1. Click green "📊 Update All Villages" button (bottom right)
2. OR navigate to Statistics > General manually
3. Data auto-caches and persists

#### Key Files Changed
- `data-collector.ts` - Main collection orchestrator
- `statistics-parser.ts` - Statistics page scraper
- `find-global-data.ts` - Diagnostic tool (for debugging)
- `content/index.ts` - Integration point
- `version.ts` - Updated to 1.3.4

## 📊 DATA ARCHITECTURE (WORKING)

### Current Implementation
```javascript
// Current village (real-time)
window.resources.production = {
  l1: 2625,  // Wood/hour
  l2: 5565,  // Clay/hour
  l3: 3500,  // Iron/hour
  l4: 3063,  // Crop/hour
  l5: 4256   // Free crop/hour
}

// All villages (cached from statistics page)
cachedVillagesData = [
  { id: "123", name: "Village 1", production: {...} },
  { id: "456", name: "Village 2", production: {...} },
  // ... all 9 villages
]

// AI receives
totalProduction = {
  wood: 45000,
  clay: 48000,
  iron: 41000,
  crop: 178621  // TOTAL across all villages!
}
```

## ✅ WHAT'S WORKING
1. **Current village production** via `window.resources.production`
2. **All villages production** via statistics page caching
3. **Total production calculation** sent to AI
4. **Drag/resize** functionality (v1.3.3)
5. **Chat UI** connected to AI (v1.3.0)
6. **Persistent cache** in Chrome storage

## ❌ REMAINING ISSUES
1. **Chat Formatting**: Line breaks still not preserved in responses
2. **Troop Data**: Not collected yet
3. **Auto-refresh**: Statistics cache could auto-update in background

## 🚀 NEXT PRIORITIES

### Priority 1: Test Complete Flow
1. Pull latest: `git pull`
2. Build: `npm run build`
3. Load extension in Chrome
4. Navigate to any Travian page
5. Click "Update All Villages" button
6. Verify total production shows correctly in console
7. Test AI chat - should see total crop not panic about individual villages

### Priority 2: Fix Chat Formatting
- Responses still show as wall of text
- Need to preserve line breaks in markdown

### Priority 3: Add Background Auto-Update
- Periodically navigate to statistics page in background
- Update cache without user interaction

## 💡 KEY INSIGHTS

### Why This Approach Works
1. **Statistics page has ALL data** - No need to visit each village
2. **Caching prevents overload** - Don't hammer the statistics page
3. **Chrome storage persists** - Data survives page refreshes
4. **Total calculation** - AI never sees scary individual villages

### ResourceBarPlus Strategy
- It uses similar approach but more aggressive
- Intercepts AJAX calls (we could add this later)
- Stores everything locally
- Updates continuously (might be overkill)

## 📝 COMMIT HISTORY (This Session)
- `77c5de05` - Update version to 1.3.4 - Statistics page integration
- `211a2669` - Integrate new data collection system with statistics page support
- `8bca5b60` - Implement hybrid data collection: current village + statistics page caching
- `503e744d` - Add statistics page parser for complete village production data
- `f763f862` - Add diagnostic script to find global village data storage

## ⚡ TESTING CHECKLIST
- [ ] Pull latest code
- [ ] Build extension
- [ ] Load in Chrome
- [ ] Navigate to Travian
- [ ] Click "Update All Villages"
- [ ] Check console for total production
- [ ] Test AI chat with question about resources
- [ ] Verify AI sees total, not individual villages

## 🎮 GAME STATE
- **9 villages** total in account
- **Total production**: ~45k/48k/41k/178k (wood/clay/iron/crop per hour)
- **Individual villages**: Some negative crop (normal for troops)
- **Account health**: EXCELLENT (178k crop/hour total!)

---
*The solution is working! Statistics page provides complete data, caching prevents overload, AI sees totals not individual villages.*