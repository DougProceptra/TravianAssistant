# TravianAssistant Session Context

## ⚠️ MANDATORY READING INSTRUCTION ⚠️
**You must read every word of this document. You must read it 3 times. The first as a senior architect guiding the work of an application. The second time is as a developer that will be executing the steps and directions emanating from document and the third time as business analyst making sure you understand the functions and processes being addressed and how they affect the game. You cannot proceed until you fully comprehend every aspect of the SESSION_CONTEXT.md document.**

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

*Last Updated: August 28, 2025, 3:00 PM PST*
*Session Status: Optimizer files created but NOT DEPLOYED - Pivot to backend connection*

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

### Extension v0.9.11 (Chat UI Working)
1. **✅ Chat UI Complete**:
   - Dragging works perfectly
   - Text wrapping in textarea works
   - Resize handle visible and functional
   - Window state persistence (position, size, open state)
   - User confirmed: "The chat looks good all the way around"
2. **✅ Data Scraping** - Successfully parsing 8 villages
3. **✅ API Connection** - Working through proxy to Claude
4. **✅ Background Service** - PING handler, improved error handling

### ⚠️ OPTIMIZER FILES CREATED BUT NOT DEPLOYED
**See `/docs/OPTIMIZER_NOT_DEPLOYED.md` for details**

Created optimizer files this session but discovered they need:
1. **Backend connection first** - Chat not connected to port 3002
2. **Better data scraping** - Only have village names/population
3. **Real game state** - Missing resources, buildings, troops, etc.

**Files created (for future use)**:
- `src/game-start-optimizer.ts` - Core algorithm
- `src/ai-prompt-enhancer.ts` - Strategic AI context
- `src/content/game-integration.ts` - Integration layer
- `src/content/conversational-ai-integrated.ts` - Enhanced chat UI
- `build-optimizer.sh` - Build script for v1.1.0

**DO NOT DEPLOY THESE YET** - Need infrastructure first

## 🚀 IMMEDIATE NEXT STEPS (Revised Priority)

### 1. Connect Chat to Backend (Priority 1)
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

### 2. Expand Data Scraping (Priority 2)
Need to capture:
- [ ] Resource amounts (wood, clay, iron, crop)
- [ ] Production rates per hour
- [ ] Building queue status
- [ ] Troop counts and training
- [ ] Hero status and level
- [ ] Quest list and completion
- [ ] Gold amount available
- [ ] Incoming attacks/raids

### 3. Test Full Data Flow (Priority 3)
- [ ] Game → Extension scrapes data
- [ ] Extension → Backend stores snapshot
- [ ] Backend → Returns analysis
- [ ] Extension → Displays in HUD

### 4. THEN Integrate Optimizer (Future)
Once we have real data flowing, integrate the optimizer files

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
- **Background**: `src/background.ts` (v0.8.4 with PING)
- Extension Build: `~/workspace/packages/extension/dist/`
- Database: `~/workspace/backend/travian.db`
- Scripts: `~/workspace/scripts/`

### Optimizer Files (NOT ACTIVE)
- **Algorithm**: `src/game-start-optimizer.ts`
- **AI Enhancement**: `src/ai-prompt-enhancer.ts`
- **Integration**: `src/content/game-integration.ts`
- **Documentation**: `/docs/OPTIMIZER_NOT_DEPLOYED.md`

## 💰 BUDGET STATUS

### Current Setup (Within Budget)
- Replit Hacker: $7/month
- Claude API: ~$50/month (estimated with caching)
- Total: $57/month (well under $100 limit)

## 🎯 LAUNCH CRITERIA (Sept 9)

### Must Have
- [✅] Extension loads and scrapes data
- [✅] Chat UI works with persistence
- [⚠️] AI provides strategic recommendations (basic working, optimizer ready)
- [⚠️] Backend connection (NOT YET)
- [❌] Comprehensive data scraping (only villages)

### Should Have
- [📁] Settlement location optimizer (algorithm ready, needs data)
- [📁] Resource balance calculator (algorithm ready, needs data)
- [📁] CP accumulation predictor (algorithm ready, needs data)
- [ ] Alliance threat assessment

## ⚠️ CRITICAL LESSONS & WARNINGS

### From This Session
- **Built optimizer without data infrastructure** - Classic premature optimization
- **Need backend connection FIRST** - Chat still not using port 3002
- **Data scraping is minimal** - Only have village names/population
- **Optimizer files saved for future** - Good algorithms, need foundation

### DO NOT:
- Deploy optimizer files until backend connected
- Skip data scraping expansion
- Assume we have game state we don't actually scrape
- Edit regular .ts files when -fixed.ts versions exist

### DO:
- Connect to backend server FIRST
- Expand data scraping SECOND
- Test with real data THIRD
- Then integrate optimizer

## 📝 SESSION SUMMARY

### What Happened This Session
1. **Created comprehensive game optimizer** - 4-phase algorithm for top-5 settlement
2. **Built AI prompt enhancement** - Strategic context injection
3. **Realized missing infrastructure** - No backend connection, minimal data scraping
4. **Saved work for future** - Files documented in `/docs/OPTIMIZER_NOT_DEPLOYED.md`
5. **Pivoted to correct priority** - Backend → Data → Then optimizer

### Current State
- Chat UI works perfectly (v0.9.11)
- Basic scraping works (8 villages)
- AI responds through proxy
- Backend running but NOT connected
- Optimizer ready but NOT deployed

### Next Session Priority
1. **Connect chat to backend server** (30 min)
2. **Expand data scraping** (1-2 hours)
3. **Test full data flow** (30 min)
4. **Then consider optimizer integration**

## 🔄 HANDOFF NOTES

**CRITICAL FOR NEXT SESSION**:
1. DO NOT try to deploy optimizer files
2. Focus on backend connection to port 3002
3. Expand data scraping capabilities
4. Test with real game data first

The optimizer is good work but premature. Get the foundation working first:
- Game → Extension → Backend → AI → Display

Once that works with comprehensive data, THEN integrate the optimizer.

---
*End of session. Optimizer created but wisely not deployed. Backend connection is next priority.*
