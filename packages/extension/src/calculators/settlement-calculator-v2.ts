/**
 * Enhanced Settlement Calculator - V2
 * Addresses missing variables and improves accuracy
 */

import {
  BuildingId,
  BUILDINGS,
  SETTLER_COSTS,
  RESOURCE_PRODUCTION,
  calculateBuildingCost,
  calculateBuildTime,
  Resources,
  SERVER_SPEEDS,
} from '../game-data/travian-constants';

export interface EnhancedGameState {
  // Current resources
  resources: Resources;
  
  // Resource production per hour
  production: Resources;
  
  // Crop consumption (negative value)
  cropConsumption: number;
  
  // Current buildings and their levels
  buildings: Map<BuildingId, number>;
  
  // Player configuration
  tribe: 'Romans' | 'Teutons' | 'Gauls' | 'Egyptians' | 'Huns' | 'Spartans' | 'Vikings';
  serverSpeed: keyof typeof SERVER_SPEEDS;
  serverVersion: 'T3' | 'T4' | 'T5' | 'T5_Vikings';
  goldAvailable: number;
  plusAccount: boolean;
  
  // Settlement configuration - NEW!
  targetCP: number; // Customizable CP target
  startingCP: number; // CP already accumulated
  currentCP: number;
  
  // Building queue and planned buildings
  buildingQueue: Array<{ buildingId: BuildingId; completionTime: Date }>;
  plannedBuildings: Array<{ buildingId: BuildingId; targetLevel: number }>;
  
  // Storage limits
  warehouseCapacity: number;
  granaryCapacity: number;
  
  // Time tracking
  serverStartTime: Date;
  currentServerTime: Date;
  playerActiveHours: number; // Hours per day player is active
}

export interface ResourceProjection {
  time: Date;
  resources: Resources;
  netProduction: Resources; // After consumption
  overflow: boolean;
  bottleneckResource?: keyof Resources;
}

export class EnhancedSettlementCalculator {
  private gameState: EnhancedGameState;
  private resourceTimeline: ResourceProjection[] = [];
  
  constructor(gameState: EnhancedGameState) {
    this.gameState = gameState;
  }
  
  /**
   * Main prediction with integrated resource/building planning
   */
  predict(): SettlementPrediction {
    // Build integrated timeline of all actions
    const timeline = this.buildIntegratedTimeline();
    
    // Find when all conditions are met
    const settlementPoint = this.findSettlementPoint(timeline);
    
    return {
      estimatedTime: settlementPoint.time,
      hoursToSettlement: settlementPoint.hours,
      bottleneck: settlementPoint.bottleneck,
      currentCP: this.gameState.currentCP,
      cpNeeded: this.gameState.targetCP - this.gameState.currentCP,
      cpPerDay: this.calculateDailyCP(),
      resourcesNeeded: this.calculateNetResourcesNeeded(timeline),
      timeline: timeline,
      recommendations: this.generateSmartRecommendations(settlementPoint),
      confidenceLevel: this.assessConfidence(),
      warnings: this.identifyRisks(timeline),
    };
  }
  
  /**
   * Build hour-by-hour timeline with all resource flows
   */
  private buildIntegratedTimeline(): TimelineEntry[] {
    const timeline: TimelineEntry[] = [];
    const hoursToProject = 240; // Project 10 days out
    
    let currentResources = { ...this.gameState.resources };
    let currentCP = this.gameState.currentCP;
    let currentBuildings = new Map(this.gameState.buildings);
    let currentProduction = { ...this.gameState.production };
    
    for (let hour = 0; hour < hoursToProject; hour++) {
      const entry: TimelineEntry = {
        hour,
        time: new Date(this.gameState.currentServerTime.getTime() + hour * 3600000),
        resources: { ...currentResources },
        culturePoints: currentCP,
        production: { ...currentProduction },
        events: [],
      };
      
      // Add hourly production
      currentResources.wood += currentProduction.wood;
      currentResources.clay += currentProduction.clay;
      currentResources.iron += currentProduction.iron;
      currentResources.crop += currentProduction.crop - this.gameState.cropConsumption;
      
      // Check storage limits
      if (currentResources.wood > this.gameState.warehouseCapacity) {
        currentResources.wood = this.gameState.warehouseCapacity;
        entry.events.push({ type: 'overflow', resource: 'wood' });
      }
      if (currentResources.clay > this.gameState.warehouseCapacity) {
        currentResources.clay = this.gameState.warehouseCapacity;
        entry.events.push({ type: 'overflow', resource: 'clay' });
      }
      if (currentResources.iron > this.gameState.warehouseCapacity) {
        currentResources.iron = this.gameState.warehouseCapacity;
        entry.events.push({ type: 'overflow', resource: 'iron' });
      }
      if (currentResources.crop > this.gameState.granaryCapacity) {
        currentResources.crop = this.gameState.granaryCapacity;
        entry.events.push({ type: 'overflow', resource: 'crop' });
      }
      
      // Process planned buildings
      for (const planned of this.gameState.plannedBuildings) {
        const currentLevel = currentBuildings.get(planned.buildingId) || 0;
        if (currentLevel < planned.targetLevel) {
          const cost = calculateBuildingCost(planned.buildingId, currentLevel);
          
          if (cost && this.canAfford(currentResources, cost)) {
            // Deduct cost
            currentResources.wood -= cost.wood;
            currentResources.clay -= cost.clay;
            currentResources.iron -= cost.iron;
            currentResources.crop -= cost.crop;
            
            // Schedule completion
            const buildTime = calculateBuildTime(
              planned.buildingId,
              currentLevel + 1,
              currentBuildings.get(BuildingId.MAIN_BUILDING) || 0,
              this.gameState.serverSpeed
            );
            
            entry.events.push({
              type: 'building_started',
              building: planned.buildingId,
              level: currentLevel + 1,
              completionHour: hour + Math.ceil(buildTime / 3600),
            });
            
            // Update building level when complete
            const completionHour = hour + Math.ceil(buildTime / 3600);
            if (completionHour < hoursToProject) {
              // Schedule the completion event
              // (In real implementation, would track this properly)
              currentBuildings.set(planned.buildingId, currentLevel + 1);
              
              // Update production if it's a resource field
              if (planned.buildingId <= 4) {
                const newProduction = RESOURCE_PRODUCTION[currentLevel + 1] - RESOURCE_PRODUCTION[currentLevel];
                switch (planned.buildingId) {
                  case BuildingId.WOODCUTTER:
                    currentProduction.wood += newProduction;
                    break;
                  case BuildingId.CLAY_PIT:
                    currentProduction.clay += newProduction;
                    break;
                  case BuildingId.IRON_MINE:
                    currentProduction.iron += newProduction;
                    break;
                  case BuildingId.CROPLAND:
                    currentProduction.crop += newProduction;
                    break;
                }
              }
              
              // Update CP generation
              const building = BUILDINGS[planned.buildingId];
              if (building) {
                currentCP += building.culturePoints * (currentLevel + 1);
              }
            }
          }
        }
      }
      
      // Add daily CP at midnight
      if (hour % 24 === 0) {
        const dailyCP = this.calculateDailyCPFromBuildings(currentBuildings);
        currentCP += dailyCP;
        entry.events.push({ type: 'daily_cp', amount: dailyCP });
      }
      
      timeline.push(entry);
    }
    
    return timeline;
  }
  
  /**
   * Find when all settlement conditions are met
   */
  private findSettlementPoint(timeline: TimelineEntry[]): {
    time: Date;
    hours: number;
    bottleneck: 'culture_points' | 'resources' | 'buildings';
  } {
    let cpMetHour = -1;
    let resourcesMetHour = -1;
    let buildingsMetHour = -1;
    
    const settlerCost = SETTLER_COSTS[this.gameState.tribe] || SETTLER_COSTS.Romans;
    
    for (const entry of timeline) {
      // Check CP
      if (cpMetHour === -1 && entry.culturePoints >= this.gameState.targetCP) {
        cpMetHour = entry.hour;
      }
      
      // Check resources
      if (resourcesMetHour === -1 && 
          entry.resources.wood >= settlerCost.wood &&
          entry.resources.clay >= settlerCost.clay &&
          entry.resources.iron >= settlerCost.iron &&
          entry.resources.crop >= settlerCost.crop) {
        resourcesMetHour = entry.hour;
      }
      
      // Check buildings (simplified - would need proper prerequisite checking)
      const hasPrerequisites = 
        (entry.resources.wood > 0) && // Placeholder for actual building checks
        this.checkBuildingPrerequisites(timeline, entry.hour);
      
      if (buildingsMetHour === -1 && hasPrerequisites) {
        buildingsMetHour = entry.hour;
      }
      
      // If all conditions met
      if (cpMetHour > -1 && resourcesMetHour > -1 && buildingsMetHour > -1) {
        break;
      }
    }
    
    // Determine bottleneck
    const maxHour = Math.max(cpMetHour, resourcesMetHour, buildingsMetHour);
    let bottleneck: 'culture_points' | 'resources' | 'buildings';
    
    if (cpMetHour === maxHour) {
      bottleneck = 'culture_points';
    } else if (resourcesMetHour === maxHour) {
      bottleneck = 'resources';
    } else {
      bottleneck = 'buildings';
    }
    
    return {
      time: timeline[maxHour]?.time || new Date(),
      hours: maxHour,
      bottleneck,
    };
  }
  
  /**
   * Check if we can afford a cost
   */
  private canAfford(resources: Resources, cost: Resources): boolean {
    return resources.wood >= cost.wood &&
           resources.clay >= cost.clay &&
           resources.iron >= cost.iron &&
           resources.crop >= cost.crop;
  }
  
  /**
   * Calculate daily CP from a set of buildings
   */
  private calculateDailyCPFromBuildings(buildings: Map<BuildingId, number>): number {
    let dailyCP = 0;
    
    buildings.forEach((level, buildingId) => {
      const building = BUILDINGS[buildingId];
      if (!building) return;
      
      // Sum CP for all levels
      for (let i = 1; i <= level; i++) {
        dailyCP += building.culturePoints * i;
      }
    });
    
    return dailyCP;
  }
  
  /**
   * Check building prerequisites
   */
  private checkBuildingPrerequisites(timeline: TimelineEntry[], hour: number): boolean {
    // Simplified check - would need full implementation
    const entry = timeline[hour];
    if (!entry) return false;
    
    // Check for key buildings needed for settlers
    // This is a placeholder - real implementation would check actual levels
    return true;
  }
  
  /**
   * Calculate net resources needed accounting for production
   */
  private calculateNetResourcesNeeded(timeline: TimelineEntry[]): Resources {
    const lastEntry = timeline[timeline.length - 1];
    const settlerCost = SETTLER_COSTS[this.gameState.tribe] || SETTLER_COSTS.Romans;
    
    return {
      wood: Math.max(0, settlerCost.wood - lastEntry.resources.wood),
      clay: Math.max(0, settlerCost.clay - lastEntry.resources.clay),
      iron: Math.max(0, settlerCost.iron - lastEntry.resources.iron),
      crop: Math.max(0, settlerCost.crop - lastEntry.resources.crop),
    };
  }
  
  /**
   * Generate recommendations based on integrated timeline
   */
  private generateSmartRecommendations(settlementPoint: any): string[] {
    const recommendations: string[] = [];
    
    // Analyze timeline for optimization opportunities
    recommendations.push(`Settlement possible in ${settlementPoint.hours} hours`);
    recommendations.push(`Limiting factor: ${settlementPoint.bottleneck}`);
    
    // Add specific recommendations based on bottleneck
    // (Implementation would analyze timeline for specific improvements)
    
    return recommendations;
  }
  
  /**
   * Identify risks in the timeline
   */
  private identifyRisks(timeline: TimelineEntry[]): string[] {
    const warnings: string[] = [];
    
    // Check for overflow events
    const overflowEvents = timeline.filter(e => 
      e.events.some(event => event.type === 'overflow')
    );
    
    if (overflowEvents.length > 0) {
      warnings.push(`Resource overflow detected at hour ${overflowEvents[0].hour}`);
    }
    
    // Check for crop starvation
    const starvationPoint = timeline.find(e => e.resources.crop < 0);
    if (starvationPoint) {
      warnings.push(`Crop shortage predicted at hour ${starvationPoint.hour}`);
    }
    
    return warnings;
  }
  
  // ... other helper methods
}

interface TimelineEntry {
  hour: number;
  time: Date;
  resources: Resources;
  culturePoints: number;
  production: Resources;
  events: Array<{
    type: string;
    [key: string]: any;
  }>;
}

interface SettlementPrediction {
  estimatedTime: Date;
  hoursToSettlement: number;
  bottleneck: 'culture_points' | 'resources' | 'buildings';
  currentCP: number;
  cpNeeded: number;
  cpPerDay: number;
  resourcesNeeded: Resources;
  timeline: TimelineEntry[];
  recommendations: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
  warnings: string[];
}
