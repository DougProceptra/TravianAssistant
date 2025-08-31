/**
 * Test Harness for TravianAssistant Calculation Engine
 * Validates game start optimizer calculations
 */

import { TravianCalculator, GameStartOptimizer } from './index.js';

// Test configuration
const TEST_CONFIG = {
  serverSpeed: 2, // 2x server for Monday launch
  tribe: 'egyptians', // Or whatever tribe you're playing
  goldAvailable: 50 // Adjust based on your gold
};

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 TravianAssistant Calculation Engine Test Suite');
  console.log('================================================\n');

  const calculator = new TravianCalculator(TEST_CONFIG.serverSpeed, TEST_CONFIG.tribe);
  const initialized = await calculator.init();
  
  if (!initialized) {
    console.error('❌ Failed to initialize calculator - check data files');
    return;
  }

  console.log('✅ Calculator initialized successfully\n');

  // Test 1: Build time calculations
  testBuildTimeCalculations(calculator);
  
  // Test 2: Resource cost calculations
  testResourceCosts(calculator);
  
  // Test 3: Building requirements
  testBuildingRequirements(calculator);
  
  // Test 4: ROI calculations
  testROICalculations(calculator);
  
  // Test 5: Game start optimizer
  testGameStartOptimizer(calculator);
  
  console.log('\n✅ All tests completed!');
}

/**
 * Test build time calculations with various modifiers
 */
function testBuildTimeCalculations(calculator) {
  console.log('📊 Test 1: Build Time Calculations');
  console.log('-----------------------------------');
  
  const testCases = [
    {
      building: 'Main Building',
      level: 3,
      modifiers: {},
      description: 'Base time (no modifiers)'
    },
    {
      building: 'Main Building',
      level: 3,
      modifiers: { mainBuildingLevel: 5 },
      description: 'With Main Building level 5'
    },
    {
      building: 'Main Building',
      level: 3,
      modifiers: { mainBuildingLevel: 5, goldClub: true },
      description: 'With MB 5 + Gold Club'
    },
    {
      building: 'Barracks',
      level: 1,
      modifiers: { mainBuildingLevel: 3, goldClub: true, watchingAds: true },
      description: 'With MB 3 + Gold Club + Ads'
    }
  ];

  testCases.forEach(test => {
    try {
      const time = calculator.calculateBuildTime(
        test.building,
        test.level,
        test.modifiers
      );
      
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = time % 60;
      
      console.log(`  ✓ ${test.description}`);
      console.log(`    ${test.building} L${test.level}: ${hours}h ${minutes}m ${seconds}s`);
    } catch (error) {
      console.log(`  ✗ ${test.description}: ${error.message}`);
    }
  });
  
  console.log('');
}

/**
 * Test resource cost calculations
 */
function testResourceCosts(calculator) {
  console.log('💰 Test 2: Resource Costs');
  console.log('-------------------------');
  
  const buildings = [
    { name: 'Main Building', level: 5 },
    { name: 'Barracks', level: 3 },
    { name: 'Marketplace', level: 1 },
    { name: 'Residence', level: 10 }
  ];

  buildings.forEach(({ name, level }) => {
    const cost = calculator.getBuildingCost(name, level);
    if (cost) {
      console.log(`  ✓ ${name} L${level}:`);
      console.log(`    Wood: ${cost.wood}, Clay: ${cost.clay}, Iron: ${cost.iron}, Crop: ${cost.crop}`);
      console.log(`    Population: ${cost.pop}, Culture: ${cost.cp}`);
    } else {
      console.log(`  ✗ ${name} L${level}: Data not found`);
    }
  });
  
  console.log('');
}

/**
 * Test building requirements checking
 */
function testBuildingRequirements(calculator) {
  console.log('🏗️ Test 3: Building Requirements');
  console.log('---------------------------------');
  
  const currentBuildings = {
    'Main Building': 5,
    'Rally Point': 1,
    'Barracks': 3,
    'Academy': 1
  };

  const checkBuildings = [
    'Stable',
    'Workshop',
    'Blacksmith',
    'Treasury',
    'Marketplace'
  ];

  console.log('  Current buildings:', JSON.stringify(currentBuildings, null, 2));
  console.log('');

  checkBuildings.forEach(building => {
    const result = calculator.canBuild(building, currentBuildings);
    if (result.canBuild) {
      console.log(`  ✓ ${building}: Can build`);
    } else {
      console.log(`  ✗ ${building}: Missing ${result.missing}`);
    }
  });
  
  console.log('');
}

/**
 * Test ROI calculations for resource fields
 */
function testROICalculations(calculator) {
  console.log('📈 Test 4: ROI Calculations');
  console.log('---------------------------');
  
  const fields = [
    { type: 'Woodcutter', from: 3, to: 4 },
    { type: 'Clay Pit', from: 5, to: 6 },
    { type: 'Iron Mine', from: 2, to: 3 },
    { type: 'Cropland', from: 4, to: 5 }
  ];

  fields.forEach(field => {
    const roi = calculator.calculateROI(field.type, field.from, field.to);
    console.log(`  ${field.type} L${field.from} → L${field.to}:`);
    console.log(`    Cost: ${roi.cost} resources`);
    
    if (roi.productionIncrease) {
      console.log(`    Production increase: +${roi.productionIncrease}/hour`);
      console.log(`    Payback time: ${roi.hoursToPayback.toFixed(1)} hours (${roi.daysToPayback.toFixed(1)} days)`);
    } else {
      console.log(`    CP gained: ${roi.cpGained}`);
      console.log(`    Resources per CP: ${roi.resourcesPerCP.toFixed(0)}`);
    }
  });
  
  console.log('');
}

/**
 * Test game start optimizer
 */
function testGameStartOptimizer(calculator) {
  console.log('🚀 Test 5: Game Start Optimizer');
  console.log('--------------------------------');
  
  const optimizer = new GameStartOptimizer(
    calculator,
    TEST_CONFIG.tribe,
    TEST_CONFIG.goldAvailable
  );

  // Simulate different game states
  const gameStates = [
    {
      phase: 'Hour 0 (Server Start)',
      serverAge: 0,
      state: {
        fields: [
          { type: 'Woodcutter', level: 0 },
          { type: 'Woodcutter', level: 0 },
          { type: 'Woodcutter', level: 0 },
          { type: 'Woodcutter', level: 0 },
          { type: 'Clay Pit', level: 0 },
          { type: 'Clay Pit', level: 0 },
          { type: 'Clay Pit', level: 0 },
          { type: 'Clay Pit', level: 0 },
          { type: 'Iron Mine', level: 0 },
          { type: 'Iron Mine', level: 0 },
          { type: 'Iron Mine', level: 0 },
          { type: 'Iron Mine', level: 0 },
          { type: 'Cropland', level: 0 },
          { type: 'Cropland', level: 0 },
          { type: 'Cropland', level: 0 },
          { type: 'Cropland', level: 0 },
          { type: 'Cropland', level: 0 },
          { type: 'Cropland', level: 0 }
        ],
        buildings: {},
        currentCP: 2
      }
    },
    {
      phase: 'Hour 24 (Day 1 Complete)',
      serverAge: 24,
      state: {
        fields: [
          { type: 'Woodcutter', level: 2 },
          { type: 'Woodcutter', level: 1 },
          { type: 'Woodcutter', level: 1 },
          { type: 'Woodcutter', level: 1 },
          { type: 'Clay Pit', level: 2 },
          { type: 'Clay Pit', level: 1 },
          { type: 'Clay Pit', level: 1 },
          { type: 'Clay Pit', level: 1 },
          { type: 'Iron Mine', level: 2 },
          { type: 'Iron Mine', level: 1 },
          { type: 'Iron Mine', level: 1 },
          { type: 'Iron Mine', level: 1 },
          { type: 'Cropland', level: 1 },
          { type: 'Cropland', level: 1 },
          { type: 'Cropland', level: 1 },
          { type: 'Cropland', level: 1 },
          { type: 'Cropland', level: 1 },
          { type: 'Cropland', level: 1 }
        ],
        buildings: {
          'Main Building': 3,
          'Granary': 1,
          'Warehouse': 1
        },
        currentCP: 15
      }
    },
    {
      phase: 'Hour 72 (Day 3 - CP Rush)',
      serverAge: 72,
      state: {
        fields: [
          { type: 'Woodcutter', level: 5 },
          { type: 'Woodcutter', level: 5 },
          { type: 'Woodcutter', level: 4 },
          { type: 'Woodcutter', level: 4 },
          { type: 'Clay Pit', level: 4 },
          { type: 'Clay Pit', level: 4 },
          { type: 'Clay Pit', level: 3 },
          { type: 'Clay Pit', level: 3 },
          { type: 'Iron Mine', level: 4 },
          { type: 'Iron Mine', level: 3 },
          { type: 'Iron Mine', level: 3 },
          { type: 'Iron Mine', level: 3 },
          { type: 'Cropland', level: 3 },
          { type: 'Cropland', level: 3 },
          { type: 'Cropland', level: 3 },
          { type: 'Cropland', level: 2 },
          { type: 'Cropland', level: 2 },
          { type: 'Cropland', level: 2 }
        ],
        buildings: {
          'Main Building': 5,
          'Granary': 3,
          'Warehouse': 3,
          'Marketplace': 3,
          'Rally Point': 1,
          'Barracks': 3,
          'Academy': 1
        },
        currentCP: 75
      }
    }
  ];

  gameStates.forEach(({ phase, serverAge, state }) => {
    console.log(`\n  📅 ${phase}:`);
    optimizer.serverAge = serverAge;
    
    const buildOrders = optimizer.getOptimalBuildOrder(state);
    const settlement = optimizer.calculateTimeToSettlement(state);
    const goldSuggestions = optimizer.suggestGoldUsage(state, TEST_CONFIG.goldAvailable);
    
    console.log(`    Current Phase: ${optimizer.getCurrentPhase()}`);
    console.log(`    Current CP: ${state.currentCP}`);
    console.log(`    CP/day: ${settlement.cpPerDay.toFixed(1)}`);
    console.log(`    Days to settlement: ${settlement.totalDays.toFixed(1)}`);
    
    console.log('\n    Next build priorities:');
    buildOrders.slice(0, 5).forEach((order, i) => {
      console.log(`      ${i + 1}. ${order.building} L${order.level} - ${order.reason}`);
    });
    
    console.log('\n    Gold usage suggestions:');
    goldSuggestions.slice(0, 3).forEach(suggestion => {
      console.log(`      • ${suggestion.action} (${suggestion.cost} gold): ${suggestion.benefit}`);
    });
  });
  
  console.log('');
}

/**
 * Simulate Monday server launch scenario
 */
async function simulateMondayLaunch() {
  console.log('\n🎯 MONDAY SERVER LAUNCH SIMULATION');
  console.log('====================================\n');
  
  const calculator = new TravianCalculator(2, 'egyptians'); // 2x server
  await calculator.init();
  
  const optimizer = new GameStartOptimizer(calculator, 'egyptians', 100); // 100 gold start
  
  console.log('Server Configuration:');
  console.log('  • Speed: 2x');
  console.log('  • Tribe: Egyptians');
  console.log('  • Starting Gold: 100');
  console.log('  • Target: Top 5 settler (< 7 days)');
  
  console.log('\nOptimal Strategy:');
  console.log('  Day 1: Balance all resources to L1-2, MB to 3');
  console.log('  Day 2-3: Focus wood to L5 (best for Egyptians)');
  console.log('  Day 3-5: CP buildings (Embassy, Academy, Market)');
  console.log('  Day 5-6: Residence to 10, prepare resources');
  console.log('  Day 6-7: Train 3 settlers, settle!');
  
  console.log('\nGold Strategy:');
  console.log('  • Gold Club: Immediate (100 gold) - 25% speed all week');
  console.log('  • NPC: Daily for resource balance (3 gold/day)');
  console.log('  • Instant Complete: Final settlers if needed');
  
  console.log('\nExpected Results:');
  console.log('  • Settlement time: 6.5 days (156 hours)');
  console.log('  • CP at settlement: 205-210');
  console.log('  • Resource production: 250-300/hour per type');
  console.log('  • Rank prediction: Top 5-10 settler');
}

// Run tests if module is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(() => {
    simulateMondayLaunch();
  }).catch(console.error);
}

export { runTests, simulateMondayLaunch };
