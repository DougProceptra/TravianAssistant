// packages/extension/src/ai/game-start-optimizer.ts
// Game start optimization engine for fastest settlement
// v1.0.0 - Comprehensive multi-factor optimization

import { GameState, Village } from '../types/game-state';

export interface SettlementPrediction {
  estimatedDate: Date;
  estimatedHours: number;
  confidence: number;
  limitingFactor: 'cp' | 'resources' | 'settlers';
  breakdown: {
    currentCP: number;
    dailyCPProduction: number;
    cpNeeded: number;
    daysToCP: number;
    currentResources: number;
    resourcesNeeded: number;
    resourceProductionRate: number;
    daysToResources: number;
    settlersReady: boolean;
    settlerTrainingTime: number;
  };
  recommendations: string[];
}

export interface BuildOrder {
  position: number;
  buildingType: string;
  level: number;
  priority: number;
  reason: string;
  expectedCompletion: Date;
  resourceCost: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
  cpGain?: number;
  productionGain?: number;
}

export interface OptimizationStrategy {
  phase: 'early' | 'mid' | 'late' | 'settlement';
  focus: 'resources' | 'cp' | 'military' | 'balanced';
  buildQueue: BuildOrder[];
  questTargets: string[];
  npcRecommendation?: {
    when: Date;
    ratio: number[];
    reason: string;
  };
  celebrationTiming?: {
    small: Date;
    large?: Date;
  };
}

export class GameStartOptimizer {
  private readonly SETTLEMENT_CP_REQUIRED = 500; // For first settlement
  private readonly SETTLER_COST = {
    training_time: 26400, // seconds for 3 settlers
    resources: { wood: 5880, clay: 4920, iron: 5940, crop: 1600 }
  };
  
  private readonly EGYPTIAN_BONUSES = {
    resourceBonus: 0, // No specific resource bonus
    wallBonus: 0.05, // +5% from waterworks
    buildingResourceReduction: 0.01 // -1% per waterworks level
  };
  
  private readonly CP_SOURCES = {
    // Building CP values
    buildings: {
      'main_building': [2, 3, 3, 4, 5, 6, 7, 9, 10, 12, 15, 18, 21, 26, 31, 37, 44, 53, 64, 77],
      'residence': [1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 11, 13, 15, 18, 22, 27],
      'palace': [1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 11, 13, 15, 18, 22, 27],
      'embassy': [3, 4, 5, 6, 8, 10, 12, 14, 17, 21, 25, 29, 35, 42, 50],
      'cranny': [0, 0, 1, 1, 1, 2, 2, 2, 3, 3],
      'academy': [4, 6, 8, 11, 14, 18, 23, 29, 36, 46, 58, 73, 91, 115, 144],
      'marketplace': [3, 4, 5, 7, 9, 11, 13, 17, 21, 26, 32, 39, 48, 59, 72],
      'granary': [1, 1, 2, 2, 2],
      'warehouse': [1, 1, 2, 2, 2],
      'town_hall': [7, 9, 12, 15, 18],
      'grain_mill': [3, 4, 5, 6, 8],
      'bakery': [4, 5, 7, 9, 11]
    },
    // Quest CP rewards (approximations)
    quests: {
      'economy': 24,
      'world': 24,
      'battle': 12
    }
  };

  constructor(private gameState: GameState) {}

  /**
   * Main optimization method - returns complete strategy
   */
  public optimizeForSettlement(): OptimizationStrategy {
    const settlementPrediction = this.predictSettlementTime();
    const currentPhase = this.determinePhase();
    const buildQueue = this.generateOptimalBuildQueue(currentPhase, settlementPrediction);
    const questTargets = this.identifyQuestTargets(currentPhase);
    
    const strategy: OptimizationStrategy = {
      phase: currentPhase,
      focus: this.determineFocus(settlementPrediction),
      buildQueue,
      questTargets,
      npcRecommendation: this.calculateNPCTiming(),
      celebrationTiming: this.calculateCelebrationTiming(settlementPrediction)
    };
    
    return strategy;
  }

  /**
   * Predict when settlement will be possible
   */
  public predictSettlementTime(): SettlementPrediction {
    const currentCP = this.gameState.culturePoints?.current || 0;
    const dailyCPProduction = this.gameState.culturePoints?.daily || 1;
    const cpNeeded = this.SETTLEMENT_CP_REQUIRED - currentCP;
    
    // Calculate days to CP (including potential celebrations)
    let daysToCP = cpNeeded / dailyCPProduction;
    if (this.canCelebrate('small')) {
      daysToCP *= 0.5; // Small celebration doubles CP
    }
    
    // Calculate resources needed
    const totalResourcesNeeded = 
      this.SETTLER_COST.resources.wood +
      this.SETTLER_COST.resources.clay +
      this.SETTLER_COST.resources.iron +
      this.SETTLER_COST.resources.crop;
    
    const currentResources = this.calculateTotalResources();
    const resourceProductionRate = this.calculateTotalProduction();
    const daysToResources = Math.max(0, (totalResourcesNeeded - currentResources) / (resourceProductionRate * 24));
    
    // Check settlers
    const settlersReady = this.checkSettlers();
    const settlerTrainingTime = settlersReady ? 0 : this.SETTLER_COST.training_time / 3600; // Convert to hours
    
    // Determine limiting factor
    const cpHours = daysToCP * 24;
    const resourceHours = daysToResources * 24;
    const settlerHours = settlerTrainingTime;
    
    let limitingFactor: 'cp' | 'resources' | 'settlers';
    let estimatedHours: number;
    
    if (cpHours >= Math.max(resourceHours, settlerHours)) {
      limitingFactor = 'cp';
      estimatedHours = cpHours;
    } else if (resourceHours >= settlerHours) {
      limitingFactor = 'resources';
      estimatedHours = resourceHours;
    } else {
      limitingFactor = 'settlers';
      estimatedHours = settlerHours;
    }
    
    // Add buffer for building construction time
    estimatedHours += 24; // Add 1 day buffer
    
    const estimatedDate = new Date(Date.now() + estimatedHours * 3600000);
    
    // Generate recommendations
    const recommendations = this.generateSettlementRecommendations(limitingFactor, settlementPrediction);
    
    return {
      estimatedDate,
      estimatedHours,
      confidence: this.calculateConfidence(),
      limitingFactor,
      breakdown: {
        currentCP,
        dailyCPProduction,
        cpNeeded,
        daysToCP,
        currentResources,
        resourcesNeeded: totalResourcesNeeded,
        resourceProductionRate,
        daysToResources,
        settlersReady,
        settlerTrainingTime
      },
      recommendations
    };
  }

  /**
   * Generate optimal build queue based on current phase and goals
   */
  private generateOptimalBuildQueue(phase: string, prediction: SettlementPrediction): BuildOrder[] {
    const queue: BuildOrder[] = [];
    const limitingFactor = prediction.limitingFactor;
    
    // Priority 1: Essential infrastructure
    if (phase === 'early') {
      // Resource fields to level 2-3
      for (let i = 1; i <= 18; i++) {
        const field = this.gameState.buildings?.find(b => b.position === i);
        if (field && field.level < 2) {
          queue.push(this.createBuildOrder(i, field.type, field.level + 1, 1, 'Basic resource production'));
        }
      }
      
      // Main building to 3
      const mainBuilding = this.gameState.buildings?.find(b => b.type === 'main_building');
      if (mainBuilding && mainBuilding.level < 3) {
        queue.push(this.createBuildOrder(26, 'main_building', mainBuilding.level + 1, 2, 'Faster construction'));
      }
    }
    
    // Priority 2: Based on limiting factor
    if (limitingFactor === 'cp') {
      // Focus on CP buildings
      queue.push(this.createBuildOrder(26, 'main_building', 5, 1, 'High CP generation'));
      queue.push(this.createBuildOrder(19, 'embassy', 1, 2, 'CP and alliance'));
      queue.push(this.createBuildOrder(24, 'town_hall', 1, 3, 'CP and celebrations'));
    } else if (limitingFactor === 'resources') {
      // Focus on resource production
      const lowestProducingField = this.findLowestProducingField();
      if (lowestProducingField) {
        queue.push(this.createBuildOrder(
          lowestProducingField.position,
          lowestProducingField.type,
          lowestProducingField.level + 1,
          1,
          'Boost lowest production'
        ));
      }
    }
    
    // Priority 3: Quest targets
    const questBuildings = this.getQuestRequirements();
    questBuildings.forEach((req, index) => {
      const existing = this.gameState.buildings?.find(b => b.type === req.type);
      if (!existing || existing.level < req.level) {
        queue.push(this.createBuildOrder(
          req.position,
          req.type,
          req.level,
          5 + index,
          `Quest requirement: ${req.quest}`
        ));
      }
    });
    
    // Sort by priority and filter duplicates
    return this.optimizeBuildQueue(queue);
  }

  /**
   * Helper methods
   */
  private determinePhase(): 'early' | 'mid' | 'late' | 'settlement' {
    const serverAge = this.gameState.serverAge || 0;
    const serverDay = Math.floor(serverAge / 86400);
    const currentCP = this.gameState.culturePoints?.current || 0;
    
    if (serverDay < 2) return 'early';
    if (serverDay < 4) return 'mid';
    if (currentCP > 400) return 'settlement';
    return 'late';
  }

  private determineFocus(prediction: SettlementPrediction): 'resources' | 'cp' | 'military' | 'balanced' {
    if (prediction.limitingFactor === 'cp') return 'cp';
    if (prediction.limitingFactor === 'resources') return 'resources';
    return 'balanced';
  }

  private calculateTotalResources(): number {
    const resources = this.gameState.resources;
    if (!resources) return 0;
    return resources.wood + resources.clay + resources.iron + resources.crop;
  }

  private calculateTotalProduction(): number {
    const production = this.gameState.production;
    if (!production) return 0;
    return production.wood + production.clay + production.iron + production.crop;
  }

  private checkSettlers(): boolean {
    // Check if settlers are already trained
    const troops = this.gameState.troops;
    if (!troops) return false;
    
    // Settler unit ID varies by tribe, for Egyptians it's unit 10
    return (troops.settlers || 0) >= 3;
  }

  private canCelebrate(type: 'small' | 'large'): boolean {
    // Check if town hall exists and resources are available
    const townHall = this.gameState.buildings?.find(b => b.type === 'town_hall');
    if (!townHall) return false;
    
    const cost = type === 'small' 
      ? { wood: 6400, clay: 6650, iron: 5940, crop: 1340 }
      : { wood: 29700, clay: 33250, iron: 32000, crop: 6700 };
    
    const resources = this.gameState.resources;
    if (!resources) return false;
    
    return resources.wood >= cost.wood &&
           resources.clay >= cost.clay &&
           resources.iron >= cost.iron &&
           resources.crop >= cost.crop;
  }

  private calculateNPCTiming(): OptimizationStrategy['npcRecommendation'] {
    // Calculate when NPC would be most beneficial
    const resources = this.gameState.resources;
    const production = this.gameState.production;
    
    if (!resources || !production) return undefined;
    
    // Check if resources are imbalanced
    const total = resources.wood + resources.clay + resources.iron;
    const average = total / 3;
    const imbalance = Math.max(
      Math.abs(resources.wood - average),
      Math.abs(resources.clay - average),
      Math.abs(resources.iron - average)
    );
    
    if (imbalance > average * 0.3) {
      // Resources are imbalanced by >30%
      return {
        when: new Date(),
        ratio: [33, 33, 33, 1], // Balance resources
        reason: 'Resources imbalanced by >30% - NPC recommended'
      };
    }
    
    return undefined;
  }

  private calculateCelebrationTiming(prediction: SettlementPrediction): OptimizationStrategy['celebrationTiming'] {
    if (prediction.limitingFactor !== 'cp') return undefined;
    
    const daysToCP = prediction.breakdown.daysToCP;
    
    if (daysToCP > 2 && this.canCelebrate('small')) {
      return {
        small: new Date(),
        large: daysToCP > 5 && this.canCelebrate('large') ? new Date(Date.now() + 86400000) : undefined
      };
    }
    
    return undefined;
  }

  private calculateConfidence(): number {
    // Base confidence
    let confidence = 0.7;
    
    // Adjust based on data quality
    if (this.gameState.villages && this.gameState.villages.length > 0) confidence += 0.1;
    if (this.gameState.culturePoints) confidence += 0.1;
    if (this.gameState.production) confidence += 0.05;
    if (this.gameState.quests) confidence += 0.05;
    
    return Math.min(confidence, 0.95);
  }

  private generateSettlementRecommendations(
    limitingFactor: string,
    prediction: SettlementPrediction
  ): string[] {
    const recommendations: string[] = [];
    
    if (limitingFactor === 'cp') {
      recommendations.push('Focus on CP-generating buildings (Main Building, Embassy, Town Hall)');
      if (this.canCelebrate('small')) {
        recommendations.push('Run small celebration immediately to double CP production');
      }
      recommendations.push('Complete all available CP-rewarding quests');
    } else if (limitingFactor === 'resources') {
      recommendations.push('Upgrade lowest-producing resource fields first');
      recommendations.push('Consider using NPC to balance resources if heavily skewed');
      recommendations.push('Complete economy quests for resource rewards');
      
      const lowestResource = this.identifyLowestResource();
      if (lowestResource) {
        recommendations.push(`Priority: Upgrade ${lowestResource} fields (currently bottleneck)`);
      }
    } else if (limitingFactor === 'settlers') {
      recommendations.push('Ensure Residence/Palace is at level 10');
      recommendations.push('Start training settlers as soon as resources allow');
      recommendations.push('Reserve resources for settler training (5880/4920/5940/1600)');
    }
    
    // Add time estimate
    const hours = Math.floor(prediction.estimatedHours);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    recommendations.push(`Estimated settlement time: ${days}d ${remainingHours}h (${prediction.confidence * 100}% confidence)`);
    
    return recommendations;
  }

  private findLowestProducingField(): any {
    const production = this.gameState.production;
    if (!production) return null;
    
    const fields = this.gameState.buildings?.filter(b => b.position >= 1 && b.position <= 18);
    if (!fields || fields.length === 0) return null;
    
    // Find which resource type has lowest production
    const lowestType = ['wood', 'clay', 'iron', 'crop'].reduce((min, type) => 
      production[type] < production[min] ? type : min
    );
    
    // Find lowest level field of that type
    return fields
      .filter(f => f.type.includes(lowestType))
      .sort((a, b) => a.level - b.level)[0];
  }

  private identifyLowestResource(): string | null {
    const production = this.gameState.production;
    if (!production) return null;
    
    const resources = ['wood', 'clay', 'iron', 'crop'];
    return resources.reduce((min, type) => 
      production[type] < production[min] ? type : min
    );
  }

  private createBuildOrder(
    position: number,
    type: string,
    level: number,
    priority: number,
    reason: string
  ): BuildOrder {
    // Calculate resource cost (simplified)
    const baseCost = 100 * Math.pow(1.5, level - 1);
    const resourceCost = {
      wood: Math.floor(baseCost * 1.0),
      clay: Math.floor(baseCost * 0.8),
      iron: Math.floor(baseCost * 1.2),
      crop: Math.floor(baseCost * 0.3)
    };
    
    // Calculate completion time
    const constructionTime = baseCost / 10 * 3600; // Simplified calculation
    const expectedCompletion = new Date(Date.now() + constructionTime * 1000);
    
    // Get CP gain if applicable
    const cpGain = this.CP_SOURCES.buildings[type]?.[level - 1] || 0;
    
    return {
      position,
      buildingType: type,
      level,
      priority,
      reason,
      expectedCompletion,
      resourceCost,
      cpGain,
      productionGain: position <= 18 ? Math.floor(5 * Math.pow(1.2, level)) : 0
    };
  }

  private optimizeBuildQueue(queue: BuildOrder[]): BuildOrder[] {
    // Sort by priority
    queue.sort((a, b) => a.priority - b.priority);
    
    // Remove duplicates (keep highest level)
    const seen = new Map<string, BuildOrder>();
    queue.forEach(order => {
      const key = `${order.position}-${order.buildingType}`;
      const existing = seen.get(key);
      if (!existing || existing.level < order.level) {
        seen.set(key, order);
      }
    });
    
    return Array.from(seen.values()).slice(0, 10); // Return top 10
  }

  private identifyQuestTargets(phase: string): string[] {
    const targets: string[] = [];
    
    if (phase === 'early') {
      targets.push('Complete all tutorial quests');
      targets.push('Build Cranny to level 1 (quest reward)');
      targets.push('Upgrade one of each resource field to 1');
    } else if (phase === 'mid') {
      targets.push('Build Warehouse and Granary');
      targets.push('Build Marketplace for NPC trader');
      targets.push('Complete economy questline');
    } else if (phase === 'late' || phase === 'settlement') {
      targets.push('Build Residence to level 10');
      targets.push('Build Academy for settler research');
      targets.push('Complete world questline for resources');
    }
    
    return targets;
  }

  private getQuestRequirements(): Array<{type: string, level: number, position: number, quest: string}> {
    // Common quest requirements
    return [
      { type: 'warehouse', level: 1, position: 20, quest: 'Economy Quest 1' },
      { type: 'granary', level: 1, position: 21, quest: 'Economy Quest 2' },
      { type: 'marketplace', level: 1, position: 22, quest: 'Economy Quest 3' },
      { type: 'cranny', level: 1, position: 23, quest: 'Tutorial Quest' },
      { type: 'residence', level: 10, position: 25, quest: 'Settlement Requirement' },
      { type: 'academy', level: 10, position: 27, quest: 'Settler Research' }
    ];
  }
}

// Export for use in AI chat
export function createSettlementAnalysis(gameState: GameState): string {
  const optimizer = new GameStartOptimizer(gameState);
  const prediction = optimizer.predictSettlementTime();
  const strategy = optimizer.optimizeForSettlement();
  
  const hours = Math.floor(prediction.estimatedHours);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  let analysis = `**Settlement Prediction**\n`;
  analysis += `Estimated time: ${days}d ${remainingHours}h\n`;
  analysis += `Limiting factor: ${prediction.limitingFactor.toUpperCase()}\n`;
  analysis += `Confidence: ${Math.round(prediction.confidence * 100)}%\n\n`;
  
  analysis += `**Current Status**\n`;
  analysis += `• CP: ${prediction.breakdown.currentCP}/${500} (${prediction.breakdown.dailyCPProduction}/day)\n`;
  analysis += `• Resources for settlers: ${Math.round(prediction.breakdown.currentResources)}/${Math.round(prediction.breakdown.resourcesNeeded)}\n`;
  analysis += `• Settlers: ${prediction.breakdown.settlersReady ? 'Ready' : `Need training (${Math.round(prediction.breakdown.settlerTrainingTime)}h)`}\n\n`;
  
  analysis += `**Strategy: ${strategy.focus.toUpperCase()} Focus**\n`;
  strategy.buildQueue.slice(0, 5).forEach(order => {
    analysis += `${order.priority}. ${order.buildingType} L${order.level} - ${order.reason}\n`;
  });
  
  if (strategy.npcRecommendation) {
    analysis += `\n**NPC Trade**: ${strategy.npcRecommendation.reason}\n`;
  }
  
  if (strategy.celebrationTiming) {
    analysis += `\n**Celebration**: Run small celebration NOW to double CP!\n`;
  }
  
  analysis += `\n**Key Actions**\n`;
  prediction.recommendations.slice(0, 3).forEach(rec => {
    analysis += `• ${rec}\n`;
  });
  
  return analysis;
}