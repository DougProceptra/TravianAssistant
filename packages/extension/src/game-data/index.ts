/**
 * TravianAssistant Game Data - Main Index
 * Complete Kirilloid-compatible game data for AI predictions
 * 
 * This module provides 100% parity with Kirilloid calculators
 */

// Re-export all game data modules
export * from './static-data';
export * from './formulas';
export * from './server-config';
export * from './constants';
export * from './types';

// Import for convenient access
import { Buildings, Troops, Heroes, Items } from './static-data';
import { Formulas } from './formulas';
import { ServerConfig } from './server-config';
import { GameConstants } from './constants';

/**
 * Main game data interface for AI consumption
 * This provides all data needed for any Travian calculation
 */
export interface TravianGameData {
    buildings: typeof Buildings;
    troops: typeof Troops;
    heroes: typeof Heroes;
    items: typeof Items;
    formulas: typeof Formulas;
    serverConfig: typeof ServerConfig;
    constants: typeof GameConstants;
    
    // Convenience methods
    getBuildingCost(buildingId: number, level: number, tribe?: number): Resources;
    getTroopStats(troopId: number, tribe: number): TroopStats;
    calculateBuildTime(buildingId: number, level: number, mainBuildingLevel: number): number;
    calculateProduction(fieldType: number, level: number, oasisBonus?: number): number;
}

/**
 * Resource costs interface
 */
export interface Resources {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
}

/**
 * Troop statistics interface
 */
export interface TroopStats {
    attack: number;
    defenseInfantry: number;
    defenseCavalry: number;
    speed: number;
    capacity: number;
    upkeep: number;
    trainingTime: number;
    trainingCost: Resources;
}

/**
 * Main game data instance
 * This is what the AI will use for all calculations
 */
export const GameData: TravianGameData = {
    buildings: Buildings,
    troops: Troops,
    heroes: Heroes,
    items: Items,
    formulas: Formulas,
    serverConfig: ServerConfig,
    constants: GameConstants,
    
    // Implement convenience methods
    getBuildingCost(buildingId: number, level: number, tribe?: number): Resources {
        return Formulas.calculateBuildingCost(buildingId, level, tribe);
    },
    
    getTroopStats(troopId: number, tribe: number): TroopStats {
        return Troops.getStats(troopId, tribe);
    },
    
    calculateBuildTime(buildingId: number, level: number, mainBuildingLevel: number): number {
        return Formulas.calculateBuildTime(buildingId, level, mainBuildingLevel);
    },
    
    calculateProduction(fieldType: number, level: number, oasisBonus: number = 0): number {
        return Formulas.calculateResourceProduction(fieldType, level, oasisBonus);
    }
};

// Default export for easy importing
export default GameData;
