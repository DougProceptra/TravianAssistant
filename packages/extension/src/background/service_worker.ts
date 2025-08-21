// TravianAssistant Background Service Worker
// Handles API communication with Vercel proxy
// Version 0.5.1

const VERCEL_PROXY_URL = 'https://travian-proxy.vercel.app/api/anthropic';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('[TLA Background] Service worker installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TLA Background] Received message:', request.type);
  
  // Handle async responses properly
  (async () => {
    try {
      let response;
      
      switch (request.type) {
        case 'PING':
          response = { success: true, message: 'Background service alive' };
          break;
          
        case 'ANALYZE_GAME_STATE':
          response = await analyzeGameState(request.state);
          break;
          
        case 'CHAT_MESSAGE':
          response = await handleChatMessage(request.message, request.state);
          break;
          
        case 'ASK_QUESTION':
          response = await askClaude(request.question);
          break;
          
        default:
          response = { success: false, error: 'Unknown message type' };
      }
      
      sendResponse(response);
    } catch (error) {
      console.error('[TLA Background] Error handling message:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  })();
  
  // Keep channel open for async response
  return true;
});

// Analyze game state with Claude
async function analyzeGameState(gameState: any): Promise<any> {
  if (!gameState || !gameState.villages || gameState.villages.length === 0) {
    return { 
      success: false, 
      error: 'Invalid game state: no villages found' 
    };
  }
  
  const prompt = buildAnalysisPrompt(gameState);
  
  try {
    const response = await callClaudeAPI(prompt);
    return {
      success: true,
      recommendations: response,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[TLA Background] Analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}

// Handle chat messages
async function handleChatMessage(message: string, gameState: any): Promise<any> {
  const prompt = buildChatPrompt(message, gameState);
  
  try {
    const response = await callClaudeAPI(prompt);
    return {
      success: true,
      answer: response,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[TLA Background] Chat failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chat failed'
    };
  }
}

// Ask Claude a question
async function askClaude(question: string): Promise<any> {
  try {
    const response = await callClaudeAPI(question);
    return {
      success: true,
      answer: response,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[TLA Background] Question failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Question failed'
    };
  }
}

// Call Claude API through Vercel proxy with retry logic
async function callClaudeAPI(prompt: string, attempt = 1): Promise<string> {
  try {
    console.log(`[TLA Background] Calling Claude API (attempt ${attempt})`);
    
    const response = await fetch(VERCEL_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TLA Background] API error:', response.status, errorText);
      
      // Retry on 5xx errors
      if (response.status >= 500 && attempt < RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        return callClaudeAPI(prompt, attempt + 1);
      }
      
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('[TLA Background] Invalid API response:', data);
      throw new Error('Invalid API response format');
    }
    
    return data.content[0].text;
    
  } catch (error) {
    console.error('[TLA Background] Claude API call failed:', error);
    
    // Retry on network errors
    if (attempt < RETRY_ATTEMPTS && error instanceof TypeError) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      return callClaudeAPI(prompt, attempt + 1);
    }
    
    throw error;
  }
}

// Build analysis prompt for Claude
function buildAnalysisPrompt(gameState: any): string {
  const villageCount = gameState.villages?.length || 0;
  const alerts = gameState.alerts || [];
  const totals = gameState.totals || {};
  
  // Get first village details for context
  const firstVillage = gameState.villages?.[0] || {};
  
  return `You are an expert Travian Legends strategic advisor. Analyze this game state and provide specific, actionable recommendations.

GAME STATE:
- Server Day: ${gameState.serverDay || 'Unknown'}
- Villages: ${villageCount}
- Total Population: ${totals.population || 0}

RESOURCE TOTALS:
- Wood: ${totals.resources?.wood || 0} (+${totals.production?.wood || 0}/hr)
- Clay: ${totals.resources?.clay || 0} (+${totals.production?.clay || 0}/hr)
- Iron: ${totals.resources?.iron || 0} (+${totals.production?.iron || 0}/hr)
- Crop: ${totals.resources?.crop || 0} (+${totals.production?.crop || 0}/hr, Net: ${totals.production?.cropNet || 0}/hr)

${alerts.length > 0 ? `
ALERTS:
${alerts.map((a: any) => `- [${a.severity}] ${a.villageName}: ${a.message}`).join('\n')}
` : ''}

${firstVillage.buildQueue?.length > 0 ? `
CURRENT BUILD QUEUE:
${firstVillage.buildQueue.map((b: any) => `- ${b.name} to level ${b.level} (${b.timeLeft || 'calculating...'})`).join('\n')}
` : 'BUILD QUEUE: Empty'}

Provide your analysis in this format:

IMMEDIATE ACTIONS (next 1-2 hours):
1. [Specific action with village name if multiple villages]
2. [Another urgent action]
3. [Third priority if needed]

STRATEGIC FOCUS (next 24 hours):
- [Key strategic goal]
- [Resource management advice]
- [Military or expansion guidance]

ALERTS RESPONSE:
[How to address any critical alerts]

Keep recommendations specific and actionable. Include building names, resource amounts, and time estimates where possible.`;
}

// Build chat prompt for Claude
function buildChatPrompt(message: string, gameState: any): string {
  const villageCount = gameState?.villages?.length || 1;
  const totals = gameState?.totals || {};
  
  return `You are a Travian Legends expert assistant. Answer the player's question based on their game state.

CURRENT GAME STATE:
- Villages: ${villageCount}
- Population: ${totals.population || 0}
- Resource Production: +${totals.production?.wood || 0}/+${totals.production?.clay || 0}/+${totals.production?.iron || 0}/+${totals.production?.crop || 0} per hour
- Net Crop: ${totals.production?.cropNet || 0}/hr

PLAYER'S QUESTION: ${message}

Provide a concise, helpful answer. Include specific numbers and recommendations. Keep response under 200 words.`;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    analyzeGameState,
    handleChatMessage,
    askClaude
  };
}

console.log('[TLA Background] Service worker ready');
