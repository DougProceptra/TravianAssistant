/**
 * Travian Game Constants extracted from Kirilloid
 * These are the core mechanics for T5 (Legends)
 */

// Resource types
export type Resources = {
  wood: number;
  clay: number;
  iron: number;
  crop: number;
};

// Building IDs matching Travian's internal IDs
export enum BuildingId {
  // Resource fields
  WOODCUTTER = 1,
  CLAY_PIT = 2,
  IRON_MINE = 3,
  CROPLAND = 4,
  SAWMILL = 5,
  BRICKYARD = 6,
  IRON_FOUNDRY = 7,
  GRAIN_MILL = 8,
  BAKERY = 9,
  
  // Infrastructure
  WAREHOUSE = 10,
  GRANARY = 11,
  MAIN_BUILDING = 15,
  RALLY_POINT = 16,
  MARKETPLACE = 17,
  EMBASSY = 18,
  
  // Military
  BARRACKS = 19,
  STABLES = 20,
  WORKSHOP = 21,
  ACADEMY = 22,
  BLACKSMITH = 12,
  ARMORY = 13,
  
  // Village
  RESIDENCE = 25,
  PALACE = 26,
  TOWN_HALL = 24,
  TREASURY = 27,
  TRADE_OFFICE = 28,
  
  // Defense
  CRANNY = 23,
  CITY_WALL = 31, // Romans
  EARTH_WALL = 32, // Teutons
  PALISADE = 33, // Gauls
  MAKESHIFT_WALL = 34, // Natars
  STONEMASON = 35,
  BREWERY = 36,
  TRAPPER = 37,
  
  // Special
  HERO_MANSION = 38,
  GREAT_WAREHOUSE = 39,
  GREAT_GRANARY = 40,
  WATER_DITCH = 41,
  NATARIAN_WALL = 42,
  WONDER_OF_THE_WORLD = 40,
}

// Building data structure from Kirilloid
// Format: c: [wood, clay, iron, crop], k: cost multiplier, cp: culture points, u: population
export interface BuildingData {
  name: string;
  baseCost: Resources;
  costMultiplier: number; // k value - cost increases by this factor per level
  culturePoints: number; // Base CP generated
  population: number; // Population cost
  maxLevel: number;
  prerequisites?: { [key in BuildingId]?: number }; // Required buildings and their levels
  unique?: boolean; // Can only build one per account
}

// Critical buildings for settlement
export const BUILDINGS: Partial<Record<BuildingId, BuildingData>> = {
  [BuildingId.MAIN_BUILDING]: {
    name: 'Main Building',
    baseCost: { wood: 70, clay: 40, iron: 60, crop: 20 },
    costMultiplier: 1.28,
    culturePoints: 2,
    population: 2,
    maxLevel: 20,
  },
  
  [BuildingId.BARRACKS]: {
    name: 'Barracks',
    baseCost: { wood: 210, clay: 140, iron: 260, crop: 120 },
    costMultiplier: 1.28,
    culturePoints: 1,
    population: 4,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 3,
      [BuildingId.RALLY_POINT]: 1,
    },
  },
  
  [BuildingId.ACADEMY]: {
    name: 'Academy',
    baseCost: { wood: 220, clay: 160, iron: 90, crop: 40 },
    costMultiplier: 1.28,
    culturePoints: 4,
    population: 4,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 3,
      [BuildingId.BARRACKS]: 3,
    },
  },
  
  [BuildingId.RESIDENCE]: {
    name: 'Residence',
    baseCost: { wood: 580, clay: 460, iron: 350, crop: 180 },
    costMultiplier: 1.28,
    culturePoints: 2,
    population: 1,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 5,
      // Note: Cannot build if Palace exists
    },
  },
  
  [BuildingId.PALACE]: {
    name: 'Palace',
    baseCost: { wood: 550, clay: 800, iron: 750, crop: 250 },
    costMultiplier: 1.28,
    culturePoints: 5,
    population: 1,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 5,
      [BuildingId.EMBASSY]: 1,
      // Note: Cannot build if Residence exists
    },
    unique: true, // Only one per account
  },
  
  [BuildingId.WAREHOUSE]: {
    name: 'Warehouse',
    baseCost: { wood: 130, clay: 160, iron: 90, crop: 40 },
    costMultiplier: 1.28,
    culturePoints: 1,
    population: 1,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 1,
    },
  },
  
  [BuildingId.GRANARY]: {
    name: 'Granary',
    baseCost: { wood: 80, clay: 100, iron: 70, crop: 20 },
    costMultiplier: 1.28,
    culturePoints: 1,
    population: 1,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 1,
    },
  },
  
  [BuildingId.MARKETPLACE]: {
    name: 'Marketplace',
    baseCost: { wood: 80, clay: 70, iron: 120, crop: 70 },
    costMultiplier: 1.28,
    culturePoints: 3,
    population: 4,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 3,
      [BuildingId.WAREHOUSE]: 1,
      [BuildingId.GRANARY]: 1,
    },
  },
  
  [BuildingId.EMBASSY]: {
    name: 'Embassy',
    baseCost: { wood: 180, clay: 130, iron: 150, crop: 80 },
    costMultiplier: 1.28,
    culturePoints: 4,
    population: 3,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 1,
    },
  },
  
  [BuildingId.TOWN_HALL]: {
    name: 'Town Hall',
    baseCost: { wood: 1250, clay: 1110, iron: 1260, crop: 600 },
    costMultiplier: 1.28,
    culturePoints: 5,
    population: 4,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 10,
      [BuildingId.ACADEMY]: 10,
    },
  },
  
  // HERO MANSION - CORRECTED VALUES FROM KIRILLOID
  [BuildingId.HERO_MANSION]: {
    name: 'Hero Mansion',
    baseCost: { wood: 700, clay: 670, iron: 700, crop: 240 },
    costMultiplier: 1.28,
    culturePoints: 2,
    population: 2,
    maxLevel: 20,
    prerequisites: {
      [BuildingId.MAIN_BUILDING]: 3,
      [BuildingId.RALLY_POINT]: 1,
    },
  },
  
  // Resource fields
  [BuildingId.WOODCUTTER]: {
    name: 'Woodcutter',
    baseCost: { wood: 40, clay: 100, iron: 50, crop: 60 },
    costMultiplier: 1.67,
    culturePoints: 1,
    population: 2,
    maxLevel: 20,
  },
  
  [BuildingId.CLAY_PIT]: {
    name: 'Clay Pit',
    baseCost: { wood: 80, clay: 40, iron: 80, crop: 50 },
    costMultiplier: 1.67,
    culturePoints: 1,
    population: 2,
    maxLevel: 20,
  },
  
  [BuildingId.IRON_MINE]: {
    name: 'Iron Mine', 
    baseCost: { wood: 100, clay: 80, iron: 30, crop: 60 },
    costMultiplier: 1.67,
    culturePoints: 1,
    population: 3,
    maxLevel: 20,
  },
  
  [BuildingId.CROPLAND]: {
    name: 'Cropland',
    baseCost: { wood: 70, clay: 90, iron: 70, crop: 20 },
    costMultiplier: 1.67,
    culturePoints: 1,
    population: 0,
    maxLevel: 20,
  },
};

// UNIT DATA - Adding to match Kirilloid structure
export const UNITS = {
  // Romans
  LEGIONNAIRE: {
    name: 'Legionnaire',
    cost: { wood: 120, clay: 100, iron: 150, crop: 30 },
    time: 1600, // seconds at 1x speed
    attack: 40,
    defInf: 35,
    defCav: 50,
    speed: 6,
    capacity: 50,
    consumption: 1
  },
  // Add more units as needed
};

// Culture Points required for additional villages
export const CULTURE_POINTS_FOR_VILLAGES = [
  0,     // 1st village (start)
  200,   // 2nd village (first settlement)
  500,   // 3rd village
  1000,  // 4th village
  2000,  // 5th village
  3500,  // 6th village
  6000,  // 7th village
  10000, // 8th village
  15000, // 9th village
  25000, // 10th village
];

// Settler costs by tribe (3 settlers needed)
export const SETTLER_COSTS: Record<string, Resources> = {
  Romans: { wood: 5800, clay: 5300, iron: 7200, crop: 5500 },    // Total: 23,800
  Teutons: { wood: 7200, clay: 5500, iron: 5800, crop: 6500 },   // Total: 25,000
  Gauls: { wood: 5500, clay: 7000, iron: 5300, crop: 4900 },     // Total: 22,700
  Egyptians: { wood: 5500, clay: 6200, iron: 5600, crop: 5300 }, // Total: 22,600 (rough estimate)
  Huns: { wood: 5800, clay: 5300, iron: 7200, crop: 5500 },      // Total: 23,800 (same as Romans)
};

// Resource field production per level (base, no oasis bonus)
export const RESOURCE_PRODUCTION = [
  2,   // Level 0
  5,   // Level 1
  8,   // Level 2
  12,  // Level 3
  17,  // Level 4
  23,  // Level 5
  30,  // Level 6
  38,  // Level 7
  47,  // Level 8
  57,  // Level 9
  68,  // Level 10
  80,  // Level 11
  93,  // Level 12
  107, // Level 13
  122, // Level 14
  138, // Level 15
  155, // Level 16
  173, // Level 17
  192, // Level 18
  212, // Level 19
  233, // Level 20
];

// Server speed modifiers
export const SERVER_SPEEDS = {
  '1x': { resources: 1, troops: 1, buildings: 1 },
  '2x': { resources: 2, troops: 0.5, buildings: 0.5 },
  '3x': { resources: 3, troops: 0.33, buildings: 0.33 },
  '5x': { resources: 5, troops: 0.2, buildings: 0.2 },
  '10x': { resources: 10, troops: 0.1, buildings: 0.1 },
};

// Helper functions
export function calculateBuildingCost(
  buildingId: BuildingId,
  currentLevel: number
): Resources | null {
  const building = BUILDINGS[buildingId];
  if (!building) return null;
  
  const multiplier = Math.pow(building.costMultiplier, currentLevel);
  
  return {
    wood: Math.round(building.baseCost.wood * multiplier),
    clay: Math.round(building.baseCost.clay * multiplier),
    iron: Math.round(building.baseCost.iron * multiplier),
    crop: Math.round(building.baseCost.crop * multiplier),
  };
}

export function calculateCulturePoints(buildings: Map<BuildingId, number>): number {
  let totalCP = 0;
  
  buildings.forEach((level, buildingId) => {
    const building = BUILDINGS[buildingId];
    if (!building) return;
    
    // CP formula: base * (level * (level + 1)) / 2
    for (let i = 1; i <= level; i++) {
      totalCP += building.culturePoints * i;
    }
  });
  
  return totalCP;
}

export function canBuildBuilding(
  buildingId: BuildingId,
  currentBuildings: Map<BuildingId, number>
): { canBuild: boolean; missingPrereqs: string[] } {
  const building = BUILDINGS[buildingId];
  if (!building) return { canBuild: false, missingPrereqs: ['Unknown building'] };
  
  const missingPrereqs: string[] = [];
  
  if (building.prerequisites) {
    for (const [prereqId, requiredLevel] of Object.entries(building.prerequisites)) {
      const currentLevel = currentBuildings.get(Number(prereqId)) || 0;
      if (currentLevel < requiredLevel) {
        const prereqBuilding = BUILDINGS[Number(prereqId) as BuildingId];
        missingPrereqs.push(
          `${prereqBuilding?.name || 'Unknown'} level ${requiredLevel} (current: ${currentLevel})`
        );
      }
    }
  }
  
  // Check for mutually exclusive buildings
  if (buildingId === BuildingId.RESIDENCE && currentBuildings.has(BuildingId.PALACE)) {
    missingPrereqs.push('Cannot build Residence when Palace exists');
  }
  if (buildingId === BuildingId.PALACE && currentBuildings.has(BuildingId.RESIDENCE)) {
    missingPrereqs.push('Cannot build Palace when Residence exists');
  }
  
  return {
    canBuild: missingPrereqs.length === 0,
    missingPrereqs,
  };
}

// Settlement path calculation
export function calculateSettlerPath(): string[] {
  return [
    'Main Building → Level 3 (for Barracks)',
    'Rally Point → Level 1',
    'Barracks → Level 3 (for Academy)',
    'Main Building → Level 5 (for Residence)',
    'Academy → Level 10 (unlocks settlers)',
    'Residence or Palace → Level 10 (to train settlers)',
    'Train 3 Settlers',
  ];
}

// CORRECTED BUILD TIME CALCULATION BASED ON KIRILLOID
// The formula is more complex than previously implemented
export function calculateBuildTime(
  buildingId: BuildingId,
  level: number,
  mainBuildingLevel: number = 0,
  serverSpeed: number = 1
): number {
  const building = BUILDINGS[buildingId];
  if (!building) return 0;
  
  // Base cost sum
  const baseCostSum = building.baseCost.wood + building.baseCost.clay + 
                      building.baseCost.iron + building.baseCost.crop;
  
  // Cost at current level
  const multiplier = Math.pow(building.costMultiplier, level - 1);
  const levelCostSum = baseCostSum * multiplier;
  
  // Complex time formula from Kirilloid
  // This approximates the actual formula - exact values would need to be mapped
  let baseSeconds: number;
  
  if (levelCostSum < 200) {
    baseSeconds = levelCostSum * 10;
  } else if (levelCostSum < 2000) {
    baseSeconds = levelCostSum * 15;
  } else if (levelCostSum < 10000) {
    baseSeconds = levelCostSum * 20;
  } else {
    baseSeconds = levelCostSum * 25;
  }
  
  // Main building reduction (3% per level, max 70% at level 20+)
  const mbReduction = Math.min(0.7, mainBuildingLevel * 0.03);
  const finalTime = baseSeconds * (1 - mbReduction);
  
  // Apply server speed
  return Math.round(finalTime / serverSpeed);
}

// Exact build times for Hero Mansion from Kirilloid (in seconds at 1x speed, MB level 20)
// These override the calculated values for accuracy
export const HERO_MANSION_BUILD_TIMES: { [level: number]: number } = {
  1: 2160,   // 36m
  2: 2760,   // 46m
  3: 3520,   // 58m 40s
  4: 4500,   // 1h 15m
  5: 5740,   // 1h 35m 40s
  6: 7320,   // 2h 2m
  7: 9360,   // 2h 36m
  8: 11940,  // 3h 19m
  9: 15220,  // 4h 13m 40s
  10: 19420, // 5h 23m 40s
  11: 24780, // 6h 53m
  12: 31620, // 8h 47m
  13: 40320, // 11h 12m
  14: 51440, // 14h 17m 20s
  15: 65640, // 18h 14m
  16: 83760, // 23h 16m
  17: 106880, // 29h 41m 20s
  18: 136360, // 37h 52m 40s
  19: 174020, // 48h 20m 20s
  20: 222000  // 61h 40m
};
