// Fixed Browser Console Scraper for Kirilloid
// Run this directly in your browser console on Kirilloid

console.log("🚀 Starting Kirilloid Building Data Scraper V2...");

// First, let's check what's on the page
console.log("\n📋 Checking page structure...");

// Check if we have the building dropdown
const buildingSelect = document.querySelector('select#building');
if (buildingSelect) {
    console.log("✓ Found building dropdown");
    console.log("  Available options:", buildingSelect.options.length);
} else {
    console.log("✗ No building dropdown found - checking for alternative selectors");
    
    // Try to find any select elements
    const allSelects = document.querySelectorAll('select');
    console.log(`  Found ${allSelects.length} select elements on page`);
    
    allSelects.forEach((sel, idx) => {
        console.log(`  Select ${idx}: id="${sel.id}", name="${sel.name}", options=${sel.options.length}`);
        if (sel.options.length > 10) {
            console.log(`    First few options:`, Array.from(sel.options).slice(0, 3).map(o => o.text));
        }
    });
}

// Check for tables
const tables = document.querySelectorAll('table');
console.log(`\n📊 Found ${tables.length} tables on page`);
tables.forEach((table, idx) => {
    const rows = table.querySelectorAll('tr');
    console.log(`  Table ${idx}: ${rows.length} rows`);
    
    // Check if this looks like a building data table
    if (rows.length >= 20) {
        console.log(`    → This might be the building data table!`);
        
        // Show first row to verify structure
        const firstDataRow = rows[1]; // Skip header
        if (firstDataRow) {
            const cells = firstDataRow.querySelectorAll('td, th');
            const cellTexts = Array.from(cells).map(c => c.textContent.trim()).slice(0, 8);
            console.log(`    First data row: ${cellTexts.join(' | ')}`);
        }
    }
});

// Function to extract current building data
function extractCurrentBuildingData() {
    console.log("\n🔍 Attempting to extract current building data...");
    
    // Find the largest table (likely the data table)
    let dataTable = null;
    let maxRows = 0;
    
    document.querySelectorAll('table').forEach(table => {
        const rows = table.querySelectorAll('tr');
        if (rows.length > maxRows) {
            maxRows = rows.length;
            dataTable = table;
        }
    });
    
    if (!dataTable || maxRows < 20) {
        console.log("✗ No suitable data table found");
        return null;
    }
    
    console.log(`✓ Found data table with ${maxRows} rows`);
    
    // Extract the data
    const data = {
        levels: []
    };
    
    const rows = dataTable.querySelectorAll('tr');
    
    for (let i = 1; i < rows.length; i++) { // Skip header
        const cells = rows[i].querySelectorAll('td, th');
        
        if (cells.length >= 8) {
            const levelText = cells[0].textContent.trim();
            const level = parseInt(levelText);
            
            if (level >= 1 && level <= 20) {
                const levelData = {
                    level: level,
                    wood: parseInt(cells[1].textContent.replace(/[,.\s]/g, '') || 0),
                    clay: parseInt(cells[2].textContent.replace(/[,.\s]/g, '') || 0),
                    iron: parseInt(cells[3].textContent.replace(/[,.\s]/g, '') || 0),
                    crop: parseInt(cells[4].textContent.replace(/[,.\s]/g, '') || 0),
                    population: parseInt(cells[5].textContent.replace(/[,.\s]/g, '') || 0),
                    culture_points: parseInt(cells[6].textContent.replace(/[,.\s]/g, '') || 0),
                    build_time: cells[7].textContent.trim()
                };
                
                data.levels.push(levelData);
            }
        }
    }
    
    if (data.levels.length > 0) {
        console.log(`✓ Extracted ${data.levels.length} levels`);
        
        // Show sample data
        const l1 = data.levels[0];
        console.log(`  Level 1: Wood=${l1.wood}, Clay=${l1.clay}, Iron=${l1.iron}, Crop=${l1.crop}`);
        
        // Try to identify the building
        if (l1.wood === 220 && l1.clay === 160) {
            console.log("  → This is Academy!");
            data.name = "Academy";
        } else if (l1.wood === 460 && l1.clay === 510) {
            console.log("  → This is Workshop!");
            data.name = "Workshop";
        } else if (l1.wood === 70 && l1.clay === 40) {
            console.log("  → This is Main Building!");
            data.name = "Main Building";
        } else if (l1.wood === 210 && l1.clay === 140) {
            console.log("  → This is Barracks!");
            data.name = "Barracks";
        } else {
            console.log("  → Unknown building");
            data.name = "Unknown";
        }
        
        return data;
    }
    
    console.log("✗ No valid level data found");
    return null;
}

// Manual scraping instructions
console.log("\n" + "=".repeat(60));
console.log("📝 MANUAL SCRAPING INSTRUCTIONS");
console.log("=".repeat(60));
console.log("\nSince automatic navigation isn't working, you'll need to:");
console.log("1. Manually select each building from the dropdown");
console.log("2. Run this command after each selection:");
console.log("\n   extractCurrentBuildingData()");
console.log("\n3. Save each result");

console.log("\n🔧 QUICK TEST:");
console.log("Let's extract data from the current building...\n");

const currentData = extractCurrentBuildingData();

if (currentData) {
    console.log("\n✅ SUCCESS! Building data extracted:");
    console.log(JSON.stringify(currentData, null, 2).substring(0, 500) + "...");
    
    // Store for easy access
    window.CURRENT_BUILDING_DATA = currentData;
    console.log("\n💡 Data stored in: window.CURRENT_BUILDING_DATA");
    
    // Create download function
    window.downloadCurrentData = function() {
        const jsonData = JSON.stringify(currentData, null, 2);
        const blob = new Blob([jsonData], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentData.name.toLowerCase().replace(/ /g, '_')}_data.json`;
        a.click();
        console.log(`✓ Downloaded ${currentData.name} data`);
    };
    
    console.log("📥 To download this data, run: downloadCurrentData()");
} else {
    console.log("\n❌ Could not extract data from current page");
    console.log("Make sure you're on the Kirilloid buildings calculator page");
}

// Alternative: Create a semi-automated collector
window.collectAllBuildings = function() {
    const allData = {};
    
    console.log("\n" + "=".repeat(60));
    console.log("🤖 SEMI-AUTOMATED COLLECTION");
    console.log("=".repeat(60));
    console.log("\nYou'll need to manually change buildings.");
    console.log("After each change, this will collect the data.");
    console.log("\n📋 Buildings to collect:");
    
    const buildings = [
        "Academy", "Barracks", "Main Building", "Workshop",
        "Warehouse", "Granary", "Marketplace", "Embassy",
        "Rally Point", "Smithy", "Stables", "Town Hall",
        "Residence", "Palace", "Treasury", "Cranny",
        "Hero Mansion", "Woodcutter", "Clay Pit", "Iron Mine",
        "Cropland", "Sawmill", "Brickyard", "Iron Foundry",
        "Grain Mill", "Bakery", "City Wall", "Earth Wall", "Palisade"
    ];
    
    buildings.forEach((name, idx) => {
        console.log(`  ${idx + 1}. ${name}`);
    });
    
    console.log("\nAfter changing to each building, run:");
    console.log("  window.addCurrentBuilding()");
    
    window.collectedData = allData;
    
    window.addCurrentBuilding = function() {
        const data = extractCurrentBuildingData();
        if (data) {
            const key = data.name.toLowerCase().replace(/ /g, '_');
            window.collectedData[key] = data;
            console.log(`✓ Added ${data.name} (${Object.keys(window.collectedData).length} buildings collected)`);
        }
    };
    
    window.downloadCollectedData = function() {
        const jsonData = JSON.stringify(window.collectedData, null, 2);
        const blob = new Blob([jsonData], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kirilloid_all_buildings.json';
        a.click();
        console.log(`✓ Downloaded ${Object.keys(window.collectedData).length} buildings`);
    };
    
    console.log("\nCommands available:");
    console.log("  window.addCurrentBuilding() - Add current building to collection");
    console.log("  window.downloadCollectedData() - Download all collected data");
    console.log("  window.collectedData - View collected data");
};

// Make extractCurrentBuildingData globally available
window.extractCurrentBuildingData = extractCurrentBuildingData;

console.log("\n" + "=".repeat(60));
console.log("✅ SCRAPER LOADED!");
console.log("=".repeat(60));
console.log("\nAvailable commands:");
console.log("  extractCurrentBuildingData() - Extract current building");
console.log("  collectAllBuildings() - Start semi-automated collection");
console.log("\nTry extracting the current building first!");
