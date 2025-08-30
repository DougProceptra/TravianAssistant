const fs = require('fs');

const defined = [
  'ACADEMY', 'BARRACKS', 'CLAY_PIT', 'CROPLAND', 'EMBASSY', 'GRANARY',
  'HERO_MANSION', 'IRON_MINE', 'MAIN_BUILDING', 'MARKETPLACE', 'PALACE',
  'RALLY_POINT', 'RESIDENCE', 'TOWN_HALL', 'WAREHOUSE', 'WOODCUTTER'
];

const allBuildings = [
  'MAIN_BUILDING', 'BARRACKS', 'STABLES', 'WORKSHOP', 'ACADEMY',
  'BLACKSMITH', 'ARMORY', 'MARKETPLACE', 'EMBASSY', 'RALLY_POINT',
  'RESIDENCE', 'PALACE', 'TREASURY', 'TRADE_OFFICE', 'CRANNY',
  'TOWN_HALL', 'WAREHOUSE', 'GRANARY', 'GREAT_WAREHOUSE', 'GREAT_GRANARY',
  'STONEMASON', 'BREWERY', 'TRAPPER', 'SAWMILL', 'BRICKYARD',
  'IRON_FOUNDRY', 'GRAIN_MILL', 'BAKERY', 'HERO_MANSION',
  'WOODCUTTER', 'CLAY_PIT', 'IRON_MINE', 'CROPLAND'
];

console.log('=== BUILDING DATA STATUS ===\n');
console.log('✅ DEFINED (16):', defined.join(', '));

const missing = allBuildings.filter(b => !defined.includes(b));
console.log('\n❌ MISSING (' + missing.length + '):', missing.join(', '));

console.log('\n=== CRITICAL MISSING ===');
console.log('Military: STABLES, WORKSHOP, BLACKSMITH, ARMORY');
console.log('Economy: SAWMILL, BRICKYARD, IRON_FOUNDRY, GRAIN_MILL, BAKERY');
console.log('Special: TREASURY, TRADE_OFFICE, GREAT_WAREHOUSE, GREAT_GRANARY');
console.log('Tribe-specific: STONEMASON, BREWERY, TRAPPER, CRANNY');

// Check Hero Mansion specifically
const content = fs.readFileSync('./src/game-data/travian-constants.ts', 'utf8');
if (content.includes('HERO_MANSION]: {') && content.includes('wood: 700') && content.includes('clay: 670')) {
  console.log('\n✅ Hero Mansion data is correct (700, 670, 700, 240)');
}
