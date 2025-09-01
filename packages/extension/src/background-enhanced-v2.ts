// Enhanced Background Script - Handles game context and AI integration
// Ensures scraped data is properly passed to AI with every request

console.log('[Background] Travian Assistant v1.1.0 - Service Worker starting...');

// Store for game context
let currentGameContext: any = null;
let lastContextUpdate = 0;

// Initialize service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed/updated');
  
  // Set default storage values
  chrome.storage.sync.get(['proxyUrl'], (result) => {
    if (!result.proxyUrl) {
      // Set default proxy URL
      chrome.storage.sync.set({
        proxyUrl: 'https://travian-proxy-simple.vercel.app',
        model: 'claude-sonnet-4-20250514'
      });
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Received message:', request.type);
  
  handleMessage(request, sender).then(sendResponse).catch(error => {
    console.error('[Background] Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  });
  
  return true; // Keep channel open for async response
});

async function handleMessage(request: any, sender: any) {
  switch (request.type) {
    case 'CONTENT_SCRIPT_READY':
      console.log('[Background] Content script ready:', request.version);
      return { success: true };
      
    case 'GAME_CONTEXT_UPDATE':
      // Store the latest game context
      currentGameContext = request.context;
      lastContextUpdate = Date.now();
      console.log('[Background] Game context updated:', {
        user: currentGameContext?.user,
        villages: currentGameContext?.allVillages?.length,
        resources: currentGameContext?.resources
      });
      
      // Store in chrome storage for persistence
      await chrome.storage.local.set({
        gameContext: currentGameContext,
        lastUpdate: lastContextUpdate
      });
      
      return { success: true };
      
    case 'CHAT_MESSAGE_WITH_CONTEXT':
      // Chat message that includes game context
      currentGameContext = request.gameContext;
      lastContextUpdate = request.timestamp;
      console.log('[Background] Received chat message with context');
      return { success: true };
      
    case 'GET_GAME_CONTEXT':
      // Return current game context
      if (!currentGameContext && sender.tab?.id) {
        // Try to get from content script
        try {
          const response = await chrome.tabs.sendMessage(sender.tab.id, {
            type: 'GET_GAME_STATE'
          });
          if (response?.context) {
            currentGameContext = response.context;
            lastContextUpdate = Date.now();
          }
        } catch (error) {
          console.error('[Background] Failed to get context from content script:', error);
        }
      }
      return { 
        success: true, 
        context: currentGameContext,
        lastUpdate: lastContextUpdate
      };
      
    case 'AI_CHAT_MESSAGE':
      // Process chat message with AI
      return await handleAIChatMessage(request.message, request.conversationHistory);
      
    case 'TEST_CONNECTION':
      // Test proxy connection
      return await testProxyConnection();
      
    case 'ERROR_REPORT':
      // Log errors from content script
      console.error('[Background] Error from content script:', request.error);
      return { success: true };
      
    default:
      console.log('[Background] Unknown message type:', request.type);
      return { success: false, error: 'Unknown message type' };
  }
}

async function handleAIChatMessage(message: string, conversationHistory?: any[]) {
  try {
    console.log('[Background] Processing AI chat message...');
    
    // Get stored settings
    const settings = await chrome.storage.sync.get(['proxyUrl', 'model', 'userEmail']);
    
    if (!settings.proxyUrl) {
      throw new Error('Proxy URL not configured');
    }
    
    // Prepare game context for AI
    let contextString = '';
    if (currentGameContext) {
      contextString = `
Current Game Context:
- User: ${currentGameContext.user || 'anonymous'}
- Current Village: ${currentGameContext.currentVillage?.name || 'Unknown'} (${currentGameContext.currentVillage?.coordinates?.x || 0}|${currentGameContext.currentVillage?.coordinates?.y || 0})
- Total Villages: ${currentGameContext.allVillages?.length || 1}
- Resources:
  - Wood: ${currentGameContext.resources?.wood || 0}
  - Clay: ${currentGameContext.resources?.clay || 0}
  - Iron: ${currentGameContext.resources?.iron || 0}
  - Crop: ${currentGameContext.resources?.crop || 0}
  - Free Crop: ${currentGameContext.resources?.freeCrop || 0}
- Production:
  - Wood/h: ${currentGameContext.resources?.production?.wood || 0}
  - Clay/h: ${currentGameContext.resources?.production?.clay || 0}
  - Iron/h: ${currentGameContext.resources?.production?.iron || 0}
  - Crop/h: ${currentGameContext.resources?.production?.crop || 0}
- Tribe: ${currentGameContext.tribe || 'Unknown'}
- Current Page: ${currentGameContext.currentPage || 'unknown'}

User Question: ${message}`;
    } else {
      contextString = `No game context available. User Question: ${message}`;
    }
    
    // Build messages array
    const messages = [];
    
    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }
    
    // Add current message with context
    messages.push({
      role: 'user',
      content: contextString
    });
    
    console.log('[Background] Sending to AI with context:', {
      hasContext: !!currentGameContext,
      messageLength: contextString.length,
      historyLength: conversationHistory?.length || 0
    });
    
    // Send to proxy
    const response = await fetch(`${settings.proxyUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        model: settings.model || 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.content) {
      throw new Error('Invalid response from AI');
    }
    
    console.log('[Background] AI response received successfully');
    
    return {
      success: true,
      response: data.content,
      context: currentGameContext
    };
    
  } catch (error: any) {
    console.error('[Background] Error processing AI message:', error);
    return {
      success: false,
      error: error.message || 'Failed to process AI message'
    };
  }
}

async function testProxyConnection() {
  try {
    const settings = await chrome.storage.sync.get(['proxyUrl']);
    
    if (!settings.proxyUrl) {
      throw new Error('Proxy URL not configured');
    }
    
    console.log('[Background] Testing proxy connection to:', settings.proxyUrl);
    
    const response = await fetch(`${settings.proxyUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Proxy health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Background] Proxy connection successful:', data);
    
    return {
      success: true,
      message: 'Proxy connection successful',
      data
    };
    
  } catch (error: any) {
    console.error('[Background] Proxy connection test failed:', error);
    return {
      success: false,
      error: error.message || 'Connection test failed'
    };
  }
}

// Periodic context refresh
setInterval(async () => {
  // Check if context is stale (older than 5 minutes)
  if (Date.now() - lastContextUpdate > 5 * 60 * 1000) {
    console.log('[Background] Context is stale, requesting refresh...');
    
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, { type: 'REFRESH_DATA' });
      } catch (error) {
        console.error('[Background] Failed to refresh context:', error);
      }
    }
  }
}, 60000); // Check every minute

// Export for debugging
(globalThis as any).TravianAssistantBG = {
  getContext: () => currentGameContext,
  testConnection: testProxyConnection,
  version: '1.1.0'
};

console.log('[Background] Service worker initialized');
