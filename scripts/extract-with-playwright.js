#!/usr/bin/env node

/**
 * Alternative: Use Playwright instead of Puppeteer
 * Playwright has better browser management on Replit
 */

const { chromium } = require('playwright');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'backend', 'travian.db');

// Validation checkpoint
const VALIDATION = {
    server: 'T4 2x',
    building: 'Main Building',
    level: 6,
    expected: { wood: 240, clay: 135, iron: 205, crop: 70 }
};

async function extractWithPlaywright() {
    console.log('🎭 Using Playwright for extraction...\n');
    
    let browser;
    let db;
    
    try {
        // Setup database
        console.log('📦 Setting up database...');
        db = new Database(DB_PATH);
        
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
        
        // Launch browser with Playwright
        console.log('🌐 Launching browser with Playwright...');
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Navigate to page
        const url = 'http://travian.kirilloid.ru/build.php?s=1&b=15';
        console.log(`📍 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Extract data
        console.log('⚙️ Extracting data...');
        
        const buildingData = await page.evaluate(() => {
            const data = [];
            const tables = document.querySelectorAll('table');
            
            if (tables.length === 0) return data;
            
            const targetTable = tables[0];
            const rows = targetTable.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                if (index === 0) return; // Skip header
                
                const cells = row.querySelectorAll('td');
                if (cells.length < 3) return;
                
                const level = parseInt(cells[0]?.textContent?.trim()) || index;
                const resourceText = cells[1]?.textContent || '';
                const numbers = resourceText.match(/\d+/g);
                
                if (numbers && numbers.length >= 4) {
                    data.push({
                        level,
                        wood: parseInt(numbers[0]),
                        clay: parseInt(numbers[1]),
                        iron: parseInt(numbers[2]),
                        crop: parseInt(numbers[3])
                    });
                }
            });
            
            return data;
        });
        
        console.log(`✅ Extracted ${buildingData.length} levels`);
        
        // Validate
        if (buildingData.length >= 6) {
            const level6 = buildingData[5];
            console.log('\n🎯 VALIDATION CHECK:');
            console.log('Expected:', VALIDATION.expected);
            console.log('Extracted:', level6);
            
            const isValid = 
                level6.wood === VALIDATION.expected.wood &&
                level6.clay === VALIDATION.expected.clay &&
                level6.iron === VALIDATION.expected.iron &&
                level6.crop === VALIDATION.expected.crop;
            
            if (isValid) {
                console.log('\n✅✅✅ VALIDATION PASSED! ✅✅✅');
            } else {
                console.log('\n❌ VALIDATION FAILED');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (browser) await browser.close();
        if (db) db.close();
    }
}

// Check if Playwright is installed
try {
    require.resolve('playwright');
    extractWithPlaywright();
} catch {
    console.log('📦 Playwright not installed. Install with:');
    console.log('   npm install playwright');
    console.log('\nThen run: node scripts/extract-with-playwright.js');
    process.exit(1);
}
