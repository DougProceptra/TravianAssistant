# TravianAssistant Session Context

## ⚠️ MANDATORY READING INSTRUCTION ⚠️
**You must read every word of this document. You must read it 3 times. The first as a senior architect guiding the work of an application. The second time is as a developer that will be executing the steps and directions emanating from document and the third time as business analyst making sure you understand the functions and processes being addressed and how they affect the game. You cannot proceed until you fully comprehend every aspect of the SESSION_CONTEXT.md document.**

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

## 🛑 MANDATORY STOP GATES - DO NOT PROCEED WITHOUT THESE

### BEFORE ANY CODE CHANGE:
- [ ] Run `grep [function] dist/background.js` - VERIFY what's actually there
- [ ] Run `node -c dist/background.js` - CHECK for syntax errors
- [ ] State: "The EXACT error I'm fixing is: _____" (no fix without error)
- [ ] State: "I verified this error exists by: _____" (no assumption)

### IF YOU CANNOT CHECK ALL BOXES, STOP.

---

*Last Updated: August 28, 2025, 1:15 PM PST*
*Session Status: Infrastructure Setup - Using Existing Backend*

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

## 📋 PROJECT OVERVIEW

### Mission Statement
**"Stockfish for Travian"** - Transform Travian gameplay from tedious micromanagement to AI-powered strategic excellence, enabling top-20 competitive play in under 2 hours per day.

### Core Requirements (Updated August 28, 2025)
1. **Deep Strategic AI Analysis** - Not superficial advice like "increase crop production" but specific, actionable intelligence: "Reduce settlement time by 32 minutes with this exact build order"
2. **Comprehensive Data Collection** - Every game dimension captured and analyzed
3. **Predictive Modeling** - Account growth, enemy movements, server trends
4. **Budget Constraints** - $100/month maximum operational cost
5. **September 9th Launch** - 12 days to production server start
6. **Multi-Player Support** - Architecture already supports multiple accounts via `account_id`

## ✅ COMPLETED WORK

### V0.9.5 - Core Chat Functionality (WORKING)
1. **✅ Chat connects to Claude Sonnet 4** - PRIMARY GOAL ACHIEVED
2. **✅ API Proxy Working**: https://travian-proxy-simple.vercel.app/api/proxy
3. **✅ Messages send/receive properly**
4. **✅ Version management system working**

### V0.9.6 - UI Polish (COMPLETED TODAY - 1:09 PM)
1. **✅ Fixed Chat Dragging** - Moved variables to class scope for proper access
2. **✅ Fixed Text Wrapping** - Changed input to textarea with auto-resize
3. **✅ Fixed Resize Handle** - Added visible custom resize handle with gradient
4. **✅ Committed to main branch** - SHA: c67b1cabf815237ded74bbf1b9f7bfea68b92857

### Existing Backend Infrastructure (DISCOVERED)
1. **✅ Multi-player architecture** - Full `account_id` support throughout
2. **✅ SQLite database** - Complete schema with accounts, villages, snapshots, alerts
3. **✅ WebSocket support** - Real-time updates implemented
4. **✅ Historical tracking** - Snapshot system for trend analysis
5. **✅ Alert monitoring** - Overflow/starvation detection

### V4 Architecture Document (COMPLETED)
1. **✅ Complete technical specification created**
2. **✅ Adapted for budget constraints ($100/month)**
3. **✅ Replit/Supabase/Claude stack defined**
4. **✅ 12-day implementation roadmap**
5. **✅ Monetization strategy included**

## 🔧 IMMEDIATE PRIORITIES

### Use Existing Backend Infrastructure (NOW - 1-2 hours)
1. **Initialize Database** (15 min)
   ```bash
   cd ~/workspace/backend
   node init-db.js
   ```

2. **Import Map Data** (15 min)
   ```bash
   curl -s "https://lusobr.x2.lusobrasileiro.travian.com/map.sql" -o map.sql
   node import-map.js
   ```

3. **Start Backend Server** (5 min)
   ```bash
   node server-sqlite-fixed.js
   # Or use smart starter:
   node start.js
   ```

4. **Test Backend Health** (10 min)
   ```bash
   node ../scripts/test-backend-sqlite.js
   ```

5. **Connect Extension to Backend** (30 min)
   - Update extension to use local backend
   - Test data sync
   - Verify WebSocket connection

## 💰 BUDGET & INFRASTRUCTURE

### Stack (Budget-Optimized)
- **Backend**: Node.js on Replit ($7/month Hacker plan)
- **Database**: SQLite locally → Supabase PostgreSQL for production (free tier)
- **AI**: Claude Sonnet 4 via Vercel proxy (~$50/month)
- **Caching**: In-memory + Replit KV storage
- **Notifications**: WebSocket + Browser notifications (free)

### Cost Breakdown ($100/month max)
- Replit Hacker: $7
- Claude API: ~$50 (with 70% cache reduction)
- Domain: $1
- Reserve: $42 for scaling

## 🗄️ DATABASE ARCHITECTURE

### Existing Schema (Multi-Player Ready)
```sql
-- Accounts table for multi-player support
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  server_url TEXT NOT NULL,
  account_name TEXT,
  tribe TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Villages with account association
CREATE TABLE villages (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,  -- Links to specific account
  village_id TEXT NOT NULL,
  name TEXT NOT NULL,
  coordinates TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Snapshots for historical tracking
CREATE TABLE village_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  resources TEXT NOT NULL,
  production TEXT NOT NULL,
  buildings TEXT,
  troops TEXT,
  population INTEGER
);

-- Alert system
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  resolved INTEGER DEFAULT 0
);
```

## 🎯 KEY TECHNICAL DECISIONS

### AI Strategy
- Single Claude model for all analysis (cost-effective)
- Carefully crafted prompts for different analysis types
- Context persistence through conversation
- Confidence levels: High/Medium/Low

### Performance Targets (Realistic)
- API Response: < 500ms average
- AI Analysis: < 2 seconds complex
- Data Collection: 5-minute intervals
- System Availability: 95% uptime

## 📊 SUCCESS METRICS

### Launch Criteria (Sept 9)
- [ ] Top-5 settler capability proven
- [ ] Reduces gameplay to <2 hours/day
- [ ] Zero critical bugs
- [ ] Cost monitoring active
- [ ] Multi-player support tested

## ⚠️ CRITICAL LESSONS LEARNED

### DO NOT:
- Use sed commands for complex edits (corrupts code)
- Try to insert JavaScript with sed
- Make assumptions about file state
- Use expensive ML models or infrastructure
- Ignore existing infrastructure - USE WHAT'S BUILT!

### DO:
- Run `check-dev-status.js` at session start
- Use existing backend infrastructure
- Manual edit in Replit editor for complex changes
- Test each change individually
- Commit working versions immediately
- Use Claude's reasoning over complex models
- Cache aggressively to reduce costs

## 🚀 NEXT SESSION ACTIONS

1. **Health Check** (FIRST THING!)
   ```bash
   node scripts/check-dev-status.js
   ```

2. **Backend Initialization** (15 min)
   - Initialize database with existing schema
   - Import map.sql data
   - Start server

3. **Test Infrastructure** (30 min)
   - Verify all endpoints
   - Test WebSocket connection
   - Check alert system

4. **First AI Analysis** (1 hour)
   - Connect to Claude via proxy
   - Test settlement timing calculation
   - Measure cost per analysis

## 📝 SESSION NOTES

### Current Status (1:15 PM Aug 28)
- UI Polish COMPLETE ✅
- Discovered EXISTING comprehensive backend
- Multi-player architecture already built
- WebSocket real-time updates ready
- Focus: Use existing infrastructure, don't rebuild!

### Key Discovery
- Backend already has complete multi-player support
- SQLite database with full schema exists
- WebSocket implementation complete
- Alert system implemented
- Historical tracking via snapshots ready

### Next Critical Milestone
- Get backend running with real data
- Test multi-account support
- Verify cost < $0.10 per AI analysis

---
*Session wrap: UI complete, existing backend discovered, ready to leverage built infrastructure.*