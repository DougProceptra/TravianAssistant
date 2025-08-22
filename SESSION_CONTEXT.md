# TravianAssistant Session Context
*Last Updated: August 22, 2025 - V3 Strategic Planning Complete*

## 🚨 MANDATORY SESSION START PROTOCOL

### STEP 1: Read Core Documentation
- [ ] Read this ENTIRE document before doing ANYTHING else
- [ ] **NEW PRIORITY**: Read `/docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md` for roadmap
- [ ] Review previous design docs if needed for reference
- [ ] Note we are starting fresh with V3 approach

### STEP 2: Implementation Focus
- [ ] **Target Beta**: August 29, 2025 (7 days)
- [ ] **Target Production**: September 9, 2025
- [ ] **Priority**: Game Start Optimizer (top-5 settler goal)

### STEP 3: Check Environment
- [ ] Create new Replit (Node.js template)
- [ ] Clone GitHub repo: `git clone https://github.com/DougProceptra/TravianAssistant.git`
- [ ] Install dependencies: `npm install better-sqlite3 express cors dotenv`

## 📚 ESSENTIAL DOCUMENTATION

### NEW Primary Reference (V3)
**`/docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md`** - Complete V3 roadmap and implementation guide
- 14-day sprint plan with daily tasks
- Complete technical architecture
- Game start optimization algorithms
- Database schemas and migration path
- AI integration with context_intelligence

### Supporting Documents
- `/docs/TRAVIAN_ASSISTANT_V3.md` - Initial V3 vision
- `/docs/APPLICATION_DESIGN_V2.md` - Previous iteration (reference only)
- `/docs/resource_bar_code` - ResourceBar Plus analysis

## 🎯 V3 STRATEGIC VISION

### Mission
Transform Travian from tedious spreadsheet calculations to AI-powered strategic excellence, enabling top-20 competitive play in under 2 hours per day.

### Architecture Evolution
```
V2 (Deprecated): Navigation-based scraping
V3 (Current): Smart data collection + AI analysis

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

## 💡 KEY DISCOVERIES FROM TODAY'S SESSION

### Data Collection Methods
1. **map.sql Daily Exports**
   - Available at: `http://[server].travian.com/map.sql.gz`
   - Contains all villages, players, alliances
   - Updated daily automatically

2. **AJAX Interception**
   - Monitor game's own API calls
   - Real-time data without navigation
   - No server rule violations

3. **Smart Aggregation**
   - Parse overview pages when viewed
   - Cache everything locally
   - Build complete picture over time

### Technical Decisions
- **Start with Replit + SQLite** for rapid prototyping
- **Migrate to Supabase** when team collaboration needed
- **Use flexible JSON schemas** for easy evolution
- **Abstract database layer** for smooth migration

## 🏗️ IMPLEMENTATION PLAN

### Week 1: Foundation (Aug 22-29) - BETA
**Day 1-2**: Core Infrastructure
- Replit setup with SQLite
- Basic Express server
- map.sql importer

**Day 3-4**: Chrome Extension
- Manifest V3 structure
- Data collection layer
- HUD implementation

**Day 5-6**: Game Start Optimizer
- Opening sequence algorithm
- Resource optimization
- Quest path calculator

**Day 7**: Beta Testing
- Deploy to team
- Collect feedback
- Fix critical bugs

### Week 2: AI & Polish (Aug 29-Sept 5)
- Claude integration
- Context learning
- Performance optimization
- Production deployment

## 🔧 TECHNICAL SETUP

### Database Schema (Ready to Create)
```sql
CREATE TABLE villages (
  id INTEGER PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  vid INTEGER UNIQUE,
  name TEXT,
  player_id INTEGER,
  population INTEGER,
  data JSON,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  data JSON NOT NULL,
  processed BOOLEAN DEFAULT FALSE
);

CREATE TABLE recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority INTEGER,
  action_type TEXT,
  action_data JSON,
  completed BOOLEAN DEFAULT FALSE
);
```

### Quick Start Commands
```bash
# Replit setup
npm init -y
npm install better-sqlite3 express cors dotenv
npm install @anthropic-ai/sdk

# Test map.sql import
curl https://lusobr.x2.lusobrasileiro.travian.com/map.sql -o map.sql
sqlite3 travian.db < map.sql
```

## 🎮 GAME CONTEXT

### Server Details
- **Current Server**: lusobr.x2.lusobrasileiro.travian.com
- **New Server**: Starts September 9, 2025
- **Tribe Focus**: Egyptians
- **Goal**: Top-5 settler

### Doug's Requirements
- **Play Style**: Defensive with artifact capability
- **Time Budget**: <2 hours/day
- **Team Size**: 3-5 players
- **Pain Point**: Village prioritization and calculations

## 📊 DATA STRATEGY

### Collection Priorities
1. **Real-time**: Attacks, resources, building queues
2. **Periodic**: Map scanning, alliance data, rankings
3. **Daily**: map.sql, market prices, statistics

### Storage Strategy
- **Hot Data**: Last 7 days in IndexedDB
- **Warm Data**: Full history in SQLite/Supabase
- **Cold Data**: Compressed archives after 30 days
- **Report Retention**: 30 days farm, 90 days combat, forever defense

## ⚠️ CRITICAL RULES

### ToS Compliance
- ✅ No automation of game actions
- ✅ Data collection and analysis only
- ✅ Smart recommendations, manual execution
- ⚠️ Gray area: Systematic scanning (case-by-case)

### Development Rules
- **One clear action at a time**
- **Research before implementing**
- **Test everything locally first**
- **Document all decisions**

## 📝 SESSION LOG

### August 22, 2025 - V3 Strategic Planning
**Major Accomplishments:**
- Evolved from V2 (navigation-based) to V3 (AI-powered) vision
- Researched how existing tools collect data (map.sql, AJAX interception)
- Designed scalable database architecture (SQLite → Supabase migration path)
- Created comprehensive 14-day implementation roadmap
- Defined clear success metrics for each game phase
- Resolved all technical architecture questions
- Set beta target for August 29, production for September 9

**Key Documents Created:**
- `/docs/TRAVIAN_ASSISTANT_V3.md` - Initial vision
- `/docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md` - Full roadmap

**Next Session Focus:**
- Set up Replit environment
- Create database schema
- Build Chrome extension skeleton
- Implement map.sql importer
- Start game optimization algorithm

### [Next Session - Implementation Day 1]
- [ ] Create new Replit (Node.js)
- [ ] Run setup scripts from V3 roadmap
- [ ] Build foundation infrastructure
- [ ] Test with live game data

## 🚀 READY TO BUILD

We have:
- ✅ Clear vision and success metrics
- ✅ Complete technical roadmap
- ✅ 14-day sprint plan
- ✅ All architecture decisions made
- ✅ Database schemas ready
- ✅ Algorithm designs complete

**Next session: Start building Day 1-2 Foundation**

---
*V3 represents a complete strategic evolution from helper tool to AI command center.*
*The roadmap is complete. The path is clear. Time to execute.*
*ALWAYS refer to `/docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md` for implementation details.*