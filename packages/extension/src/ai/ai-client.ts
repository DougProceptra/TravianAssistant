// packages/extension/src/ai/ai-client.ts
// Elite AI Client for Travian Assistant
// Connects game state to Claude with proper system messages and prompts

import { readFileSync } from 'fs';
import { join } from 'path';

export interface GameState {
  villages: Map<string, any>;
  currentVillageId: string;
  serverAge: number;
  playerRank: number;
  allianceData?: any;
  recentEvents?: any[];
  timestamp: number;
}

export interface AIResponse {
  recommendations: Recommendation[];
  insights?: string[];
  warnings?: string[];
  confidence: number;
}

export interface Recommendation {
  action: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  village?: string;
  timing?: string;
  alternativeIf?: string;
}

export class TravianAIClient {
  private proxyUrl: string;
  private systemInstructions: string;
  private decisionPrompts: Map<string, string>;
  
  constructor(proxyUrl: string = 'https://travian-proxy-simple.vercel.app/api/proxy') {
    this.proxyUrl = proxyUrl;
    this.systemInstructions = this.loadSystemInstructions();
    this.decisionPrompts = this.loadDecisionPrompts();
  }

  /**
   * Load the elite player system instructions
   */
  private loadSystemInstructions(): string {
    // In production, this would be bundled. For now, return the content
    return ELITE_SYSTEM_INSTRUCTIONS;
  }

  /**
   * Load decision prompt templates
   */
  private loadDecisionPrompts(): Map<string, string> {
    const prompts = new Map();
    
    // Daily Strategic Review
    prompts.set('daily_review', `
Analyze this game state for daily strategic planning. Consider:
1. What opportunities exist in the next 24 hours?
2. What threats need immediate attention?
3. What long-term positioning moves should start now?
4. What are opponents likely planning based on visible data?

Focus on non-obvious insights that a typical player would miss.
`);

    // Settlement Decision
    prompts.set('settlement', `
Analyze settlement timing and location options. Consider:
1. Is rushing settlement actually optimal or is military/economic dominance better?
2. What locations offer strategic advantage beyond resources?
3. How does settlement timing affect server perception of our strength?
4. What are opponents' settlement patterns revealing?

Challenge conventional "always settle ASAP" wisdom if data suggests otherwise.
`);

    // Under Attack Response
    prompts.set('under_attack', `
We're under attack. Analyze optimal response considering:
1. Is defending worth it or should we dodge and counter?
2. What does this attack reveal about enemy knowledge/intentions?
3. How can we use this attack to our advantage politically/strategically?
4. What counter-intelligence opportunities exist?

Think beyond just "defend or dodge" - consider the meta-game.
`);

    // Resource Crisis
    prompts.set('resource_crisis', `
Analyze resource shortage and provide solutions considering:
1. Is this real scarcity or poor resource conversion?
2. Can we weaponize appearing resource-poor?
3. What high-risk/high-reward plays become correct when desperate?
4. How can we convert political capital to resources?

Don't just suggest "build more fields" - think creatively.
`);

    // Artifact Strategy
    prompts.set('artifact_prep', `
Analyze artifact preparation strategy considering:
1. Which artifacts actually matter for our win condition?
2. How can we position to take artifacts while appearing unprepared?
3. What alliances/betrayals optimize artifact acquisition?
4. How do we make enemies waste troops on wrong artifacts?

Focus on deception and misdirection, not just troop counts.
`);

    return prompts;
  }

  /**
   * Create system message combining instructions and game constants
   */
  private createSystemMessage(context?: any): string {
    let message = this.systemInstructions;
    
    // Add any persistent context
    if (context?.patterns) {
      message += '\n\n## Learned Patterns from Previous Sessions:\n';
      message += context.patterns;
    }
    
    if (context?.serverMeta) {
      message += '\n\n## Server-Specific Intelligence:\n';
      message += JSON.stringify(context.serverMeta, null, 2);
    }
    
    return message;
  }

  /**
   * Analyze game state with specific decision prompt
   */
  async analyzeGameState(
    gameState: GameState, 
    decisionType: string = 'daily_review',
    context?: any
  ): Promise<AIResponse> {
    console.log('[AI Client] Analyzing game state with decision:', decisionType);
    
    const systemMessage = this.createSystemMessage(context);
    const decisionPrompt = this.decisionPrompts.get(decisionType) || this.decisionPrompts.get('daily_review')!;
    
    // Build the full prompt
    const prompt = `
${decisionPrompt}

Current Game State:
${this.formatGameState(gameState)}

Provide analysis in this exact JSON format:
{
  "recommendations": [
    {
      "action": "Specific action to take",
      "reason": "Why this is strategically important",
      "priority": "critical|high|medium|low",
      "timing": "When to execute (e.g., 'next 2 hours', 'after current build')",
      "village": "Village name if specific",
      "alternativeIf": "Condition that would change this recommendation"
    }
  ],
  "insights": [
    "Non-obvious strategic insights based on the data"
  ],
  "warnings": [
    "Risks or threats detected in the game state"
  ],
  "confidence": 0.85
}

Remember: Think like a top-20 player. Focus on psychological warfare, misdirection, and server politics, not just mechanical optimization.`;

    try {
      const response = await this.callAI(systemMessage, prompt);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('[AI Client] Failed to analyze:', error);
      return this.getFallbackRecommendations(gameState, decisionType);
    }
  }

  /**
   * Format game state for AI consumption
   */
  private formatGameState(gameState: GameState): string {
    const village = gameState.villages?.get(gameState.currentVillageId);
    
    const formatted = {
      serverDay: Math.floor((gameState.serverAge || 0) / 86400),
      playerRank: gameState.playerRank,
      currentVillage: village ? {
        name: village.villageName,
        population: village.population,
        resources: village.resources,
        storage: village.storage,
        production: village.production,
        buildings: village.buildings,
        troops: village.troops
      } : null,
      villageCount: gameState.villages?.size || 1,
      recentEvents: gameState.recentEvents?.slice(0, 10),
      timestamp: new Date(gameState.timestamp).toISOString()
    };
    
    return JSON.stringify(formatted, null, 2);
  }

  /**
   * Call AI through proxy
   */
  private async callAI(systemMessage: string, userPrompt: string): Promise<string> {
    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemMessage,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI call failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(response: string): AIResponse {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('[AI Client] Failed to parse response:', error);
      throw error;
    }
  }

  /**
   * Get fallback recommendations when AI fails
   */
  private getFallbackRecommendations(gameState: GameState, decisionType: string): AIResponse {
    const village = gameState.villages?.get(gameState.currentVillageId);
    const serverDay = Math.floor((gameState.serverAge || 0) / 86400);
    
    // Provide intelligent fallbacks based on game phase
    if (serverDay < 7) {
      return {
        recommendations: [
          {
            action: 'Focus on one resource type to level 5-6 instead of balancing',
            reason: 'Specialized production with NPC trading beats balanced growth',
            priority: 'high',
            timing: 'Next 12 hours',
            alternativeIf: 'Under immediate attack threat'
          },
          {
            action: 'Scout all players within 13 fields',
            reason: 'Early intelligence gathering defines your entire game',
            priority: 'high',
            timing: 'As soon as scouts available'
          },
          {
            action: 'Send 1 resource to top 10 players',
            reason: 'Establishes communication and shows you\'re not a farm',
            priority: 'medium',
            timing: 'After first marketplace'
          }
        ],
        insights: [
          'Most players balance resources - specialization with NPC is 20% faster growth',
          'Early game relationships determine endgame alliances'
        ],
        confidence: 0.7
      };
    } else if (serverDay < 30) {
      return {
        recommendations: [
          {
            action: 'Start building troops even if not optimal',
            reason: 'Military presence deters farming more than walls',
            priority: 'high',
            timing: 'Immediately'
          },
          {
            action: 'Identify and mark future cropper targets',
            reason: 'Best croppers claimed in week 3-5',
            priority: 'medium',
            timing: 'This week'
          }
        ],
        insights: [
          'Server entering consolidation phase - weak players becoming farms'
        ],
        confidence: 0.6
      };
    }
    
    // Generic fallback
    return {
      recommendations: [
        {
          action: 'Continue current build queue',
          reason: 'Maintaining momentum',
          priority: 'medium',
          timing: 'Ongoing'
        }
      ],
      confidence: 0.3
    };
  }

  /**
   * Ask a specific question about game state
   */
  async askQuestion(question: string, gameState?: GameState, context?: any): Promise<string> {
    const systemMessage = this.createSystemMessage(context);
    
    let prompt = question;
    if (gameState) {
      prompt += `\n\nCurrent game state:\n${this.formatGameState(gameState)}`;
    }
    prompt += '\n\nProvide expert analysis focused on competitive advantage and non-obvious strategies.';
    
    try {
      return await this.callAI(systemMessage, prompt);
    } catch (error) {
      console.error('[AI Client] Failed to answer question:', error);
      return 'Unable to analyze at this time. Consider the psychological impact of your next move - what would surprise your opponents most?';
    }
  }
}

// Elite system instructions (embedded for now, could be loaded from file)
const ELITE_SYSTEM_INSTRUCTIONS = `# Elite Travian AI Agent System Instructions

## Core Identity
You are an elite Travian Legends strategist with deep game knowledge equivalent to a top-20 player. You analyze game state holistically, considering not just mechanics but psychology, timing, and server politics.

## Fundamental Principles

### Think Like a Competitor, Not a Helper
- Assume the human is skilled and seeking competitive advantage
- Focus on non-obvious insights and edge cases
- Challenge conventional wisdom when data suggests alternatives
- Consider what opponents are likely doing and how to counter

### Multi-Layer Analysis
Every decision impacts multiple timelines:
- Immediate (next 6 hours)
- Short-term (next 24-48 hours)  
- Mid-term (next week)
- Strategic (next month)
- Server-winning (endgame position)

### Resource Philosophy
Resources are not just numbers - they represent:
- Time (can be converted via gold)
- Military potential (troops not built)
- Political capital (resources sent to allies)
- Psychological warfare (showing wealth/poverty)
- Flexibility (ability to respond to opportunities)

## Decision Framework

### For Every Situation, Consider:
1. **The Obvious Play** - What would 90% of players do?
2. **The Counter-Play** - What defeats the obvious play?
3. **The Meta-Play** - What have elite players discovered?
4. **The Server-Specific Play** - What works on THIS server with THESE players?
5. **The Psychological Play** - What sends a message?

### Key Questions to Always Ask:
- What are my opponents NOT expecting?
- How does this decision affect my reputation?
- What information am I revealing/concealing?
- Can I create a false bottleneck to mislead scouts?
- Is there a way to make enemies waste resources/time?

## Response Patterns

When providing recommendations, always:
1. Challenge obvious approaches
2. Consider psychological and political factors
3. Think about information warfare
4. Account for server-specific patterns
5. Focus on competitive advantage, not just optimization

Remember: Every server is different. Adapt continuously based on observed results and opponent behavior.`;

export default TravianAIClient;