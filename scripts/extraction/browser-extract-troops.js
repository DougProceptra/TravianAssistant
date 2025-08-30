// Browser Console Script: Extract Troop Data from Kirilloid
// Run this directly in browser console at: http://travian.kirilloid.ru/troops.php?s=5&a=t
// Server: T4.6 2x

const TRIBES = ['Romans', 'Teutons', 'Gauls', 'Egyptians', 'Huns'];

// Function to extract troop data from tables
const extractTroopData = () => {
  const troopData = {};
  
  // Try to find troop tables for each tribe
  TRIBES.forEach(tribe => {
    console.log(`🗡️ Extracting ${tribe} troops...`);
    
    // Look for tribe-specific sections
    const possibleSelectors = [
      `#${tribe.toLowerCase()}`,
      `.${tribe.toLowerCase()}`,
      `[data-tribe="${tribe}"]`,
      `[data-tribe="${tribe.toLowerCase()}"]`,
      `h2:contains("${tribe}")`,
      `h3:contains("${tribe}")`
    ];
    
    let tribeTable = null;
    
    // Try to find the tribe section
    for (const selector of possibleSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          // Look for a table near this element
          tribeTable = element.closest('table') || 
                      element.nextElementSibling?.querySelector('table') ||
                      element.parentElement?.querySelector('table');
          if (tribeTable) break;
        }
      } catch (e) {
        // Selector might not be valid, continue
      }
    }
    
    // If no specific section found, look for all tables and try to identify
    if (!tribeTable) {
      const allTables = document.querySelectorAll('table');
      for (const table of allTables) {
        const text = table.textContent.toLowerCase();
        if (text.includes(tribe.toLowerCase())) {
          tribeTable = table;
          break;
        }
      }
    }
    
    if (tribeTable) {
      const units = [];
      const rows = tribeTable.querySelectorAll('tr');
      
      rows.forEach((row, index) => {
        if (index === 0) return; // Skip header
        
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) return;
        
        const unit = {
          name: cells[0]?.textContent.trim() || `Unit ${index}`,
          attack: parseInt(cells[1]?.textContent) || 0,
          defense_infantry: parseInt(cells[2]?.textContent) || 0,
          defense_cavalry: parseInt(cells[3]?.textContent) || 0,
          speed: parseInt(cells[4]?.textContent) || 0,
          carry_capacity: parseInt(cells[5]?.textContent) || 0,
          wood: parseInt(cells[6]?.textContent) || 0,
          clay: parseInt(cells[7]?.textContent) || 0,
          iron: parseInt(cells[8]?.textContent) || 0,
          crop: parseInt(cells[9]?.textContent) || 0,
          training_time: cells[10]?.textContent.trim() || '',
          upkeep: parseInt(cells[11]?.textContent) || 1
        };
        
        if (unit.name && unit.name !== 'Unit 0') {
          units.push(unit);
        }
      });
      
      if (units.length > 0) {
        troopData[tribe.toLowerCase()] = units;
        console.log(`✅ ${tribe}: ${units.length} units extracted`);
      } else {
        console.log(`⚠️ ${tribe}: No units found`);
      }
    } else {
      console.log(`❌ ${tribe}: Table not found`);
    }
  });
  
  return troopData;
};

// Alternative: Extract from JavaScript variables
const extractFromJavaScript = () => {
  console.log('\n🔍 Looking for JavaScript troop data...');
  
  const possibleVars = [
    'troops', 'units', 'troopData', 'unitData', 'troopList',
    'roman', 'teuton', 'gaul', 'egyptian', 'hun',
    'TROOPS', 'UNITS', 'gameData'
  ];
  
  const found = {};
  
  possibleVars.forEach(varName => {
    if (window[varName]) {
      console.log(`Found window.${varName}`);
      found[varName] = window[varName];
    }
  });
  
  // Check for Kirilloid's specific data structure
  if (typeof travian !== 'undefined') {
    console.log('Found travian object:', travian);
    found.travian = travian;
  }
  
  // Try to find data in the page's script tags
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    const content = script.textContent;
    if (content.includes('troops') || content.includes('units')) {
      // Try to extract JSON-like structures
      const jsonMatch = content.match(/(?:troops|units)\s*[:=]\s*(\{[\s\S]*?\})/);
      if (jsonMatch) {
        try {
          const data = eval('(' + jsonMatch[1] + ')');
          console.log('Found troop data in script:', data);
          found.scriptData = data;
        } catch (e) {
          // Failed to parse
        }
      }
    }
  });
  
  return found;
};

// Known Egyptian troop data for validation
const EGYPTIAN_VALIDATION = {
  'Slave Militia': { attack: 10, def_inf: 30, def_cav: 20 },
  'Ash Warden': { attack: 30, def_inf: 55, def_cav: 40 },
  'Khopesh Warrior': { attack: 65, def_inf: 50, def_cav: 20 }
};

// Main execution
console.log('='.repeat(50));
console.log('Travian Troop Data Extractor');
console.log('Server: T4.6 2x');
console.log('URL: http://travian.kirilloid.ru/troops.php?s=5&a=t');
console.log('='.repeat(50));

// Try JavaScript extraction first
const jsData = extractFromJavaScript();

if (Object.keys(jsData).length > 0) {
  console.log('\n📦 JavaScript data found!');
  console.log('Available variables:', Object.keys(jsData));
  
  // Copy the most promising one
  const bestData = jsData.troops || jsData.units || jsData.troopData || jsData;
  copy(JSON.stringify(bestData, null, 2));
  console.log('✅ Data copied to clipboard!');
  
  window.extractedJsData = jsData;
}

// Try table extraction
console.log('\n📊 Extracting from tables...');
const troopData = extractTroopData();

if (Object.keys(troopData).length > 0) {
  console.log('\n='.repeat(50));
  console.log('✅ EXTRACTION COMPLETE!');
  console.log(`📊 Extracted troops for ${Object.keys(troopData).length} tribes`);
  
  // Validate Egyptian data if present
  if (troopData.egyptians && troopData.egyptians.length > 0) {
    console.log('\n🔍 Validating Egyptian troops...');
    const slaveMilitia = troopData.egyptians[0];
    if (slaveMilitia && slaveMilitia.attack === 10 && slaveMilitia.defense_infantry === 30) {
      console.log('✅ Egyptian troop validation PASSED!');
    } else {
      console.log('⚠️ Egyptian troop values don\'t match expected');
    }
  }
  
  // Copy to clipboard
  const jsonData = JSON.stringify(troopData, null, 2);
  copy(jsonData);
  console.log('\n📋 Data copied to clipboard!');
  console.log('💾 Save as: troops_t46_2x.json');
  
  // Make available globally
  window.extractedTroopData = troopData;
  console.log('Data also available as: window.extractedTroopData');
  
} else {
  console.log('\n❌ No troop data extracted from tables');
  console.log('Try these steps:');
  console.log('1. Make sure you\'re on http://travian.kirilloid.ru/troops.php?s=5&a=t');
  console.log('2. Check if troops are displayed in tables');
  console.log('3. Try clicking on different tribe tabs if they exist');
  console.log('4. Check window.extractedJsData for JavaScript data');
}

// Nuclear option: dump everything
console.log('\n💣 Nuclear option - dumping all game data...');
const dump = {};
for (let key in window) {
  if (window.hasOwnProperty(key) && !key.match(/^(webkit|moz|ms|on|document|location|navigator|console|chrome)/)) {
    try {
      const val = window[key];
      if (typeof val === 'object' && val !== null && !val.nodeName && JSON.stringify(val).length < 50000) {
        dump[key] = val;
      }
    } catch(e) {
      // Can't serialize, skip
    }
  }
}

if (Object.keys(dump).length > 0) {
  window.dataDump = dump;
  console.log(`Found ${Object.keys(dump).length} potential data objects`);
  console.log('Check window.dataDump for all extracted objects');
  
  // Look for anything troop-related
  const troopRelated = Object.keys(dump).filter(k => 
    k.toLowerCase().includes('troop') || 
    k.toLowerCase().includes('unit') ||
    k.toLowerCase().includes('soldier') ||
    k.toLowerCase().includes('army')
  );
  
  if (troopRelated.length > 0) {
    console.log('🎯 Found troop-related objects:', troopRelated);
  }
}
