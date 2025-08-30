// Browser Console Script: Extract Main Building Data from Kirilloid
// Run this directly in browser console at: http://travian.kirilloid.ru/build.php?s=5&a=t
// Server: T4.6 2x

// Function to extract table data from the current page
const extractTableData = () => {
  const table = document.querySelector('table.f6') || document.querySelector('table');
  if (!table) {
    console.error('No table found! Make sure Main Building is selected.');
    return null;
  }
  
  const data = [];
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    // Skip header row
    if (index === 0) return;
    
    const cells = row.querySelectorAll('td');
    if (cells.length < 8) return;
    
    data.push({
      level: parseInt(cells[0]?.textContent) || index,
      wood: parseInt(cells[1]?.textContent.replace(/\D/g, '')) || 0,
      clay: parseInt(cells[2]?.textContent.replace(/\D/g, '')) || 0,
      iron: parseInt(cells[3]?.textContent.replace(/\D/g, '')) || 0,
      crop: parseInt(cells[4]?.textContent.replace(/\D/g, '')) || 0,
      consumption: parseInt(cells[5]?.textContent) || 0,
      time: cells[7]?.textContent.trim() || '',
      culture_points: parseInt(cells[8]?.textContent) || 0,
      effect: cells[9]?.textContent || ''
    });
  });
  
  return data;
};

// Run extraction
console.log('Extracting Main Building data for T4.6 2x server...');
const mainBuildingData = extractTableData();

if (mainBuildingData && mainBuildingData.length > 0) {
  console.log('✅ Main Building Data extracted:', mainBuildingData);
  
  // Validate against Doug's screenshot values
  const expectedValues = {
    6: { wood: 240, clay: 135, iron: 205, crop: 70 },
    7: { wood: 310, clay: 175, iron: 265, crop: 90 },
    8: { wood: 395, clay: 225, iron: 340, crop: 115 },
    9: { wood: 505, clay: 290, iron: 430, crop: 145 },
    10: { wood: 645, clay: 370, iron: 555, crop: 185 }
  };
  
  console.log('\n📊 Validation against screenshot values:');
  let allValid = true;
  
  for (const [level, expected] of Object.entries(expectedValues)) {
    const actual = mainBuildingData[level - 1];
    if (actual) {
      const valid = actual.wood === expected.wood && 
                   actual.clay === expected.clay && 
                   actual.iron === expected.iron && 
                   actual.crop === expected.crop;
      
      if (valid) {
        console.log(`✅ Level ${level}: MATCH`);
      } else {
        console.log(`❌ Level ${level}: MISMATCH`);
        console.log(`   Expected: ${JSON.stringify(expected)}`);
        console.log(`   Actual: wood=${actual.wood}, clay=${actual.clay}, iron=${actual.iron}, crop=${actual.crop}`);
        allValid = false;
      }
    }
  }
  
  if (allValid) {
    console.log('\n🎉 All validation tests passed!');
  } else {
    console.log('\n⚠️ Some values don\'t match. Check server selection.');
  }
  
  // Copy to clipboard
  const jsonData = JSON.stringify(mainBuildingData, null, 2);
  console.log('\n📋 Copying JSON to clipboard...');
  copy(jsonData);
  console.log('✅ Data copied to clipboard! Save as: main_building_t46_2x.json');
  
} else {
  console.error('❌ Failed to extract data. Make sure you\'re on the Main Building page.');
}
