#!/usr/bin/env node

/**
 * TravianAssistant Backend Test Script
 * Tests the SQLite backend server to ensure all endpoints are working
 * Run from project root: node scripts/test-backend-sqlite.js
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = 'localhost';
const BASE_URL = `http://${HOST}:${PORT}`;

// Test data
const TEST_ACCOUNT_ID = 'test_account_001';
const TEST_VILLAGE = {
  accountId: TEST_ACCOUNT_ID,
  villageId: 'village_001',
  villageName: 'Test Village',
  coordinates: '0|0',
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
  },
  population: 125,
  buildings: [
    { id: 'woodcutter', level: 3 },
    { id: 'claypit', level: 2 }
  ],
  troops: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
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

// Test functions
async function testHealthEndpoint() {
  console.log(`${colors.cyan}Testing /api/health endpoint...${colors.reset}`);
  
  try {
    const response = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200 && response.body.status === 'healthy') {
      console.log(`${colors.green}✓ Health endpoint working${colors.reset}`);
      console.log(`  Platform: ${response.body.platform}`);
      console.log(`  Database: ${response.body.database}`);
      console.log(`  Uptime: ${response.body.uptime} seconds`);
      return true;
    } else {
      console.log(`${colors.red}✗ Health endpoint failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Health endpoint error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testRootEndpoint() {
  console.log(`\n${colors.cyan}Testing root (/) endpoint...${colors.reset}`);
  
  try {
    const response = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: '/',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && response.body.message) {
      console.log(`${colors.green}✓ Root endpoint working${colors.reset}`);
      console.log(`  Message: ${response.body.message}`);
      console.log(`  Version: ${response.body.version}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Root endpoint failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Root endpoint error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testAccountCreation() {
  console.log(`\n${colors.cyan}Testing account creation...${colors.reset}`);
  
  try {
    const response = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: '/api/account',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      accountId: TEST_ACCOUNT_ID,
      serverUrl: 'https://test.travian.com',
      accountName: 'TestPlayer',
      tribe: 'Egyptians'
    });
    
    if (response.statusCode === 200 && response.body.success) {
      console.log(`${colors.green}✓ Account creation working${colors.reset}`);
      console.log(`  Account ID: ${response.body.accountId}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Account creation failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Account creation error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testVillageSync() {
  console.log(`\n${colors.cyan}Testing village sync...${colors.reset}`);
  
  try {
    const response = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: '/api/villages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      accountId: TEST_ACCOUNT_ID,
      village: TEST_VILLAGE,
      timestamp: new Date().toISOString()
    });
    
    if (response.statusCode === 200 && response.body.success) {
      console.log(`${colors.green}✓ Village sync working${colors.reset}`);
      console.log(`  Villages updated: ${response.body.villagesUpdated}`);
      if (response.body.alerts && response.body.alerts.length > 0) {
        console.log(`  Alerts: ${response.body.alerts.length}`);
      }
      return true;
    } else {
      console.log(`${colors.red}✗ Village sync failed${colors.reset}`);
      console.log(`  Response:`, response.body);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Village sync error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testGetVillages() {
  console.log(`\n${colors.cyan}Testing get villages...${colors.reset}`);
  
  try {
    const response = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: `/api/villages/${TEST_ACCOUNT_ID}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200 && response.body.accountId) {
      console.log(`${colors.green}✓ Get villages working${colors.reset}`);
      console.log(`  Account ID: ${response.body.accountId}`);
      console.log(`  Village count: ${response.body.count}`);
      console.log(`  Data source: ${response.body.source}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Get villages failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Get villages error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testHistoryEndpoint() {
  console.log(`\n${colors.cyan}Testing history endpoint...${colors.reset}`);
  
  const villageDbId = `${TEST_ACCOUNT_ID}_${TEST_VILLAGE.villageId}`;
  
  try {
    const response = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: `/api/history/${villageDbId}?hours=24`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200 && Array.isArray(response.body)) {
      console.log(`${colors.green}✓ History endpoint working${colors.reset}`);
      console.log(`  Snapshots returned: ${response.body.length}`);
      return true;
    } else {
      console.log(`${colors.red}✗ History endpoint failed${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ History endpoint error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function checkDatabaseFile() {
  console.log(`\n${colors.cyan}Checking database file...${colors.reset}`);
  
  const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
  
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`${colors.green}✓ Database file exists${colors.reset}`);
    console.log(`  Path: ${dbPath}`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  Modified: ${stats.mtime.toLocaleString()}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Database file not found at ${dbPath}${colors.reset}`);
    return false;
  }
}

async function checkServerRunning() {
  console.log(`${colors.cyan}Checking if server is running on port ${PORT}...${colors.reset}`);
  
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log(`${colors.green}✓ Server is running on port ${PORT}${colors.reset}`);
        resolve(true);
      } else {
        console.log(`${colors.yellow}⚠ Server responded with status ${res.statusCode}${colors.reset}`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log(`${colors.red}✗ Server is not running on port ${PORT}${colors.reset}`);
        console.log(`${colors.yellow}  Start the server with: cd backend && npm run server:sqlite${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Connection error: ${error.message}${colors.reset}`);
      }
      resolve(false);
    });
    
    req.end();
  });
}

// Main test runner
async function runTests() {
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}TravianAssistant SQLite Backend Test${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  // Check database file first
  const dbExists = await checkDatabaseFile();
  if (!dbExists) {
    console.log(`\n${colors.yellow}⚠ Run 'npm run init-db' in the backend directory first${colors.reset}`);
  }
  
  // Check if server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log(`\n${colors.yellow}Please start the server first, then run this test again.${colors.reset}`);
    process.exit(1);
  }
  
  // Run all tests
  const results = [];
  
  results.push(await testHealthEndpoint());
  results.push(await testRootEndpoint());
  results.push(await testAccountCreation());
  results.push(await testVillageSync());
  results.push(await testGetVillages());
  results.push(await testHistoryEndpoint());
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  
  const passed = results.filter(r => r).length;
  const failed = results.length - passed;
  
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.bright}${colors.green}✓ All tests passed! Backend is working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.red}✗ Some tests failed. Please check the errors above.${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
  console.log(`1. If all tests pass, the backend is ready for Chrome Extension integration`);
  console.log(`2. Backend API is available at: ${BASE_URL}`);
  console.log(`3. WebSocket is available at: ws://${HOST}:${PORT}`);
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
