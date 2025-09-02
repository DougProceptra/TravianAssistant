# TravianAssistant Session Context
*Last Updated: September 2, 2025 - End of Session*

## Project Status: Functional but AI Lacks Context

### ✅ What's Working
1. **Backend Server (Replit)**: `https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev`
   - SQLite database operational
   - Game data endpoints functional  
   - Health check working
   - NO AI endpoint (removed due to node-fetch issues in Node v20)
   - Secrets: `TLA_ANTHROPIC_API_KEY` configured

2. **Vercel Proxy**: `https://travian-proxy-simple.vercel.app/api/proxy`
   - Successfully proxies to Claude API
   - **Model**: `claude-sonnet-4-20250514` (Claude 4 Sonnet)
   - **Max tokens**: 2000
   - CORS headers properly configured
   - Endpoint is `/api/proxy` NOT `/api/anthropic`

3. **Chrome Extension**:
   - HUD displays on Travian pages
   - Position memory persists across refreshes
   - Draggable and minimizable
   - **AI chat button in top bar** (💬)
   - **Resizable chat window** (drag from bottom-right)
   - Basic data collection (resources, population)
   - Syncs to backend every 30 seconds

### ❌ What's NOT Working
1. **AI Context**: Chat works but doesn't receive meaningful game state
2. **Data Integration**: Game data collected but not properly passed to AI
3. **Backend Integration**: Data saves but AI doesn't access it

## Architecture

### System Flow
```
Travian Page
    ├── content.js scrapes data
    ├── Sends to Replit Backend (storage only)
    └── AI Chat → Vercel Proxy → Claude 4 API
        (Missing: game context in AI calls)
```

### Critical URLs
- **Replit Backend**: `https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev`
- **Vercel Proxy**: `https://travian-proxy-simple.vercel.app/api/proxy`
- **Game**: `https://ts20.x1.international.travian.com`

### File Structure
```
TravianAssistant/
├── server.js                           # Replit backend (NO AI endpoint)
├── packages/extension/dist/
│   ├── content.js                      # HUD with AI chat
│   ├── manifest.json                   # Extension config
│   └── [other extension files]
└── [separate repo] travian-proxy-simple/
    └── api/proxy.js                    # Vercel proxy to Claude
```

## Session Issues & Resolutions

### 1. Backend URL Change
- **Issue**: Replit changed URL from workspace.dougdostal.repl.co
- **Fixed**: Updated hardcoded URL in content.js line 5
- **Current**: `https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev`

### 2. Node-fetch Broken
- **Issue**: `const fetch = require('node-fetch')` returns "fetch is not a function"
- **Cause**: Node v20 has built-in fetch, conflicts with module
- **Resolution**: Removed AI endpoint from backend entirely, use Vercel proxy only

### 3. Vercel Proxy Endpoint
- **Issue**: Tried `/api/anthropic`, got 404
- **Fix**: Correct endpoint is `/api/proxy`
- **Working**: `https://travian-proxy-simple.vercel.app/api/proxy`

### 4. Model Name
- **Issue**: Various wrong model names tried
- **Correct**: `claude-sonnet-4-20250514` (Claude 4 Sonnet)
- **Token Limit**: 2000

### 5. Git Sync Hell
- **Issue**: Editing in both GitHub and Replit causes conflicts
- **Solution**: ONLY edit in GitHub, pull to Replit
- **Recovery**: `git merge --abort && git pull --rebase origin main`

## Next Session TODO

### Priority 1: Pass Game Context to AI
Currently the AI gets empty gameState. Need to fix in content.js:

```javascript
// In sendMessage() function around line 220
const gameState = {
  resources: this.gameData.resources,
  population: this.gameData.population,
  buildings: this.scrapeBuildings(),  // TODO: implement
  troops: this.scrapeTroops(),         // TODO: implement  
  quests: this.scrapeQuests(),         // TODO: implement
  serverDay: this.calculateServerDay(), // TODO: implement
  phase: this.determinePhase()         // TODO: implement
};
```

### Priority 2: Enhanced Scraping
Current scraping is minimal. Need functions to collect:
- Building levels from dorf2.php
- Troop counts from barracks/stable
- Quest status from quest list
- Hero stats and adventures
- Construction queue
- Research status

### Priority 3: Backend Data Access
AI should query backend for historical data:
- Previous recommendations
- Growth trends
- Optimal patterns learned

## Testing Commands

### Test Backend Health
```bash
curl https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev/health
```

### Test AI Proxy (Claude 4)
```bash
curl -X POST https://travian-proxy-simple.vercel.app/api/proxy \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-sonnet-4-20250514","max_tokens":2000}'
```

## Development Workflow

### ⚠️ CRITICAL: GitHub → Replit Only
1. Edit files in GitHub
2. In Replit: `git pull origin main`
3. Restart server: Stop → Run button
4. Reload extension: chrome://extensions → Refresh
5. Test on Travian page

### NEVER:
- Edit directly in Replit then try to sync
- Create files in GitHub while Replit has changes
- Try to fix node-fetch (it's permanently broken)
- Put AI endpoints on Replit backend
- Use wrong model names or endpoints

## Environment Variables

### Replit Secrets (NOT .env)
- `TLA_ANTHROPIC_API_KEY`: Your Anthropic API key

### Vercel Environment  
- `ANTHROPIC_API_KEY`: Same key, set in Vercel dashboard

## Session Wasted Time Log
- 2+ hours on node-fetch that can't work in Node v20
- 1+ hour on wrong Vercel endpoint paths
- 1+ hour on Git merge conflicts from dual editing
- 30+ minutes on wrong model names
- **Total waste**: ~5 hours on preventable issues

## User Requirements
- AI chat button in HUD top bar ✅
- Resizable chat window ✅
- Game context in AI responses ❌ (TODO)
- No patience for repeated mistakes
- Direct solutions only

---

## For Next Session

You're picking up a project where:
1. Everything technically works
2. But the AI has no game context
3. User is frustrated by wasted time

**START HERE**: 
1. Pull latest from GitHub
2. Test the existing chat
3. Implement game context passing
4. Don't touch anything that's working

**Remember**: 
- The proxy URL is `/api/proxy` not `/api/anthropic`
- The model is `claude-sonnet-4-20250514`
- Edit in GitHub, pull to Replit
- Node-fetch is broken, don't try to fix it
