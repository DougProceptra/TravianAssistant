// Conversational AI Interface for TravianAssistant
// Enables natural language questions about game strategy

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: any; // Game state at time of message
}

export class ConversationalAI {
  private messages: ChatMessage[] = [];
  private readonly MAX_HISTORY = 20;
  
  constructor() {
    this.loadChatHistory();
  }

  /**
   * Process a natural language question about the game
   */
  public async askQuestion(
    question: string, 
    gameState: any
  ): Promise<string> {
    console.log('[TLA Chat] Processing question:', question);
    
    // Add user message to history
    this.addMessage('user', question);
    
    // Build context-aware prompt
    const prompt = this.buildStrategicPrompt(question, gameState);
    
    try {
      // Send to Claude via background service
      const response = await chrome.runtime.sendMessage({
        type: 'ASK_STRATEGIC_QUESTION',
        question: prompt,
        gameState: gameState
      });
      
      if (response.success) {
        const answer = response.answer;
        this.addMessage('assistant', answer);
        return answer;
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('[TLA Chat] Failed to get answer:', error);
      return "I'm having trouble analyzing that right now. Please try again.";
    }
  }

  /**
   * Build a strategic prompt with full game context
   */
  private buildStrategicPrompt(question: string, gameState: any): string {
    const isMultiVillage = gameState?.villages && gameState.villages.size > 0;
    
    return `You are an expert Travian Legends strategic advisor. The player has asked you a specific question about their game strategy.

${isMultiVillage ? this.formatMultiVillageContext(gameState) : this.formatSingleVillageContext(gameState)}

CONVERSATION HISTORY:
${this.formatRecentHistory()}

PLAYER'S QUESTION: ${question}

Provide a strategic answer that:
1. Directly addresses their specific question
2. Uses their actual game numbers and data
3. Gives concrete, actionable steps they can take right now
4. Includes specific timelines (e.g., "in 3 hours", "by tomorrow")
5. Considers their current resources and production rates

Be conversational but precise. If they ask about troop building, tell them exactly how many troops they can build with current resources. If they ask about settling, calculate when they'll have enough CP and resources.`;
  }

  /**
   * Format multi-village game state for context
   */
  private formatMultiVillageContext(gameState: any): string {
    const villages = Array.from(gameState.villages.values());
    
    return `ACCOUNT OVERVIEW:
- Villages: ${gameState.villages.size}
- Total Population: ${gameState.aggregates?.totalPopulation || 'Unknown'}
- Rank: ${gameState.aggregates?.rank || 'Unknown'}

TOTAL PRODUCTION:
- Wood: ${gameState.aggregates?.totalProduction?.wood || 0}/hour
- Clay: ${gameState.aggregates?.totalProduction?.clay || 0}/hour  
- Iron: ${gameState.aggregates?.totalProduction?.iron || 0}/hour
- Crop: ${gameState.aggregates?.totalProduction?.crop || 0}/hour (Net: ${gameState.aggregates?.totalProduction?.cropNet || 0}/hour)

TOTAL RESOURCES:
- Wood: ${gameState.aggregates?.totalResources?.wood || 0}
- Clay: ${gameState.aggregates?.totalResources?.clay || 0}
- Iron: ${gameState.aggregates?.totalResources?.iron || 0}
- Crop: ${gameState.aggregates?.totalResources?.crop || 0}

VILLAGES DETAIL:
${villages.map(v => `${v.villageName}: Pop ${v.population || 'N/A'}, Resources (${v.resources?.wood || 0}/${v.resources?.clay || 0}/${v.resources?.iron || 0}/${v.resources?.crop || 0})`).join('\n')}

CURRENT ALERTS:
${gameState.alerts?.map((a: any) => `- [${a.severity}] ${a.message}`).join('\n') || 'None'}`;
  }

  /**
   * Format single village context
   */
  private formatSingleVillageContext(gameState: any): string {
    return `CURRENT VILLAGE:
- Resources: Wood ${gameState?.resources?.wood || 0}, Clay ${gameState?.resources?.clay || 0}, Iron ${gameState?.resources?.iron || 0}, Crop ${gameState?.resources?.crop || 0}
- Production: +${gameState?.production?.wood || 0}/+${gameState?.production?.clay || 0}/+${gameState?.production?.iron || 0}/+${gameState?.production?.crop || 0} per hour
- Buildings: ${gameState?.buildings?.length || 0} constructed
- Troops: ${gameState?.troops?.length || 0} units`;
  }

  /**
   * Format recent conversation history
   */
  private formatRecentHistory(): string {
    const recent = this.messages.slice(-6); // Last 3 exchanges
    if (recent.length === 0) return 'No previous conversation';
    
    return recent.map(m => 
      `${m.role === 'user' ? 'Player' : 'Advisor'}: ${m.content.substring(0, 200)}`
    ).join('\n');
  }

  /**
   * Add message to history
   */
  private addMessage(role: 'user' | 'assistant', content: string): void {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now()
    };
    
    this.messages.push(message);
    
    // Trim history if too long
    if (this.messages.length > this.MAX_HISTORY) {
      this.messages = this.messages.slice(-this.MAX_HISTORY);
    }
    
    this.saveChatHistory();
  }

  /**
   * Get conversation history
   */
  public getHistory(): ChatMessage[] {
    return this.messages;
  }

  /**
   * Clear conversation history
   */
  public clearHistory(): void {
    this.messages = [];
    this.saveChatHistory();
  }

  /**
   * Save chat history to storage
   */
  private saveChatHistory(): void {
    try {
      localStorage.setItem('tla_chat_history', JSON.stringify(this.messages));
    } catch (error) {
      console.error('[TLA Chat] Failed to save history:', error);
    }
  }

  /**
   * Load chat history from storage
   */
  private loadChatHistory(): void {
    try {
      const saved = localStorage.getItem('tla_chat_history');
      if (saved) {
        this.messages = JSON.parse(saved);
        console.log('[TLA Chat] Loaded', this.messages.length, 'messages from history');
      }
    } catch (error) {
      console.error('[TLA Chat] Failed to load history:', error);
      this.messages = [];
    }
  }

  /**
   * Get suggested questions based on game state
   */
  public getSuggestedQuestions(gameState: any): string[] {
    const suggestions: string[] = [];
    
    // Handle null or undefined game state
    if (!gameState) {
      return [
        "What should I build first?",
        "How can I increase resource production?",
        "When should I build troops?",
        "What's the best strategy for beginners?",
        "How do I expand to more villages?"
      ];
    }
    
    // Resource-based suggestions
    if (gameState.aggregates?.totalResources) {
      const totalRes = gameState.aggregates.totalResources;
      const total = (totalRes.wood || 0) + (totalRes.clay || 0) + (totalRes.iron || 0);
      if (total > 10000) {
        suggestions.push("What should I build with my current resources?");
      }
    }
    
    // Alert-based suggestions
    if (gameState.alerts && gameState.alerts.length > 0) {
      if (gameState.alerts.some((a: any) => a.type === 'overflow')) {
        suggestions.push("How can I prevent resource overflow?");
      }
      if (gameState.alerts.some((a: any) => a.type === 'attack')) {
        suggestions.push("How should I defend against the incoming attack?");
      }
    }
    
    // General strategic questions
    suggestions.push(
      "What's my biggest bottleneck right now?",
      "Should I focus on economy or military?",
      "When can I settle my next village?",
      "What troops should I build for defense?",
      "How can I increase production faster?"
    );
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}

// Export singleton instance
export const chatAI = new ConversationalAI();

// Strategic calculators for specific questions
export class StrategicCalculators {
  
  /**
   * Calculate when player can settle next village
   */
  public static calculateSettlementTime(gameState: any): {
    culturePointsNeeded: number;
    currentCP: number;
    cpPerDay: number;
    daysToSettle: number;
    resourcesNeeded: { wood: number; clay: number; iron: number; crop: number };
    hasEnoughResources: boolean;
  } {
    // This would need actual CP calculation based on buildings
    const currentCP = gameState?.aggregates?.culturePoints || 0;
    const villageCount = gameState?.villages?.size || 1;
    
    // Simplified CP requirements (would need actual formula)
    const cpNeeded = this.getCPRequirement(villageCount + 1);
    const cpPerDay = this.estimateCPProduction(gameState);
    
    const daysToSettle = Math.max(0, Math.ceil((cpNeeded - currentCP) / cpPerDay));
    
    // Settler + new village costs
    const resourcesNeeded = {
      wood: 5800,  // 3 settlers + palace/residence
      clay: 5650,
      iron: 5100,
      crop: 1600
    };
    
    const currentRes = gameState?.aggregates?.totalResources || gameState?.resources || { wood: 0, clay: 0, iron: 0, crop: 0 };
    const hasEnoughResources = 
      (currentRes.wood || 0) >= resourcesNeeded.wood &&
      (currentRes.clay || 0) >= resourcesNeeded.clay &&
      (currentRes.iron || 0) >= resourcesNeeded.iron &&
      (currentRes.crop || 0) >= resourcesNeeded.crop;
    
    return {
      culturePointsNeeded: cpNeeded,
      currentCP,
      cpPerDay,
      daysToSettle,
      resourcesNeeded,
      hasEnoughResources
    };
  }

  /**
   * Calculate troop building optimization
   */
  public static calculateTroopOptimization(
    gameState: any,
    troopType: string
  ): {
    maxTroops: number;
    timeToTrain: number;
    resourceCost: { wood: number; clay: number; iron: number; crop: number };
    recommendation: string;
  } {
    // This would need troop cost data for each tribe
    const troopCosts = this.getTroopCosts(troopType);
    const currentRes = gameState?.aggregates?.totalResources || gameState?.resources || { wood: 0, clay: 0, iron: 0, crop: 0 };
    
    const maxByWood = Math.floor((currentRes.wood || 0) / troopCosts.wood);
    const maxByClay = Math.floor((currentRes.clay || 0) / troopCosts.clay);
    const maxByIron = Math.floor((currentRes.iron || 0) / troopCosts.iron);
    const maxByCrop = Math.floor((currentRes.crop || 0) / troopCosts.crop);
    
    const maxTroops = Math.min(maxByWood, maxByClay, maxByIron, maxByCrop);
    
    // Simplified time calculation (would need barracks level)
    const timePerTroop = 30; // seconds, would vary by troop and barracks level
    const timeToTrain = maxTroops * timePerTroop;
    
    const resourceCost = {
      wood: maxTroops * troopCosts.wood,
      clay: maxTroops * troopCosts.clay,
      iron: maxTroops * troopCosts.iron,
      crop: maxTroops * troopCosts.crop
    };
    
    let recommendation = `You can build ${maxTroops} ${troopType}`;
    if (maxTroops < 10) {
      recommendation += ". Focus on resource production first.";
    } else if (maxTroops > 50) {
      recommendation += ". Consider splitting between offense and defense.";
    }
    
    return {
      maxTroops,
      timeToTrain,
      resourceCost,
      recommendation
    };
  }

  /**
   * Helper: Get CP requirement for Nth village
   */
  private static getCPRequirement(villageNumber: number): number {
    // Simplified formula - would need actual game formula
    const requirements = [0, 0, 2000, 8000, 20000, 40000, 70000, 110000];
    return requirements[Math.min(villageNumber, requirements.length - 1)];
  }

  /**
   * Helper: Estimate daily CP production
   */
  private static estimateCPProduction(gameState: any): number {
    // Simplified - would calculate based on buildings
    const villageCount = gameState?.villages?.size || 1;
    return villageCount * 100; // Rough estimate
  }

  /**
   * Helper: Get troop costs
   */
  private static getTroopCosts(troopType: string): {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  } {
    // Simplified - would need full troop database
    const costs: any = {
      'clubswinger': { wood: 95, clay: 75, iron: 40, crop: 40 },
      'spearman': { wood: 145, clay: 70, iron: 85, crop: 40 },
      'axeman': { wood: 130, clay: 120, iron: 170, crop: 70 },
      'scout': { wood: 160, clay: 100, iron: 50, crop: 50 },
      // Add more troops...
    };
    
    return costs[troopType.toLowerCase()] || { wood: 100, clay: 100, iron: 100, crop: 50 };
  }
}