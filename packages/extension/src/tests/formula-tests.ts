/**
 * Test suite for Travian formulas
 * Validates calculations for common player questions
 */

import { Formulas, formatTime } from '../game-data/formulas';
import { ServerConfig } from '../game-data/server-config';
import { BUILDINGS, UNITS } from '../game-data/travian-constants';
import { GameConstants } from '../game-data/constants';

/**
 * Test scenarios based on your requirements
 */
export const TestScenarios = {
  /**
   * Test 1: Hero Mansion 0→10 cost calculation
   */
  testHeroMansionCost(): void {
    console.log('=== TEST 1: Hero Mansion 0→10 Cost ===');
    
    // Hero Mansion base cost from BUILDINGS
    const heroMansion = BUILDINGS['HERO_MANSION'];
    if (!heroMansion || !heroMansion.costs) {
      console.error('Hero Mansion data not found!');
      return;
    }
    
    const baseCost = heroMansion.costs[0]; // Level 1 cost
    const totalCost = Formulas.calculateTotalBuildCost(baseCost, 0, 10);
    
    console.log('Base cost (level 1):', baseCost);
    console.log('Total for levels 1-10:', totalCost);
    console.log(`Total resources: ${totalCost.wood + totalCost.clay + totalCost.iron + totalCost.crop}`);
  },

  /**
   * Test 2: Time to accumulate resources
   */
  testAccumulationTime(): void {
    console.log('\n=== TEST 2: Resource Accumulation Time ===');
    
    // Example production rates (per hour)
    const production = {
      wood: 1000,
      clay: 1000,
      iron: 1000,
      crop: 800
    };
    
    // Hero Mansion total cost from test 1
    const needed = {
      wood: 15000,  // Example values
      clay: 14000,
      iron: 15000,
      crop: 5000
    };
    
    const hours = Formulas.calculateAccumulationTime(needed, production);
    console.log('Production rates:', production);
    console.log('Resources needed:', needed);
    console.log(`Time to accumulate: ${formatTime(hours)}`);
  },

  /**
   * Test 3: 100 Legionnaires cost
   */
  testLegionnairesCost(): void {
    console.log('\n=== TEST 3: 100 Legionnaires Cost ===');
    
    const legionnaire = UNITS['LEGIONNAIRE'];
    if (!legionnaire) {
      console.error('Legionnaire data not found!');
      return;
    }
    
    const cost = Formulas.calculateTroopCost(legionnaire.cost, 100);
    console.log('Single Legionnaire cost:', legionnaire.cost);
    console.log('100 Legionnaires cost:', cost);
    console.log(`Total resources: ${cost.wood + cost.clay + cost.iron + cost.crop}`);
    
    // Training time at 2x speed
    const barracksLevel = 10; // Example
    const trainingTime = Formulas.calculateTrainingTime(legionnaire.time, barracksLevel);
    console.log(`Training time (Barracks lvl ${barracksLevel}, ${ServerConfig.speed}x speed): ${formatTime(trainingTime / 3600)} per unit`);
    console.log(`Total for 100 units: ${formatTime((trainingTime * 100) / 3600)}`);
  },

  /**
   * Test 4: Scout travel time to 25|-25
   */
  testScoutTravelTime(): void {
    console.log('\n=== TEST 4: Scout Travel Time ===');
    
    const from = { x: 0, y: 0 };
    const to = { x: 25, y: -25 };
    
    // Roman scout speed (Equites Legati)
    const scoutSpeed = GameConstants.TROOP_SPEED_BASE.EQUITES_LEGATI;
    
    const travelTime = Formulas.calculateTravelTime(from, to, scoutSpeed);
    const distance = Formulas.calculateDistance(from, to);
    
    console.log(`From: (${from.x}, ${from.y})`);
    console.log(`To: (${to.x}, ${to.y})`);
    console.log(`Distance: ${distance.toFixed(2)} fields`);
    console.log(`Scout speed: ${scoutSpeed} fields/hour at 1x`);
    console.log(`Server speed: ${ServerConfig.speed}x`);
    console.log(`Travel time: ${formatTime(travelTime)}`);
  },

  /**
   * Test 5: Building time calculations
   */
  testBuildingTime(): void {
    console.log('\n=== TEST 5: Building Time Calculations ===');
    
    const mainBuilding = BUILDINGS['MAIN_BUILDING'];
    if (!mainBuilding || !mainBuilding.costs) {
      console.error('Main Building data not found!');
      return;
    }
    
    const level = 10;
    const mainBuildingLevel = 15;
    const baseCost = mainBuilding.costs[0];
    const buildTime = Formulas.calculateBuildingTime(baseCost, level, mainBuildingLevel);
    
    console.log(`Main Building level ${level}`);
    console.log(`With Main Building level ${mainBuildingLevel}`);
    console.log(`Server speed: ${ServerConfig.speed}x`);
    console.log(`Build time: ${formatTime(buildTime / 3600)}`);
  },

  /**
   * Test 6: Resource field production
   */
  testResourceProduction(): void {
    console.log('\n=== TEST 6: Resource Field Production ===');
    
    const fieldLevel = 10;
    const baseProduction = 1; // Standard multiplier
    const oasisBonus = 25; // 25% bonus
    
    const production = Formulas.calculateResourceProduction(fieldLevel, baseProduction, oasisBonus);
    
    console.log(`Field level: ${fieldLevel}`);
    console.log(`Oasis bonus: ${oasisBonus}%`);
    console.log(`Server speed: ${ServerConfig.speed}x`);
    console.log(`Production: ${production}/hour`);
  },

  /**
   * Test 7: Settlement costs
   */
  testSettlementCosts(): void {
    console.log('\n=== TEST 7: Settlement Costs ===');
    
    for (let villages = 1; villages <= 5; villages++) {
      const cost = Formulas.calculateSettlementCost(villages);
      const total = cost.wood + cost.clay + cost.iron + cost.crop;
      console.log(`Village #${villages + 1}: ${JSON.stringify(cost)} (Total: ${total})`);
    }
  },

  /**
   * Test 8: Warehouse capacity
   */
  testWarehouseCapacity(): void {
    console.log('\n=== TEST 8: Warehouse Capacity ===');
    
    const levels = [1, 5, 10, 15, 20];
    levels.forEach(level => {
      const capacity = Formulas.calculateWarehouseCapacity(level);
      console.log(`Level ${level}: ${capacity} resources`);
    });
  },

  /**
   * Test 9: Culture points calculation
   */
  testCulturePoints(): void {
    console.log('\n=== TEST 9: Culture Points ===');
    
    const buildings = [
      { level: 10, cpProduction: 3 }, // Town Hall
      { level: 5, cpProduction: 2 },  // Academy
      { level: 1, cpProduction: 5 }   // Treasury
    ];
    
    const totalCP = Formulas.calculateCulturePoints(buildings);
    console.log('Buildings:', buildings);
    console.log(`Total CP production: ${totalCP}/day`);
  },

  /**
   * Test 10: Raid efficiency
   */
  testRaidEfficiency(): void {
    console.log('\n=== TEST 10: Raid Efficiency ===');
    
    const distance = 10; // fields
    const loot = { wood: 1000, clay: 1000, iron: 1000, crop: 500 };
    const troopConsumption = 50; // crop per hour
    const travelSpeed = 14; // cavalry speed
    
    const efficiency = Formulas.calculateRaidEfficiency(
      distance,
      loot,
      troopConsumption,
      travelSpeed
    );
    
    console.log(`Distance: ${distance} fields`);
    console.log('Loot:', loot);
    console.log(`Troop consumption: ${troopConsumption}/hour`);
    console.log(`Efficiency: ${efficiency.toFixed(0)} resources/hour`);
  },

  /**
   * Run all tests
   */
  runAll(): void {
    console.log('====================================');
    console.log('TRAVIAN FORMULA TEST SUITE');
    console.log(`Server Speed: ${ServerConfig.speed}x`);
    console.log('====================================\n');
    
    this.testHeroMansionCost();
    this.testAccumulationTime();
    this.testLegionnairesCost();
    this.testScoutTravelTime();
    this.testBuildingTime();
    this.testResourceProduction();
    this.testSettlementCosts();
    this.testWarehouseCapacity();
    this.testCulturePoints();
    this.testRaidEfficiency();
    
    console.log('\n====================================');
    console.log('TEST SUITE COMPLETE');
    console.log('====================================');
  }
};

// Export for use in extension
export default TestScenarios;
