# TravianAssistant Development Guide
*Last Updated: August 29, 2025*

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Game Data Management](#game-data-management)
4. [Development Workflow](#development-workflow)
5. [Key Design Decisions](#key-design-decisions)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)

## Project Overview

TravianAssistant is a Chrome extension that provides AI-powered strategic advice for Travian Legends players. It combines:
- **Complete game mechanics** from Kirilloid (100% calculation parity)
- **Real-time game state** from browser scraping
- **AI intelligence** via Claude (through Vercel proxy)
- **Learning patterns** via context_intelligence

### Core Goal
Enable top-20 competitive play in under 2 hours per day through intelligent automation and recommendations.

## Architecture

### System Components

```
┌─────────────────┐
│ Chrome Extension│
│   (Manifest V3) │
├─────────────────┤
│ - Content Script│ ← Scrapes game pages
│ - Service Worker│ ← Background processing
│ - HUD Overlay   │ ← Shows recommendations
└────────┬────────┘
         │
         ↓ API calls
┌─────────────────┐
│  Vercel Proxy   │ ← Handles CORS
│ /api/anthropic  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Claude API     │ ← AI reasoning
│  (Anthropic)    │
└─────────────────┘
```

### Data Architecture (3 Layers)

1. **Static Game Rules** - Complete Kirilloid formulas
2. **Live Game State** - Real-time browser scraping
3. **Learned Patterns** - context_intelligence storage

## Game Data Management

### Data Source: Kirilloid Repository

We pull all game mechanics from [Kirilloid's Travian repository](https://github.com/kirilloid/travian) to ensure 100% accuracy with their calculators.

### Data Structure (Hybrid Approach)

```
/packages/extension/src/game-data/
├── index.ts          # Main GameData interface
├── types.ts          # TypeScript type definitions
├── static-data.ts    # Buildings, troops, items
├── formulas.ts       # All game calculations
├── server-config.ts  # Server speed variants
└── constants.ts      # Game limits and constants
```

### Why This Structure?

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Many small files | Clean separation | Complex imports | ❌ |
| Single huge file | Simple imports | 10,000+ lines | ❌ |
| **Hybrid (4 files)** | **Balanced, logical** | **Some arbitrary grouping** | **✅ Chosen** |

### Updating Game Data

#### Automatic Process
```bash
./scripts/update-game-data.sh
```

This single command:
1. Pulls latest from Kirilloid
2. Extracts and transforms data
3. Validates with tests
4. Generates update report

#### Update Frequency
- **Travian updates**: 2-3 major/year, monthly balance
- **Kirilloid updates**: Within days of Travian
- **Our updates**: Run script when needed (monthly recommended)

#### What Gets Updated
- Building costs/times
- Troop stats (attack, defense, speed)
- New features (buildings, troops, items)
- Formula changes (combat, production)
- Server variations

See [UPDATING_GAME_DATA.md](./UPDATING_GAME_DATA.md) for detailed instructions.

## Development Workflow

### Prerequisites
- Node.js 18+
- Chrome browser
- Git
- Replit account (optional, for cloud development)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/DougProceptra/TravianAssistant.git
cd TravianAssistant

# Install dependencies
npm install

# Clone Kirilloid data
git clone https://github.com/kirilloid/travian.git kirilloid-travian

# Extract game data
node scripts/extract-kirilloid-data.js

# Build extension
npm run build:extension
```

### Development Commands

```bash
# Extract Kirilloid data
npm run extract:game-data

# Update from Kirilloid
npm run update:game-data

# Build extension
npm run build:extension

# Run tests
npm run test

# Validate Kirilloid parity
npm run validate:kirilloid-parity
```

### Loading Extension in Chrome

1. Open Chrome → Extensions → Manage Extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `/packages/extension/dist` folder
5. Pin extension to toolbar

## Key Design Decisions

### 1. Kirilloid Integration
**Decision**: Pull directly from Kirilloid GitHub rather than recreate  
**Rationale**: 
- 100% accuracy guaranteed
- Zero maintenance of game mechanics
- Automatic updates when game changes
- Already in TypeScript

### 2. No Direct API Calls from Extension
**Decision**: Use Vercel proxy for Anthropic API  
**Rationale**: 
- Chrome Manifest V3 blocks direct external API calls (CORS)
- Keeps API key secure (server-side only)
- Enables request logging/monitoring

### 3. Hybrid Data Structure
**Decision**: 4 logical files instead of many small or one huge  
**Rationale**:
- Balance between organization and simplicity
- Reasonable file sizes (1000-3000 lines)
- Clear purpose for each file
- Manageable git diffs

### 4. Raw Data Capture
**Decision**: Store raw HTML, let AI reason  
**Rationale**:
- AI can adapt to game UI changes
- No need to update parsers for minor changes
- More flexible analysis possible

### 5. Context Intelligence Integration
**Decision**: Store learned patterns separately from game state  
**Rationale**:
- Patterns persist across sessions
- Can learn user preferences
- Improves over time

## Testing Strategy

### Unit Tests
```typescript
// Test game calculations match Kirilloid
describe('Game Formulas', () => {
  test('building cost calculation', () => {
    const cost = GameData.getBuildingCost(1, 10);
    expect(cost).toEqual({ wood: 1060, clay: 1430, iron: 1060, crop: 370 });
  });
});
```

### Integration Tests
- Verify extension loads in Chrome
- Test data extraction from game pages
- Validate API communication through proxy

### Kirilloid Parity Tests
```bash
npm run validate:kirilloid-parity
```
Compares our calculations against Kirilloid's for key scenarios.

## Deployment

### Extension Distribution

#### Development (Team Testing)
1. Build: `npm run build:extension`
2. Share `/packages/extension/dist` folder
3. Team loads as unpacked extension

#### Production (Chrome Web Store)
1. Build production: `npm run build:prod`
2. Create ZIP: `npm run package:extension`
3. Upload to Chrome Web Store
4. Submit for review

### Vercel Proxy Deployment

The Vercel proxy is already deployed and working:
- Endpoint: `https://travian-assistant.vercel.app/api/anthropic`
- Auto-deploys from main branch
- Environment variable: `ANTHROPIC_API_KEY` (set in Vercel dashboard)

## Code Standards

### TypeScript
- Strict mode enabled
- All game data strongly typed
- Interfaces for all data structures

### File Organization
```typescript
// ✅ Good: Clear, logical grouping
/game-data/
  ├── static-data.ts    // All static game elements
  ├── formulas.ts       // All calculations
  
// ❌ Bad: Too granular
/game-data/
  ├── buildings/
  │   ├── resource-fields/
  │   │   ├── woodcutter.ts
  │   │   ├── clay-pit.ts
```

### Git Commits
- **Frequent commits** with clear messages
- **Never dump code in chat** - always commit to GitHub
- **Logical chunks** - one feature per commit

### Comments
```typescript
// Document WHY, not WHAT
// ❌ Bad: Increment level by 1
level++;

// ✅ Good: Account for 0-indexed array vs 1-indexed game levels
level++;
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Extension not loading | Check manifest.json syntax |
| API calls failing | Verify Vercel proxy is running |
| Game data incorrect | Run update script from Kirilloid |
| TypeScript errors | Run `npm run type-check` |

### Debug Mode

Enable verbose logging:
```typescript
// In background.ts
const DEBUG = true;
```

Check logs:
- Extension: Chrome DevTools → Extensions → Service Worker
- Content Script: Chrome DevTools → Console (on game page)

## Resources

### Documentation
- [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) - Current development state
- [UPDATING_GAME_DATA.md](./UPDATING_GAME_DATA.md) - Data update process
- [TravianAssistantv4.md](./TravianAssistantv4.md) - Architecture specification

### External
- [Kirilloid Calculator](http://travian.kirilloid.ru) - Reference implementation
- [Travian Legends](https://www.travian.com) - The game
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)

## Version History

- **V4** (Current) - Collaborative AI with complete game visibility
- **V3** - Initial planning document (deprecated)
- **V2** - Proof of concept (not implemented)
- **V1** - Original vision (not implemented)