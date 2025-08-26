/**
 * Context Management for Travian AI Assistant
 * Integrates with context_tools service for continuous learning
 */

export interface TravianContext {
  // Server-specific patterns
  serverMeta: {
    name: string;
    speed: string;
    startDate: Date;
    currentPhase: 'early' | 'mid' | 'late' | 'endgame';
    topAlliances: Array<{ name: string; power: number; relationship: string }>;
  };
  
  // Player patterns learned
  playerPatterns: {
    preferredStrategies: string[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    playSchedule: { activeHours: number[]; timezone: string };
    strengthAreas: string[];
    weaknessAreas: string[];
  };
  
  // Opponent intelligence
  opponentProfiles: Map<string, {
    observedPatterns: string[];
    predictedGoals: string[];
    weaknesses: string[];
    lastUpdated: Date;
  }>;
  
  // Strategic decisions history
  decisions: Array<{
    context: string;
    decision: string;
    reasoning: string;
    outcome?: string;
    timestamp: Date;
  }>;
  
  // Successful tactics
  winningPlays: Array<{
    situation: string;
    action: string;
    result: string;
    replicable: boolean;
  }>;
}

export class ContextManager {
  /**
   * Store patterns after each session
   */
  async storeSessionLearnings(session: {
    decisions: any[];
    patterns: any[];
    insights: any[];
  }): Promise<void> {
    // Store to context_tools
    await this.contextTools.store({
      type: 'session_learning',
      data: session,
      timestamp: new Date(),
      confidence: this.assessConfidence(session),
    });
  }
  
  /**
   * Query before major decisions
   */
  async queryRelevantContext(situation: {
    type: 'attack' | 'settlement' | 'diplomacy' | 'resource_crisis';
    specifics: any;
  }): Promise<any> {
    // Query similar situations
    const similar = await this.contextTools.search({
      query: `${situation.type} ${JSON.stringify(situation.specifics)}`,
      limit: 5,
    });
    
    // Query opponent patterns if relevant
    if (situation.specifics.opponent) {
      const opponentHistory = await this.contextTools.search({
        query: `opponent:${situation.specifics.opponent}`,
        limit: 10,
      });
      similar.push(...opponentHistory);
    }
    
    return this.synthesizeContext(similar);
  }
  
  /**
   * Continuous learning loop
   */
  async learn(event: {
    prediction: string;
    actual: string;
    context: any;
  }): Promise<void> {
    const accuracy = this.assessAccuracy(event.prediction, event.actual);
    
    if (accuracy > 0.8) {
      // Reinforce successful pattern
      await this.contextTools.update({
        pattern: event.context,
        confidence: 'increase',
        evidence: event,
      });
    } else {
      // Learn from mistake
      await this.contextTools.store({
        type: 'prediction_error',
        expected: event.prediction,
        actual: event.actual,
        context: event.context,
        lesson: this.extractLesson(event),
      });
    }
  }
  
  /**
   * Key integration points with AI
   */
  async enhanceAIPrompt(basePrompt: string, situation: any): Promise<string> {
    const relevantContext = await this.queryRelevantContext(situation);
    
    return `
${basePrompt}

## Relevant Historical Context:
${JSON.stringify(relevantContext, null, 2)}

## Previous Patterns in Similar Situations:
${relevantContext.patterns.join('\n')}

## Lessons Learned:
${relevantContext.lessons.join('\n')}

Consider this context but adapt to current unique factors.
    `;
  }
}

/**
 * When to trigger context operations
 */
export const CONTEXT_TRIGGERS = {
  // Store context after
  STORE_AFTER: [
    'major_battle_complete',
    'settlement_complete', 
    'alliance_negotiation',
    'successful_defense',
    'resource_crisis_resolved',
    'daily_strategy_session',
  ],
  
  // Query context before  
  QUERY_BEFORE: [
    'attack_incoming',
    'settlement_decision',
    'artifact_spawn',
    'alliance_offer',
    'major_investment',
    'strategy_pivot',
  ],
  
  // Continuous monitoring
  MONITOR: [
    'opponent_behavior_change',
    'market_price_anomaly',
    'alliance_power_shift',
    'new_threat_detected',
  ],
};

/**
 * Integration with Chrome Extension
 */
export class ExtensionContextBridge {
  async initialize() {
    // Set up listeners for game events
    chrome.runtime.onMessage.addListener(async (message) => {
      if (CONTEXT_TRIGGERS.STORE_AFTER.includes(message.type)) {
        await this.storeContext(message);
      } else if (CONTEXT_TRIGGERS.QUERY_BEFORE.includes(message.type)) {
        const context = await this.queryContext(message);
        return { context };
      }
    });
  }
  
  async storeContext(event: any) {
    // Transform game event to context
    const contextData = this.transformEventToContext(event);
    
    // Store via context_tools
    await contextTools.store({
      operation: 'store',
      context_type: 'game_pattern',
      data: contextData,
    });
  }
  
  async queryContext(situation: any) {
    // Query relevant patterns
    const patterns = await contextTools.search({
      operation: 'search',
      query: this.buildContextQuery(situation),
    });
    
    return patterns;
  }
}
