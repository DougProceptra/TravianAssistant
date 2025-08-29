/**
 * COMPLETE Travian Building Data from Kirilloid
 * This file contains ALL buildings with exact values
 * Source: kirilloid.ru/travian/
 */

import { Resources } from './types';

// Building cost data from Kirilloid - COMPLETE SET
export const KIRILLOID_BUILDINGS = {
  // Infrastructure
  MAIN_BUILDING: {
    name: 'Main Building',
    baseCost: { wood: 70, clay: 40, iron: 60, crop: 20 },
    multiplier: 1.28,
    cp: 2,
    pop: 2
  },
  
  WAREHOUSE: {
    name: 'Warehouse',
    baseCost: { wood: 130, clay: 160, iron: 90, crop: 40 },
    multiplier: 1.28,
    cp: 1,
    pop: 1
  },
  
  GRANARY: {
    name: 'Granary',
    baseCost: { wood: 80, clay: 100, iron: 70, crop: 20 },
    multiplier: 1.28,
    cp: 1,
    pop: 1
  },
  
  CRANNY: {
    name: 'Cranny',
    baseCost: { wood: 40, clay: 50, iron: 30, crop: 10 },
    multiplier: 1.25,
    cp: 0,
    pop: 0
  },
  
  // Military Buildings
  RALLY_POINT: {
    name: 'Rally Point',
    baseCost: { wood: 110, clay: 160, iron: 90, crop: 70 },
    multiplier: 1.28,
    cp: 1,
    pop: 1
  },
  
  BARRACKS: {
    name: 'Barracks',
    baseCost: { wood: 210, clay: 140, iron: 260, crop: 120 },
    multiplier: 1.28,
    cp: 1,
    pop: 4
  },
  
  STABLES: {
    name: 'Stables',
    baseCost: { wood: 260, clay: 140, iron: 220, crop: 100 },
    multiplier: 1.28,
    cp: 2,
    pop: 5
  },
  
  WORKSHOP: {
    name: 'Workshop',
    baseCost: { wood: 460, clay: 510, iron: 600, crop: 320 },
    multiplier: 1.28,
    cp: 3,
    pop: 3
  },
  
  ACADEMY: {
    name: 'Academy',
    baseCost: { wood: 220, clay: 160, iron: 90, crop: 40 },
    multiplier: 1.28,
    cp: 4,
    pop: 4
  },
  
  BLACKSMITH: {
    name: 'Blacksmith',
    baseCost: { wood: 170, clay: 200, iron: 380, crop: 130 },
    multiplier: 1.28,
    cp: 2,
    pop: 4
  },
  
  ARMORY: {
    name: 'Armory',
    baseCost: { wood: 130, clay: 210, iron: 410, crop: 130 },
    multiplier: 1.28,
    cp: 2,
    pop: 4
  },
  
  TOURNAMENT_SQUARE: {
    name: 'Tournament Square',
    baseCost: { wood: 1750, clay: 2250, iron: 1530, crop: 240 },
    multiplier: 1.28,
    cp: 1,
    pop: 2
  },
  
  // Economic Buildings
  MARKETPLACE: {
    name: 'Marketplace',
    baseCost: { wood: 80, clay: 70, iron: 120, crop: 70 },
    multiplier: 1.28,
    cp: 3,
    pop: 4
  },
  
  EMBASSY: {
    name: 'Embassy',
    baseCost: { wood: 180, clay: 130, iron: 150, crop: 80 },
    multiplier: 1.28,
    cp: 3,
    pop: 3
  },
  
  TRADE_OFFICE: {
    name: 'Trade Office',
    baseCost: { wood: 1400, clay: 1330, iron: 1200, crop: 400 },
    multiplier: 1.28,
    cp: 3,
    pop: 3
  },
  
  // Village Expansion
  RESIDENCE: {
    name: 'Residence',
    baseCost: { wood: 580, clay: 460, iron: 350, crop: 180 },
    multiplier: 1.28,
    cp: 2,
    pop: 1
  },
  
  PALACE: {
    name: 'Palace',
    baseCost: { wood: 550, clay: 800, iron: 750, crop: 250 },
    multiplier: 1.28,
    cp: 5,
    pop: 1
  },
  
  TREASURY: {
    name: 'Treasury',
    baseCost: { wood: 2880, clay: 2740, iron: 2580, crop: 990 },
    multiplier: 1.26,
    cp: 4,
    pop: 4
  },
  
  TOWN_HALL: {
    name: 'Town Hall',
    baseCost: { wood: 1250, clay: 1110, iron: 1260, crop: 600 },
    multiplier: 1.28,
    cp: 4,
    pop: 4
  },
  
  // Resource Bonus Buildings
  SAWMILL: {
    name: 'Sawmill',
    baseCost: { wood: 520, clay: 380, iron: 290, crop: 90 },
    multiplier: 1.28,
    cp: 1,
    pop: 4
  },
  
  BRICKYARD: {
    name: 'Brickyard',
    baseCost: { wood: 440, clay: 480, iron: 320, crop: 50 },
    multiplier: 1.28,
    cp: 1,
    pop: 3
  },
  
  IRON_FOUNDRY: {
    name: 'Iron Foundry',
    baseCost: { wood: 200, clay: 450, iron: 510, crop: 120 },
    multiplier: 1.28,
    cp: 1,
    pop: 3
  },
  
  GRAIN_MILL: {
    name: 'Grain Mill',
    baseCost: { wood: 500, clay: 440, iron: 380, crop: 1240 },
    multiplier: 1.28,
    cp: 1,
    pop: 3
  },
  
  BAKERY: {
    name: 'Bakery',
    baseCost: { wood: 1200, clay: 1480, iron: 870, crop: 1600 },
    multiplier: 1.28,
    cp: 2,
    pop: 4
  },
  
  // Special Buildings
  HERO_MANSION: {
    name: "Hero's Mansion",
    baseCost: { wood: 700, clay: 670, iron: 700, crop: 240 },
    multiplier: 1.28,
    cp: 2,
    pop: 2
  },
  
  GREAT_BARRACKS: {
    name: 'Great Barracks',
    baseCost: { wood: 630, clay: 420, iron: 780, crop: 360 },
    multiplier: 1.28,
    cp: 1,
    pop: 4
  },
  
  GREAT_STABLES: {
    name: 'Great Stables',
    baseCost: { wood: 780, clay: 420, iron: 660, crop: 300 },
    multiplier: 1.28,
    cp: 2,
    pop: 5
  },
  
  GREAT_WORKSHOP: {
    name: 'Great Workshop',
    baseCost: { wood: 1220, clay: 1480, iron: 870, crop: 1600 },
    multiplier: 1.28,
    cp: 3,
    pop: 3
  },
  
  GREAT_WAREHOUSE: {
    name: 'Great Warehouse',
    baseCost: { wood: 650, clay: 800, iron: 450, crop: 200 },
    multiplier: 1.28,
    cp: 1,
    pop: 1
  },
  
  GREAT_GRANARY: {
    name: 'Great Granary',
    baseCost: { wood: 400, clay: 500, iron: 350, crop: 100 },
    multiplier: 1.28,
    cp: 1,
    pop: 1
  },
  
  // Walls
  CITY_WALL: {
    name: 'City Wall',
    baseCost: { wood: 70, clay: 90, iron: 170, crop: 70 },
    multiplier: 1.28,
    cp: 0,
    pop: 0
  },
  
  EARTH_WALL: {
    name: 'Earth Wall',
    baseCost: { wood: 120, clay: 200, iron: 0, crop: 80 },
    multiplier: 1.28,
    cp: 0,
    pop: 0
  },
  
  PALISADE: {
    name: 'Palisade',
    baseCost: { wood: 160, clay: 100, iron: 80, crop: 60 },
    multiplier: 1.28,
    cp: 0,
    pop: 0
  },
  
  // Tribe-specific
  STONEMASON: {
    name: 'Stonemason',
    baseCost: { wood: 155, clay: 130, iron: 125, crop: 70 },
    multiplier: 1.28,
    cp: 1,
    pop: 2
  },
  
  BREWERY: {
    name: 'Brewery',
    baseCost: { wood: 1460, clay: 930, iron: 1250, crop: 1740 },
    multiplier: 1.28,
    cp: 4,
    pop: 6
  },
  
  TRAPPER: {
    name: 'Trapper',
    baseCost: { wood: 100, clay: 100, iron: 100, crop: 100 },
    multiplier: 1.25,
    cp: 1,
    pop: 4
  },
  
  HORSE_DRINKING_TROUGH: {
    name: 'Horse Drinking Trough',
    baseCost: { wood: 780, clay: 420, iron: 660, crop: 540 },
    multiplier: 1.28,
    cp: 3,
    pop: 4
  },
  
  // Wonder of World
  WONDER_OF_THE_WORLD: {
    name: 'Wonder of the World',
    baseCost: { wood: 66700, clay: 69050, iron: 72200, crop: 13200 },
    multiplier: 1.0275,
    cp: 0,
    pop: 1
  },
  
  // Resource Fields
  WOODCUTTER: {
    name: 'Woodcutter',
    baseCost: { wood: 40, clay: 100, iron: 50, crop: 60 },
    multiplier: 1.67,
    cp: 1,
    pop: 2
  },
  
  CLAY_PIT: {
    name: 'Clay Pit',
    baseCost: { wood: 80, clay: 40, iron: 80, crop: 50 },
    multiplier: 1.67,
    cp: 1,
    pop: 2
  },
  
  IRON_MINE: {
    name: 'Iron Mine',
    baseCost: { wood: 100, clay: 80, iron: 30, crop: 60 },
    multiplier: 1.67,
    cp: 1,
    pop: 3
  },
  
  CROPLAND: {
    name: 'Cropland',
    baseCost: { wood: 70, clay: 90, iron: 70, crop: 20 },
    multiplier: 1.67,
    cp: 1,
    pop: 0
  }
};

// Build time factors (seconds at 1x speed for each level)
export const BUILD_TIME_FACTORS = {
  1: 1.00,
  2: 1.28,
  3: 1.64,
  4: 2.10,
  5: 2.68,
  6: 3.43,
  7: 4.39,
  8: 5.62,
  9: 7.19,
  10: 9.20,
  11: 11.78,
  12: 15.07,
  13: 19.29,
  14: 24.69,
  15: 31.60,
  16: 40.45,
  17: 51.78,
  18: 66.28,
  19: 84.84,
  20: 108.59
};

// Validation function
export function validateBuildingData(buildingName: string, level: number, expectedCost: Resources): boolean {
  const building = KIRILLOID_BUILDINGS[buildingName];
  if (!building) return false;
  
  const multiplier = Math.pow(building.multiplier, level - 1);
  const calculated = {
    wood: Math.round(building.baseCost.wood * multiplier),
    clay: Math.round(building.baseCost.clay * multiplier),
    iron: Math.round(building.baseCost.iron * multiplier),
    crop: Math.round(building.baseCost.crop * multiplier)
  };
  
  return calculated.wood === expectedCost.wood &&
         calculated.clay === expectedCost.clay &&
         calculated.iron === expectedCost.iron &&
         calculated.crop === expectedCost.crop;
}
