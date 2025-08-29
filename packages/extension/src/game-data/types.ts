/**
 * TravianAssistant Game Data - Type Definitions
 * All TypeScript interfaces and types for Travian game mechanics
 */

// ============================================
// Core Types
// ============================================

export type Tribe = 'romans' | 'gauls' | 'teutons' | 'egyptians' | 'huns' | 'spartans' | 'vikings';
export type TribeId = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Romans, 1=Gauls, 2=Teutons, etc.

export type ResourceType = 'wood' | 'clay' | 'iron' | 'crop';
export type FieldType = 'woodcutter' | 'clay_pit' | 'iron_mine' | 'cropland';

// ============================================
// Building Types
// ============================================

export interface Building {
    id: number;
    gid: number; // Game ID used by Travian
    name: string;
    category: 'resources' | 'military' | 'infrastructure';
    maxLevel: number;
    unique: boolean; // Can only build one per village
    multipleAllowed: boolean; // Can build multiple in same village
    requirements: BuildingRequirement[];
    costs: BuildingCost[];
    benefits: BuildingBenefit[];
    buildTime: number[]; // Base build time per level in seconds
    culturePoints: number[]; // CP generated per level
    population: number[]; // Population cost per level
    destruction: {
        canDestroy: boolean;
        returnsResources: boolean;
    };
}

export interface BuildingRequirement {
    buildingId: number;
    level: number;
}

export interface BuildingCost {
    level: number;
    wood: number;
    clay: number;
    iron: number;
    crop: number;
}

export interface BuildingBenefit {
    type: 'production' | 'capacity' | 'speed' | 'defense' | 'attack' | 'training' | 'merchant' | 'culture';
    value: number;
    percentage: boolean; // true if value is percentage, false if absolute
    description: string;
}

// ============================================
// Troop Types
// ============================================

export interface Troop {
    id: number;
    tribe: Tribe;
    name: string;
    type: 'infantry' | 'cavalry' | 'siege' | 'scout' | 'settler' | 'administrator';
    
    // Combat stats
    attack: number;
    defenseInfantry: number;
    defenseCavalry: number;
    
    // Movement
    speed: number; // fields per hour
    capacity: number; // resources can carry
    
    // Training
    trainingCost: {
        wood: number;
        clay: number;
        iron: number;
        crop: number;
    };
    trainingTime: number; // seconds in barracks/stable/workshop level 1
    trainingBuilding: 'barracks' | 'stable' | 'workshop' | 'residence' | 'palace' | 'command_center';
    
    // Maintenance
    upkeep: number; // crop consumption per hour
    
    // Special abilities
    canRaid: boolean;
    canScout: boolean;
    canSiege: boolean;
    canConquer: boolean;
    canSettle: boolean;
    
    // Siege specific
    siegeTarget?: 'random' | 'building' | 'wall';
    siegeDamage?: number;
}

// ============================================
// Hero Types
// ============================================

export interface Hero {
    tribe: Tribe;
    baseStats: {
        attack: number;
        defense: number;
    };
    speedWithHorse: number;
    speedOnFoot: number;
    
    skills: HeroSkill[];
    items: HeroItem[];
}

export interface HeroSkill {
    name: string;
    maxPoints: number;
    effect: string;
    formula: (points: number) => number;
}

export interface HeroItem {
    id: number;
    name: string;
    slot: 'helmet' | 'armor' | 'left_hand' | 'right_hand' | 'boots' | 'horse';
    tier: 1 | 2 | 3;
    effects: ItemEffect[];
}

export interface ItemEffect {
    type: 'attack' | 'defense' | 'speed' | 'health' | 'regeneration' | 'culture' | 'resources';
    value: number;
    percentage: boolean;
}

// ============================================
// Game Mechanics
// ============================================

export interface CombatResult {
    attacker: {
        losses: Map<number, number>; // troopId -> count
        survivors: Map<number, number>;
    };
    defender: {
        losses: Map<number, number>;
        survivors: Map<number, number>;
    };
    wallDamage: number;
    buildingDamage?: Map<number, number>; // buildingId -> damage level
    resourcesStolen?: {
        wood: number;
        clay: number;
        iron: number;
        crop: number;
    };
}

export interface ProductionRate {
    base: number;
    withBonus: number;
    oasisBonus: number;
    heroBonus: number;
    allianceBonus: number;
    total: number;
}

export interface TravelTime {
    distance: number; // in fields
    duration: number; // in seconds
    arrivalTime: Date;
    returnTime?: Date; // for raids/attacks with return
}

// ============================================
// Server Configuration
// ============================================

export interface ServerSettings {
    speed: number; // 1x, 2x, 3x, 5x, 10x
    troopSpeed: number; // multiplier for troop movement
    worldSize: number; // 401x401, 801x801, etc.
    
    // Special features
    artifacts: boolean;
    wonders: boolean;
    conquering: boolean;
    natureRegrowth: boolean;
    
    // Beginner protection
    beginnerProtectionDays: number;
    beginnerProtectionAttacks: number;
    
    // Limits
    maxAccountVillages: number;
    maxAllianceMembers: number;
    maxOasisPerVillage: number;
    
    // Timing
    merchantSpeed: number; // fields per hour
    celebrationDuration: number; // hours
    
    // Special rules
    buildingQueueSize: number; // 1 for normal, 2 for Plus
    instantTradeEnabled: boolean;
    allianceBonusesEnabled: boolean;
}

// ============================================
// Calculations
// ============================================

export interface CalculationInput {
    serverSpeed?: number;
    tribe?: Tribe;
    heroItems?: HeroItem[];
    allianceBonus?: number;
    artifacts?: string[];
}

export interface BuildTimeCalculation {
    buildingId: number;
    currentLevel: number;
    targetLevel: number;
    mainBuildingLevel: number;
    serverSpeed: number;
    result: {
        totalTime: number; // seconds
        perLevel: number[]; // time for each level
    };
}

export interface ResourceCalculation {
    fieldType: FieldType;
    level: number;
    oasisBonus: number;
    heroProduction: number;
    allianceBonus: number;
    goldBonus: boolean;
    result: {
        baseProduction: number;
        totalProduction: number;
        dailyProduction: number;
    };
}

// ============================================
// Village State (for AI context)
// ============================================

export interface VillageState {
    id: number;
    name: string;
    coordinates: { x: number; y: number };
    tribe: Tribe;
    
    // Resources
    resources: {
        wood: number;
        clay: number;
        iron: number;
        crop: number;
        freeCrop: number; // crop - consumption
    };
    
    // Production
    production: {
        wood: number;
        clay: number;
        iron: number;
        crop: number;
    };
    
    // Buildings
    buildings: Map<number, { gid: number; level: number }>;
    buildQueue: Array<{ gid: number; level: number; completionTime: Date }>;
    
    // Troops
    troops: Map<number, number>; // troopId -> count
    trainingQueue: Array<{ troopId: number; count: number; completionTime: Date }>;
    
    // Other
    population: number;
    culturePoints: number;
    loyalty: number;
    celebration: {
        type: 'small' | 'large' | null;
        endTime?: Date;
    };
}

// ============================================
// Export all types
// ============================================

export type { Resources } from './index'; // Re-export from main index
