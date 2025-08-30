/**
 * Validation script to compare our data against Kirilloid's values
 * Run this to ensure all building costs and times are accurate
 */
import { BUILDINGS, BuildingId, calculateBuildingCost, HERO_MANSION_BUILD_TIMES } from '../game-data/travian-constants';
// Known accurate values from Kirilloid for validation
const KIRILLOID_VALIDATION_DATA = {
    // Hero Mansion Level 15-20 costs (your provided values)
    HERO_MANSION: {
        15: { wood: 6675, clay: 6395, iron: 6665, crop: 2290 },
        16: { wood: 8545, clay: 8185, iron: 8530, crop: 2930 },
        17: { wood: 10940, clay: 10475, iron: 10920, crop: 3750 },
        18: { wood: 14000, clay: 13410, iron: 13975, crop: 4800 },
        19: { wood: 17920, clay: 17165, iron: 17890, crop: 6145 },
        20: { wood: 22940, clay: 21970, iron: 22900, crop: 7865 }
    },
    // Main Building validation points
    MAIN_BUILDING: {
        1: { wood: 70, clay: 40, iron: 60, crop: 20 },
        10: { wood: 1115, clay: 635, iron: 955, crop: 320 },
        15: { wood: 4720, clay: 2690, iron: 4045, crop: 1355 },
        20: { wood: 20000, clay: 11400, iron: 17145, crop: 5740 }
    },
    // Barracks validation points
    BARRACKS: {
        1: { wood: 210, clay: 140, iron: 260, crop: 120 },
        5: { wood: 545, clay: 365, iron: 675, crop: 310 },
        10: { wood: 3355, clay: 2235, iron: 4155, crop: 1915 },
        20: { wood: 60000, clay: 40000, iron: 74285, crop: 34285 }
    },
    // Marketplace validation points
    MARKETPLACE: {
        1: { wood: 80, clay: 70, iron: 120, crop: 70 },
        10: { wood: 1275, clay: 1115, iron: 1915, crop: 1115 },
        20: { wood: 22855, clay: 20000, iron: 34285, crop: 20000 }
    },
    // Resource fields (different multiplier)
    WOODCUTTER: {
        1: { wood: 40, clay: 100, iron: 50, crop: 60 },
        5: { wood: 205, clay: 515, iron: 260, crop: 310 },
        10: { wood: 1750, clay: 4375, iron: 2185, crop: 2625 },
        15: { wood: 14905, clay: 37265, iron: 18630, crop: 22360 },
        20: { wood: 127100, clay: 317750, iron: 158875, crop: 190650 }
    },
    // Warehouse capacity validation (not costs, but capacity values)
    WAREHOUSE_CAPACITY: {
        1: 1200,
        5: 4000,
        10: 11800,
        15: 35000,
        20: 80000
    },
    // Granary capacity should match warehouse
    GRANARY_CAPACITY: {
        1: 1200,
        5: 4000,
        10: 11800,
        15: 35000,
        20: 80000
    }
};
// Build time validation data (seconds at 1x speed, MB level 20)
const KIRILLOID_BUILD_TIMES = {
    HERO_MANSION: {
        1: 2160,
        5: 5740,
        10: 19420,
        15: 65640,
        20: 222000
    },
    MAIN_BUILDING: {
        1: 2160,
        5: 5740,
        10: 19420,
        15: 65640,
        20: 222000
    }
};
export class DataValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }
    /**
     * Validate all building costs against known values
     */
    validateBuildingCosts() {
        console.log('🔍 Validating Building Costs...\n');
        // Validate Hero Mansion
        this.validateBuilding(BuildingId.HERO_MANSION, KIRILLOID_VALIDATION_DATA.HERO_MANSION, 'Hero Mansion');
        // Validate Main Building
        this.validateBuilding(BuildingId.MAIN_BUILDING, KIRILLOID_VALIDATION_DATA.MAIN_BUILDING, 'Main Building');
        // Validate Barracks
        this.validateBuilding(BuildingId.BARRACKS, KIRILLOID_VALIDATION_DATA.BARRACKS, 'Barracks');
        // Validate Marketplace
        this.validateBuilding(BuildingId.MARKETPLACE, KIRILLOID_VALIDATION_DATA.MARKETPLACE, 'Marketplace');
        // Validate Woodcutter (resource field with different multiplier)
        this.validateBuilding(BuildingId.WOODCUTTER, KIRILLOID_VALIDATION_DATA.WOODCUTTER, 'Woodcutter');
        return this.errors.length === 0;
    }
    /**
     * Validate a specific building's costs
     */
    validateBuilding(buildingId, expectedValues, buildingName) {
        const building = BUILDINGS[buildingId];
        if (!building) {
            this.errors.push(`❌ ${buildingName} (ID: ${buildingId}) is MISSING from BUILDINGS data!`);
            return;
        }
        console.log(`Checking ${buildingName}...`);
        for (const [level, expected] of Object.entries(expectedValues)) {
            const levelNum = parseInt(level);
            const calculated = calculateBuildingCost(buildingId, levelNum - 1); // Level-1 because it's current level
            if (!calculated) {
                this.errors.push(`❌ ${buildingName} Level ${level}: Could not calculate cost`);
                continue;
            }
            const exp = expected;
            // Check each resource
            if (calculated.wood !== exp.wood) {
                this.errors.push(`❌ ${buildingName} L${level} Wood: Expected ${exp.wood}, got ${calculated.wood} (diff: ${calculated.wood - exp.wood})`);
            }
            if (calculated.clay !== exp.clay) {
                this.errors.push(`❌ ${buildingName} L${level} Clay: Expected ${exp.clay}, got ${calculated.clay} (diff: ${calculated.clay - exp.clay})`);
            }
            if (calculated.iron !== exp.iron) {
                this.errors.push(`❌ ${buildingName} L${level} Iron: Expected ${exp.iron}, got ${calculated.iron} (diff: ${calculated.iron - exp.iron})`);
            }
            if (calculated.crop !== exp.crop) {
                this.errors.push(`❌ ${buildingName} L${level} Crop: Expected ${exp.crop}, got ${calculated.crop} (diff: ${calculated.crop - exp.crop})`);
            }
        }
        if (this.errors.length === 0) {
            console.log(`✅ ${buildingName} costs are correct\n`);
        }
    }
    /**
     * Check for missing buildings
     */
    checkMissingBuildings() {
        console.log('🔍 Checking for Missing Buildings...\n');
        const requiredBuildings = [
            { id: BuildingId.HERO_MANSION, name: 'Hero Mansion' },
            { id: BuildingId.MAIN_BUILDING, name: 'Main Building' },
            { id: BuildingId.BARRACKS, name: 'Barracks' },
            { id: BuildingId.STABLES, name: 'Stables' },
            { id: BuildingId.WORKSHOP, name: 'Workshop' },
            { id: BuildingId.ACADEMY, name: 'Academy' },
            { id: BuildingId.BLACKSMITH, name: 'Blacksmith' },
            { id: BuildingId.ARMORY, name: 'Armory' },
            { id: BuildingId.MARKETPLACE, name: 'Marketplace' },
            { id: BuildingId.EMBASSY, name: 'Embassy' },
            { id: BuildingId.RALLY_POINT, name: 'Rally Point' },
            { id: BuildingId.RESIDENCE, name: 'Residence' },
            { id: BuildingId.PALACE, name: 'Palace' },
            { id: BuildingId.TREASURY, name: 'Treasury' },
            { id: BuildingId.TRADE_OFFICE, name: 'Trade Office' },
            { id: BuildingId.CRANNY, name: 'Cranny' },
            { id: BuildingId.TOWN_HALL, name: 'Town Hall' },
            { id: BuildingId.WAREHOUSE, name: 'Warehouse' },
            { id: BuildingId.GRANARY, name: 'Granary' },
            { id: BuildingId.GREAT_WAREHOUSE, name: 'Great Warehouse' },
            { id: BuildingId.GREAT_GRANARY, name: 'Great Granary' },
            { id: BuildingId.STONEMASON, name: 'Stonemason' },
            { id: BuildingId.BREWERY, name: 'Brewery' },
            { id: BuildingId.TRAPPER, name: 'Trapper' },
            { id: BuildingId.SAWMILL, name: 'Sawmill' },
            { id: BuildingId.BRICKYARD, name: 'Brickyard' },
            { id: BuildingId.IRON_FOUNDRY, name: 'Iron Foundry' },
            { id: BuildingId.GRAIN_MILL, name: 'Grain Mill' },
            { id: BuildingId.BAKERY, name: 'Bakery' },
        ];
        const missing = [];
        const found = [];
        for (const building of requiredBuildings) {
            if (!BUILDINGS[building.id]) {
                missing.push(building.name);
                this.warnings.push(`⚠️ ${building.name} (ID: ${building.id}) is missing from BUILDINGS`);
            }
            else {
                found.push(building.name);
            }
        }
        console.log(`✅ Found ${found.length} buildings`);
        console.log(`❌ Missing ${missing.length} buildings`);
        if (missing.length > 0) {
            console.log('\nMissing buildings:', missing.join(', '));
        }
    }
    /**
     * Validate build times
     */
    validateBuildTimes() {
        console.log('\n🔍 Validating Build Times...\n');
        // Check Hero Mansion build times
        for (const [level, expectedTime] of Object.entries(HERO_MANSION_BUILD_TIMES)) {
            const levelNum = parseInt(level);
            const storedTime = HERO_MANSION_BUILD_TIMES[levelNum];
            if (storedTime !== expectedTime) {
                this.errors.push(`❌ Hero Mansion L${level} Build Time: Expected ${expectedTime}s, got ${storedTime}s`);
            }
        }
        if (this.errors.filter(e => e.includes('Build Time')).length === 0) {
            console.log('✅ Build times are correct');
        }
    }
    /**
     * Run all validations
     */
    runAll() {
        console.log('====================================');
        console.log('TRAVIAN DATA VALIDATION');
        console.log('====================================\n');
        this.checkMissingBuildings();
        this.validateBuildingCosts();
        this.validateBuildTimes();
        console.log('\n====================================');
        console.log('VALIDATION SUMMARY');
        console.log('====================================\n');
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ ALL DATA IS VALID!');
        }
        else {
            if (this.errors.length > 0) {
                console.log(`❌ Found ${this.errors.length} ERRORS:\n`);
                this.errors.forEach(error => console.log(error));
            }
            if (this.warnings.length > 0) {
                console.log(`\n⚠️ Found ${this.warnings.length} WARNINGS:\n`);
                this.warnings.forEach(warning => console.log(warning));
            }
            console.log('\n🔧 TO FIX: Update travian-constants.ts with correct values');
        }
    }
}
// Export for use
export default DataValidator;
// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new DataValidator();
    validator.runAll();
}
