# TravianAssistant Session Context
*Last Updated: August 23, 2025 - Day 1 Implementation Started*

## 🚀 AUTOMATIC SESSION STARTUP TRIGGER

**When Doug says any of these phrases:**
- "TravianAssistant session start"
- "Continue TravianAssistant development"  
- "Execute session startup"
- "Follow session start up steps"

**Claude MUST automatically:**
1. ✅ Retrieve context using `context_intelligence` tool
2. ✅ Read this SESSION_CONTEXT.md file
3. ✅ Check `/docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md` for roadmap
4. ✅ Report current status and next steps
5. ✅ Begin execution WITHOUT waiting for confirmation

## 📍 CURRENT PROJECT STATUS

### Implementation Phase
- **Current Day**: Day 1-2 of Week 1 (Core Infrastructure)
- **Sprint Day**: 1 of 14
- **Beta Target**: August 29, 2025 (6 days remaining)
- **Production Target**: September 9, 2025 (17 days remaining)

### Environment Status
- ✅ **Replit**: Already created and functioning
- ✅ **GitHub Sync**: Repository connected and syncing with Replit
- ✅ **Basic Structure**: Packages folder, extension skeleton exists
- 🚧 **Database**: Needs SQLite schema implementation
- 🚧 **Backend Server**: Needs Express API setup
- 🚧 **Map.sql Importer**: Needs implementation

### Today's Objectives (Day 1-2)
- [x] Replit environment exists and synced
- [ ] Initialize SQLite database with V3 schema
- [ ] Create Express server with API endpoints
- [ ] Build map.sql importer script
- [ ] Test Chrome extension data collection
- [ ] Connect extension to backend API

### Completion Status
- [x] V3 Strategic Planning Complete
- [x] Technical Roadmap Documented
- [x] Replit Environment Connected
- [x] GitHub Repository Synced
- [ ] Database Implementation
- [ ] Backend API Creation
- [ ] Map.sql Importer
- [ ] Game Start Optimizer

## 🚨 MANDATORY SESSION START PROTOCOL

### STEP 1: Context Retrieval (AUTOMATIC)
- Retrieve stored patterns with `context_intelligence`
- Check for any updates from previous sessions
- Load Doug's preferences and project patterns

### STEP 2: Documentation Review (AUTOMATIC)
- Read this entire SESSION_CONTEXT.md
- Check `/docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md` for roadmap details
- Note current implementation day and objectives

### STEP 3: Status Report (AUTOMATIC)
- Report current sprint day and remaining time
- List today's objectives from roadmap
- Identify any blockers or decisions needed

### STEP 4: Begin Execution (AUTOMATIC)
- Start with first uncompleted objective
- Provide clear, actionable code/scripts
- Update this document as progress is made

## 🛠️ REPLIT CONFIGURATION

### Current Replit Setup
- **URL**: Connected to GitHub repo `DougProceptra/TravianAssistant`
- **Type**: Node.js environment
- **Sync**: Auto-sync enabled with GitHub
- **Structure**: 
  ```
  TravianAssistant/
  ├── packages/
  │   └── extension/     # Chrome extension code
  ├── backend/          # Server code (to be implemented)
  ├── scripts/          # Utility scripts
  ├── db/              # Database files
  └── docs/            # Documentation
  ```

### Replit Commands Available
```bash
# In Replit Shell:
npm install              # Install dependencies
npm run init-db         # Initialize database
npm run import-map      # Import map.sql
npm start              # Start Express server
npm run dev           # Start with nodemon

# Git sync commands:
git pull              # Pull latest from GitHub
git add .
git commit -m "message"
git push             # Push to GitHub
```

## 📚 ESSENTIAL DOCUMENTATION

### Primary References (V3)
**`/docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md`** - Complete V3 roadmap and implementation guide
- Full 14-day sprint plan with daily tasks
- Complete technical architecture
- Game start optimization algorithms
- Database schemas and migration path
- AI integration specifications

**`SESSION_CONTEXT.md`** (This file) - Living project state
- Current implementation status
- Session handoff information
- Quick reference for key decisions
- Progress tracking

### Supporting Documents
- `/docs/TRAVIAN_ASSISTANT_V3.md` - Initial V3 vision document
- `/docs/APPLICATION_DESIGN_V2.md` - Previous iteration (deprecated)
- `/docs/resource_bar_code` - ResourceBar Plus analysis

## 🏗️ WEEK 1 IMPLEMENTATION PLAN

### Day 1-2: Core Infrastructure ⬅️ CURRENT
**Backend Setup** (In Replit)
- [ ] Create `/backend/server.js` with Express
- [ ] Implement `/backend/db/schema.js` for SQLite
- [ ] Create `/scripts/import-map.js` for map.sql
- [ ] Build `/backend/api/` endpoints structure
- [ ] Test database connections

**Chrome Extension** (Existing structure)
- [ ] Verify manifest.json is V3 compliant
- [ ] Update content script for data collection
- [ ] Implement service worker for background tasks
- [ ] Create HUD overlay component

### Day 3-4: Chrome Extension Development
- Data collection implementation
- HUD positioning and controls
- Settings storage
- Communication with backend

### Day 5-6: Game Start Optimizer
- Egyptian-specific algorithms
- Quest path optimization
- Resource balance calculator
- CP accumulation strategy

### Day 7: Beta Testing & Feedback
- Deploy to team members
- Collect feedback
- Fix critical bugs
- Prepare for Week 2

## 🎮 PROJECT CONTEXT

### Mission Statement
Transform Travian gameplay from tedious spreadsheet calculations to AI-powered strategic excellence, enabling top-20 competitive play in under 2 hours per day.

### Architecture (V3)
```
Chrome Extension → Replit Backend → SQLite/Supabase
       ↓                ↓                  ↓
   Data Scraper    Claude AI          Data Storage
       ↓                ↓                  ↓
     HUD UI      Context Learning     Analytics
```

### Key Success Metrics
- **Game Start**: Top-5 settler (<168 hours)
- **Time Efficiency**: <2 hours/day gameplay
- **Rank**: Top-20 by population
- **Automation**: Zero manual calculations

### Server Details
- **Current Server**: lusobr.x2.lusobrasileiro.travian.com
- **New Server**: Starts September 9, 2025
- **Tribe Focus**: Egyptians
- **Team Size**: 3-5 players

## 🔧 TECHNICAL SPECIFICATIONS

### Database Schema (SQLite)
```sql
-- Core game data
CREATE TABLE villages (
  id INTEGER PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  vid INTEGER UNIQUE,
  name TEXT,
  player_id INTEGER,
  population INTEGER,
  data JSON,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(x, y)
);

CREATE TABLE game_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  data JSON NOT NULL,
  village_id INTEGER,
  processed BOOLEAN DEFAULT FALSE
);

CREATE TABLE recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority INTEGER,
  action_type TEXT,
  action_data JSON,
  completed BOOLEAN DEFAULT FALSE,
  result JSON
);

CREATE TABLE performance_metrics (
  date DATE PRIMARY KEY,
  population_rank INTEGER,
  resource_production INTEGER,
  time_played_minutes INTEGER,
  actions_automated INTEGER
);
```

### Environment Variables (.env)
```bash
# Replit .env file (use Secrets tab in Replit)
ANTHROPIC_API_KEY=your_key_here
DATABASE_PATH=./db/travian.db
SERVER_URL=https://lusobr.x2.lusobrasileiro.travian.com
PORT=3000
NODE_ENV=development
```

## 📊 DATA COLLECTION STRATEGY

### Priority 1: Real-time Data
- Resource levels (every page load)
- Building queues (AJAX interception)
- Incoming attacks (continuous monitoring)
- Market prices (when viewed)

### Priority 2: Periodic Data
- map.sql daily import
- Alliance member list
- Rankings (population, attack, defense)
- Reports (farm, scout, combat)

### Priority 3: On-Demand
- Oasis information
- Player profiles
- Alliance diplomacy
- Artifact holders

## ⚠️ CRITICAL RULES & GUIDELINES

### ToS Compliance
- ✅ **ALLOWED**: Data collection, analysis, recommendations
- ✅ **ALLOWED**: Reading game responses, parsing HTML
- ✅ **ALLOWED**: Storing data locally, calculations
- ❌ **FORBIDDEN**: Automating game actions
- ❌ **FORBIDDEN**: Sending game commands automatically
- ⚠️ **GRAY AREA**: Systematic map scanning (discuss case-by-case)

### Development Principles
1. **One clear action at a time** - No overwhelming lists
2. **Research before implementing** - Use web_search for current info
3. **Test everything locally first** - Replit before production
4. **Document all decisions** - Update this file continuously
5. **Fail fast, iterate quickly** - Beta in 7 days

## 📝 SESSION LOG

### August 22, 2025 - V3 Strategic Planning ✅
**Completed:**
- Evolved from V2 to V3 architecture
- Created comprehensive roadmap (`TRAVIAN_ASSISTANT_V3_COMPLETE.md`)
- Researched data collection methods
- Designed database architecture
- Set sprint timeline

### August 23, 2025 - Day 1 Implementation 🚧
**In Progress:**
- Replit already exists and synced with GitHub
- Need to implement SQLite database schema
- Need to create Express server
- Need to build map.sql importer

**Session Notes:**
- Improved session startup protocol for automatic execution
- Claude now recognizes TravianAssistant context immediately
- SESSION_CONTEXT.md will be continuously updated
- Discovered Replit already exists and is synced

**Next Steps:**
1. Check existing Replit file structure
2. Implement database initialization script
3. Create Express server with API endpoints
4. Build map.sql importer
5. Test with live server data

### Next Session Checklist
- [ ] Complete any unfinished Day 1-2 objectives
- [ ] Begin Day 3-4 Chrome Extension work if ahead
- [ ] Test map.sql import with live data
- [ ] Update progress in this document

## 🛠️ QUICK REFERENCE

### Replit Shell Commands
```bash
# Check current structure
ls -la

# Install missing dependencies
npm install better-sqlite3 express cors dotenv @anthropic-ai/sdk

# Initialize database
node scripts/init-db.js

# Import map.sql
node scripts/import-map.js

# Start server
node backend/server.js

# Test endpoints
curl http://localhost:3000/api/status
```

### Chrome Extension Testing
```bash
# Load unpacked extension
chrome://extensions/ → Developer mode → Load unpacked → Select packages/extension

# View service worker logs
chrome://extensions/ → Details → Service worker

# Test content script
F12 → Console → Check for TravianAssistant logs
```

### Git Workflow (in Replit)
```bash
# Check status
git status

# Pull latest changes
git pull origin main

# Commit and push
git add .
git commit -m "Day 1: [specific change]"
git push origin main
```

## 🎯 DECISION LOG

### Technical Decisions Made
- **Database**: SQLite first, Supabase later (easier local dev)
- **Backend**: Node.js on Replit (Doug's preference)
- **Extension**: Manifest V3 (required by Chrome)
- **AI**: Claude Sonnet via API (not browser-based)
- **Data**: JSON columns for flexibility
- **Replit**: Already exists, synced with GitHub

### Pending Decisions
- [ ] Exact HUD positioning defaults
- [ ] Cache duration for different data types
- [ ] Team sharing mechanism (before Supabase)
- [ ] Beta distribution method

## 🚀 READY STATE

### We Have
- ✅ Complete technical roadmap
- ✅ Clear daily objectives
- ✅ Replit environment (exists and synced)
- ✅ GitHub repository connected
- ✅ Basic extension structure
- ✅ Architecture decisions made

### We Need (Day 1 Priority)
- 🚧 SQLite database implementation
- 🚧 Express server with API
- 🚧 map.sql importer script
- 🚧 Extension-to-backend connection
- 🚧 Basic HUD overlay

---

*This document is the living state of TravianAssistant V3.*
*Update it continuously as we progress.*
*Every session starts here, every session updates here.*

**Current Focus: Day 1-2 Core Infrastructure Implementation**
**Replit Status: Exists and synced with GitHub**