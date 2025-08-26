// Conversational AI Interface
// Connects chat UI to Claude via background service
// v0.6.5 - Fixed initialization flow and message types

export class ChatAI {
  private conversationHistory: Array<{role: string, content: string}> = [];
  private userInitialized: boolean = false;
  
  constructor() {
    console.log('[TLA Chat] Conversational AI initialized');
    this.checkInitialization();
  }
  
  // Check if user is already initialized
  private async checkInitialization() {
    try {
      const stored = await chrome.storage.sync.get(['userEmail']);
      if (stored.userEmail) {
        this.userInitialized = true;
        console.log('[TLA Chat] User already initialized');
      }
    } catch (error) {
      console.error('[TLA Chat] Failed to check initialization:', error);
    }
  }
  
  // Check if input looks like an email
  private isEmail(text: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text.trim());
  }
  
  async askQuestion(question: string, gameState: any): Promise<string> {
    try {
      // Check if this is an email for initialization
      if (!this.userInitialized && this.isEmail(question)) {
        console.log('[TLA Chat] Detected email, initializing user...');
        
        // Send SET_USER_EMAIL message
        const initResponse = await chrome.runtime.sendMessage({
          type: 'SET_USER_EMAIL',
          email: question.trim()
        });
        
        if (initResponse.success && initResponse.userId) {
          this.userInitialized = true;
          console.log('[TLA Chat] User initialized with ID:', initResponse.userId);
          return 'User initialized! You can now ask me strategic questions about your Travian game.';
        } else {
          throw new Error(initResponse.error || 'Failed to initialize user');
        }
      }
      
      // Check if user is initialized
      if (!this.userInitialized) {
        return 'Please enter your email address first to initialize your personalized AI strategist.';
      }
      
      // Add question to history
      this.conversationHistory.push({ role: 'user', content: question });
      
      // Send CHAT_MESSAGE to background
      console.log('[TLA Chat] Sending chat message...');
      const response = await chrome.runtime.sendMessage({
        type: 'CHAT_MESSAGE',
        message: question,
        gameState: this.simplifyGameState(gameState)
      });
      
      if (response.success && response.response) {
        // Add response to history
        this.conversationHistory.push({ role: 'assistant', content: response.response });
        return response.response;
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('[TLA Chat] Error:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('Receiving end does not exist')) {
        return 'Background service not responding. Please reload the extension from chrome://extensions/';
      }
      
      return `Error: ${error.message || 'Failed to connect to AI service'}`;
    }
  }
  
  // Simplify game state to reduce message size
  private simplifyGameState(gameState: any): any {
    if (!gameState) return null;
    
    const villages = gameState.villages || [];
    const currentVillage = villages.find((v: any) => v.id === gameState.currentVillageId) || villages[0];
    
    return {
      villages: villages.map((v: any) => ({
        id: v.id,
        name: v.name || v.villageName,
        population: v.population,
        resources: v.resources,
        production: v.production
      })),
      currentVillageId: gameState.currentVillageId,
      totals: gameState.totals,
      alerts: gameState.alerts?.slice(0, 3), // Only top 3 alerts
      timestamp: gameState.timestamp
    };
  }
  
  getSuggestedQuestions(gameState: any): string[] {
    const suggestions = [];
    
    // If not initialized, suggest email
    if (!this.userInitialized) {
      return ['Enter your email to get started'];
    }
    
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
  
  // Reset user initialization (for testing)
  async resetUser() {
    this.userInitialized = false;
    this.conversationHistory = [];
    await chrome.storage.sync.remove(['userEmail', 'aiChatConfig']);
    console.log('[TLA Chat] User reset - email initialization required');
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