#!/usr/bin/env node

/**
 * TravianAssistant V3 - Backend Server
 * Provides AI chat, game analysis, and data management
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const cron = require('node-cron');
const path = require('path');
const MapImporter = require('./import-map');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, '..', 'travian.db');

// Database connection
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Middleware
app.use(cors({
  origin: ['chrome-extension://*', 'http://localhost:*', 'https://*.travian.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length) {
    console.log('Body preview:', JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

// ==================== CHAT ENDPOINT (FIX FOR EXTENSION) ====================
app.post('/api/chat', async (req, res) => {
  console.log('🤖 Chat request received');
  
  try {
    const { message, email, gameState, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Store user message
    const storeMsg = db.prepare(`
      INSERT INTO chat_history (role, content, game_state, session_id)
      VALUES (?, ?, ?, ?)
    `);
    
    storeMsg.run('user', message, JSON.stringify(gameState || {}), sessionId || 'default');
    
    // Get conversation history
    const history = db.prepare(`
      SELECT role, content FROM chat_history 
      WHERE session_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 20
    `).all(sessionId || 'default').reverse();
    
    // Build context for Claude
    const systemPrompt = buildSystemPrompt(gameState);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];
    
    // Call Claude via proxy
    console.log('📡 Calling Anthropic API...');
    const response = await fetch('https://travian-proxy-simple.vercel.app/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: messages.slice(-10), // Keep context manageable
        temperature: 0.7,
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Anthropic API error:', error);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text || 'I apologize, but I couldn\'t generate a response.';
    
    // Store AI response
    storeMsg.run('assistant', aiResponse, JSON.stringify(gameState || {}), sessionId || 'default');
    
    // Generate recommendations if needed
    const recommendations = analyzeGameState(gameState);
    
    res.json({
      response: aiResponse,
      recommendations: recommendations,
      sessionId: sessionId || 'default'
    });
    
    console.log('✅ Chat response sent');
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error.message 
    });
  }
});

// ==================== GAME STATE ANALYSIS ====================
app.post('/api/analyze', (req, res) => {
  console.log('🎮 Analyzing game state');
  
  try {
    const { gameState } = req.body;
    
    // Store snapshot
    const stmt = db.prepare(`
      INSERT INTO player_snapshots (villages, resources, troops, buildings, research, hero, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      JSON.stringify(gameState.villages || []),
      JSON.stringify(gameState.resources || {}),
      JSON.stringify(gameState.troops || {}),
      JSON.stringify(gameState.buildings || {}),
      JSON.stringify(gameState.research || {}),
      JSON.stringify(gameState.hero || {}),
      JSON.stringify(gameState)
    );
    
    // Generate recommendations
    const recommendations = analyzeGameState(gameState);
    
    // Store recommendations
    const recStmt = db.prepare(`
      INSERT INTO recommendations (priority, action_type, action_data, reasoning)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const rec of recommendations) {
      recStmt.run(rec.priority, rec.type, JSON.stringify(rec.data), rec.reasoning);
    }
    
    res.json({
      success: true,
      recommendations: recommendations,
      metrics: calculateMetrics(gameState)
    });
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

// ==================== MAP SYNC ENDPOINT ====================
app.post('/api/sync-map', async (req, res) => {
  console.log('🗺️ Map sync requested');
  
  try {
    const importer = new MapImporter();
    await importer.run();
    
    res.json({ 
      success: true, 
      message: 'Map data synced successfully',
      stats: await importer.getStats()
    });
  } catch (error) {
    console.error('❌ Map sync error:', error);
    res.status(500).json({ error: 'Map sync failed', details: error.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM villages) as villages,
      (SELECT COUNT(*) FROM recommendations WHERE completed = 0) as pending_recommendations,
      (SELECT COUNT(*) FROM chat_history WHERE date(timestamp) = date('now')) as chats_today
  `).get();
  
  res.json({
    status: 'healthy',
    version: '3.0.0',
    database: 'connected',
    stats
  });
});

// ==================== HELPER FUNCTIONS ====================
function buildSystemPrompt(gameState) {
  const villages = gameState?.villages || [];
  const resources = gameState?.resources || {};
  
  return `You are an expert Travian Legends strategist assistant. You're helping a player who:
- Has ${villages.length} villages
- Is playing Egyptians tribe
- Current resources: Wood ${resources.wood || 0}, Clay ${resources.clay || 0}, Iron ${resources.iron || 0}, Crop ${resources.crop || 0}

Provide strategic advice focused on:
1. Optimal resource field development
2. Building priorities for growth
3. Troop composition recommendations
4. Settlement timing and location
5. Alliance coordination strategies

Be specific, actionable, and consider the current game state. Reference actual game mechanics and provide calculations when helpful.`;
}

function analyzeGameState(gameState) {
  const recommendations = [];
  
  if (!gameState) {
    return recommendations;
  }
  
  // Check resource balance
  const resources = gameState.resources || {};
  const totalResources = (resources.wood || 0) + (resources.clay || 0) + 
                         (resources.iron || 0) + (resources.crop || 0);
  
  if (totalResources < 1000) {
    recommendations.push({
      priority: 1,
      type: 'RESOURCE_FOCUS',
      data: { focus: 'fields' },
      reasoning: 'Low total resources - focus on resource field development'
    });
  }
  
  // Check for building queue
  if (!gameState.buildingQueue || gameState.buildingQueue.length === 0) {
    recommendations.push({
      priority: 2,
      type: 'BUILD_QUEUE_EMPTY',
      data: { suggestion: 'Start a building' },
      reasoning: 'Building queue is empty - losing valuable time'
    });
  }
  
  // Check village count vs server age
  const villages = gameState.villages || [];
  if (villages.length < 2 && gameState.serverAge > 7) {
    recommendations.push({
      priority: 1,
      type: 'SETTLEMENT_NEEDED',
      data: { target: 'second_village' },
      reasoning: 'Server is over 7 days old but only 1 village - need to expand'
    });
  }
  
  return recommendations;
}

function calculateMetrics(gameState) {
  return {
    resourceProduction: calculateResourceProduction(gameState),
    populationTotal: calculatePopulation(gameState),
    militaryStrength: calculateMilitaryStrength(gameState)
  };
}

function calculateResourceProduction(gameState) {
  // Simplified calculation - would be more complex in production
  return {
    wood: 100,
    clay: 100,
    iron: 100,
    crop: 100
  };
}

function calculatePopulation(gameState) {
  return (gameState.villages || []).reduce((sum, v) => sum + (v.population || 0), 0);
}

function calculateMilitaryStrength(gameState) {
  const troops = gameState.troops || {};
  return Object.values(troops).reduce((sum, count) => sum + count, 0);
}

// ==================== SCHEDULED TASKS ====================
// Schedule map sync for 6am ET daily
cron.schedule('0 6 * * *', async () => {
  console.log('⏰ Running scheduled map sync...');
  try {
    const importer = new MapImporter();
    await importer.run();
  } catch (error) {
    console.error('❌ Scheduled map sync failed:', error);
  }
}, {
  timezone: 'America/New_York'
});

// ==================== SERVER STARTUP ====================
app.listen(PORT, () => {
  console.log('🚀 TravianAssistant V3 Backend Server');
  console.log('=====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🗄️ Database: ${DB_PATH}`);
  console.log(`⏰ Map sync scheduled: 6am ET daily`);
  console.log('\n📍 Endpoints:');
  console.log(`   POST ${PORT}/api/chat - AI chat interaction`);
  console.log(`   POST ${PORT}/api/analyze - Game state analysis`);
  console.log(`   POST ${PORT}/api/sync-map - Manual map sync`);
  console.log(`   GET  ${PORT}/health - Server health check`);
  console.log('\n✅ Ready to assist with Travian strategy!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  db.close();
  process.exit(0);
});
