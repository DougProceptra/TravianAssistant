# SESSION_CONTEXT.md
*Last Updated: September 1, 2025 - v1.3.3 Evening Session*

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

## 🎯 CURRENT STATE (September 1, 2025 - Evening)

### ✅ FIXED TODAY
- **Production Data Source**: Now using `window.resources.production` for current village
  - Commit `b88ce48` - Gets real values (2625/5565/3500/3063) instead of 0
  - Works for CURRENT village only
- **Version**: Still on v1.3.3 (stable)
- **Drag/Resize**: Still functional

### ❌ CRITICAL ISSUE: Multi-Village Production Not Working
**THE PROBLEM**: AI only sees current village production, not ALL 9 villages
- Individual village shows -2590 crop/hour → AI panics
- Account total is actually +178,621 crop/hour → No crisis!
- **Root Cause**: Overview parser is parsing wrong tab on `/dorf3.php`

### 🔍 KEY DISCOVERY: Overview Page Structure
The `/dorf3.php` page has TABS:
1. **Overview** tab - Shows attacks/building/troops/merchants (currently being parsed)
2. **Resources** tab - Shows production for ALL villages (what we need!)
3. **Culture points** tab
4. **Troops** tab

**Current Bug**: Parser is reading Overview tab data as if it's Resources
- That's why villages show as "000", "001", "002" with 0 production
- Need to detect active tab and parse Resources tab specifically

## 📊 DATA ARCHITECTURE CONFIRMED

### Current Village Data (WORKING)
```javascript
window.resources.production = {
  l1: 2625,  // Wood/hour (real data!)
  l2: 5565,  // Clay/hour
  l3: 3500,  // Iron/hour
  l4: 3063,  // Crop/hour
  l5: 4256   // Free crop/hour
}
```

### All Villages Data (BROKEN)
- Located at `/dorf3.php` → Resources tab
- Parser needs to:
  1. Navigate to `/dorf3.php`
  2. Detect which tab is active
  3. Click or wait for Resources tab
  4. Parse the table with columns: Village | Wood | Clay | Iron | Crop
  5. Sum ALL villages before sending to AI

## 🔧 NEXT SESSION PRIORITIES

### Priority 1: Fix Overview Parser
**File**: `/packages/extension/src/content/overview-parser.ts`
- Detect active tab before parsing
- Only parse when Resources tab is active
- Parse correct columns for production data
- Test with actual `/dorf3.php?tab=resources` or similar

### Priority 2: Ensure Total Production Calculation
**Critical**: AI must ALWAYS receive totals, never individual villages
```javascript
// Bad (current):
village002: { crop: -2590 } // AI sees crisis!

// Good (needed):
totalProduction: { 
  wood: 45000,
  clay: 48000,
  iron: 41000,
  crop: 178621  // Sum of ALL 9 villages!
}
```

### Priority 3: Fix Response Formatting
- Line breaks still not preserved in chat
- Responses show as wall of text

## ❌ KNOWN ISSUES
1. **Overview Parser**: Parsing wrong tab (Overview instead of Resources)
2. **Multi-Village**: Not summing production across villages
3. **Chat Formatting**: No line breaks in responses
4. **Troop Data**: Not collected yet

## ✅ WHAT'S WORKING
1. **Current village production** via `window.resources.production`
2. **Drag/resize** functionality
3. **9 villages detected** (just wrong data)
4. **Chat UI** connected to AI

## 🎮 GAME STATE FACTS
- **9 villages** total in account
- **Village 002** (current): 2625/5565/3500/3063 production
- **Total account**: ~178k crop/hour (healthy!)
- **Server**: lusobr.x2.lusobrasileiro.travian.com

## 💡 INSIGHTS FROM TODAY

### Why ResourceBar+ Works
- Likely reads game's internal JavaScript objects directly
- Doesn't rely on DOM parsing
- Might intercept AJAX calls for village data

### The Tab Problem
- `/dorf3.php` defaults to Overview tab
- Resources tab has the data we need
- Need to either:
  - Wait for user to click Resources tab
  - Programmatically click it
  - Detect URL parameters like `?tab=resources`

### Testing Approach
1. Navigate to `/dorf3.php`
2. Click Resources tab manually
3. Run test script to verify table structure
4. Update parser to match actual structure

## ⚡ CRITICAL REMINDERS
- **ALWAYS** sum production across ALL villages
- **NEVER** send individual village data to AI
- **VERIFY** active tab before parsing overview
- **TEST** with Resources tab active
- **DO NOT** break working features (drag/resize, current village data)

## 🚀 SESSION START PROTOCOL
1. Pull latest: `git pull`
2. Build: `npm run build`
3. Test current village data:
```javascript
console.log('Current village:', window.resources?.production);
```
4. Navigate to `/dorf3.php` → Click Resources tab
5. Test overview parsing
6. **NO CODE IN CHAT** - Push all fixes to GitHub

## 📝 COMMIT HISTORY TODAY
- `b88ce48` - Fix: Use window.resources.production for accurate data collection
- `d8232bd` - Create NEXT_STEPS.md - Clear guide for next session
- `47fbf9e` - Update SESSION_CONTEXT with Sept 1 session findings
- `1ef5b7d` - Restore v1.3.3 with working drag/resize functionality

---
*Remember: The account is HEALTHY with 178k crop/hour. The problem is we're not summing across all villages!*