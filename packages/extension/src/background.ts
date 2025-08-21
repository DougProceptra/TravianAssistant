// packages/extension/src/background.ts
// v0.4.2 - Fixed background service initialization

import { backendSync } from './background/backend-sync';

console.log('[TLA BG] Background service starting... v0.4.2');

const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

class BackgroundService {
  private proxyUrl: string = PROXY_URL;
  private initialized: boolean = false;

  constructor() {
    console.log('[TLA BG] Constructing background service');
    this.initialize().catch(err => {
      console.error('[TLA BG] Failed to initialize:', err);
    });
  }

  private async initialize() {
    if (this.initialized) {
      console.log('[TLA BG] Already initialized');
      return;
    }

    // Check if proxy URL is configured
    try {
      const stored = await chrome.storage.sync.get(['proxyUrl']);
      if (stored.proxyUrl) {
        this.proxyUrl = stored.proxyUrl;
        console.log('[TLA BG] Using custom proxy URL');
      }
    } catch (err) {
      console.error('[TLA BG] Storage error:', err);
    }

    // Set up message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[TLA BG] Message received:', request.type);
      
      // Handle message async
      this.handleMessage(request)
        .then(response => {
          console.log('[TLA BG] Sending response:', response?.success ? 'success' : 'failed');
          sendResponse(response);
        })
        .catch(error => {
          console.error('[TLA BG] Handler error:', error);
          sendResponse({ success: false, error: error.message });
        });
      
      return true; // Keep channel open for async response
    });

    this.initialized = true;
    console.log('[TLA BG] Background service initialized successfully');
    console.log('[TLA BG] Proxy URL:', this.proxyUrl);
    
    // Test proxy connection
    this.testProxyConnection();
  }

  private async testProxyConnection() {
    try {
      console.log('[TLA BG] Testing proxy connection...');
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      
      if (response.ok) {
        console.log('[TLA BG] Proxy connection successful!');
      } else {
        console.error('[TLA BG] Proxy returned error:', response.status);
      }
    } catch (err) {
      console.error('[TLA BG] Proxy connection test failed:', err);
    }
  }

  private async handleMessage(request: any): Promise<any> {
    console.log('[TLA BG] Handling message type:', request.type);
    
    switch (request.type) {
      case 'PING':
        return { success: true, message: 'Background service is running' };

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
          console.log('[TLA BG] Analyzing game state...');
          const gameState = request.payload || request.state;
          
          // First sync to backend if available
          let syncResult = { success: false, alerts: [] };
          try {
            syncResult = await backendSync.syncGameState(gameState);
          } catch (err) {
            console.log('[TLA BG] Backend sync skipped:', err);
          }
          
          // Get AI analysis
          const analysis = await this.analyzeGame(gameState);
          
          return { 
            success: true, 
            ...analysis,
            alerts: syncResult.alerts || [],
            backendSync: syncResult.success
          };
        } catch (error: any) {
          console.error('[TLA BG] Analysis failed:', error);
          return { success: false, error: error.message };
        }

      case 'ASK_QUESTION':
        try {
          console.log('[TLA BG] Processing question...');
          const answer = await this.callProxy(request.question || request.prompt);
          return { success: true, answer };
        } catch (error: any) {
          console.error('[TLA BG] Question failed:', error);
          return { success: false, error: error.message };
        }

      default:
        console.log('[TLA BG] Unknown message type:', request.type);
        return { success: true, message: 'Unknown message type' };
    }
  }

  private async callProxy(prompt: string): Promise<string> {
    console.log('[TLA BG] Calling proxy with prompt length:', prompt.length);
    
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
        console.error('[TLA BG] Proxy error response:', errorText);
        throw new Error(`Proxy error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        console.log('[TLA BG] Got valid response from Claude');
        return data.content[0].text;
      } else {
        console.error('[TLA BG] Invalid response format:', data);
        throw new Error('Invalid response format from proxy');
      }
    } catch (error) {
      console.error('[TLA BG] Proxy call failed:', error);
      throw error;
    }
  }

  private async analyzeGame(state: any): Promise<any> {
    console.log('[TLA BG] Starting game analysis...');
    
    // Simplified state for logging
    const summary = {
      villages: state?.villages?.size || 0,
      currentVillageId: state?.currentVillageId,
      hasResources: !!state?.villages?.get?.(state?.currentVillageId)?.resources
    };
    console.log('[TLA BG] Game state summary:', summary);

    const prompt = `You are a Travian Legends expert. Analyze this game state and provide exactly 3 strategic recommendations.

Game State:
${JSON.stringify(state, null, 2).substring(0, 3000)}...

Provide specific, actionable recommendations based on the actual game data.

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
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[TLA BG] Successfully parsed AI recommendations');
        return parsed;
      }
      
      throw new Error('Could not parse AI response as JSON');
    } catch (error) {
      console.error('[TLA BG] Failed to get/parse AI analysis:', error);
      
      // Return fallback recommendations
      return {
        recommendations: [
          { 
            action: 'Build clay pit to level 5', 
            reason: 'Clay production is your bottleneck', 
            priority: 'high',
            village: state?.villages?.get?.(state?.currentVillageId)?.villageName || 'Main' 
          },
          {
            action: 'Train 10 defensive troops',
            reason: 'Increase village defense',
            priority: 'medium'
          },
          {
            action: 'Scout nearby inactive villages',
            reason: 'Find farming opportunities',
            priority: 'low'
          }
        ]
      };
    }
  }
}

// Initialize service
const bgService = new BackgroundService();

// Keep service alive
setInterval(() => {
  console.log('[TLA BG] Heartbeat - service alive');
}, 30000);

console.log('[TLA BG] Background script loaded');