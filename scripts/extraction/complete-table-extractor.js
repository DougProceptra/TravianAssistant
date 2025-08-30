// COMPLETE TABLE EXTRACTOR - Gets ALL columns including CP, Pop, Time
// Run at: http://travian.kirilloid.ru/build.php?s=5&a=t

console.log('🎯 COMPLETE TABLE DATA EXTRACTOR');
console.log('=' .repeat(60));

// ============================================
// EXTRACT ALL COLUMNS FROM TABLE
// ============================================

const extractCompleteTableData = (table) => {
  console.log('📊 Extracting complete table data with ALL columns...');
  
  const rows = table.querySelectorAll('tr');
  if (rows.length === 0) return null;
  
  // Get headers to understand column mapping
  const headers = [];
  const headerRow = rows[0];
  headerRow.querySelectorAll('th, td').forEach((cell, index) => {
    const text = cell.textContent.trim().toLowerCase();
    headers[index] = text;
    console.log(`Column ${index}: ${text}`);
  });
  
  // Extract all data rows
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length === 0) continue;
    
    const rowData = {};
    
    cells.forEach((cell, index) => {
      const text = cell.textContent.trim();
      const cleanNumber = text.replace(/[^\d-]/g, '');
      
      // Map based on column position OR header text
      // Typically Kirilloid uses this order:
      // 0: Level
      // 1: Wood cost
      // 2: Clay cost  
      // 3: Iron cost
      // 4: Crop cost
      // 5: Crop consumption (for troops) or Population (for buildings)
      // 6: Time
      // 7: Culture Points (CP)
      // 8+: Other effects/bonuses
      
      switch(index) {
        case 0:
          rowData.level = parseInt(cleanNumber) || i;
          break;
        case 1:
          rowData.wood = parseInt(cleanNumber) || 0;
          break;
        case 2:
          rowData.clay = parseInt(cleanNumber) || 0;
          break;
        case 3:
          rowData.iron = parseInt(cleanNumber) || 0;
          break;
        case 4:
          rowData.crop = parseInt(cleanNumber) || 0;
          break;
        case 5:
          // Could be consumption or population
          if (headers[index]?.includes('pop')) {
            rowData.population = parseInt(cleanNumber) || 0;
          } else if (headers[index]?.includes('cons')) {
            rowData.consumption = parseInt(cleanNumber) || 0;
          } else {
            // Just store the number
            rowData.column5 = parseInt(cleanNumber) || 0;
          }
          break;
        case 6:
          // Usually time
          if (text.includes(':')) {
            rowData.time = text;
          } else {
            rowData.column6 = text;
          }
          break;
        case 7:
          // Usually culture points
          if (headers[index]?.includes('cp') || headers[index]?.includes('culture')) {
            rowData.culture_points = parseInt(cleanNumber) || 0;
          } else if (text.includes(':')) {
            rowData.time = text;
          } else {
            rowData.column7 = parseInt(cleanNumber) || 0;
          }
          break;
        case 8:
          // Could be CP or effect
          if (headers[index]?.includes('cp') || headers[index]?.includes('culture')) {
            rowData.culture_points = parseInt(cleanNumber) || 0;
          } else {
            rowData.effect = text;
          }
          break;
        default:
          // Store any additional columns
          rowData[`column${index}`] = text;
      }
    });
    
    data.push(rowData);
  }
  
  return {
    headers: headers,
    data: data
  };
};

// ============================================
// EXTRACT CURRENT VISIBLE TABLE
// ============================================

const getCurrentBuilding = () => {
  console.log('\n🔍 Looking for current building table...');
  
  // Find the main data table
  const tables = document.querySelectorAll('table');
  let mainTable = null;
  
  for (const table of tables) {
    // Look for table with building data (has wood, clay, iron, crop)
    const text = table.textContent.toLowerCase();
    if (text.includes('wood') || text.includes('clay') || text.includes('iron')) {
      mainTable = table;
      console.log('✅ Found data table');
      break;
    }
  }
  
  if (!mainTable) {
    // Try any table with numeric data
    for (const table of tables) {
      const cells = table.querySelectorAll('td');
      if (cells.length > 10) {
        mainTable = table;
        console.log('✅ Found large table');
        break;
      }
    }
  }
  
  if (mainTable) {
    const result = extractCompleteTableData(mainTable);
    
    // Try to identify which building this is
    const buildingName = document.querySelector('h1, h2, .building-name, .selected')?.textContent || 
                        document.title || 
                        'unknown_building';
    
    console.log(`📦 Building identified as: ${buildingName}`);
    
    return {
      building: buildingName.trim(),
      ...result
    };
  }
  
  return null;
};

// ============================================
// EXTRACT ALL BUILDINGS (Click through dropdown)
// ============================================

const extractAllBuildings = async () => {
  console.log('\n🏗️ Attempting to extract all buildings...');
  
  const allBuildings = {};
  
  // Find building selector dropdown
  const selector = document.querySelector('select[name="gid"], select[name="b"], select');
  
  if (selector) {
    console.log(`✅ Found building selector with ${selector.options.length} options`);
    
    for (const option of selector.options) {
      const value = option.value;
      const name = option.textContent.trim();
      
      if (value && value !== '0') {
        console.log(`\nSelecting: ${name} (${value})`);
        
        // Select the building
        selector.value = value;
        selector.dispatchEvent(new Event('change'));
        
        // Wait for page update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Extract data
        const buildingData = getCurrentBuilding();
        
        if (buildingData && buildingData.data.length > 0) {
          allBuildings[name] = buildingData;
          console.log(`✅ Extracted ${name}: ${buildingData.data.length} levels`);
          
          // Show sample of what we got
          const sample = buildingData.data[0];
          console.log('Sample row:', sample);
          
          // Validate we got all the important columns
          if (sample.time) console.log('  ✓ Build time found');
          if (sample.population !== undefined) console.log('  ✓ Population found');
          if (sample.culture_points !== undefined) console.log('  ✓ Culture points found');
        }
      }
    }
  } else {
    console.log('❌ No building selector found. Extracting current table only...');
    const current = getCurrentBuilding();
    if (current) {
      allBuildings.current_building = current;
    }
  }
  
  return allBuildings;
};

// ============================================
// VALIDATE DATA COMPLETENESS
// ============================================

const validateData = (buildings) => {
  console.log('\n✅ Validating extracted data...');
  
  let totalBuildings = Object.keys(buildings).length;
  let hasTime = 0;
  let hasPopulation = 0;
  let hasCulturePoints = 0;
  
  for (const [name, building] of Object.entries(buildings)) {
    if (building.data && building.data[0]) {
      const sample = building.data[0];
      if (sample.time) hasTime++;
      if (sample.population !== undefined) hasPopulation++;
      if (sample.culture_points !== undefined) hasCulturePoints++;
    }
  }
  
  console.log(`\n📊 Data Quality Report:`);
  console.log(`  Total buildings: ${totalBuildings}`);
  console.log(`  With build times: ${hasTime}/${totalBuildings}`);
  console.log(`  With population: ${hasPopulation}/${totalBuildings}`);
  console.log(`  With culture points: ${hasCulturePoints}/${totalBuildings}`);
  
  return {
    totalBuildings,
    hasTime,
    hasPopulation,
    hasCulturePoints
  };
};

// ============================================
// MAIN EXECUTION
// ============================================

const runCompleteExtraction = async () => {
  console.log('Starting complete extraction with all data columns...\n');
  
  // First, try to get current building
  const current = getCurrentBuilding();
  if (current) {
    console.log('\n✅ Current building extracted successfully');
    console.log('Columns found:', current.headers);
    console.log('Data rows:', current.data.length);
    
    // Check if we have Main Building
    if (current.data[5]) { // Level 6
      const level6 = current.data[5];
      if (level6.wood === 240 && level6.clay === 135) {
        console.log('✅ MAIN BUILDING VERIFIED!');
      }
    }
  }
  
  // Try to extract all buildings
  console.log('\n🚀 Attempting to extract all buildings...');
  const allBuildings = await extractAllBuildings();
  
  // Validate
  const validation = validateData(allBuildings);
  
  // Save data
  const fullData = {
    timestamp: new Date().toISOString(),
    server: 'T4.6 2x',
    source: window.location.href,
    validation: validation,
    buildings: allBuildings
  };
  
  // Make available globally
  window.COMPLETE_DATA = fullData;
  
  // Download
  const dataStr = JSON.stringify(fullData, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'travian_complete_extraction.json';
  link.click();
  
  console.log('\n' + '='.repeat(60));
  console.log('EXTRACTION COMPLETE!');
  console.log('='.repeat(60));
  console.log('📥 Downloaded as: travian_complete_extraction.json');
  console.log('🔍 Access data: window.COMPLETE_DATA');
  
  if (validation.totalBuildings === 0) {
    console.log('\n⚠️ No buildings extracted automatically.');
    console.log('Try manually:');
    console.log('1. Click on a building in the interface');
    console.log('2. Run: getCurrentBuilding()');
    console.log('3. Repeat for each building');
  }
  
  return fullData;
};

// RUN IT
runCompleteExtraction();
