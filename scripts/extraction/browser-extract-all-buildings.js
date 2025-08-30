// Browser Console Script: Extract ALL Buildings Data from Kirilloid
// Run this directly in browser console at: http://travian.kirilloid.ru/build.php?s=5&a=t
// Server: T4.6 2x

// Complete list of all Travian buildings with their IDs
const BUILDINGS = [
  { id: 1, name: 'woodcutter' },
  { id: 2, name: 'clay_pit' },
  { id: 3, name: 'iron_mine' },
  { id: 4, name: 'cropland' },
  { id: 5, name: 'sawmill' },
  { id: 6, name: 'brickyard' },
  { id: 7, name: 'iron_foundry' },
  { id: 8, name: 'grain_mill' },
  { id: 9, name: 'bakery' },
  { id: 10, name: 'warehouse' },
  { id: 11, name: 'granary' },
  { id: 15, name: 'main_building' },
  { id: 16, name: 'rally_point' },
  { id: 17, name: 'marketplace' },
  { id: 18, name: 'embassy' },
  { id: 19, name: 'barracks' },
  { id: 20, name: 'stable' },
  { id: 21, name: 'workshop' },
  { id: 22, name: 'academy' },
  { id: 23, name: 'cranny' },
  { id: 24, name: 'town_hall' },
  { id: 25, name: 'residence' },
  { id: 26, name: 'palace' },
  { id: 27, name: 'treasury' },
  { id: 28, name: 'trade_office' },
  { id: 29, name: 'great_barracks' },
  { id: 30, name: 'great_stable' },
  { id: 34, name: 'stonemason' },
  { id: 35, name: 'brewery' },
  { id: 36, name: 'trapper' },
  { id: 37, name: 'heros_mansion' },
  { id: 38, name: 'great_warehouse' },
  { id: 39, name: 'great_granary' },
  { id: 40, name: 'wonder_of_the_world' },
  { id: 41, name: 'horse_drinking_trough' },
  { id: 42, name: 'water_ditch' },
  { id: 43, name: 'natarian_wall' },
  { id: 44, name: 'hospital' },
  { id: 45, name: 'command_center' }
];

// Function to extract table data
const extractTableData = () => {
  const table = document.querySelector('table.f6') || document.querySelector('table');
  if (!table) return null;
  
  const data = [];
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header
    
    const cells = row.querySelectorAll('td');
    if (cells.length < 8) return;
    
    data.push({
      level: parseInt(cells[0]?.textContent) || index,
      wood: parseInt(cells[1]?.textContent.replace(/\D/g, '')) || 0,
      clay: parseInt(cells[2]?.textContent.replace(/\D/g, '')) || 0,
      iron: parseInt(cells[3]?.textContent.replace(/\D/g, '')) || 0,
      crop: parseInt(cells[4]?.textContent.replace(/\D/g, '')) || 0,
      consumption: parseInt(cells[5]?.textContent) || 0,
      time: cells[6]?.textContent.trim() || cells[7]?.textContent.trim() || '',
      culture_points: parseInt(cells[8]?.textContent) || parseInt(cells[7]?.textContent) || 0,
      effect: cells[9]?.textContent || cells[8]?.textContent || ''
    });
  });
  
  return data;
};

// Function to click on building and wait
const selectBuilding = async (buildingId) => {
  // Try different selectors
  const selectors = [
    `a[href*="b=${buildingId}"]`,
    `a[href*="gid=${buildingId}"]`,
    `select option[value="${buildingId}"]`,
    `input[value="${buildingId}"]`
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'OPTION') {
        element.parentElement.value = buildingId;
        element.parentElement.dispatchEvent(new Event('change'));
      } else {
        element.click();
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
  }
  return false;
};

// Main extraction function
const extractAllBuildings = async () => {
  const allData = {};
  
  console.log('🏗️ Starting extraction of all buildings...');
  console.log('This will take a few minutes. Please wait...\n');
  
  for (const building of BUILDINGS) {
    console.log(`📊 Extracting ${building.name} (ID: ${building.id})...`);
    
    // Try to navigate to the building
    const selected = await selectBuilding(building.id);
    
    if (selected) {
      // Wait for page to update
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Extract data
    const data = extractTableData();
    
    if (data && data.length > 0) {
      allData[building.name] = data;
      console.log(`✅ ${building.name}: ${data.length} levels extracted`);
    } else {
      console.log(`⚠️ ${building.name}: No data found (might not be available)`);
    }
    
    // Small delay between buildings
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return allData;
};

// Alternative: Try to extract from JavaScript variables if they exist
const extractFromJavaScript = () => {
  console.log('\n🔍 Looking for JavaScript variables...');
  
  const possibleVars = ['buildings', 'buildingData', 'BUILDINGS', 'gameData', 'travian'];
  const found = {};
  
  possibleVars.forEach(varName => {
    if (window[varName]) {
      console.log(`Found window.${varName}:`, window[varName]);
      found[varName] = window[varName];
    }
  });
  
  // Also check for data in other places
  if (typeof travian !== 'undefined') {
    console.log('Found travian object:', travian);
    found.travian = travian;
  }
  
  return found;
};

// Run extraction
console.log('='.repeat(50));
console.log('Travian Building Data Extractor');
console.log('Server: T4.6 2x');
console.log('='.repeat(50));

// First try JavaScript variables
const jsData = extractFromJavaScript();

if (Object.keys(jsData).length > 0) {
  console.log('\n✅ Found JavaScript data! Copying to clipboard...');
  copy(JSON.stringify(jsData, null, 2));
  console.log('Data copied! Check if it contains building data.');
}

// Then try automated extraction
console.log('\n📋 Starting automated extraction...');
console.log('Note: You may need to manually click through buildings');

extractAllBuildings().then(buildingData => {
  if (Object.keys(buildingData).length > 0) {
    console.log('\n='.repeat(50));
    console.log('✅ EXTRACTION COMPLETE!');
    console.log(`📊 Extracted ${Object.keys(buildingData).length} buildings`);
    console.log('='.repeat(50));
    
    // Validate Main Building if present
    if (buildingData.main_building) {
      console.log('\n🔍 Validating Main Building data...');
      const mb = buildingData.main_building;
      const expectedLevel6 = { wood: 240, clay: 135, iron: 205, crop: 70 };
      const actualLevel6 = mb[5]; // Array index 5 = level 6
      
      if (actualLevel6 && 
          actualLevel6.wood === expectedLevel6.wood &&
          actualLevel6.clay === expectedLevel6.clay) {
        console.log('✅ Main Building validation PASSED!');
      } else {
        console.log('⚠️ Main Building validation failed - check server selection');
      }
    }
    
    // Copy to clipboard
    const jsonData = JSON.stringify(buildingData, null, 2);
    copy(jsonData);
    console.log('\n📋 Data copied to clipboard!');
    console.log('💾 Save as: buildings_t46_2x.json');
    
    // Also log the data
    console.log('\nFull data object available as:');
    console.log('buildingData', buildingData);
    window.extractedBuildingData = buildingData;
    
  } else {
    console.log('\n❌ No data extracted. Try manual method:');
    console.log('1. Click on each building in the dropdown/menu');
    console.log('2. For each building, run: extractTableData()');
    console.log('3. Save the results');
  }
});
