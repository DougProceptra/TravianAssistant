#!/usr/bin/env node

/**
 * Puppeteer-based Kirilloid Data Extractor for Replit
 * Extracts complete Travian game mechanics from kirilloid.ru
 * Stores data in SQLite database
 */

const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configuration
const DB_PATH = path.join(__dirname, '..', 'backend', 'travian.db');
const BASE_URL = 'http://travian.kirilloid.ru';
const HEADLESS = true; // Set to false for debugging

// Server configurations to extract
const SERVERS = [
    { name: 'T4-1x', code: 's=0', speed: 1 },
    { name: 'T4-2x', code: 's=1', speed: 2 },
    { name: 'T4-3x', code: 's=2', speed: 3 }
];

// Validation data for T4 2x Main Building Level 6
const VALIDATION_DATA = {
    building: 'main_building',
    level: 6,
    server_speed: 2,
    expected: {
        wood: 240,
        clay: 135,
        iron: 205,
        crop: 70
    }
};

class KirilloidExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.db = null;
        this.extractedData = {
            buildings: [],
            troops: [],
            mechanics: []
        };
    }

    async initialize() {
        console.log('🚀 Initializing Kirilloid Extractor...');
        
        // Initialize database
        this.db = new Database(DB_PATH);
        this.setupDatabase();
        
        // Launch Puppeteer with Replit-friendly options
        this.browser = await puppeteer.launch({
            headless: HEADLESS,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set viewport and user agent
        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Enable console logging from page
        this.page.on('console', msg => {
            if (msg.type() === 'log') {
                console.log('PAGE LOG:', msg.text());
            }
        });
        
        console.log('✅ Initialization complete');
    }

    setupDatabase() {
        // Create tables if they don't exist
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS game_data_buildings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_version TEXT NOT NULL,
                server_speed INTEGER NOT NULL,
                building_id TEXT NOT NULL,
                building_name TEXT NOT NULL,
                level INTEGER NOT NULL,
                wood_cost INTEGER,
                clay_cost INTEGER,
                iron_cost INTEGER,
                crop_cost INTEGER,
                time_seconds INTEGER,
                population INTEGER,
                culture_points INTEGER,
                effect_value REAL,
                effect_description TEXT,
                UNIQUE(server_version, server_speed, building_id, level)
            );

            CREATE TABLE IF NOT EXISTS game_data_troops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_version TEXT NOT NULL,
                server_speed INTEGER NOT NULL,
                tribe TEXT NOT NULL,
                unit_id TEXT NOT NULL,
                unit_name TEXT NOT NULL,
                attack INTEGER,
                defense_infantry INTEGER,
                defense_cavalry INTEGER,
                speed_fields_per_hour INTEGER,
                carry_capacity INTEGER,
                upkeep_per_hour INTEGER,
                training_time_seconds INTEGER,
                wood_cost INTEGER,
                clay_cost INTEGER,
                iron_cost INTEGER,
                crop_cost INTEGER,
                UNIQUE(server_version, server_speed, tribe, unit_id)
            );

            CREATE TABLE IF NOT EXISTS game_data_mechanics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_version TEXT NOT NULL,
                server_speed INTEGER NOT NULL,
                mechanic_type TEXT NOT NULL,
                mechanic_key TEXT NOT NULL,
                mechanic_value TEXT NOT NULL,
                UNIQUE(server_version, server_speed, mechanic_type, mechanic_key)
            );
        `);
    }

    async navigateToPage(url) {
        console.log(`📍 Navigating to: ${url}`);
        await this.page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait a bit for dynamic content
        await this.page.waitForTimeout(2000);
    }

    async selectServer(serverCode) {
        console.log(`🔄 Selecting server: ${serverCode}`);
        
        // Check if server selector exists
        const hasSelector = await this.page.evaluate(() => {
            return document.querySelector('select#server') !== null;
        });
        
        if (hasSelector) {
            // Change server via dropdown
            await this.page.select('select#server', serverCode.split('=')[1]);
            await this.page.waitForTimeout(1000);
        } else {
            // Navigate with query parameter
            const currentUrl = this.page.url();
            const baseUrl = currentUrl.split('?')[0];
            await this.navigateToPage(`${baseUrl}?${serverCode}`);
        }
    }

    async extractBuildingData(server) {
        console.log(`\n🏗️ Extracting building data for ${server.name}...`);
        
        // Navigate to buildings page
        await this.navigateToPage(`${BASE_URL}/build.php?${server.code}`);
        
        // First, reconnaissance - find all available data
        const availableData = await this.page.evaluate(() => {
            const vars = {};
            
            // Check for global variables
            if (typeof window.buildings !== 'undefined') {
                vars.buildings = 'found';
            }
            if (typeof window.BUILD !== 'undefined') {
                vars.BUILD = 'found';
            }
            
            // Check for data in tables
            const tables = document.querySelectorAll('table');
            vars.tables = tables.length;
            
            // Look for building links
            const buildingLinks = Array.from(document.querySelectorAll('a[href*="build.php?b="]'));
            vars.buildingCount = buildingLinks.length;
            
            return vars;
        });
        
        console.log('Available data:', availableData);
        
        // Extract Main Building data for validation
        await this.navigateToPage(`${BASE_URL}/build.php?${server.code}&b=15`); // Main Building ID
        
        const mainBuildingData = await this.page.evaluate(() => {
            const data = [];
            const tables = document.querySelectorAll('table.f10');
            
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                
                rows.forEach((row, index) => {
                    if (index === 0) return; // Skip header
                    
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        const level = parseInt(cells[0]?.textContent?.trim()) || index;
                        
                        // Parse resource costs
                        const resources = cells[1]?.textContent?.trim().split(' ');
                        const wood = parseInt(resources?.[0]?.replace(/\D/g, '')) || 0;
                        const clay = parseInt(resources?.[1]?.replace(/\D/g, '')) || 0;
                        const iron = parseInt(resources?.[2]?.replace(/\D/g, '')) || 0;
                        const crop = parseInt(resources?.[3]?.replace(/\D/g, '')) || 0;
                        
                        // Parse time
                        const timeText = cells[2]?.textContent?.trim() || '0:00:00';
                        const timeParts = timeText.split(':').map(p => parseInt(p) || 0);
                        const timeSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                        
                        // Parse population
                        const population = parseInt(cells[3]?.textContent?.replace(/\D/g, '')) || 0;
                        
                        // Parse culture points
                        const culturePoints = parseInt(cells[4]?.textContent?.replace(/\D/g, '')) || 0;
                        
                        data.push({
                            level,
                            wood,
                            clay,
                            iron,
                            crop,
                            timeSeconds,
                            population,
                            culturePoints
                        });
                    }
                });
            });
            
            return data;
        });
        
        console.log(`Extracted ${mainBuildingData.length} levels for Main Building`);
        
        // Store in database
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO game_data_buildings (
                server_version, server_speed, building_id, building_name, level,
                wood_cost, clay_cost, iron_cost, crop_cost,
                time_seconds, population, culture_points
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        mainBuildingData.forEach(data => {
            stmt.run(
                'T4', server.speed, 'main_building', 'Main Building', data.level,
                data.wood, data.clay, data.iron, data.crop,
                data.timeSeconds, data.population, data.culturePoints
            );
        });
        
        // Validate Level 6 for 2x speed
        if (server.speed === 2 && mainBuildingData.length >= 6) {
            const level6 = mainBuildingData[5]; // 0-indexed
            console.log('\n🔍 Validation Check for T4 2x Main Building Level 6:');
            console.log('Expected:', VALIDATION_DATA.expected);
            console.log('Extracted:', {
                wood: level6.wood,
                clay: level6.clay,
                iron: level6.iron,
                crop: level6.crop
            });
            
            const isValid = 
                level6.wood === VALIDATION_DATA.expected.wood &&
                level6.clay === VALIDATION_DATA.expected.clay &&
                level6.iron === VALIDATION_DATA.expected.iron &&
                level6.crop === VALIDATION_DATA.expected.crop;
            
            if (isValid) {
                console.log('✅ VALIDATION PASSED!');
            } else {
                console.log('❌ VALIDATION FAILED - Data mismatch!');
            }
        }
        
        return mainBuildingData;
    }

    async extractAllBuildings(server) {
        console.log(`\n🏗️ Extracting ALL buildings for ${server.name}...`);
        
        // Building IDs from Travian
        const buildingIds = {
            1: 'woodcutter',
            2: 'clay_pit',
            3: 'iron_mine',
            4: 'cropland',
            5: 'sawmill',
            6: 'brickyard',
            7: 'iron_foundry',
            8: 'grain_mill',
            9: 'bakery',
            10: 'warehouse',
            11: 'granary',
            13: 'smithy',
            14: 'tournament_square',
            15: 'main_building',
            16: 'rally_point',
            17: 'marketplace',
            18: 'embassy',
            19: 'barracks',
            20: 'stable',
            21: 'workshop',
            22: 'academy',
            23: 'cranny',
            24: 'town_hall',
            25: 'residence',
            26: 'palace',
            27: 'treasury',
            28: 'trade_office',
            29: 'great_barracks',
            30: 'great_stable',
            31: 'city_wall',
            32: 'earth_wall',
            33: 'palisade',
            34: 'stonemason',
            35: 'brewery',
            36: 'trapper',
            37: 'hero_mansion',
            38: 'great_warehouse',
            39: 'great_granary',
            40: 'wonder_of_the_world',
            41: 'horse_drinking_trough',
            42: 'water_ditch',
            43: 'natarian_wall',
            44: 'hidden_treasury',
            45: 'great_workshop'
        };
        
        let totalExtracted = 0;
        
        for (const [id, name] of Object.entries(buildingIds)) {
            try {
                console.log(`  Extracting ${name} (ID: ${id})...`);
                await this.navigateToPage(`${BASE_URL}/build.php?${server.code}&b=${id}`);
                
                // Check if page has data
                const hasData = await this.page.evaluate(() => {
                    const tables = document.querySelectorAll('table.f10');
                    return tables.length > 0;
                });
                
                if (!hasData) {
                    console.log(`    ⚠️ No data found for ${name}`);
                    continue;
                }
                
                const buildingData = await this.page.evaluate((buildingName) => {
                    const data = [];
                    const tables = document.querySelectorAll('table.f10');
                    
                    tables.forEach(table => {
                        const rows = table.querySelectorAll('tr');
                        
                        rows.forEach((row, index) => {
                            if (index === 0) return; // Skip header
                            
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 4) {
                                const level = parseInt(cells[0]?.textContent?.trim()) || index;
                                
                                // Parse resource costs (format: "wood clay iron crop")
                                const resourceText = cells[1]?.textContent?.trim() || '0 0 0 0';
                                const resources = resourceText.split(/\s+/).map(r => parseInt(r.replace(/\D/g, '')) || 0);
                                
                                // Ensure we have 4 resource values
                                while (resources.length < 4) resources.push(0);
                                
                                // Parse time
                                const timeText = cells[2]?.textContent?.trim() || '0:00:00';
                                const timeParts = timeText.split(':').map(p => parseInt(p) || 0);
                                const timeSeconds = timeParts[0] * 3600 + (timeParts[1] || 0) * 60 + (timeParts[2] || 0);
                                
                                // Parse population and culture points if available
                                const population = cells[3] ? parseInt(cells[3].textContent?.replace(/\D/g, '')) || 0 : 0;
                                const culturePoints = cells[4] ? parseInt(cells[4].textContent?.replace(/\D/g, '')) || 0 : 0;
                                
                                data.push({
                                    building: buildingName,
                                    level,
                                    wood: resources[0],
                                    clay: resources[1],
                                    iron: resources[2],
                                    crop: resources[3],
                                    timeSeconds,
                                    population,
                                    culturePoints
                                });
                            }
                        });
                    });
                    
                    return data;
                }, name);
                
                if (buildingData.length > 0) {
                    console.log(`    ✅ Extracted ${buildingData.length} levels`);
                    
                    // Store in database
                    const stmt = this.db.prepare(`
                        INSERT OR REPLACE INTO game_data_buildings (
                            server_version, server_speed, building_id, building_name, level,
                            wood_cost, clay_cost, iron_cost, crop_cost,
                            time_seconds, population, culture_points
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);
                    
                    buildingData.forEach(data => {
                        stmt.run(
                            'T4', server.speed, name, name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
                            data.level,
                            data.wood, data.clay, data.iron, data.crop,
                            data.timeSeconds, data.population, data.culturePoints
                        );
                    });
                    
                    totalExtracted += buildingData.length;
                }
                
                // Small delay to avoid overwhelming the server
                await this.page.waitForTimeout(500);
                
            } catch (error) {
                console.log(`    ❌ Error extracting ${name}: ${error.message}`);
            }
        }
        
        console.log(`\n✅ Total building levels extracted: ${totalExtracted}`);
        return totalExtracted;
    }

    async extractTroopData(server) {
        console.log(`\n⚔️ Extracting troop data for ${server.name}...`);
        
        // Navigate to troops page
        await this.navigateToPage(`${BASE_URL}/troops.php?${server.code}`);
        
        // Extract troop data for each tribe
        const tribes = ['romans', 'teutons', 'gauls', 'nature', 'natars', 'egyptians', 'huns'];
        let totalExtracted = 0;
        
        for (const tribe of tribes) {
            console.log(`  Extracting ${tribe} troops...`);
            
            // Try to select tribe
            const tribeData = await this.page.evaluate((tribeName) => {
                // Look for tribe selector or direct data
                const data = [];
                
                // Find tables with troop data
                const tables = document.querySelectorAll('table');
                
                tables.forEach(table => {
                    const rows = table.querySelectorAll('tr');
                    
                    rows.forEach((row, index) => {
                        if (index === 0) return; // Skip header
                        
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 7) {
                            // Extract unit name and stats
                            const unitName = cells[0]?.textContent?.trim();
                            if (!unitName || unitName.length === 0) return;
                            
                            const attack = parseInt(cells[1]?.textContent?.replace(/\D/g, '')) || 0;
                            const defInfantry = parseInt(cells[2]?.textContent?.replace(/\D/g, '')) || 0;
                            const defCavalry = parseInt(cells[3]?.textContent?.replace(/\D/g, '')) || 0;
                            const speed = parseInt(cells[4]?.textContent?.replace(/\D/g, '')) || 0;
                            const capacity = parseInt(cells[5]?.textContent?.replace(/\D/g, '')) || 0;
                            const upkeep = parseInt(cells[6]?.textContent?.replace(/\D/g, '')) || 0;
                            
                            data.push({
                                tribe: tribeName,
                                unitName,
                                attack,
                                defInfantry,
                                defCavalry,
                                speed,
                                capacity,
                                upkeep
                            });
                        }
                    });
                });
                
                return data;
            }, tribe);
            
            if (tribeData.length > 0) {
                console.log(`    ✅ Extracted ${tribeData.length} units`);
                
                // Store in database
                const stmt = this.db.prepare(`
                    INSERT OR REPLACE INTO game_data_troops (
                        server_version, server_speed, tribe, unit_id, unit_name,
                        attack, defense_infantry, defense_cavalry,
                        speed_fields_per_hour, carry_capacity, upkeep_per_hour,
                        training_time_seconds, wood_cost, clay_cost, iron_cost, crop_cost
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                tribeData.forEach((data, index) => {
                    stmt.run(
                        'T4', server.speed, tribe, `${tribe}_unit_${index + 1}`, data.unitName,
                        data.attack, data.defInfantry, data.defCavalry,
                        data.speed, data.capacity, data.upkeep,
                        0, 0, 0, 0, 0 // Will need to extract costs separately
                    );
                });
                
                totalExtracted += tribeData.length;
            }
        }
        
        console.log(`\n✅ Total troops extracted: ${totalExtracted}`);
        return totalExtracted;
    }

    async extractMechanics(server) {
        console.log(`\n⚙️ Extracting game mechanics for ${server.name}...`);
        
        // Culture points for settlements
        await this.navigateToPage(`${BASE_URL}/culture.php?${server.code}`);
        
        const cultureData = await this.page.evaluate(() => {
            const data = [];
            const tables = document.querySelectorAll('table');
            
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                
                rows.forEach((row, index) => {
                    if (index === 0) return; // Skip header
                    
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const villageNum = parseInt(cells[0]?.textContent?.trim());
                        const culturePoints = parseInt(cells[1]?.textContent?.replace(/\D/g, ''));
                        
                        if (villageNum && culturePoints) {
                            data.push({
                                villageNumber: villageNum,
                                requiredCP: culturePoints
                            });
                        }
                    }
                });
            });
            
            return data;
        });
        
        if (cultureData.length > 0) {
            console.log(`  ✅ Extracted ${cultureData.length} culture point requirements`);
            
            // Store in database
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO game_data_mechanics (
                    server_version, server_speed, mechanic_type, mechanic_key, mechanic_value
                ) VALUES (?, ?, ?, ?, ?)
            `);
            
            cultureData.forEach(data => {
                stmt.run(
                    'T4', server.speed, 'culture_points', 
                    `village_${data.villageNumber}`, 
                    data.requiredCP.toString()
                );
            });
        }
        
        return cultureData.length;
    }

    async extractForAllServers() {
        console.log('\n🌍 Extracting data for all servers...\n');
        
        for (const server of SERVERS) {
            console.log(`\n${'='.repeat(50)}`);
            console.log(`SERVER: ${server.name}`);
            console.log(`${'='.repeat(50)}`);
            
            try {
                // Extract Main Building first for validation
                await this.extractBuildingData(server);
                
                // If validation passes for 2x, extract everything else
                if (server.speed === 2) {
                    await this.extractAllBuildings(server);
                    await this.extractTroopData(server);
                    await this.extractMechanics(server);
                }
                
            } catch (error) {
                console.error(`❌ Error extracting ${server.name}:`, error.message);
            }
        }
    }

    async queryDatabase() {
        console.log('\n📊 Database Query Results:\n');
        
        // Query Main Building Level 6 for 2x speed
        const query = this.db.prepare(`
            SELECT * FROM game_data_buildings 
            WHERE building_name = 'Main Building' 
            AND level = 6 
            AND server_speed = 2
        `).get();
        
        if (query) {
            console.log('Main Building Level 6 (T4 2x):');
            console.log(`  Wood: ${query.wood_cost}`);
            console.log(`  Clay: ${query.clay_cost}`);
            console.log(`  Iron: ${query.iron_cost}`);
            console.log(`  Crop: ${query.crop_cost}`);
            console.log(`  Time: ${query.time_seconds} seconds`);
            console.log(`  Population: ${query.population}`);
            console.log(`  Culture Points: ${query.culture_points}`);
        }
        
        // Count total records
        const counts = {
            buildings: this.db.prepare('SELECT COUNT(*) as count FROM game_data_buildings').get().count,
            troops: this.db.prepare('SELECT COUNT(*) as count FROM game_data_troops').get().count,
            mechanics: this.db.prepare('SELECT COUNT(*) as count FROM game_data_mechanics').get().count
        };
        
        console.log('\n📈 Database Statistics:');
        console.log(`  Buildings: ${counts.buildings} records`);
        console.log(`  Troops: ${counts.troops} records`);
        console.log(`  Mechanics: ${counts.mechanics} records`);
        console.log(`  Total: ${counts.buildings + counts.troops + counts.mechanics} records`);
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        if (this.db) {
            this.db.close();
        }
        console.log('\n👋 Cleanup complete');
    }

    async run() {
        try {
            await this.initialize();
            await this.extractForAllServers();
            await this.queryDatabase();
        } catch (error) {
            console.error('❌ Fatal error:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Main execution
if (require.main === module) {
    console.log(`
╔════════════════════════════════════════════════╗
║     Kirilloid Data Extractor (Puppeteer)      ║
║            Travian Game Mechanics              ║
╚════════════════════════════════════════════════╝
`);
    
    const extractor = new KirilloidExtractor();
    extractor.run().then(() => {
        console.log('\n✅ Extraction complete!');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ Extraction failed:', error);
        process.exit(1);
    });
}

module.exports = KirilloidExtractor;
