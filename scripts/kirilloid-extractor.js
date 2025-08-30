// Kirilloid Manual Data Extractor - Fixed Building Detection
// Correctly identifies buildings by their Level 1 costs

(function() {
    console.clear();
    console.log("🚀 Kirilloid Data Extractor v2 - Fixed Detection");
    console.log("="+"=".repeat(50));
    
    // Function to extract data from current page
    function getCurrentBuilding() {
        // Find the largest table
        let bestTable = null;
        let maxRows = 0;
        
        document.querySelectorAll('table').forEach(table => {
            const rows = table.querySelectorAll('tr');
            if (rows.length > maxRows) {
                maxRows = rows.length;
                bestTable = table;
            }
        });
        
        if (!bestTable || maxRows < 20) {
            return null;
        }
        
        const data = { levels: [] };
        const rows = bestTable.querySelectorAll('tr');
        
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td, th');
            
            if (cells.length >= 8) {
                const level = parseInt(cells[0].textContent.trim());
                
                if (level >= 1 && level <= 20) {
                    data.levels.push({
                        level: level,
                        wood: parseInt(cells[1].textContent.replace(/[,.\s]/g, '') || 0),
                        clay: parseInt(cells[2].textContent.replace(/[,.\s]/g, '') || 0),
                        iron: parseInt(cells[3].textContent.replace(/[,.\s]/g, '') || 0),
                        crop: parseInt(cells[4].textContent.replace(/[,.\s]/g, '') || 0),
                        population: parseInt(cells[5].textContent.replace(/[,.\s]/g, '') || 0),
                        culture_points: parseInt(cells[6].textContent.replace(/[,.\s]/g, '') || 0),
                        build_time: cells[7].textContent.trim()
                    });
                }
            }
        }
        
        // Identify building by Level 1 costs - FIXED VERSION
        if (data.levels.length > 0) {
            const l1 = data.levels[0];
            
            // Create a signature string for easier matching
            const sig = `${l1.wood}-${l1.clay}-${l1.iron}-${l1.crop}`;
            
            // Buildings by their exact signatures
            const buildingMap = {
                // Infrastructure
                "70-40-60-20": "Main Building",
                "130-160-90-40": "Warehouse",
                "80-100-70-20": "Granary",
                "110-160-90-70": "Rally Point",
                "80-70-120-70": "Marketplace",
                "180-130-150-80": "Embassy",
                
                // Military
                "210-140-260-120": "Barracks",
                "260-140-220-100": "Stables",
                "460-510-600-320": "Workshop",
                "220-160-90-40": "Academy",
                "180-250-500-160": "Smithy",
                
                // Village
                "40-50-30-10": "Cranny",
                "1250-1110-1260-600": "Town Hall",
                "580-460-350-180": "Residence",
                "550-800-750-250": "Palace",
                "700-670-700-240": "Hero Mansion",
                "2880-2740-2580-990": "Treasury",
                
                // Resource Fields
                "40-100-50-60": "Woodcutter",
                "80-40-80-50": "Clay Pit",
                "100-80-30-60": "Iron Mine",
                "70-90-70-20": "Cropland",
                
                // Resource Boosters
                "520-380-290-90": "Sawmill",
                "440-480-320-50": "Brickyard",
                "200-450-510-120": "Iron Foundry",
                "500-440-380-1240": "Grain Mill",
                "1200-1480-870-1600": "Bakery",
                
                // Walls
                "70-90-170-70": "City Wall",      // Romans
                "120-200-0-80": "Earth Wall",     // Teutons
                "160-100-80-60": "Palisade"       // Gauls
            };
            
            data.name = buildingMap[sig] || `Unknown (${sig})`;
            
            return data;
        }
        
        return null;
    }
    
    // Test current page
    console.log("\n📊 Checking current page...");
    const currentData = getCurrentBuilding();
    
    if (currentData) {
        console.log(`✅ Found: ${currentData.name}`);
        console.log(`   Levels: ${currentData.levels.length}`);
        const l1 = currentData.levels[0];
        console.log(`   Level 1: Wood=${l1.wood}, Clay=${l1.clay}, Iron=${l1.iron}, Crop=${l1.crop}`);
        
        if (currentData.name.startsWith("Unknown")) {
            console.log("   ⚠️ Unknown building - please report this signature!");
        }
    } else {
        console.log("❌ No building data found on page");
        console.log("   Make sure you're on: http://travian.kirilloid.ru/build.php");
    }
    
    // Setup collection system
    if (!window.KirilloidCollector) {
        window.KirilloidCollector = {
            data: {},
            
            addCurrent: function() {
                const building = getCurrentBuilding();
                if (building) {
                    if (building.name.startsWith("Unknown")) {
                        console.log(`⚠️ Unknown building with signature: ${building.name}`);
                        console.log("   Adding anyway - you can rename it later");
                    }
                    
                    const key = building.name.toLowerCase().replace(/ /g, '_').replace(/[()]/g, '');
                    this.data[key] = building;
                    console.log(`✅ Added ${building.name} (Total: ${Object.keys(this.data).length} buildings)`);
                    return building.name;
                } else {
                    console.log("❌ No building data found");
                    return null;
                }
            },
            
            list: function() {
                const collected = Object.keys(this.data);
                console.log(`\n📦 Collected ${collected.length} buildings:`);
                collected.forEach(key => {
                    const building = this.data[key];
                    const l1 = building.levels[0];
                    console.log(`   - ${building.name}: [${l1.wood}, ${l1.clay}, ${l1.iron}, ${l1.crop}]`);
                });
                
                // Show missing buildings
                const expected = [
                    "Main Building", "Warehouse", "Granary", "Rally Point", "Marketplace", "Embassy",
                    "Barracks", "Stables", "Workshop", "Academy", "Smithy",
                    "Cranny", "Town Hall", "Residence", "Palace", "Hero Mansion", "Treasury",
                    "Woodcutter", "Clay Pit", "Iron Mine", "Cropland",
                    "Sawmill", "Brickyard", "Iron Foundry", "Grain Mill", "Bakery",
                    "City Wall", "Earth Wall", "Palisade"
                ];
                
                const missing = expected.filter(name => {
                    const key = name.toLowerCase().replace(/ /g, '_');
                    return !this.data[key];
                });
                
                if (missing.length > 0) {
                    console.log(`\n📋 Still need to collect ${missing.length} buildings:`);
                    missing.forEach(name => console.log(`   - ${name}`));
                }
            },
            
            download: function() {
                const json = JSON.stringify(this.data, null, 2);
                const blob = new Blob([json], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'kirilloid_buildings.json';
                a.click();
                console.log(`💾 Downloaded ${Object.keys(this.data).length} buildings`);
            },
            
            clear: function() {
                this.data = {};
                console.log("🗑️ Cleared all data");
            },
            
            quickCollect: function() {
                console.log("\n🚀 Quick Collection Guide:");
                console.log("Change Kirilloid dropdown to each building and run addCurrent():");
                console.log("\n// Copy these commands one by one after selecting each building:");
                const buildings = [
                    "Main Building", "Warehouse", "Granary", "Rally Point",
                    "Marketplace", "Embassy", "Barracks", "Stables", 
                    "Workshop", "Academy", "Smithy", "Cranny",
                    "Town Hall", "Residence", "Palace", "Hero Mansion",
                    "Treasury", "Woodcutter", "Clay Pit", "Iron Mine",
                    "Cropland", "Sawmill", "Brickyard", "Iron Foundry",
                    "Grain Mill", "Bakery", "City Wall"
                ];
                
                buildings.forEach((name, i) => {
                    console.log(`// ${i+1}. Select "${name}" then run:`);
                    console.log(`KirilloidCollector.addCurrent()`);
                });
                
                console.log("\n// When done:");
                console.log("KirilloidCollector.download()");
            }
        };
    }
    
    console.log("\n" + "="+"=".repeat(50));
    console.log("📝 INSTRUCTIONS:");
    console.log("="+"=".repeat(50));
    console.log("\n1. Manually select a building from Kirilloid's dropdown");
    console.log("2. Run: KirilloidCollector.addCurrent()");
    console.log("3. Repeat for each building you want");
    console.log("4. Run: KirilloidCollector.download()");
    
    console.log("\n🛠️ Available Commands:");
    console.log("  KirilloidCollector.addCurrent()   - Add current building");
    console.log("  KirilloidCollector.list()          - Show collected buildings");
    console.log("  KirilloidCollector.download()      - Download JSON file");
    console.log("  KirilloidCollector.clear()         - Clear all data");
    console.log("  KirilloidCollector.quickCollect()  - Show collection guide");
    console.log("  KirilloidCollector.data            - View raw data");
    
    console.log("\n💡 TIP: Start by adding the current building:");
    console.log("  KirilloidCollector.addCurrent()");
    
})();