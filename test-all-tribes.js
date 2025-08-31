#!/usr/bin/env node

/**
 * Test ALL tribes in Game Data Provider
 * Run with: node test-all-tribes.js
 */

const fs = require('fs');
const path = require('path');

// Load the JSON data
const troopData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data/troops/travian_all_tribes_complete.json'), 'utf8')
);

console.log('='.repeat(60));
console.log('ALL TRIBES TEST - CHEAPEST UNIT PER TRIBE');
console.log('='.repeat(60));

// Test each tribe's cheapest unit
const tribes = ['Roman', 'Teutonic', 'Gallic', 'Egyptian', 'Huns', 'Spartan', 'Viking'];

tribes.forEach(tribe => {
  console.log(`\n${tribe.toUpperCase()} TRIBE`);
  console.log('-'.repeat(40));
  
  const troops = troopData.tribes[tribe];
  if (troops && troops.length > 0) {
    // Find cheapest unit by total resource cost
    const cheapest = troops
      .filter(t => t.unit_type === 'infantry' || t.unit_type === 'cavalry')
      .reduce((min, troop) => {
        const totalCost = troop.cost.wood + troop.cost.clay + troop.cost.iron + troop.cost.crop;
        const minCost = min.cost.wood + min.cost.clay + min.cost.iron + min.cost.crop;
        return totalCost < minCost ? troop : min;
      });
    
    const totalCost = cheapest.cost.wood + cheapest.cost.clay + cheapest.cost.iron + cheapest.cost.crop;
    
    console.log(`  Cheapest Unit: ${cheapest.name}`);
    console.log(`  Cost: ${cheapest.cost.wood}W ${cheapest.cost.clay}C ${cheapest.cost.iron}I ${cheapest.cost.crop}Crop`);
    console.log(`  Total Cost: ${totalCost} resources`);
    console.log(`  Training Time: ${cheapest.training_time}s (${(cheapest.training_time/60).toFixed(1)} min)`);
    console.log(`  Speed: ${cheapest.speed} fields/hour`);
    console.log(`  Attack: ${cheapest.attack} | Defense: ${cheapest.defense_infantry}/${cheapest.defense_cavalry}`);
    console.log(`  Carry: ${cheapest.carry} resources`);
    
    // Calculate training time at different barracks levels
    const level10Time = cheapest.training_time * Math.pow(0.9, 9);
    const level20Time = cheapest.training_time * Math.pow(0.9, 19);
    console.log(`  At Barracks L10: ${(level10Time/60).toFixed(1)} min`);
    console.log(`  At Barracks L20: ${(level20Time/60).toFixed(1)} min`);
  }
});

// Show settler costs for each tribe
console.log('\n' + '='.repeat(60));
console.log('SETTLER COSTS BY TRIBE');
console.log('='.repeat(60));

tribes.forEach(tribe => {
  const troops = troopData.tribes[tribe];
  const settler = troops?.find(t => t.unit_type === 'settler');
  if (settler) {
    const totalCost = settler.cost.wood + settler.cost.clay + settler.cost.iron + settler.cost.crop;
    console.log(`\n${tribe}: ${settler.name}`);
    console.log(`  Per settler: ${settler.cost.wood}W ${settler.cost.clay}C ${settler.cost.iron}I ${settler.cost.crop}Crop`);
    console.log(`  For 3 settlers: ${settler.cost.wood*3}W ${settler.cost.clay*3}C ${settler.cost.iron*3}I ${settler.cost.crop*3}Crop`);
    console.log(`  Training: ${settler.training_time}s (${(settler.training_time/3600).toFixed(1)} hours)`);
  }
});

// Server speed check
console.log('\n' + '='.repeat(60));
console.log('SERVER SPEED DATA CHECK');
console.log('='.repeat(60));
console.log('\nThese are BASE VALUES for 1x speed server:');
console.log('- All training times are in seconds at 1x speed');
console.log('- Movement speeds are fields/hour at 1x speed');
console.log('- For 2x server: divide all times by 2');
console.log('- For 3x server: divide all times by 3');
console.log('\nExample: Egyptian Slave Militia');
console.log('  1x server: 900s (15 min) training time');
console.log('  2x server: 450s (7.5 min) training time');
console.log('  3x server: 300s (5 min) training time');

console.log('\n' + '='.repeat(60));
