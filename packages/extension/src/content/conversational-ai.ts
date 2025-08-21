// Conversational AI Interface
// Connects chat UI to Claude via background service
// v0.4.1 - Fixed substring error and improved error handling

export class ChatAI {
  private conversationHistory: Array<{role: string, content: string}> = [];
  
  constructor() {
    console.log('[TLA Chat] Conversational AI initialized');
  }
  
  async askQuestion(question: string, gameState: any): Promise<string> {
    try {
      // Add question to history
      this.conversationHistory.push({ role: 'user', content: question });
      
      // Build context-aware prompt
      const prompt = this.buildPrompt(question, gameState);
      
      // Send to background service
      const response = await chrome.runtime.sendMessage({
        type: 'ASK_QUESTION',
        question: prompt
      });
      
      if (response.success && response.answer) {
        // Add response to history
        this.conversationHistory.push({ role: 'assistant', content: response.answer });
        return response.answer;
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('[TLA Chat] Error asking question:', error);
      return 'Sorry, I couldn\'t process that question. Please try again.';
    }
  }
  
  private buildPrompt(question: string, gameState: any): string {
    // Extract relevant game data
    const currentVillage = gameState?.villages?.get(gameState.currentVillageId) || {};
    const aggregates = gameState?.aggregates || {};
    
    // Build conversation history string safely
    const historyString = this.conversationHistory.slice(-4).map(msg => {
      const content = msg.content || '';
      const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
      return `${msg.role}: ${preview}`;
    }).join('\n');
    
    return `You are a Travian Legends expert assistant. The player is asking for strategic advice.

CURRENT GAME STATE:
- Villages: ${gameState?.villages?.size || 1}
- Current Village: ${currentVillage.villageName || 'Unknown'}
- Resources: Wood ${currentVillage.resources?.wood || 0}, Clay ${currentVillage.resources?.clay || 0}, Iron ${currentVillage.resources?.iron || 0}, Crop ${currentVillage.resources?.crop || 0}
- Production: Wood +${currentVillage.production?.wood || 0}/hr, Clay +${currentVillage.production?.clay || 0}/hr, Iron +${currentVillage.production?.iron || 0}/hr, Crop +${currentVillage.production?.crop || 0}/hr
- Total Population: ${aggregates.totalPopulation || 0}

CONVERSATION HISTORY:
${historyString}

PLAYER'S QUESTION: ${question}

Provide a concise, actionable answer. Include specific numbers and timings when possible. Keep response under 200 words.`;
  }
  
  getSuggestedQuestions(gameState: any): string[] {
    const suggestions = [];
    
    // Basic questions always available
    suggestions.push('What should I build next?');
    suggestions.push('How can I increase my resource production?');
    
    // Context-aware suggestions
    if (gameState?.villages?.size > 1) {
      suggestions.push('Which village should I focus on developing?');
    }
    
    if (gameState?.alerts?.length > 0) {
      suggestions.push('How do I handle the current alerts?');
    }
    
    // Resource-specific
    const currentVillage = gameState?.villages?.get(gameState?.currentVillageId);
    if (currentVillage) {
      const resources = currentVillage.resources || {};
      const lowestResource = Object.entries(resources)
        .sort(([,a], [,b]) => (a as number) - (b as number))[0];
      
      if (lowestResource) {
        suggestions.push(`How can I get more ${lowestResource[0]}?`);
      }
    }
    
    return suggestions.slice(0, 4); // Max 4 suggestions
  }
}

export class StrategicCalculators {
  static calculateTimeToOverflow(current: number, production: number, capacity: number): number {
    if (production <= 0) return Infinity;
    return (capacity - current) / production;
  }
  
  static calculateOptimalNPCRatio(resources: any, needed: any): any {
    // Simple NPC trade calculator
    const total = resources.wood + resources.clay + resources.iron + resources.crop;
    const targetTotal = needed.wood + needed.clay + needed.iron + needed.crop;
    
    if (total < targetTotal) {
      return null; // Not enough resources
    }
    
    return {
      wood: Math.floor((needed.wood / targetTotal) * total),
      clay: Math.floor((needed.clay / targetTotal) * total),
      iron: Math.floor((needed.iron / targetTotal) * total),
      crop: Math.floor((needed.crop / targetTotal) * total)
    };
  }
  
  static estimateBuildingTime(buildingType: string, currentLevel: number, tribe: string = 'Romans'): number {
    // Simplified building time calculation
    const baseTime = 300; // 5 minutes base
    const levelMultiplier = Math.pow(1.5, currentLevel);
    return Math.floor(baseTime * levelMultiplier);
  }
}

// Export singleton instance
export const chatAI = new ChatAI();