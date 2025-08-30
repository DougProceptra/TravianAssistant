#!/usr/bin/env node

/**
 * Minimal Puppeteer Kirilloid Extractor - Fixed for Replit
 * Uses puppeteer-core with system Chromium
 */

const path = require('path');

// Use puppeteer-core instead of puppeteer to avoid Chrome download
let puppeteer;
try {
    puppeteer = require('puppeteer-core');
    console.log('✅ Using puppeteer-core (no Chrome download)');
} catch (e) {
    try {
        puppeteer = require('puppeteer');
        console.log('✅ Using puppeteer (with bundled Chrome)');
    } catch (e2) {
        console.error('❌ Neither puppeteer-core nor puppeteer found!');
        console.error('Run: npm install puppeteer-core');
        process.exit(1);
    }
}

const Database = require('better-sqlite3');

// Configuration
const DB_PATH = path.join(__dirname, '..', 'backend', 'travian.db');

// Find Chrome executable
function findChrome() {
    const possiblePaths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/snap/bin/chromium',
        'chromium-browser',
        'chromium',
        'google-chrome'
    ];
    
    const { execSync } = require('child_process');
    
    for (const chromePath of possiblePaths) {
        if (!chromePath) continue;
        try {
            // Check if path exists
            execSync(`which ${chromePath}`, { stdio: 'ignore' });
            console.log(`✅ Found Chrome at: ${chromePath}`);
            return chromePath;
        } catch (e) {
            // Path doesn't exist, try next
        }
    }
    
    console.warn('⚠️ Chrome not found in standard locations');
    return null;
}

// Validation checkpoint
const VALIDATION = {
    server: 'T4 2x',
    building: 'Main Building',
    level: 6,
    expected: { wood: 240, clay: 135, iron: 205, crop: 70 }
};

async function extractMainBuilding() {
    console.log('🚀 Starting Minimal Kirilloid Extractor (Fixed)...\n');
    
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
        
        // 2. Launch Puppeteer with system Chrome
        console.log('🌐 Launching browser...');
        
        const chromePath = findChrome();
        const launchOptions = {
            headless: 'new', // Use new headless mode
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins',
                '--disable-site-isolation-trials'
            ]
        };
        
        // Add executablePath only if we found Chrome
        if (chromePath) {
            launchOptions.executablePath = chromePath;
        }
        
        console.log('Launch options:', launchOptions);
        
        browser = await puppeteer.launch(launchOptions);
        console.log('✅ Browser launched successfully');
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'log') {
                console.log('  PAGE:', msg.text());
            }
        });
        
        // Handle page errors
        page.on('error', err => {
            console.error('Page error:', err);
        });
        
        page.on('pageerror', err => {
            console.error('Page error:', err);
        });
        
        // 3. Navigate to Main Building page for T4 2x
        const url = 'http://travian.kirilloid.ru/build.php?s=1&b=15'; // s=1 is 2x, b=15 is Main Building
        console.log(`\n📍 Navigating to: ${url}`);
        
        try {
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            console.log('✅ Page loaded');
        } catch (err) {
            console.error('❌ Navigation failed:', err.message);
            // Try to continue anyway
        }
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // 4. Check what's available on the page
        console.log('\n🔍 Reconnaissance...');
        const pageInfo = await page.evaluate(() => {
            const info = {
                title: document.title,
                url: window.location.href,
                hasTable: document.querySelector('table') !== null,
                tableCount: document.querySelectorAll('table').length,
                bodyText: document.body?.innerText?.substring(0, 100)
            };
            
            // Check for specific elements
            const firstTable = document.querySelector('table');
            if (firstTable) {
                info.firstTableClass = firstTable.className;
                const firstRow = firstTable.querySelector('tr');
                if (firstRow) {
                    info.columnCount = firstRow.querySelectorAll('td, th').length;
                    info.firstRowText = firstRow.innerText?.substring(0, 50);
                }
            }
            
            return info;
        });
        
        console.log('Page info:', JSON.stringify(pageInfo, null, 2));
        
        // 5. Extract Main Building data
        console.log('\n⚙️ Extracting Main Building data...');
        
        const buildingData = await page.evaluate(() => {
            const data = [];
            
            // Try to find the data table
            const tables = document.querySelectorAll('table');
            let targetTable = null;
            
            // Look for table with building data
            for (const table of tables) {
                const text = table.innerText || '';
                if (text.includes('Level') || text.includes('Wood') || text.includes('Clay')) {
                    targetTable = table;
                    break;
                }
            }
            
            if (!targetTable && tables.length > 0) {
                targetTable = tables[0]; // Use first table as fallback
            }
            
            if (!targetTable) {
                console.log('No table found!');
                return data;
            }
            
            const rows = targetTable.querySelectorAll('tr');
            console.log(`Found ${rows.length} rows`);
            
            rows.forEach((row, index) => {
                // Skip header row
                if (index === 0) {
                    const headerText = row.innerText;
                    console.log('Header:', headerText);
                    return;
                }
                
                const cells = row.querySelectorAll('td');
                if (cells.length < 3) return;
                
                // Parse level
                const level = parseInt(cells[0]?.textContent?.trim()) || index;
                
                // Parse resources - they might be in different formats
                const resourceText = cells[1]?.innerText || cells[1]?.textContent || '';
                
                // Try different parsing patterns
                let wood = 0, clay = 0, iron = 0, crop = 0;
                
                // Pattern 1: "240 135 205 70"
                const numbers = resourceText.match(/\d+/g);
                if (numbers && numbers.length >= 4) {
                    wood = parseInt(numbers[0]);
                    clay = parseInt(numbers[1]);
                    iron = parseInt(numbers[2]);
                    crop = parseInt(numbers[3]);
                }
                
                // Parse time
                let timeSeconds = 0;
                if (cells[2]) {
                    const timeText = cells[2]?.textContent?.trim() || '0:00:00';
                    const timeParts = timeText.split(':').map(p => parseInt(p) || 0);
                    if (timeParts.length === 3) {
                        timeSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                    } else if (timeParts.length === 2) {
                        timeSeconds = timeParts[0] * 60 + timeParts[1];
                    }
                }
                
                // Parse additional columns if they exist
                const population = cells[3] ? parseInt(cells[3].textContent?.replace(/\D/g, '')) || 0 : 0;
                const culturePoints = cells[4] ? parseInt(cells[4].textContent?.replace(/\D/g, '')) || 0 : 0;
                
                if (wood > 0 || clay > 0 || iron > 0 || crop > 0) {
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
            
            // Try to get page content for debugging
            const pageContent = await page.evaluate(() => {
                return {
                    bodyText: document.body?.innerText?.substring(0, 500),
                    html: document.documentElement?.outerHTML?.substring(0, 500)
                };
            });
            console.log('Page content:', pageContent);
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        // Cleanup
        if (browser) {
            await browser.close();
            console.log('✅ Browser closed');
        }
        if (db) {
            db.close();
            console.log('✅ Database closed');
        }
        console.log('\n👋 Done!');
    }
}

// Run if called directly
if (require.main === module) {
    console.log(`
╔════════════════════════════════════════════════╗
║     Minimal Kirilloid Extractor (Fixed)       ║
║         Using System Chromium                  ║
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
