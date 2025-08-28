// packages/extension/src/content/game-integration.ts
// Integration layer connecting game scraper, optimizer, and AI prompts

import { GameStartOptimizer } from '../game-start-optimizer';
import { AIPromptEnhancer } from '../ai-prompt-enhancer';

interface ScrapedGameData {
  villages: any[];
  currentResources?: any;
  production?: any;
  buildings?: any[];
  troops?: any[];
  quests?: any[];
}

export class GameIntegration {
  private optimizer: GameStartOptimizer | null = null;
  private lastUpdate: Date = new Date();
  private cachedAnalysis: any = null;

  constructor() {
    console.log('[TLA Integration] Game integration layer initialized');
  }

  /**
   * Process scraped game data and generate AI-ready context
   */
  public processGameState(scrapedData: ScrapedGameData): {
    gameContext: any;
    analysis: any;
    recommendations: any[];
  } {
    console.log('[TLA Integration] Processing game state...');
    
    // Build game context for AI
    const gameContext = this.buildGameContext(scrapedData);
    
    // Initialize or update optimizer if we're in early game
    const serverAge = this.estimateServerAge(scrapedData);
    let analysis = null;
    let recommendations: any[] = [];
    
    if (serverAge < 168) { // First week - use optimizer
      const gameState = this.convertToOptimizerFormat(scrapedData, serverAge);
      this.optimizer = new GameStartOptimizer(gameState);
      
      analysis = this.optimizer.analyzeCurrentState();
      const plan = this.optimizer.generateDetailedPlan();
      recommendations = plan.immediateActions;
      
      // Cache for quick access
      this.cachedAnalysis = {
        phase: analysis.phase,
        plan,
        timestamp: new Date()
      };
    } else {
      // Mid/late game analysis
      analysis = this.performStandardAnalysis(scrapedData);
      recommendations = this.generateStandardRecommendations(scrapedData);
    }
    
    this.lastUpdate = new Date();
    
    return {
      gameContext,
      analysis,
      recommendations
    };
  }

  /**
   * Generate enhanced prompt for AI chat
   */
  public generateAIPrompt(userMessage: string, scrapedData: ScrapedGameData): string {
    const gameContext = this.buildGameContext(scrapedData);
    
    // Use optimizer for early game
    if (this.optimizer && this.estimateServerAge(scrapedData) < 168) {
      return AIPromptEnhancer.generateEnhancedPrompt(
        gameContext,
        userMessage,
        this.optimizer
      );
    }
    
    // Standard prompt for mid/late game
    return AIPromptEnhancer.generateEnhancedPrompt(gameContext, userMessage);
  }

  /**
   * Get quick analysis summary for HUD display
   */
  public getQuickSummary(scrapedData: ScrapedGameData): string {
    const gameContext = this.buildGameContext(scrapedData);
    let summary = AIPromptEnhancer.generateQuickAnalysis(gameContext);
    
    // Add optimizer insights if available
    if (this.cachedAnalysis && this.optimizer) {
      const settlementTime = this.optimizer.predictSettlementTime();
      const hoursRemaining = Math.floor((settlementTime.getTime() - Date.now()) / (1000 * 60 * 60));
      
      summary += `\\n🎯 Settlement Target: ${hoursRemaining}h remaining\\n`;
      summary += `📍 Current Phase: ${this.cachedAnalysis.phase.name}\\n`;
      
      if (this.cachedAnalysis.plan.immediateActions.length > 0) {
        summary += `⚡ Next Action: ${this.cachedAnalysis.plan.immediateActions[0].type}\\n`;
      }
    }
    
    return summary;
  }

  /**
   * Get detailed action plan
   */
  public getActionPlan(timeframe: 'immediate' | 'daily' | 'weekly' = 'immediate'): string {
    if (this.optimizer && timeframe === 'immediate') {
      const plan = this.optimizer.generateDetailedPlan();
      let actionText = '🎯 Optimized Actions (Next 2 Hours):\\n\\n';
      
      plan.immediateActions.slice(0, 5).forEach((action, i) => {
        actionText += `${i + 1}. ${action.type}\\n`;
        actionText += `   ${action.reasoning}\\n`;
        if (action.benefit) {
          actionText += `   Expected: ${action.benefit}\\n`;
        }
        actionText += '\\n';
      });
      
      return actionText;
    }
    
    // Fallback to standard action plan
    const gameContext = this.buildGameContext({ villages: [] });
    return AIPromptEnhancer.generateActionPlan(gameContext, timeframe);
  }

  /**
   * Build game context from scraped data
   */
  private buildGameContext(scrapedData: ScrapedGameData): any {
    const serverAge = this.estimateServerAge(scrapedData);
    
    return {
      villages: scrapedData.villages || [],
      serverInfo: {
        age: serverAge,
        speed: 1, // TODO: Detect from page
        type: 'normal'
      },
      playerInfo: {
        tribe: 'egyptians', // TODO: Detect from page
        rank: 0, // TODO: Scrape from statistics
        alliance: '' // TODO: Scrape from page
      },
      currentPage: window.location.pathname,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Convert scraped data to optimizer format
   */
  private convertToOptimizerFormat(scrapedData: ScrapedGameData, serverAge: number): any {
    const firstVillage = scrapedData.villages[0] || {};
    
    return {
      serverAge,
      resources: scrapedData.currentResources || {
        wood: 500,
        clay: 500,
        iron: 500,
        crop: 500
      },
      production: scrapedData.production || {
        wood: 30,
        clay: 30,
        iron: 30,
        crop: 40
      },
      population: firstVillage.population || 100,
      culturePoints: this.estimateCulturePoints(scrapedData),
      cpProduction: 2, // Base production, TODO: Calculate from buildings
      tribe: 'egyptians',
      goldAvailable: 0, // TODO: Scrape gold amount
      activeQuests: scrapedData.quests?.filter(q => !q.completed) || [],
      completedQuests: scrapedData.quests?.filter(q => q.completed) || [],
      buildingQueue: [], // TODO: Scrape building queue
      troopQueue: [], // TODO: Scrape troop queue
      fields: this.extractFields(scrapedData),
      buildings: scrapedData.buildings || [],
      heroLevel: 1, // TODO: Scrape hero level
      heroProduction: 0 // TODO: Calculate hero resource bonus
    };
  }

  /**
   * Estimate server age from game state
   */
  private estimateServerAge(scrapedData: ScrapedGameData): number {
    // Simple heuristic based on village count and population
    const villages = scrapedData.villages || [];
    const totalPop = villages.reduce((sum, v) => sum + (v.population || 0), 0);
    
    if (villages.length === 1) {
      if (totalPop < 200) return 24; // Day 1
      if (totalPop < 400) return 72; // Day 3
      if (totalPop < 600) return 120; // Day 5
      return 168; // Week 1
    }
    
    // Multiple villages = at least week 1
    return Math.max(168, villages.length * 168);
  }

  /**
   * Estimate culture points from game state
   */
  private estimateCulturePoints(scrapedData: ScrapedGameData): number {
    const villages = scrapedData.villages || [];
    
    // Base CP for starting village
    let cp = 500;
    
    // Add CP for additional villages (each needs 500-2000 CP)
    if (villages.length > 1) {
      cp += (villages.length - 1) * 1000;
    }
    
    // Estimate from buildings
    const buildings = scrapedData.buildings || [];
    buildings.forEach(b => {
      if (b.type === 'Embassy') cp += b.level * 4;
      if (b.type === 'Main Building') cp += b.level * 3;
      if (b.type === 'Marketplace') cp += b.level * 3;
    });
    
    return cp;
  }

  /**
   * Extract resource fields from scraped data
   */
  private extractFields(scrapedData: ScrapedGameData): any[] {
    // TODO: Implement actual field extraction from page
    // For now, return mock data
    const fields = [];
    
    // Standard village has 18 resource fields
    for (let i = 0; i < 6; i++) fields.push({ type: 'wood', level: 1, productionPerHour: 5 });
    for (let i = 0; i < 4; i++) fields.push({ type: 'clay', level: 1, productionPerHour: 5 });
    for (let i = 0; i < 4; i++) fields.push({ type: 'iron', level: 1, productionPerHour: 5 });
    for (let i = 0; i < 4; i++) fields.push({ type: 'crop', level: 1, productionPerHour: 6 });
    
    return fields;
  }

  /**
   * Perform standard analysis for mid/late game
   */
  private performStandardAnalysis(scrapedData: ScrapedGameData): any {
    const villages = scrapedData.villages || [];
    const totalPop = villages.reduce((sum, v) => sum + (v.population || 0), 0);
    
    return {
      phase: { name: 'GROWTH' },
      villageCount: villages.length,
      totalPopulation: totalPop,
      averagePopulation: Math.floor(totalPop / Math.max(villages.length, 1)),
      onTrack: totalPop > 5000 // Simple check
    };
  }

  /**
   * Generate standard recommendations for mid/late game
   */
  private generateStandardRecommendations(scrapedData: ScrapedGameData): any[] {
    const recommendations = [];
    const villages = scrapedData.villages || [];
    
    if (villages.length < 10) {
      recommendations.push({
        type: 'EXPAND',
        priority: 1,
        reasoning: 'Need 10+ villages before artifacts'
      });
    }
    
    const avgPop = villages.reduce((sum, v) => sum + v.population, 0) / Math.max(villages.length, 1);
    if (avgPop < 500) {
      recommendations.push({
        type: 'DEVELOP',
        priority: 2,
        reasoning: 'Villages underdeveloped, target 500+ average'
      });
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const gameIntegration = new GameIntegration();
