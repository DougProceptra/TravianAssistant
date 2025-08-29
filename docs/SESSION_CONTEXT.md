# TravianAssistant Session Context
*Last Updated: August 29, 2025, 10:07 AM EST*

## Current Project State - V4 Architecture

### Active Work: Kirilloid Data Integration
Implementing complete game data extraction from Kirilloid repository for 100% calculation parity. Using hybrid structure approach (Option 3) with logical groupings.

### Progress This Session

#### ✅ Completed
1. **Architecture Decision**: Hybrid structure with 4 main files
   - `static-data.ts` - Buildings, troops, items
   - `formulas.ts` - All calculations
   - `server-config.ts` - Speed variants, special rules
   - `constants.ts` - Game constants, limits

2. **Created Foundation Files**:
   - `/packages/extension/src/game-data/index.ts` - Main aggregator with GameData interface
   - `/packages/extension/src/game-data/types.ts` - Complete TypeScript type definitions
   - Scripts for extracting from Kirilloid repo

3. **Extraction Scripts**:
   - `scripts/extract-kirilloid-data.js` - Node script to pull from Kirilloid
   - `scripts/analyze-kirilloid-structure.sh` - Bash script to analyze repo

#### 🔄 In Progress
- Extracting actual data from Kirilloid repository
- Need to run extraction scripts and populate the data files

#### 📋 Next Steps
1. Run extraction script to pull Kirilloid data
2. Create `static-data.ts` with all buildings/troops/items
3. Create `formulas.ts` with all game calculations
4. Create `server-config.ts` with server variations
5. Create `constants.ts` with game limits and constants
6. Test complete data availability for AI

### Key Architectural Decisions Made

#### Data Source Strategy
- **Decision**: Pull directly from Kirilloid GitHub repo
- **Rationale**: More accurate than recreating, already TypeScript
- **Implementation**: Clone repo, extract, transform to our structure

#### Structure Pattern (Hybrid)
- **Decision**: 4 logical files instead of many small or one huge
- **Benefits**: Balance of organization and simplicity
- **Files**: static-data, formulas, server-config, constants

#### Type System
- **Complete interfaces** for all game elements
- **Strong typing** for AI consumption
- **Reusable types** across the extension

## Technical Status

### Working Components
✅ Chrome Extension base structure (Manifest V3)
✅ Content script for page scraping
✅ HUD overlay system
✅ Background service worker
✅ Vercel proxy for Anthropic API calls
✅ Type definitions for game data
✅ Main game data interface structure

### Files Created This Session
- `/packages/extension/src/game-data/index.ts`
- `/packages/extension/src/game-data/types.ts`
- `/scripts/extract-kirilloid-data.js`
- `/scripts/analyze-kirilloid-structure.sh`
- `/scripts/extract-kirilloid.ts`

### Next Implementation Priorities
1. **Complete Kirilloid extraction** - Run scripts and populate data
2. **Implement static-data.ts** - All buildings, troops, items
3. **Implement formulas.ts** - All calculations
4. **Test with AI** - Ensure Claude can use the data
5. **Village polling system** - 5-minute update cycles

## Key Design Principles

### Data Philosophy
- **100% Kirilloid parity** - Every calculation must match
- **TypeScript native** - Strong typing for reliability
- **In-memory** - No external dependencies
- **AI-optimized** - Structure for easy Claude consumption
- **Raw over processed**: Capture everything, let AI reason
- **Complete visibility**: See all villages, not just current
- **Context aware**: AI knows what page you're looking at
- **Collaborative**: AI asks for missing data rather than guessing

### Implementation Rules
- **ALL CODE IN GITHUB** - Never dump code in session
- **Commit frequently** - Small, logical commits
- **Test extraction first** - Verify data before transforming

## Critical Information

### Kirilloid Repository
- **URL**: https://github.com/kirilloid/travian
- **Best Version**: t4.6 (Travian Legends compatible)
- **Structure**: `/src/model/` contains game data
- **Language**: TypeScript/JavaScript

### Our Structure
```
/packages/extension/src/game-data/
├── index.ts          ✅ Created - Main interface
├── types.ts          ✅ Created - All type definitions
├── static-data.ts    ⏳ Pending - Buildings, troops, items
├── formulas.ts       ⏳ Pending - All calculations
├── server-config.ts  ⏳ Pending - Server variations
└── constants.ts      ⏳ Pending - Game constants
```

### API Configuration
- **Anthropic API**: Via Vercel proxy (working)
- **API Key**: Stored in Vercel environment only
- **Chrome Extension**: No API keys stored
- **Vercel Endpoint**: Functional and ready for integration

## Session Health
- **Memory Usage**: ~30% (healthy)
- **Context Clarity**: High
- **Next Action**: Clear - run extraction script

## Next Session Focus
1. Execute extraction script: `node scripts/extract-kirilloid-data.js`
2. Transform extracted data to our TypeScript structure
3. Implement remaining data files
4. Create test to verify 100% Kirilloid parity