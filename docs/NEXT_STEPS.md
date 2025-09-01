# NEXT_STEPS.md - TravianAssistant Development Guide
*Created: September 1, 2025*
*Purpose: Clear direction for next development session*

## ⚠️ CRITICAL: What NOT to Do

### DO NOT Create v2/v3 Versions
The previous session tried creating parallel v2/v3 files which broke everything:
- ❌ NO `index-v2.ts`, `chat-ui-v3.ts`, etc.
- ❌ NO parallel implementations
- ✅ FIX the existing files in place
- ✅ Keep v1.3.3 structure intact

### DO NOT Break Working Features
- Drag/resize is WORKING - don't touch `conversational-ai-working.ts`
- Chat UI is WORKING - preserve existing functionality
- Multi-village detection is WORKING - just needs data fixes

## 🎯 Priority 1: Fix Production Data Collection

### The Problem
```javascript
// Currently scraper does this (WRONG):
const prodElements = document.querySelectorAll('[class*="production"]');
// This finds SVG icons, not data!
```

### The Solution
```javascript
// Production data is in JavaScript object (CORRECT):
window.resources.production = {
  l1: 6500,  // Wood/hour
  l2: 6500,  // Clay/hour  
  l3: 6500,  // Iron/hour
  l4: -2590, // Crop/hour
  l5: 5294   // Free crop/hour
}
```

### Implementation Steps
1. Open `/packages/extension/src/content/safe-scraper.ts`
2. Find the `scrapeCurrentPage()` method
3. Replace DOM scraping with:
```typescript
// Check if resources object exists
const gameResources = (window as any).resources;
if (gameResources?.production) {
  production = {
    wood: gameResources.production.l1 || 0,
    clay: gameResources.production.l2 || 0,
    iron: gameResources.production.l3 || 0,
    crop: gameResources.production.l4 || 0,
    freeCrop: gameResources.production.l5 || 0
  };
}
```
4. Test that production shows real values, not 0

## 🎯 Priority 2: Fix Overview Parser

### The Problem
- Overview only gets village names, no production data
- Parser doesn't check which tab is active (Resources vs Troops)

### The Solution
1. Detect active tab on `/dorf3.php`
2. Only parse when on Resources tab
3. Extract production columns correctly

### Implementation Steps
1. Check `/packages/extension/src/content/overview-parser.ts`
2. Add tab detection before parsing
3. Parse production columns when on Resources tab

## 🎯 Priority 3: Fix Response Formatting

### The Problem
AI responses show as wall of text without line breaks

### The Solution
In `/packages/extension/src/content/conversational-ai-working.ts`:
```typescript
// Find where responses are added
messagesDiv.innerHTML += `
  <div style="background: rgba(139, 69, 19, 0.15); padding: 8px 12px; border-radius: 8px; margin: 8px 0;">
    <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">
      ${response.response}
    </pre>
  </div>
`;
```

## 📊 Key Facts Discovered

### Account Status
- **9 villages total** (not 27 - that was UI elements)
- **178,621 crop/hour production** (healthy, no crisis!)
- **No individual village crisis** - negative crop in some villages is normal

### Data Architecture
```javascript
// Current village data available in:
window.resources = {
  production: {...},  // Real-time production
  storage: {...},     // Current resources
  maxStorage: {...}   // Capacity
}

// Game has 61 properties in:
Travian.Game = {
  Village, ActiveVillage, VillageList,
  RallyPoint, TrainingTroops, Hero, Map, ...
}
```

## ✅ What's Currently Working
1. **v1.3.3** - Stable version
2. **Drag/Resize** - Fully functional
3. **Chat UI** - Connected to AI
4. **Multi-village detection** - Finds all 9 villages
5. **Resource collection** - Gets current amounts

## ❌ What Needs Fixing
1. **Production data** - Reading wrong source (Priority 1)
2. **Overview parser** - Missing production columns (Priority 2)  
3. **Response formatting** - No line breaks (Priority 3)
4. **Troop data** - Not collected yet (Priority 4)

## 🚫 Files to Avoid/Clean Up

Check and remove if they exist:
- Any `*-v2.ts` files
- Any `*-v3.ts` files
- Any `index-v2.ts` or similar
- Keep ONLY the working v1.3.3 files

## 📝 Testing Checklist

After making changes:
1. Build: `npm run build`
2. Reload extension in Chrome
3. Open game and check console:
```javascript
// Should see real production values:
console.log('Production:', window.resources?.production);
// Should show: {l1: 6500, l2: 6500, l3: 6500, l4: -2590, l5: 5294}
```
4. Test chat - ask "What's my production?"
5. Verify drag/resize still works

## ⚡ Golden Rules

1. **FIX IN PLACE** - Don't create new versions
2. **TEST AFTER EACH CHANGE** - Don't break working features
3. **USE DISCOVERED DATA** - `window.resources.production` is the source
4. **RESPECT THE ARCHITECTURE** - Content scripts can't have exports
5. **SMALL COMMITS** - One fix at a time

## 🎯 Success Metrics

The extension succeeds when:
- [ ] Production shows actual values (6500/6500/6500/-2590)
- [ ] AI knows total is 178k crop/hour (not crisis)
- [ ] Overview shows all village production
- [ ] Responses are formatted with line breaks
- [ ] Drag/resize still works

## 🚨 If Something Breaks

1. Check commit history: `git log --oneline -10`
2. Find last working commit (probably `47fbf9e`)
3. Reset if needed: `git reset --hard 47fbf9e`
4. Start over with small changes

---
*Remember: The account is HEALTHY with 178k crop/hour. Bad data was causing bad advice.*