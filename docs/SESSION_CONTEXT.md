# TravianAssistant Session Context
*Last Updated: September 3, 2025 - MCP Server Architecture*

## Project Status: Chat Works, AI Needs Backend Access

### Current Reality (September 3, 2025)

#### ✅ What's ACTUALLY Working
1. **HUD displays** on Travian pages (minimal but functional)
2. **AI Chat** opens and connects to Claude via Vercel proxy  
3. **Basic data scraping** (population, current resources only)
4. **Chat interface mechanics** (drag/resize works)
5. **Backend stores data** (but AI doesn't know how to access it)

#### ❌ What's ACTUALLY Broken
1. **AI has no game awareness** - talks about ancient Egypt instead of Travian Egyptians
2. **AI can't access backend data** - doesn't know the endpoints exist
3. **Missing data collection**:
   - Culture points (production rate and total)
   - Hero data (window opens but empty)
   - Building levels and queues
   - Troop counts
4. **No memory/context persistence** - needs mem0.ai integration
5. **AI gets distracted** - searches entire web instead of focusing on Travian

### The MCP Server Solution

Instead of embedding game state in messages, we're treating the AI as an MCP client that queries the backend for data.

#### Architecture Change:
```
OLD: Extension → Package all data → Send with message → AI
NEW: Extension → Sync data to backend → AI queries backend as needed
```

#### Implementation Plan:
1. **Backend as MCP-style data server** with queryable endpoints
2. **AI gets explicit instructions** to query these endpoints
3. **System prompt constrains** AI to Travian Legends context
4. **mem0.ai integration** for context persistence

### System Components

#### Backend Server (Replit)
- **URL**: `https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev`
- **Status**: Operational, stores data
- **Endpoints**:
  - `/health` - Working ✅
  - `/game-data` - Returns game state ✅
  - `/sync-game-data` - Receives updates ✅
- **Issue**: AI doesn't know these exist

#### Vercel Proxy
- **URL**: `https://travian-proxy-simple.vercel.app/api/proxy`
- **Status**: Working perfectly ✅
- **Model**: `claude-sonnet-4-20250514`
- **Note**: This is NOT broken, works fine

#### Chrome Extension
- **HUD**: Shows population and current resources
- **Missing**: Culture points, hero data, buildings, troops
- **Chat**: Opens and works but AI lacks context

### Game Context
- **Server**: 2x speed server (ts20.x1.international.travian.com)
- **Tribe**: Egyptians
- **Phase**: Active gameplay (not game start)

## Priority Fixes (September 3, 2025)

### 1. Give AI Backend Access (IMMEDIATE)
Update system prompt to include:
```javascript
You have access to game data at:
GET ${CONFIG.backendUrl}/game-data
GET ${CONFIG.backendUrl}/villages
GET ${CONFIG.backendUrl}/account/${accountId}

Always query current data before answering.
```

### 2. Constrain to Travian Context
Add explicit game context:
```javascript
You are a Travian Legends strategic advisor.
This is about the online game, NOT historical facts.
User plays Egyptians on 2x speed server.
```

### 3. Fix Data Collection
Enhance scrapers for:
- Culture points (rate + total)
- Hero stats
- Building levels
- Troop counts

### 4. Add mem0.ai Integration
- Store game progression
- Remember strategies
- Track preferences

## File Locations

```
TravianAssistant/
├── server.js                    # Replit backend
├── packages/extension/dist/
│   ├── content.js              # Main extension code (LINE 220: sendMessage)
│   ├── manifest.json           # v1.1.0
│   └── styles.css             # HUD styling
└── docs/
    ├── SESSION_CONTEXT.md      # This file
    ├── TravianAssistantV4.md   # Philosophy doc
    └── context-intelligence.md # mem0.ai integration plan
```

## Critical URLs & Keys

### Production URLs
- **Backend**: `https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev`
- **Proxy**: `https://travian-proxy-simple.vercel.app/api/proxy`
- **Game**: `https://ts20.x1.international.travian.com`
- **Context Service**: `https://proceptra.app.n8n.cloud/mcp/context-tools` (TODO)

### Environment Variables
- **Replit**: `TLA_ANTHROPIC_API_KEY` in Secrets
- **Vercel**: `ANTHROPIC_API_KEY` in dashboard

## Development Rules

### DO:
- Edit in GitHub, pull to Replit
- Test changes on actual game page
- Use `/api/proxy` endpoint
- Model: `claude-sonnet-4-20250514`

### DON'T:
- Edit in Replit directly
- Try to fix node-fetch
- Change working proxy
- Build complex HUDs

## Testing Commands

```bash
# Test Backend
curl https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev/health

# Test Game Data
curl https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev/game-data

# Test AI Proxy
curl -X POST https://travian-proxy-simple.vercel.app/api/proxy \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is Travian Legends?"}],"model":"claude-sonnet-4-20250514","max_tokens":2000}'
```

## Session Summary

**Problem**: AI chat works but is useless - doesn't know about game or backend data.

**Solution**: Make AI aware of backend endpoints and constrain to Travian context.

**Next Steps**:
1. Update system prompt with backend access
2. Constrain AI to Travian Legends only
3. Fix data collection gaps
4. Add mem0.ai for persistence

---

*The AI needs to become game-aware and backend-connected. Everything else is working.*
