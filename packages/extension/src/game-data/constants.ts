/**
 * Game constants for quick reference
 */

export const GameConstants = {
  // Building limits
  MAX_LEVEL_RESOURCE: 20,
  MAX_LEVEL_BUILDING: 20,
  MAX_LEVEL_WALL: 20,
  MAX_LEVEL_SPECIAL: 10, // For unique buildings
  
  // Village limits
  MAX_VILLAGES: 999, // Theoretical max, practical is much lower
  STARTING_VILLAGES: 1,
  
  // Map sizes
  WORLD_SIZES: {
    SMALL: 401,    // 401x401
    MEDIUM: 601,   // 601x601
    LARGE: 801     // 801x801
  },
  
  // Troop speeds at 1x (fields per hour)
  TROOP_SPEED_BASE: {
    // Romans
    LEGIONNAIRE: 6,
    PRAETORIAN: 5,
    IMPERIAN: 7,
    EQUITES_LEGATI: 16,
    EQUITES_IMPERATORIS: 14,
    EQUITES_CAESARIS: 10,
    BATTERING_RAM: 4,
    FIRE_CATAPULT: 3,
    SENATOR: 4,
    SETTLER: 5,
    
    // Teutons
    CLUBSWINGER: 7,
    SPEARMAN: 7,
    AXEMAN: 6,
    SCOUT: 9,
    PALADIN: 10,
    TEUTONIC_KNIGHT: 9,
    RAM: 4,
    CATAPULT: 3,
    CHIEF: 4,
    TEUTON_SETTLER: 5,
    
    // Gauls
    PHALANX: 7,
    SWORDSMAN: 6,
    PATHFINDER: 17,
    THEUTATES_THUNDER: 19,
    DRUIDRIDER: 16,
    HAEDUAN: 13,
    GAUL_RAM: 4,
    TREBUCHET: 3,
    CHIEFTAIN: 5,
    GAUL_SETTLER: 5,
    
    // Average speeds for quick calculations
    INFANTRY_AVG: 6,
    CAVALRY_AVG: 14,
    SCOUT_AVG: 14,
    SIEGE_AVG: 3.5,
    MERCHANT: 16
  },
  
  // Resource related
  RESOURCE_TYPES: ['wood', 'clay', 'iron', 'crop'],
  OASIS_BONUS: {
    '25_SINGLE': 25,    // 25% to one resource
    '25_DOUBLE': 25,    // 25% to two resources (12.5% each effectively)
    '50_SINGLE': 50     // 50% to one resource (croppers)
  },
  
  // Time constants (in seconds at 1x speed)
  CELEBRATION_TIME: {
    SMALL: 24 * 3600,   // 24 hours
    GREAT: 24 * 3600    // 24 hours
  },
  
  // Quest related
  QUEST_REWARD_MULTIPLIER: 1.5,
  
  // Battle mechanics
  WALL_BONUS: {
    BASIC: 0.03,        // 3% per level
    CITY: 0.02,         // 2% per level for city wall
    EARTH: 0.04,        // 4% per level for earth wall
    PALISADE: 0.025     // 2.5% per level
  },
  
  // Culture points for expansion
  CP_REQUIREMENTS: [
    0,      // 1st village (starting)
    2000,   // 2nd village
    8000,   // 3rd village
    20000,  // 4th village
    40000,  // 5th village
    80000,  // 6th village
    150000, // 7th village
    300000, // 8th village
    600000, // 9th village
    1000000 // 10th village
  ],
  
  // Hero
  HERO_PRODUCTION_BONUS: 0.2, // 20% per point
  HERO_SPEED_BONUS: 0.05,     // 5% per point
  HERO_ATTACK_BONUS: 100,     // Per point
  HERO_DEFENSE_BONUS: 80,     // Per point
  
  // Trade
  MERCHANT_CAPACITY: {
    ROMANS: 500,
    TEUTONS: 1000,
    GAULS: 750,
    EGYPTIANS: 750,
    HUNS: 500
  },
  
  // Artifacts (when they become relevant)
  ARTIFACT_SPAWN_DAY: 60,
  WW_SPAWN_DAY: 120,
  
  // NPC Trading
  NPC_RATIO: 1.0, // 1:1 trade ratio
  
  // Building multipliers
  BUILDING_COST_MULTIPLIER: {
    DEFAULT: 1.28,
    RESOURCE_FIELD: 1.67,
    WAREHOUSE: 1.28,
    GRANARY: 1.28,
    GREAT_WAREHOUSE: 1.28,
    GREAT_GRANARY: 1.28
  }
};

/**
 * Server-specific adjustments
 */
export function getAdjustedConstant(constant: number, serverSpeed: number): number {
  return constant / serverSpeed;
}
