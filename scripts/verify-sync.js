#!/usr/bin/env node

/**
 * TravianAssistant Git-Replit Sync Verification
 * This script checks that Replit and GitHub are fully synchronized
 * Run from Replit: node scripts/verify-sync.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

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

// Critical files to verify
const CRITICAL_FILES = [
  // Backend files
  'backend/server-sqlite.js',
  'backend/server.js',
  'backend/start.js',
  'backend/package.json',
  'backend/travian.db',
  
  // Scripts - including the NEW ones from this session
  'scripts/init-db-v3.js',
  'scripts/import-map.js',
  'scripts/test-db.js',
  'scripts/test-backend-sqlite.js',  // NEW - Added Aug 25
  'scripts/check-dev-status.js',     // NEW - Added Aug 25
  'scripts/replit-setup.sh',         // NEW - Added Aug 25
  'scripts/verify-sync.js',          // THIS FILE
  
  // Documentation
  'SESSION_CONTEXT.md',
  'docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md',
  
  // Extension structure
  'packages/extension/manifest.json',
  'packages/extension/src/background.ts',
  'packages/extension/src/content/index.ts',
  
  // Root files
  'package.json',
  '.replit'
];

// Get file hash for comparison
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

// Get file info
function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      hash: getFileHash(filePath)
    };
  } catch (error) {
    return { exists: false };
  }
}

// Execute git command safely
function gitCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

// Main sync verification
async function verifySyncStatus() {
  console.log(`${colors.bright}${colors.magenta}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║  Git-Replit Sync Verification Tool       ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚═══════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.cyan}Timestamp: ${new Date().toISOString()}${colors.reset}\n`);
  
  // Step 1: Check if we're in a git repository
  console.log(`${colors.bright}${colors.blue}1. Git Repository Check${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(45)}${colors.reset}`);
  
  const isGitRepo = gitCommand('git rev-parse --git-dir');
  if (!isGitRepo) {
    console.log(`${colors.red}✗ Not a git repository!${colors.reset}`);
    console.log(`${colors.yellow}  Run: git init${colors.reset}`);
    return false;
  }
  console.log(`${colors.green}✓ Git repository detected${colors.reset}`);
  
  // Step 2: Check remote configuration
  console.log(`\n${colors.bright}${colors.blue}2. Remote Repository${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(45)}${colors.reset}`);
  
  const remoteUrl = gitCommand('git config --get remote.origin.url');
  if (!remoteUrl) {
    console.log(`${colors.red}✗ No remote configured${colors.reset}`);
    console.log(`${colors.yellow}  Run: git remote add origin https://github.com/DougProceptra/TravianAssistant.git${colors.reset}`);
    return false;
  }
  console.log(`${colors.green}✓ Remote URL: ${remoteUrl}${colors.reset}`);
  
  // Step 3: Fetch latest from remote
  console.log(`\n${colors.bright}${colors.blue}3. Fetching Latest from GitHub${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(45)}${colors.reset}`);
  
  const fetchResult = gitCommand('git fetch origin main 2>&1');
  if (fetchResult === null) {
    console.log(`${colors.red}✗ Failed to fetch from remote${colors.reset}`);
    console.log(`${colors.yellow}  Check your internet connection and GitHub access${colors.reset}`);
    return false;
  }
  console.log(`${colors.green}✓ Successfully fetched from GitHub${colors.reset}`);
  
  // Step 4: Compare local vs remote
  console.log(`\n${colors.bright}${colors.blue}4. Local vs Remote Comparison${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(45)}${colors.reset}`);
  
  const localCommit = gitCommand('git rev-parse HEAD');
  const remoteCommit = gitCommand('git rev-parse origin/main');
  
  console.log(`  Local HEAD:  ${colors.cyan}${localCommit?.substring(0, 8)}${colors.reset}`);
  console.log(`  Remote HEAD: ${colors.cyan}${remoteCommit?.substring(0, 8)}${colors.reset}`);
  
  if (localCommit === remoteCommit) {
    console.log(`${colors.green}✓ Local is up-to-date with remote${colors.reset}`);
  } else {
    const behind = gitCommand('git rev-list --count HEAD..origin/main');
    const ahead = gitCommand('git rev-list --count origin/main..HEAD');
    
    if (parseInt(behind) > 0) {
      console.log(`${colors.yellow}⚠ Local is ${behind} commits behind remote${colors.reset}`);
      console.log(`${colors.yellow}  Run: git pull origin main${colors.reset}`);
    }
    if (parseInt(ahead) > 0) {
      console.log(`${colors.yellow}⚠ Local is ${ahead} commits ahead of remote${colors.reset}`);
      console.log(`${colors.yellow}  Run: git push origin main${colors.reset}`);
    }
  }
  
  // Step 5: Check for uncommitted changes
  console.log(`\n${colors.bright}${colors.blue}5. Working Directory Status${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(45)}${colors.reset}`);
  
  const status = gitCommand('git status --porcelain');
  if (status && status.length > 0) {
    console.log(`${colors.yellow}⚠ Uncommitted changes detected:${colors.reset}`);
    const changes = status.split('\n').filter(line => line.length > 0);
    changes.forEach(change => {
      const [type, file] = change.trim().split(/\s+/);
      const typeColor = type.includes('M') ? colors.yellow : 
                       type.includes('A') ? colors.green : 
                       type.includes('D') ? colors.red : colors.cyan;
      console.log(`    ${typeColor}${type}${colors.reset} ${file}`);
    });
    console.log(`${colors.yellow}  Consider committing these changes${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Working directory clean${colors.reset}`);
  }
  
  // Step 6: Verify critical files
  console.log(`\n${colors.bright}${colors.blue}6. Critical Files Verification${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(45)}${colors.reset}`);
  
  let missingFiles = [];
  let presentFiles = [];
  let newSessionFiles = [
    'scripts/test-backend-sqlite.js',
    'scripts/check-dev-status.js',
    'scripts/replit-setup.sh'
  ];
  
  for (const file of CRITICAL_FILES) {
    const fileInfo = getFileInfo(file);
    if (fileInfo.exists) {
      presentFiles.push(file);
      // Check if it's a new file from this session
      if (newSessionFiles.includes(file)) {
        console.log(`  ${colors.green}✓${colors.reset} ${file} ${colors.bright}${colors.green}[NEW SESSION FILE]${colors.reset}`);
      }
    } else {
      missingFiles.push(file);
      // Check if it's expected to be missing (like travian.db on fresh clone)
      if (file === 'backend/travian.db') {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${file} ${colors.yellow}[Expected - will be created]${colors.reset}`);
      } else if (newSessionFiles.includes(file)) {
        console.log(`  ${colors.red}✗${colors.reset} ${file} ${colors.red}[NEW FILE NOT SYNCED!]${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${file} ${colors.red}[MISSING]${colors.reset}`);
      }
    }
  }
  
  // Step 7: Check for the latest commits
  console.log(`\n${colors.bright}${colors.blue}7. Recent Commit History${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(45)}${colors.reset}`);
  
  const recentCommits = gitCommand('git log --oneline -5');
  if (recentCommits) {
    console.log(recentCommits.split('\n').map(line => `  ${line}`).join('\n'));
    
    // Check for today's commits
    const todayCommits = gitCommand('git log --since="6 hours ago" --oneline');
    if (todayCommits && todayCommits.length > 0) {
      console.log(`\n  ${colors.green}Recent activity detected (last 6 hours):${colors.reset}`);
      console.log(todayCommits.split('\n').map(line => `    ${colors.cyan}${line}${colors.reset}`).join('\n'));
    }
  }
  
  // Step 8: Environment Check
  console.log(`\n${colors.bright}${colors.blue}8. Environment Check${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(45)}${colors.reset}`);
  
  const isReplit = process.env.REPL_ID || process.env.REPLIT_DB_URL;
  if (isReplit) {
    console.log(`${colors.green}✓ Running in Replit${colors.reset}`);
    console.log(`  Repl: ${process.env.REPL_SLUG || 'unknown'}`);
    console.log(`  Owner: ${process.env.REPL_OWNER || 'unknown'}`);
  } else {
    console.log(`${colors.yellow}⚠ Not running in Replit (local environment)${colors.reset}`);
  }
  
  // Final Summary
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}SYNC STATUS SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════${colors.reset}\n`);
  
  const syncScore = {
    gitRepo: isGitRepo ? 1 : 0,
    remoteConfigured: remoteUrl ? 1 : 0,
    upToDate: localCommit === remoteCommit ? 1 : 0,
    cleanWorkDir: !status || status.length === 0 ? 1 : 0,
    criticalFiles: presentFiles.length / CRITICAL_FILES.length,
    newFilesPresent: newSessionFiles.every(f => presentFiles.includes(f)) ? 1 : 0
  };
  
  const totalScore = Object.values(syncScore).reduce((a, b) => a + b, 0);
  const maxScore = Object.keys(syncScore).length;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  // Display sync status with color coding
  if (percentage === 100) {
    console.log(`${colors.bright}${colors.green}✅ FULLY SYNCHRONIZED (100%)${colors.reset}`);
    console.log(`${colors.green}All systems are properly synced and ready!${colors.reset}`);
  } else if (percentage >= 80) {
    console.log(`${colors.bright}${colors.yellow}⚠️  MOSTLY SYNCHRONIZED (${percentage}%)${colors.reset}`);
    console.log(`${colors.yellow}Minor sync issues detected - see details above${colors.reset}`);
  } else {
    console.log(`${colors.bright}${colors.red}❌ SYNC ISSUES DETECTED (${percentage}%)${colors.reset}`);
    console.log(`${colors.red}Significant sync problems - action required${colors.reset}`);
  }
  
  // Detailed breakdown
  console.log(`\n${colors.bright}Sync Checklist:${colors.reset}`);
  console.log(`  Git Repository:     ${syncScore.gitRepo ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`  Remote Configured:  ${syncScore.remoteConfigured ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`  Up to Date:         ${syncScore.upToDate ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset}`);
  console.log(`  Clean Work Dir:     ${syncScore.cleanWorkDir ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset}`);
  console.log(`  Critical Files:     ${Math.round(syncScore.criticalFiles * 100)}%`);
  console.log(`  New Session Files:  ${syncScore.newFilesPresent ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  
  // Action items
  console.log(`\n${colors.bright}${colors.blue}RECOMMENDED ACTIONS:${colors.reset}`);
  
  if (localCommit !== remoteCommit) {
    const behind = gitCommand('git rev-list --count HEAD..origin/main');
    if (parseInt(behind) > 0) {
      console.log(`\n1. ${colors.yellow}Pull latest changes:${colors.reset}`);
      console.log(`   ${colors.cyan}git pull origin main${colors.reset}`);
    }
  }
  
  if (status && status.length > 0) {
    console.log(`\n2. ${colors.yellow}Commit local changes:${colors.reset}`);
    console.log(`   ${colors.cyan}git add .${colors.reset}`);
    console.log(`   ${colors.cyan}git commit -m "Sync local changes"${colors.reset}`);
    console.log(`   ${colors.cyan}git push origin main${colors.reset}`);
  }
  
  if (!syncScore.newFilesPresent) {
    console.log(`\n3. ${colors.red}Missing new session files! Pull immediately:${colors.reset}`);
    console.log(`   ${colors.cyan}git pull origin main${colors.reset}`);
  }
  
  if (percentage === 100) {
    console.log(`${colors.green}No actions needed - you're fully synced!${colors.reset}`);
    console.log(`\n${colors.bright}${colors.cyan}Ready to proceed with backend testing:${colors.reset}`);
    console.log(`  ${colors.cyan}bash scripts/replit-setup.sh${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════${colors.reset}\n`);
  
  return percentage === 100;
}

// Run verification
verifySyncStatus().then(synced => {
  if (synced) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
