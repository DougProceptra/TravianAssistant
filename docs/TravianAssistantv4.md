# TravianAssistant V4: Stockfish for Travian
## Complete Technical Specification & Implementation Guide

### Executive vision statement

TravianAssistant V4 represents a paradigm shift from basic game assistance to grandmaster-level AI advisory - delivering specific, actionable intelligence like "Send 1,500 iron/hour from Village 1 to Village 2 for optimal smithy construction" rather than generic advice. The AI agent sees exactly what you see, asks clarifying questions when needed, and provides contextual recommendations based on comprehensive game rules and live state data.

## Core system architecture

The V4 architecture prioritizes complete game state visibility and intelligent collaboration between the player and AI. Built with Chrome extension for data capture, Vercel proxy for API communication, and Claude AI for strategic reasoning, the system provides real-time contextual assistance.

### Technical foundation

**Primary Stack:**
- **Frontend**: Chrome Extension (Manifest V3) with comprehensive page scraping
- **Proxy**: Vercel Edge Functions for Anthropic API access
- **AI Engine**: Claude Sonnet 4 with game rules knowledge base
- **State Storage**: Chrome Extension Storage API (primary) + in-memory cache
- **Game Rules**: Complete Kirilloid formulas and Travian documentation
- **Learning**: context_intelligence for pattern recognition

**Data Architecture Principles:**
- Raw data capture over pre-structured analysis
- Complete page context preservation  
- Multi-village state synchronization
- Progressive knowledge building

## Comprehensive data collection

### Multi-layered data architecture

The system maintains three distinct data layers that combine to provide complete game understanding:

```typescript
// Layer 1: STATIC GAME RULES (from Kirilloid & documentation)
interface GameRules {
  buildings: {
    costs: BuildingCost[];      // Level 1-20 for each building
    prerequisites: Prerequisite[];
    culturePoints: CPGeneration[];
    buildTime: TimeFormula[];
  };
  
  troops: {
    stats: TroopStats[];         // Attack, defense, speed
    costs: TrainingCost[];
    upkeep: number[];
    carryCapacity: number[];
  };
  
  formulas: {
    combatCalculation: CombatFormula;
    travelTime: DistanceFormula;
    production: ProductionFormula;
    merchantCapacity: MerchantFormula;
  };
  
  serverConfig: {
    speed: number;               // 1x, 2x, 3x, etc.
    tribe: TribeType;
    specialRules: string[];      // Artifacts, regions, etc.
  };
}

// Layer 2: LIVE GAME STATE (from scraping)
interface LiveGameState {
  timestamp: number;
  villages: Map<villageId, VillageSnapshot>;
  currentPageContext: PageContext;  // What the player is looking at RIGHT NOW
  movements: TroopMovement[];
  queues: BuildingQueue[];
  reports: Report[];
}

// Layer 3: LEARNED PATTERNS (from context_intelligence)
interface LearnedPatterns {
  playerBehavior: BehaviorPattern[];
  serverMeta: ServerTrend[];
  enemyPatterns: EnemyBehavior[];
  allianceIntel: AllianceData[];
}
```

### Village state synchronization

The system automatically polls all villages to maintain fresh empire-wide state:

```typescript
class VillagePoller {
  private pollInterval: number = 5 * 60 * 1000; // 5 minutes
  
  async pollAllVillages() {
    // Navigate to overview page
    await this.navigateTo('/dorf3.php');
    const villages = await this.scrapeVillageList();
    
    // Cycle through each village
    for (const village of villages) {
      await this.switchToVillage(village.id);
      
      // Capture comprehensive state
      const snapshot = {
        resources: this.scrapeResources(),
        production: this.scrapeProduction(),
        buildings: this.scrapeBuildings(),
        troops: this.scrapeTroops(),
        queues: this.scrapeQueues(),
        merchants: this.scrapeMerchants(),
        rawHTML: document.body.innerHTML, // Keep for future parsing
        timestamp: Date.now()
      };
      
      await this.storeSnapshot(village.id, snapshot);
      await this.delay(2000); // Respect server limits
    }
  }
}
```

### Real-time page context capture

The AI sees exactly what the player sees on the current page:

```typescript
class PageContextCapture {
  async captureCurrentView() {
    return {
      pageType: this.identifyPage(), // 'village', 'reports', 'rally_point', etc.
      pageURL: window.location.href,
      
      visibleData: {
        // Universal elements
        resourceBar: this.scrapeResourceBar(),
        villageInfo: this.scrapeCurrentVillage(),
        serverTime: this.scrapeServerTime(),
        
        // Page-specific content
        pageContent: this.scrapePageSpecific(),
        
        // Raw HTML for AI to parse if needed
        rawHTML: document.querySelector('#content').innerHTML
      },
      
      userContext: {
        recentActions: this.getRecentActions(),
        currentGoals: this.getCurrentGoals()
      }
    };
  }
}
```

## Intelligent resource management

### Resource flow optimization engine

The system provides precise resource distribution recommendations based on complete empire state:

```typescript
class ResourceFlowOptimizer {
  async analyzeResourceFlow(gameState: LiveGameState): Promise<ResourceAnalysis> {
    // Send complete state to Claude for analysis
    const analysis = await this.claude.analyze({
      villages: gameState.villages,
      gameRules: this.gameRules,
      question: "Optimize resource distribution for next 6 hours"
    });
    
    return {
      recommendations: [
        {
          action: "Send 1,500 iron/hour from Village 1 to Village 2",
          reason: "Village 2 needs 4,750 iron for Smithy level 6 in 3.5 hours",
          priority: "HIGH",
          timing: "Start transfer at 14:32 for arrival before queue completion"
        }
      ],
      warnings: [
        "Village 1 warehouse will overflow in 2.3 hours without intervention",
        "Village 3 has excess crop - consider NPC conversion"
      ],
      projections: {
        resourceStates: this.projectResources(6), // 6 hour projection
        bottlenecks: this.identifyBottlenecks()
      }
    };
  }
}
```

### Dynamic village switching detection

The system detects village changes regardless of how they occur:

```typescript
class VillageContextManager {
  detectVillageSwitch() {
    // Monitor ALL ways villages can change
    const indicators = {
      urlParam: new URLSearchParams(window.location.search).get('newdid'),
      activeElement: document.querySelector('.villageList .active'),
      headerName: document.querySelector('#villageNameField')?.textContent,
      coordinates: this.extractCurrentCoordinates()
    };
    
    if (this.hasVillageChanged(indicators)) {
      this.captureAndStoreState();
      this.updateCurrentVillage(indicators);
    }
  }
  
  initialize() {
    // Check on page load
    this.detectVillageSwitch();
    
    // Monitor for dynamic changes
    const observer = new MutationObserver(() => this.detectVillageSwitch());
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
```

## Collaborative AI intelligence

### Context-aware questioning system

The AI recognizes knowledge gaps and asks targeted questions to provide better recommendations:

```typescript
class CollaborativeAI {
  async analyzeWithClarification(question: string, pageContext: PageContext) {
    // Identify what we know
    const knownData = this.assessAvailableData(pageContext);
    
    // Identify what we need for a complete answer
    const requiredData = this.determineRequiredData(question);
    
    // Find gaps
    const missingData = this.identifyGaps(knownData, requiredData);
    
    if (missingData.length > 0) {
      return this.generateClarifyingResponse(missingData, knownData, question);
    }
    
    return this.generateCompleteAnswer(knownData, question);
  }
  
  generateClarifyingResponse(missing: string[], known: any, question: string) {
    return {
      partialAnswer: "Based on what I can see...",
      clarifications: [
        "Can you check your recent scout reports for this player?",
        "Click on the Rally Point to show me your troops",
        "Do any alliance members have intel on this target?",
        "What's your primary goal - defense or counter-attack?"
      ],
      confidence: "medium",
      assumptions: ["Assuming standard troop compositions..."]
    };
  }
}
```

### Page-specific intelligence

The AI provides different insights based on what page the player is viewing:

```typescript
class ContextualIntelligence {
  async analyzeCurrentPage() {
    const pageType = this.identifyPageType();
    
    switch(pageType) {
      case 'incoming_attack':
        return this.analyzeIncomingAttack();
        
      case 'village_view':
        return this.suggestNextBuilding();
        
      case 'scout_report':
        return this.evaluateTarget();
        
      case 'marketplace':
        return this.optimizeTrades();
        
      case 'rally_point':
        return this.planMilitary();
    }
  }
  
  async analyzeIncomingAttack() {
    const attackData = this.scrapeAttackDetails();
    
    // Ask Claude with full context
    return await this.claude.analyze({
      attack: attackData,
      gameRules: this.combatFormulas,
      villageState: this.getCurrentVillageState(),
      question: "How dangerous is this attack? What should I do?"
    });
  }
}
```

### Progressive learning system

The system learns from every interaction and improves over time:

```typescript
class AdaptiveLearning {
  private knowledgeGaps: Map<string, number> = new Map();
  
  async learnFromInteraction(question: string, response: any, outcome: any) {
    // Track what data we frequently need
    if (response.missingData) {
      response.missingData.forEach(gap => {
        const count = this.knowledgeGaps.get(gap) || 0;
        this.knowledgeGaps.set(gap, count + 1);
      });
    }
    
    // Store patterns in context_intelligence
    await this.contextTool.store({
      type: 'interaction_pattern',
      question: question,
      successful: outcome.helpful,
      context: this.getCurrentContext()
    });
    
    // Suggest systematic improvements
    if (this.knowledgeGaps.get('alliance_intel') > 5) {
      this.suggestImprovement(
        "I frequently need alliance intel. Consider setting up a shared spreadsheet for enemy troop counts."
      );
    }
  }
}
```

## Smart HUD with contextual actions

### Intelligent overlay system

The HUD provides context-sensitive quick actions and can be triggered by game events:

```typescript
class SmartHUD {
  render() {
    const pageContext = this.getPageContext();
    
    return `
      <div id="travian-assistant-hud" style="position: fixed; z-index: 10000;">
        <!-- Floating AI button -->
        <button id="ai-context-btn" class="ai-floating-btn">
          🤖 Ask about this page
        </button>
        
        <!-- Context-sensitive quick actions -->
        <div id="ai-quick-actions">
          ${this.renderQuickActions(pageContext)}
        </div>
        
        <!-- Smart alerts -->
        <div id="ai-alerts">
          ${this.renderAlerts()}
        </div>
        
        <!-- Expandable chat -->
        <div id="ai-chat" class="hidden">
          <div class="chat-header">
            AI Assistant - ${pageContext.pageType}
          </div>
          <div class="chat-messages"></div>
          <input type="text" placeholder="Ask about what you're seeing..." />
        </div>
      </div>
    `;
  }
  
  renderQuickActions(context: PageContext) {
    const actions = {
      'incoming_attack': ['Analyze threat', 'Defense options', 'Request reinforcements'],
      'village_view': ['Optimize builds', 'Resource balance', 'Next priority'],
      'reports': ['Find targets', 'Analyze losses', 'Pattern detection'],
      'marketplace': ['Trade routes', 'NPC timing', 'Resource flow']
    };
    
    return actions[context.pageType]?.map(action => 
      `<button onclick="quickAI('${action}')">${action}</button>`
    ).join('');
  }
  
  detectTriggers() {
    // Auto-show relevant AI help
    if (this.detectIncomingAttack()) {
      this.showAlert("🚨 Incoming attack detected - need analysis?");
    }
    
    if (this.detectEmptyQueue()) {
      this.showSuggestion("📦 Building queue empty - optimize next build?");
    }
    
    if (this.detectResourceOverflow()) {
      this.showWarning("⚠️ Resources near capacity - manage distribution?");
    }
  }
}
```

## Confidence-based recommendations

### Hierarchical confidence system

Every recommendation includes confidence assessment and reasoning:

```typescript
interface AIRecommendation {
  action: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  assumptions?: string[];
  alternativeActions?: string[];
  dataNeeded?: string[];
}

// Example high-confidence recommendation
{
  action: "Build Academy to level 10 next",
  confidence: "high",
  reasoning: "You have resources, prerequisites met, and it unlocks settlers in 4:23:00",
  assumptions: [],
  alternativeActions: ["Warehouse if you plan to be offline > 4 hours"],
  dataNeeded: []
}

// Example medium-confidence with clarifications
{
  action: "This attack likely contains 500-800 clubs",
  confidence: "medium", 
  reasoning: "Based on 3:45 travel time from Teuton player",
  assumptions: ["Standard Teuton army composition", "No speed artifacts"],
  alternativeActions: ["Could be fake if player is experienced"],
  dataNeeded: ["Recent scout reports", "Alliance intel on this player"]
}
```

## Implementation phases

### Phase 1: Foundation (Days 1-3)
- Import Kirilloid game rules as TypeScript constants
- Implement page context capture system
- Build village polling mechanism
- Create Chrome storage architecture

### Phase 2: Intelligence (Days 4-6)
- Integrate Claude API via Vercel proxy
- Build collaborative questioning system
- Implement resource flow analysis
- Create confidence scoring

### Phase 3: Interface (Days 7-9)
- Develop smart HUD with contextual actions
- Build chat interface for questions
- Implement alert system
- Create quick action buttons

### Phase 4: Learning (Days 10-11)
- Integrate context_intelligence
- Build pattern recognition
- Implement feedback loops
- Create improvement suggestions

### Phase 5: Polish (Day 12)
- Performance optimization
- Error handling
- User documentation
- Production deployment

## Success metrics

### Key performance indicators

**Data Quality:**
- Village state freshness < 5 minutes
- Page context capture < 100ms
- Complete empire visibility achieved

**AI Quality:**
- High confidence recommendations > 60%
- Questions answered without clarification > 70%
- Accuracy of predictions > 85%

**User Impact:**
- Time saved: 30+ minutes per session
- Strategic advantage: Top 20 ranking achievable
- Reduced gameplay to < 2 hours/day

## Conclusion

TravianAssistant V4 transforms Travian gameplay through comprehensive data visibility and intelligent AI collaboration. By combining complete game rules (Kirilloid), live state capture (Chrome extension), and contextual AI reasoning (Claude), players receive specific, actionable intelligence tailored to their exact situation.

The system's strength lies not in predicting every scenario, but in seeing what the player sees, understanding the complete game state, and asking the right questions when needed. This collaborative approach ensures high-quality recommendations even as the system learns and improves.