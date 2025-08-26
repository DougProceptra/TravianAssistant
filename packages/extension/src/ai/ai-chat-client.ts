// packages/extension/src/ai/ai-chat-client.ts
// Flexible chat-based AI client for Travian Assistant
// Natural conversation with editable system messages

export interface GameState {
  villages: Map<string, any>;
  currentVillageId: string;
  serverAge: number;
  playerRank: number;
  allianceData?: any;
  recentEvents?: any[];
  timestamp: number;
}

export interface ChatConfig {
  systemMessage: string;
  userId: string;
  proxyUrl: string;
}

export class TravianChatAI {
  private config: ChatConfig;
  
  constructor(proxyUrl: string = 'https://travian-proxy-simple.vercel.app/api/proxy') {
    this.config = {
      systemMessage: this.getDefaultSystemMessage(),
      userId: '',
      proxyUrl
    };
    this.loadConfig();
  }

  /**
   * Initialize with user email hash
   */
  async initialize(email: string) {
    // Create email hash for user ID
    const userId = await this.hashEmail(email);
    this.config.userId = userId;
    await this.saveConfig();
    return userId;
  }

  /**
   * Natural chat interface - no structured responses required
   */
  async chat(message: string, gameState?: GameState): Promise<string> {
    console.log('[AI Chat] Processing message for user:', this.config.userId);
    
    // Build context-aware message
    let fullMessage = message;
    if (gameState) {
      fullMessage += '\n\n--- Current Game State ---\n';
      fullMessage += this.summarizeGameState(gameState);
    }
    
    try {
      // Call Claude with natural conversation
      const response = await this.callClaude(
        this.config.systemMessage,
        fullMessage
      );
      
      // Store conversation for context learning if user ID exists
      if (this.config.userId) {
        await this.storeConversation(message, response);
      }
      
      return response;
    } catch (error) {
      console.error('[AI Chat] Conversation failed:', error);
      // Clear, honest failure message - no fake responses
      return "Unable to connect to AI service. Please check your connection and try again.";
    }
  }

  /**
   * Update system message (from settings panel)
   */
  async updateSystemMessage(newMessage: string) {
    this.config.systemMessage = newMessage;
    await this.saveConfig();
  }

  /**
   * Get current system message for display/editing
   */
  getSystemMessage(): string {
    return this.config.systemMessage;
  }

  /**
   * Get example prompts (not enforced, just suggestions)
   */
  getExamplePrompts(): { [key: string]: string } {
    return {
      strategic: "What strategic opportunities do you see in my current position?",
      attack: "I'm being attacked in 4 hours. What are my options beyond defend or dodge?",
      settlement: "Should I rush settlers or is there a better play here?",
      psychology: "How can I make my opponents think I'm weaker than I am?",
      politics: "What alliance moves would strengthen my position?",
      deception: "How can I mislead scouts about my true strength?",
      resources: "I'm low on iron. What creative solutions do you see?",
      timing: "When is the optimal time to reveal my military strength?",
      meta: "What is everyone else probably doing wrong right now?",
      custom: "Ask anything about your Travian strategy..."
    };
  }

  /**
   * Get system message templates for different game phases
   */
  getSystemMessageTemplates(): { [key: string]: string } {
    return {
      default: this.getDefaultSystemMessage(),
      earlyGame: `You are an elite Travian strategist focused on early game (days 1-20).
Priority: Establish economic dominance while appearing weak.
Consider: Settlement timing, early aggression opportunities, relationship building.
Challenge conventional wisdom about always rushing settlers.`,
      
      midGame: `You are an elite Travian strategist focused on mid game (days 20-60).
Priority: Position for artifact control while managing threats.
Consider: Military buildup timing, alliance dynamics, resource conversion.
Focus on psychological warfare and misdirection.`,
      
      artifacts: `You are an elite Travian strategist focused on artifact phase.
Priority: Artifact acquisition through deception and timing.
Consider: Fake operations, alliance betrayals, hammer concealment.
Think about making enemies waste troops on wrong targets.`,
      
      endgame: `You are an elite Travian strategist focused on Wonder of the World.
Priority: Logistics, politics, and resource management for WW.
Consider: King-making opportunities, stalemate forcing, alliance fractures.
Focus on win conditions and server-ending strategies.`,
      
      custom: "" // User writes their own
    };
  }

  // Private methods

  private getDefaultSystemMessage(): string {
    return `You are an elite Travian Legends strategist, equivalent to a top-20 player with deep competitive experience.

Focus on:
- Non-obvious insights that experienced players might miss
- Psychological warfare and opponent manipulation
- Server-specific dynamics and politics
- Timing and deception over mechanical optimization
- Counter-intuitive strategies that work

Always consider what opponents expect versus what would surprise them.
Challenge conventional wisdom when the data suggests alternatives.
Think in multiple time horizons: immediate, daily, weekly, and endgame positioning.

Provide conversational, thoughtful analysis without rigid structure.
Explain your reasoning but keep responses concise and actionable.`;
  }

  private summarizeGameState(gameState: GameState): string {
    const village = gameState.villages?.get(gameState.currentVillageId);
    const serverDay = Math.floor((gameState.serverAge || 0) / 86400);
    
    let summary = `Server day ${serverDay}, Rank #${gameState.playerRank}\n`;
    
    if (village) {
      summary += `Village: ${village.villageName} (Pop: ${village.population})\n`;
      summary += `Resources: ${JSON.stringify(village.resources)}\n`;
      summary += `Production: ${JSON.stringify(village.production)}\n`;
      
      if (village.troops?.own) {
        const troopCount = Object.values(village.troops.own).reduce((a, b) => a + b, 0);
        summary += `Military: ${troopCount} troops\n`;
      }
      
      if (village.buildQueue?.length) {
        summary += `Building: ${village.buildQueue[0].building} L${village.buildQueue[0].level}\n`;
      }
    }
    
    if (gameState.recentEvents?.length) {
      summary += `Recent: ${gameState.recentEvents[0].type}\n`;
    }
    
    return summary;
  }

  private async callClaude(systemMessage: string, userMessage: string): Promise<string> {
    const response = await fetch(this.config.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemMessage,
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'No response received';
  }

  private async hashEmail(email: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async storeConversation(message: string, response: string) {
    try {
      const conversation = {
        userId: this.config.userId,
        timestamp: new Date().toISOString(),
        message,
        response
      };
      
      // Store in local storage with user ID
      const key = `travian_chat_${this.config.userId}`;
      const stored = await chrome.storage.local.get([key]);
      const history = stored[key] || [];
      
      history.push(conversation);
      // Keep last 100 conversations
      if (history.length > 100) {
        history.shift();
      }
      
      await chrome.storage.local.set({ [key]: history });
    } catch (error) {
      console.error('[AI Chat] Failed to store conversation:', error);
    }
  }

  private async loadConfig() {
    try {
      const stored = await chrome.storage.sync.get(['aiChatConfig']);
      if (stored.aiChatConfig) {
        this.config = { ...this.config, ...stored.aiChatConfig };
      }
    } catch (error) {
      console.error('[AI Chat] Failed to load config:', error);
    }
  }

  private async saveConfig() {
    try {
      await chrome.storage.sync.set({ aiChatConfig: this.config });
    } catch (error) {
      console.error('[AI Chat] Failed to save config:', error);
    }
  }
}

export default TravianChatAI;