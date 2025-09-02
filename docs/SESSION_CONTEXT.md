# SESSION_CONTEXT.md
*Last Updated: September 2, 2025 - v2.0.0 - TravianRapidSettle Pivot*

## 🚨 CRITICAL PROJECT PIVOT - READ FIRST

### We Have Changed Direction!
**OLD APPROACH (v1.x)**: Multi-village data collection, total account production
**NEW APPROACH (v2.x)**: Single village focus, fastest settlement race, AI-driven strategy

### Why The Pivot?
1. **Technical Reality**: Cannot get all villages' production from one page
2. **Statistics Page**: Contains no production data (only rankings)
3. **window.resources**: Works but only for current village
4. **Strategic Focus**: Early game (first 7 days) is most critical

---

## 📋 NEW PROJECT: TravianRapidSettle

### Core Concept
- **Goal**: Fastest possible second village (day 6 target)
- **Method**: RBP-style data persistence + AI strategic reasoning
- **Focus**: Single village optimization during critical first week

### Architecture
```
Page Context → Content Script → AI → Recommendations
     ↓              ↓            ↓         ↓
window.resources  localStorage  Claude   HUD Display
```

### Key Files Created This Session
1. **`/content/settlement-data-provider.ts`** - Clean data collection, no strategy
2. **`/docs/TravianRapidSettlev1.md`** - Complete technical design
3. **Test scripts in `/scripts/`** - For validating data access methods

### What Works
- ✅ window.resources accessible via script injection
- ✅ Hero data scrapeable from page
- ✅ Building/queue data available
- ✅ localStorage persistence (RBP-style)
- ✅ CSP allows textContent script injection

### What Doesn't Work
- ❌ Getting other villages' production without navigation
- ❌ Statistics page for production data
- ❌ Direct window access from content script

---

## 🎯 CURRENT STATE (September 2, 2025)

### Completed Today
1. **Data Access Solution**
   - Created context bridge for window.resources
   - Validated with test harness
   - All tests pass

2. **Strategic Pivot**
   - Abandoned multi-village requirement
   - Focused on settlement race
   - Designed clean data provider

3. **Documentation**
   - Created TravianRapidSettlev1.md
   - Updated this SESSION_CONTEXT.md
   - Documented all findings

### Ready for Implementation
- Settlement data provider tested and ready
- Game constants defined
- AI integration points identified
- HUD design specified

---

## 💡 KEY TECHNICAL DISCOVERIES

### The window.resources Solution
```javascript
// THIS WORKS - Inject script to access page context
const script = document.createElement('script');
script.textContent = `
  window.postMessage({
    type: 'TLA_DATA',
    data: window.resources
  }, '*');
`;
document.head.appendChild(script);

// Listen in content script
window.addEventListener('message', (e) => {
  if (e.data.type === 'TLA_DATA') {
    // Got the data!
  }
});
```

### RBP Storage Pattern
- Store snapshot on every page load
- Accumulate data over time
- Display aggregated information
- No real-time multi-village data

---

## 🚀 NEXT SESSION INSTRUCTIONS

### DO THIS FIRST
1. Read `/docs/TravianRapidSettlev1.md` completely
2. Understand the pivot - we're NOT doing multi-village anymore
3. Focus on settlement race optimization

### Implementation Priority
1. Test `settlement-data-provider.ts` on live game
2. Create AI prompt template
3. Build simple HUD
4. Test on fresh server (if available)

### DO NOT
- Try to get all villages' production
- Waste time on statistics page
- Build complex multi-village systems
- Add prescriptive strategy to data provider

---

## 📊 TEST RESULTS SUMMARY

### What We Tested
- `test-harness.js`: All 5 tests passed
- `data-audit-tool.js`: Found window.resources
- `network-monitor.js`: Captured AJAX patterns
- `dom-mutation-tracker.js`: Tracked updates

### Key Finding
**window.resources exists and is accessible** - Just needed proper context bridge

---

## 🎮 GAME CONSTANTS

### Settlement Requirements
- 500 CP for second village
- 3 settlers at 5000/4000/5000/3000 each
- Residence level 10
- Academy level 1

### Oasis Rewards
- 40 resources per animal level killed
- Hero strength = (level × 100) + points + equipment

### CP Generation Priority
1. Embassy: 24 CP/day
2. Marketplace: 20 CP/day
3. Main Building: 5 CP/level
4. Cranny: 2 CP/level (cheap)

---

## ⚠️ CRITICAL REMINDERS

1. **v1.3.5 extension still works** - Don't break it yet
2. **New approach is separate** - Test before integrating
3. **AI makes decisions** - Data provider just provides data
4. **Focus on early game** - Days 0-7 only
5. **Hero is critical** - Adventures + oasis clearing

---

## 📝 COMMIT HISTORY (This Session - Sept 2)
- `a7cc38e2` - Create TravianRapidSettlev1.md
- `c360409d` - Create clean settlement-data-provider.ts
- `f05b75ac` - Enhanced with hero/oasis (v2 - too prescriptive)
- `814b49c2` - Initial settlement optimizer
- `d712c1c6` - Create test harness
- Multiple diagnostic tools created

---

## 🔄 VERSION TRANSITION

### Old Version (1.3.5)
- Multi-village focus
- Complex data collection
- Statistics page dependency
- Still running, don't break

### New Version (2.0.0)
- Single village focus
- Settlement race optimization
- AI-driven decisions
- Clean data provider

---

## 📝 PREVIOUS SESSION (Sept 1) - For Reference
- v1.3.4 implementation (now obsolete approach)
- Statistics page integration attempt
- ResourceBarPlus investigation
- Multi-village data collection efforts

---

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

*The pivot is complete. Focus is now on fastest settlement with AI assistance, not multi-village data collection.*