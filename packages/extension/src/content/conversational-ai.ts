// Conversational AI Interface
// Connects chat UI to Claude via background service
// v0.5.1 - Fixed error handling and safe string operations

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
    // Safely extract game data
    const villages = gameState?.villages || [];
    const currentVillageId = gameState?.currentVillageId;
    const currentVillage = villages.find((v: any) => v.id === currentVillageId) || villages[0] || {};
    const totals = gameState?.totals || {};
    
    // Build conversation history string safely
    const historyString = this.conversationHistory.slice(-4).map(msg => {
      const content = msg.content || '';
      // Safely handle substring - check length first
      const preview = content.length > 100 
        ? content.substring(0, 100) + '...' 
        : content;
      return `${msg.role}: ${preview}`;
    }).join('\n');
    
    return `You are a Travian Legends expert assistant. The player is asking for strategic advice.

CURRENT GAME STATE:
- Villages: ${villages.length}
- Current Village: ${currentVillage.villageName || 'Unknown'}
- Resources: Wood ${currentVillage.resources?.wood || 0}, Clay ${currentVillage.resources?.clay || 0}, Iron ${currentVillage.resources?.iron || 0}, Crop ${currentVillage.resources?.crop || 0}
- Production: Wood +${currentVillage.production?.wood || 0}/hr, Clay +${currentVillage.production?.clay || 0}/hr, Iron +${currentVillage.production?.iron || 0}/hr, Crop +${currentVillage.production?.crop || 0}/hr
- Total Population: ${totals.population || 0}

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
    const villages = gameState?.villages || [];
    if (villages.length > 1) {
      suggestions.push('Which village should I focus on developing?');
    }
    
    const alerts = gameState?.alerts || [];
    if (alerts.length > 0) {
      suggestions.push('How do I handle the current alerts?');
    }
    
    // Resource-specific
    const currentVillage = villages[0];
    if (currentVillage) {
      const resources = currentVillage.resources || {};
      const entries = Object.entries(resources);
      if (entries.length > 0) {
        const lowestResource = entries
          .filter(([key]) => key !== 'free')
          .sort(([,a], [,b]) => (a as number) - (b as number))[0];
        
        if (lowestResource) {
          suggestions.push(`How can I get more ${lowestResource[0]}?`);
        }
      }
    }
    
    // Check for overflow risk
    if (currentVillage?.alerts?.some((a: any) => a.type === 'overflow')) {
      suggestions.push('When will my resources overflow?');
    }
    
    return suggestions.slice(0, 4); // Max 4 suggestions
  }
  
  clearHistory() {
    this.conversationHistory = [];
    console.log('[TLA Chat] Conversation history cleared');
  }
}

export class StrategicCalculators {
  static calculateTimeToOverflow(current: number, production: number, capacity: number): number {
    if (production <= 0) return Infinity;
    const remaining = capacity - current;
    if (remaining <= 0) return 0;
    return remaining / production;
  }
  
  static calculateOptimalNPCRatio(resources: any, needed: any): any {
    // Validate inputs
    if (!resources || !needed) return null;
    
    const total = (resources.wood || 0) + (resources.clay || 0) + 
                  (resources.iron || 0) + (resources.crop || 0);
    const targetTotal = (needed.wood || 0) + (needed.clay || 0) + 
                       (needed.iron || 0) + (needed.crop || 0);
    
    if (total < targetTotal) {
      return null; // Not enough resources
    }
    
    // Prevent division by zero
    if (targetTotal === 0) return null;
    
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
  
  static formatTime(seconds: number): string {
    if (seconds === Infinity) return 'Never';
    if (seconds <= 0) return 'Now';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  }
}

// Export singleton instance
export const chatAI = new ChatAI();