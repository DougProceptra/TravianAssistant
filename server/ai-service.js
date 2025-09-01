#!/usr/bin/env node

/**
 * TravianAssistant AI Service
 * Complete backend implementation with Claude API integration
 * 
 * Run with: node server/ai-service.js
 * 
 * This provides the AI chat endpoint for the Chrome extension
 * Server launches September 1, 2025 - let's get this working TODAY!
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3001;

// Enable CORS for Chrome extension
app.use(cors({
  origin: [
    'chrome-extension://*',
    'https://*.travian.com',
    'http://localhost:*',
    'https://travian-proxy-simple.vercel.app',
    'https://TravianAssistant.dougdostal.replit.dev'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Import the GameDataProvider from our local test
const GameDataProvider = require('../test-ai-agent-local.js').GameDataProvider || class GameDataProvider {
  constructor() {
    console.log('[AI Service] Loading game data...');
    this.troopData = this.loadJSON('../data/troops/travian_all_tribes_complete.json');
    this.buildingData = this.loadJSON('../data/buildings/travian_complete_buildings_data.json');
    
    if (this.troopData && this.buildingData) {
      console.log('[AI Service] ✓ Game data loaded successfully!');
    }
  }

  loadJSON(filePath) {
    try {
      const fullPath = path.join(__dirname, filePath);
      const data = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`[AI Service] Error loading ${filePath}: ${error.message}`);
      return null;
    }
  }
};

// Initialize data provider
const dataProvider = new GameDataProvider();

// Store conversation history per session
const conversations = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'TravianAssistant AI Service',
    port: PORT,
    dataLoaded: !!dataProvider.troopData && !!dataProvider.buildingData
  });
});

// Main AI chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, gameState, sessionId = 'default' } = req.body;
    
    console.log(`[AI Chat] Session: ${sessionId}, Message: ${message?.substring(0, 50)}...`);
    
    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId);
    
    // Build the prompt with game context
    const prompt = buildPrompt(message, gameState, history);
    
    // Call Claude API via Vercel proxy
    const response = await callClaude(prompt, gameState);
    
    // Store in history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });
    
    // Keep only last 10 exchanges
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    res.json({
      success: true,
      response: response,
      sessionId: sessionId,
      gameContext: {
        tribe: gameState?.tribe || 'Unknown',
        serverDay: gameState?.serverDay || 1,
        villages: gameState?.villages?.length || 1
      }
    });
    
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat request'
    });
  }
});

// Build comprehensive prompt with game context
function buildPrompt(message, gameState, history) {
  let prompt = `You are an expert Travian Legends strategic advisor with access to complete game mechanics data.

CURRENT GAME STATE:
- Tribe: ${gameState?.tribe || 'Unknown'}
- Server Day: ${gameState?.serverDay || 1}
- Server Speed: ${gameState?.serverSpeed || '1x'}
- Villages: ${gameState?.villages?.length || 1}
`;

  // Add village details
  if (gameState?.villages && gameState.villages[0]) {
    const village = gameState.villages[0];
    prompt += `
MAIN VILLAGE:
- Resources: ${village.resources?.wood || 0}/${village.resources?.clay || 0}/${village.resources?.iron || 0}/${village.resources?.crop || 0}
- Production: ${village.production?.wood || 0}/${village.production?.clay || 0}/${village.production?.iron || 0}/${village.production?.crop || 0} per hour
- Population: ${village.population || 0}
`;
    
    if (village.buildings) {
      prompt += `- Buildings: ${Object.entries(village.buildings).map(([b, l]) => `${b}(${l})`).join(', ')}\n`;
    }
  }

  // Add recent conversation context
  if (history.length > 0) {
    prompt += '\nRECENT CONVERSATION:\n';
    history.slice(-4).forEach(msg => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });
  }

  prompt += `
USER QUESTION: ${message}

Provide strategic advice based on the game state. Be specific with numbers and timings. Consider:
1. Current resources and production rates
2. Optimal build order for their game phase
3. Specific timing recommendations
4. Resource management priorities
5. Settlement timing if applicable

Keep response concise but actionable.`;

  return prompt;
}

// Call Claude via Vercel proxy
async function callClaude(prompt, gameState) {
  try {
    // Use Vercel proxy endpoint
    const proxyUrl = process.env.CLAUDE_PROXY_URL || 'https://travian-proxy-simple.vercel.app/api/proxy';
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: 'You are an expert Travian Legends advisor. Provide specific, actionable advice based on game mechanics.'
      })
    });

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}`);
    }

    const data = await response.json();
    
    if (data.content && data.content[0]) {
      return data.content[0].text;
    }
    
    // Fallback to calculation-based response if API fails
    return getFallbackResponse(gameState);
    
  } catch (error) {
    console.error('[Claude API] Error:', error);
    return getFallbackResponse(gameState);
  }
}

// Provide calculation-based fallback response
function getFallbackResponse(gameState) {
  if (!gameState) {
    return "I need your current game state to provide recommendations. Please make sure the extension is collecting your game data.";
  }
  
  const village = gameState.villages?.[0];
  if (!village) {
    return "Unable to analyze - no village data available.";
  }
  
  // Basic recommendations based on game phase
  const day = gameState.serverDay || 1;
  
  if (day <= 3) {
    return `Early Game (Day ${day}) Priorities:
1. Focus on resource fields to level 2-3
2. Complete all resource production quests
3. Build Cranny to protect resources
4. Save gold for day 3+ NPC trading
5. Current production: ${village.production?.wood + village.production?.clay + village.production?.iron + village.production?.crop || 0}/hour total`;
  }
  
  if (day <= 7) {
    return `Settlement Phase (Day ${day}) Priorities:
1. Push Residence to level 10 (current: ${village.buildings?.residence ||