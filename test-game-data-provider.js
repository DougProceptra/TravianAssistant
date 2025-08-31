#!/usr/bin/env node

/**
 * Test script for Game Data Provider
 * Run with: node test-game-data-provider.js
 */

const fs = require('fs');
const path = require('path');

// Load the JSON data files
function loadJSON(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    console.log(`Loading: ${fullPath}`);
    const data = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

// Simplified GameDataProvider class (JS version for testing)
class GameDataProvider {
  constructor() {
    this.troopData = loadJSON('data/troops/travian_all_tribes_complete.json');
    this.buildingData = loadJSON('data/buildings/buildings.json');
    this.heroMechanics = loadJSON('data/hero/hero-mechanics.json');
  }

  getCompleteGameContext() {
    return {
      description: "Complete Travian game mechanics and data",
      
      formulas: {
        troopTraining: "base_time * 0.9^(building_level - 1)",
        greatBuildingBonus: "Divides training time by 3 for barracks/stable",
        buildTime: "base_time * (1 / (1 + MB_level * 0.05))",
        travelTime: "distance / (speed * server_speed)",
        production: "base_production * (1 + bonus_percent / 100)",
        combat: "Complex - involves attack/defense values, wall bonus, morale, etc."
      },
      
      tribes: this.getTribesData(),
      buildings: this.getBuildingsData(),
      hero: this.getHeroData(),
      
      gameRules: {
        settlementRequirements: {
          buildings: "Residence or Palace level 10/15/20",
          culturePoints: "Varies by number of villages",
          settlers: "3 required per new village"
        },
        combatMechanics: {
          morale: "Affects combat when attacking smaller players",
          wall: "Defensive bonus varies by tribe",
          catapults: "Can target specific buildings",
          rams: "Reduce wall level"
        }
      }
    };
  }

  getTroopData(tribe, troopName) {
    if (!this.troopData) return null;
    
    if (tribe && troopName) {
      const tribeData = this.troopData.tribes[tribe];
      return tribeData?.find(t => t.name === troopName);
    }
    if (tribe) {
      return this.troopData.tribes[tribe];
    }
    return this.troopData;
  }

  getBuildingData(buildingName) {
    if (!this.buildingData) return null;
    
    if (buildingName) {
      return this.buildingData[buildingName];
    }
    return this.buildingData;
  }

  getDataForSettlementAnalysis(tribe) {
    const troops = this.getTroopData(tribe);
    if (!troops) return null;
    
    const settlers = troops.find(t => t.unit_type === 'settler');
    const residenceData = this.getBuildingData('residence');
    
    return {
      settlerCost: settlers?.cost,
      settlerTrainingTime: settlers?.training_time,
      residenceRequirements: residenceData?.levels?.[9], // Level 10 data
      formula: "Training: 3 settlers * (base_time * 0.9^9) seconds at Residence 10"
    };
  }

  getDataForRaidAnalysis(tribe) {
    const troops = this.getTroopData(tribe);
    if (!troops) return null;
    
    const raidTroops = troops.filter(t => 
      t.building === 'barracks' && 
      t.carry > 0 && 
      t.cost.wood + t.cost.clay + t.cost.iron + t.cost.crop < 500
    );
    
    return {
      cheapRaiders: raidTroops,
      efficiency: raidTroops?.map(t => ({
        name: t.name,
        costPerCarry: (t.cost.wood + t.cost.clay + t.cost.iron + t.cost.crop) / t.carry,
        speed: t.speed,
        trainingTime: t.training_time
      }))
    };
  }

  getTribesData() {
    if (!this.troopData) return null;
    
    return {
      available: Object.keys(this.troopData.tribes || {}),
      data: this.troopData.tribes,
      specialties: {
        Roman: "Double build queue, strong defense, expensive",
        Teutonic: "Cheap troops, strong offense, slow",
        Gallic: "Fast troops, good defense, fastest cavalry",
        Egyptian: "Resource bonus, cheap starter unit (Slave Militia)",
        Huns: "Command center, mobile troops, no defenses needed",
        Spartan: "Strong elite units, defensive bonuses",
        Viking: "Balanced units, good raiders"
      }
    };
  }

  getBuildingsData() {
    return {
      available: Object.keys(this.buildingData || {}),
      categories: {
        resources: ["Woodcutter", "Clay Pit", "Iron Mine", "Cropland"],
        infrastructure: ["Warehouse", "Granary", "Main Building"],
        military: ["Barracks", "Stable", "Workshop", "Academy"],
        defensive: ["Wall", "Earth Wall", "Palisade"],
        special: ["Residence", "Palace", "Treasury", "Trade Office"]
      }
    };
  }

  getHeroData() {
    return {
      mechanics: this.heroMechanics || {
        resourceProduction: "3 resources/hour per point at 1x speed",
        egyptianBonus: "25% bonus to resource production",
        combatStrength: "Varies by tribe - Romans 100/point, Teutons 80/point",
        experience: "Gained from adventures and combat"
      }
    };
  }

  // Test calculation functions
  calculateTroopTraining(tribe, troopName, buildingLevel, isGreat = false) {
    const troop = this.getTroopData(tribe, troopName);
    if (!troop) return null;
    
    let time = troop.training_time * Math.pow(0.9, buildingLevel - 1);
    if (isGreat) time = time / 3;
    
    return {
      troopName: troop.name,
      baseTime: troop.training_time,
      buildingLevel: buildingLevel,
      isGreat: isGreat,
      calculatedTime: Math.round(time),
      timeFormatted: `${Math.floor(time / 3600)}h ${Math.floor((time % 3600) / 60)}m ${Math.round(time % 60)}s`
    };
  }
}

// Run tests
console.log('='.repeat(60));
console.log('TRAVIAN ASSISTANT V4 - GAME DATA PROVIDER TEST');
console.log('='.repeat(60));

const provider = new GameDataProvider();

// Test 1: Check if data loads
console.log('\n📁 DATA LOADING TEST');
console.log('-'.repeat(40));
const troops = provider.getTroopData();
const buildings = provider.getBuildingData();
const tribes = provider.getTribesData();

console.log(`✓ Troop data loaded: ${troops ? 'YES' : 'NO'}`);
console.log(`✓ Building data loaded: ${buildings ? 'YES' : 'NO'}`);
console.log(`✓ Tribes available: ${tribes?.available?.join(', ') || 'NONE'}`);

// Test 2: Egyptian troops analysis
console.log('\n🏜️  EGYPTIAN TROOPS TEST');
console.log('-'.repeat(40));
const egyptianTroops = provider.getTroopData('Egyptian');
if (egyptianTroops) {
  console.log(`Total Egyptian troops: ${egyptianTroops.length}`);
  const slaveMilitia = egyptianTroops.find(t => t.name === 'Slave Militia');
  if (slaveMilitia) {
    console.log('\nSlave Militia Stats:');
    console.log(`  Cost: ${slaveMilitia.cost.wood}W ${slaveMilitia.cost.clay}C ${slaveMilitia.cost.iron}I ${slaveMilitia.cost.crop}Crop`);
    console.log(`  Training time: ${slaveMilitia.training_time}s (${slaveMilitia.training_time/60} min)`);
    console.log(`  Speed: ${slaveMilitia.speed} fields/hour`);
    console.log(`  Carry: ${slaveMilitia.carry} resources`);
  }
}

// Test 3: Settlement analysis
console.log('\n🏘️  SETTLEMENT ANALYSIS TEST');
console.log('-'.repeat(40));
const settlementData = provider.getDataForSettlementAnalysis('Egyptian');
if (settlementData) {
  console.log('Egyptian Settlement Requirements:');
  if (settlementData.settlerCost) {
    const cost = settlementData.settlerCost;
    console.log(`  Settler cost: ${cost.wood}W ${cost.clay}C ${cost.iron}I ${cost.crop}Crop`);
    console.log(`  Total for 3 settlers: ${cost.wood*3}W ${cost.clay*3}C ${cost.iron*3}I ${cost.crop*3}Crop`);
  }
  console.log(`  Training time per settler: ${settlementData.settlerTrainingTime}s`);
  console.log(`  Formula: ${settlementData.formula}`);
}

// Test 4: Raid efficiency analysis
console.log('\n⚔️  RAID EFFICIENCY TEST');
console.log('-'.repeat(40));
const raidData = provider.getDataForRaidAnalysis('Egyptian');
if (raidData && raidData.efficiency) {
  console.log('Egyptian Raid Units (sorted by cost efficiency):');
  raidData.efficiency.sort((a, b) => a.costPerCarry - b.costPerCarry);
  raidData.efficiency.slice(0, 3).forEach(unit => {
    console.log(`\n  ${unit.name}:`);
    console.log(`    Cost per carry: ${unit.costPerCarry.toFixed(2)} resources`);
    console.log(`    Speed: ${unit.speed} fields/hour`);
    console.log(`    Training: ${unit.trainingTime}s (${(unit.trainingTime/60).toFixed(1)} min)`);
  });
}

// Test 5: Training time calculations
console.log('\n⏱️  TRAINING TIME CALCULATIONS');
console.log('-'.repeat(40));
const trainingTests = [
  { tribe: 'Egyptian', troop: 'Slave Militia', level: 1, great: false },
  { tribe: 'Egyptian', troop: 'Slave Militia', level: 10, great: false },
  { tribe: 'Egyptian', troop: 'Slave Militia', level: 20, great: false },
  { tribe: 'Egyptian', troop: 'Slave Militia', level: 20, great: true },
];

trainingTests.forEach(test => {
  const result = provider.calculateTroopTraining(test.tribe, test.troop, test.level, test.great);
  if (result) {
    const label = test.great ? 'Great Barracks' : 'Barracks';
    console.log(`${test.troop} at ${label} L${test.level}: ${result.timeFormatted}`);
  }
});

// Test 6: Complete game context
console.log('\n📊 COMPLETE GAME CONTEXT TEST');
console.log('-'.repeat(40));
const context = provider.getCompleteGameContext();
console.log('Game context structure:');
console.log(`  - Description: ${context.description}`);
console.log(`  - Formulas: ${Object.keys(context.formulas).length} formulas`);
console.log(`  - Tribes: ${context.tribes?.available?.length || 0} tribes`);
console.log(`  - Buildings: ${context.buildings?.available?.length || 0} building types`);
console.log(`  - Game rules: ${Object.keys(context.gameRules).length} rule categories`);

// Test 7: AI Prompt generation
console.log('\n🤖 AI PROMPT GENERATION TEST');
console.log('-'.repeat(40));
const mockGameState = {
  serverTime: '12:00:00',
  villageName: 'Test Village',
  coordinates: { x: 0, y: 0 },
  resources: { wood: 500, clay: 400, iron: 300, crop: 600 },
  production: { wood: 100, clay: 100, iron: 100, crop: 50 },
  buildings: { barracks: 5, residence: 7 }
};

const prompt = provider.createAIPrompt('When should I settle?', mockGameState);
console.log('AI Prompt structure created:');
console.log(`  - System prompt length: ${prompt.system.length} chars`);
console.log(`  - User question: "${prompt.user.question}"`);
console.log(`  - Game state included: ${prompt.user.gameState ? 'YES' : 'NO'}`);
console.log(`  - Game data included: ${prompt.user.gameData ? 'YES' : 'NO'}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));

const testsPass = troops && buildings && tribes;
if (testsPass) {
  console.log('✅ All core data loaded successfully!');
  console.log('✅ Game Data Provider is functional!');
  console.log('\nNext steps:');
  console.log('1. Connect this to the Chrome extension');
  console.log('2. Wire up the Claude AI integration');
  console.log('3. Test with real game state scraping');
} else {
  console.log('❌ Some data files are missing!');
  console.log('\nPlease ensure these files exist:');
  console.log('- data/troops/travian_all_tribes_complete.json');
  console.log('- data/buildings/buildings.json');
  console.log('- data/hero/hero-mechanics.json');
}

console.log('\n' + '='.repeat(60));
