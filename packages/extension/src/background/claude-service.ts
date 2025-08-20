// packages/extension/src/background/claude-service.ts
import { GameState, PlayerProfile, Analysis, Recommendation } from '../lib/types';

interface AIProvider {
  name: string;
  analyze(gameState: GameState, profile: PlayerProfile): Promise<Analysis>;
  chat(question: string, gameState: GameState, profile: PlayerProfile): Promise<string>;
}

class ClaudeProvider implements AIProvider {
  name = 'Claude';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze(gameState: GameState, profile: PlayerProfile): Promise<Analysis> {
    const prompt = this.buildAnalysisPrompt(gameState, profile);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAnalysisResponse(data.content[0].text);
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  async chat(question: string, gameState: GameState, profile: PlayerProfile): Promise<string> {
    const prompt = this.buildChatPrompt(question, gameState, profile);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude chat error:', error);
      throw error;
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
- Economic Focus: ${profile.weights.economy * 100}%
- Military Focus: ${profile.weights.military * 100}%

CURRENT GAME STATE:
Server: ${state.server.name} (Speed: ${state.server.speed}x)
Current Page: ${state.page}
Timestamp: ${new Date(state.timestamp).toISOString()}

Villages: ${state.villages.length}
${state.villages.map(v => `- ${v.name}: Pop ${v.population}, Loyalty ${v.loyalty}%`).join('\n')}

Resources:
- Wood: ${state.resources.wood} / ${state.resources.warehouseCapacity} (${state.resources.woodProduction}/hr)
- Clay: ${state.resources.clay} / ${state.resources.warehouseCapacity} (${state.resources.clayProduction}/hr)
- Iron: ${state.resources.iron} / ${state.resources.warehouseCapacity} (${state.resources.ironProduction}/hr)
- Crop: ${state.resources.crop} / ${state.resources.granaryCapacity} (${state.resources.cropProduction}/hr)
- Free Crop: ${state.resources.freeCrop}

Buildings:
${state.buildings.map(b => `- ${b.name} Level ${b.level} ${b.isUpgrading ? '(Upgrading)' : ''}`).join('\n')}

Troops:
- Total: ${Object.values(state.troops).reduce((a, b) => a + b, 0)} units
${Object.entries(state.troops).map(([unit, count]) => count > 0 ? `- ${unit}: ${count}` : '').filter(Boolean).join('\n')}

Hero:
- Level: ${state.hero.level}
- Health: ${state.hero.health}%
- Experience: ${state.hero.experience}

Incoming Attacks: ${state.movements.filter(m => m.type === 'incoming_attack').length}
Outgoing Attacks: ${state.movements.filter(m => m.type === 'outgoing_attack').length}

TASK: Provide exactly 3 actionable recommendations. Each should be specific to the current game state and aligned with the player's profile.

Return ONLY a JSON object in this exact format:
{
  "recommendations": [
    {
      "action": "Specific action to take",
      "reason": "Why this is important now",
      "expectedBenefit": "What this achieves",
      "timeRequired": "How long it takes",
      "priority": "high|medium|low",
      "actionCode": "UNIQUE_ACTION_ID"
    }
  ],
  "warnings": ["Any urgent issues"],
  "strategicNotes": "Brief strategic observation"
}`;
  }

  private buildChatPrompt(question: string, state: GameState, profile: PlayerProfile): string {
    return `You are an expert Travian Legends player answering questions about game strategy.

Current game context:
- Player: ${profile.tribe} ${profile.style} player
- Villages: ${state.villages.length}
- Resources: Wood ${state.resources.wood}, Clay ${state.resources.clay}, Iron ${state.resources.iron}, Crop ${state.resources.crop}
- Troops: ${Object.values(state.troops).reduce((a, b) => a + b, 0)} total
- Page: ${state.page}

Question: ${question}

Provide a concise, actionable answer specific to this player's situation. Focus on practical steps they can take right now.`;
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
      console.error('Failed to parse Claude response:', error);
    }

    // Fallback parsing
    return {
      recommendations: [{
        action: 'Check game state',
        reason: 'Failed to get AI analysis',
        expectedBenefit: 'Manual review needed',
        timeRequired: 'Unknown',
        priority: 'medium' as const
      }],
      warnings: [],
      strategicNotes: text,
      timestamp: Date.now()
    };
  }
}

export class AIService {
  private provider: AIProvider;
  private cache: Map<string, { analysis: Analysis; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {
    // Default to Claude Sonnet, but easily switchable
    this.initializeProvider();
  }

  private async initializeProvider() {
    const config = await chrome.storage.sync.get(['aiProvider', 'apiKey', 'aiModel']);
    
    if (!config.apiKey) {
      throw new Error('No API key configured');
    }

    // Easy to add other providers here
    switch (config.aiProvider || 'claude') {
      case 'claude':
        this.provider = new ClaudeProvider(
          config.apiKey, 
          config.aiModel || 'claude-3-5-sonnet-20241022'
        );
        break;
      // Future: case 'openai':, case 'gemini':, etc.
      default:
        this.provider = new ClaudeProvider(config.apiKey, 'claude-3-5-sonnet-20241022');
    }
  }

  async analyze(gameState: GameState, profile: PlayerProfile): Promise<Analysis> {
    const cacheKey = this.getCacheKey(gameState);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('Returning cached analysis');
      return cached.analysis;
    }

    const analysis = await this.provider.analyze(gameState, profile);
    
    this.cache.set(cacheKey, {
      analysis,
      timestamp: Date.now()
    });

    return analysis;
  }

  async chat(question: string, gameState: GameState, profile: PlayerProfile): Promise<string> {
    return this.provider.chat(question, gameState, profile);
  }

  private getCacheKey(gameState: GameState): string {
    // Create a cache key based on important state changes
    return `${gameState.page}_${gameState.villages.length}_${gameState.resources.wood}_${gameState.resources.clay}`;
  }

  // Allow switching providers at runtime
  async switchProvider(providerName: string, apiKey: string, model?: string) {
    switch (providerName) {
      case 'claude':
        this.provider = new ClaudeProvider(apiKey, model || 'claude-3-5-sonnet-20241022');
        break;
      // Add other providers as needed
    }
    
    // Save configuration
    await chrome.storage.sync.set({
      aiProvider: providerName,
      apiKey: apiKey,
      aiModel: model
    });
  }
}
