/**
 * TravianAssistant Game Data - Main Index
 * Complete Kirilloid-compatible game data for AI predictions
 * 
 * This module provides 100% parity with Kirilloid calculators
 */

// Re-export all game data modules
export * from './travian-constants';
export * from './formulas';
export * from './server-config';
export * from './constants';
export * from './types';

// Import for convenient access
import { BUILDINGS, UNITS } from './travian-constants';
import { Formulas, formatTime, calculateResourceBalance, hasEnoughResources } from './formulas';
import { ServerConfig, loadServerConfig, saveServerConfig, updateServerConfig } from './server-config';
import { GameConstants } from './constants';
import type { Resources, Coordinates, BuildingCost, TroopStats } from './types';

/**
 * Main game data interface for AI consumption
 * This provides all data needed for any Travian calculation
 */
export interface TravianGameData {
    buildings: typeof BUILDINGS;
    troops: typeof UNITS;
    formulas: typeof Formulas;
    serverConfig: typeof ServerConfig;
    constants: typeof GameConstants;
    
    // Convenience methods
    getBuildingCost(buildingKey: string, level: number): Resources;
    getTroopCost(unitKey: string): Resources;
    calculateBuildTime(buildingCost: Resources, level: number, mainBuildingLevel: number): number;
    calculateProduction(fieldLevel: number, baseProduction: number, oasisBonus?: number): number;
    formatTime: typeof formatTime;
    calculateResourceBalance: typeof calculateResourceBalance;
    hasEnoughResources: typeof hasEnoughResources;
}

/**
 * Main game data instance
 * This is what the AI will use for all calculations
 */
export const GameData: TravianGameData = {
    buildings: BUILDINGS,
    troops: UNITS,
    formulas: Formulas,
    serverConfig: ServerConfig,
    constants: GameConstants,
    
    // Implement convenience methods
    getBuildingCost(buildingKey: string, level: number): Resources {
        const building = BUILDINGS[buildingKey];
        if (!building || !building.costs) {
            return { wood: 0, clay: 0, iron: 0, crop: 0 };
        }
        
        const baseCost = building.costs[0] || { wood: 0, clay: 0, iron: 0, crop: 0 };
        const multiplier = GameConstants.BUILDING_COST_MULTIPLIER[buildingKey] || 
                          GameConstants.BUILDING_COST_MULTIPLIER.DEFAULT;
        
        return Formulas.calculateBuildingCost(baseCost, level, multiplier);
    },
    
    getTroopCost(unitKey: string): Resources {
        const unit = UNITS[unitKey];
        if (!unit || !unit.cost) {
            return { wood: 0, clay: 0, iron: 0, crop: 0 };
        }
        return unit.cost;
    },
    
    calculateBuildTime(buildingCost: Resources, level: number, mainBuildingLevel: number): number {
        return Formulas.calculateBuildingTime(buildingCost, level, mainBuildingLevel);
    },
    
    calculateProduction(fieldLevel: number, baseProduction: number, oasisBonus: number = 0): number {
        return Formulas.calculateResourceProduction(fieldLevel, baseProduction, oasisBonus);
    },
    
    formatTime,
    calculateResourceBalance,
    hasEnoughResources
};

// Initialization function
export async function initializeGameData(): Promise<void> {
    // Load server configuration from Chrome storage
    await loadServerConfig();
}

// Default export for easy importing
export default GameData;
