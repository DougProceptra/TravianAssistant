# TravianAssistant Session Context
*Last Updated: August 28, 2025, 10:37 PM*

## Current Project State

### Active Work: Resource Management & Collaborative AI Architecture
Successfully updated V4 specification with comprehensive resource management design and collaborative AI intelligence system. The architecture now emphasizes:
- Complete game state visibility across all villages
- Real-time page context capture for contextual AI responses  
- Collaborative AI that asks clarifying questions when data is missing
- Raw data capture with AI reasoning rather than pre-structured analysis

### Key Architectural Decisions Made

#### Data Architecture (3 Layers)
1. **Static Game Rules**: Complete Kirilloid formulas and Travian documentation
2. **Live Game State**: Real-time scraping with 5-minute village polling
3. **Learned Patterns**: context_intelligence for behavioral patterns

#### Resource Management System
- Multi-village state synchronization every 5 minutes
- Resource flow optimization with precise transfer recommendations
- Dynamic village switch detection (all methods)
- AI provides specific actionable advice: "Send 1,500 iron/hour from Village 1 to Village 2"

#### Collaborative AI Design
- Page context awareness - AI "sees" exactly what player sees
- Intelligent questioning when data is missing
- Confidence-based recommendations (high/medium/low)
- Progressive learning from interactions

## Technical Status

### Working Components
✅ Chrome Extension base structure (Manifest V3)
✅ Content script for page scraping
✅ HUD overlay system
✅ Background service worker

### Blocked/In Progress
🔧 Vercel proxy deployment (API calls to Anthropic)
- Issue: Direct API calls blocked by CORS in Manifest V3
- Solution: Vercel Edge Function proxy exists but deployment issues
- Branch: fix/vercel-proxy-solution needs proper deployment

### Next Implementation Priorities
1. Import Kirilloid data as TypeScript constants
2. Implement village polling system (5-minute cycles)
3. Build page context capture for current view
4. Integrate collaborative AI questioning system
5. Deploy working Vercel proxy

## Key Design Principles

### Data Philosophy
- **Raw over processed**: Capture everything, let AI reason
- **Complete visibility**: See all villages, not just current
- **Context aware**: AI knows what page you're looking at
- **Collaborative**: AI asks for missing data rather than guessing

### User Experience Goals
- Reduce gameplay to <2 hours/day
- Enable top-20 competitive play
- Provide specific, actionable recommendations
- Zero friction - AI sees what you see

## Recent Decisions & Insights

### Resource Data Architecture
- Acceptable for data to be 5 minutes stale
- AI handles projections and reasoning (not pre-structured)
- Village polling via programmatic switching
- Store raw HTML for future parsing needs

### AI Integration Approach
- Claude gets complete game rules + current state
- No need to discover mechanics - we have documentation
- AI asks clarifying questions for missing data
- Confidence scoring on all recommendations

## Critical Information

### API Configuration
- **Anthropic API**: Via Vercel proxy (not direct)
- **API Key**: Stored in Vercel environment only
- **Chrome Extension**: No API keys stored

### Repository Structure
```
/packages/extension/    - Chrome extension code
/api/anthropic.js      - Vercel Edge Function (proxy)
/docs/                 - Documentation
  - TravianAssistantv4.md (updated with new architecture)
  - KIRILLOID_INTEGRATION_PLAN.md (game formulas source)
  - SESSION_CONTEXT.md (this file)
```

## Removed/Outdated Information
- ❌ Removed cost optimization focus from V4 doc (not primary concern)
- ❌ Removed complex ML predictions (using Claude's reasoning instead)
- ❌ Removed Supabase/database discussion (using Chrome storage)
- ❌ Updated from generic advice to specific actionable intelligence

## Next Session Focus
Continue with implementation of:
1. Kirilloid data import
2. Village polling mechanism
3. Page context capture system
4. Vercel proxy deployment fix

## Questions for Next Session
- Verify Vercel deployment approach
- Test village switching programmatically
- Confirm Chrome storage limits for multi-village data