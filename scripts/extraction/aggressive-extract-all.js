// AGGRESSIVE KIRILLOID DATA EXTRACTOR - ALL BUILDINGS & TROOPS
// This script will try to extract ALL game data systematically

console.log('🔥 AGGRESSIVE DATA EXTRACTION STARTING...');
console.log('=' .repeat(60));

// ALL BUILDINGS IN TRAVIAN
const ALL_BUILDINGS = {
  // Resource fields
  1: 'woodcutter',
  2: 'clay_pit', 
  3: 'iron_mine',
  4: 'cropland',
  
  // Resource boosters
  5: 'sawmill',
  6: 'brickyard',
  7: 'iron_foundry',
  8: 'grain_mill',
  9: 'bakery',
  
  // Infrastructure
  10: 'warehouse',
  11: 'granary',
  15: 'main_building',
  16: 'rally_point',
  17: 'marketplace',
  18: 'embassy',
  
  // Military
  19: 'barracks',
  20: 'stable',
  21: 'workshop',
  22: 'academy',
  
  // Village
  23: 'cranny',
  24: 'town_hall',
  25: 'residence',
  26: 'palace',
  27: 'treasury',
  28: 'trade_office',
  
  // Great buildings
  29: 'great_barracks',
  30: 'great_stable',
  
  // Special
  34: 'stonemason',
  35: 'brewery',
  36: 'trapper',
  37: 'heros_mansion',
  38: 'great_warehouse',
  39: 'great_granary',
  40: 'wonder_of_the_world',
  41: 'horse_drinking_trough',
  42: 'water_ditch',
  43: 'natarian_wall',
  44: 'hospital',
  45: 'command_center'
};

// ============================================
// STEP 1: TRY DIRECT URL ACCESS FOR BUILDINGS
// ============================================

const extractBuildingsByURL = async () => {
  console.log('\n📊 Attempting to extract all buildings via URL manipulation...');
  const buildingData = {};
  
  for (const [id, name] of Object.entries(ALL_BUILDINGS)) {
    console.log(`Trying building ${id}: ${name}...`);
    
    // Try different URL patterns Kirilloid might use
    const urlPatterns = [
      `http://travian.kirilloid.ru/build.php?s=5&a=t&b=${id}`,
      `http://travian.kirilloid.ru/build.php?s=5&a=t&gid=${id}`,
      `http://travian.kirilloid.ru/build.php?s=5&a=t&id=${id}`,
      `http://travian.kirilloid.ru/buildings/${id}`,
      `http://travian.kirilloid.ru/data/buildings/${id}.json`
    ];
    
    for (const url of urlPatterns) {
      try {
        // Try to navigate via JavaScript
        if (window.location.href !== url) {
          // Try changing dropdown/select if it exists
          const buildingSelect = document.querySelector('select[name="building"], select[name="b"], select[name="gid"]');
          if (buildingSelect) {
            buildingSelect.value = id;
            buildingSelect.dispatchEvent(new Event('change'));
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Try to extract table data
        const table = document.querySelector('table.f6, table.build_details, table');
        if (table) {
          const data = extractTableData(table);
          if (data && data.length > 0) {
            buildingData[name] = data;
            console.log(`✅ Extracted ${name}: ${data.length} levels`);
            break;
          }
        }
      } catch (e) {}
    }
    
    // Small delay to avoid overwhelming
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return buildingData;
};

// ============================================
// STEP 2: EXTRACT TABLE DATA WITH ALL FIELDS
// ============================================

const extractTableData = (table) => {
  const rows = table.querySelectorAll('tr');
  const data = [];
  
  // Try to identify column headers
  const headers = [];
  const headerRow = rows[0];
  if (headerRow) {
    headerRow.querySelectorAll('th, td').forEach(cell => {
      headers.push(cell.textContent.trim().toLowerCase());
    });
  }
  
  // Extract data rows
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length < 4) continue;
    
    const rowData = {
      level: parseInt(cells[0]?.textContent) || i
    };
    
    // Try to map known column patterns
    cells.forEach((cell, index) => {
      const text = cell.textContent.trim();
      const num = parseInt(text.replace(/[^\d]/g, ''));
      
      // Resource costs (usually columns 1-4)
      if (index === 1) rowData.wood = num || 0;
      if (index === 2) rowData.clay = num || 0;
      if (index === 3) rowData.iron = num || 0;
      if (index === 4) rowData.crop = num || 0;
      
      // Population (often column 5)
      if (index === 5 && text.match(/^\d+$/)) {
        rowData.population = num || 0;
      }
      
      // Time (look for time format)
      if (text.match(/\d+:\d+:\d+/) || text.match(/\d+:\d+/)) {
        rowData.time = text;
      }
      
      // Culture points
      if (headers[index]?.includes('culture') || headers[index]?.includes('cp')) {
        rowData.culture_points = num || 0;
      }
      
      // Effect/bonus
      if (headers[index]?.includes('effect') || headers[index]?.includes('bonus')) {
        rowData.effect = text;
      }
    });
    
    data.push(rowData);
  }
  
  return data;
};

// ============================================
// STEP 3: EXTRACT ALL TROOPS SYSTEMATICALLY
// ============================================

const extractAllTroops = async () => {
  console.log('\n⚔️ Extracting all troop data...');
  
  const tribes = ['romans', 'teutons', 'gauls', 'egyptians', 'huns'];
  const troopData = {};
  
  for (const tribe of tribes) {
    console.log(`Extracting ${tribe} troops...`);
    
    // Try different navigation methods
    const tribeSelectors = [
      `a[href*="${tribe}"]`,
      `button:contains("${tribe}")`,
      `[data-tribe="${tribe}"]`,
      `#${tribe}`,
      `.${tribe}`
    ];
    
    for (const selector of tribeSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          element.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        }
      } catch (e) {}
    }
    
    // Look for troop table
    const tables = document.querySelectorAll('table');
    for (const table of tables) {
      const text = table.textContent.toLowerCase();
      if (text.includes(tribe) || text.includes('attack') || text.includes('defense')) {
        const troops = extractTroopTable(table);
        if (troops.length > 0) {
          troopData[tribe] = troops;
          console.log(`✅ Extracted ${tribe}: ${troops.length} units`);
          break;
        }
      }
    }
  }
  
  return troopData;
};

const extractTroopTable = (table) => {
  const rows = table.querySelectorAll('tr');
  const troops = [];
  
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length < 8) continue;
    
    const troop = {
      name: cells[0]?.textContent.trim() || `Unit ${i}`,
      attack: parseInt(cells[1]?.textContent) || 0,
      def_inf: parseInt(cells[2]?.textContent) || 0,
      def_cav: parseInt(cells[3]?.textContent) || 0,
      speed: parseInt(cells[4]?.textContent) || 0,
      carry: parseInt(cells[5]?.textContent) || 0
    };
    
    // Training costs
    let costIndex = 6;
    if (cells[costIndex]) troop.wood = parseInt(cells[costIndex]?.textContent) || 0;
    if (cells[costIndex + 1]) troop.clay = parseInt(cells[costIndex + 1]?.textContent) || 0;
    if (cells[costIndex + 2]) troop.iron = parseInt(cells[costIndex + 2]?.textContent) || 0;
    if (cells[costIndex + 3]) troop.crop = parseInt(cells[costIndex + 3]?.textContent) || 0;
    
    // Training time and upkeep
    const timeCell = Array.from(cells).find(c => c.textContent.match(/\d+:\d+/));
    if (timeCell) troop.time = timeCell.textContent.trim();
    
    const upkeepCell = cells[cells.length - 1];
    if (upkeepCell) troop.upkeep = parseInt(upkeepCell.textContent) || 1;
    
    troops.push(troop);
  }
  
  return troops;
};

// ============================================
// STEP 4: SCRAPE EVERYTHING VISIBLE
// ============================================

const scrapeEverything = () => {
  console.log('\n🔍 Scraping all visible data...');
  
  const allData = {
    tables: [],
    selects: [],
    links: [],
    scripts: []
  };
  
  // Get all tables
  document.querySelectorAll('table').forEach((table, i) => {
    const data = extractTableData(table);
    if (data.length > 0) {
      allData.tables.push({
        index: i,
        class: table.className,
        id: table.id,
        data: data
      });
    }
  });
  
  // Get all select options (dropdowns)
  document.querySelectorAll('select').forEach(select => {
    const options = [];
    select.querySelectorAll('option').forEach(opt => {
      options.push({
        value: opt.value,
        text: opt.textContent.trim()
      });
    });
    allData.selects.push({
      name: select.name,
      id: select.id,
      options: options
    });
  });
  
  // Get all relevant links
  document.querySelectorAll('a[href*="build"], a[href*="troop"], a[href*="unit"]').forEach(link => {
    allData.links.push({
      href: link.href,
      text: link.textContent.trim()
    });
  });
  
  // Extract inline JavaScript data
  document.querySelectorAll('script').forEach(script => {
    const content = script.textContent;
    if (content.includes('costs') || content.includes('buildings') || content.includes('troops')) {
      // Look for data structures
      const dataMatches = content.match(/(?:var|const|let)\s+(\w+)\s*=\s*(\[[\s\S]*?\]|\{[\s\S]*?\})/g);
      if (dataMatches) {
        allData.scripts.push(dataMatches);
      }
    }
  });
  
  return allData;
};

// ============================================
// STEP 5: TRY NETWORK INTERCEPTION
// ============================================

const interceptNetwork = () => {
  console.log('\n🌐 Intercepting network requests...');
  
  const originalFetch = window.fetch;
  const interceptedData = [];
  
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = args[0];
    
    if (url.includes('build') || url.includes('troop') || url.includes('data')) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        interceptedData.push({ url, data });
        console.log('Intercepted:', url);
      } catch (e) {}
    }
    
    return response;
  };
  
  // Also intercept XHR
  const originalXHR = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function(method, url) {
    this.addEventListener('load', function() {
      if (url.includes('build') || url.includes('troop')) {
        try {
          const data = JSON.parse(this.responseText);
          interceptedData.push({ url, data });
          console.log('Intercepted XHR:', url);
        } catch (e) {}
      }
    });
    return originalXHR.apply(this, arguments);
  };
  
  return interceptedData;
};

// ============================================
// MAIN EXECUTION
// ============================================

const runAggresiveExtraction = async () => {
  const fullData = {
    timestamp: new Date().toISOString(),
    server: 'T4.6 2x',
    buildings: {},
    troops: {},
    scraped: {},
    network: []
  };
  
  console.log('Starting aggressive extraction...\n');
  
  // 1. Try network interception
  const networkData = interceptNetwork();
  console.log('Network interception started');
  
  // 2. Scrape everything visible
  fullData.scraped = scrapeEverything();
  console.log(`Scraped ${fullData.scraped.tables.length} tables`);
  
  // 3. Try to extract buildings
  const buildings = await extractBuildingsByURL();
  if (Object.keys(buildings).length > 0) {
    fullData.buildings = buildings;
  }
  
  // 4. Try to extract troops
  const troops = await extractAllTroops();
  if (Object.keys(troops).length > 0) {
    fullData.troops = troops;
  }
  
  // 5. Check for any network data captured
  fullData.network = networkData;
  
  // Make available globally
  window.FULL_EXTRACTION = fullData;
  
  console.log('\n' + '=' .repeat(60));
  console.log('EXTRACTION COMPLETE');
  console.log('=' .repeat(60));
  console.log(`Buildings extracted: ${Object.keys(fullData.buildings).length}`);
  console.log(`Troops extracted: ${Object.keys(fullData.troops).length} tribes`);
  console.log(`Tables scraped: ${fullData.scraped.tables.length}`);
  console.log(`Dropdowns found: ${fullData.scraped.selects.length}`);
  console.log('\nAccess full data: window.FULL_EXTRACTION');
  
  // Try to download
  const dataStr = JSON.stringify(fullData, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'travian_full_extraction.json';
  link.click();
  console.log('📥 Data downloaded as travian_full_extraction.json');
  
  return fullData;
};

// RUN IT
runAggresiveExtraction();
