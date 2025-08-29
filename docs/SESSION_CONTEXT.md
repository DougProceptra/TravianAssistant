# TravianAssistant Session Context

## ⚠️ MANDATORY READING INSTRUCTION ⚠️
**You must read every word of this document. You must read it 3 times. The first as a senior architect guiding the work of an application. The second time is as a developer that will be executing the steps and directions emanating from document and the third time as business analyst making sure you understand the functions and processes being addressed and how they affect the game. You cannot proceed until you fully comprehend every aspect of the SESSION_CONTEXT.md document.**

## 🛑 CRITICAL: ONE STEP AT A TIME RULE 🛑
### THIS IS THE MOST IMPORTANT RULE IN THIS DOCUMENT

**YOU MUST FOLLOW THIS PROCESS - NO EXCEPTIONS:**

1. **GIVE ONE STEP** - Provide exactly ONE action to take
2. **WAIT FOR RESULT** - Doug will tell you what happened
3. **ANALYZE RESULT** - Understand what the result means
4. **THEN GIVE NEXT STEP** - Based on the actual result, not assumptions

**❌ NEVER DO THIS:**
- Give multiple steps at once
- Provide "Step 1, Step 2, Step 3" lists
- Say "After that, then do X"
- Assume a step will work and provide the next one
- Give alternative "if this doesn't work try Y"

**✅ ALWAYS DO THIS:**
- Give ONE clear command or action
- Wait for Doug's response
- Base next step on actual result
- If something fails, diagnose why BEFORE suggesting alternatives

**EXAMPLE OF CORRECT BEHAVIOR:**
```
Claude: Run this command: git pull origin main
Doug: [provides output]
Claude: [analyzes output, then gives ONE next step]
```

**WHY THIS MATTERS:**
- Assumptions waste hours of debugging
- Each step reveals information needed for the next
- Doug's time is valuable - don't waste it with shotgun approaches

**IF YOU VIOLATE THIS RULE, DOUG WILL REMIND YOU AND YOU MUST ACKNOWLEDGE AND CORRECT YOUR BEHAVIOR**

---

## 🔄 MANDATORY GIT SYNC - DO THIS FIRST! 🔄

### BEFORE ANYTHING ELSE - SYNC WITH GITHUB:
```bash
cd ~/workspace

# Check current status
git status

# If there are uncommitted changes:
git add -A
git commit -m "WIP: Session start - saving local changes"

# ALWAYS pull latest from GitHub
git pull origin main

# If there are conflicts:
git status  # See which files have conflicts
# Resolve conflicts manually or use:
git checkout --theirs .  # To accept remote version
# OR
git checkout --ours .    # To keep local version

# Verify sync is complete
git status
# Should show: "Your branch is up to date with 'origin/main'"
```

**⚠️ IF YOU SKIP THIS STEP, YOU MAY BE WORKING ON OUTDATED CODE!**

## 🛑 MANDATORY DEVELOPMENT PROCESS - NO EXCEPTIONS 🛑

### BEFORE MAKING ANY CODE CHANGES:

#### 1. **TRACE THE FULL EXECUTION PATH**
```bash
# STOP! Before editing ANY file, trace its usage:
cd ~/workspace/packages/extension

# Check what the build actually uses:
grep -n "yourfile.ts" build-simple.sh
grep -rn "import.*yourfile" src/

# Verify which version is real:
ls -la src/content/*fixed* src/content/index*
cat build-simple.sh | grep -E "index|conversational"
```
**❌ DO NOT assume index.ts is the entry point - it might be index-fixed.ts!**
**❌ DO NOT edit conversational-ai.ts - the build uses conversational-ai-fixed.ts!**

#### 2. **CHECK WHAT ACTUALLY RUNS**
```bash
# See what's in the current build:
cat dist/content.js | head -20
grep -r "getGameState\|scrapeCurrentState" dist/

# Verify the proxy URL in use:
grep -r "proxy" dist/background.js
```
**✅ The REAL files are what's in dist/ after build**

#### 3. **DOCUMENT DISCOVERIES IMMEDIATELY**
If you discover ANY quirk, gotcha, or unexpected behavior:
1. Add it to `/docs/DEVELOPMENT_GUIDE.md` under "Common Pitfalls"
2. Update this SESSION_CONTEXT.md if it affects current work
3. Add a comment in the code explaining WHY

#### 4. **UPDATE GUIDES BEFORE COMMITTING**
```bash
# Before ANY commit:
- [ ] Updated DEVELOPMENT_GUIDE.md with new discoveries?
- [ ] Updated SESSION_CONTEXT.md with current state?
- [ ] Added comments explaining non-obvious code?
- [ ] Documented WHY, not just what?
```

### ⚠️ CRITICAL PROJECT QUIRKS ⚠️
1. **Build uses `-fixed.ts` files** - NOT the regular versions!
2. **Entry point is `index-fixed.ts`** - NOT index.ts!
3. **Chat UI is `conversational-ai-fixed.ts`** - NOT conversational-ai.ts!
4. **Proxy URL**: `https://travian-proxy-simple.vercel.app/api/proxy`
5. **API call**: `safeScraper.getGameState()` NOT `scrapeCurrentState()`

**IF YOU EDIT THE WRONG FILE, YOUR CHANGES WILL BE IGNORED BY THE BUILD!**

---

## 🛑 MANDATORY SESSION STARTUP - RUN THIS SECOND 🛑

### AFTER GIT SYNC, BEFORE ANY DEVELOPMENT:
```bash
cd ~/workspace
node scripts/check-dev-status.js
```
**This health check script MUST be run to ensure:**
- [ ] Git status is clean or changes are known
- [ ] All critical files exist
- [ ] Dependencies are installed 
- [ ] Database is initialized
- [ ] Backend services are ready
- [ ] Extension build is current

**DO NOT PROCEED if any critical errors are shown!**

---

*Last Updated: August 28, 2025, 7:35 PM PST*
*Session Status: Page Auditor successful - 194 pages analyzed, 14 universal selectors identified*

## ⚠️ CRITICAL: CORRECT GITHUB REPOSITORY ⚠️
**GitHub Repository**: https://github.com/DougProceptra/TravianAssistant
- Owner: **DougProceptra** (NOT dougyb83, NOT DougZackowski)  
- Repository: **TravianAssistant**
- Main branch: **main**

## ⚠️ REPLIT WORKSPACE ⚠️
**Replit URL**: https://replit.com/@dougdostal/TravianAssistant
- Workspace path: `~/workspace`
- Extension path: `~/workspace/packages/extension`
- Build output: `~/workspace/packages/extension/dist`
- **Note**: Replit automatically downloads folders as .zip files

## 📋 PROJECT OVERVIEW

### Mission Statement
**"Stockfish for Travian"** - Transform Travian gameplay from tedious micromanagement to AI-powered strategic excellence, enabling top-20 competitive play in under 2 hours per day.

### Core Requirements
1. **Deep Strategic AI Analysis** - Specific, actionable intelligence
2. **Comprehensive Data Collection** - Every game dimension captured
3. **Predictive Modeling** - Account growth, enemy movements, server trends
4. **Budget Constraints** - $100/month maximum operational cost
5. **September 9th Launch** - 11 days remaining
6. **Multi-Player Support** - Architecture already supports multiple accounts

## ✅ COMPLETED WORK (August 28, 2025)

### Infrastructure & Backend
1. **✅ Backend Server Running** - Port 3002, SQLite database
2. **✅ Map Data Imported** - 7,492 villages, 2,702 players, 88 alliances
3. **✅ Multi-player Architecture** - Full account_id support throughout
4. **✅ WebSocket Support** - Real-time updates implemented
5. **✅ Alert System** - Overflow/starvation detection ready

### Extension v0.9.13 (Auditor Enhanced)
1. **✅ Chat UI Complete**:
   - Dragging works perfectly
   - Text wrapping in textarea works
   - Resize handle visible and functional
   - Window state persistence (position, size, open state)
   - User confirmed: "The chat looks good all the way around"
2. **✅ Page Auditor v2**:
   - Enhanced to store 500 audits (up from 50)
   - Successfully analyzed 194 pages across 16 page types
   - Identified 14 universal selectors with 100% reliability
   - Discovered 23 high-reliability (>90%) selectors
   - Audit data exported and backed up
3. **✅ Data Scraping** - Successfully parsing 8 villages (basic)
4. **✅ API Connection** - Working through proxy to Claude
5. **✅ Background Service** - PING handler, improved error handling

### Data Discovery Success (THIS SESSION)
1. **✅ Universal Selectors Identified** (100% reliable across all pages):
   - Resources: `#l1` (wood), `#l2` (clay), `#l3` (iron), `#l4` (crop)
   - Storage: `.warehouse`, `.granary`
   - Production: `[class*="production"]`, `[class*="prod"]`
   - Hero: `#heroImageButton`, `.experience`
   - Quests: `#questmasterButton`
   - Buildings: `.level`
   - Map: `.map`

### ⚠️ OPTIMIZER FILES CREATED BUT NOT DEPLOYED
**See `/docs/OPTIMIZER_NOT_DEPLOYED.md` for details**

Created optimizer files in previous session but discovered they need:
1. **Backend connection first** - Chat not connected to port 3002
2. **Better data scraping** - Now have universal selectors identified!
3. **Real game state** - Can now capture with new selectors

**Files created (for future use)**:
- `src/game-start-optimizer.ts` - Core algorithm
- `src/ai-prompt-enhancer.ts` - Strategic AI context
- `src/content/game-integration.ts` - Integration layer
- `src/content/conversational-ai-integrated.ts` - Enhanced chat UI
- `build-optimizer.sh` - Build script for v1.1.0

## 🚀 IMMEDIATE NEXT STEPS (Updated Priority)

### 1. Implement Universal Selectors in Scraper (Priority 1)
Update `safe-scraper.ts` to capture the 14 universal selectors:
- Resources (6 selectors): Current amounts and storage
- Production (2 selectors): Production rates
- Hero/Quest (3 selectors): Status and experience
- Buildings (1 selector): Levels
- Map (1 selector): Map elements

### 2. Connect Chat to Backend (Priority 2)
```javascript
// In conversational-ai-fixed.ts, add:
async syncWithBackend(gameState) {
  const response = await fetch('http://localhost:3002/api/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameState)
  });
  return response.json();
}
```

### 3. Test Full Data Flow (Priority 3)
- [ ] Game → Extension scrapes with new selectors
- [ ] Extension → Backend stores enhanced data
- [ ] Backend → Returns analysis
- [ ] Extension → Displays in HUD

### 4. THEN Integrate Optimizer (Future)
Once real data flows with new selectors, integrate optimizer files

## 🔧 CURRENT SYSTEM STATE

### Running Services
- **Backend**: `node server-sqlite-fixed.js` on port 3002
- **Database**: SQLite with complete map data
- **API Proxy**: https://travian-proxy-simple.vercel.app/api/proxy

### File Locations (CRITICAL - Note the -fixed files!)
- Backend: `~/workspace/backend/`
- Extension Source: `~/workspace/packages/extension/src/`
- **Entry Point**: `src/content/index-fixed.ts` (NOT index.ts!)
- **Chat UI**: `src/content/conversational-ai-fixed.ts` (NOT conversational-ai.ts!)
- **Auditor**: `src/diagnostics/page-auditor.ts` (500 audit capacity)
- **Background**: `src/background.ts` (v0.8.4 with PING)
- Extension Build: `~/workspace/packages/extension/dist/`
- Database: `~/workspace/backend/travian.db`
- Scripts: `~/workspace/scripts/`

### Optimizer Files (NOT ACTIVE)
- **Algorithm**: `src/game-start-optimizer.ts`
- **AI Enhancement**: `src/ai-prompt-enhancer.ts`
- **Integration**: `src/content/game-integration.ts`
- **Documentation**: `/docs/OPTIMIZER_NOT_DEPLOYED.md`

### Documentation Structure
- **Index**: `/docs/README.md` - Start here for navigation
- **Session State**: `/docs/SESSION_CONTEXT.md` - Current status
- **Dev Guide**: `/docs/DEVELOPMENT_GUIDE.md` - How to develop
- **Implementation**: `/docs/PHASE1_IMPLEMENTATION_PLAN.md` - Blueprint
- **Optimizer**: `/docs/OPTIMIZER_NOT_DEPLOYED.md` - Algorithm details

## 💰 BUDGET STATUS

### Current Setup (Within Budget)
- Replit Hacker: $7/month
- Claude API: ~$50/month (estimated with caching)
- Total: $57/month (well under $100 limit)

## 🎯 LAUNCH CRITERIA (Sept 9)

### Must Have
- [✅] Extension loads and scrapes data
- [✅] Chat UI works with persistence
- [✅] Universal selectors identified
- [⚠️] AI provides strategic recommendations (basic working, optimizer ready)
- [⚠️] Backend connection (NOT YET)
- [❌] Comprehensive data scraping (selectors identified, not implemented)

### Should Have
- [📁] Settlement location optimizer (algorithm ready, needs data)
- [📁] Resource balance calculator (algorithm ready, needs data)
- [📁] CP accumulation predictor (algorithm ready, needs data)
- [ ] Alliance threat assessment

## ⚠️ CRITICAL LESSONS & WARNINGS

### From Previous Sessions
- **Built optimizer without data infrastructure** - Classic premature optimization
- **Need backend connection FIRST** - Chat still not using port 3002
- **Data scraping was minimal** - Only had village names/population

### From THIS Session
- **Page Auditor success** - 194 pages analyzed, patterns clear
- **Universal selectors work everywhere** - 14 selectors with 100% reliability
- **localStorage limit avoided** - Enhanced to 500 audits from 50
- **Audit data preserved** - Exported to JSON file for backup

### DO NOT:
- Deploy optimizer files until backend connected
- Skip implementing the new selectors
- Assume we have game state we don't actually scrape
- Edit regular .ts files when -fixed.ts versions exist
- **EVER GIVE MULTIPLE STEPS AT ONCE**

### DO:
- Implement universal selectors FIRST
- Connect to backend server SECOND
- Test with real data THIRD
- Then integrate optimizer
- **ALWAYS GIVE ONE STEP AND WAIT FOR RESULT**

## 📝 SESSION SUMMARY

### What Happened This Session (August 28, 7:35 PM)
1. **Enhanced Page Auditor** - Increased capacity from 50 to 500 audits
2. **Analyzed 194 pages** - Comprehensive coverage of game interface
3. **Identified 14 universal selectors** - 100% reliable across all pages
4. **Discovered resource hierarchy** - Account/village/field levels understood
5. **Exported audit data** - Backed up analysis results
6. **Created implementation plan** - Clear path for scraper updates

### Current State
- Chat UI works perfectly (v0.9.13)
- Basic scraping works (8 villages)
- Universal selectors identified and tested
- AI responds through proxy
- Backend running but NOT connected
- Optimizer ready but NOT deployed
- Audit data collected and analyzed

### Next Session Priority
1. **Implement universal selectors** (45 min)
2. **Connect chat to backend server** (30 min)
3. **Test enhanced data flow** (30 min)
4. **Consider optimizer integration** if time allows

## 🔄 HANDOFF NOTES

**CRITICAL FOR NEXT SESSION**:
1. Pull latest from GitHub (this update)
2. Review the 14 universal selectors list
3. Update `safe-scraper.ts` with new selectors
4. Test scraping on different page types
5. Verify data structure matches backend expectations

The audit analysis was highly successful. We now know exactly which selectors work reliably across the entire game interface. Implementation should be straightforward.

## ✅ SESSION WRAP-UP CHECKLIST

Before ending any session, complete these tasks:

- [✅] **Update SESSION_CONTEXT.md** with current state
- [ ] **Document any new discoveries** in DEVELOPMENT_GUIDE.md
- [ ] **Update documentation index** (`/docs/README.md`) if you:
  - Added new documentation files
  - Changed document status (active/deprecated)
  - Modified document structure
  - Created new categories
- [✅] **Commit all changes** with descriptive message
- [✅] **Push to GitHub** - ensure remote is updated
- [✅] **Note time estimate** for next session's tasks
- [ ] **Flag any blockers** that need resolution

**Remember**: The next developer (even if it's you) depends on accurate documentation!

---
*End of session. Page auditor analysis complete. 14 universal selectors ready for implementation.*
*Next session: Implement selectors in scraper, connect backend, test data flow.*
