// packages/extension/src/background/index.ts
import { GameState, PlayerProfile, Analysis, ChromeMessage } from '../lib/types';

class BackgroundService {
  private apiKey: string | null = null;
  private playerProfile: PlayerProfile | null = null;
  private lastState: GameState | null = null;
  private aiModel: string = 'claude-3-5-sonnet-20241022';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Load stored API key and profile
    const stored = await chrome.storage.sync.get(['apiKey', 'playerProfile', 'aiModel']);
    this.apiKey = stored.apiKey || null;
    this.playerProfile = stored.playerProfile || this.getDefaultProfile();
    this.aiModel = stored.aiModel || 'claude-3-5-sonnet-20241022';
    
    if (this.apiKey) {
      console.log('[TLA SW] API key loaded');
    }

    // Set up message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender)
        .then(sendResponse)
        .catch(error => {
          console.error('[TLA SW] Error handling message:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep channel open for async response
    });

    console.log('[TLA SW] Background service initialized');
  }

  private async handleMessage(request: ChromeMessage, sender: chrome.runtime.MessageSender): Promise<any> {
    console.log('[TLA SW] Message:', request.type);

    switch (request.type) {
      case 'SET_API_KEY':
        this.apiKey = request.apiKey;
        await chrome.storage.sync.set({ apiKey: this.apiKey });
        return { success: true };

      case 'UPDATE_PROFILE':
        this.playerProfile = request.profile;
        await chrome.storage.sync.set({ playerProfile: this.playerProfile });
        return { success: true };

      case 'STATE_UPDATE':
        this.lastState = request.state;
        // Auto-analyze if we have an API key
        if (this.apiKey && request.autoAnalyze !== false) {
          try {
            const analysis = await this.analyzeGameState(request.state);
            return { success: true, analysis };
          } catch (error) {
            console.error('[TLA SW] Analysis error:', error);
            return { success: false, error: error.message };
          }
        }
        return { success: true };

      case 'ANALYZE_NOW':
      case 'ANALYZE_GAME_STATE':
        if (!this.apiKey) {
          return { success: false, error: 'No API key configured' };
        }
        if (!this.lastState && !request.state) {
          // Request state from content script
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]) {
            const response = await chrome.tabs.sendMessage(tabs[0].id!, { type: 'COLLECT_STATE' });
            if (response.success) {
              this.lastState = response.state;
            }
          }
        }
        const stateToAnalyze = request.state || this.lastState;
        if (!stateToAnalyze) {
          return { success: false, error: 'No game state available' };
        }
        try {
          const analysis = await this.analyzeGameState(stateToAnalyze);
          return { success: true, analysis };
        } catch (error) {
          console.error('[TLA SW] Analysis error:', error);
          return { success: false, error: error.message };
        }

      case 'ASK_QUESTION':
        if (!this.apiKey) {
          return { success: false, error: 'No API key configured' };
        }
        try {
          const answer = await this.askClaude(request.question);
          return { success: true, answer };
        } catch (error) {
          console.error('[TLA SW] Chat error:', error);
          return { success: false, error: error.message };
        }

      case 'TEST_CONNECTION':
        if (!this.apiKey) {
          return { success: false, error: 'No API key configured' };
        }
        try {
          await this.testConnection();
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }

      default:
        return { success: false, error: 'Unknown message type' };
    }
  }

  private async analyzeGameState(gameState: GameState): Promise<Analysis> {
    if (!this.apiKey) {
      throw new Error('No API key configured');
    }

    const profile = this.playerProfile || this.getDefaultProfile();
    const prompt = this.buildAnalysisPrompt(gameState, profile);

    try {
      // Use the Chrome extension fetch API properly
      const response = await this.makeAnthropicRequest(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('[TLA SW] Claude API error:', error);
      throw error;
    }
  }

  private async askClaude(question: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No API key configured');
    }

    const profile = this.playerProfile || this.getDefaultProfile();
    const state = this.lastState;
    const prompt = this.buildChatPrompt(question, state, profile);

    try {
      const response = await this.makeAnthropicRequest(prompt);
      return response;
    } catch (error) {
      console.error('[TLA SW] Claude chat error:', error);
      throw error;
    }
  }

  private async makeAnthropicRequest(prompt: string): Promise<string> {
    // Use XMLHttpRequest instead of fetch to avoid CORS issues in service worker
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.anthropic.com/v1/messages');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('x-api-key', this.apiKey!);
      xhr.setRequestHeader('anthropic-version', '2023-06-01');

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.content && data.content[0] && data.content[0].text) {
              resolve(data.content[0].text);
            } else {
              reject(new Error('Invalid response format'));
            }
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`API error: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error'));
      };

      const body = JSON.stringify({
        model: this.aiModel,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7
      });

      xhr.send(body);
    });
  }

  private async testConnection(): Promise<void> {
    const testPrompt = "Respond with 'Connection successful' if you receive this message.";
    const response = await this.makeAnthropicRequest(testPrompt);
    if (!response.toLowerCase().includes('connection successful')) {
      throw new Error('Unexpected response from API');
    }
  }

  private buildAnalysisPrompt(state: GameState, profile: PlayerProfile): string {
    return `You are an expert Travian Legends player providing strategic analysis.

PLAYER PROFILE:
- Tribe: ${profile.tribe}
- Play Style: ${profile.style}
- Gold Usage: ${profile.goldUsage}
- Daily Activity: ${profile.hoursPerDay} hours
- Primary Goal: ${profile.primaryGoal}

CURRENT GAME STATE:
Server: ${state.server.name}
Page: ${state.page}
Villages: ${state.villages.length}

Resources:
- Wood: ${state.resources.wood} / ${state.resources.warehouseCapacity}
- Clay: ${state.resources.clay} / ${state.resources.warehouseCapacity}
- Iron: ${state.resources.iron} / ${state.resources.warehouseCapacity}
- Crop: ${state.resources.crop} / ${state.resources.granaryCapacity}
- Free Crop: ${state.resources.freeCrop}

Provide exactly 3 actionable recommendations. Return ONLY a JSON object:
{
  "recommendations": [
    {
      "action": "Specific action to take",
      "reason": "Why this is important now",
      "expectedBenefit": "What this achieves",
      "timeRequired": "How long it takes",
      "priority": "high|medium|low"
    }
  ],
  "warnings": ["Any urgent issues"],
  "strategicNotes": "Brief observation"
}`;
  }

  private buildChatPrompt(question: string, state: GameState | null, profile: PlayerProfile): string {
    const context = state ? `
Current context:
- Villages: ${state.villages.length}
- Resources: W:${state.resources.wood} C:${state.resources.clay} I:${state.resources.iron} Cr:${state.resources.crop}
- Page: ${state.page}
` : 'No current game state available.';

    return `You are a Travian Legends expert assistant.
Player: ${profile.tribe} ${profile.style} player
${context}
Question: ${question}

Provide a concise, helpful answer.`;
  }

  private parseAnalysisResponse(text: string): Analysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          recommendations: parsed.recommendations || [],
          warnings: parsed.warnings || [],
          strategicNotes: parsed.strategicNotes || '',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('[TLA SW] Failed to parse response:', error);
    }

    // Fallback
    return {
      recommendations: [{
        action: 'Check game state',
        reason: 'Failed to get AI analysis',
        expectedBenefit: 'Manual review needed',
        timeRequired: 'Unknown',
        priority: 'medium'
      }],
      warnings: [],
      strategicNotes: text,
      timestamp: Date.now()
    };
  }

  private getDefaultProfile(): PlayerProfile {
    return {
      id: 'default',
      name: 'Default Profile',
      tribe: 'Egyptians',
      style: 'balanced',
      goldUsage: 'moderate',
      hoursPerDay: 2,
      checkInsPerDay: 4,
      timezone: 'UTC',
      primaryGoal: 'top_climber',
      constraints: {},
      weights: {
        economy: 0.4,
        military: 0.3,
        alliance: 0.2,
        risk: 0.1
      }
    };
  }
}

// Initialize the background service
new BackgroundService();

// Export for debugging
(globalThis as any).TLA_BG = BackgroundService;
