# Travian Assistant V3: Complete Implementation Roadmap
*Last Updated: August 22, 2025*
*Target Beta: August 29, 2025*
*Target Production: September 9, 2025*

## Mission Statement
Transform Travian gameplay from tedious spreadsheet calculations to AI-powered strategic excellence, enabling top-20 competitive play in under 2 hours per day.

## Critical Success Metrics

### Phase 1: Game Start (Weeks 1-10)
- **Primary KPI**: Achieve top-5 settler on server (measured by settlement time)
- **Secondary KPIs**: 
  - Time to second village: <168 hours (7 days)
  - Resource efficiency: 95%+ utilization
  - Quest completion: 100% optimal path

### Phase 2: Growth (Weeks 10-60)
- **Population**: Top-20 ranking
- **Resource Production**: >50k/hour by week 30
- **Villages**: 10+ by week 40
- **Troop Strength**: Sufficient for artifact capture

### Phase 3: Artifacts (Weeks 60-120)
- **Capability**: Army size for small/large artifact
- **Timing**: Ready 2 hours before release

### Phase 4: WW (Weeks 120+)
- **Resource Production**: >200k/hour
- **Troop Count**: >100k defense or offense

## Technical Architecture

### System Overview
```
Chrome Extension → Replit Backend → SQLite/Supabase
       ↓                ↓                  ↓
   Data Scraper    AI Processing    Data Storage
       ↓                ↓                  ↓
     HUD UI      Claude Integration   Analytics
```

### Technology Stack
- **Frontend**: Chrome Extension (Manifest V3)
- **Backend**: Node.js on Replit
- **Database**: SQLite (dev) → Supabase (production)
- **AI**: Claude Sonnet 4 via Anthropic API
- **Context**: context_intelligence integration
- **Version Control**: GitHub → Replit pull

## Implementation Phases

### Week 1: Foundation (Aug 22-29) - BETA RELEASE

#### Day 1-2: Core Infrastructure
```bash
# Replit Setup Script
#!/bin/bash
npm init -y
npm install better-sqlite3 express cors dotenv
npm install @anthropic-ai/sdk
npm install --save-dev @types/node @types/express

# Initialize database
node scripts/init-db.js

# Test with sample map.sql
curl https://lusobr.x2.lusobrasileiro.travian.com/map.sql -o data/map.sql
sqlite3 travian.db < data/map.sql
```

#### Day 3-4: Chrome Extension Base
```typescript
// manifest.json
{
  "manifest_version": 3,
  "name": "Travian Assistant V3",
  "version": "3.0.0",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "*://*.travian.com/*"
  ],
  "content_scripts": [{
    "matches": ["*://*.travian.com/*"],
    "js": ["content.js"],
    "css": ["hud.css"]
  }],
  "background": {
    "service_worker": "background.js"
  }
}
```

#### Day 5-6: Game Start Optimizer
```typescript
interface GameStartOptimizer {
  analyzeCurrentState(): GameState;
  calculateOptimalPath(): ActionSequence;
  generateBuildOrder(): BuildOrder[];
  predictSettlementTime(): Date;
}

class OpeningSequence {
  // Egyptians-specific optimization
  readonly OPTIMAL_FIELD_ORDER = [
    { resource: 'crop', level: 2 },
    { resource: 'wood', level: 1 },
    { resource: 'clay', level: 1 },
    { resource: 'iron', level: 1 },
    // ... complete 72-hour sequence
  ];
  
  async optimizeForSpeed(): Promise<Strategy> {
    // Gold usage optimization
    // Quest path optimization
    // Resource balance calculations
    // CP accumulation strategy
  }
}
```

#### Day 7: Beta Testing & Feedback
- Deploy to team members
- Collect feedback
- Fix critical bugs

### Week 2: AI Integration & Polish (Aug 29 - Sept 5)

#### Day 8-9: Claude Integration
```typescript
class TravianAI {
  private claude: Anthropic;
  private context: ContextIntelligence;
  
  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    // Integrate context_intelligence
    this.context = new ContextIntelligence({
      store: 'travian_patterns',
      learn: true
    });
  }
  
  async analyzeGameState(state: GameState): Promise<Recommendations> {
    // Build comprehensive prompt
    const prompt = this.buildPrompt(state);
    
    // Get Claude's analysis
    const response = await this.claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    // Store patterns for learning
    await this.context.store(response);
    
    return this.parseRecommendations(response);
  }
}
```

#### Day 10-11: HUD Implementation
```typescript
class TravianHUD {
  private position: Position = { x: 10, y: 10 };
  private visible: boolean = true;
  private expanded: boolean = false;
  
  render() {
    return `
      <div id="travian-assistant-hud" 
           style="position: fixed; 
                  top: ${this.position.y}px; 
                  left: ${this.position.x}px;
                  z-index: 10000;">
        <div class="ta-header" draggable="true">
          <span>Travian Assistant</span>
          <button onclick="toggleHUD()">_</button>
        </div>
        <div class="ta-content">
          ${this.renderRecommendations()}
          ${this.renderTimers()}
          ${this.renderAlerts()}
        </div>
        <div class="ta-chat-trigger">
          <button onclick="openChat()">💬 Ask AI</button>
        </div>
      </div>
    `;
  }
}
```

#### Day 12-13: Data Collection Pipeline
```typescript
class DataCollector {
  private scrapeInterval: number = 60000; // 1 minute
  
  async collectVillageData(): Promise<VillageData[]> {
    const villages = [];
    
    // Scrape current page
    const currentVillage = this.scrapeCurrentVillage();
    villages.push(currentVillage);
    
    // Get overview data
    if (this.isOnOverviewPage()) {
      const allVillages = this.scrapeOverview();
      villages.push(...allVillages);
    }
    
    return villages;
  }
  
  async interceptAjax() {
    // Intercept all game AJAX calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      this.processResponse(response.clone());
      return response;
    };
  }
}
```

#### Day 14: Production Release Prep
- Final testing
- Performance optimization
- Documentation

### Week 3+: Continuous Improvement (Sept 5+)

#### Priority Features Queue
1. **Multi-village Coordination**
2. **Farm List Optimizer**
3. **Combat Simulator**
4. **Trade Route Automation**
5. **Alliance Coordination Tools**

## Data Schema (Final)

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
  data JSON, -- Flexible for all village data
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

-- Analytics
CREATE TABLE performance_metrics (
  date DATE PRIMARY KEY,
  population_rank INTEGER,
  resource_production INTEGER,
  time_played_minutes INTEGER,
  actions_automated INTEGER
);
```

## Game Start Optimization Algorithm

```typescript
class GameStartMasterPlan {
  private readonly PHASES = {
    INITIAL: { // Hours 0-24
      focus: 'Resource fields to level 1-2',
      quests: 'Complete all resource quests',
      gold: 'Save for day 2 NPC'
    },
    ACCELERATION: { // Hours 24-72
      focus: 'Push one resource type to level 5',
      quests: 'Complete adventure quests',
      gold: 'NPC for balanced growth'
    },
    CP_RUSH: { // Hours 72-144
      focus: 'Build CP buildings',
      quests: 'Complete building quests',
      gold: 'Instant complete CP buildings'
    },
    SETTLEMENT: { // Hours 144-168
      focus: 'Train settlers',
      quests: 'Complete military quests',
      gold: 'Instant finish settlers if needed'
    }
  };
  
  async getCurrentPhase(): Promise<Phase> {
    const serverAge = await this.getServerAge();
    const hoursSinceStart = serverAge.hours;
    
    if (hoursSinceStart < 24) return this.PHASES.INITIAL;
    if (hoursSinceStart < 72) return this.PHASES.ACCELERATION;
    if (hoursSinceStart < 144) return this.PHASES.CP_RUSH;
    return this.PHASES.SETTLEMENT;
  }
  
  async getNextActions(state: GameState): Promise<Action[]> {
    const phase = await this.getCurrentPhase();
    const actions: Action[] = [];
    
    // Check building queue
    if (state.buildingQueue.length === 0) {
      actions.push(this.calculateNextBuilding(state, phase));
    }
    
    // Check troops
    if (state.troopQueue.length === 0 && phase === this.PHASES.SETTLEMENT) {
      actions.push({ type: 'TRAIN_SETTLERS', priority: 1 });
    }
    
    // Check resources for NPC
    if (this.shouldNPC(state)) {
      actions.push({ type: 'NPC_TRADE', priority: 2 });
    }
    
    return actions.sort((a, b) => a.priority - b.priority);
  }
}
```

## Deployment Process

### Development (Replit)
```bash
# Pull latest from GitHub
git pull origin main

# Install dependencies
npm install

# Run development server
npm run dev

# Test with local SQLite
sqlite3 travian.db
```

### Production (Team Use)
```bash
# Setup Supabase tables
npm run migrate:supabase

# Deploy Chrome extension
npm run build:extension

# Start production server
npm run start:prod
```

## Risk Mitigation

### ToS Compliance
- ✅ No automation of game actions
- ✅ No direct server manipulation
- ✅ Only data collection and analysis
- ⚠️ Gray area: Systematic map scanning (discuss case-by-case)

### Technical Risks
- **HTML changes**: Use flexible selectors, fallback to manual
- **Rate limiting**: Implement exponential backoff
- **Data loss**: Regular backups to Supabase

## Communication & Collaboration

### Team Workflow
1. **Daily Updates**: Push to GitHub
2. **Testing**: Replit preview links
3. **Feedback**: GitHub issues
4. **Deployment**: Automated via Replit

### AI Configuration
```typescript
interface AIConfig {
  platform: 'anthropic' | 'openai';
  model: 'claude-3-sonnet' | 'gpt-4';
  temperature: 0.7;
  systemPrompt: string;
  contextWindow: 100000;
  
  // Custom instructions per game phase
  phasePrompts: {
    start: string;
    growth: string;
    artifacts: string;
    ww: string;
  };
}
```

## Success Validation

### Week 1 Checkpoints
- [ ] Chrome extension installed and collecting data
- [ ] HUD visible with basic recommendations
- [ ] Game start sequence optimized
- [ ] Beta feedback incorporated

### Week 2 Checkpoints
- [ ] AI providing actionable recommendations
- [ ] <5 minute setup for new team member
- [ ] Top-10 settler achieved in testing
- [ ] Performance <100ms response time

### September 9 Launch Criteria
- [ ] Top-5 settler capability proven
- [ ] Reduces gameplay to <2 hours/day
- [ ] Zero critical bugs
- [ ] Team trained and ready

## Next Session Actions

1. **Setup Replit** with initial database
2. **Create Chrome extension** skeleton
3. **Implement map.sql** importer
4. **Build game start** optimizer
5. **Test with your** current game data

---

*This document is our contract. Every feature, every decision, every line of code should align with these specifications.*

*Ready to build? Let's start with Session 1: Foundation Setup*