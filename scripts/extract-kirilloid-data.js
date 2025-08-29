#!/usr/bin/env node

/**
 * Complete Kirilloid Data Extractor
 * Extracts multiple game versions from Kirilloid repository
 * Supports both regular T4 and special versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KIRILLOID_REPO = 'https://github.com/kirilloid/travian.git';
const KIRILLOID_PATH = './kirilloid-travian';
const OUTPUT_PATH = './packages/extension/src/game-data';

// Versions we want to extract
const TARGET_VERSIONS = [
    't4',      // Regular Travian Legends (current testing)
    't4.fs',   // Fire & Sand (might be Annual Special)
    // Add more as needed: 't4.pp', 't5', etc.
];

// Ensure Kirilloid repo is cloned
if (!fs.existsSync(KIRILLOID_PATH)) {
    console.log('Cloning Kirilloid repository...');
    execSync(`git clone ${KIRILLOID_REPO} ${KIRILLOID_PATH}`);
} else {
    console.log('Updating Kirilloid repository...');
    execSync('git pull', { cwd: KIRILLOID_PATH });
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

console.log('\n=== Extracting Kirilloid Data (Multi-Version) ===\n');

// Find all relevant files
function findFiles(dir, pattern) {
    const results = [];
    
    function walk(currentPath) {
        try {
            const files = fs.readdirSync(currentPath);
            
            files.forEach(file => {
                const filePath = path.join(currentPath, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                    walk(filePath);
                } else if (stat.isFile() && pattern.test(file)) {
                    results.push(filePath);
                }
            });
        } catch (err) {
            console.error(`Error walking ${currentPath}:`, err.message);
        }
    }
    
    walk(dir);
    return results;
}

// Read and parse a TypeScript/JavaScript file
function readAndParse(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content;
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return null;
    }
}

// Get available versions
function getAvailableVersions() {
    const modelPath = path.join(KIRILLOID_PATH, 'src', 'model');
    const allVersions = fs.readdirSync(modelPath)
        .filter(dir => dir.startsWith('t') && fs.statSync(path.join(modelPath, dir)).isDirectory());
    
    console.log('All available versions:', allVersions.join(', '));
    
    // Filter to only versions we want
    const targetVersions = allVersions.filter(v => TARGET_VERSIONS.includes(v));
    console.log('Target versions to extract:', targetVersions.join(', '));
    
    return targetVersions;
}

// Extract data for a specific version
function extractDataForVersion(version) {
    console.log(`\n=== Extracting ${version} ===`);
    
    const versionPath = path.join(KIRILLOID_PATH, 'src', 'model', version);
    const basePath = path.join(KIRILLOID_PATH, 'src', 'model', 'base');
    const extracted = {};
    
    // Buildings
    let buildingsFile = path.join(versionPath, 'buildings.ts');
    if (!fs.existsSync(buildingsFile)) {
        buildingsFile = path.join(basePath, 'buildings.ts');
    }
    if (fs.existsSync(buildingsFile)) {
        console.log('  → Buildings from:', path.relative(KIRILLOID_PATH, buildingsFile));
        extracted.buildings = readAndParse(buildingsFile);
    }
    
    // Units
    let unitsFile = path.join(versionPath, 'units.ts');
    if (!fs.existsSync(unitsFile)) {
        unitsFile = path.join(basePath, 'units.ts');
    }
    if (fs.existsSync(unitsFile)) {
        console.log('  → Units from:', path.relative(KIRILLOID_PATH, unitsFile));
        extracted.units = readAndParse(unitsFile);
    }
    
    // Combat
    let combatDir = path.join(versionPath, 'combat');
    if (!fs.existsSync(combatDir)) {
        combatDir = path.join(basePath, 'combat');
    }
    if (fs.existsSync(combatDir)) {
        const combatFile = path.join(combatDir, 'combat.ts');
        if (fs.existsSync(combatFile)) {
            console.log('  → Combat from:', path.relative(KIRILLOID_PATH, combatFile));
            extracted.combat = readAndParse(combatFile);
        }
    }
    
    // Heroes
    let heroFile = path.join(versionPath, 'hero.ts');
    if (!fs.existsSync(heroFile)) {
        heroFile = path.join(basePath, 'hero.ts');
    }
    if (fs.existsSync(heroFile)) {
        console.log('  → Heroes from:', path.relative(KIRILLOID_PATH, heroFile));
        extracted.heroes = readAndParse(heroFile);
    }
    
    // Items
    let itemsFile = path.join(versionPath, 'items.ts');
    if (fs.existsSync(itemsFile)) {
        console.log('  → Items from:', path.relative(KIRILLOID_PATH, itemsFile));
        extracted.items = readAndParse(itemsFile);
    }
    
    // Index
    const indexFile = path.join(versionPath, 'index.ts');
    if (fs.existsSync(indexFile)) {
        console.log('  → Index from:', path.relative(KIRILLOID_PATH, indexFile));
        extracted.index = readAndParse(indexFile);
    }
    
    return extracted;
}

// Save extracted data
function saveExtractedData(version, data) {
    // Create version-specific directory
    const versionPath = path.join(OUTPUT_PATH, 'extracted-raw', version);
    if (!fs.existsSync(versionPath)) {
        fs.mkdirSync(versionPath, { recursive: true });
    }
    
    let filesCount = 0;
    Object.entries(data).forEach(([key, content]) => {
        if (content) {
            const outputFile = path.join(versionPath, `${key}.ts`);
            fs.writeFileSync(outputFile, content);
            filesCount++;
        }
    });
    
    console.log(`  ✓ Saved ${filesCount} files to:`, versionPath);
    
    return filesCount;
}

// Main execution
async function main() {
    try {
        // Get versions to extract
        const versions = getAvailableVersions();
        
        if (versions.length === 0) {
            console.error('ERROR: No target versions found!');
            console.log('Looking for:', TARGET_VERSIONS.join(', '));
            process.exit(1);
        }
        
        // Extract each version
        const results = {};
        for (const version of versions) {
            const data = extractDataForVersion(version);
            const fileCount = saveExtractedData(version, data);
            results[version] = fileCount;
        }
        
        // Summary
        console.log('\n=== Extraction Complete ===');
        console.log('\nExtracted versions:');
        Object.entries(results).forEach(([version, count]) => {
            console.log(`  ${version}: ${count} files`);
        });
        
        console.log('\n📁 Data location:', path.join(OUTPUT_PATH, 'extracted-raw'));
        
        console.log('\n🎯 Next steps:');
        console.log('1. Check extracted data in extracted-raw/t4/ (for current server)');
        console.log('2. Transform t4 data to our TypeScript structure');
        console.log('3. Test with your current game');
        console.log('4. Later: Add t4.fs support for Annual Special');
        
        console.log('\n💡 Version Info:');
        console.log('  t4 = Regular Travian Legends (use this for testing)');
        console.log('  t4.fs = Fire & Sand (might be Annual Special base)');
        
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
