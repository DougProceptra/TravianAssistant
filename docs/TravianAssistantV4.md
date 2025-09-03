# TravianAssistant v4: AI-First Strategic Advisor
*Version 1.1.0 - September 3, 2025*

## Core Philosophy
**The AI Agent IS the Product** - Everything else is plumbing to feed data to the AI.

## Current State (September 3, 2025)

### Working ✅
- Chat interface connects to Claude via Vercel proxy
- Basic HUD shows population and current resources
- Data syncs to backend every 30 seconds
- Draggable/resizable chat window

### Broken ❌
- **AI is "blind"** - doesn't know backend endpoints exist
- **AI is unfocused** - talks about historical Egypt, not game
- **Data gaps** - missing culture points, hero, buildings, troops
- **No memory** - doesn't remember previous conversations

## The MCP Server Architecture

```
Game Page → Scraper → Backend (Data Server)
                           ↑
                      AI Queries
                           ↓
User Question → AI → Backend Request → Strategic Answer
```

### Key Insight
AI should **pull** data when needed, not receive everything **pushed** in each message.

## Implementation Priorities

### 1. Make AI Backend-Aware (IMMEDIATE)
```javascript
systemPrompt: `You are a Travian Legends strategic advisor.
You have access to real-time game data:
- GET ${backendUrl}/game-data - current game state
- GET ${backendUrl}/villages - all villages
- GET ${backendUrl}/account/{id} - account data

ALWAYS query current data before answering questions.`
```

### 2. Constrain to Game Context
```javascript
// Wrap every user message
`[CONTEXT: Travian Legends game, 2x server, Egyptian tribe]
Question: ${userMessage}
Respond ONLY about game strategy, not historical facts.`
```

### 3. Fix Data Collection
- Culture point production rate
- Culture points total
- Hero stats and items
- Building levels and queues
- Troop counts in each village

### 4. Add Memory (mem0.ai)
- Previous strategies discussed
- User preferences and play style
- Game progression history
- Learned patterns

## What This Is NOT
- NOT a dashboard with charts
- NOT a HUD showing game data
- NOT automation of actions
- NOT a calculator tool

## What This IS
- Strategic advisor that queries backend for data
- Learning system via mem0.ai
- Natural language game consultant
- Time-saving analysis partner

## Success Metrics

### Before (Current State)
**User**: "What should I build?"
**AI**: "The ancient Egyptians built pyramids..."

### After (Target State)
**User**: "What should I build?"
**AI**: *[queries backend]* "Your Village 2 has -230 crop/hour. Build cropland to level 5 (45 min) to stabilize."

## Technical Architecture

### Frontend (Extension)
- Scrapes game data
- Syncs to backend
- Provides chat UI
- Version: 1.1.0

### Backend (Replit)
- Stores game state
- Provides REST API
- MCP-style data server
- URL: `https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev`

### AI Proxy (Vercel)
- Routes to Claude API
- Handles CORS
- URL: `https://travian-proxy-simple.vercel.app/api/proxy`
- Model: `claude-sonnet-4-20250514`

### Context Service (mem0)
- Stores preferences
- Tracks patterns
- Remembers strategies
- URL: `https://proceptra.app.n8n.cloud/mcp/context-tools`

## Development Rules

### DO:
- Keep chat as primary interface
- Make AI query backend for data
- Focus on strategic advice
- Use mem0 for persistence

### DON'T:
- Build complex HUDs
- Display data user can see
- Automate game actions
- Pass huge contexts in messages

## The Critical Fix

```javascript
// OLD APPROACH (broken):
sendMessage(userMsg) {
  // Tries to embed all game data
  const context = { ...everything };
  // AI gets overwhelmed or empty data
}

// NEW APPROACH (MCP pattern):
sendMessage(userMsg) {
  const systemPrompt = "Query backend for data as needed";
  // AI pulls what it needs
}
```

## User Experience Flow

1. User asks question in chat
2. AI recognizes game query
3. AI fetches current data from backend
4. AI analyzes with Travian knowledge
5. AI provides strategic advice
6. System stores interaction in mem0

## Next Session Checklist

- [ ] Update system prompt with backend endpoints
- [ ] Add Travian context wrapper to messages
- [ ] Test "What should I build?" query
- [ ] Fix culture point scraping
- [ ] Implement hero data collection
- [ ] Connect mem0.ai service
- [ ] Test full conversation flow

---

*Remember: The AI chat IS the product. Data collection is invisible plumbing.*
