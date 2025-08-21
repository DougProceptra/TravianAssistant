# TravianAssistant Session Context
*Last Updated: August 21, 2025 - 3:30 PM PST*

## 🚨 CRITICAL START-OF-SESSION CHECKLIST
1. **DO NOT** touch Vercel proxy - it's working perfectly at `https://travian-proxy-simple.vercel.app/api/proxy`
2. **ALWAYS** rebuild extension after pulling: `cd packages/extension && pnpm build`
3. **Version should be 0.4.12+** (auto-increments on build)
4. **Git conflicts**: Use `git stash` before pulling if manifest.json has local changes

## 📁 PROJECT STRUCTURE & RESOURCES

### Repository Location
- **Replit**: `/home/runner/workspace/`
- **GitHub**: `https://github.com/DougProceptra/TravianAssistant`
- **Main Branch**: `main` (all work happens here)

### Key Files
```
packages/extension/
├── manifest.json           # Version auto-bumps on build
├── src/
│   ├── background.ts      # Service worker - handles API calls
│   └── content/
│       ├── index.ts       # Main content script (HUD, orchestration)
│       ├── enhanced-scraper.ts    # Multi-village data collection
│       ├── village-navigator.ts   # Village switching (DANGEROUS)
│       ├── village-overview-scraper.ts  # NEW: Safe data collection
│       ├── data-persistence.ts    # IndexedDB storage
│       └── conversational-ai.ts   # Chat interface
```

### Available Tools & Services
- **Vercel Proxy**: Working at `https://travian-proxy-simple.vercel.app/api/proxy`
- **Claude API**: Sonnet 4 model via proxy
- **Chrome Extension**: Manifest V3 with service worker
- **IndexedDB**: For local data persistence
- **Replit Backend**: Available but not currently used

## 🎮 GAME CONTEXT

### Server & Account
- **Server**: lusobr.x2.lusobrasileiro.travian.com
- **Tribe**: Egyptians
- **Villages**: 6 total
  - 000: 24488 (Capital)
  - 001: 20985
  - 002: 21104
  - 003: 21214
  - 004: 27828
  - 005: 20522

### Resource Bar Extension Discovery
**CRITICAL**: Doug has another extension "Resource Bar" that successfully:
- Shows total production from ALL villages without navigation
- Displays: `216W + 210Y + 210V + 100 Air` 
- Shows time to storage overflow
- **Doug has the code and will provide it**

## 💻 DOUG'S DEVELOPMENT PREFERENCES

### Communication Style
- **Be Direct**: No fluff, get to the point
- **Show Progress**: Regular status updates
- **Admit Uncertainty**: Say "I don't know" rather than guess
- **Time Estimates**: Be realistic, multiply by 3 for safety

### Code Approach
- **Research First**: Always check docs/web search before coding
- **One Step at a Time**: Single clear actions, not multiple options
- **Test Everything**: Verify each change works
- **Safety First**: Never auto-navigate or interrupt gameplay

### Available Resources
- Doug can provide Resource Bar extension code
- Doug has full access to Replit and GitHub
- Doug actively plays the game and will test
- Doug has programming knowledge - explain technical details

## 🔴 CURRENT ISSUES & STATUS

### Working ✅
- **Vercel Proxy**: Fully functional, no changes needed
- **Village Detection**: All 6 villages found correctly
- **Quick Analyze**: Gets current village + cached data (safe)
- **AI Integration**: Works when background service connected
- **Chat Interface**: Works when background service connected

### Broken ❌
- **Version Display**: Shows 0.4.2 instead of current (build issue)
- **Full Scan**: Stops after 2nd village (navigation broken)
- **Background Service**: Disconnects frequently
- **Auto-refresh**: Set to 15 minutes but may still trigger unwanted actions

### Safety Concerns ⚠️
- **Navigation is DANGEROUS**: Can interrupt attacks, builds, etc.
- **Full Scan**: Has double confirmation but still risky
- **Auto-refresh**: Should only update current village

## 🎯 IMMEDIATE PRIORITIES

### 1. Stabilize Current Build
```bash
# In Replit terminal
git stash  # Save local changes
git pull origin main
cd packages/extension
pnpm build
# Version will auto-increment (probably to 0.4.13)
```

### 2. Get Resource Bar Code
- Doug will provide the extension files
- Focus on understanding their data collection method
- This is the KEY to solving everything

### 3. Implement Safe Data Collection
- Use Resource Bar's approach (no navigation)
- Update village-overview-scraper.ts
- Remove dangerous navigation code

## 🛠️ TECHNICAL DECISIONS & LEARNINGS

### What We've Learned
1. **Chrome Manifest V3 blocks direct API calls** - Must use proxy
2. **Vercel proxy works perfectly** - Don't change it
3. **Navigation is dangerous** - Interrupts gameplay
4. **Resource Bar has the solution** - Gets all data without navigation
5. **Build script auto-increments version** - Causes git conflicts

### Architecture Decisions
- **Proxy Pattern**: Chrome Extension → Vercel Proxy → Claude API
- **Service Worker**: Background script for API calls
- **Content Script**: Injected into Travian pages
- **IndexedDB**: Local storage for village history

### API Configuration
```javascript
// Working proxy configuration
const PROXY_URL = "https://travian-proxy-simple.vercel.app/api/proxy";
const MODEL = "claude-sonnet-4-20250514";
```

## 📊 DEBUG COMMANDS

### Browser Console (on Travian page)
```javascript
// Check version
window.TLA.version  // Should be 0.4.12+

// Check villages detected
window.TLA.navigator.getVillages()  // Should show Map with 6 villages

// Test background service
await window.TLA.testBg()  // Should return true

// Get current state
window.TLA.debug()  // Full debug info

// Check scraper
window.TLA.scraper  // Enhanced scraper instance
```

### Chrome Extension Page
- URL: `chrome://extensions`
- Find TravianAssistant
- Click "Reload" after building
- Check "Errors" if any issues

## 🚀 NEXT SESSION GAME PLAN

### Phase 1: Stabilization (30 min)
1. Sync git and rebuild extension
2. Verify version shows correctly
3. Test basic functionality
4. Ensure no auto-navigation

### Phase 2: Resource Bar Analysis (1 hour)
1. Get Resource Bar code from Doug
2. Identify data collection method
3. Find the API endpoints it uses
4. Document the approach

### Phase 3: Implementation (2 hours)
1. Port Resource Bar's method to our extension
2. Update village-overview-scraper.ts
3. Remove dangerous navigation code
4. Test with all 6 villages

### Success Metrics
- [ ] All village data without navigation
- [ ] Total production displayed like Resource Bar
- [ ] Storage overflow warnings
- [ ] No gameplay interruptions
- [ ] Stable background service

## ⚠️ CRITICAL WARNINGS

### NEVER DO THESE
- ❌ Don't change Vercel proxy - it's working
- ❌ Don't auto-navigate between villages
- ❌ Don't guess - research first
- ❌ Don't claim high confidence without testing
- ❌ Don't provide multiple "try this" options

### ALWAYS DO THESE
- ✅ Rebuild after pulling from git
- ✅ Test in browser before claiming success
- ✅ Use Resource Bar as the reference implementation
- ✅ Prioritize gameplay safety over features
- ✅ Document all changes in session context

## 📝 COMMUNICATION NOTES FOR AI

When starting a new session:
1. **First**: Read this entire document
2. **Second**: Ask Doug for Resource Bar code if not provided
3. **Third**: Check current git status and sync
4. **Fourth**: Rebuild and test current state
5. **Then**: Proceed with implementation

Doug's time is valuable. Be efficient, accurate, and honest. If something isn't working after 2-3 attempts, stop and reassess rather than continuing to guess.

## 🔄 SESSION HANDOFF NOTES

### What Just Happened
- Fixed village detection (6 villages now show)
- Added safety measures to prevent auto-navigation
- Discovered Resource Bar has the solution we need
- Set up 15-minute refresh (but still needs work)
- Identified that navigation is the core problem

### Key Insight
**Resource Bar proves we don't need navigation**. It gets all village data through the game's own API/network calls. This is the breakthrough - we've been solving the wrong problem. Stop trying to navigate, start intercepting data.

### Next Critical Step
**GET THE RESOURCE BAR CODE** - Everything depends on understanding how it works.

---
*Remember: The goal is to enhance gameplay, not interrupt it. Resource Bar has already solved this - we just need to learn from it.*