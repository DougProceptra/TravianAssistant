#!/usr/bin/env node

/**
 * TravianAssistant Backend Server with Mem0 Integration
 * Runs on Replit, manages game data, and coordinates with Chrome Extension
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3002;
const HOST = '0.0.0.0'; // Listen on all interfaces for Replit

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname)); // Serve static files from root directory

// Initialize SQLite database
const DB_PATH = process.env.DB_PATH || './db/travian.db';

// Ensure db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('🚀 TravianAssistant Backend Starting...');
console.log(`📁 Database: ${DB_PATH}`);

// Detect Replit environment
if (process.env.REPL_SLUG) {
  console.log(`🌐 Replit Environment Detected`);
  console.log(`   REPL_SLUG: ${process.env.REPL_SLUG}`);
  console.log(`   REPL_OWNER: ${process.env.REPL_OWNER}`);
  console.log(`   Public URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
}

// Create tables if they don't exist
function initializeDatabase() {
  console.log('📊 Initializing database schema...');
  
  // Core game state tables
  db.exec(`
    -- Villages from map.sql
    CREATE TABLE IF NOT EXISTS villages (
      id INTEGER PRIMARY KEY,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      tid INTEGER,
      vid INTEGER UNIQUE,
      village TEXT,
      uid INTEGER,
      player TEXT,
      aid INTEGER,
      alliance TEXT,
      population INTEGER,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(x, y)
    );

    -- User's village data (from scraping)
    CREATE TABLE IF NOT EXISTS user_villages (
      id TEXT PRIMARY KEY, -- userId_villageId
      account_id TEXT NOT NULL, -- Now stores userId (hashed email)
      village_id TEXT NOT NULL,
      village_name TEXT,
      x INTEGER,
      y INTEGER,
      population INTEGER,
      resources TEXT,
      production TEXT,
      buildings TEXT,
      troops TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Game events and recommendations
    CREATE TABLE IF NOT EXISTS game_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data TEXT NOT NULL,
      processed BOOLEAN DEFAULT FALSE
    );

    -- AI recommendations
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      priority INTEGER,
      action_type TEXT,
      action_data TEXT,
      completed BOOLEAN DEFAULT FALSE,
      result TEXT
    );

    -- Static game data tables
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      max_level INTEGER,
      requirements TEXT,
      costs TEXT,
      benefits TEXT,
      tribe_specific BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS troops (
      id TEXT PRIMARY KEY,
      tribe TEXT,
      name TEXT,
      type TEXT,
      attack INTEGER,
      defense_infantry INTEGER,
      defense_cavalry INTEGER,
      speed INTEGER,
      capacity INTEGER,
      consumption INTEGER,
      training_time INTEGER,
      costs TEXT
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      category TEXT,
      name TEXT,
      requirements TEXT,
      rewards TEXT,
      order_index INTEGER
    );
    
    -- Settlement tracking for V2 focus
    CREATE TABLE IF NOT EXISTS settlement_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL, -- Now stores userId
      cp_current INTEGER DEFAULT 0,
      cp_production INTEGER DEFAULT 0,
      settlers_count INTEGER DEFAULT 0,
      resources_hourly TEXT,
      estimated_settlement_time TIMESTAMP,
      phase TEXT DEFAULT 'FOUNDATION',
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('✅ Database schema initialized');
}

// Load game data if not already loaded
async function loadGameData() {
  const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get().count;
  
  if (buildingCount === 0) {
    console.log('📥 Loading game data...');
    
    // Check if game data files exist
    const gameDataPath = path.join(__dirname, 'data', 'game-data.json');
    if (fs.existsSync(gameDataPath)) {
      const gameData = JSON.parse(fs.readFileSync(gameDataPath, 'utf8'));
      
      // Load buildings
      if (gameData.buildings) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO buildings (id, name, category, max_level, requirements, costs, benefits, tribe_specific)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const building of gameData.buildings) {
          stmt.run(
            building.id,
            building.name,
            building.category,
            building.maxLevel || 20,
            JSON.stringify(building.requirements || {}),
            JSON.stringify(building.costs || {}),
            JSON.stringify(building.benefits || {}),
            building.tribeSpecific ? 1 : 0
          );
        }
        console.log(`✅ Loaded ${gameData.buildings.length} buildings`);
      }
      
      // Load troops
      if (gameData.troops) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO troops (id, tribe, name, type, attack, defense_infantry, defense_cavalry, speed, capacity, consumption, training_time, costs)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const troop of gameData.troops) {
          stmt.run(
            troop.id,
            troop.tribe,
            troop.name,
            troop.type,
            troop.attack,
            troop.defenseInfantry,
            troop.defenseCavalry,
            troop.speed,
            troop.capacity,
            troop.consumption,
            troop.trainingTime,
            JSON.stringify(troop.costs || {})
          );
        }
        console.log(`✅ Loaded ${gameData.troops.length} troops`);
      }
      
      // Load quests
      if (gameData.quests) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO quests (id, category, name, requirements, rewards, order_index)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const quest of gameData.quests) {
          stmt.run(
            quest.id,
            quest.category,
            quest.name,
            JSON.stringify(quest.requirements || {}),
            JSON.stringify(quest.rewards || {}),
            quest.orderIndex || 0
          );
        }
        console.log(`✅ Loaded ${gameData.quests.length} quests`);
      }
    } else {
      console.log('⚠️ Game data file not found. Creating minimal default data...');
      
      // Insert minimal default data
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO buildings (id, name, category, max_level, requirements, costs, benefits, tribe_specific)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Basic resource fields
      stmt.run('woodcutter', 'Woodcutter', 'resource', 20, '{}', '{}', '{}', 0);
      stmt.run('clay_pit', 'Clay Pit', 'resource', 20, '{}', '{}', '{}', 0);
      stmt.run('iron_mine', 'Iron Mine', 'resource', 20, '{}', '{}', '{}', 0);
      stmt.run('cropland', 'Cropland', 'resource', 20, '{}', '{}', '{}', 0);
      
      console.log('✅ Created default building data');
    }
  } else {
    console.log(`✅ Game data already loaded (${buildingCount} buildings)`);
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: db.open ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Root endpoint - show a nice landing page
app.get('/', (req, res) => {
  const stats = {
    villages: db.prepare('SELECT COUNT(*) as count FROM villages').get().count,
    userVillages: db.prepare('SELECT COUNT(*) as count FROM user_villages').get().count,
    buildings: db.prepare('SELECT COUNT(*) as count FROM buildings').get().count,
    troops: db.prepare('SELECT COUNT(*) as count FROM troops').get().count,
    recommendations: db.prepare('SELECT COUNT(*) as count FROM recommendations').get().count
  };
  
  // Get unique player count
  const players = db.prepare('SELECT DISTINCT account_id FROM user_villages').all();
  
  // Determine backend URL
  const backendUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : `http://localhost:${PORT}`;
  
  // Send an HTML response for better visibility in Replit preview
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TravianAssistant Backend</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        h1 { color: #333; }
        .status { 
          background: #4CAF50; 
          color: white; 
          padding: 10px; 
          border-radius: 5px; 
          display: inline-block;
        }
        .stats {
          background: white;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .endpoint {
          background: #f0f0f0;
          padding: 5px 10px;
          margin: 5px 0;
          border-radius: 3px;
          font-family: monospace;
        }
        .instructions {
          background: #fff3cd;
          border: 1px solid #ffc107;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .admin-link {
          display: inline-block;
          background: #2196F3;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 10px;
        }
        .admin-link:hover {
          background: #1976D2;
        }
        .url-box {
          background: #e8f5e9;
          border: 2px solid #4CAF50;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 14px;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <h1>🏰 TravianAssistant Backend Server (Mem0 Enabled)</h1>
      <div class="status">✅ Server is running!</div>
      
      <div class="stats">
        <h2>📊 Database Statistics</h2>
        <ul>
          <li><strong>Active Players:</strong> ${players.length}</li>
          <li>Villages (from map.sql): ${stats.villages}</li>
          <li>User Villages (scraped): ${stats.userVillages}</li>
          <li>Buildings loaded: ${stats.buildings}</li>
          <li>Troops loaded: ${stats.troops}</li>
          <li>AI Recommendations: ${stats.recommendations}</li>
        </ul>
        <a href="/admin.html" class="admin-link">📊 View Admin Dashboard</a>
      </div>
      
      <div class="stats">
        <h2>🔌 API Endpoints</h2>
        <div class="endpoint">GET /health</div>
        <div class="endpoint">GET /api/game-data</div>
        <div class="endpoint">GET /api/all-players</div>
        <div class="endpoint">POST /api/map</div>
        <div class="endpoint">POST /api/village (now uses userId)</div>
        <div class="endpoint">GET /api/villages/:userId</div>
        <div class="endpoint">POST /api/game-mechanics-context (NEW)</div>
        <div class="endpoint">POST /api/recommendation</div>
        <div class="endpoint">GET /api/recommendations</div>
      </div>
      
      <div class="instructions">
        <h3>🎮 Chrome Extension Configuration</h3>
        <p>Set your backend URL in the extension to:</p>
        <div class="url-box">${backendUrl}</div>
        
        <h3>📝 For Players:</h3>
        <ol>
          <li>Install the Chrome extension from /packages/extension/dist</li>
          <li>Configure with the backend URL above</li>
          <li>Enter your email when prompted (will be hashed for privacy)</li>
          <li>Visit Travian pages to start data collection</li>
        </ol>
        
        <h3>👥 Multi-Player Support:</h3>
        <p>Each player's data is stored separately using their hashed email as ID.</p>
        <p>3-5 players can use this same backend simultaneously.</p>
        
        <h3>🚀 Testing New Server:</h3>
        <p>Perfect for testing early game strategies with the Settlement Race Optimizer!</p>
      </div>
      
      <div style="margin-top: 30px; color: #666;">
        <small>Version 3.1.0 with Mem0 | Uptime: ${Math.round(process.uptime())} seconds | Database: ${DB_PATH}</small>
      </div>
    </body>
    </html>
  `);
});

// Get all unique player IDs
app.get('/api/all-players', (req, res) => {
  try {
    const players = db.prepare('SELECT DISTINCT account_id FROM user_villages').all();
    const playerIds = players.map(p => p.account_id);
    res.json(playerIds);
  } catch (error) {
    console.error('❌ Get all players error:', error);
    res.status(500).json({ error: error.message });
  }
});

// JSON API endpoint for compatibility
app.get('/api/status', (req, res) => {
  const stats = {
    villages: db.prepare('SELECT COUNT(*) as count FROM villages').get().count,
    userVillages: db.prepare('SELECT COUNT(*) as count FROM user_villages').get().count,
    buildings: db.prepare('SELECT COUNT(*) as count FROM buildings').get().count,
    troops: db.prepare('SELECT COUNT(*) as count FROM troops').get().count,
    recommendations: db.prepare('SELECT COUNT(*) as count FROM recommendations').get().count
  };
  
  res.json({
    message: 'TravianAssistant Backend Server',
    version: '3.1.0',
    status: 'operational',
    features: ['mem0-integration', 'multi-user', 'game-mechanics'],
    stats,
    endpoints: [
      'GET /health',
      'GET /api/all-players',
      'POST /api/map',
      'POST /api/village',
      'GET /api/villages/:userId',
      'GET /api/game-data',
      'POST /api/game-mechanics-context',
      'POST /api/recommendation',
      'GET /api/recommendations'
    ]
  });
});

// NEW: Game mechanics context endpoint for AI
app.post('/api/game-mechanics-context', (req, res) => {
  try {
    const { query, tribe, villages } = req.body;
    
    const context = {
      buildings: [],
      troops: [],
      tips: []
    };
    
    // Detect what mechanics are relevant based on query
    if (query.match(/settle|village|culture|CP/i)) {
      context.buildings = db.prepare(`
        SELECT * FROM buildings 
        WHERE id IN ('residence', 'palace', 'town_hall', 'command_center')
      `).all().map(b => ({
        ...b,
        costs: JSON.parse(b.costs || '{}'),
        benefits: JSON.parse(b.benefits || '{}')
      }));
      
      context.tips.push('For 2x server: Aim for settlement by day 7');
      context.tips.push('You need 3 settlers from Residence/Palace');
      context.tips.push('Culture points needed: ' + (villages < 3 ? '10000' : '20000+'));
    }
    
    if (query.match(/troop|army|attack|defense/i)) {
      context.troops = db.prepare(`
        SELECT * FROM troops 
        WHERE tribe = ?
        LIMIT 10
      `).all(tribe || 'romans').map(t => ({
        ...t,
        costs: JSON.parse(t.costs || '{}')
      }));
    }
    
    if (query.match(/hero/i)) {
      context.tips.push('Hero resource production: 100 points = 2400/hour per resource when distributed evenly');
      context.tips.push('Or 8000/hour when focused on single resource');
    }
    
    res.json(context);
    
  } catch (error) {
    console.error('❌ Game mechanics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import map.sql data
app.post('/api/map', (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'No SQL data provided' });
    }
    
    console.log('📍 Importing map.sql data...');
    
    // Parse and execute the SQL
    const statements = sql.split(';').filter(s => s.trim());
    let imported = 0;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO villages (x, y, tid, vid, village, uid, player, aid, alliance, population)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const statement of statements) {
      if (statement.includes('INSERT INTO')) {
        // Extract values from INSERT statement
        const match = statement.match(/VALUES\s*\((.*?)\)/);
        if (match) {
          const values = match[1].split(',').map(v => {
            v = v.trim();
            if (v === 'NULL') return null;
            if (v.startsWith("'") && v.endsWith("'")) {
              return v.slice(1, -1).replace(/''/g, "'");
            }
            return parseInt(v);
          });
          
          if (values.length >= 10) {
            stmt.run(...values.slice(0, 10));
            imported++;
          }
        }
      }
    }
    
    console.log(`✅ Imported ${imported} villages from map.sql`);
    res.json({ success: true, imported });
    
  } catch (error) {
    console.error('❌ Map import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATED: Save scraped village data with userId
app.post('/api/village', (req, res) => {
  try {
    // Support both userId (new) and accountId (legacy) for backwards compatibility
    const userId = req.body.userId || req.body.accountId;
    const { village } = req.body;
    
    if (!userId || !village) {
      return res.status(400).json({ error: 'Missing userId or village data' });
    }
    
    const id = `${userId}_${village.id || Date.now()}`;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_villages (
        id, account_id, village_id, village_name, x, y, population,
        resources, production, buildings, troops, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      id,
      userId,  // Now using hashed email as userId
      village.id || 'unknown',
      village.name,
      village.coordinates?.x || 0,
      village.coordinates?.y || 0,
      village.population || 0,
      JSON.stringify(village.resources || {}),
      JSON.stringify(village.production || {}),
      JSON.stringify(village.buildings || []),
      JSON.stringify(village.troops || [])
    );
    
    console.log(`✅ Saved village data for ${village.name} (User: ${userId.substring(0, 10)}...)`);
    res.json({ success: true, id });
    
  } catch (error) {
    console.error('❌ Village save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATED: Get user villages - support both userId and accountId
app.get('/api/villages/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const villages = db.prepare(`
      SELECT * FROM user_villages 
      WHERE account_id = ? 
      ORDER BY last_updated DESC
    `).all(userId);
    
    // Parse JSON fields
    const parsed = villages.map(v => ({
      ...v,
      resources: JSON.parse(v.resources || '{}'),
      production: JSON.parse(v.production || '{}'),
      buildings: JSON.parse(v.buildings || '[]'),
      troops: JSON.parse(v.troops || '[]')
    }));
    
    res.json({
      userId,
      villages: parsed,
      count: parsed.length
    });
    
  } catch (error) {
    console.error('❌ Get villages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get game data (buildings, troops, etc.)
app.get('/api/game-data', (req, res) => {
  try {
    const buildings = db.prepare('SELECT * FROM buildings').all().map(b => ({
      ...b,
      requirements: JSON.parse(b.requirements || '{}'),
      costs: JSON.parse(b.costs || '{}'),
      benefits: JSON.parse(b.benefits || '{}'),
      tribe_specific: b.tribe_specific === 1
    }));
    
    const troops = db.prepare('SELECT * FROM troops').all().map(t => ({
      ...t,
      costs: JSON.parse(t.costs || '{}')
    }));
    
    const quests = db.prepare('SELECT * FROM quests ORDER BY order_index').all().map(q => ({
      ...q,
      requirements: JSON.parse(q.requirements || '{}'),
      rewards: JSON.parse(q.rewards || '{}')
    }));
    
    res.json({
      buildings,
      troops,
      quests,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Get game data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save AI recommendation
app.post('/api/recommendation', (req, res) => {
  try {
    const { priority, actionType, actionData, userId, accountId } = req.body;
    
    // Support both userId and accountId
    const userIdentifier = userId || accountId;
    
    const stmt = db.prepare(`
      INSERT INTO recommendations (priority, action_type, action_data)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      priority || 5,
      actionType,
      JSON.stringify({ ...actionData, userId: userIdentifier })
    );
    
    console.log(`✅ Saved recommendation for ${userIdentifier?.substring(0, 10)}...: ${actionType}`);
    res.json({ success: true, id: result.lastInsertRowid });
    
  } catch (error) {
    console.error('❌ Save recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent recommendations
app.get('/api/recommendations', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const onlyActive = req.query.active === 'true';
    const userId = req.query.userId || req.query.accountId;
    
    let query = 'SELECT * FROM recommendations';
    const conditions = [];
    
    if (onlyActive) {
      conditions.push('completed = FALSE');
    }
    
    if (userId) {
      conditions.push(`(action_data LIKE '%"userId":"${userId}"%' OR action_data LIKE '%"accountId":"${userId}"%')`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY timestamp DESC, priority ASC LIMIT ?';
    
    const recommendations = db.prepare(query).all(limit).map(r => ({
      ...r,
      action_data: JSON.parse(r.action_data || '{}'),
      result: r.result ? JSON.parse(r.result) : null,
      completed: r.completed === 1
    }));
    
    res.json(recommendations);
    
  } catch (error) {
    console.error('❌ Get recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server - bind to 0.0.0.0 for Replit
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  
  if (process.env.REPL_SLUG) {
    console.log(`📱 Replit URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    console.log(`👥 Admin Dashboard: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/admin.html`);
  }
  
  console.log('🧠 Mem0 Integration: Ready (configure in Vercel proxy)');
  
  // Initialize database and load game data
  initializeDatabase();
  loadGameData();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM received, closing server...');
  server.close(() => {
    db.close();
    console.log('👋 Server closed');
  });
});

process.on('SIGINT', () => {
  console.log('📛 SIGINT received, closing server...');
  server.close(() => {
    db.close();
    console.log('👋 Server closed');
  });
});
