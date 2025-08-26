/**
 * Settlement Calculator - Predicts time to second village
 * Uses game constants to calculate bottlenecks and optimal path
 */

import {
  BuildingId,
  BUILDINGS,
  CULTURE_POINTS_FOR_VILLAGES,
  SETTLER_COSTS,
  RESOURCE_PRODUCTION,
  calculateBuildingCost,
  calculateCulturePoints,
  calculateBuildTime,
  canBuildBuilding,
  Resources,
} from './travian-constants';

export interface GameState {
  // Current resources
  resources: Resources;
  
  // Resource production per hour
  production: Resources;
  
  // Current buildings and their levels
  buildings: Map<BuildingId, number>;
  
  // Player configuration
  tribe: 'Romans' | 'Teutons' | 'Gauls' | 'Egyptians' | 'Huns';
  serverSpeed: '1x' | '2x' | '3x' | '5x' | '10x';
  goldAvailable: number;
  
  // Current status
  currentCP: number;
  buildingQueue: Array<{ buildingId: BuildingId; completionTime: Date }>;
  
  // Time tracking
  serverStartTime: Date;
  currentServerTime: Date;
}

export interface SettlementPrediction {
  estimatedTime: Date;
  hoursToSettlement: number;
  bottleneck: 'culture_points' | 'resources' | 'buildings';
  currentCP: number;
  cpNeeded: number;
  cpPerDay: number;
  resourcesNeeded: Resources;
  missingBuildings: string[];
  recommendations: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
}

export class SettlementCalculator {
  private gameState: GameState;
  
  constructor(gameState: GameState) {
    this.gameState = gameState;
  }
  
  /**
   * Main prediction function
   */
  predict(): SettlementPrediction {
    const cpBottleneck = this.calculateCPBottleneck();
    const resourceBottleneck = this.calculateResourceBottleneck();
    const buildingBottleneck = this.calculateBuildingBottleneck();
    
    // Find the limiting factor
    const maxHours = Math.max(
      cpBottleneck.hours,
      resourceBottleneck.hours,
      buildingBottleneck.hours
    );
    
    let bottleneck: SettlementPrediction['bottleneck'];
    if (cpBottleneck.hours >= maxHours) {
      bottleneck = 'culture_points';
    } else if (resourceBottleneck.hours >= maxHours) {
      bottleneck = 'resources';
    } else {
      bottleneck = 'buildings';
    }
    
    const estimatedTime = new Date(
      this.gameState.currentServerTime.getTime() + maxHours * 3600 * 1000
    );
    
    return {
      estimatedTime,
      hoursToSettlement: maxHours,
      bottleneck,
      currentCP: this.gameState.currentCP,
      cpNeeded: CULTURE_POINTS_FOR_VILLAGES[1] - this.gameState.currentCP,
      cpPerDay: this.calculateDailyCP(),
      resourcesNeeded: this.calculateResourcesNeeded(),
      missingBuildings: buildingBottleneck.missing,
      recommendations: this.generateRecommendations(bottleneck, maxHours),
      confidenceLevel: this.assessConfidence(),
    };
  }
  
  /**
   * Calculate hours until 200 CP
   */
  private calculateCPBottleneck(): { hours: number; details: string } {
    const targetCP = CULTURE_POINTS_FOR_VILLAGES[1]; // 200 for second village
    const currentCP = this.gameState.currentCP;
    const cpNeeded = targetCP - currentCP;
    
    if (cpNeeded <= 0) {
      return { hours: 0, details: 'CP requirement already met' };
    }
    
    const dailyCP = this.calculateDailyCP();
    const daysNeeded = cpNeeded / dailyCP;
    const hoursNeeded = daysNeeded * 24;
    
    return {
      hours: hoursNeeded,
      details: `Need ${cpNeeded} more CP at ${dailyCP.toFixed(1)} CP/day`,
    };
  }
  
  /**
   * Calculate daily CP generation from current buildings
   */
  private calculateDailyCP(): number {
    let dailyCP = 0;
    
    this.gameState.buildings.forEach((level, buildingId) => {
      const building = BUILDINGS[buildingId];
      if (!building) return;
      
      // Each building level generates CP equal to its level * base CP
      for (let i = 1; i <= level; i++) {
        dailyCP += building.culturePoints * i;
      }
    });
    
    return dailyCP;
  }
  
  /**
   * Calculate hours until enough resources for settlers
   */
  private calculateResourceBottleneck(): { hours: number; details: string } {
    const settlerCost = SETTLER_COSTS[this.gameState.tribe];
    const currentResources = this.gameState.resources;
    const production = this.gameState.production;
    
    // Calculate hours needed for each resource type
    const hoursPerResource = {
      wood: Math.max(0, (settlerCost.wood - currentResources.wood) / production.wood),
      clay: Math.max(0, (settlerCost.clay - currentResources.clay) / production.clay),
      iron: Math.max(0, (settlerCost.iron - currentResources.iron) / production.iron),
      crop: Math.max(0, (settlerCost.crop - currentResources.crop) / production.crop),
    };
    
    // The bottleneck is the resource that takes longest
    const maxHours = Math.max(...Object.values(hoursPerResource));
    const limitingResource = Object.entries(hoursPerResource)
      .find(([_, hours]) => hours === maxHours)?.[0] || 'unknown';
    
    return {
      hours: maxHours,
      details: `Limited by ${limitingResource} production`,
    };
  }
  
  /**
   * Calculate hours until prerequisite buildings are complete
   */
  private calculateBuildingBottleneck(): { hours: number; missing: string[] } {
    const missing: string[] = [];
    let totalHours = 0;
    
    // Check Main Building → 5
    const mainBuildingLevel = this.gameState.buildings.get(BuildingId.MAIN_BUILDING) || 0;
    if (mainBuildingLevel < 5) {
      for (let level = mainBuildingLevel + 1; level <= 5; level++) {
        const buildTime = calculateBuildTime(
          BuildingId.MAIN_BUILDING,
          level,
          mainBuildingLevel,
          this.gameState.serverSpeed
        );
        totalHours += buildTime / 3600;
        missing.push(`Main Building to level ${level}`);
      }
    }
    
    // Check Rally Point → 1
    const rallyPointLevel = this.gameState.buildings.get(BuildingId.RALLY_POINT) || 0;
    if (rallyPointLevel < 1) {
      const buildTime = calculateBuildTime(
        BuildingId.RALLY_POINT,
        1,
        mainBuildingLevel,
        this.gameState.serverSpeed
      );
      totalHours += buildTime / 3600;
      missing.push('Rally Point level 1');
    }
    
    // Check Barracks → 3
    const barracksLevel = this.gameState.buildings.get(BuildingId.BARRACKS) || 0;
    if (barracksLevel < 3) {
      for (let level = Math.max(1, barracksLevel + 1); level <= 3; level++) {
        const buildTime = calculateBuildTime(
          BuildingId.BARRACKS,
          level,
          mainBuildingLevel,
          this.gameState.serverSpeed
        );
        totalHours += buildTime / 3600;
        missing.push(`Barracks to level ${level}`);
      }
    }
    
    // Check Academy → 10
    const academyLevel = this.gameState.buildings.get(BuildingId.ACADEMY) || 0;
    if (academyLevel < 10) {
      for (let level = Math.max(1, academyLevel + 1); level <= 10; level++) {
        const buildTime = calculateBuildTime(
          BuildingId.ACADEMY,
          level,
          mainBuildingLevel,
          this.gameState.serverSpeed
        );
        totalHours += buildTime / 3600;
        missing.push(`Academy to level ${level}`);
      }
    }
    
    // Check Residence/Palace → 10
    const residenceLevel = this.gameState.buildings.get(BuildingId.RESIDENCE) || 0;
    const palaceLevel = this.gameState.buildings.get(BuildingId.PALACE) || 0;
    
    if (residenceLevel < 10 && palaceLevel < 10) {
      // Need to build residence to 10
      for (let level = Math.max(1, residenceLevel + 1); level <= 10; level++) {
        const buildTime = calculateBuildTime(
          BuildingId.RESIDENCE,
          level,
          mainBuildingLevel,
          this.gameState.serverSpeed
        );
        totalHours += buildTime / 3600;
        missing.push(`Residence to level ${level}`);
      }
    }
    
    // Add settler training time (approximately 10 hours at 1x speed)
    const settlerTrainingTime = 10 * (this.gameState.serverSpeed === '1x' ? 1 : 
                                      this.gameState.serverSpeed === '2x' ? 0.5 :
                                      this.gameState.serverSpeed === '3x' ? 0.33 : 0.2);
    totalHours += settlerTrainingTime;
    
    return { hours: totalHours, missing };
  }
  
  /**
   * Calculate total resources needed for settlement
   */
  private calculateResourcesNeeded(): Resources {
    const settlerCost = SETTLER_COSTS[this.gameState.tribe];
    const current = this.gameState.resources;
    
    return {
      wood: Math.max(0, settlerCost.wood - current.wood),
      clay: Math.max(0, settlerCost.clay - current.clay),
      iron: Math.max(0, settlerCost.iron - current.iron),
      crop: Math.max(0, settlerCost.crop - current.crop),
    };
  }
  
  /**
   * Generate actionable recommendations based on bottleneck
   */
  private generateRecommendations(
    bottleneck: SettlementPrediction['bottleneck'],
    hoursToSettlement: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (bottleneck === 'culture_points') {
      recommendations.push('Focus on CP generation:');
      recommendations.push('- Build Embassy (4 CP base)');
      recommendations.push('- Build Town Hall if Main Building is level 10');
      recommendations.push('- Upgrade Main Building (2 CP base)');
      recommendations.push('- Consider small party for instant 500 CP (if close)');
    } else if (bottleneck === 'resources') {
      recommendations.push('Focus on resource production:');
      
      // Calculate ROI for resource fields
      const roiHours: Array<{ field: string; roi: number }> = [];
      
      [BuildingId.WOODCUTTER, BuildingId.CLAY_PIT, BuildingId.IRON_MINE, BuildingId.CROPLAND].forEach(fieldId => {
        const currentLevel = this.gameState.buildings.get(fieldId) || 0;
        if (currentLevel < 10) {
          const upgradeCost = calculateBuildingCost(fieldId, currentLevel);
          if (upgradeCost) {
            const totalCost = upgradeCost.wood + upgradeCost.clay + upgradeCost.iron + upgradeCost.crop;
            const productionIncrease = RESOURCE_PRODUCTION[currentLevel + 1] - RESOURCE_PRODUCTION[currentLevel];
            const paybackHours = totalCost / productionIncrease;
            
            if (paybackHours < hoursToSettlement) {
              roiHours.push({
                field: BUILDINGS[fieldId]?.name || 'Unknown',
                roi: paybackHours,
              });
            }
          }
        }
      });
      
      roiHours.sort((a, b) => a.roi - b.roi);
      roiHours.slice(0, 3).forEach(item => {
        recommendations.push(`- Upgrade ${item.field} (ROI: ${item.roi.toFixed(1)} hours)`);
      });
      
      if (this.gameState.goldAvailable > 0) {
        recommendations.push('- Use NPC trader to balance resources');
      }
    } else {
      recommendations.push('Focus on building prerequisites:');
      const buildOrder = this.calculateBuildingBottleneck().missing.slice(0, 5);
      buildOrder.forEach(building => {
        recommendations.push(`- ${building}`);
      });
    }
    
    return recommendations;
  }
  
  /**
   * Assess confidence level of the prediction
   */
  private assessConfidence(): SettlementPrediction['confidenceLevel'] {
    // High confidence if we have good data
    const hasBasicBuildings = this.gameState.buildings.size > 10;
    const hasProductionData = this.gameState.production.wood > 0;
    const recentData = 
      (new Date().getTime() - this.gameState.currentServerTime.getTime()) < 3600000; // Less than 1 hour old
    
    if (hasBasicBuildings && hasProductionData && recentData) {
      return 'high';
    } else if (hasBasicBuildings || hasProductionData) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

/**
 * Generate hour-by-hour plan from game start
 */
export function generateStartPlan(
  tribe: GameState['tribe'],
  serverSpeed: GameState['serverSpeed'],
  useGold: boolean
): Array<{ hour: number; action: string; reason: string }> {
  const plan: Array<{ hour: number; action: string; reason: string }> = [];
  
  // Hour 0-24: Resource field focus
  plan.push({
    hour: 0,
    action: 'Complete tutorial quests',
    reason: 'Free resources and building time reduction',
  });
  
  plan.push({
    hour: 2,
    action: 'All resource fields to level 1',
    reason: 'Establish base production',
  });
  
  plan.push({
    hour: 8,
    action: 'One of each resource field to level 2',
    reason: 'Increase production for overnight',
  });
  
  // Hour 24-48: Infrastructure
  plan.push({
    hour: 24,
    action: 'Main Building to level 3',
    reason: 'Unlock Barracks and reduce build times',
  });
  
  plan.push({
    hour: 30,
    action: 'Build Warehouse level 1',
    reason: 'Prevent resource overflow',
  });
  
  plan.push({
    hour: 36,
    action: 'Build Granary level 1',
    reason: 'Prevent crop overflow',
  });
  
  // Hour 48-72: Military prerequisites
  plan.push({
    hour: 48,
    action: 'Build Rally Point level 1',
    reason: 'Required for Barracks',
  });
  
  plan.push({
    hour: 54,
    action: 'Build Barracks level 1-3',
    reason: 'Required for Academy',
  });
  
  plan.push({
    hour: 60,
    action: 'Main Building to level 5',
    reason: 'Required for Residence',
  });
  
  // Hour 72-120: Academy and CP
  plan.push({
    hour: 72,
    action: 'Build Academy level 1',
    reason: 'Start working toward settlers',
  });
  
  plan.push({
    hour: 84,
    action: 'Build Embassy level 1-3',
    reason: 'High CP generation (4 base)',
  });
  
  plan.push({
    hour: 96,
    action: 'Academy to level 5',
    reason: 'Halfway to settlers',
  });
  
  plan.push({
    hour: 108,
    action: 'Build/upgrade Marketplace',
    reason: 'CP generation and resource trading',
  });
  
  // Hour 120-168: Final push
  plan.push({
    hour: 120,
    action: 'Academy to level 10',
    reason: 'Unlock settlers in Residence',
  });
  
  plan.push({
    hour: 132,
    action: 'Build Residence level 1',
    reason: 'Start training settlers',
  });
  
  plan.push({
    hour: 144,
    action: 'Residence to level 10',
    reason: 'Can now train settlers',
  });
  
  plan.push({
    hour: 156,
    action: 'Train 3 settlers',
    reason: 'Required for settlement',
  });
  
  plan.push({
    hour: 168,
    action: 'SETTLE!',
    reason: 'Target: Day 7 settlement achieved',
  });
  
  if (useGold) {
    plan.push({
      hour: 24,
      action: '[GOLD] NPC trade for balanced resources',
      reason: 'Fix any resource imbalances',
    });
    
    plan.push({
      hour: 100,
      action: '[GOLD] Instant finish Academy levels 8-10',
      reason: 'Save 12+ hours of build time',
    });
  }
  
  return plan;
}
