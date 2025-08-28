# TravianAssistant Session Context

## ⚠️ MANDATORY READING INSTRUCTION ⚠️
**You must read every word of this document. You must read it 3 times. The first as a senior architect guiding the work of an application. The second time is as a developer that will be executing the steps and directions emanating from document and the third time as business analyst making sure you understand the functions and processes being addressed and how they affect the game. You cannot proceed until you fully comprehend every aspect of the SESSION_CONTEXT.md document.**

## 🛑 MANDATORY STOP GATES - DO NOT PROCEED WITHOUT THESE

### BEFORE ANY CODE CHANGE:
- [ ] Run `grep [function] dist/background.js` - VERIFY what's actually there
- [ ] Run `node -c dist/background.js` - CHECK for syntax errors
- [ ] State: "The EXACT error I'm fixing is: _____" (no fix without error)
- [ ] State: "I verified this error exists by: _____" (no assumption)

### IF YOU CANNOT CHECK ALL BOXES, STOP.

---

*Last Updated: August 28, 2025, 1:09 PM PST*
*Session Status: UI Polish Complete ✅ - Starting Infrastructure*

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

### V4 Architecture Document (COMPLETED)
1. **✅ Complete technical specification created**
2. **✅ Adapted for budget constraints ($100/month)**
3. **✅ Replit/Supabase/Claude stack defined**
4. **✅ 12-day implementation roadmap**
5. **✅ Monetization strategy included**

## 🔧 IMMEDIATE PRIORITIES

### Infrastructure Setup (Starting NOW - 2-4 hours)
1. **Replit Configuration** (30 min)
   - [ ] Create new Node.js project
   - [ ] Install dependencies: express, better-sqlite3, @anthropic-ai/sdk
   - [ ] Set up environment variables
   - [ ] Test basic server

2. **Supabase Setup** (30 min)
   - [ ] Create free tier account
   - [ ] Initialize database schema
   - [ ] Configure connection pooling
   - [ ] Set up auth (if time)

3. **Data Collection Pipeline** (2 hours)
   - [ ] Implement map.sql parser
   - [ ] Create village data scraper
   - [ ] Build resource tracker
   - [ ] Set up periodic sync

4. **Claude Integration** (1 hour)
   - [ ] Create prompt templates
   - [ ] Build context manager
   - [ ] Implement caching layer
   - [ ] Test with real game data

## 💰 BUDGET & INFRASTRUCTURE

### Stack (Budget-Optimized)
- **Backend**: Node.js on Replit ($7/month Hacker plan)
- **Database**: SQLite3 → Supabase PostgreSQL (free tier)
- **AI**: Claude Sonnet 4 via Vercel proxy (~$50/month)
- **Caching**: In-memory + Replit KV storage
- **Notifications**: Browser + Discord webhooks (free)

### Cost Breakdown ($100/month max)
- Replit Hacker: $7
- Claude API: ~$50 (with 70% cache reduction)
- Domain: $1
- Reserve: $42 for scaling

## 🎯 KEY TECHNICAL DECISIONS

### AI Strategy
- Single Claude model for all analysis (cost-effective)
- Carefully crafted prompts for different analysis types
- Context persistence through conversation
- Confidence levels: High/Medium/Low

### Data Architecture
```sql
-- Supabase schema (optimized for free tier)
CREATE TABLE game_states (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    player_id INTEGER NOT NULL,
    game_data JSONB -- All state in one column
);
```

## 📊 SUCCESS METRICS

### Launch Criteria (Sept 9)
- [ ] Top-5 settler capability proven
- [ ] Reduces gameplay to <2 hours/day
- [ ] Zero critical bugs
- [ ] Cost monitoring active

## ⚠️ CRITICAL LESSONS LEARNED

### DO NOT:
- Use sed commands for complex edits (corrupts code)
- Try to insert JavaScript with sed
- Make assumptions about file state
- Use expensive ML models or infrastructure

### DO:
- Manual edit in Replit editor
- Test each change individually
- Commit working versions immediately
- Use Claude's reasoning over complex models
- Cache aggressively to reduce costs

## 🚀 NEXT SESSION ACTIONS

1. **Infrastructure Setup** (NOW - 2:00 PM)
   - Set up Replit project
   - Configure Supabase
   - Test Claude integration

2. **Data Collection** (2:00 PM - 4:00 PM)
   - Implement basic scraper
   - Parse map.sql
   - Store in database

3. **First AI Analysis** (4:00 PM)
   - Test settlement timing calculation
   - Verify cost per analysis
   - Measure response time

## 📝 SESSION NOTES

### Current Status (1:09 PM Aug 28)
- UI Polish COMPLETE ✅
- Chat fully functional with drag, resize, text wrap
- Moving to backend infrastructure
- 12 days until server launch
- Focus: Get data flowing TODAY

### Key Files Modified Today
- `packages/extension/src/content/conversational-ai-fixed.ts` - All UI fixes applied
- Version bumped to 0.9.6

### Next Critical Milestone
- Working data collection by EOD
- First AI analysis of real game state
- Cost validation under $0.10 per analysis

---
*Session wrap: UI complete, infrastructure sprint beginning.*