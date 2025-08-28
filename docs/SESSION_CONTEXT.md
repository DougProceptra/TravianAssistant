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

*Last Updated: August 28, 2025, 10:00 PM PST*
*Session Status: Chat UI Fixed v0.9.11 - Testing deployment*

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

### Extension v0.9.11 (Latest - FIXED)
1. **✅ Chat UI Complete**:
   - Dragging works perfectly
   - Text wrapping in textarea works
   - Resize handle visible and functional
   - Window state persistence (position, size, open state)
   - Removed hardcoded sample content
2. **✅ Data Scraping** - Successfully parsing 8 villages
3. **✅ API Connection** - Fixed in conversational-ai-fixed.ts (uses getGameState)
4. **✅ Background Service** - Added PING handler, improved error handling

### Latest Changes (v0.8.4 Background)
- Added PING handler for testing
- Improved error messages with status codes
- Better prompt building with village extraction
- Updated to claude-3-5-sonnet-20241022 model

### Critical Fix Applied
**DISCOVERED**: Build script uses `-fixed.ts` files, not regular `.ts` files!
- Fixed `conversational-ai-fixed.ts` with correct API method
- Window state persistence implemented
- Sample content removed

### Database Schema
- **villages** table - For player account tracking
- **map_villages** table - For world map data (7,492 entries imported)
- **village_snapshots** - For historical tracking
- **alerts** - For monitoring critical events

### Server Statistics (Current)
```
Top Alliance: [=^.^=] - 416 villages, 241,341 total population
Largest Village: A01 by Grievous - 1,161 population
Total Players: 2,702
Total Alliances: 88
Average Village Population: 306
```

## 🚀 IMMEDIATE NEXT STEPS

### 1. Sync and Build
```bash
# FIRST: Sync with GitHub
cd ~/workspace
git pull origin main

# THEN: Build extension
cd packages/extension
./build-simple.sh

# Download dist/ folder and reload extension
```

### 2. Run Diagnostic Test
```javascript
// Copy entire contents of test-extension.js
// Paste in browser console on Travian page
// Review results for any ❌ marks
```

### 3. Verify All Features
- [ ] PING test passes
- [ ] Chat connects to AI successfully
- [ ] Window position persists on refresh
- [ ] Window size persists on refresh
- [ ] Chat stays open if it was open
- [ ] No sample content appears
- [ ] AI provides real recommendations

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
- **Test Script**: `packages/extension/test-extension.js`

### Key Scripts
- `check-dev-status.js` - Health check (RUN AFTER GIT SYNC!)
- `import-map.js` - Import map.sql data
- `test-backend-sqlite.js` - Test backend endpoints
- `build-simple.sh` - Build extension (USES -fixed.ts FILES!)
- `test-extension.js` - Comprehensive diagnostic test

## 💰 BUDGET STATUS

### Current Setup (Within Budget)
- Replit Hacker: $7/month
- Claude API: ~$50/month (estimated with caching)
- Total: $57/month (well under $100 limit)

### Cost Optimization Implemented
- Aggressive response caching (70% reduction)
- Batch analysis for multiple villages
- Smart prompting to reduce token usage

## 🎯 LAUNCH CRITERIA (Sept 9)

### Must Have
- [✅] Extension loads and scrapes data
- [✅] Chat UI works with persistence
- [🔧] AI provides strategic recommendations
- [ ] Cost per analysis < $0.10

### Should Have
- [ ] Settlement location optimizer
- [ ] Resource balance calculator
- [ ] CP accumulation predictor
- [ ] Alliance threat assessment

### Nice to Have
- [ ] Farm list optimizer
- [ ] Trade route automation
- [ ] Combat simulator
- [ ] Multi-account management UI

## ⚠️ CRITICAL LESSONS & WARNINGS

### DO NOT:
- Skip Git sync at session start!
- Edit regular .ts files when -fixed.ts versions exist!
- Assume which files the build uses - CHECK build-simple.sh!
- Make changes without tracing the full import chain!
- Skip the development process steps above!
- Forget to document discoveries!

### DO:
- ALWAYS sync with GitHub first
- Run `check-dev-status.js` after sync
- Read DEVELOPMENT_GUIDE.md before coding
- Trace execution paths before editing
- Test incrementally (one feature at a time)
- Update documentation immediately
- Run test-extension.js for diagnostics

## 📝 SESSION SUMMARY

### What Was Fixed in v0.9.11 + v0.8.4
1. **Critical Discovery** - Build uses `-fixed.ts` files, not regular ones
2. **API Method Fixed** - Changed to `getGameState()` in correct file
3. **Window Persistence** - Full state saving implemented
4. **Clean UI** - Removed all sample content
5. **Background Service** - Added PING handler for testing
6. **Error Handling** - Better error messages throughout
7. **Test Script** - Comprehensive diagnostic tool created

### Key Learning
- Must sync with GitHub at session start
- Build uses `-fixed.ts` files exclusively
- Always trace execution path before editing
- Document discoveries immediately

### Next Session Focus
1. **Run diagnostic test** - Identify any remaining issues
2. **Fix any failures** - Address ❌ marks from test
3. **Optimize AI prompts** - Make recommendations more strategic
4. **Expand data collection** - Capture more game state

## 🔄 HANDOFF NOTES

**CRITICAL STEPS**:
1. Git sync FIRST - `git pull origin main`
2. Build with `./build-simple.sh`
3. Run `test-extension.js` in browser console
4. Fix any ❌ failures before proceeding

The chat UI should be fully functional with v0.9.11. The `-fixed.ts` file pattern is crucial. Test thoroughly with the diagnostic script before moving to new features.

---
*End of session. Git sync added to mandatory process, diagnostic test ready.*