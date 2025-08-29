/**
 * Travian game formulas and calculations
 * Based on Kirilloid's calculator formulas
 */

import { ServerConfig, adjustTimeForServerSpeed, adjustTravelTimeForServerSpeed, adjustTrainingTimeForServerSpeed } from './server-config';
import { Resources, BuildingCost, Coordinates, TroopStats } from './types';

/**
 * Core Formulas from Kirilloid
 */
export const Formulas = {
  /**
   * Calculate building cost for a specific level
   * Formula: base_cost * multiplier ^ (level - 1)
   * Where multiplier varies by building type
   */
  calculateBuildingCost(baseCost: Resources, level: number, multiplier: number = 1.28): Resources {
    const factor = Math.pow(multiplier, level - 1);
    return {
      wood: Math.round(baseCost.wood * factor),
      clay: Math.round(baseCost.clay * factor),
      iron: Math.round(baseCost.iron * factor),
      crop: Math.round(baseCost.crop * factor)
    };
  },

  /**
   * Calculate total resources needed to build from level A to level B
   */
  calculateTotalBuildCost(baseCost: Resources, fromLevel: number, toLevel: number, multiplier: number = 1.28): Resources {
    let total = { wood: 0, clay: 0, iron: 0, crop: 0 };
    
    for (let level = fromLevel + 1; level <= toLevel; level++) {
      const levelCost = this.calculateBuildingCost(baseCost, level, multiplier);
      total.wood += levelCost.wood;
      total.clay += levelCost.clay;
      total.iron += levelCost.iron;
      total.crop += levelCost.crop;
    }
    
    return total;
  },

  /**
   * Calculate building time for a level
   * Formula varies by building type, this is simplified version
   */
  calculateBuildingTime(baseCost: Resources, level: number, mainBuildingLevel: number = 1): number {
    // Simplified formula - actual formula is complex
    const totalResources = baseCost.wood + baseCost.clay + baseCost.iron + baseCost.crop;
    const levelFactor = Math.pow(1.28, level - 1);
    const baseTime = (totalResources * levelFactor) / 100;
    
    // Main building reduction: 3% per level
    const mainBuildingReduction = 1 - (mainBuildingLevel * 0.03);
    const timeInSeconds = baseTime * mainBuildingReduction;
    
    // Adjust for server speed
    return adjustTimeForServerSpeed(timeInSeconds);
  },

  /**
   * Calculate resource production per hour
   * Based on field level and oasis bonuses
   */
  calculateResourceProduction(fieldLevel: number, baseProduction: number, oasisBonus: number = 0): number {
    // Production formula from Kirilloid
    const levelProduction = [
      0, 2, 5, 9, 15, 22, 33, 50, 70, 100, // Levels 0-9
      145, 200, 280, 375, 495, 635, 800, 1000, 1300, 1600, 2000 // Levels 10-20
    ];

    if (fieldLevel < 0 || fieldLevel >= levelProduction.length) {
      return 0;
    }

    const production = levelProduction[fieldLevel] * baseProduction;
    const withOasis = production * (1 + oasisBonus / 100);
    
    // Production is already per hour, server speed affects accumulation rate
    return Math.round(withOasis * ServerConfig.speed);
  },

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Handle map wrapping for Travian's circular map
    const mapSize = ServerConfig.worldSize;
    const halfMap = Math.floor(mapSize / 2);
    
    let adjustedDx = dx;
    let adjustedDy = dy;
    
    if (Math.abs(dx) > halfMap) {
      adjustedDx = dx > 0 ? dx - mapSize : dx + mapSize;
    }
    if (Math.abs(dy) > halfMap) {
      adjustedDy = dy > 0 ? dy - mapSize : dy + mapSize;
    }
    
    return Math.sqrt(adjustedDx * adjustedDx + adjustedDy * adjustedDy);
  },

  /**
   * Calculate travel time between coordinates
   * @param speed - Fields per hour at 1x speed
   */
  calculateTravelTime(from: Coordinates, to: Coordinates, speed: number): number {
    const distance = this.calculateDistance(from, to);
    const baseTimeHours = distance / speed;
    return adjustTravelTimeForServerSpeed(baseTimeHours);
  },

  /**
   * Calculate time to accumulate resources
   * Returns hours needed to accumulate the resources
   */
  calculateAccumulationTime(needed: Resources, production: Resources): number {
    const times = [
      needed.wood > 0 ? needed.wood / production.wood : 0,
      needed.clay > 0 ? needed.clay / production.clay : 0,
      needed.iron > 0 ? needed.iron / production.iron : 0,
      needed.crop > 0 ? needed.crop / production.crop : 0
    ].filter(t => t > 0);
    
    // The bottleneck resource determines the time
    return times.length > 0 ? Math.max(...times) : 0;
  },

  /**
   * Calculate training time for troops
   */
  calculateTrainingTime(baseTrainingSeconds: number, barracksLevel: number = 1): number {
    // Each barracks level reduces training time
    const speedBonus = 1 + (barracksLevel - 1) * 0.1; // 10% per level
    const adjustedTime = baseTrainingSeconds / speedBonus;
    return adjustTrainingTimeForServerSpeed(adjustedTime);
  },

  /**
   * Calculate total troop cost
   */
  calculateTroopCost(troopCost: Resources, quantity: number): Resources {
    return {
      wood: troopCost.wood * quantity,
      clay: troopCost.clay * quantity,
      iron: troopCost.iron * quantity,
      crop: troopCost.crop * quantity
    };
  },

  /**
   * Calculate merchant capacity
   */
  calculateMerchantCapacity(tribe: string, tradeOfficeLevel: number = 0): number {
    const baseCapacity = {
      'romans': 500,
      'teutons': 1000,
      'gauls': 750,
      'egyptians': 750,
      'huns': 500
    };

    const capacity = baseCapacity[tribe.toLowerCase()] || 500;
    const bonus = 1 + (tradeOfficeLevel * 0.1); // 10% per level
    return Math.floor(capacity * bonus);
  },

  /**
   * Calculate culture points production
   */
  calculateCulturePoints(buildings: { level: number, cpProduction: number }[]): number {
    return buildings.reduce((total, building) => {
      return total + (building.cpProduction * building.level);
    }, 0);
  },

  /**
   * Calculate warehouse capacity
   */
  calculateWarehouseCapacity(level: number): number {
    const baseCapacities = [
      0, 1200, 1700, 2300, 3100, 4000, 5000, 6300, 7800, 9600, 11800, // 0-10
      14400, 17600, 21400, 26000, 31600, 38300, 46400, 56100, 67900, 82000 // 11-20
    ];
    return level < baseCapacities.length ? baseCapacities[level] : 0;
  },

  /**
   * Calculate granary capacity
   */
  calculateGranaryCapacity(level: number): number {
    // Same as warehouse for regular granary
    return this.calculateWarehouseCapacity(level);
  },

  /**
   * Calculate crop consumption
   */
  calculateCropConsumption(troops: { count: number, consumption: number }[]): number {
    return troops.reduce((total, troop) => {
      return total + (troop.count * troop.consumption);
    }, 0);
  },

  /**
   * Calculate hero experience needed for level
   */
  calculateHeroExperience(level: number): number {
    // Simplified formula - actual is more complex
    return Math.round(100 * Math.pow(1.5, level - 1));
  },

  /**
   * Calculate raid profit efficiency
   */
  calculateRaidEfficiency(distance: number, loot: Resources, troopConsumption: number, travelSpeed: number): number {
    const travelTime = (distance / travelSpeed) * 2; // Round trip
    const totalLoot = loot.wood + loot.clay + loot.iron + loot.crop;
    const consumptionCost = troopConsumption * travelTime;
    const profit = totalLoot - consumptionCost;
    return profit / travelTime; // Resources per hour
  },

  /**
   * Calculate building destruction time (catapult calculations)
   */
  calculateCatapultHits(buildingLevel: number, catapultCount: number): number {
    // Simplified - actual formula is complex and depends on many factors
    const hitsNeeded = Math.ceil(buildingLevel * 2 / Math.sqrt(catapultCount));
    return hitsNeeded;
  },

  /**
   * Calculate celebration cost
   */
  calculateCelebrationCost(type: 'small' | 'great', villagePopulation: number): Resources {
    if (type === 'small') {
      return {
        wood: 6400,
        clay: 6650,
        iron: 5940,
        crop: 1340
      };
    } else {
      return {
        wood: 29700,
        clay: 33250,
        iron: 32000,
        crop: 6700
      };
    }
  },

  /**
   * Calculate next settlement/village cost
   */
  calculateSettlementCost(villageCount: number): Resources {
    // Cost increases with each village
    const multiplier = Math.pow(1.5, villageCount);
    return {
      wood: Math.round(750 * multiplier),
      clay: Math.round(750 * multiplier),
      iron: Math.round(750 * multiplier),
      crop: Math.round(750 * multiplier)
    };
  }
};

/**
 * Helper function to format time in human-readable format
 */
export function formatTime(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.floor((hours % 1) * 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (remainingHours > 0) parts.push(`${remainingHours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '0m';
}

/**
 * Helper to calculate resource balance
 */
export function calculateResourceBalance(current: Resources, needed: Resources): Resources {
  return {
    wood: current.wood - needed.wood,
    clay: current.clay - needed.clay,
    iron: current.iron - needed.iron,
    crop: current.crop - needed.crop
  };
}

/**
 * Check if player has enough resources
 */
export function hasEnoughResources(current: Resources, needed: Resources): boolean {
  return current.wood >= needed.wood &&
         current.clay >= needed.clay &&
         current.iron >= needed.iron &&
         current.crop >= needed.crop;
}
