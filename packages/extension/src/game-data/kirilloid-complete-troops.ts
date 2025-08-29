/**
 * COMPLETE Travian Troop Data from Kirilloid
 * All units for all tribes with exact values
 * Source: kirilloid.ru/travian/
 */

import { Resources } from './types';

export interface TroopData {
  name: string;
  cost: Resources;
  time: number; // Training time in seconds at 1x speed
  attack: number;
  defInf: number; // Defense vs infantry
  defCav: number; // Defense vs cavalry
  speed: number; // Fields per hour at 1x
  capacity: number; // Carry capacity
  consumption: number; // Crop consumption per hour
}

// COMPLETE TROOP DATA
export const KIRILLOID_TROOPS = {
  // ROMANS
  ROMANS: {
    LEGIONNAIRE: {
      name: 'Legionnaire',
      cost: { wood: 120, clay: 100, iron: 150, crop: 30 },
      time: 1600,
      attack: 40,
      defInf: 35,
      defCav: 50,
      speed: 6,
      capacity: 50,
      consumption: 1
    },
    PRAETORIAN: {
      name: 'Praetorian',
      cost: { wood: 100, clay: 130, iron: 160, crop: 70 },
      time: 1760,
      attack: 30,
      defInf: 65,
      defCav: 35,
      speed: 5,
      capacity: 20,
      consumption: 1
    },
    IMPERIAN: {
      name: 'Imperian',
      cost: { wood: 150, clay: 160, iron: 210, crop: 80 },
      time: 1920,
      attack: 70,
      defInf: 40,
      defCav: 25,
      speed: 7,
      capacity: 50,
      consumption: 1
    },
    EQUITES_LEGATI: {
      name: 'Equites Legati',
      cost: { wood: 140, clay: 160, iron: 20, crop: 40 },
      time: 1360,
      attack: 0,
      defInf: 20,
      defCav: 10,
      speed: 16,
      capacity: 0,
      consumption: 2
    },
    EQUITES_IMPERATORIS: {
      name: 'Equites Imperatoris',
      cost: { wood: 550, clay: 440, iron: 320, crop: 100 },
      time: 2640,
      attack: 120,
      defInf: 65,
      defCav: 50,
      speed: 14,
      capacity: 100,
      consumption: 3
    },
    EQUITES_CAESARIS: {
      name: 'Equites Caesaris',
      cost: { wood: 550, clay: 640, iron: 800, crop: 180 },
      time: 3520,
      attack: 180,
      defInf: 80,
      defCav: 105,
      speed: 10,
      capacity: 70,
      consumption: 4
    },
    BATTERING_RAM: {
      name: 'Battering Ram',
      cost: { wood: 900, clay: 360, iron: 500, crop: 70 },
      time: 4200,
      attack: 60,
      defInf: 30,
      defCav: 75,
      speed: 4,
      capacity: 0,
      consumption: 3
    },
    FIRE_CATAPULT: {
      name: 'Fire Catapult',
      cost: { wood: 950, clay: 1350, iron: 600, crop: 90 },
      time: 6000,
      attack: 75,
      defInf: 60,
      defCav: 10,
      speed: 3,
      capacity: 0,
      consumption: 6
    },
    SENATOR: {
      name: 'Senator',
      cost: { wood: 30750, clay: 27200, iron: 45000, crop: 37500 },
      time: 25200,
      attack: 50,
      defInf: 40,
      defCav: 30,
      speed: 4,
      capacity: 0,
      consumption: 5
    },
    SETTLER: {
      name: 'Settler',
      cost: { wood: 5800, clay: 5300, iron: 7200, crop: 5500 },
      time: 26900,
      attack: 0,
      defInf: 80,
      defCav: 80,
      speed: 5,
      capacity: 3000,
      consumption: 1
    }
  },
  
  // TEUTONS
  TEUTONS: {
    CLUBSWINGER: {
      name: 'Clubswinger',
      cost: { wood: 95, clay: 75, iron: 40, crop: 40 },
      time: 1200,
      attack: 40,
      defInf: 20,
      defCav: 5,
      speed: 7,
      capacity: 60,
      consumption: 1
    },
    SPEARMAN: {
      name: 'Spearman',
      cost: { wood: 145, clay: 70, iron: 85, crop: 40 },
      time: 1420,
      attack: 10,
      defInf: 35,
      defCav: 60,
      speed: 7,
      capacity: 40,
      consumption: 1
    },
    AXEMAN: {
      name: 'Axeman',
      cost: { wood: 130, clay: 120, iron: 170, crop: 70 },
      time: 1720,
      attack: 60,
      defInf: 30,
      defCav: 30,
      speed: 6,
      capacity: 50,
      consumption: 1
    },
    SCOUT: {
      name: 'Scout',
      cost: { wood: 160, clay: 100, iron: 50, crop: 50 },
      time: 1120,
      attack: 0,
      defInf: 10,
      defCav: 5,
      speed: 9,
      capacity: 0,
      consumption: 1
    },
    PALADIN: {
      name: 'Paladin',
      cost: { wood: 370, clay: 270, iron: 290, crop: 75 },
      time: 2320,
      attack: 55,
      defInf: 100,
      defCav: 40,
      speed: 10,
      capacity: 110,
      consumption: 2
    },
    TEUTONIC_KNIGHT: {
      name: 'Teutonic Knight',
      cost: { wood: 450, clay: 515, iron: 480, crop: 80 },
      time: 3080,
      attack: 150,
      defInf: 50,
      defCav: 75,
      speed: 9,
      capacity: 80,
      consumption: 3
    },
    RAM: {
      name: 'Ram',
      cost: { wood: 1000, clay: 300, iron: 350, crop: 70 },
      time: 4200,
      attack: 65,
      defInf: 30,
      defCav: 80,
      speed: 4,
      capacity: 0,
      consumption: 3
    },
    CATAPULT: {
      name: 'Catapult',
      cost: { wood: 900, clay: 1200, iron: 600, crop: 60 },
      time: 6000,
      attack: 50,
      defInf: 60,
      defCav: 10,
      speed: 3,
      capacity: 0,
      consumption: 6
    },
    CHIEF: {
      name: 'Chief',
      cost: { wood: 35500, clay: 26600, iron: 25000, crop: 27200 },
      time: 19800,
      attack: 40,
      defInf: 60,
      defCav: 40,
      speed: 4,
      capacity: 0,
      consumption: 4
    },
    SETTLER_TEUTON: {
      name: 'Settler',
      cost: { wood: 7200, clay: 5500, iron: 5800, crop: 6500 },
      time: 31000,
      attack: 10,
      defInf: 80,
      defCav: 80,
      speed: 5,
      capacity: 3000,
      consumption: 1
    }
  },
  
  // GAULS
  GAULS: {
    PHALANX: {
      name: 'Phalanx',
      cost: { wood: 100, clay: 130, iron: 55, crop: 30 },
      time: 1370,
      attack: 15,
      defInf: 40,
      defCav: 50,
      speed: 7,
      capacity: 35,
      consumption: 1
    },
    SWORDSMAN: {
      name: 'Swordsman',
      cost: { wood: 140, clay: 150, iron: 185, crop: 60 },
      time: 1740,
      attack: 65,
      defInf: 35,
      defCav: 20,
      speed: 6,
      capacity: 45,
      consumption: 1
    },
    PATHFINDER: {
      name: 'Pathfinder',
      cost: { wood: 170, clay: 150, iron: 20, crop: 40 },
      time: 1360,
      attack: 0,
      defInf: 20,
      defCav: 10,
      speed: 17,
      capacity: 0,
      consumption: 2
    },
    THEUTATES_THUNDER: {
      name: 'Theutates Thunder',
      cost: { wood: 350, clay: 450, iron: 230, crop: 60 },
      time: 2480,
      attack: 90,
      defInf: 25,
      defCav: 40,
      speed: 19,
      capacity: 75,
      consumption: 2
    },
    DRUIDRIDER: {
      name: 'Druidrider',
      cost: { wood: 360, clay: 330, iron: 280, crop: 120 },
      time: 2560,
      attack: 45,
      defInf: 115,
      defCav: 55,
      speed: 16,
      capacity: 35,
      consumption: 2
    },
    HAEDUAN: {
      name: 'Haeduan',
      cost: { wood: 500, clay: 620, iron: 675, crop: 170 },
      time: 3120,
      attack: 140,
      defInf: 60,
      defCav: 165,
      speed: 13,
      capacity: 65,
      consumption: 3
    },
    RAM_GAUL: {
      name: 'Ram',
      cost: { wood: 950, clay: 555, iron: 330, crop: 75 },
      time: 4200,
      attack: 50,
      defInf: 30,
      defCav: 105,
      speed: 4,
      capacity: 0,
      consumption: 3
    },
    TREBUCHET: {
      name: 'Trebuchet',
      cost: { wood: 960, clay: 1450, iron: 630, crop: 90 },
      time: 6000,
      attack: 70,
      defInf: 45,
      defCav: 10,
      speed: 3,
      capacity: 0,
      consumption: 6
    },
    CHIEFTAIN: {
      name: 'Chieftain',
      cost: { wood: 30750, clay: 45400, iron: 31000, crop: 37500 },
      time: 25200,
      attack: 40,
      defInf: 50,
      defCav: 50,
      speed: 5,
      capacity: 0,
      consumption: 4
    },
    SETTLER_GAUL: {
      name: 'Settler',
      cost: { wood: 5500, clay: 7000, iron: 5300, crop: 4900 },
      time: 22700,
      attack: 0,
      defInf: 80,
      defCav: 80,
      speed: 5,
      capacity: 3000,
      consumption: 1
    }
  }
};

// Validation function for troops
export function validateTroopData(tribe: string, troopName: string, expectedCost: Resources): boolean {
  const tribeData = KIRILLOID_TROOPS[tribe];
  if (!tribeData) return false;
  
  const troop = tribeData[troopName];
  if (!troop) return false;
  
  return troop.cost.wood === expectedCost.wood &&
         troop.cost.clay === expectedCost.clay &&
         troop.cost.iron === expectedCost.iron &&
         troop.cost.crop === expectedCost.crop;
}
