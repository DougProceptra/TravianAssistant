# TravianAssistant Session Context
*Last Updated: August 29, 2025, 12:50 PM*

## Current Project State - V4 Architecture

### Active Work: Resource Management & Collaborative AI Architecture
Successfully designed V4 specification with comprehensive resource management and collaborative AI intelligence system. The architecture emphasizes:
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
✅ Vercel proxy for Anthropic API calls (working properly)

### Next Implementation Priorities
1. Import Kirilloid data as TypeScript constants
2. Implement village polling system (5-minute cycles)
3. Build page context capture for current view
4. Integrate collaborative AI questioning system
5. Connect Chrome extension to Vercel proxy endpoint

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
- **Anthropic API**: Via Vercel proxy (working)
- **API Key**: Stored in Vercel environment only
- **Chrome Extension**: No API keys stored
- **Vercel Endpoint**: Functional and ready for integration

### Repository Structure
```
/packages/extension/    - Chrome extension code
/api/anthropic.js      - Vercel Edge Function (proxy) - WORKING
/docs/                 - Documentation
  - TravianAssistantv4.md (current architecture specification)
  - KIRILLOID_INTEGRATION_PLAN.md (game formulas source)
  - SESSION_CONTEXT.md (this file)
```

## Project Version Clarification
- **Current Version**: V4 (not V3)
- **V3 Document**: Historical planning document, not current state
- **V4 Focus**: Collaborative AI with complete game visibility

## Removed/Outdated Information
- ❌ Removed V3 references (project is on V4)
- ❌ Removed Vercel blocker status (it's working)
- ❌ Removed "deployment issues" language for Vercel
- ❌ Removed cost optimization focus from V4 doc (not primary concern)
- ❌ Removed complex ML predictions (using Claude's reasoning instead)
- ❌ Removed Supabase/database discussion (using Chrome storage)
- ❌ Updated from generic advice to specific actionable intelligence

## Next Session Focus
Continue with implementation of V4 features:
1. Kirilloid data import
2. Village polling mechanism
3. Page context capture system
4. Chrome extension to Vercel proxy integration

## Open Questions
- Test village switching programmatically
- Confirm Chrome storage limits for multi-village data
- Determine optimal polling frequency vs performance