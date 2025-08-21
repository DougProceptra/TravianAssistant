// packages/extension/src/background.ts
// Background service with backend sync integration

import { backendSync } from './background/backend-sync';

console.log('[TLA BG] Background service starting...');

const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

class BackgroundService {
  private proxyUrl: string = PROXY_URL;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Check if proxy URL is configured
    const stored = await chrome.storage.sync.get(['proxyUrl']);
    if (stored.proxyUrl) {
      this.proxyUrl = stored.proxyUrl;
      console.log('[TLA BG] Using custom proxy URL');
    }

    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[TLA BG] Message:', request.type);
      
      this.handleMessage(request)
        .then(sendResponse)
        .catch(error => {
          console.error('[TLA BG] Error:', error);
          sendResponse({ success: false, error: error.message });
        });
      
      return true; // Keep channel open for async response
    });

    console.log('[TLA BG] Background service initialized');
    console.log('[TLA BG] Proxy URL:', this.proxyUrl);
  }

  private async handleMessage(request: any): Promise<any> {
    switch (request.type) {
      case 'SET_PROXY_URL':
        this.proxyUrl = request.url;
        await chrome.storage.sync.set({ proxyUrl: this.proxyUrl });
        return { success: true };

      case 'TEST_CONNECTION':
        try {
          const response = await this.callProxy('Test connection. Reply with "Connection successful".');
          return { success: true, response };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'ANALYZE_GAME_STATE':
        try {
          const gameState = request.payload || request.state;
          
          // First sync to backend
          const syncResult = await backendSync.syncGameState(gameState);
          
          // Then get AI analysis
          const analysis = await this.analyzeGame(gameState);
          
          // Combine alerts from backend and AI recommendations
          return { 
            success: true, 
            ...analysis,
            alerts: syncResult.alerts || [],
            backendSync: syncResult.success
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'ASK_QUESTION':
        try {
          // Get fresh context from backend
          const overview = await backendSync.getAccountOverview();
          const contextualPrompt = this.addBackendContext(request.question, overview);
          
          const answer = await this.callProxy(contextualPrompt);
          return { success: true, answer };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'SYNC_TO_BACKEND':
        try {
          const result = await backendSync.syncGameState(request.gameState);
          return result;
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'GET_ACCOUNT_OVERVIEW':
        try {
          const overview = await backendSync.getAccountOverview();
          return { success: true, data: overview };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'GET_VILLAGE_HISTORY':
        try {
          const history = await backendSync.getVillageHistory(
            request.villageId, 
            request.hours || 24
          );
          return { success: true, data: history };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'RESOLVE_ALERT':
        try {
          const resolved = await backendSync.resolveAlert(request.alertId);
          return { success: resolved };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      default:
        return { success: true };
    }
  }

  private async callProxy(prompt: string): Promise<string> {
    console.log('[TLA BG] Calling proxy at:', this.proxyUrl);
    
    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      console.log('[TLA BG] Proxy response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TLA BG] Proxy error:', errorText);
        throw new Error(`Proxy error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      } else {
        throw new Error('Invalid response format from proxy');
      }
    } catch (error) {
      console.error('[TLA BG] Proxy call failed:', error);
      throw error;
    }
  }

  private async analyzeGame(state: any): Promise<any> {
    const prompt = `You are a Travian Legends expert. Analyze this game state and provide exactly 3 strategic recommendations.

Game State:
${JSON.stringify(state, null, 2)}

Return ONLY a valid JSON object with this exact structure:
{
  "recommendations": [
    {
      "action": "Specific action to take",
      "reason": "Why this is important now",
      "priority": "critical",
      "village": "Village name if specific to one village"
    },
    {
      "action": "Another specific action",
      "reason": "Why this matters",
      "priority": "high"
    },
    {
      "action": "Third action",
      "reason": "Why to do this",
      "priority": "medium"
    }
  ]
}`;

    try {
      const response = await this.callProxy(prompt);
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse AI response');
    } catch (error) {
      console.error('[TLA BG] Failed to parse analysis:', error);
      return {
        recommendations: [
          { 
            action: 'Check your resource production', 
            reason: 'Ensure steady growth', 
            priority: 'high' 
          },
          {
            action: 'Review building queue',
            reason: 'Optimize construction order',
            priority: 'medium'
          },
          {
            action: 'Scout nearby villages',
            reason: 'Identify opportunities',
            priority: 'low'
          }
        ]
      };
    }
  }

  private addBackendContext(question: string, overview: any): string {
    if (!overview) {
      return question;
    }
    
    const context = `
CONTEXT FROM DATABASE:
- Villages: ${overview.villages?.length || 0}
- Total Population: ${overview.aggregates?.totalPopulation || 0}
- Total Production: Wood +${overview.aggregates?.totalProduction?.wood || 0}, Clay +${overview.aggregates?.totalProduction?.clay || 0}, Iron +${overview.aggregates?.totalProduction?.iron || 0}, Crop +${overview.aggregates?.totalProduction?.crop || 0}
- Active Alerts: ${overview.alerts?.length || 0}

`;
    
    return context + question;
  }
}

// Initialize service
new BackgroundService();
console.log('[TLA BG] Script loaded');