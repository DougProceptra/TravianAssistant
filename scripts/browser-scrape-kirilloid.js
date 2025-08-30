// Browser Console Scraper for Kirilloid
// Run this directly in your browser console on Kirilloid

// =====================================================
// MANUAL BROWSER SCRAPER FOR KIRILLOID
// =====================================================
// Instructions:
// 1. Open http://travian.kirilloid.ru/build.php in your browser
// 2. Open Developer Tools (F12)
// 3. Go to Console tab
// 4. Copy and paste this entire script
// 5. Press Enter to run
// 6. Wait for it to complete (about 1 minute)
// 7. Copy the final JSON output

console.log("🚀 Starting Kirilloid Building Data Scraper...");

// Building IDs and names
const BUILDINGS = {
    0: "Woodcutter",
    1: "Clay Pit",
    2: "Iron Mine",
    3: "Cropland",
    4: "Sawmill",
    5: "Brickyard",
    6: "Iron Foundry",
    7: "Grain Mill",
    8: "Bakery",
    9: "Warehouse",
    10: "Granary",
    11: "Smithy",
    14: "Main Building",
    15: "Rally Point",
    16: "Marketplace",
    17: "Embassy",
    18: "Barracks",
    19: "Stables",
    20: "Workshop",
    21: "Academy",
    22: "Cranny",
    23: "Town Hall",
    24: "Residence",
    25: "Palace",
    26: "Treasury",
    30: "City Wall",
    31: "Earth Wall",
    32: "Palisade",
    36: "Hero Mansion"
};

// Function to wait
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to extract table data
function extractTableData(buildingName) {
    const data = {
        name: buildingName,
        levels: []
    };
    
    // Find the table
    const tables = document.querySelectorAll('table');
    let targetTable = null;
    
    // Look for the main data table (usually the largest one)
    for (let table of tables) {
        const rows = table.querySelectorAll('tr');
        if (rows.length >= 20) { // Building tables have 20 levels
            targetTable = table;
            break;
        }
    }
    
    if (!targetTable) {
        console.warn(`  ⚠ No table found for ${buildingName}`);
        return null;
    }
    
    // Extract data from rows
    const rows = targetTable.querySelectorAll('tr');
    
    for (let i = 1; i < rows.length; i++) { // Skip header row
        const cells = rows[i].querySelectorAll('td, th');
        
        if (cells.length >= 8) {
            try {
                const level = parseInt(cells[0].textContent.trim());
                
                if (level >= 1 && level <= 20) {
                    const levelData = {
                        level: level,
                        wood: parseInt(cells[1].textContent.replace(/[,.\s]/g, '')),
                        clay: parseInt(cells[2].textContent.replace(/[,.\s]/g, '')),
                        iron: parseInt(cells[3].textContent.replace(/[,.\s]/g, '')),
                        crop: parseInt(cells[4].textContent.replace(/[,.\s]/g, '')),
                        population: parseInt(cells[5].textContent.replace(/[,.\s]/g, '')),
                        culture_points: parseInt(cells[6].textContent.replace(/[,.\s]/g, '')),
                        build_time: cells[7].textContent.trim()
                    };
                    
                    data.levels.push(levelData);
                }
            } catch (e) {
                // Skip invalid rows
            }
        }
    }
    
    if (data.levels.length > 0) {
        data.max_level = data.levels.length;
        return data;
    }
    
    return null;
}

// Function to change building using Kirilloid's own functions
function selectBuilding(buildingId) {
    // Set the URL hash
    window.location.hash = `b=${buildingId}&s=2.46&mb=1`;
    
    // Try to trigger Kirilloid's internal update
    if (window.update) {
        window.update();
    }
    
    // Also try changing dropdown if it exists
    const buildingSelect = document.querySelector('select#building');
    if (buildingSelect) {
        buildingSelect.value = buildingId;
        buildingSelect.dispatchEvent(new Event('change'));
    }
}

// Main scraping function
async function scrapeAllBuildings() {
    const allData = {};
    const buildingIds = Object.keys(BUILDINGS).map(id => parseInt(id));
    
    console.log(`📊 Scraping ${buildingIds.length} buildings...`);
    console.log("="+"=".repeat(50));
    
    for (let buildingId of buildingIds) {
        const buildingName = BUILDINGS[buildingId];
        console.log(`\n🏗️ Scraping ${buildingName} (ID: ${buildingId})`);
        
        // Change to this building
        selectBuilding(buildingId);
        
        // Wait for page to update
        await wait(2000);
        
        // Extract data
        const data = extractTableData(buildingName);
        
        if (data && data.levels.length > 0) {
            allData[buildingName.toLowerCase().replace(/ /g, '_')] = data;
            
            // Show sample data
            const level1 = data.levels[0];
            console.log(`  ✓ Level 1: Wood=${level1.wood}, Clay=${level1.clay}, Iron=${level1.iron}, Crop=${level1.crop}`);
            
            if (data.levels.length >= 5) {
                const level5 = data.levels[4];
                console.log(`  ✓ Level 5: Wood=${level5.wood}, Clay=${level5.clay}, Iron=${level5.iron}, Crop=${level5.crop}`);
            }
        } else {
            console.log(`  ✗ Failed to extract data`);
        }
        
        // Small delay between buildings
        await wait(1000);
    }
    
    return allData;
}

// Run the scraper
console.log("\nStarting scraper...");
console.log("This will take about 1 minute to complete.\n");

scrapeAllBuildings().then(data => {
    console.log("\n" + "=".repeat(60));
    console.log("✅ SCRAPING COMPLETE!");
    console.log("=".repeat(60));
    
    // Count successful extractions
    const successCount = Object.keys(data).length;
    console.log(`\nSuccessfully scraped ${successCount}/${Object.keys(BUILDINGS).length} buildings`);
    
    // Create downloadable JSON
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create download link
    const blob = new Blob([jsonData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kirilloid_building_data.json';
    
    console.log("\n📥 Click here to download the data:");
    console.log(a);
    a.click();
    
    // Also log the data for copying
    console.log("\n📋 Or copy this JSON data:");
    console.log(jsonData);
    
    // Store in window for easy access
    window.TRAVIAN_DATA = data;
    console.log("\n💡 Data also stored in window.TRAVIAN_DATA");
    console.log("You can access it by typing: window.TRAVIAN_DATA");
}).catch(error => {
    console.error("❌ Error during scraping:", error);
});
