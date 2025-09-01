#!/usr/bin/env node

// Version Manager - FIXED to read from package.json
const fs = require('fs');
const path = require('path');

// Read version from package.json - the SINGLE SOURCE OF TRUTH
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const CURRENT_VERSION = packageJson.version;

console.log(`[Version Manager] Using version from package.json: ${CURRENT_VERSION}`);

// Helper to update JSON files
function updateJsonFile(filePath, updates) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    Object.assign(content, updates);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
    return true;
  } catch (error) {
    console.error(`Failed to update ${filePath}:`, error.message);
    return false;
  }
}

// Update manifest.json
function updateManifest() {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    updateJsonFile(manifestPath, { version: CURRENT_VERSION });
    console.log(`[Version Manager] Updated manifest.json to ${CURRENT_VERSION}`);
  }
}

// Update version.ts
function updateVersionFile() {
  const versionPath = path.join(__dirname, '..', 'src', 'version.ts');
  const content = `// Extension version - managed by version-manager.cjs
// DO NOT EDIT DIRECTLY - update package.json instead
export const VERSION = '${CURRENT_VERSION}';
export const VERSION_NAME = 'TravianAssistant';
`;
  fs.writeFileSync(versionPath, content);
  console.log(`[Version Manager] Updated version.ts to ${CURRENT_VERSION}`);
}

// Main execution
function main() {
  const command = process.argv[2];
  
  if (command === 'bump') {
    // Bump version using npm version
    const bumpType = process.argv[3] || 'patch';
    console.log(`[Version Manager] Bumping ${bumpType} version...`);
    console.log('Use: npm version patch/minor/major');
    return;
  }
  
  // Default: sync all files to package.json version
  console.log(`[Version Manager] Syncing all files to version ${CURRENT_VERSION}`);
  updateManifest();
  updateVersionFile();
  console.log(`[Version Manager] All files synced to ${CURRENT_VERSION}`);
}

main();