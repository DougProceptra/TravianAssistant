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

*Last Updated: August 28, 2025, 12:50 PST*
*Session Status: V4 Architecture Complete - Ready for Implementation*

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

### V4 Architecture Document (COMPLETED TODAY)
1. **✅ Complete technical specification created**
2. **✅ Adapted for budget constraints ($100/month)**
3. **✅ Replit/Supabase/Claude stack defined**
4. **✅ 12-day implementation roadmap**
5. **✅ Monetization strategy included**

## 🔧 IMMEDIATE PRIORITIES

### UI Polish (2-3 hours)
1. **Fix Chat Dragging** - Variables declared but scope issues
2. **Fix Text Wrapping** - textarea wrap="soft" not applying
3. **Fix Resize Handle** - CSS resize: both applied but handle tiny

### Week 1 Sprint (Aug 28 - Sept 3)
**Days 1-2: Infrastructure**
- [ ] Configure Replit Node.js environment
- [ ] Set up Supabase free tier
- [ ] Initialize SQLite for dev
- [ ] Configure Vercel proxy

**Days 3-4: Core Engine**
- [ ] Build game state scraper
- [ ] Implement data collection
- [ ] Create processing pipelines
- [ ] Set up Claude integration

**Days 5-7: AI Systems**
- [ ] Develop Claude prompts
- [ ] Implement combat simulator
- [ ] Create resource optimizer
- [ ] Build tribal intelligence

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

### Cost Control Measures
- Aggressive response caching (70% reduction)
- Batch analyze multiple villages
- User quotas: 50 analyses/day free
- Premium tier: $10/month unlimited

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

### Performance Targets (Realistic)
- API Response: < 500ms average
- AI Analysis: < 2 seconds complex
- Data Collection: 5-minute intervals
- System Availability: 95% uptime

## 📊 SUCCESS METRICS

### Technical
- Prediction accuracy > 85%
- Response time < 500ms (95th percentile)
- Cost < $100/month

### User Impact
- Time savings: 30+ minutes/session
- Strategic advantage: 25% faster than manual
- User satisfaction: >4.5/5

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

1. **Fix UI Issues** (30 minutes)
   - Make chat draggable
   - Fix text wrapping
   - Make resize handle visible

2. **Start Infrastructure** (2 hours)
   - Set up Replit project
   - Configure Supabase
   - Test Claude integration

3. **Begin Data Collection** (2 hours)
   - Implement basic scraper
   - Parse map.sql
   - Store in database

## 📝 SESSION NOTES

### Current Understanding (Aug 28, 2025)
- Doug needs deep AI analysis, not superficial advice
- Budget constraint is firm at $100/month
- Focus on clever engineering over expensive infrastructure
- September 9th server start is hard deadline
- Tool must enable competitive play with 1-2 hours daily

### Key Context
- 15 years Travian experience (Doug)
- Egyptian tribe focus for next server
- Alliance coordination not priority (Doug handles)
- Predictive modeling essential
- Must learn and adapt to preferences

---
*Session wrap: V4 architecture complete, ready for implementation sprint starting tomorrow.*
