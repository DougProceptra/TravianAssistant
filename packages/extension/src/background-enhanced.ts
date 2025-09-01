// Enhanced background script that uses the new prompt system
import { TRAVIAN_SYSTEM_PROMPT, buildAIPrompt } from './prompts/system-prompt';

console.log('[TLA Background] Service worker starting...');

// Vercel proxy endpoint
const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/anthropic';

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TLA Background] Received message:', request.type);
  
  if (request.type === 'CHAT_MESSAGE') {
    handleChatMessage(request.message, request.gameState)
      .then(response => sendResponse({ success: true, response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'SET_USER_EMAIL') {
    chrome.storage.sync.set({ userEmail: request.email })
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.type === 'GET_SETTINGS') {
    chrome.storage.sync.get([
      'serverUrl', 
      'serverSpeed', 
      'tribe', 
      'customPrompt',
      'userEmail',
      'allianceTag'
    ])
      .then(settings => sendResponse({ success: true, settings }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleChatMessage(userMessage, gameState) {
  try {
    // Get user's custom prompt if set
    const settings = await chrome.storage.sync.get(['customPrompt', 'serverSpeed', 'tribe']);
    
    // Enhance game state with settings
    if (settings.serverSpeed) {
      gameState.serverSpeed = settings.serverSpeed;
    }
    if (settings.tribe) {
      gameState.tribe = settings.tribe;
    }
    
    // Build the complete prompt with game context
    const contextPrompt = buildAIPrompt(gameState, userMessage, settings.customPrompt);
    
    // Prepare the API request
    const apiRequest = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      temperature: 0.7,
      system: TRAVIAN_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: contextPrompt
        }
      ]
    };
    
    console.log('[TLA Background] Sending to AI with game state:', {
      villages: gameState.villages?.length,
      currentVillage: gameState.currentVillageName,
      currentPage: gameState.currentPage?.type,
      hasResources: gameState.totals?.resources?.wood > 0
    });
    
    // Send to Vercel proxy
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TLA Background] API error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the response text
    if (data.content && data.content[0] && data.content[0].text) {
      const aiResponse = data.content[0].text;
      
      // Check if AI is asking for missing data
      if (aiResponse.includes('?') && gameState.totals?.resources?.wood === 0) {
        // AI is likely asking for data - this is good behavior
        console.log('[TLA Background] AI requesting missing data');
      }
      
      return aiResponse;
    } else {
      throw new Error('Invalid response format from AI');
    }
    
  } catch (error) {
    console.error('[TLA Background] Error handling chat message:', error);
    
    // Provide helpful fallback response
    if (error.message.includes('API error')) {
      return 'I\'m having trouble connecting to the AI service. Please check your connection and try again.';
    }
    
    // If data is missing, provide a helpful response
    if (!gameState.totals?.resources?.wood || gameState.totals.resources.wood === 0) {
      return `I can see you have ${gameState.villages?.length || 0} villages, but I need more information to give you specific advice. 

Could you tell me:
1. Your current resources (wood/clay/iron/crop)?
2. What buildings are under construction?
3. Your current goal (settling, troops, defense)?

This will help me provide targeted recommendations for your situation.`;
    }
    
    throw error;
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[TLA Background] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Create context menu for quick access to options
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'travian-assistant-options',
    title: 'TravianAssistant Options',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'travian-assistant-options') {
    chrome.runtime.openOptionsPage();
  }
});

console.log('[TLA Background] Service worker ready');
