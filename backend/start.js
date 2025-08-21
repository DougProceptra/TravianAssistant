#!/usr/bin/env node

/**
 * TravianAssistant Backend Starter for Replit
 * This script handles both development and production modes
 * Works with Replit's Run button and deployment system
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Detect if we're in Replit environment
const IS_REPLIT = process.env.REPL_ID || process.env.REPLIT_DB_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT;

// Replit environment provides PORT for deployments
const PORT = process.env.PORT || 3002;

console.log('========================================');
console.log('TravianAssistant Backend Starter');
console.log('========================================');
console.log(`Environment: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`Platform: ${IS_REPLIT ? 'Replit' : 'Local'}`);
console.log(`Port: ${PORT}`);
console.log('========================================\n');

// Set environment variables for the server
process.env.PORT = PORT;
process.env.NODE_ENV = IS_PRODUCTION ? 'production' : 'development';

// If in Replit, set CORS to allow from any subdomain
if (IS_REPLIT) {
  // Allow CORS from Replit preview and deployed URLs
  process.env.CORS_ORIGIN = IS_PRODUCTION 
    ? 'https://*.replit.app,https://*.repl.co,chrome-extension://*'
    : '*'; // Development allows all
}

// Choose which server to run
const serverFile = process.env.USE_SQLITE === 'true' || fs.existsSync('./travian.db')
  ? 'server-sqlite.js' 
  : 'server.js';

const serverPath = path.join(__dirname, serverFile);

console.log(`Starting server: ${serverFile}`);
console.log(`Server path: ${serverPath}\n`);

// Check if server file exists
if (!fs.existsSync(serverPath)) {
  console.error(`ERROR: Server file not found at ${serverPath}`);
  console.error('Make sure you are running this from the backend directory');
  process.exit(1);
}

// Start the server
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Ensure these are set for the child process
    PORT: PORT,
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGIN: process.env.CORS_ORIGIN
  }
});

// Handle server exit
server.on('exit', (code) => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.kill('SIGTERM');
  setTimeout(() => {
    server.kill('SIGKILL');
    process.exit(0);
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
  setTimeout(() => {
    server.kill('SIGKILL');
    process.exit(0);
  }, 5000);
});

// Log startup complete
server.on('spawn', () => {
  console.log('✅ Server process started successfully');
  console.log(`📡 Waiting for server to be ready on port ${PORT}...\n`);
  
  // In Replit, show the URL where the server will be available
  if (IS_REPLIT) {
    const replName = process.env.REPL_SLUG || 'TravianAssistant';
    const replOwner = process.env.REPL_OWNER || 'your-username';
    
    if (IS_PRODUCTION) {
      console.log(`🌐 Production URL: https://${replName}.${replOwner}.repl.co`);
    } else {
      console.log(`🔧 Development URLs:`);
      console.log(`   - Preview: https://${replName}.${replOwner}.repl.co`);
      console.log(`   - WebView: Port ${PORT} in Replit editor`);
    }
    console.log('');
  }
});
