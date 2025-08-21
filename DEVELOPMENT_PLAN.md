# TravianAssistant Development Plan v2.0

## Current State (v0.3.1) ✅
- **Working**: Proxy-based Claude Sonnet 4 integration
- **Data Scope**: Single village, current page only
- **Analysis**: Basic resource/building recommendations
- **Architecture**: Chrome Extension → Vercel Proxy → Claude API

## Phase 1: Enhanced Data Collection (Priority: HIGH)
**Goal**: Collect comprehensive game state across entire account

### 1.1 Multi-Village Data Scraping
```typescript
// Enhance scraper to collect from all villages
interface AccountState {
  villages: Village[];
  currentVillageId: string;
  totalResources: Resources;
  totalProduction: Production;
  globalQueues: BuildQueue[];
  accountStats: {
    population: number;
    culture: number;
    rank: number;
  };
}
```

**Implementation**:
- Auto-navigate through village switcher
- Cache data from each village
- Aggregate account-wide metrics
- Store in IndexedDB for persistence

### 1.2 Page-Aware Scraping
- **Reports Page**: Battle reports, scout reports, trade reports
- **Statistics Page**: Rankings, alliance members, top players
- **Map Page**: Nearby players, oases, empty spots
- **Marketplace**: Trade routes, merchants available
- **Alliance Page**: Member list, attacks, defense calls

### 1.3 Historical Tracking
```typescript
interface HistoricalData {
  timestamp: Date;
  villages: VillageSnapshot[];
  events: GameEvent[];
  trends: {
    resourceGrowth: number[];
    populationGrowth: number[];
    militaryStrength: number[];
  };
}
```

## Phase 2: Intelligent Analysis (Priority: HIGH)

### 2.1 Context-Aware Recommendations
Instead of generic advice, provide specific actionable intelligence:

```typescript
interface SmartRecommendation {
  action: string;           // "Build Warehouse Level 15 in Village 'Capital'"
  urgency: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;        // "Complete within 2 hours"
  reason: string;           // "Will overflow in 3h 15m"
  impact: string;           // "Prevents 5,200 resource loss"
  prerequisites: string[];  // ["Upgrade Main Building to 10 first"]
  cost: Resources;
  duration: number;
}
```

### 2.2 Strategic Planning
- **Settling Advisor**: Best locations for new villages based on strategy
- **Military Calculator**: Optimal troop compositions for your tribe/style
- **Trade Optimizer**: NPC merchant ratios, trade route efficiency
- **Culture Point Planning**: Path to next village slot
- **Defense Coordinator**: Coordinate with alliance for incoming attacks

### 2.3 Pattern Recognition
```typescript
// Learn from player behavior
interface PlayerPatterns {
  activeHours: number[];        // When you typically play
  buildingPriorities: string[]; // What you tend to build
  commonMistakes: string[];      // Repeated issues to warn about
  preferredStrategies: string[]; // Offensive, defensive, economic
}
```

## Phase 3: Advanced Features (Priority: MEDIUM)

### 3.1 Automation Assistance
**NOT full automation** (against game rules), but smart helpers:
- Build queue optimizer with 1-click setup
- Trade route templates
- Troop training schedules
- Farm list management
- Resource balancing alerts

### 3.2 Alliance Coordination
```typescript
interface AllianceFeatures {
  sharedIntelligence: {
    enemyVillages: EnemyData[];
    farmTargets: FarmData[];
    defenseNeeds: DefenseRequest[];
  };
  operations: {
    plannedAttacks: Operation[];
    wonderSupport: WonderPlan;
  };
}
```

### 3.3 Real-time Alerts
- Push notifications for attacks (via Chrome notifications)
- Resource overflow warnings
- Building completion alerts
- Hero adventure notifications

## Phase 4: Architecture Improvements (Priority: MEDIUM)

### 4.1 Backend Service
Move beyond simple proxy to full backend:
```
Chrome Extension ↔ Backend API ↔ Database
                       ↓
                  Claude API
```

**Benefits**:
- Store historical data
- Share intelligence between alliance members
- Advanced analytics
- Scheduled analysis

### 4.2 Subscription Model
- **Free Tier**: 100 analyses/month
- **Pro**: 1000 analyses/month + historical data
- **Alliance**: Shared intelligence + coordination tools

## Phase 5: UI/UX Enhancements (Priority: LOW)

### 5.1 Better HUD
- Floating panels for different data types
- Customizable dashboard
- Mini-map overlay
- Resource timers
- Visual alerts

### 5.2 Settings & Profiles
- Multiple profile support
- Quick strategy switcher
- Alliance profile sharing
- Import/export configurations

## Implementation Timeline

### Week 1-2: Multi-Village Data
- [ ] Implement village switcher navigation
- [ ] Create data aggregation layer
- [ ] Add IndexedDB storage
- [ ] Test with multiple villages

### Week 3-4: Enhanced Intelligence
- [ ] Improve prompts with full account context
- [ ] Add specific recommendation types
- [ ] Implement urgency/priority system
- [ ] Create action tracking

### Month 2: Alliance Features
- [ ] Backend API development
- [ ] User authentication
- [ ] Alliance data sharing
- [ ] Coordination tools

### Month 3: Polish & Scale
- [ ] Performance optimization
- [ ] UI improvements
- [ ] Documentation
- [ ] Marketing to other players

## Technical Debt to Address

1. **Error Handling**: Better recovery from scraping failures
2. **Type Safety**: Full TypeScript types for all game entities
3. **Testing**: Unit tests for scrapers and analysis
4. **Configuration**: Environment-based settings
5. **Logging**: Better debugging and error tracking

## Next Immediate Steps

### 1. Fix Village Switching
```typescript
// Add to scraper
async function scrapeAllVillages() {
  const villages = await getVillageList();
  const allData = [];
  
  for (const village of villages) {
    await switchToVillage(village.id);
    await wait(1000); // Don't spam
    const data = await scrapeCurrentVillage();
    allData.push(data);
  }
  
  return aggregateData(allData);
}
```

### 2. Enhance Prompts with Account Context
```typescript
const prompt = `
Analyze this Travian account with ${gameState.villages.length} villages:
- Total production: ${gameState.totalProduction}
- Population: ${gameState.population}
- Current focus: ${gameState.currentVillage}

Provide strategic recommendations considering the ENTIRE account...
`;
```

### 3. Add Historical Tracking
```typescript
// Store snapshots every hour
setInterval(() => {
  const snapshot = await scrapeAllVillages();
  await storeSnapshot(snapshot);
  await analyzeGrowthTrends();
}, 3600000);
```

## Success Metrics

- **Data Coverage**: From 10% → 90% of game state
- **Recommendation Quality**: Generic → Specific actionable items
- **User Engagement**: Daily active users
- **Strategic Impact**: Measurable rank improvements
- **Alliance Adoption**: Teams using coordination features

## Current Limitations to Fix

### Data Collection Issues
1. **Single Village Only**: Can't see multi-village empire
2. **No Historical Context**: Doesn't track growth over time
3. **Limited Page Awareness**: Only scrapes current page type
4. **No Report Analysis**: Misses battle/scout reports

### Intelligence Gaps
1. **Generic Recommendations**: "Build warehouses" vs "Build Warehouse L12 in Capital, completes in 47min"
2. **No Urgency Assessment**: Doesn't prioritize by time sensitivity
3. **Missing Context**: Doesn't know your overall strategy
4. **No Learning**: Doesn't adapt to your play style

### User Experience Issues
1. **Manual Trigger Only**: Must click button for analysis
2. **No Persistence**: Loses data on page refresh
3. **Limited Configuration**: Can't adjust recommendation style
4. **No Mobile Support**: Desktop Chrome only

## Architecture Decisions

### Why Vercel Proxy?
- **Pros**: Free, easy deployment, no CORS issues
- **Cons**: No data persistence, limited to simple proxying
- **Future**: Migrate to full backend with database

### Why Chrome Extension?
- **Pros**: Direct DOM access, no game API needed
- **Cons**: Limited to Chrome, manual installation
- **Future**: Consider userscript for broader browser support

### Why Claude Sonnet 4?
- **Pros**: Excellent reasoning, understands game mechanics
- **Cons**: Cost per API call, no fine-tuning possible
- **Future**: Consider hybrid approach with cheaper models for simple tasks

## Development Resources

### Repositories
- **Main**: https://github.com/DougProceptra/TravianAssistant
- **Proxy**: https://travian-proxy-simple.vercel.app

### Technologies
- **Extension**: TypeScript, Vite, Chrome Manifest V3
- **Proxy**: Vercel Edge Functions
- **AI**: Claude Sonnet 4 via Anthropic API

### Documentation
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/mv3/)
- [Travian Game Mechanics](https://wiki.travian.com)
- [Anthropic API](https://docs.anthropic.com)

## Contributing

### For Developers
1. Fork the repository
2. Create feature branch
3. Implement with tests
4. Submit pull request

### For Players
1. Report bugs via GitHub issues
2. Suggest features in discussions
3. Share with alliance members
4. Provide feedback on recommendations

## Version History

### v0.3.1 (Current)
- Claude Sonnet 4 integration
- Proxy-based architecture
- Basic recommendations

### v0.2.x
- Direct API calls (blocked by CORS)
- Manual API key configuration
- Basic HUD implementation

### v0.1.x
- Initial proof of concept
- Basic scraping functionality
- Static analysis only

## Future Vision

Transform TravianAssistant from a simple village advisor into a comprehensive strategic command center that:
- Understands your entire account
- Learns from your play style
- Coordinates with alliance members
- Provides predictive analytics
- Automates routine decisions
- Helps win servers

The goal is not to play the game for you, but to amplify your strategic thinking with AI-powered intelligence.

---

*Last Updated: August 2025*
*Maintainer: DougProceptra*