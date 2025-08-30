const { chromium } = require('playwright');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'backend', 'travian.db');
const VALIDATION = {
    level: 6,
    expected: { wood: 240, clay: 135, iron: 205, crop: 70 }
};

(async () => {
    console.log('🎭 Extracting with Playwright...\n');
    
    let browser;
    try {
        // Setup database
        const db = new Database(DB_PATH);
        db.exec(`
            CREATE TABLE IF NOT EXISTS game_data_buildings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_version TEXT,
                server_speed INTEGER,
                building_id TEXT,
                building_name TEXT,
                level INTEGER,
                wood_cost INTEGER,
                clay_cost INTEGER,
                iron_cost INTEGER,
                crop_cost INTEGER,
                time_seconds INTEGER,
                population INTEGER,
                culture_points INTEGER,
                UNIQUE(server_version, server_speed, building_id, level)
            )
        `);
        
        // Launch browser with minimal requirements
        console.log('🌐 Launching browser...');
        browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 10000 
        });
        console.log('✅ Browser launched!');
        
        const page = await browser.newPage();
        
        // Navigate
        const url = 'http://travian.kirilloid.ru/build.php?s=1&b=15';
        console.log(`📍 Going to: ${url}`);
        await page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        console.log('✅ Page loaded!');
        
        // Extract data
        console.log('📊 Extracting data...');
        const data = await page.evaluate(() => {
            const rows = document.querySelectorAll('table tr');
            const results = [];
            
            for (let i = 1; i < rows.length && i <= 20; i++) {
                const cells = rows[i]?.querySelectorAll('td');
                if (!cells || cells.length < 3) continue;
                
                const numbers = cells[1]?.textContent?.match(/\d+/g);
                if (numbers && numbers.length >= 4) {
                    results.push({
                        level: i,
                        wood: parseInt(numbers[0]),
                        clay: parseInt(numbers[1]),
                        iron: parseInt(numbers[2]),
                        crop: parseInt(numbers[3])
                    });
                }
            }
            return results;
        });
        
        console.log(`✅ Extracted ${data.length} levels\n`);
        
        // Show first few levels
        console.log('Sample data:');
        data.slice(0, 3).forEach(d => {
            console.log(`  Level ${d.level}: W=${d.wood}, C=${d.clay}, I=${d.iron}, Cr=${d.crop}`);
        });
        
        // Validate Level 6
        if (data.length >= 6) {
            const level6 = data[5];
            console.log('\n🎯 VALIDATION - Level 6:');
            console.log('Expected:', VALIDATION.expected);
            console.log('Got:', level6);
            
            const valid = 
                level6.wood === VALIDATION.expected.wood &&
                level6.clay === VALIDATION.expected.clay &&
                level6.iron === VALIDATION.expected.iron &&
                level6.crop === VALIDATION.expected.crop;
            
            console.log(valid ? '\n✅✅✅ VALIDATION PASSED!' : '\n❌ VALIDATION FAILED');
            
            // Store in DB
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO game_data_buildings 
                (server_version, server_speed, building_id, building_name, 
                 level, wood_cost, clay_cost, iron_cost, crop_cost)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            data.forEach(d => {
                stmt.run('T4', 2, 'main_building', 'Main Building',
                    d.level, d.wood, d.clay, d.iron, d.crop);
            });
            
            console.log('💾 Saved to database');
        }
        
        db.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Try adding missing dependencies in Replit System Dependencies pane');
    } finally {
        if (browser) await browser.close();
        console.log('\n✅ Done!');
    }
})();
