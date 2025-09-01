// TravianAssistant Background Service Worker
// v1.1.0 - Fixed game state data pipeline

console.log('[TLA Background] Service worker starting v1.1.0...');

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
    console.log('[TLA Background] Analyzing game state...', gameState);
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
    console.log('[TLA Background] Game state received:', gameState);
    
    // Build a more intelligent prompt with actual game data
    const prompt = buildChatPrompt(message, gameState);
    
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
  // FIX: Use the actual SafeGameState structure
  const villages = gameState?.villages || [];
  const currentVillage = villages.find(v => v.id === gameState?.currentVillageId) || villages[0];
  const totals = gameState?.totals || {};
  const alerts = gameState?.alerts || [];
  
  let prompt = `You are an expert Travian Legends strategic advisor. The player is asking: "${message}"

Current Game State:
- Server: ${gameState?.serverUrl || 'unknown'}
- Villages: ${villages.length}
- Total Population: ${totals.population || 0}
- Current Village: ${currentVillage?.name || 'Unknown'} (${currentVillage?.id || '?'})
`;

  // Add current village details if available
  if (currentVillage) {
    prompt += `\nCurrent Village Details:
- Resources: Wood ${currentVillage.resources?.wood || 0}, Clay ${currentVillage.resources?.clay || 0}, Iron ${currentVillage.resources?.iron || 0}, Crop ${currentVillage.resources?.crop || 0}
- Production: Wood ${currentVillage.production?.wood || 0}/h, Clay ${currentVillage.production?.clay || 0}/h, Iron ${currentVillage.production?.iron || 0}/h, Crop ${currentVillage.production?.crop || 0}/h
`;
    
    if (currentVillage.storage) {
      prompt += `- Storage: Warehouse ${currentVillage.storage.warehouse}/${currentVillage.storage.warehouseCapacity}, Granary ${currentVillage.storage.granary}/${currentVillage.storage.granaryCapacity}\n`;
    }
    
    if (currentVillage.buildQueue && currentVillage.buildQueue.length > 0) {
      prompt += `- Building Queue: ${currentVillage.buildQueue.map(b => `${b.name} Level ${b.level}`).join(', ')}\n`;
    }
  }

  // Add totals
  if (totals.resources) {
    prompt += `\nAccount Totals:
- Total Resources: Wood ${totals.resources.wood}, Clay ${totals.resources.clay}, Iron ${totals.resources.iron}, Crop ${totals.resources.crop}
- Total Production: Wood ${totals.production?.wood || 0}/h, Clay ${totals.production?.clay || 0}/h, Iron ${totals.production?.iron || 0}/h, Crop ${totals.production?.crop || 0}/h
- Net Crop: ${totals.production?.cropNet || 0}/h
`;
  }
  
  // Add alerts if any
  if (alerts.length > 0) {
    prompt += `\nActive Alerts:\n`;
    alerts.forEach(alert => {
      prompt += `- [${alert.severity.toUpperCase()}] ${alert.villageName}: ${alert.message}\n`;
    });
  }
  
  // Add culture points if available
  if (gameState?.culturePoints) {
    prompt += `\nCulture Points: ${gameState.culturePoints.current} (${gameState.culturePoints.production}/day)\n`;
    if (gameState.culturePoints.nextSlot) {
      prompt += `Next Settlement Slot: ${gameState.culturePoints.nextSlot} CP\n`;
    }
  }

  prompt += `
Provide specific, actionable advice based on the actual game state above. Focus on:
1. Immediate actions they should take based on their current resources and production
2. Resource optimization specific to their situation
3. Strategic timing considerations for their next steps
4. Address any critical alerts first

Be concise but detailed. Use the actual numbers from their game state in your recommendations.`;

  return prompt;
}

console.log('[TLA Background] Service worker ready v1.1.0');