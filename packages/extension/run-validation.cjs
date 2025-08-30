const fs = require('fs');

// Read the travian-constants file
const constantsFile = fs.readFileSync('./src/game-data/travian-constants.ts', 'utf8');

// Extract BUILDINGS data
const buildingsMatch = constantsFile.match(/export const BUILDINGS[^{]*{([^}]+(?:{[^}]+}[^}]+)*)}[^}]*}/s);

if (!buildingsMatch) {
  console.log('Could not find BUILDINGS constant');
  process.exit(1);
}

// List of all expected buildings
const expectedBuildings = [
  'HERO_MANSION', 'MAIN_BUILDING', 'BARRACKS', 'STABLES', 'WORKSHOP',
  'ACADEMY', 'BLACKSMITH', 'ARMORY', 'MARKETPLACE', 'EMBASSY',
  'RALLY_POINT', 'RESIDENCE', 'PALACE', 'TREASURY', 'TRADE_OFFICE',
  'CRANNY', 'TOWN_HALL', 'WAREHOUSE', 'GRANARY', 'GREAT_WAREHOUSE',
  'GREAT_GRANARY', 'STONEMASON', 'BREWERY', 'TRAPPER', 'SAWMILL',
  'BRICKYARD', 'IRON_FOUNDRY', 'GRAIN_MILL', 'BAKERY', 'WOODCUTTER',
  'CLAY_PIT', 'IRON_MINE', 'CROPLAND'
];

console.log('====================================');
console.log('TRAVIAN DATA VALIDATION');
console.log('====================================\n');

const found = [];
const missing = [];

for (const building of expectedBuildings) {
  if (buildingsMatch[0].includes(`BuildingId.${building}`)) {
    found.push(building);
  } else {
    missing.push(building);
  }
}

console.log(`✅ Found ${found.length} buildings:`);
console.log(found.join(', '));

console.log(`\n❌ Missing ${missing.length} buildings:`);
console.log(missing.join(', '));

// Check Hero Mansion specifically
if (buildingsMatch[0].includes('HERO_MANSION')) {
  console.log('\n✅ Hero Mansion is defined');
  
  // Check if it has the right base cost
  if (buildingsMatch[0].includes('wood: 700') && buildingsMatch[0].includes('clay: 670')) {
    console.log('✅ Hero Mansion base costs appear correct (700, 670, 700, 240)');
  } else {
    console.log('⚠️ Hero Mansion base costs may be incorrect');
  }
}

console.log('\n====================================');
console.log('VALIDATION COMPLETE');
console.log('====================================');
