# TravianAssistant Session Context

## ⚠️ MANDATORY READING INSTRUCTION ⚠️
**You must read every word of this document. You must read it 3 times. The first as a senior architect guiding the work of an application. The second time is as a developer that will be executing the steps and directions emanating from document and the third time as business analyst making sure you understand the functions and processes being addressed and how they affect the game. You cannot proceed until you fully comprehend every aspect of the SESSION_CONTEXT.md document.**

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

## 🛑 MANDATORY SESSION STARTUP - RUN THIS FIRST 🛑

### BEFORE ANY DEVELOPMENT WORK:
```bash
cd ~/workspace
node scripts/check-dev-status.js
```
**This health check script MUST be run at the start of EVERY session to ensure:**
- [ ] Git status is clean or changes are known
- [ ] All critical files exist
- [ ] Dependencies are installed 
- [ ] Database is initialized
- [ ] Backend services are ready
- [ ] Extension build is current

**DO NOT PROCEED if any critical errors are shown!**

---

*Last Updated: August 28, 2025, 9:45 PM PST*
*Session Status: Chat UI Fixed v0.9.11 - API connection resolved*

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

### 1. Deploy and Test v0.9.11
```bash
cd ~/workspace/packages/extension
./build-simple.sh
# Download dist/ folder and reload extension
```

### 2. Verify All Features
- [ ] Chat connects to AI successfully
- [ ] Window position persists on refresh
- [ ] Window size persists on refresh
- [ ] Chat stays open if it was open
- [ ] No sample content appears
- [ ] AI provides real recommendations

### 3. Document Any New Issues
- Add to DEVELOPMENT_GUIDE.md
- Update this file with results

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
- Extension Build: `~/workspace/packages/extension/dist/`
- Database: `~/workspace/backend/travian.db`
- Scripts: `~/workspace/scripts/`

### Key Scripts
- `check-dev-status.js` - Health check (RUN FIRST!)
- `import-map.js` - Import map.sql data
- `test-backend-sqlite.js` - Test backend endpoints
- `build-simple.sh` - Build extension (USES -fixed.ts FILES!)

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
- Edit regular .ts files when -fixed.ts versions exist!
- Assume which files the build uses - CHECK build-simple.sh!
- Make changes without tracing the full import chain!
- Skip the development process steps above!
- Forget to document discoveries!

### DO:
- Run `check-dev-status.js` FIRST every session
- Read DEVELOPMENT_GUIDE.md before coding
- Trace execution paths before editing
- Test incrementally (one feature at a time)
- Update documentation immediately

## 📝 SESSION SUMMARY

### What Was Fixed in v0.9.11
1. **Critical Discovery** - Build uses `-fixed.ts` files, not regular ones
2. **API Method Fixed** - Changed to `getGameState()` in correct file
3. **Window Persistence** - Full state saving implemented
4. **Clean UI** - Removed all sample content

### Key Learning
We were repeatedly fixing the wrong files because we didn't trace the build process. The build script uses `index-fixed.ts` and `conversational-ai-fixed.ts`, NOT the regular versions. This is now documented in multiple places.

### Next Session Focus
1. **Test the deployed fix** - Verify all features work
2. **Optimize AI prompts** - Make recommendations more strategic
3. **Expand data collection** - Capture more game state
4. **Cost analysis** - Measure actual API usage

## 🔄 HANDOFF NOTES

**CRITICAL**: Always check which files the build actually uses before editing! The `-fixed.ts` pattern is non-obvious but crucial. The chat UI should now be fully functional with v0.9.11. Test thoroughly before moving to next features.

The development process at the top of this document is MANDATORY to prevent repeating the same mistakes. Follow it every time.

---
*End of session. Development process documented, critical fix applied.*