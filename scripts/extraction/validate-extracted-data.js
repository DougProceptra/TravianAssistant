const fs = require('fs');
const path = require('path');

// Validation Script for Extracted Travian Data
// Run with: node scripts/extraction/validate-extracted-data.js

console.log('='.repeat(60));
console.log('TRAVIAN DATA VALIDATION SCRIPT');
console.log('='.repeat(60));

// Expected values from Doug's screenshot for Main Building
const EXPECTED_MAIN_BUILDING = {
  6: { wood: 240, clay: 135, iron: 205, crop: 70 },
  7: { wood: 310, clay: 175, iron: 265, crop: 90 },
  8: { wood: 395, clay: 225, iron: 340, crop: 115 },
  9: { wood: 505, clay: 290, iron: 430, crop: 145 },
  10: { wood: 645, clay: 370, iron: 555, crop: 185 }
};

// Function to validate Main Building data
function validateMainBuilding(data) {
  console.log('\n📏 Validating Main Building Data...');
  console.log('-'.repeat(40));
  
  let valid = true;
  const mainBuilding = data.main_building || data.buildings?.main_building;
  
  if (!mainBuilding) {
    console.log('❌ Main Building data not found!');
    return false;
  }
  
  for (const [level, expected] of Object.entries(EXPECTED_MAIN_BUILDING)) {
    const actual = mainBuilding[level - 1]; // Array is 0-indexed
    
    if (!actual) {
      console.log(`❌ Level ${level}: Data missing`);
      valid = false;
      continue;
    }
    
    const matches = 
      actual.wood === expected.wood &&
      actual.clay === expected.clay &&
      actual.iron === expected.iron &&
      actual.crop === expected.crop;
    
    if (matches) {
      console.log(`✅ Level ${level}: EXACT MATCH`);
    } else {
      console.log(`❌ Level ${level}: MISMATCH`);
      console.log(`   Expected: ${JSON.stringify(expected)}`);
      console.log(`   Actual: wood=${actual.wood}, clay=${actual.clay}, iron=${actual.iron}, crop=${actual.crop}`);
      valid = false;
    }
  }
  
  return valid;
}

// Function to validate completeness
function validateCompleteness(data) {
  console.log('\n📊 Checking Data Completeness...');
  console.log('-'.repeat(40));
  
  const checks = {
    'Buildings': 0,
    'Troops': 0,
    'Mechanics': 0
  };
  
  // Check buildings
  if (data.buildings) {
    const buildingCount = Object.keys(data.buildings).length;
    checks.Buildings = buildingCount;
    console.log(`✅ Buildings: ${buildingCount} types found`);
    
    // List all buildings found
    if (buildingCount > 0) {
      console.log('   Found:', Object.keys(data.buildings).slice(0, 5).join(', '), '...');
    }
  } else {
    console.log('❌ Buildings: No data');
  }
  
  // Check troops
  if (data.troops) {
    const tribeCount = Object.keys(data.troops).length;
    checks.Troops = tribeCount;
    console.log(`✅ Troops: ${tribeCount} tribes found`);
    
    // Check Egyptian troops specifically
    if (data.troops.egyptians) {
      console.log(`   Egyptian units: ${data.troops.egyptians.length}`);
    }
  } else {
    console.log('❌ Troops: No data');
  }
  
  // Check mechanics
  if (data.mechanics || data.culture_points || data.hero_levels) {
    checks.Mechanics = 1;
    console.log('✅ Game Mechanics: Found');
  } else {
    console.log('⚠️ Game Mechanics: Not found');
  }
  
  return checks;
}

// Function to check if file exists and validate it
function validateFile(filename) {
  const filepath = path.join(process.cwd(), 'data', 'extracted', filename);
  
  console.log(`\n📁 Checking ${filename}...`);
  
  if (!fs.existsSync(filepath)) {
    console.log(`   ❌ File not found at: ${filepath}`);
    return null;
  }
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);
    console.log(`   ✅ File loaded successfully`);
    console.log(`   📏 Size: ${(content.length / 1024).toFixed(2)} KB`);
    return data;
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    return null;
  }
}

// Main validation
function runValidation() {
  console.log('\n🔍 Starting Validation Process...');
  console.log('='.repeat(60));
  
  // Check for consolidated file first
  const consolidatedData = validateFile('travian_data_t46_2x.json');
  
  if (consolidatedData) {
    console.log('\n✨ Found consolidated data file!');
    
    // Validate Main Building
    const mainBuildingValid = validateMainBuilding(consolidatedData);
    
    // Check completeness
    const completeness = validateCompleteness(consolidatedData);
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    if (mainBuildingValid) {
      console.log('✅ Main Building data MATCHES Doug\'s screenshot exactly!');
    } else {
      console.log('❌ Main Building data does NOT match screenshot');
      console.log('   → Check server selection (must be T4.6 2x)');
    }
    
    console.log('\n📊 Data Coverage:');
    console.log(`   Buildings: ${completeness.Buildings > 0 ? '✅' : '❌'} (${completeness.Buildings} types)`);
    console.log(`   Troops: ${completeness.Troops > 0 ? '✅' : '❌'} (${completeness.Troops} tribes)`);
    console.log(`   Mechanics: ${completeness.Mechanics > 0 ? '✅' : '❌'}`);
    
    const readyForBeta = mainBuildingValid && completeness.Buildings > 0;
    
    console.log('\n🚀 Beta Readiness:', readyForBeta ? '✅ READY!' : '❌ NOT READY');
    
    if (!readyForBeta) {
      console.log('\n📋 To fix:');
      if (!mainBuildingValid) {
        console.log('   1. Re-extract Main Building data from T4.6 2x server');
      }
      if (completeness.Buildings === 0) {
        console.log('   2. Extract building data using browser scripts');
      }
      if (completeness.Troops === 0) {
        console.log('   3. Extract troop data using browser scripts');
      }
    }
    
  } else {
    // Check for individual files
    console.log('\n⚠️ No consolidated file found. Checking individual files...');
    
    const buildings = validateFile('buildings_t46_2x.json');
    const troops = validateFile('troops_t46_2x.json');
    const mechanics = validateFile('game_mechanics_t46_2x.json');
    
    if (buildings) {
      validateMainBuilding({ buildings });
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Run extraction scripts in browser console');
    console.log('2. Save JSON data to data/extracted/ folder');
    console.log('3. Run this validation again');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Validation complete!');
}

// Create directories if they don't exist
const dataDir = path.join(process.cwd(), 'data');
const extractedDir = path.join(dataDir, 'extracted');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('📁 Created data/ directory');
}

if (!fs.existsSync(extractedDir)) {
  fs.mkdirSync(extractedDir);
  console.log('📁 Created data/extracted/ directory');
}

// Run validation
runValidation();
