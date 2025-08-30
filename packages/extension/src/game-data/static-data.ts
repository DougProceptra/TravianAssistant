/**
 * TravianAssistant Static Game Data
 * Generated from Kirilloid t4
 * 
 * This file contains all static game elements:
 * - Buildings
 * - Troops
 * - Items
 */

import { Building, Troop, Hero, HeroItem } from './types';

// ============================================
// Buildings Data
// ============================================

export const Buildings: { [key: string]: Building } = [
  {
    "id": 0,
    "name": "Woodcutter",
    "key": "WOODCUTTER",
    "maxLevel": 20,
    "category": "resources",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 1,
    "name": "Clay Pit",
    "key": "CLAY_PIT",
    "maxLevel": 20,
    "category": "resources",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 2,
    "name": "Iron Mine",
    "key": "IRON_MINE",
    "maxLevel": 20,
    "category": "resources",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 3,
    "name": "Cropland",
    "key": "CROPLAND",
    "maxLevel": 20,
    "category": "resources",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 4,
    "name": "Sawmill",
    "key": "SAWMILL",
    "maxLevel": 20,
    "category": "infrastructure",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 5,
    "name": "Brickyard",
    "key": "BRICKYARD",
    "maxLevel": 20,
    "category": "infrastructure",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 6,
    "name": "Iron Foundry",
    "key": "IRON_FOUNDRY",
    "maxLevel": 20,
    "category": "infrastructure",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 7,
    "name": "Grain Mill",
    "key": "GRAIN_MILL",
    "maxLevel": 20,
    "category": "infrastructure",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 8,
    "name": "Bakery",
    "key": "BAKERY",
    "maxLevel": 20,
    "category": "infrastructure",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 9,
    "name": "Warehouse",
    "key": "WAREHOUSE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 10,
    "name": "Granary",
    "key": "GRANARY",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 11,
    "name": "Armory",
    "key": "ARMORY",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 12,
    "name": "Blacksmith",
    "key": "BLACKSMITH",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 13,
    "name": "Arena",
    "key": "ARENA",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 14,
    "name": "Main Building",
    "key": "MAIN_BUILDING",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 15,
    "name": "Rally Point",
    "key": "RALLY_POINT",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 16,
    "name": "Marketplace",
    "key": "MARKETPLACE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 17,
    "name": "Embassy",
    "key": "EMBASSY",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 18,
    "name": "Barracks",
    "key": "BARRACKS",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 19,
    "name": "Stable",
    "key": "STABLE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 20,
    "name": "Workshop",
    "key": "WORKSHOP",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 21,
    "name": "Academy",
    "key": "ACADEMY",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 22,
    "name": "Cranny",
    "key": "CRANNY",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 23,
    "name": "Town Hall",
    "key": "TOWN_HALL",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 24,
    "name": "Residence",
    "key": "RESIDENCE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 25,
    "name": "Palace",
    "key": "PALACE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 26,
    "name": "Treasury",
    "key": "TREASURY",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 27,
    "name": "Trade Office",
    "key": "TRADE_OFFICE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 28,
    "name": "Great Barracks",
    "key": "GREAT_BARRACKS",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 29,
    "name": "Great Stable",
    "key": "GREAT_STABLE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 30,
    "name": "City Wall",
    "key": "CITY_WALL",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 31,
    "name": "Earth Wall",
    "key": "EARTH_WALL",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 32,
    "name": "Palisade",
    "key": "PALISADE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 33,
    "name": "Stonemason",
    "key": "STONEMASON",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 34,
    "name": "Brewery",
    "key": "BREWERY",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 35,
    "name": "Trapper",
    "key": "TRAPPER",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 36,
    "name": "Hero Mansion",
    "key": "HERO_MANSION",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 37,
    "name": "Great Warehouse",
    "key": "GREAT_WAREHOUSE",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 38,
    "name": "Great Granary",
    "key": "GREAT_GRANARY",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 39,
    "name": "World Wonder",
    "key": "WORLD_WONDER",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 40,
    "name": "Horse Drinking Trough",
    "key": "HORSE_DRINKING_TROUGH",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 41,
    "name": "Water Ditch",
    "key": "WATER_DITCH",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 42,
    "name": "Natarian Wall",
    "key": "NATARIAN_WALL",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 43,
    "name": "Stone Wall",
    "key": "STONE_WALL",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 44,
    "name": "Makeshift Wall",
    "key": "MAKESHIFT_WALL",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 45,
    "name": "Command Center",
    "key": "COMMAND_CENTER",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  },
  {
    "id": 46,
    "name": "Waterworks",
    "key": "WATERWORKS",
    "maxLevel": 20,
    "category": "military",
    "costs": [],
    "buildTime": [],
    "culturePoints": [],
    "population": []
  }
];

// ============================================
// Troops Data
// ============================================

export const Troops = {
  "romans": [
    {
      "id": 0,
      "name": "Legionnaire",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 1,
      "name": "Praetorian",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 2,
      "name": "Imperian",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 3,
      "name": "Equites Legati",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 4,
      "name": "Equites Imperatoris",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 5,
      "name": "Equites Caesaris",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 6,
      "name": "Battering Ram",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 7,
      "name": "Fire Catapult",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 8,
      "name": "Senator",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 9,
      "name": "Settler",
      "tribe": "romans",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    }
  ],
  "gauls": [
    {
      "id": 0,
      "name": "Phalanx",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 1,
      "name": "Swordsman",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 2,
      "name": "Pathfinder",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 3,
      "name": "Theutates Thunder",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 4,
      "name": "Druidrider",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 5,
      "name": "Haeduan",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 6,
      "name": "Ram",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 7,
      "name": "Trebuchet",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 8,
      "name": "Chieftain",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 9,
      "name": "Settler",
      "tribe": "gauls",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    }
  ],
  "teutons": [
    {
      "id": 0,
      "name": "Clubswinger",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 1,
      "name": "Spearman",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 2,
      "name": "Axeman",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 3,
      "name": "Scout",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 4,
      "name": "Paladin",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 5,
      "name": "Teutonic Knight",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 6,
      "name": "Ram",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 7,
      "name": "Catapult",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 8,
      "name": "Chief",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 9,
      "name": "Settler",
      "tribe": "teutons",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    }
  ],
  "egyptians": [
    {
      "id": 0,
      "name": "Slave Militia",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 1,
      "name": "Ash Warden",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 2,
      "name": "Khopesh Warrior",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 3,
      "name": "Sopdu Explorer",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 4,
      "name": "Anhur Guard",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 5,
      "name": "Resheph Chariot",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 6,
      "name": "Ram",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 7,
      "name": "Stone Catapult",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 8,
      "name": "Nomarch",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 9,
      "name": "Settler",
      "tribe": "egyptians",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    }
  ],
  "huns": [
    {
      "id": 0,
      "name": "Mercenary",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 1,
      "name": "Bowman",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 2,
      "name": "Spotter",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 3,
      "name": "Steppe Rider",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 4,
      "name": "Marksman",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 5,
      "name": "Marauder",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 6,
      "name": "Ram",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 7,
      "name": "Catapult",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 8,
      "name": "Logades",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    },
    {
      "id": 9,
      "name": "Settler",
      "tribe": "huns",
      "attack": 0,
      "defenseInfantry": 0,
      "defenseCavalry": 0,
      "speed": 0,
      "capacity": 0,
      "trainingCost": {
        "wood": 0,
        "clay": 0,
        "iron": 0,
        "crop": 0
      },
      "trainingTime": 0,
      "upkeep": 0
    }
  ]
};

// ============================================
// Heroes Data
// ============================================

export const Heroes = {
    // TODO: Extract from Kirilloid heroes.ts
};

// ============================================
// Items Data
// ============================================

export const Items = {
    // TODO: Extract from Kirilloid items.ts
};

// Export convenience accessors
export function getBuildingById(id: number): Building | undefined {
    return Object.values(Buildings).find(b => b.id === id);
}

export function getTroopByName(tribe: string, name: string): Troop | undefined {
    return Troops[tribe]?.find(t => t.name === name);
}
