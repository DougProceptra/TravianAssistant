// AI Chat Handler with Mem0 Integration
// This module should be imported into server.js

const fetch = require('node-fetch');

// Mem0 configuration
const MEM0_API_KEY = process.env.MEM0_API_KEY || '';
const MEM0_API_URL = 'https://api.mem0.ai/v1';

// Anthropic configuration  
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

async function storeMemory(userId, memory, metadata = {}) {
  if (!MEM0_API_KEY) {
    console.log('⚠️ Mem0 API key not configured, skipping memory storage');
    return null;
  }
  
  try {
    const response = await fetch(`${MEM0_API_URL}/memories`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${MEM0_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: memory }],
        user_id: userId,
        metadata: {
          ...metadata,
          source: 'travian_assistant',
          timestamp: new Date().toISOString()
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Stored memory for user ${userId.substring(0, 10)}...`);
      return data;
    } else {
      console.error('❌ Mem0 storage failed:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Mem0 storage error:', error.message);
  }
  return null;
}

async function retrieveMemories(userId, query = null) {
  if (!MEM0_API_KEY) {
    console.log('⚠️ Mem0 API key not configured, skipping memory retrieval');
    return [];
  }
  
  try {
    let url = `${MEM0_API_URL}/memories?user_id=${userId}`;
    if (query) {
      url += `&search_query=${encodeURIComponent(query)}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${MEM0_API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Retrieved ${data.memories?.length || 0} memories for user ${userId.substring(0, 10)}...`);
      return data.memories || [];
    } else {
      console.error('❌ Mem0 retrieval failed:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Mem0 retrieval error:', error.message);
  }
  return [];
}

async function callClaude(messages, systemPrompt = null) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: messages,
      system: systemPrompt,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }
  
  return await response.json();
}

async function handleAIChat(req, res) {
  try {
    const { userId, message, gameState, gameMechanics, conversationId } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing userId or message' });
    }
    
    console.log(`🤖 Processing AI chat for user ${userId.substring(0, 10)}...`);
    
    // Step 1: Retrieve relevant memories from mem0
    const memories = await retrieveMemories(userId, message);
    
    // Step 2: Build context from memories and game state
    let contextParts = [];
    
    if (memories.length > 0) {
      contextParts.push('## Your Previous Context:');
      memories.forEach(mem => {
        contextParts.push(`- ${mem.memory}`);
      });
    }
    
    if (gameState) {
      contextParts.push('\n## Current Game State:');
      contextParts.push(`- Resources: ${JSON.stringify(gameState.resources || {})}`);
      contextParts.push(`- Production: ${JSON.stringify(gameState.production || {})}`);
      contextParts.push(`- Culture Points: ${gameState.culturePoints?.current || 0}/${gameState.culturePoints?.needed || 'unknown'}`);
      contextParts.push(`- Population: ${gameState.population || 0}`);
      contextParts.push(`- Villages: ${gameState.villages?.length || 1}`);
      contextParts.push(`- Tribe: ${gameState.tribe || 'Unknown'}`);
      
      if (gameState.heroData) {
        contextParts.push(`- Hero Level: ${gameState.heroData.level || 'Unknown'}`);
        contextParts.push(`- Hero Production: ${JSON.stringify(gameState.heroData.resourceProduction || {})}`);
      }
    }
    
    if (gameMechanics) {
      contextParts.push('\n## Relevant Game Mechanics:');
      if (gameMechanics.tips) {
        gameMechanics.tips.forEach(tip => {
          contextParts.push(`- ${tip}`);
        });
      }
    }
    
    // Step 3: Build system prompt
    const systemPrompt = `You are an expert Travian Legends strategic advisor with memory of past conversations.
    
${contextParts.join('\n')}

Remember key information from this conversation for future use.
Provide strategic advice specific to Travian Legends gameplay.
Be concise but comprehensive in your recommendations.`;
    
    // Step 4: Call Claude with context
    const claudeResponse = await callClaude(
      [{ role: 'user', content: message }],
      systemPrompt
    );
    
    // Step 5: Extract and store important information from conversation
    const responseText = claudeResponse.content[0]?.text || '';
    
    // Store user's question/statement if it contains preferences or important info
    if (message.match(/prefer|like|want|strategy|always|never|my|I am|I have/i)) {
      await storeMemory(userId, `User stated: ${message}`, {
        type: 'user_preference',
        conversationId
      });
    }
    
    // Store key strategic decisions or recommendations
    if (responseText.match(/recommend|suggest|should|priority|focus/i)) {
      const keyPoints = responseText.split('\n')
        .filter(line => line.match(/^[-•*]|^\d\./))
        .slice(0, 3)
        .join('; ');
      
      if (keyPoints) {
        await storeMemory(userId, `Strategic advice given: ${keyPoints}`, {
          type: 'strategy_recommendation',
          conversationId
        });
      }
    }
    
    // Step 6: Return response
    res.json({
      content: claudeResponse.content,
      model: claudeResponse.model,
      usage: claudeResponse.usage,
      mem0: {
        memories_retrieved: memories.length,
        memories_stored: true
      }
    });
    
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    res.status(500).json({ 
      error: 'AI Chat failed', 
      message: error.message 
    });
  }
}

module.exports = { handleAIChat, storeMemory, retrieveMemories };
