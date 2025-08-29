/**
 * TravianAssistant Game Data - Main Index
 * Uses COMPLETE Kirilloid data for 100% accuracy
 */

// Export complete Kirilloid data
export * from './kirilloid-complete-data';
export * from './kirilloid-complete-troops';
export * from './formulas';
export * from './server-config';
export * from './constants';
export * from './types';

// Import for use
import { KIRILLOID_BUILDINGS, validateBuildingData, BUILD_TIME_FACTORS } from './kirilloid-complete-data';
import { KIRILLOID_TROOPS, validateTroopData } from './kirilloid-complete-troops';
import { Formulas, formatTime, calculateResourceBalance, hasEnoughResources } from './formulas';
import { ServerConfig, loadServerConfig, saveServerConfig, updateServerConfig } from './server-config';
import { GameConstants } from './constants';
import type { Resources, Coordinates } from './types';

/**
 * Main game data interface using Kirilloid data
 */
export interface TravianGameData {
    buildings: typeof KIRILLOID_BUILDINGS;
    troops: typeof KIRILLOID_TROOPS;
    formulas: typeof Formulas;
    serverConfig: typeof ServerConfig;
    constants: typeof GameConstants;
    
    // Calculation methods
    calculateBuildingCost(buildingKey: string, level: number): Resources;
    calculateTroopCost(tribe: string, unitKey: string, quantity: number): Resources;
    calculateBuildTime(buildingKey: string, level: number, mainBuildingLevel: number): number;
    calculateTrainingTime(tribe: string, unitKey: string, buildingLevel: number): number;
    validateData(type: 'building' | 'troop', key: string, expected: Resources): boolean;
}

/**
 * Main game data instance with Kirilloid data
 */
export const GameData: TravianGameData = {
    buildings: KIRILLOID_BUILDINGS,
    troops: KIRILLOID_TROOPS,
    formulas: Formulas,
    serverConfig: ServerConfig,
    constants: GameConstants,
    
    calculateBuildingCost(buildingKey: string, level: number): Resources {
        const building = KIRILLOID_BUILDINGS[buildingKey];
        if (!building) {
            throw new Error(`Building ${buildingKey} not found in Kirilloid data`);
        }
        
        const multiplier = Math.pow(building.multiplier, level - 1);
        return {
            wood: Math.round(building.baseCost.wood * multiplier),
            clay: Math.round(building.baseCost.clay * multiplier),
            iron: Math.round(building.baseCost.iron * multiplier),
            crop: Math.round(building.baseCost.crop * multiplier)
        };
    },
    
    calculateTroopCost(tribe: string, unitKey: string, quantity: number): Resources {
        const tribeData = KIRILLOID_TROOPS[tribe];
        if (!tribeData) {
            throw new Error(`Tribe ${tribe} not found in Kirilloid data`);
        }
        
        const unit = tribeData[unitKey];
        if (!unit) {
            throw new Error(`Unit ${unitKey} not found for ${tribe}`);
        }
        
        return {
            wood: unit.cost.wood * quantity,
            clay: unit.cost.clay * quantity,
            iron: unit.cost.iron * quantity,
            crop: unit.cost.crop * quantity
        };
    },
    
    calculateBuildTime(buildingKey: string, level: number, mainBuildingLevel: number = 0): number {
        const building = KIRILLOID_BUILDINGS[buildingKey];
        if (!building) {
            throw new Error(`Building ${buildingKey} not found in Kirilloid data`);
        }
        
        // Base time calculation using Kirilloid formula
        const baseCostSum = building.baseCost.wood + building.baseCost.clay + 
                           building.baseCost.iron + building.baseCost.crop;
        
        const factor = BUILD_TIME_FACTORS[level] || 1;
        const baseSeconds = baseCostSum * factor * 1.6; // Kirilloid factor
        
        // Main building reduction
        const mbReduction = Math.min(0.7, mainBuildingLevel * 0.03);
        const finalTime = baseSeconds * (1 - mbReduction);
        
        // Apply server speed
        return Math.round(finalTime / ServerConfig.speed);
    },
    
    calculateTrainingTime(tribe: string, unitKey: string, buildingLevel: number = 1): number {
        const tribeData = KIRILLOID_TROOPS[tribe];
        if (!tribeData) {
            throw new Error(`Tribe ${tribe} not found in Kirilloid data`);
        }
        
        const unit = tribeData[unitKey];
        if (!unit) {
            throw new Error(`Unit ${unitKey} not found for ${tribe}`);
        }
        
        // Building level reduction (10% per level after 1)
        const speedBonus = 1 + (buildingLevel - 1) * 0.1;
        const adjustedTime = unit.time / speedBonus;
        
        // Apply server speed
        return Math.round(adjustedTime / ServerConfig.unitTrainingSpeed);
    },
    
    validateData(type: 'building' | 'troop', key: string, expected: Resources): boolean {
        if (type === 'building') {
            return validateBuildingData(key, 1, expected);
        } else {
            // For troops, need to know tribe
            const tribes = ['ROMANS', 'TEUTONS', 'GAULS'];
            for (const tribe of tribes) {
                if (validateTroopData(tribe, key, expected)) {
                    return true;
                }
            }
            return false;
        }
    }
};

// Initialization
export async function initializeGameData(): Promise<void> {
    await loadServerConfig();
    console.log('Game data initialized with complete Kirilloid data');
}

export default GameData;
