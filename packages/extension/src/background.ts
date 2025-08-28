// TravianAssistant Background Service Worker
// v0.8.3 - FIXED CONNECTION

console.log('[TLA Background] Service worker starting v0.8.3...');

// The PROXY that actually works
const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

// Handle ALL message types
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TLA Background] Message received:', request.type);
  
  // Handle different message types
  switch(request.type) {
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
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

async function handleGameAnalysis(gameState, sendResponse) {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze this Travian game state: ${JSON.stringify(gameState)}`
        }]
      })
    });
    
    const data = await response.json();
    sendResponse({ 
      success: true, 
      analysis: data.content[0].text 
    });
  } catch (error) {
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

async function handleChatMessage(message, gameState, sendResponse) {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: message + '\n\nGame Context: ' + JSON.stringify(gameState)
        }]
      })
    });
    
    const data = await response.json();
    sendResponse({ 
      success: true, 
      response: data.content[0].text 
    });
  } catch (error) {
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

console.log('[TLA Background] Service worker ready v0.8.3');
