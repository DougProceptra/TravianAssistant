# SESSION_CONTEXT.md
*Last Updated: September 1, 2025 - READY FOR v1.1.0*

## 🎯 MISSION CRITICAL PRIORITIES

### Priority 1: Fix Real-Time Data Scraping ⚠️ CRITICAL
**Problem:** Scrapers find data but AI receives empty/zero values
**Solution:** Fix data pipeline from scraper → AI context
**Success Metric:** AI can answer "What village am I in?" and "What's my production?"

### Priority 2: Connect to Backend Server
**Goal:** Validate complete game data structures
**Required Data:** Buildings, troops, hero, game mechanics
**Success Metric:** Backend has accurate, complete game state

### Priority 3: Context Intelligence Integration
**Service:** https://proceptra.app.n8n.cloud/mcp/context-tools
**Method:** context_intelligence capability
**User ID:** Hashed email from extension options
**Success Metric:** Every AI interaction stored and learning

### Priority 4: End-to-End Testing
**Environment:** New game server (Sept 1, 2025)
**Focus:** Complete workflow validation
**Success Metric:** Strategic advice based on actual game state

## 🔧 TECHNICAL SPECIFICATIONS

### Claude Model
- **Model:** claude-sonnet-4-20250514
- **Proxy:** travian-proxy-simple (Vercel)

### Version Management
- **ALL COMPONENTS:** v1.1.0 (manifest, extension, agent)

### Required Game Context
```javascript
{
  user: hashedEmail,
  currentVillage: { id, name, coordinates, population },
  allVillages: [...],
  totals: { villages, population, culturePoints, production },
  currentPage: "dorf1.php"
}
```

### Context Intelligence Service
- **URL:** https://proceptra.app.n8n.cloud/mcp/context-tools
- **Capability:** context_intelligence
- **User ID:** Hashed email from options page
- **Storage:** Every request/response pair

## ✅ WHAT WORKS (DO NOT BREAK)
- Chat interface drag/resize (v0.9.5 code)
- Basic scraping (finds villages but doesn't pass to AI)
- Proxy connection to Claude

## ❌ WHAT'S BROKEN
- Data pipeline (scraper → AI context)
- Version management (keeps resetting)
- Game context not reaching AI

## 🚀 NEXT SESSION START PROTOCOL
1. Set all versions to 1.1.0
2. Verify claude-sonnet-4-20250514 in proxy
3. Fix data pipeline (Priority 1)
4. Follow implementation checklist

## ⚡ CRITICAL REMINDERS
- **DO NOT** create complex HUDs - AI chat is the interface
- **DO NOT** break working drag/resize functionality
- **DO NOT** add exports to content scripts
- **ALWAYS** include full game context with AI queries
- **FOCUS** on strategic advice, not data display

---
*The AI agent is the product. Everything else is just plumbing.*