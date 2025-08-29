#!/usr/bin/env node

/**
 * Complete Kirilloid Data Extractor
 * Extracts all game data from Kirilloid repository and transforms to TypeScript
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KIRILLOID_REPO = 'https://github.com/kirilloid/travian.git';
const KIRILLOID_PATH = './kirilloid-travian';
const OUTPUT_PATH = './packages/extension/src/game-data';

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

console.log('\n=== Extracting Kirilloid Data ===\n');

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

// Extract and analyze data structure
function analyzeDataStructure() {
    const srcPath = path.join(KIRILLOID_PATH, 'src');
    
    // Find model files
    const modelFiles = findFiles(path.join(srcPath, 'model'), /\.(ts|js)$/);
    console.log(`Found ${modelFiles.length} model files`);
    
    // Group by category
    const categories = {
        buildings: [],
        units: [],
        combat: [],
        heroes: [],
        items: [],
        other: []
    };
    
    modelFiles.forEach(file => {
        const relativePath = path.relative(KIRILLOID_PATH, file);
        
        if (file.includes('building')) categories.buildings.push(relativePath);
        else if (file.includes('unit') || file.includes('troop')) categories.units.push(relativePath);
        else if (file.includes('combat') || file.includes('battle')) categories.combat.push(relativePath);
        else if (file.includes('hero')) categories.heroes.push(relativePath);
        else if (file.includes('item') || file.includes('equipment')) categories.items.push(relativePath);
        else categories.other.push(relativePath);
    });
    
    // Display categorized files
    Object.entries(categories).forEach(([category, files]) => {
        if (files.length > 0) {
            console.log(`\n${category.toUpperCase()} (${files.length} files):`);
            files.slice(0, 5).forEach(file => console.log(`  - ${file}`));
            if (files.length > 5) console.log(`  ... and ${files.length - 5} more`);
        }
    });
    
    return categories;
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

// Find the best version to use (prefer t4.6 for Travian Legends)
function findBestVersion() {
    const modelPath = path.join(KIRILLOID_PATH, 'src', 'model');
    const versions = fs.readdirSync(modelPath)
        .filter(dir => dir.startsWith('t') && fs.statSync(path.join(modelPath, dir)).isDirectory());
    
    console.log('\nAvailable versions:', versions.join(', '));
    
    // Prefer t4.6 (latest Travian Legends)
    if (versions.includes('t4.6')) {
        console.log('→ Using t4.6 (Travian Legends)');
        return 't4.6';
    }
    
    // Fallback to latest version
    const latest = versions.sort().pop();
    console.log(`→ Using ${latest} (latest available)`);
    return latest;
}

// Extract specific data types
function extractData(version) {
    const versionPath = path.join(KIRILLOID_PATH, 'src', 'model', version);
    const basePath = path.join(KIRILLOID_PATH, 'src', 'model', 'base');
    const extracted = {};
    
    // Buildings
    let buildingsFile = path.join(versionPath, 'buildings.ts');
    if (!fs.existsSync(buildingsFile)) {
        buildingsFile = path.join(basePath, 'buildings.ts');
    }
    if (fs.existsSync(buildingsFile)) {
        console.log('\nExtracting buildings from:', path.relative(KIRILLOID_PATH, buildingsFile));
        extracted.buildings = readAndParse(buildingsFile);
    }
    
    // Units
    let unitsFile = path.join(versionPath, 'units.ts');
    if (!fs.existsSync(unitsFile)) {
        unitsFile = path.join(basePath, 'units.ts');
    }
    if (fs.existsSync(unitsFile)) {
        console.log('Extracting units from:', path.relative(KIRILLOID_PATH, unitsFile));
        extracted.units = readAndParse(unitsFile);
    }
    
    // Look for index file that might aggregate data
    const indexFile = path.join(versionPath, 'index.ts');
    if (fs.existsSync(indexFile)) {
        console.log('Extracting index from:', path.relative(KIRILLOID_PATH, indexFile));
        extracted.index = readAndParse(indexFile);
    }
    
    return extracted;
}

// Main execution
async function main() {
    try {
        // Analyze structure
        const categories = analyzeDataStructure();
        
        // Find best version
        const version = findBestVersion();
        
        // Extract data
        const data = extractData(version);
        
        // Save raw extracted data for analysis
        const extractedPath = path.join(OUTPUT_PATH, 'extracted-raw');
        if (!fs.existsSync(extractedPath)) {
            fs.mkdirSync(extractedPath, { recursive: true });
        }
        
        Object.entries(data).forEach(([key, content]) => {
            if (content) {
                const outputFile = path.join(extractedPath, `${key}.ts`);
                fs.writeFileSync(outputFile, content);
                console.log(`\nSaved raw ${key} to:`, outputFile);
            }
        });
        
        console.log('\n=== Extraction Complete ===');
        console.log('Raw data saved to:', extractedPath);
        console.log('\nNext step: Transform raw data to our TypeScript structure');
        
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
