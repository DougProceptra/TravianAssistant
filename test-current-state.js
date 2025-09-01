#!/usr/bin/env node

/**
 * Test Current State of TravianAssistant
 * Run this to verify what's working and what needs fixing
 * 
 * Usage: node test-current-state.js
 */

console.log('========================================');
console.log('TravianAssistant System State Check');
console.log('Date:', new Date().toISOString());
console.log('========================================\n');

// Test 1: Check if Replit backend is accessible
async function testReplitBackend() {
  console.log('1. Testing Replit Backend...');
  try {
    const response = await fetch('https://TravianAssistant.dougdostal.replit.dev/api/health');
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Backend is RUNNING');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('   ❌ Backend returned status:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Backend is NOT accessible');
    console.log('   Error:', error.message);
  }
  console.log('');
}

// Test 2: Check if Vercel proxy is working
async function testVercelProxy() {
  console.log('2. Testing Vercel Proxy...');
  try {
    const response = await fetch('https://travian-proxy-simple.vercel.app/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "test successful" and nothing else' }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Vercel proxy is WORKING');
      if (data.content && data.content[0]) {
        console.log('   AI Response:', data.content[0].text);
      }
    } else {
      console.log('   ❌ Vercel proxy returned status:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Vercel proxy ERROR:', error.message);
  }
  console.log('');
}

// Test 3: Check local game data files
const fs = require('fs');
const path = require('path');

function testGameData() {
  console.log('3. Testing Game Data Files...');
  
  const dataFiles = [
    'data/troops/travian_all_tribes_complete.json',
    'data/buildings/travian_complete_buildings_data.json',
    'data/buildings/buildings.json',
    'test-ai-agent-local.js'
  ];
  
  dataFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`   ❌ ${file} NOT FOUND`);
    }
  });
  console.log('');
}

// Test 4: Check extension build
function testExtensionBuild() {
  console.log('4. Testing Extension Build...');
  
  const distFiles = [
    'packages/extension/dist/manifest.json',
    'packages/extension/dist/content.js',
    'packages/extension/dist/background.js'
  ];
  
  distFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const modified = new Date(stats.mtime);
      const hoursAgo = (Date.now() - modified) / (1000 * 60 * 60);
      console.log(`   ✅ ${file} (Modified ${hoursAgo.toFixed(1)} hours ago)`);
      
      // Check manifest version
      if (file.includes('manifest.json')) {
        const manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        console.log(`      Version: ${manifest.version}`);
        console.log(`      Name: ${manifest.name}`);
      }
    } else {
      console.log(`   ❌ ${file} NOT FOUND - Need to build extension`);
    }
  });
  console.log('');
}

// Test 5: Check which backend URL is configured
function checkBackendConfig() {
  console.log('5. Checking Backend Configuration...');
  
  try {
    // Check background.js for URLs
    const bgPath = path.join(__dirname, 'packages/extension/dist/background.js');
    if (fs.existsSync(bgPath)) {
      const content = fs.readFileSync(bgPath, 'utf8');
      
      // Check for Replit URL
      if (content.includes('TravianAssistant.dougdostal.replit.dev')) {
        console.log('   ✅ Extension configured for REPLIT backend');
      }
      
      // Check for Vercel URL
      if (content.includes('travian-proxy-simple.vercel.app')) {
        console.log('   ✅ Extension configured for VERCEL proxy');
      }
      
      // Check for localhost
      if (content.includes('localhost:3')) {
        console.log('   ⚠️  Extension has LOCALHOST references');
      }
    } else {
      console.log('   ❌ No built extension found');
    }
  } catch (error) {
    console.log('   ❌ Error checking config:', error.message);
  }
  console.log('');
}

// Test 6: Quick test of local AI simulation
async function testLocalAI() {
  console.log('6. Testing Local AI Simulation...');
  
  const testPath = path.join(__dirname, 'test-ai-agent-local.js');
  if (fs.existsSync(testPath)) {
    console.log('   ✅ Local AI test file exists');
    console.log('   Run: node test-ai-agent-local.js');
  } else {
    console.log('   ❌ Local AI test file not found');
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  await testReplitBackend();
  await testVercelProxy();
  testGameData();
  testExtensionBuild();
  checkBackendConfig();
  await testLocalAI();
  
  console.log('========================================');
  console.log('NEXT STEPS:');
  console.log('========================================');
  console.log('');
  console.log('If backend is NOT running:');
  console.log('  1. Go to https://replit.com/@dougdostal/TravianAssistant');
  console.log('  2. Click "Run" to start the server');
  console.log('');
  console.log('If extension needs rebuilding:');
  console.log('  cd packages/extension');
  console.log('  ./build-minimal.sh');
  console.log('');
  console.log('To test the extension:');
  console.log('  1. Open chrome://extensions');
  console.log('  2. Remove old version');
  console.log('  3. Load unpacked from packages/extension/dist');
  console.log('  4. Go to Travian game');
  console.log('  5. Check console for connection messages');
  console.log('');
  console.log('To test local AI:');
  console.log('  node test-ai-agent-local.js');
  console.log('');
}

// Run everything
runAllTests().catch(console.error);
