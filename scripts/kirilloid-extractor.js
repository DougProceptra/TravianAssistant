// Kirilloid Manual Data Extractor
// Fresh version - no conflicts with previous runs

(function() {
    console.clear();
    console.log("🚀 Kirilloid Data Extractor - Clean Start");
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
        
        // Identify building by Level 1 costs
        if (data.levels.length > 0) {
            const l1 = data.levels[0];
            
            // Common buildings
            if (l1.wood === 220 && l1.clay === 160) data.name = "Academy";
            else if (l1.wood === 460 && l1.clay === 510) data.name = "Workshop";
            else if (l1.wood === 70 && l1.clay === 40) data.name = "Main Building";
            else if (l1.wood === 210 && l1.clay === 140) data.name = "Barracks";
            else if (l1.wood === 180 && l1.clay === 250) data.name = "Smithy";
            else if (l1.wood === 260 && l1.clay === 140) data.name = "Stables";
            else if (l1.wood === 130 && l1.clay === 160) data.name = "Warehouse";
            else if (l1.wood === 80 && l1.clay === 100) data.name = "Granary";
            else if (l1.wood === 110 && l1.clay === 160) data.name = "Rally Point";
            else if (l1.wood === 80 && l1.clay === 70) data.name = "Marketplace";
            else if (l1.wood === 180 && l1.clay === 130) data.name = "Embassy";
            else if (l1.wood === 40 && l1.clay === 50) data.name = "Cranny";
            else if (l1.wood === 1250 && l1.clay === 1110) data.name = "Town Hall";
            else if (l1.wood === 580 && l1.clay === 460) data.name = "Residence";
            else if (l1.wood === 550 && l1.clay === 800) data.name = "Palace";
            else if (l1.wood === 700 && l1.clay === 670) data.name = "Hero Mansion";
            else if (l1.wood === 2880 && l1.clay === 2740) data.name = "Treasury";
            
            // Resource fields
            else if (l1.wood === 40 && l1.clay === 100) data.name = "Woodcutter";
            else if (l1.wood === 80 && l1.clay === 40) data.name = "Clay Pit";
            else if (l1.wood === 100 && l1.clay === 80) data.name = "Iron Mine";
            else if (l1.wood === 70 && l1.clay === 90) data.name = "Cropland";
            
            // Resource boosters
            else if (l1.wood === 520 && l1.clay === 380) data.name = "Sawmill";
            else if (l1.wood === 440 && l1.clay === 480) data.name = "Brickyard";
            else if (l1.wood === 200 && l1.clay === 450) data.name = "Iron Foundry";
            else if (l1.wood === 500 && l1.clay === 440) data.name = "Grain Mill";
            else if (l1.wood === 1200 && l1.clay === 1480) data.name = "Bakery";
            
            // Walls
            else if (l1.wood === 70 && l1.clay === 90 && l1.iron === 170) data.name = "City Wall";
            else if (l1.wood === 120 && l1.clay === 200 && l1.iron === 0) data.name = "Earth Wall";
            else if (l1.wood === 160 && l1.clay === 100 && l1.iron === 80) data.name = "Palisade";
            
            else data.name = "Unknown";
            
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
                if (building && building.name !== "Unknown") {
                    const key = building.name.toLowerCase().replace(/ /g, '_');
                    this.data[key] = building;
                    console.log(`✅ Added ${building.name} (Total: ${Object.keys(this.data).length} buildings)`);
                    return building.name;
                } else {
                    console.log("❌ Could not identify building");
                    return null;
                }
            },
            
            list: function() {
                const collected = Object.keys(this.data);
                console.log(`\n📦 Collected ${collected.length} buildings:`);
                collected.forEach(key => {
                    console.log(`   - ${this.data[key].name}`);
                });
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
    console.log("  KirilloidCollector.addCurrent() - Add current building");
    console.log("  KirilloidCollector.list()        - Show collected buildings");
    console.log("  KirilloidCollector.download()    - Download JSON file");
    console.log("  KirilloidCollector.clear()       - Clear all data");
    console.log("  KirilloidCollector.data          - View raw data");
    
    console.log("\n💡 TIP: Start by adding the current building:");
    console.log("  KirilloidCollector.addCurrent()");
    
})();