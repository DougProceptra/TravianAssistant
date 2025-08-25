#!/usr/bin/env node

/**
 * TravianAssistant Development Status Checker
 * Comprehensive script to validate the current development state
 * Run from project root: node scripts/check-dev-status.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Project structure to check
const PROJECT_STRUCTURE = {
  'Backend': {
    'backend/server.js': 'Express server (MongoDB/in-memory)',
    'backend/server-sqlite.js': 'SQLite server implementation',
    'backend/start.js': 'Smart server starter',
    'backend/package.json': 'Backend dependencies',
    'backend/travian.db': 'SQLite database file'
  },
  'Scripts': {
    'scripts/init-db-v3.js': 'Database initialization',
    'scripts/import-map.js': 'Map data importer',
    'scripts/test-db.js': 'Database test script',
    'scripts/test-backend-sqlite.js': 'Backend test script'
  },
  'Chrome Extension': {
    'packages/extension/manifest.json': 'Extension manifest',
    'packages/extension/src/background.ts': 'Service worker',
    'packages/extension/src/content/index.ts': 'Content script',
    'packages/extension/dist': 'Build output directory'
  },
  'API Proxy': {
    'api/anthropic.js': 'Anthropic API proxy',
    'vercel.json': 'Vercel configuration'
  },
  'Documentation': {
    'SESSION_CONTEXT.md': 'Session handoff document',
    'docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md': 'Complete roadmap',
    'README.md': 'Project README'
  }
};

// Check if file exists and get its info
function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      isDirectory: stats.isDirectory()
    };
  }
  return { exists: false };
}

// Check Git status
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();
    
    return {
      branch,
      lastCommit,
      hasChanges: status.length > 0,
      changes: status.split('\n').filter(line => line.length > 0)
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Check npm dependencies
function checkDependencies() {
  const results = {};
  
  // Check root package.json
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    results.root = {
      exists: true,
      dependencies: Object.keys(pkg.dependencies || {}).length,
      devDependencies: Object.keys(pkg.devDependencies || {}).length,
      hasNodeModules: fs.existsSync('node_modules')
    };
  }
  
  // Check backend package.json
  if (fs.existsSync('backend/package.json')) {
    const pkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    results.backend = {
      exists: true,
      dependencies: Object.keys(pkg.dependencies || {}).length,
      devDependencies: Object.keys(pkg.devDependencies || {}).length,
      hasNodeModules: fs.existsSync('backend/node_modules'),
      key_deps: {
        'express': pkg.dependencies?.express ? '✓' : '✗',
        'cors': pkg.dependencies?.cors ? '✓' : '✗',
        'better-sqlite3': pkg.dependencies?.['better-sqlite3'] ? '✓' : '✗',
        'ws': pkg.dependencies?.ws ? '✓' : '✗',
        'dotenv': pkg.dependencies?.dotenv ? '✓' : '✗'
      }
    };
  }
  
  return results;
}

// Check Replit configuration
function checkReplitConfig() {
  const results = {
    isReplit: !!(process.env.REPL_ID || process.env.REPLIT_DB_URL),
    replName: process.env.REPL_SLUG || 'unknown',
    replOwner: process.env.REPL_OWNER || 'unknown',
    hasReplitFile: fs.existsSync('.replit')
  };
  
  if (results.hasReplitFile) {
    try {
      const replitConfig = fs.readFileSync('.replit', 'utf8');
      results.runCommand = replitConfig.match(/run = "(.+)"/)?.[1];
    } catch (error) {
      results.configError = error.message;
    }
  }
  
  return results;
}

// Main status check
async function checkStatus() {
  console.log(`${colors.bright}${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║  TravianAssistant Development Status  ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.cyan}Date: ${new Date().toLocaleString()}${colors.reset}\n`);
  
  // Check Git status
  console.log(`${colors.bright}${colors.blue}📦 Git Status${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
  const gitStatus = checkGitStatus();
  if (gitStatus.error) {
    console.log(`${colors.red}  ✗ Git error: ${gitStatus.error}${colors.reset}`);
  } else {
    console.log(`  Branch: ${colors.yellow}${gitStatus.branch}${colors.reset}`);
    console.log(`  Last commit: ${gitStatus.lastCommit}`);
    if (gitStatus.hasChanges) {
      console.log(`  ${colors.yellow}⚠ Uncommitted changes:${colors.reset}`);
      gitStatus.changes.forEach(change => {
        console.log(`    ${change}`);
      });
    } else {
      console.log(`  ${colors.green}✓ Working directory clean${colors.reset}`);
    }
  }
  
  // Check project structure
  console.log(`\n${colors.bright}${colors.blue}📁 Project Structure${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
  
  let totalFiles = 0;
  let existingFiles = 0;
  
  for (const [category, files] of Object.entries(PROJECT_STRUCTURE)) {
    console.log(`\n  ${colors.bright}${category}:${colors.reset}`);
    for (const [filePath, description] of Object.entries(files)) {
      totalFiles++;
      const fileInfo = checkFile(filePath);
      if (fileInfo.exists) {
        existingFiles++;
        const icon = fileInfo.isDirectory ? '📁' : '📄';
        const size = fileInfo.isDirectory ? '' : ` (${(fileInfo.size / 1024).toFixed(1)}KB)`;
        console.log(`    ${colors.green}✓${colors.reset} ${icon} ${filePath}${size}`);
        console.log(`      ${colors.cyan}→ ${description}${colors.reset}`);
      } else {
        console.log(`    ${colors.red}✗${colors.reset} ${filePath}`);
        console.log(`      ${colors.yellow}→ ${description} [MISSING]${colors.reset}`);
      }
    }
  }
  
  // Check dependencies
  console.log(`\n${colors.bright}${colors.blue}📦 Dependencies${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
  const deps = checkDependencies();
  
  if (deps.root) {
    console.log(`  ${colors.bright}Root:${colors.reset}`);
    console.log(`    Dependencies: ${deps.root.dependencies}`);
    console.log(`    Dev dependencies: ${deps.root.devDependencies}`);
    console.log(`    node_modules: ${deps.root.hasNodeModules ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  }
  
  if (deps.backend) {
    console.log(`  ${colors.bright}Backend:${colors.reset}`);
    console.log(`    Dependencies: ${deps.backend.dependencies}`);
    console.log(`    Dev dependencies: ${deps.backend.devDependencies}`);
    console.log(`    node_modules: ${deps.backend.hasNodeModules ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
    console.log(`    ${colors.bright}Key packages:${colors.reset}`);
    for (const [pkg, status] of Object.entries(deps.backend.key_deps)) {
      const color = status === '✓' ? colors.green : colors.red;
      console.log(`      ${color}${status}${colors.reset} ${pkg}`);
    }
  }
  
  // Check Replit configuration
  console.log(`\n${colors.bright}${colors.blue}🔧 Replit Configuration${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
  const replit = checkReplitConfig();
  console.log(`  Running in Replit: ${replit.isReplit ? colors.green + 'Yes' : colors.yellow + 'No'}${colors.reset}`);
  if (replit.isReplit) {
    console.log(`  Repl Name: ${replit.replName}`);
    console.log(`  Repl Owner: ${replit.replOwner}`);
  }
  console.log(`  .replit file: ${replit.hasReplitFile ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  if (replit.runCommand) {
    console.log(`  Run command: ${colors.cyan}${replit.runCommand}${colors.reset}`);
  }
  
  // Development phase tracking
  console.log(`\n${colors.bright}${colors.blue}📊 Development Phase${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
  
  const today = new Date('2025-08-25');
  const betaDate = new Date('2025-08-29');
  const prodDate = new Date('2025-09-09');
  
  const daysUntilBeta = Math.ceil((betaDate - today) / (1000 * 60 * 60 * 24));
  const daysUntilProd = Math.ceil((prodDate - today) / (1000 * 60 * 60 * 24));
  
  console.log(`  Current Phase: ${colors.yellow}Week 1 - Day 3-4 (Chrome Extension)${colors.reset}`);
  console.log(`  Beta Target: August 29, 2025 (${colors.yellow}${daysUntilBeta} days${colors.reset})`);
  console.log(`  Production Target: September 9, 2025 (${colors.yellow}${daysUntilProd} days${colors.reset})`);
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}📈 Summary${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
  
  const completionPercent = Math.round((existingFiles / totalFiles) * 100);
  console.log(`  Files present: ${existingFiles}/${totalFiles} (${completionPercent}%)`);
  
  const progressBar = '█'.repeat(Math.floor(completionPercent / 5)) + '░'.repeat(20 - Math.floor(completionPercent / 5));
  console.log(`  Progress: [${colors.green}${progressBar}${colors.reset}] ${completionPercent}%`);
  
  // Next steps
  console.log(`\n${colors.bright}${colors.blue}🚀 Next Steps${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
  
  const nextSteps = [];
  
  // Check what needs to be done
  if (!deps.backend?.hasNodeModules) {
    nextSteps.push('Install backend dependencies: cd backend && npm install');
  }
  
  if (!checkFile('backend/travian.db').exists) {
    nextSteps.push('Initialize database: cd backend && npm run init-db');
  }
  
  if (!checkFile('packages/extension/dist').exists) {
    nextSteps.push('Build Chrome extension: npm run build');
  }
  
  if (nextSteps.length === 0) {
    console.log(`  ${colors.green}✓ All systems ready!${colors.reset}`);
    console.log(`  1. Start backend: ${colors.cyan}cd backend && npm run server:sqlite${colors.reset}`);
    console.log(`  2. Test backend: ${colors.cyan}node scripts/test-backend-sqlite.js${colors.reset}`);
    console.log(`  3. Load extension in Chrome: ${colors.cyan}chrome://extensions${colors.reset}`);
  } else {
    nextSteps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${colors.yellow}${step}${colors.reset}`);
    });
  }
  
  console.log(`\n${colors.bright}${colors.magenta}${'═'.repeat(42)}${colors.reset}`);
  console.log(`${colors.bright}Ready to continue development!${colors.reset}`);
  console.log(`${colors.cyan}Focus: Chrome Extension Implementation${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${'═'.repeat(42)}${colors.reset}\n`);
}

// Run the status check
checkStatus().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});
