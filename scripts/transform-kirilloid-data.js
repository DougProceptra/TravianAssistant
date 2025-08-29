#!/usr/bin/env node

/**
 * Transform Kirilloid Data to TravianAssistant Format
 * Converts raw Kirilloid TypeScript into our structured game data
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = './packages/extension/src/game-data/extracted-raw';
const OUTPUT_PATH = './packages/extension/src/game-data';

// Version to transform (start with t4)
const VERSION = process.argv[2] || 't4';

console.log(`\n=== Transforming ${VERSION} Data ===\n`);

// Building IDs from Kirilloid
const BUILDING_IDS = {
    0: 'WOODCUTTER',
    1: 'CLAY_PIT', 
    2: 'IRON_MINE',
    3: 'CROPLAND',
    4: 'SAWMILL',
    5: 'BRICKYARD',
    6: 'IRON_FOUNDRY',
    7: 'GRAIN_MILL',
    8: 'BAKERY',
    9: 'WAREHOUSE',
    10: 'GRANARY',
    11: 'ARMORY',
    12: 'BLACKSMITH',
    13: 'ARENA',
    14: 'MAIN_BUILDING',
    15: 'RALLY_POINT',
    16: 'MARKETPLACE',
    17: 'EMBASSY',
    18: 'BARRACKS',
    19: 'STABLE',
    20: 'WORKSHOP',
    21: 'ACADEMY',
    22: 'CRANNY',
    23: 'TOWN_HALL',
    24: 'RESIDENCE',
    25: 'PALACE',
    26: 'TREASURY',
    27: 'TRADE_OFFICE',
    28: 'GREAT_BARRACKS',
    29: 'GREAT_STABLE',
    30: 'CITY_WALL',
    31: 'EARTH_WALL',
    32: 'PALISADE',
    33: 'STONEMASON',
    34: 'BREWERY',
    35: 'TRAPPER',
    36: 'HERO_MANSION',
    37: 'GREAT_WAREHOUSE',
    38: 'GREAT_GRANARY',
    39: 'WORLD_WONDER',
    40: 'HORSE_DRINKING_TROUGH',
    41: 'WATER_DITCH',
    42: 'NATARIAN_WALL',
    43: 'STONE_WALL',
    44: 'MAKESHIFT_WALL',
    45: 'COMMAND_CENTER',
    46: 'WATERWORKS'
};

// Troop names by tribe
const TROOP_NAMES = {
    romans: [
        'Legionnaire', 'Praetorian', 'Imperian', 'Equites Legati', 'Equites Imperatoris',
        'Equites Caesaris', 'Battering Ram', 'Fire Catapult', 'Senator', 'Settler'
    ],
    gauls: [
        'Phalanx', 'Swordsman', 'Pathfinder', 'Theutates Thunder', 'Druidrider',
        'Haeduan', 'Ram', 'Trebuchet', 'Chieftain', 'Settler'
    ],
    teutons: [
        'Clubswinger', 'Spearman', 'Axeman', 'Scout', 'Paladin',
        'Teutonic Knight', 'Ram', 'Catapult', 'Chief', 'Settler'
    ],
    egyptians: [
        'Slave Militia', 'Ash Warden', 'Khopesh Warrior', 'Sopdu Explorer', 'Anhur Guard',
        'Resheph Chariot', 'Ram', 'Stone Catapult', 'Nomarch', 'Settler'
    ],
    huns: [
        'Mercenary', 'Bowman', 'Spotter', 'Steppe Rider', 'Marksman',
        'Marauder', 'Ram', 'Catapult', 'Logades', 'Settler'
    ]
};

// Read and parse raw data files
function readRawData(version) {
    const versionPath = path.join(INPUT_PATH, version);
    const data = {};
    
    // Read each file if it exists
    const files = ['buildings', 'units', 'combat', 'heroes', 'items', 'index'];
    
    files.forEach(file => {
        const filePath = path.join(versionPath, `${file}.ts`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            data[file] = content;
        }
    });
    
    return data;
}

// Transform building data
function transformBuildings(rawData) {
    // This is simplified - in reality we'd need to parse the TypeScript
    // For now, we'll create a template structure
    
    const buildings = Object.entries(BUILDING_IDS).map(([id, name]) => ({
        id: parseInt(id),
        name: name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        key: name,
        maxLevel: id <= 3 ? 20 : (id >= 30 && id <= 32 ? 20 : 20), // Most buildings max at 20
        category: id <= 3 ? 'resources' : id <= 8 ? 'infrastructure' : 'military',
        // These would be extracted from the actual data
        costs: [], // Would parse from 'c' field
        buildTime: [], // Would parse from 't' function
        culturePoints: [], // Would parse from 'cp' field
        population: [] // Would parse from 'u' field
    }));
    
    return buildings;
}

// Transform troop data
function transformTroops(rawData) {
    const troops = {};
    
    // For each tribe, transform the unit data
    Object.keys(TROOP_NAMES).forEach(tribe => {
        troops[tribe] = TROOP_NAMES[tribe].map((name, index) => ({
            id: index,
            name: name,
            tribe: tribe,
            // These would be extracted from the actual data
            attack: 0, // From 'a' field
            defenseInfantry: 0, // From 'di' field
            defenseCavalry: 0, // From 'dc' field
            speed: 0, // From 'v' field
            capacity: 0, // From 'p' field
            trainingCost: {
                wood: 0,
                clay: 0,
                iron: 0,
                crop: 0
            }, // From 'c' field
            trainingTime: 0, // From 't' field
            upkeep: 0 // From 'u' field
        }));
    });
    
    return troops;
}

// Generate static-data.ts
function generateStaticData(buildings, troops) {
    return `/**
 * TravianAssistant Static Game Data
 * Generated from Kirilloid ${VERSION}
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

export const Buildings: { [key: string]: Building } = ${JSON.stringify(buildings, null, 2)};

// ============================================
// Troops Data
// ============================================

export const Troops = ${JSON.stringify(troops, null, 2)};

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
`;
}

// Generate formulas.ts
function generateFormulas() {
    return `/**
 * TravianAssistant Game Formulas
 * All game calculations and formulas
 */

import { Resources } from './types';

// ============================================
// Building Formulas
// ============================================

export const Formulas = {
    /**
     * Calculate building cost for a specific level
     * Formula: base_cost * multiplier^(level-1)
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
     * Calculate building time in seconds
     * Formula from Kirilloid: a * k^(level-1) - b
     */
    calculateBuildTime(a: number, level: number, k: number = 1.16, b: number = 1875): number {
        return Math.round(a * Math.pow(k, level - 1) - b);
    },
    
    /**
     * Calculate resource production per hour
     * Based on field level and oasis bonus
     */
    calculateResourceProduction(fieldLevel: number, oasisBonus: number = 0): number {
        // T4 production values from Kirilloid
        const baseProduction = [0,
            5, 9, 15, 22, 33, 50, 70, 100, 145, 200,
            280, 375, 495, 635, 800, 1000, 1300, 1600, 2000, 2450, 3050
        ];
        
        const base = baseProduction[Math.min(fieldLevel, 21)] || 0;
        return Math.round(base * (1 + oasisBonus / 100));
    },
    
    /**
     * Calculate warehouse capacity
     * Formula: 2120 * 1.2^level - 1320
     */
    calculateWarehouseCapacity(level: number): number {
        return Math.round(2120 * Math.pow(1.2, level) - 1320);
    },
    
    /**
     * Calculate granary capacity
     * Same as warehouse in T4
     */
    calculateGranaryCapacity(level: number): number {
        return this.calculateWarehouseCapacity(level);
    },
    
    /**
     * Calculate cranny capacity
     * Formula: 129.17^(level-1)
     */
    calculateCrannyCapacity(level: number): number {
        return Math.round(Math.pow(129.17, level - 1));
    },
    
    /**
     * Calculate troop training time with barracks level
     * Formula: base_time * 0.9^(barracks_level - 1)
     */
    calculateTrainingTime(baseTime: number, buildingLevel: number): number {
        return Math.round(baseTime * Math.pow(0.9, buildingLevel - 1));
    },
    
    /**
     * Calculate merchant capacity
     * T4: 500 for Romans/Gauls, 1000 for Teutons
     */
    getMerchantCapacity(tribe: string): number {
        return tribe === 'teutons' ? 1000 : 500;
    },
    
    /**
     * Calculate culture points needed for next village
     * Standard server formula
     */
    calculateCulturePointsNeeded(villageCount: number): number {
        // Formula varies by server type
        // This is standard speed
        const requirements = [0, 0, 2000, 8000, 20000, 40000, 70000, 110000, 165000, 240000];
        return requirements[Math.min(villageCount, requirements.length - 1)] || 500000;
    }
};

export default Formulas;
`;
}

// Main execution
async function main() {
    try {
        // Read raw data
        const rawData = readRawData(VERSION);
        
        if (!rawData.buildings && !rawData.units) {
            console.error(`No data found for version ${VERSION}`);
            process.exit(1);
        }
        
        console.log('Found raw data files:', Object.keys(rawData).join(', '));
        
        // Transform the data
        console.log('\nTransforming data...');
        const buildings = transformBuildings(rawData.buildings);
        const troops = transformTroops(rawData.units);
        
        // Generate output files
        console.log('\nGenerating TypeScript files...');
        
        // Create static-data.ts
        const staticDataContent = generateStaticData(buildings, troops);
        fs.writeFileSync(path.join(OUTPUT_PATH, 'static-data.ts'), staticDataContent);
        console.log('✓ Created static-data.ts');
        
        // Create formulas.ts
        const formulasContent = generateFormulas();
        fs.writeFileSync(path.join(OUTPUT_PATH, 'formulas.ts'), formulasContent);
        console.log('✓ Created formulas.ts');
        
        console.log('\n=== Transformation Complete ===');
        console.log(`\nGenerated files in ${OUTPUT_PATH}:`);
        console.log('  - static-data.ts (buildings, troops, items)');
        console.log('  - formulas.ts (game calculations)');
        console.log('\nNote: This is a template. The actual data extraction');
        console.log('from Kirilloid TypeScript requires more parsing.');
        console.log('\nNext steps:');
        console.log('1. Implement proper TypeScript parsing');
        console.log('2. Extract actual values from Kirilloid');
        console.log('3. Create server-config.ts and constants.ts');
        
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
