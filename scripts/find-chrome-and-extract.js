#!/usr/bin/env node

/**
 * Quick Chrome/Chromium finder and extractor runner
 * Automatically finds Chrome and runs extraction
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Finding Chrome/Chromium...\n');

// Function to test if a path is executable
function isExecutable(filePath) {
    try {
        execSync(`test -x "${filePath}"`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Search for Chrome in various locations
const searchPaths = [
    // Nix store paths (common on Replit)
    ...(() => {
        try {
            const nixPaths = execSync('find /nix/store -name chromium -type f 2>/dev/null', { encoding: 'utf-8' })
                .split('\n')
                .filter(p => p.includes('bin/chromium'));
            return nixPaths;
        } catch {
            return [];
        }
    })(),
    
    // Standard paths
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
    
    // User paths
    '/home/runner/.nix-profile/bin/chromium',
    '/home/runner/.local/bin/chromium',
    
    // Which command results
    ...(() => {
        try {
            return [execSync('which chromium 2>/dev/null', { encoding: 'utf-8' }).trim()];
        } catch {
            return [];
        }
    })(),
    ...(() => {
        try {
            return [execSync('which chromium-browser 2>/dev/null', { encoding: 'utf-8' }).trim()];
        } catch {
            return [];
        }
    })(),
];

// Find first working Chrome
let chromePath = null;
for (const testPath of searchPaths) {
    if (!testPath) continue;
    
    console.log(`Testing: ${testPath}`);
    if (isExecutable(testPath)) {
        chromePath = testPath;
        console.log(`✅ Found working Chrome at: ${chromePath}`);
        break;
    }
}

if (!chromePath) {
    console.log('\n❌ Chrome/Chromium not found!');
    console.log('\n📦 To install Chromium on Replit, run:');
    console.log('   nix-env -iA nixpkgs.chromium');
    console.log('\nOr add to replit.nix:');
    console.log('   deps = [ pkgs.chromium ];');
    console.log('\nThen run this script again.');
    process.exit(1);
}

// Export the path and run extraction
console.log('\n🚀 Running extraction with Chrome at:', chromePath);
console.log('═'.repeat(50));

// Set environment variable
process.env.PUPPETEER_EXECUTABLE_PATH = chromePath;

// Run the extraction
require('./extract-kirilloid-minimal-fixed.js');
