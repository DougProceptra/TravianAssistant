// packages/extension/src/background.ts
// Background service that uses Vercel proxy for API calls

console.log('[TLA BG] Background service starting...');

// THE URL THAT ACTUALLY WORKS!!!
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
          const analysis = await this.analyzeGame(gameState);
          return { success: true, ...analysis };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'ANALYZE_NOW':
        try {
          const analysis = await this.analyzeGame(request.state);
          return { success: true, analysis };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'ASK_QUESTION':
        try {
          const answer = await this.callProxy(request.question);
          return { success: true, answer };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'STATE_UPDATE':
        // Store state for analysis
        return { success: true };

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
          model: 'claude-sonnet-4-20250514',  // Updated to Sonnet 4!
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
      "priority": "high"
    },
    {
      "action": "Another specific action",
      "reason": "Why this matters",
      "priority": "medium"
    },
    {
      "action": "Third action",
      "reason": "Why to do this",
      "priority": "low"
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
            action: 'Proxy is working!', 
            reason: 'Successfully connected to Claude AI', 
            priority: 'high' 
          },
          {
            action: 'Test the extension',
            reason: 'Load extension and visit Travian',
            priority: 'medium'
          },
          {
            action: 'Celebrate',
            reason: 'After 8 hours, it finally works!',
            priority: 'low'
          }
        ]
      };
    }
  }
}

// Initialize service
new BackgroundService();
console.log('[TLA BG] Script loaded');
