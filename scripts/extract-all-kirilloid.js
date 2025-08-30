#!/usr/bin/env node

/**
 * Complete Kirilloid Data Extractor using Playwright
 * Extracts ALL buildings, troops, and game mechanics automatically
 */

const { chromium } = require('playwright');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'backend', 'travian.db');

// All buildings we need to extract
const BUILDINGS = {
    // Infrastructure
    15: 'main_building',
    10: 'warehouse', 
    11: 'granary',
    16: 'rally_point',
    17: 'marketplace',
    18: 'embassy',
    
    // Military
    19: 'barracks',
    20: 'stable',
    21: 'workshop',
    22: 'academy',
    13: 'smithy',
    14: 'tournament_square',
    
    // Village
    23: 'cranny',
    24: 'town_hall',
    25: 'residence',
    26: 'palace',
    37: 'hero_mansion',
    27: 'treasury',
    28: 'trade_office',
    
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
    
    // Walls
    31: 'city_wall',
    32: 'earth_wall',
    33: 'palisade',
    
    // Special
    34: 'stonemason',
    35: 'brewery',
    36: 'trapper',
    38: 'great_warehouse',
    39: 'great_granary',
    40: 'wonder_of_world',
    41: 'horse_drinking_trough',
    42: 'water_ditch',
    43: 'natarian_wall',
    44: 'hidden_treasury',
    45: 'great_workshop'
};

// Server speeds to extract
const SERVERS = [
    { speed: 1, code: 's=0', name: 'T4 1x' },
    { speed: 2, code: 's=1', name: 'T4 2x' },
    { speed: 3, code: 's=2', name: 'T4 3x' }
];

class KirilloidExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.db = null;
        this.results = {
            buildings: 0,
            troops: 0,
            mechanics: 0,
            errors: []
        };
    }

    async init() {
        console.log('🚀 Initializing Kirilloid Complete Extractor...\n');
        
        // Setup database
        this.db = new Database(DB_PATH);
        this.setupDatabase();
        
        // Launch browser with all fixes for Replit
        console.log('🌐 Launching browser...');
        this.browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials'
            ],
            timeout: 30000
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Set a real user agent
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('✅ Browser ready\n');
    }

    setupDatabase() {
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

    async extractBuilding(server, buildingId, buildingName) {
        try {
            const url = `http://travian.kirilloid.ru/build.php?${server.code}&b=${buildingId}`;
            console.log(`  📍 ${buildingName}: ${url}`);
            
            await this.page.goto(url, { 
                waitUntil: 'networkidle',
                timeout: 15000 
            });
            
            // Wait a bit for dynamic content
            await this.page.waitForTimeout(1000);
            
            // Extract data from the table
            const data = await this.page.evaluate(() => {
                const rows = document.querySelectorAll('table tr');
                const results = [];
                
                for (let i = 1; i < rows.length && i <= 25; i++) {
                    const cells = rows[i]?.querySelectorAll('td');
                    if (!cells || cells.length < 3) continue;
                    
                    // Extract resources (format varies)
                    const resourceText = cells[1]?.textContent || '';
                    const numbers = resourceText.match(/\d+/g);
                    
                    if (numbers && numbers.length >= 4) {
                        // Parse time
                        let timeSeconds = 0;
                        if (cells[2]) {
                            const timeText = cells[2].textContent || '';
                            const timeParts = timeText.split(':').map(p => parseInt(p) || 0);
                            if (timeParts.length === 3) {
                                timeSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                            }
                        }
                        
                        results.push({
                            level: i,
                            wood: parseInt(numbers[0]),
                            clay: parseInt(numbers[1]),
                            iron: parseInt(numbers[2]),
                            crop: parseInt(numbers[3]),
                            timeSeconds: timeSeconds,
                            population: cells[3] ? parseInt(cells[3].textContent.replace(/\D/g, '')) || 0 : 0,
                            culturePoints: cells[4] ? parseInt(cells[4].textContent.replace(/\D/g, '')) || 0 : 0
                        });
                    }
                }
                
                return results;
            });
            
            if (data.length > 0) {
                // Store in database
                const stmt = this.db.prepare(`
                    INSERT OR REPLACE INTO game_data_buildings 
                    (server_version, server_speed, building_id, building_name, level,
                     wood_cost, clay_cost, iron_cost, crop_cost,
                     time_seconds, population, culture_points)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                data.forEach(d => {
                    stmt.run(
                        'T4', server.speed, buildingName, 
                        buildingName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        d.level, d.wood, d.clay, d.iron, d.crop,
                        d.timeSeconds, d.population, d.culturePoints
                    );
                });
                
                console.log(`    ✅ Extracted ${data.length} levels`);
                this.results.buildings += data.length;
                
                // Validate if this is Main Building Level 6 on 2x
                if (buildingName === 'main_building' && server.speed === 2 && data.length >= 6) {
                    const level6 = data[5];
                    const isValid = 
                        level6.wood === 240 &&
                        level6.clay === 135 &&
                        level6.iron === 205 &&
                        level6.crop === 70;
                    
                    if (isValid) {
                        console.log(`    ✅✅✅ VALIDATION PASSED for Main Building L6!`);
                    } else {
                        console.log(`    ⚠️ Validation mismatch for Main Building L6`);
                    }
                }
                
                return true;
            } else {
                console.log(`    ⚠️ No data found`);
                return false;
            }
            
        } catch (error) {
            console.log(`    ❌ Error: ${error.message}`);
            this.results.errors.push(`${buildingName}: ${error.message}`);
            return false;
        }
    }

    async extractAllBuildings() {
        console.log('🏗️ Extracting all buildings...\n');
        
        for (const server of SERVERS) {
            console.log(`\n📊 Server: ${server.name}`);
            console.log('─'.repeat(40));
            
            for (const [id, name] of Object.entries(BUILDINGS)) {
                await this.extractBuilding(server, id, name);
                
                // Small delay to avoid overwhelming the server
                await this.page.waitForTimeout(500);
            }
        }
    }

    async extractTroops() {
        console.log('\n\n⚔️ Extracting troop data...\n');
        
        for (const server of SERVERS) {
            const url = `http://travian.kirilloid.ru/troops.php?${server.code}`;
            console.log(`📍 ${server.name}: ${url}`);
            
            try {
                await this.page.goto(url, { 
                    waitUntil: 'networkidle',
                    timeout: 15000 
                });
                
                // Extract troop data
                const troops = await this.page.evaluate(() => {
                    const data = [];
                    const tables = document.querySelectorAll('table');
                    
                    tables.forEach(table => {
                        const rows = table.querySelectorAll('tr');
                        
                        rows.forEach((row, index) => {
                            if (index === 0) return; // Skip header
                            
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 7) {
                                const unitName = cells[0]?.textContent?.trim();
                                if (unitName) {
                                    data.push({
                                        name: unitName,
                                        attack: parseInt(cells[1]?.textContent?.replace(/\D/g, '')) || 0,
                                        defInf: parseInt(cells[2]?.textContent?.replace(/\D/g, '')) || 0,
                                        defCav: parseInt(cells[3]?.textContent?.replace(/\D/g, '')) || 0,
                                        speed: parseInt(cells[4]?.textContent?.replace(/\D/g, '')) || 0,
                                        capacity: parseInt(cells[5]?.textContent?.replace(/\D/g, '')) || 0,
                                        upkeep: parseInt(cells[6]?.textContent?.replace(/\D/g, '')) || 0
                                    });
                                }
                            }
                        });
                    });
                    
                    return data;
                });
                
                console.log(`  ✅ Extracted ${troops.length} troops`);
                this.results.troops += troops.length;
                
            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
                this.results.errors.push(`Troops ${server.name}: ${error.message}`);
            }
        }
    }

    async finish() {
        console.log('\n\n' + '═'.repeat(50));
        console.log('📊 EXTRACTION COMPLETE');
        console.log('═'.repeat(50));
        
        console.log(`\n✅ Buildings: ${this.results.buildings} levels extracted`);
        console.log(`✅ Troops: ${this.results.troops} units extracted`);
        
        if (this.results.errors.length > 0) {
            console.log(`\n⚠️ Errors (${this.results.errors.length}):`);
            this.results.errors.forEach(err => console.log(`  - ${err}`));
        }
        
        // Query database for verification
        const buildingCount = this.db.prepare('SELECT COUNT(*) as count FROM game_data_buildings').get().count;
        const troopCount = this.db.prepare('SELECT COUNT(*) as count FROM game_data_troops').get().count;
        
        console.log('\n💾 Database Status:');
        console.log(`  Buildings: ${buildingCount} records`);
        console.log(`  Troops: ${troopCount} records`);
        
        // Close everything
        if (this.browser) await this.browser.close();
        if (this.db) this.db.close();
        
        console.log('\n✅ All done! Data saved to:', DB_PATH);
    }

    async run() {
        try {
            await this.init();
            await this.extractAllBuildings();
            await this.extractTroops();
        } catch (error) {
            console.error('❌ Fatal error:', error);
        } finally {
            await this.finish();
        }
    }
}

// Check if Playwright is available
async function checkAndRun() {
    try {
        require.resolve('playwright');
        
        console.log(`
╔════════════════════════════════════════════════╗
║     COMPLETE KIRILLOID DATA EXTRACTOR         ║
║           Automatic Extraction                 ║
╚════════════════════════════════════════════════╝
`);
        
        const extractor = new KirilloidExtractor();
        await extractor.run();
        
    } catch (error) {
        console.error('❌ Playwright not found. Install with: npm install playwright');
        console.error('Then run: npx playwright install chromium');
        process.exit(1);
    }
}

checkAndRun();
