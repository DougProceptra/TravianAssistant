// Simple AI Chat Handler - Vercel handles mem0, we just process with Claude
const fetch = require('node-fetch');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

async function handleAIChat(req, res) {
  try {
    const { userId, message, gameState, gameMechanics, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }
    
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }
    
    console.log(`🤖 Processing AI chat for user ${userId?.substring(0, 10) || 'unknown'}...`);
    
    // Build context from game state
    let contextParts = [];
    
    if (gameState) {
      contextParts.push('## Current Game State:');
      contextParts.push(`- Resources: ${JSON.stringify(gameState.resources || {})}`);
      contextParts.push(`- Production: ${JSON.stringify(gameState.production || {})}`);
      contextParts.push(`- Culture Points: ${gameState.culturePoints?.current || 0}/${gameState.culturePoints?.needed || 'unknown'}`);
      contextParts.push(`- Time to Settlement: ${gameState.culturePoints?.hoursRemaining || 'unknown'} hours`);
      contextParts.push(`- Population: ${gameState.population || 0}`);
      contextParts.push(`- Villages: ${gameState.villages?.length || 1}`);
      contextParts.push(`- Tribe: ${gameState.tribe || 'Unknown'}`);
      
      if (gameState.heroData) {
        contextParts.push(`- Hero Level: ${gameState.heroData.level || 'Unknown'}`);
        contextParts.push(`- Hero Production: ${JSON.stringify(gameState.heroData.resourceProduction || {})}`);
      }
    }
    
    if (gameMechanics?.tips) {
      contextParts.push('\n## Relevant Game Mechanics:');
      gameMechanics.tips.forEach(tip => {
        contextParts.push(`- ${tip}`);
      });
    }
    
    // Build system prompt
    const systemPrompt = `You are an expert Travian Legends strategic advisor.
    
${contextParts.join('\n')}

Provide strategic advice specific to Travian Legends gameplay.
Be concise but comprehensive in your recommendations.`;
    
    // Call Claude
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
        messages: [{ role: 'user', content: message }],
        system: systemPrompt,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return response in same format as Claude API
    res.json(data);
    
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    res.status(500).json({ 
      error: 'AI Chat failed', 
      message: error.message 
    });
  }
}

module.exports = { handleAIChat };
