#!/usr/bin/env node

/**
 * Replit-specific startup script
 * Ensures proper server initialization and preview window functionality
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 TravianAssistant Replit Starter');
console.log('===================================\n');

// Step 1: Check if this is first run
const dbPath = './db/travian.db';
const firstRun = !fs.existsSync(dbPath);

if (firstRun) {
  console.log('📦 First run detected - initializing...\n');
  
  // Create necessary directories
  const dirs = ['./db', './data', './logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });

  // Check if dependencies are installed
  if (!fs.existsSync('node_modules')) {
    console.log('\n📦 Installing dependencies...');
    const npm = spawn('npm', ['install'], { stdio: 'inherit' });
    npm.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dependencies installed\n');
        initDatabase();
      } else {
        console.error('❌ Failed to install dependencies');
        process.exit(1);
      }
    });
  } else {
    initDatabase();
  }
} else {
  startServer();
}

function initDatabase() {
  console.log('🗄️  Initializing database...');
  
  // Run database initialization
  const dbInit = spawn('node', ['scripts/init-v3-database.js'], { stdio: 'inherit' });
  
  dbInit.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Database initialized\n');
      startServer();
    } else {
      console.error('❌ Database initialization failed');
      // Try to start server anyway
      startServer();
    }
  });
}

function startServer() {
  console.log('🌐 Starting server...\n');
  
  // Get Replit environment info
  const isReplit = process.env.REPL_SLUG ? true : false;
  
  if (isReplit) {
    console.log('📍 Replit Environment Detected:');
    console.log(`   REPL_SLUG: ${process.env.REPL_SLUG}`);
    console.log(`   REPL_OWNER: ${process.env.REPL_OWNER}`);
    console.log(`   Public URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    console.log('');
    
    // Set environment variables for server
    process.env.PORT = process.env.PORT || '3000';
    process.env.HOST = '0.0.0.0';
    process.env.DB_PATH = process.env.DB_PATH || './db/travian.db';
  }
  
  // Display instructions while server starts
  console.log('📝 Quick Start Instructions:');
  console.log('1. Server will start in a moment...');
  console.log('2. Preview window will show the admin dashboard');
  console.log('3. Use the URL shown for Chrome extension configuration');
  console.log('4. Multi-player support enabled (3-5 players)\n');
  
  // Start the actual server
  const server = require('./server.js');
  
  // Ensure clean shutdown
  process.on('SIGTERM', () => {
    console.log('\n📛 Shutting down gracefully...');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('\n📛 Shutting down gracefully...');
    process.exit(0);
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - try to keep running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - try to keep running
});
