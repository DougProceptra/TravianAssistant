#!/usr/bin/env node

/**
 * TravianAssistant Enhanced Backend Server with AI Integration
 * Provides game data, AI proxy, and real-time state management
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3002;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Initialize SQLite database
const DB_PATH = process.env.DB_PATH || './db/travian.db';
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('🚀 TravianAssistant Enhanced Backend Starting...');
console.log(`📁 Database: ${DB_PATH}`);
console.log(`🤖 AI Integration: ${process.env.ANTHROPIC_API_KEY ? 'Enabled' : 'Disabled (Set ANTHROPIC_API_KEY)'}`);

// Detect Replit environment
if (process.env.REPL_SLUG) {
  console.log(`🌐 Replit Environment Detected`);
  console.log(`   Public URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
}

// Enhanced database schema with game mechanics
function initializeDatabase() {
  console.log('📊 Initializing enhanced database schema...');
  
  db.exec(`
    -- Core game state tables
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

    -- User's village data with enhanced tracking
    CREATE TABLE IF NOT EXISTS user_villages (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      village_id TEXT NOT NULL,
      village_name TEXT,
      x INTEGER,
      y INTEGER,
      population INTEGER,
      resources TEXT,
      production TEXT,
      buildings TEXT,
      troops TEXT,
      cp_production INTEGER DEFAULT 0,
      hero_level INTEGER DEFAULT 0,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Settlement tracking for rapid settlement focus
    CREATE TABLE IF NOT EXISTS settlement_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      cp_current INTEGER DEFAULT 0,
      cp_production INTEGER DEFAULT 0,
      cp_needed INTEGER DEFAULT 500,
      settlers_count INTEGER DEFAULT 0,
      resources_hourly TEXT,
      estimated_settlement_time TIMESTAMP,
      phase TEXT DEFAULT 'FOUNDATION',
      limiting_factor TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Game mechanics data
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      max_level INTEGER,
      requirements TEXT,
      costs TEXT,
      benefits TEXT,
      cp_production TEXT,
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

    CREATE TABLE IF NOT EXISTS tribes (
      id TEXT PRIMARY KEY,
      name TEXT,
      bonus_description TEXT,
      unit_speed_modifier REAL DEFAULT 1.0,
      merchant_capacity INTEGER,
      special_building TEXT,
      wall_type TEXT
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      category TEXT,
      name TEXT,
      requirements TEXT,
      rewards TEXT,
      order_index INTEGER
    );

    CREATE TABLE IF NOT EXISTS hero_mechanics (
      id TEXT PRIMARY KEY,
      level INTEGER,
      experience_needed INTEGER,
      health_regeneration INTEGER,
      adventure_bonus REAL
    );

    -- AI conversation history
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      message_id TEXT UNIQUE,
      role TEXT,
      content TEXT,
      game_state TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Recommendations with reasoning
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      priority INTEGER,
      action_type TEXT,
      action_data TEXT,
      reasoning TEXT,
      completed BOOLEAN DEFAULT FALSE,
      result TEXT
    );
  `);
  
  console.log('✅ Enhanced database schema initialized');
  loadGameMechanics();
}

// Load comprehensive game mechanics data
function loadGameMechanics() {
  // Check if already loaded
  const tribesCount = db.prepare('SELECT COUNT(*) as count FROM tribes').get().count;
  if (tribesCount > 0) {
    console.log('✅ Game mechanics already loaded');
    return;
  }

  console.log('📥 Loading comprehensive game mechanics...');

  // Load tribes
  const tribes = [
    { id: 'romans', name: 'Romans', bonus: 'Simultaneous construction', speed: 1.0, merchant: 500, wall: 'City Wall' },
    { id: 'teutons', name: 'Teutons', bonus: '20% cranny bonus, cheaper troops', speed: 1.0, merchant: 1000, wall: 'Earth Wall' },
    { id: 'gauls', name: 'Gauls', bonus: 'Faster troops, better crannies', speed: 1.0, merchant: 750, wall: 'Palisade' },
    { id: 'egyptians', name: 'Egyptians', bonus: 'Waterworks +100% oasis bonus', speed: 1.0, merchant: 750, wall: 'Stone Wall' },
    { id: 'huns', name: 'Huns', bonus: 'Mounted armies, no need for stables', speed: 1.0, merchant: 500, wall: 'Makeshift Wall' },
    { id: 'spartans', name: 'Spartans', bonus: 'Stronger defense, hospital', speed: 1.0, merchant: 750, wall: 'Defensive Wall' }
  ];

  const tribeStmt = db.prepare(`
    INSERT OR REPLACE INTO tribes (id, name, bonus_description, unit_speed_modifier, merchant_capacity, wall_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const tribe of tribes) {
    tribeStmt.run(tribe.id, tribe.name, tribe.bonus, tribe.speed, tribe.merchant, tribe.wall);
  }

  // Load essential buildings with CP production
  const buildings = [
    { id: 'main_building', name: 'Main Building', category: 'infrastructure', maxLevel: 20, cpPerLevel: 5 },
    { id: 'embassy', name: 'Embassy', category: 'military', maxLevel: 20, cpPerLevel: 24 },
    { id: 'marketplace', name: 'Marketplace', category: 'economic', maxLevel: 20, cpPerLevel: 20 },
    { id: 'residence', name: 'Residence', category: 'expansion', maxLevel: 20, cpPerLevel: 2 },
    { id: 'palace', name: 'Palace', category: 'expansion', maxLevel: 20, cpPerLevel: 5 },
    { id: 'academy', name: 'Academy', category: 'military', maxLevel: 20, cpPerLevel: 14 },
    { id: 'townhall', name: 'Town Hall', category: 'infrastructure', maxLevel: 20, cpPerLevel: 14 },
    { id: 'cranny', name: 'Cranny', category: 'defensive', maxLevel: 10, cpPerLevel: 2 },
    { id: 'woodcutter', name: 'Woodcutter', category: 'resource', maxLevel: 20, cpPerLevel: 0 },
    { id: 'clay_pit', name: 'Clay Pit', category: 'resource', maxLevel: 20, cpPerLevel: 0 },
    { id: 'iron_mine', name: 'Iron Mine', category: 'resource', maxLevel: 20, cpPerLevel: 0 },
    { id: 'cropland', name: 'Cropland', category: 'resource', maxLevel: 20, cpPerLevel: 0 }
  ];

  const buildingStmt = db.prepare(`
    INSERT OR REPLACE INTO buildings (id, name, category, max_level, cp_production)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const building of buildings) {
    buildingStmt.run(building.id, building.name, building.category, building.maxLevel, building.cpPerLevel);
  }

  // Load quest system (simplified for early game)
  const quests = [
    { id: 'tutorial_1', category: 'tutorial', name: 'Build Woodcutter', rewards: '90 wood', order: 1 },
    { id: 'tutorial_2', category: 'tutorial', name: 'Build Clay Pit', rewards: '120 clay', order: 2 },
    { id: 'tutorial_3', category: 'tutorial', name: 'Build Iron Mine', rewards: '60 iron', order: 3 },
    { id: 'tutorial_4', category: 'tutorial', name: 'Build Cropland', rewards: '30 crop', order: 4 },
    { id: 'economy_1', category: 'economy', name: 'All resources to 1', rewards: '110 of each', order: 5 },
    { id: 'economy_2', category: 'economy', name: 'One resource to 2', rewards: '140 of that resource', order: 6 },
    { id: 'military_1', category: 'military', name: 'Build Barracks', rewards: '200 resources', order: 10 },
    { id: 'military_2', category: 'military', name: 'Train 2 troops', rewards: '300 resources', order: 11 }
  ];

  const questStmt = db.prepare(`
    INSERT OR REPLACE INTO quests (id, category, name, rewards, order_index)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const quest of quests) {
    questStmt.run(quest.id, quest.category, quest.name, quest.rewards, quest.order);
  }

  console.log(`✅ Loaded ${tribes.length} tribes, ${buildings.length} buildings, ${quests.length} quests`);
}

// AI Proxy endpoint - the critical piece for chat functionality
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, accountId, gameState } = req.body;
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ 
        error: 'AI service not configured. Set ANTHROPIC_API_KEY in environment.' 
      });
    }

    // Enhance messages with game context
    const enhancedMessages = await enhanceWithGameContext(messages, accountId, gameState);
    
    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: enhancedMessages,
        system: getSystemPrompt(gameState)
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error: 'AI service error' });
    }

    const data = await response.json();
    
    // Store conversation for learning
    if (accountId && messages.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO ai_conversations (account_id, message_id, role, content, game_state)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      stmt.run(accountId, messageId, 'user', messages[messages.length - 1].content, JSON.stringify(gameState));
      stmt.run(accountId, `${messageId}_response`, 'assistant', data.content[0].text, JSON.stringify(gameState));
    }

    res.json(data);
    
  } catch (error) {
    console.error('❌ AI chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive game state for AI context
async function enhanceWithGameContext(messages, accountId, currentGameState) {
  if (!accountId) return messages;

  // Get player's current village data
  const villages = db.prepare(`
    SELECT * FROM user_villages 
    WHERE account_id = ? 
    ORDER BY last_updated DESC
    LIMIT 1
  `).get(accountId);

  // Get settlement tracking
  const settlement = db.prepare(`
    SELECT * FROM settlement_tracking
    WHERE account_id = ?
    ORDER BY last_updated DESC
    LIMIT 1
  `).get(accountId);

  // Get game mechanics data
  const buildings = db.prepare('SELECT * FROM buildings WHERE cp_production > 0').all();
  const tribes = db.prepare('SELECT * FROM tribes').all();
  const quests = db.prepare('SELECT * FROM quests ORDER BY order_index LIMIT 10').all();

  // Build comprehensive context
  const context = {
    currentVillage: villages ? JSON.parse(villages.resources || '{}') : null,
    production: villages ? JSON.parse(villages.production || '{}') : null,
    settlementProgress: settlement,
    gameKnowledge: {
      cpBuildings: buildings.map(b => ({ name: b.name, cpPerLevel: b.cp_production })),
      tribes: tribes.map(t => ({ name: t.name, bonus: t.bonus_description })),
      nextQuests: quests
    },
    ...currentGameState
  };

  // Add context as first message if not already present
  const contextMessage = {
    role: 'user',
    content: `Current game state context: ${JSON.stringify(context, null, 2)}`
  };

  return [contextMessage, ...messages];
}

// System prompt for Travian AI assistant
function getSystemPrompt(gameState) {
  return `You are an expert Travian Legends strategic advisor focused on rapid settlement (achieving second village as quickly as possible).

Key Knowledge:
- Settlement requires 3 settlers (750 resources each) OR 2 settlers + 1 chief
- Culture Points (CP) needed: 500 for village #2, scales up for more villages
- CP generation from buildings: Embassy (24/day), Marketplace (20/day), Academy (14/day), Town Hall (14/day), Main Building (5/level), Residence/Palace (2-5/level)
- Egyptian bonus: Waterworks gives +100% oasis bonus (40 resources per animal level)
- Resource balance is critical - avoid overproducing one resource
- Quest rewards provide significant early boost
- Hero adventures crucial for resources and items

Current game phase: ${gameState?.phase || 'Unknown'}
Server day: ${gameState?.serverDay || 'Unknown'}

Provide specific, actionable advice focused on:
1. Immediate next actions (what to build/train NOW)
2. Resource optimization (NPC trades, production balance)
3. CP maximization strategy
4. Quest completion priorities
5. Hero usage (adventures, resource production)

Be concise but specific. Reference actual numbers when possible.`;
}

// Get real-time game state endpoint
app.get('/api/game-state/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Get latest village data
    const village = db.prepare(`
      SELECT * FROM user_villages 
      WHERE account_id = ? 
      ORDER BY last_updated DESC
      LIMIT 1
    `).get(accountId);

    // Get settlement tracking
    const settlement = db.prepare(`
      SELECT * FROM settlement_tracking
      WHERE account_id = ?
      ORDER BY last_updated DESC
      LIMIT 1
    `).get(accountId);

    // Calculate key metrics
    let metrics = {
      daysToSettle: 'Unknown',
      limitingFactor: 'Unknown',
      cpPerDay: 0,
      resourceBalance: 'Unknown'
    };

    if (village && settlement) {
      const resources = JSON.parse(village.resources || '{}');
      const production = JSON.parse(village.production || '{}');
      
      // Calculate days to settlement
      const cpNeeded = (settlement.cp_needed || 500) - (settlement.cp_current || 0);
      const cpPerDay = settlement.cp_production || 0;
      const daysForCP = cpPerDay > 0 ? Math.ceil(cpNeeded / cpPerDay) : 999;
      
      // Calculate settler training time (assuming resources available)
      const settlersNeeded = 3 - (settlement.settlers_count || 0);
      const daysForSettlers = settlersNeeded > 0 ? Math.ceil(settlersNeeded * 0.5) : 0; // Rough estimate
      
      metrics.daysToSettle = Math.max(daysForCP, daysForSettlers);
      metrics.limitingFactor = daysForCP > daysForSettlers ? 'Culture Points' : 'Settlers';
      metrics.cpPerDay = cpPerDay;
      
      // Check resource balance
      const avgProduction = (production.wood + production.clay + production.iron) / 3;
      const maxDeviation = Math.max(
        Math.abs(production.wood - avgProduction),
        Math.abs(production.clay - avgProduction),
        Math.abs(production.iron - avgProduction)
      );
      metrics.resourceBalance = maxDeviation < avgProduction * 0.2 ? 'Balanced' : 'Imbalanced';
    }

    res.json({
      accountId,
      village: village ? {
        ...village,
        resources: JSON.parse(village.resources || '{}'),
        production: JSON.parse(village.production || '{}'),
        buildings: JSON.parse(village.buildings || '[]')
      } : null,
      settlement,
      metrics,
      lastUpdated: village?.last_updated || null
    });
    
  } catch (error) {
    console.error('❌ Get game state error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update settlement tracking
app.post('/api/settlement/update', (req, res) => {
  try {
    const { accountId, cpCurrent, cpProduction, settlersCount, resourcesHourly, phase } = req.body;
    
    if (!accountId) {
      return res.status(400).json({ error: 'Missing accountId' });
    }

    // Calculate estimated settlement time
    const cpNeeded = 500; // For second village
    const cpRemaining = cpNeeded - (cpCurrent || 0);
    const daysToCP = cpProduction > 0 ? cpRemaining / cpProduction : 999;
    const estimatedTime = new Date(Date.now() + daysToCP * 24 * 60 * 60 * 1000);

    // Determine limiting factor
    let limitingFactor = 'Unknown';
    if (settlersCount >= 3) {
      limitingFactor = 'Culture Points';
    } else if (cpCurrent >= cpNeeded) {
      limitingFactor = 'Settlers';
    } else {
      limitingFactor = daysToCP < 3 ? 'Settlers' : 'Culture Points';
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settlement_tracking (
        account_id, cp_current, cp_production, cp_needed, settlers_count, 
        resources_hourly, estimated_settlement_time, phase, limiting_factor, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      accountId,
      cpCurrent || 0,
      cpProduction || 0,
      cpNeeded,
      settlersCount || 0,
      JSON.stringify(resourcesHourly || {}),
      estimatedTime.toISOString(),
      phase || 'FOUNDATION',
      limitingFactor
    );

    console.log(`✅ Updated settlement tracking for ${accountId}: Day ${Math.ceil(daysToCP)} estimate`);
    res.json({ 
      success: true, 
      estimatedDays: Math.ceil(daysToCP),
      limitingFactor 
    });
    
  } catch (error) {
    console.error('❌ Settlement update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Original endpoints preserved
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: db.open ? 'connected' : 'disconnected',
    ai: process.env.ANTHROPIC_API_KEY ? 'enabled' : 'disabled',
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  const stats = {
    villages: db.prepare('SELECT COUNT(*) as count FROM villages').get().count,
    userVillages: db.prepare('SELECT COUNT(*) as count FROM user_villages').get().count,
    buildings: db.prepare('SELECT COUNT(*) as count FROM buildings').get().count,
    tribes: db.prepare('SELECT COUNT(*) as count FROM tribes').get().count,
    conversations: db.prepare('SELECT COUNT(*) as count FROM ai_conversations').get().count
  };
  
  const backendUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : `http://localhost:${PORT}`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TravianAssistant AI Backend</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .status { background: #4CAF50; color: white; padding: 10px; border-radius: 5px; display: inline-block; }
        .ai-status { background: ${process.env.ANTHROPIC_API_KEY ? '#2196F3' : '#ff9800'}; color: white; padding: 10px; border-radius: 5px; display: inline-block; margin-left: 10px; }
        .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .endpoint { background: #f0f0f0; padding: 5px 10px; margin: 5px 0; border-radius: 3px; font-family: monospace; }
        .url-box { background: #e8f5e9; border: 2px solid #4CAF50; padding: 10px; border-radius: 5px; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>🏰 TravianAssistant AI-Enhanced Backend</h1>
      <div class="status">✅ Server Running</div>
      <div class="ai-status">${process.env.ANTHROPIC_API_KEY ? '🤖 AI Enabled' : '⚠️ AI Disabled (Set ANTHROPIC_API_KEY)'}</div>
      
      <div class="stats">
        <h2>📊 System Statistics</h2>
        <ul>
          <li>Villages in database: ${stats.villages}</li>
          <li>User villages tracked: ${stats.userVillages}</li>
          <li>Buildings loaded: ${stats.buildings}</li>
          <li>Tribes configured: ${stats.tribes}</li>
          <li>AI conversations: ${stats.conversations}</li>
        </ul>
      </div>
      
      <div class="stats">
        <h2>🔌 Core API Endpoints</h2>
        <div class="endpoint">POST /api/ai/chat - AI chat with game context</div>
        <div class="endpoint">GET /api/game-state/:accountId - Real-time game state</div>
        <div class="endpoint">POST /api/settlement/update - Update settlement tracking</div>
        <div class="endpoint">POST /api/village - Save scraped village data</div>
        <div class="endpoint">GET /api/game-data - Get game mechanics data</div>
      </div>
      
      <div class="stats">
        <h3>🎮 Extension Configuration</h3>
        <p>Backend URL for Chrome extension:</p>
        <div class="url-box">${backendUrl}</div>
        
        <h3>🤖 AI Features</h3>
        <ul>
          <li>Real-time game state analysis</li>
          <li>Settlement race optimization</li>
          <li>Multi-tribe support (all 6 tribes)</li>
          <li>Quest prioritization</li>
          <li>Hero strategy recommendations</li>
          <li>Resource balance monitoring</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Preserve original endpoints
app.post('/api/village', (req, res) => {
  try {
    const { accountId, village } = req.body;
    
    if (!accountId || !village) {
      return res.status(400).json({ error: 'Missing accountId or village data' });
    }
    
    const id = `${accountId}_${village.id || Date.now()}`;
    
    // Enhanced village save with CP calculation
    const buildings = JSON.parse(JSON.stringify(village.buildings || []));
    let cpProduction = 0;
    
    // Calculate CP from buildings
    const cpBuildings = {
      'Embassy': 24,
      'Marketplace': 20,
      'Academy': 14,
      'Town Hall': 14,
      'Main Building': 5,
      'Residence': 2,
      'Palace': 5
    };
    
    for (const building of buildings) {
      if (cpBuildings[building.name]) {
        cpProduction += cpBuildings[building.name] * (building.level || 1);
      }
    }
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_villages (
        id, account_id, village_id, village_name, x, y, population,
        resources, production, buildings, troops, cp_production, hero_level, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      id,
      accountId,
      village.id || 'unknown',
      village.name,
      village.coordinates?.x || 0,
      village.coordinates?.y || 0,
      village.population || 0,
      JSON.stringify(village.resources || {}),
      JSON.stringify(village.production || {}),
      JSON.stringify(buildings),
      JSON.stringify(village.troops || []),
      cpProduction,
      village.hero?.level || 0
    );
    
    // Auto-update settlement tracking
    if (cpProduction > 0) {
      db.prepare(`
        INSERT OR REPLACE INTO settlement_tracking (account_id, cp_production, last_updated)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(account_id) DO UPDATE SET cp_production = ?
      `).run(accountId, cpProduction, cpProduction);
    }
    
    console.log(`✅ Saved village data for ${village.name} (CP/day: ${cpProduction})`);
    res.json({ success: true, id, cpProduction });
    
  } catch (error) {
    console.error('❌ Village save error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/game-data', (req, res) => {
  try {
    const buildings = db.prepare('SELECT * FROM buildings').all();
    const troops = db.prepare('SELECT * FROM troops').all();
    const tribes = db.prepare('SELECT * FROM tribes').all();
    const quests = db.prepare('SELECT * FROM quests ORDER BY order_index').all();
    
    res.json({
      buildings,
      troops,
      tribes,
      quests,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Get game data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  
  if (process.env.REPL_SLUG) {
    console.log(`📱 Replit URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  }
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  Set ANTHROPIC_API_KEY environment variable to enable AI features');
  }
  
  initializeDatabase();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    db.close();
    console.log('👋 Server closed');
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    db.close();
    console.log('👋 Server closed');
  });
});
