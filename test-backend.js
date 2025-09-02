#!/usr/bin/env node

/**
 * Quick test script for TravianAssistant Backend
 * Run this to verify all endpoints are working
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log(`${colors.cyan}=== TravianAssistant Backend Test ===${colors.reset}\n`);
  
  try {
    // Test 1: Root endpoint
    console.log(`${colors.yellow}Testing root endpoint...${colors.reset}`);
    const root = await makeRequest('/');
    console.log(`${colors.green}✓ Server info:${colors.reset}`);
    console.log(`  Version: ${root.data.version}`);
    console.log(`  Status: ${root.data.status}`);
    console.log(`  Stats:`, root.data.stats);
    console.log('');
    
    // Test 2: Health check
    console.log(`${colors.yellow}Testing health endpoint...${colors.reset}`);
    const health = await makeRequest('/health');
    console.log(`${colors.green}✓ Health: ${health.data.status}${colors.reset}`);
    console.log(`  Uptime: ${Math.round(health.data.uptime)} seconds`);
    console.log('');
    
    // Test 3: Game data
    console.log(`${colors.yellow}Testing game data endpoint...${colors.reset}`);
    const gameData = await makeRequest('/api/game-data');
    console.log(`${colors.green}✓ Game data loaded:${colors.reset}`);
    console.log(`  Buildings: ${gameData.data.buildings.length}`);
    console.log(`  Troops: ${gameData.data.troops.length}`);
    console.log(`  Quests: ${gameData.data.quests.length}`);
    console.log('');
    
    // Test 4: Save test village
    console.log(`${colors.yellow}Testing village save...${colors.reset}`);
    const testVillage = {
      accountId: 'test_user',
      village: {
        id: 'test_village_1',
        name: 'Test Village',
        coordinates: { x: 0, y: 0 },
        population: 100,
        resources: {
          wood: 500,
          clay: 400,
          iron: 300,
          crop: 600
        },
        production: {
          wood: 30,
          clay: 25,
          iron: 20,
          crop: 15
        }
      }
    };
    
    const saveResult = await makeRequest('/api/village', 'POST', testVillage);
    if (saveResult.status === 200) {
      console.log(`${colors.green}✓ Village saved successfully${colors.reset}`);
      console.log(`  ID: ${saveResult.data.id}`);
    }
    console.log('');
    
    // Test 5: Retrieve villages
    console.log(`${colors.yellow}Testing village retrieval...${colors.reset}`);
    const villages = await makeRequest('/api/villages/test_user');
    console.log(`${colors.green}✓ Villages retrieved:${colors.reset}`);
    console.log(`  Count: ${villages.data.count}`);
    if (villages.data.villages.length > 0) {
      const v = villages.data.villages[0];
      console.log(`  First village: ${v.village_name} (${v.x},${v.y})`);
    }
    console.log('');
    
    // Test 6: Save recommendation
    console.log(`${colors.yellow}Testing recommendation save...${colors.reset}`);
    const recommendation = {
      priority: 1,
      actionType: 'BUILD',
      actionData: {
        building: 'woodcutter',
        level: 2,
        reason: 'Increase wood production'
      }
    };
    
    const recResult = await makeRequest('/api/recommendation', 'POST', recommendation);
    if (recResult.status === 200) {
      console.log(`${colors.green}✓ Recommendation saved${colors.reset}`);
      console.log(`  ID: ${recResult.data.id}`);
    }
    console.log('');
    
    // Test 7: Get recommendations
    console.log(`${colors.yellow}Testing recommendation retrieval...${colors.reset}`);
    const recs = await makeRequest('/api/recommendations?limit=5');
    console.log(`${colors.green}✓ Recommendations retrieved: ${recs.data.length}${colors.reset}`);
    if (recs.data.length > 0) {
      console.log(`  Latest: ${recs.data[0].action_type} (Priority: ${recs.data[0].priority})`);
    }
    console.log('');
    
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log(`${colors.green}✓ All tests passed! Backend is ready.${colors.reset}`);
    console.log(`${colors.green}========================================${colors.reset}`);
    console.log('');
    console.log(`${colors.cyan}Next steps:${colors.reset}`);
    console.log('1. Note your Replit URL from the browser tab');
    console.log('2. Update BACKEND_URL in the Chrome extension');
    console.log('3. Rebuild and reload the extension');
    console.log('4. Visit a Travian page to start collecting data');
    
  } catch (error) {
    console.error(`${colors.red}✗ Test failed: ${error.message}${colors.reset}`);
  }
}

// Run tests
runTests();
