# SESSION_CONTEXT.md
*Last Updated: September 1, 2025 - v1.5.0 + ALL VILLAGES FOCUS*

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

## 🎯 MISSION CRITICAL PRIORITIES

### Priority 1: Multi-Village Data Collection ✅ FIXED
**Solution:** Always fetch ALL villages from overview (dorf3.php)
**Success:** AI receives complete account context for strategic decisions
**Commits:** `6d96f3a` - Prioritize multi-village data, `46401cb` - Unicode fix

### Priority 2: Fix Production Data Scraping ⚠️ IN PROGRESS
**Problem:** Production selectors not finding /h data
**Solution:** Multiple selector attempts + /h text search
**Next:** Run console commands to find actual selectors

### Priority 3: Connect to Backend Server
**Goal:** Validate complete game data structures
**Required Data:** Buildings, troops, hero, game mechanics
**Success Metric:** Backend has accurate, complete game state

### Priority 4: Context Intelligence Integration
**Service:** https://proceptra.app.n8n.cloud/mcp/context-tools
**Method:** context_intelligence capability
**User ID:** Hashed email from extension options
**Success Metric:** Every AI interaction stored and learning

## 🔧 TECHNICAL SPECIFICATIONS

### Claude Model
- **Model:** claude-sonnet-4-20250514
- **Proxy:** travian-proxy-simple (Vercel)

### Version Management
- **ALL COMPONENTS:** v1.5.0 (manifest, extension, agent)

### Required Game Context (MULTI-VILLAGE)
```javascript
{
  user: hashedEmail,
  villages: [...ALL_VILLAGES],  // CRITICAL: All villages, not just current
  currentVillageId: "12345",     // Which one is active in browser
  totals: {                       // Aggregated across ALL villages
    villages: 3,
    population: 2847,
    resources: { wood: 15000, clay: 18000, iron: 12000, crop: 85000 },
    production: { wood: 1200, clay: 1100, iron: 900, crop: 3500 }
  },
  alerts: [...],                  // Checked across ALL villages
  currentPage: "dorf1.php"
}
```

### Context Intelligence Service
- **URL:** https://proceptra.app.n8n.cloud/mcp/context-tools
- **Capability:** context_intelligence
- **User ID:** Hashed email from options page
- **Storage:** Every request/response pair

## ✅ WHAT WORKS (DO NOT BREAK)
- Chat interface drag/resize (v0.9.5 code)
- Basic resource scraping with Unicode fix
- Proxy connection to Claude
- Multi-village data collection from overview

## ❌ WHAT'S BROKEN
- Production data selectors (need to find correct elements)
- Game context completeness (troops, buildings detail)

## 🚀 NEXT SESSION START PROTOCOL
1. **CHECK AI_WORKFLOW.md** - Follow GitHub-first rules
2. Pull latest: `git pull`
3. Build extension: `npm run build`
4. Test production selectors in console
5. **NO CODE IN CHAT** - Push all fixes to GitHub

## ⚡ CRITICAL REMINDERS
- **ALWAYS** collect ALL villages data, not just current
- **DO NOT** make single-village decisions
- **DO NOT** break working drag/resize functionality
- **DO NOT** add exports to content scripts
- **DO NOT** show code in chat - push to GitHub
- **ALWAYS** include full multi-village context with AI queries
- **FOCUS** on strategic advice across entire account

## 📊 Console Commands for Debugging

```javascript
// Find production elements
console.log('Production class:', document.querySelectorAll('.production'));
console.log('Elements with /h:', 
  Array.from(document.querySelectorAll('*'))
    .filter(el => el.textContent?.includes('/h'))
    .map(el => ({text: el.textContent, class: el.className, tag: el.tagName}))
    .slice(0, 10)
);

// Check villages in switcher
console.log('Villages found:', 
  document.querySelectorAll('.villageList a[href*="newdid"]').length
);

// Test Unicode parsing
const testNum = document.querySelector('#l1')?.textContent;
console.log('Raw:', testNum, 'Normalized:', testNum?.normalize('NFKC'));
```

---
*The AI agent needs ALL villages for strategic decisions. Single-village data is tactically useless.*
*Code belongs in GitHub, not in chat.*