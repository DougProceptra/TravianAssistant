// packages/extension/src/background.ts
// Background Service Worker with AI Integration

interface ServiceWorkerState {
  version: string;
  startedAt: string;
  serverConfig?: {
    speed: number;
    url: string;
  };
  lastAnalysis?: any;
  apiKey?: string;
}

const MANIFEST = chrome.runtime.getManifest();
const state: ServiceWorkerState = {
  version: MANIFEST.version,
  startedAt: new Date().toISOString(),
};

// Load API key from storage
chrome.storage.local.get(['apiKey'], (result) => {
  if (result.apiKey) {
    state.apiKey = result.apiKey;
    console.log('[TLA SW] API key loaded');
  }
});

// Message handler for content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[TLA SW v${state.version}] Message:`, request.type);
  
  switch(request.type) {
    case 'GET_SW_INFO':
      sendResponse(state);
      break;
      
    case 'SET_API_KEY':
      state.apiKey = request.payload;
      chrome.storage.local.set({ apiKey: request.payload });
      sendResponse({ success: true });
      break;
      
    case 'ANALYZE_GAME_STATE':
      if (!state.apiKey) {
        sendResponse({ error: 'No API key configured' });
        return;
      }
      analyzeWithClaude(request.payload)
        .then(analysis => {
          state.lastAnalysis = analysis;
          sendResponse(analysis);
        })
        .catch(error => sendResponse({ error: error.message }));
      return true; // Will respond asynchronously
      
    case 'GET_LAST_ANALYSIS':
      sendResponse(state.lastAnalysis || { error: 'No analysis available' });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Claude API Integration
async function analyzeWithClaude(gameState: any): Promise<any> {
  if (!state.apiKey) throw new Error('No API key');
  
  // Get player profile from storage
  const { profile } = await chrome.storage.local.get('profile');
  const playerProfile = profile || {
    tribe: 'Egyptians',
    style: 'economic',
    goldUsage: 'aggressive',
    hoursPerDay: 1.5,
    primaryGoal: 'top_economy'
  };
  
  const prompt = buildPrompt(gameState, playerProfile);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Cheapest, fast
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return parseClaudeResponse(data);
  } catch (error) {
    console.error('[TLA] Claude API error:', error);
    throw error;
  }
}

function buildPrompt(gameState: any, profile: any): string {
  return `You are an expert Travian Legends player providing strategic advice.

PLAYER PROFILE:
- Tribe: ${profile.tribe}
- Style: ${profile.style}
- Gold usage: ${profile.goldUsage}
- Hours per day: ${profile.hoursPerDay}
- Goal: ${profile.primaryGoal}

CURRENT GAME STATE:
Page: ${gameState.page}
Resources: Wood ${gameState.resources?.data?.wood || '?'}, Clay ${gameState.resources?.data?.clay || '?'}, Iron ${gameState.resources?.data?.iron || '?'}, Crop ${gameState.resources?.data?.crop || '?'}
Storage: Warehouse ${gameState.resources?.data?.cap || '?'}, Granary ${gameState.resources?.data?.gran || '?'}
Build Queue: ${gameState.build?.data?.items?.length || 0} items

Provide the TOP 3 ACTIONS in this exact JSON format:
{
  "recommendations": [
    {
      "priority": 1,
      "action": "Specific action to take",
      "reason": "Why this is important now",
      "benefit": "Expected outcome",
      "urgency": "high/medium/low"
    }
  ],
  "warnings": ["Any critical issues"],
  "efficiency": "Current efficiency score 0-100"
}`;
}

function parseClaudeResponse(data: any): any {
  try {
    const content = data.content[0].text;
    // Try to parse as JSON first
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Fallback to text parsing
    return {
      recommendations: [{
        priority: 1,
        action: content.split('\n')[0],
        reason: 'See full response',
        benefit: 'Optimized play',
        urgency: 'medium'
      }],
      rawResponse: content
    };
  } catch (error) {
    console.error('[TLA] Failed to parse Claude response:', error);
    return {
      error: 'Failed to parse AI response',
      rawContent: data.content[0].text
    };
  }
}

console.log(`[TLA SW] Started v${state.version}`);
