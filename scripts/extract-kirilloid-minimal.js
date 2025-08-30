#!/usr/bin/env node

/**
 * Minimal Puppeteer Kirilloid Extractor - Proof of Concept
 * Focuses on extracting just Main Building data to validate approach
 */

const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, '..', 'backend', 'travian.db');

// Validation checkpoint
const VALIDATION = {
    server: 'T4 2x',
    building: 'Main Building',
    level: 6,
    expected: { wood: 240, clay: 135, iron: 205, crop: 70 }
};

async function extractMainBuilding() {
    console.log('🚀 Starting Minimal Kirilloid Extractor...\n');
    
    let browser;
    let db;
    
    try {
        // 1. Setup database
        console.log('📦 Setting up database...');
        db = new Database(DB_PATH);
        
        // Create table if not exists
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
        
        // 2. Launch Puppeteer
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'log') {
                console.log('  PAGE:', msg.text());
            }
        });
        
        // 3. Navigate to Main Building page for T4 2x
        const url = 'http://travian.kirilloid.ru/build.php?s=1&b=15'; // s=1 is 2x, b=15 is Main Building
        console.log(`\n📍 Navigating to: ${url}`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // 4. Check what's available on the page
        console.log('\n🔍 Reconnaissance...');
        const pageInfo = await page.evaluate(() => {
            const info = {
                title: document.title,
                hasTable: document.querySelector('table') !== null,
                tableCount: document.querySelectorAll('table').length,
                hasF10Table: document.querySelector('table.f10') !== null,
                firstTableHTML: document.querySelector('table')?.outerHTML?.substring(0, 200)
            };
            
            // Check for global variables
            if (typeof window.buildings !== 'undefined') {
                info.hasBuildings = true;
            }
            
            // Log table structure
            const firstTable = document.querySelector('table');
            if (firstTable) {
                const firstRow = firstTable.querySelector('tr');
                if (firstRow) {
                    info.columnCount = firstRow.querySelectorAll('td, th').length;
                }
            }
            
            return info;
        });
        
        console.log('Page info:', JSON.stringify(pageInfo, null, 2));
        
        // 5. Extract Main Building data
        console.log('\n⚙️ Extracting Main Building data...');
        
        const buildingData = await page.evaluate(() => {
            const data = [];
            
            // Try multiple table selectors
            let table = document.querySelector('table.f10') || 
                       document.querySelector('table') ||
                       document.querySelector('.build_info table');
            
            if (!table) {
                console.log('No table found!');
                return data;
            }
            
            const rows = table.querySelectorAll('tr');
            console.log(`Found ${rows.length} rows`);
            
            rows.forEach((row, index) => {
                // Skip header row
                if (index === 0) return;
                
                const cells = row.querySelectorAll('td');
                if (cells.length < 4) return;
                
                // Parse level
                const levelText = cells[0]?.textContent?.trim();
                const level = parseInt(levelText) || index;
                
                // Parse resources - they might be in different formats
                const resourceCell = cells[1]?.textContent?.trim() || '';
                
                // Try to parse as "240 135 205 70" format
                let wood = 0, clay = 0, iron = 0, crop = 0;
                
                const numbers = resourceCell.match(/\d+/g);
                if (numbers && numbers.length >= 4) {
                    wood = parseInt(numbers[0]);
                    clay = parseInt(numbers[1]);
                    iron = parseInt(numbers[2]);
                    crop = parseInt(numbers[3]);
                }
                
                // Parse time (format: "0:03:44" or similar)
                const timeText = cells[2]?.textContent?.trim() || '0:00:00';
                const timeParts = timeText.split(':').map(p => parseInt(p) || 0);
                let timeSeconds = 0;
                if (timeParts.length === 3) {
                    timeSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                } else if (timeParts.length === 2) {
                    timeSeconds = timeParts[0] * 60 + timeParts[1];
                }
                
                // Parse population (if exists)
                const population = cells[3] ? parseInt(cells[3].textContent?.replace(/\D/g, '')) || 0 : 0;
                
                // Parse culture points (if exists)
                const culturePoints = cells[4] ? parseInt(cells[4].textContent?.replace(/\D/g, '')) || 0 : 0;
                
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
            });
            
            return data;
        });
        
        console.log(`\n✅ Extracted ${buildingData.length} levels`);
        
        if (buildingData.length > 0) {
            // Show first few levels
            console.log('\nFirst 3 levels:');
            buildingData.slice(0, 3).forEach(level => {
                console.log(`  Level ${level.level}: Wood=${level.wood}, Clay=${level.clay}, Iron=${level.iron}, Crop=${level.crop}`);
            });
            
            // 6. Validate Level 6
            if (buildingData.length >= 6) {
                const level6 = buildingData[5]; // 0-indexed
                console.log('\n🎯 VALIDATION CHECK - T4 2x Main Building Level 6:');
                console.log('Expected:', VALIDATION.expected);
                console.log('Extracted:', {
                    wood: level6.wood,
                    clay: level6.clay,
                    iron: level6.iron,
                    crop: level6.crop
                });
                
                const isValid = 
                    level6.wood === VALIDATION.expected.wood &&
                    level6.clay === VALIDATION.expected.clay &&
                    level6.iron === VALIDATION.expected.iron &&
                    level6.crop === VALIDATION.expected.crop;
                
                if (isValid) {
                    console.log('\n✅✅✅ VALIDATION PASSED! ✅✅✅');
                    console.log('The extraction method works correctly!');
                } else {
                    console.log('\n❌ VALIDATION FAILED');
                    console.log('Data mismatch - need to adjust extraction logic');
                }
            }
            
            // 7. Store in database
            console.log('\n💾 Storing in database...');
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO game_data_buildings (
                    server_version, server_speed, building_id, building_name, level,
                    wood_cost, clay_cost, iron_cost, crop_cost,
                    time_seconds, population, culture_points
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            buildingData.forEach(data => {
                stmt.run(
                    'T4', 2, 'main_building', 'Main Building', data.level,
                    data.wood, data.clay, data.iron, data.crop,
                    data.timeSeconds, data.population, data.culturePoints
                );
            });
            
            console.log('✅ Data stored in database');
            
            // 8. Query to verify
            console.log('\n📊 Verifying database...');
            const result = db.prepare(`
                SELECT * FROM game_data_buildings 
                WHERE building_name = 'Main Building' 
                AND level = 6 
                AND server_speed = 2
            `).get();
            
            if (result) {
                console.log('Database query result for Level 6:');
                console.log(`  Wood: ${result.wood_cost}`);
                console.log(`  Clay: ${result.clay_cost}`);
                console.log(`  Iron: ${result.iron_cost}`);
                console.log(`  Crop: ${result.crop_cost}`);
            }
        } else {
            console.log('❌ No data extracted - page structure might be different');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        // Cleanup
        if (browser) {
            await browser.close();
        }
        if (db) {
            db.close();
        }
        console.log('\n👋 Done!');
    }
}

// Run if called directly
if (require.main === module) {
    console.log(`
╔════════════════════════════════════════════════╗
║        Minimal Kirilloid Extractor POC        ║
║              Main Building Only                ║
╚════════════════════════════════════════════════╝
`);
    
    extractMainBuilding()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { extractMainBuilding };
