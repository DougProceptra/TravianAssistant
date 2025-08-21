// packages/extension/src/background/index.ts
// Background service with XMLHttpRequest to avoid CORS issues
console.log('[TLA BG] Background service starting...');

const API_KEY_STORAGE = 'apiKey';
const PROFILE_STORAGE = 'playerProfile';

class BackgroundService {
  private apiKey: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Load API key
    const stored = await chrome.storage.sync.get([API_KEY_STORAGE]);
    this.apiKey = stored[API_KEY_STORAGE] || null;
    
    if (this.apiKey) {
      console.log('[TLA BG] API key loaded');
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
      
      return true; // Keep channel open
    });

    console.log('[TLA BG] Background service initialized');
  }

  private async handleMessage(request: any): Promise<any> {
    switch (request.type) {
      case 'SET_API_KEY':
        this.apiKey = request.apiKey;
        await chrome.storage.sync.set({ [API_KEY_STORAGE]: this.apiKey });
        return { success: true };

      case 'TEST_CONNECTION':
      case 'ANALYZE_GAME_STATE':
        if (!this.apiKey) {
          return { success: false, error: 'No API key configured' };
        }
        try {
          const response = await this.callClaude('Test connection. Reply with "Connection successful".');
          return { success: true, response };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'ANALYZE_NOW':
        if (!this.apiKey) {
          return { success: false, error: 'No API key configured' };
        }
        try {
          const analysis = await this.analyzeGame(request.state);
          return { success: true, analysis };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'ASK_QUESTION':
        if (!this.apiKey) {
          return { success: false, error: 'No API key configured' };
        }
        try {
          const answer = await this.callClaude(request.question);
          return { success: true, answer };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      default:
        return { success: true };
    }
  }

  private callClaude(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('[TLA BG] Making API call with XMLHttpRequest');
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.anthropic.com/v1/messages');
      
      // Set headers
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('x-api-key', this.apiKey!);
      xhr.setRequestHeader('anthropic-version', '2023-06-01');
      
      xhr.onload = () => {
        console.log('[TLA BG] Response status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.content && data.content[0] && data.content[0].text) {
              resolve(data.content[0].text);
            } else {
              reject(new Error('Invalid response format'));
            }
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`API error: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network request failed'));
      };
      
      // Send request
      const body = JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      xhr.send(body);
    });
  }

  private async analyzeGame(state: any): Promise<any> {
    const prompt = `Analyze this Travian game state and provide 3 recommendations:
${JSON.stringify(state, null, 2)}

Return a JSON object with this structure:
{
  "recommendations": [
    {"action": "...", "reason": "...", "priority": "high|medium|low"}
  ]
}`;

    const response = await this.callClaude(prompt);
    try {
      const json = response.match(/\{[\s\S]*\}/);
      if (json) {
        return JSON.parse(json[0]);
      }
    } catch (e) {
      console.error('[TLA BG] Failed to parse analysis:', e);
    }
    
    return {
      recommendations: [
        { action: 'Check connection', reason: 'Failed to get analysis', priority: 'high' }
      ]
    };
  }
}

// Initialize
new BackgroundService();
console.log('[TLA BG] Script loaded');
