// TravianAssistant Background Service Worker
// v0.8.5 - Added SYNC_GAME_STATE handler

console.log('[TLA Background] Service worker starting v0.8.5...');

// The PROXY that actually works
const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

// Handle ALL message types
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TLA Background] Message received:', request.type);
  
  // Handle different message types
  switch(request.type) {
    case 'PING':
      sendResponse({ success: true, message: 'Background service is alive!' });
      return true;
      
    case 'SYNC_GAME_STATE':
      // Store game state for later use
      if (request.gameState) {
        chrome.storage.local.set({ lastGameState: request.gameState }, () => {
          sendResponse({ success: true, message: 'Game state synced' });
        });
      } else {
        sendResponse({ success: false, error: 'No game state provided' });
      }
      return true;
      
    case 'ANALYZE_GAME_STATE':
      handleGameAnalysis(request.gameState, sendResponse);
      return true; // CRITICAL: Keep channel open for async
      
    case 'CHAT_MESSAGE':
      handleChatMessage(request.message, request.gameState, sendResponse);
      return true; // CRITICAL: Keep channel open for async
      
    case 'SET_USER_EMAIL':
      chrome.storage.sync.set({ userEmail: request.email }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    default:
      console.log('[TLA Background] Unknown message type:', request.type);
      sendResponse({ success: false, error: 'Unknown message type: ' + request.type });
      return false;
  }
});

async function handleGameAnalysis(gameState, sendResponse) {
  try {
    console.log('[TLA Background] Analyzing game state...');
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze this Travian game state and provide strategic recommendations: ${JSON.stringify(gameState)}`
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    if (data.content && data.content[0] && data.content[0].text) {
      sendResponse({ 
        success: true, 
        analysis: data.content[0].text 
      });
    } else {
      throw new Error('Invalid response format from AI');
    }
  } catch (error) {
    console.error('[TLA Background] Analysis error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

async function handleChatMessage(message, gameState, sendResponse) {
  try {
    console.log('[TLA Background] Processing chat message...');
    
    // Build a more intelligent prompt
    const prompt = buildChatPrompt(message, gameState);
    
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    if (data.content && data.content[0] && data.content[0].text) {
      sendResponse({ 
        success: true, 
        response: data.content[0].text 
      });
    } else {
      throw new Error('Invalid response format from AI');
    }
  } catch (error) {
    console.error('[TLA Background] Chat error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

function buildChatPrompt(message, gameState) {
  // Extract key information from game state
  const villages = gameState?.villages || [];
  const totalPop = villages.reduce((sum, v) => sum + (v.population || 0), 0);
  const resources = gameState?.resources || {};
  
  let prompt = `You are an expert Travian Legends strategic advisor. The player is asking: "${message}"

Current Game State:
- Villages: ${villages.length}
- Total Population: ${totalPop}
- Largest Village: ${Math.max(...villages.map(v => v.population || 0))} pop
`;

  // Add resource information if available
  if (resources.wood !== undefined) {
    prompt += `- Resources: Wood ${resources.wood}, Clay ${resources.clay}, Iron ${resources.iron}, Crop ${resources.crop}
- Storage: ${resources.warehouseCapacity || 'unknown'}
- Production: Wood ${resources.woodProduction}/h, Clay ${resources.clayProduction}/h, Iron ${resources.ironProduction}/h, Crop ${resources.cropProduction}/h
`;
  }

  prompt += `
Provide specific, actionable advice. Focus on:
1. Immediate actions they should take
2. Resource optimization
3. Strategic timing considerations
4. Common mistakes to avoid

Be concise but detailed. Use numbers and specific recommendations where possible.`;

  return prompt;
}

console.log('[TLA Background] Service worker ready v0.8.5');