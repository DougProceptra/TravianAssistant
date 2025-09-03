# Context Intelligence Integration (mem0.ai)
*Last Updated: September 3, 2025*

## Purpose
Provide persistent memory and learning capabilities to the TravianAssistant AI agent using mem0.ai or similar context persistence service.

## Current State
- ❌ No context persistence between sessions
- ❌ AI doesn't remember previous strategies
- ❌ No learning from user preferences
- ❌ Each conversation starts from zero

## Integration Plan

### 1. Context Service Endpoint
```javascript
const CONTEXT_SERVICE = 'https://proceptra.app.n8n.cloud/mcp/context-tools';
```

### 2. What to Store

#### Game Progression
- Settlement dates and locations
- Major milestones reached
- Resource production growth over time
- Military strength evolution

#### Strategic Decisions
- Build orders that worked/failed
- Timing decisions (when user settled, built troops)
- Resource management patterns
- Combat strategies employed

#### User Preferences
- Play style (aggressive, defensive, economic)
- Time availability (active hours, play frequency)
- Goals (top attacker, defender, WW holder)
- Risk tolerance

#### Conversation History
- Questions frequently asked
- Advice given and outcomes
- Corrections from user
- Successful strategies

### 3. Implementation Approach

#### On Each Interaction
```javascript
async function enhanceWithContext(userMessage) {
  // Retrieve relevant context
  const context = await fetch(`${CONTEXT_SERVICE}/retrieve`, {
    method: 'POST',
    body: JSON.stringify({
      query: userMessage,
      userId: CONFIG.accountId,
      gameId: 'ts20-egyptians'
    })
  });
  
  // Add to system prompt
  return `Previous context: ${context.data}
  Current question: ${userMessage}`;
}
```

#### After Each Response
```javascript
async function storeInteraction(question, response, gameState) {
  await fetch(`${CONTEXT_SERVICE}/store`, {
    method: 'POST',
    body: JSON.stringify({
      userId: CONFIG.accountId,
      interaction: {
        question,
        response,
        gameState: gameState.summary,
        timestamp: new Date().toISOString()
      }
    })
  });
}
```

### 4. Context Categories

#### Immediate Context (This Session)
- Current conversation thread
- Recent game actions
- Active decisions being discussed

#### Short-term Context (This Week)
- Daily patterns and routines
- Recent strategic decisions
- Current game phase strategies

#### Long-term Context (This Server)
- Overall strategy evolution
- Major successes and failures
- Learned preferences
- Optimal patterns discovered

### 5. Privacy & Security
- Context tied to accountId only
- No personally identifiable information
- Game-specific data only
- User can request context deletion

## Benefits

### Before mem0
**User**: "What should I build?"
**AI**: "What tribe are you? What's your current situation?"
*[User explains everything again]*

### After mem0
**User**: "What should I build?"
**AI**: "Based on our Egyptian speed-settle strategy from Tuesday, and since you just finished the Residence, start training settlers while building croplands to support them."

## Integration Points

### 1. Extension (content.js)
- Include context retrieval before AI query
- Store successful interactions
- Mark user corrections for learning

### 2. System Prompt Enhancement
```javascript
const systemPrompt = `You are a Travian Legends advisor with memory.
Context about this user: ${retrievedContext}
Their play style: ${preferences}
Previous successful strategies: ${patterns}`;
```

### 3. Learning Triggers
- User says "that worked"
- User corrects AI advice
- User reports outcome
- Milestone achieved

## Implementation Priority

### Phase 1: Basic Storage (Week 1)
- Store Q&A pairs
- Retrieve recent conversations
- Remember user tribe and server

### Phase 2: Pattern Recognition (Week 2)
- Identify successful strategies
- Track preference patterns
- Build user profile

### Phase 3: Predictive Assistance (Week 3)
- Anticipate needs based on game phase
- Suggest proven strategies
- Warn about previous mistakes

## Success Metrics
- Reduced explanation needed from user
- More relevant advice on first try
- Remembered strategies across sessions
- Improved outcomes from following advice

## Technical Requirements
- mem0.ai API key or equivalent service
- Async context retrieval (<500ms)
- Structured data storage
- Query optimization for relevance

## Example Stored Context
```json
{
  "userId": "user_abc123",
  "gameProfile": {
    "server": "ts20",
    "tribe": "egyptians",
    "playStyle": "aggressive-expander",
    "dailyActive": "18:00-22:00"
  },
  "successfulPatterns": [
    "Early culture push for fast settlement",
    "Trade route automation for resource balance",
    "Hero adventures prioritized for resources"
  ],
  "currentPhase": "mid-game expansion",
  "recentDecisions": [
    {
      "date": "2025-09-02",
      "decision": "Settle 15-cropper at (x,y)",
      "outcome": "successful"
    }
  ]
}
```

## Next Steps
1. Set up mem0.ai account or equivalent
2. Create context storage schema
3. Add retrieval to chat flow
4. Implement storage after interactions
5. Test context continuity

---

*Memory transforms a chatbot into a strategic partner.*
