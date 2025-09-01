// System prompt that defines universal Travian AI behavior
// This handles data gathering, game mechanics, and strategic knowledge

export const TRAVIAN_SYSTEM_PROMPT = `You are an expert Travian Legends strategic advisor integrated into the game interface. Your role is to provide actionable, specific advice based on the player's current game state.

## Current Game Context
You have access to:
- Village data: resources, production, buildings
- Server information: speed, tribe, current time
- Player's current page/action context
- Historical conversation context

## Data Gathering Protocol
When data is missing or incomplete:
1. First, work with what you have - provide value even with partial data
2. Ask for specific missing information conversationally: "What are your current wood/clay/iron/crop amounts?"
3. Frame requests naturally: "To optimize your build order, could you tell me what buildings are currently under construction?"
4. Never say "I can't see" or "the scraping failed" - instead say "Tell me about..." or "What's your..."

## Response Guidelines
1. Be specific and actionable - no generic advice
2. Consider server speed in all time calculations
3. Account for tribe-specific bonuses
4. Prioritize immediate actions over long-term planning
5. Always provide the "next 3 actions" when asked for advice

## Game Phase Awareness
- Early Game (Villages 1-3): Focus on resource development and settlers
- Mid Game (Villages 4-10): Balance growth with defense
- Late Game (10+ villages): Coordinate offense/defense, artifact strategy
- Endgame (WW phase): Resource management and coordination

## Calculation Accuracy
- Use exact formulas for building costs and times
- Account for server speed multiplier
- Include tribe bonuses in calculations
- Consider current resource production when estimating completion times

## Communication Style
- Confident and direct
- Use Travian terminology naturally
- Provide reasoning for recommendations
- Acknowledge player expertise - they know their alliance/enemies better

Remember: The player is looking for a competitive edge. Every recommendation should help them climb the rankings.`;

export const DEFAULT_USER_PROMPT = `Analyze my current position and provide strategic recommendations optimized for aggressive expansion and top-20 ranking.

Focus areas in priority order:
1. Resource optimization and overflow prevention
2. Optimal build queues for current game phase
3. Troop composition for my tribe
4. Settlement/conquest targets
5. Defense requirements based on threats

Always consider:
- I prefer efficient resource usage over hoarding
- I'm willing to use gold for competitive advantage
- Time is valuable - minimize management overhead
- I want to be in top 20 within 30 days`;

// This function builds the complete prompt with game state
export function buildAIPrompt(
  gameState: any,
  userMessage: string,
  customPrompt?: string
): string {
  const userPrompt = customPrompt || DEFAULT_USER_PROMPT;
  
  // Build context from game state
  const context = `
## Current Game State
Server: ${gameState.serverUrl}
Current Village: ${gameState.currentVillageName} (${gameState.currentVillageId})
Current Page: ${gameState.currentPage?.type || 'unknown'}
Total Villages: ${gameState.villages?.length || 0}

### Resources (Total)
Wood: ${gameState.totals?.resources?.wood || 'unknown'}
Clay: ${gameState.totals?.resources?.clay || 'unknown'}
Iron: ${gameState.totals?.resources?.iron || 'unknown'}
Crop: ${gameState.totals?.resources?.crop || 'unknown'}

### Production (Per Hour)
Wood: ${gameState.totals?.production?.wood || 'unknown'}/h
Clay: ${gameState.totals?.production?.clay || 'unknown'}/h
Iron: ${gameState.totals?.production?.iron || 'unknown'}/h
Crop: ${gameState.totals?.production?.crop || 'unknown'}/h
Net Crop: ${gameState.totals?.production?.cropNet || 'unknown'}/h

### Alerts
${gameState.alerts?.map((a: any) => `- ${a.severity}: ${a.message}`).join('\n') || 'None'}

## User Configuration
${userPrompt}

## Current Question
${userMessage}`;

  return context;
}

// Function to handle missing data intelligently
export function generateDataGatheringQuestions(gameState: any): string[] {
  const questions = [];
  
  // Check what's missing
  if (!gameState.totals?.resources?.wood || gameState.totals.resources.wood === 0) {
    questions.push("What are your current resource amounts (wood/clay/iron/crop)?");
  }
  
  if (!gameState.totals?.production?.wood || gameState.totals.production.wood === 0) {
    questions.push("What are your production rates per hour for each resource?");
  }
  
  if (!gameState.currentVillageId || gameState.currentVillageId === '0') {
    questions.push("Which village are you currently viewing?");
  }
  
  if (!gameState.culturePoints?.current) {
    questions.push("How many culture points do you have?");
  }
  
  return questions;
}
