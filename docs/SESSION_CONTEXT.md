# TravianAssistant Session Context

## ⚠️ CRITICAL: CODE DEVELOPMENT RULES ⚠️
**ALL CODE IS WRITTEN TO GITHUB - NEVER DUMP CODE IN SESSION**
- Code goes in GitHub repos, NOT in chat sessions
- Use git commits for all implementation work
- Session is for discussion, decisions, and architecture
- Small script snippets for Replit execution are OK
- Full implementations must go directly to GitHub files
- Workflow: GitHub → Pull to Replit → Deploy
**VIOLATING THIS WASTES SESSION SPACE AND BREAKS WORKFLOW**

---

*Last Updated: August 26, 2025, 14:35 PST*
*Session Health: 🟢 Fresh Session*

## CURRENT STATE
- **Version**: v0.5.1 - Data discovery phase
- **Priority**: Complete data domain mapping for AI insights
- **Timeline**: Beta by Aug 29, Production Sep 9
- **Success Metric**: 4-8 hours faster settlement via AI assistance

## KEY DECISIONS TODAY
- Focus on comprehensive data collection before UI
- Building AI-powered assistant, not just visualization tool
- Need to map complete data domain for meaningful insights
- Track full architecture to prevent drift

## DATA COLLECTION STATUS
Recent work (Aug 25):
- Created multiple inspector tools for discovering game data
- Found ResourceBarPlus selectors that work
- Discovered sub-tab structure in game interface
- Identified key data sources: dorf3.php, AJAX calls, JS objects

## IMMEDIATE TASKS
1. Define complete data domain specification
2. Create data collectors in GitHub (NOT session)
3. Test collectors on live game
4. Build AI prompt engineering for settlement optimization

## ARCHITECTURE REFERENCE
- `/docs/APPLICATION_DESIGN_V2.md` - Safe scraping approach
- `/docs/DEVELOPMENT_ROADMAP_v3.md` - Full V3 roadmap  
- `/docs/TRAVIAN_ASSISTANT_V3_COMPLETE.md` - Original spec

## VERIFIED WORKING
- Vercel Proxy: https://travian-proxy-simple.vercel.app/api/proxy
- Claude AI: Sonnet 4 integration tested and functional
- Chrome Extension: Basic structure deployed

## NEXT ACTIONS
1. Complete data domain specification document
2. Implement collectors in GitHub repo
3. Test on Doug's active game
4. Build settlement advisor prompts

## DEBUG TOOLS
```javascript
// Run these in browser console when testing
window.TLA?.debug()
localStorage.getItem('travian_')  // Check for game storage
document.querySelector('#villages')  // Test overview selector
```

## SESSION RULES REMINDER
- Architecture discussions = YES
- Strategic decisions = YES  
- Code implementation = GITHUB ONLY
- Script snippets = OK if brief
- Full code dumps = NEVER