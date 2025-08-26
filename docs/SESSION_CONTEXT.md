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

*Last Updated: August 26, 2025, 14:40 PST*
*Session Health: 🟢 Fresh Session*

## CURRENT FOCUS
Building comprehensive data collectors to feed AI-powered settlement optimization that saves 4-8 hours.

## TODAY'S PRIORITIES
1. ✅ Data domain specification created (`/docs/DATA_DOMAIN_SPEC.md`)
2. 🔄 Implement master data collector system
3. 🔄 Test with Doug's active game
4. 🔄 Build settlement advisor AI prompts

## KEY DECISIONS
- **Architecture First**: Full data collection before UI
- **AI-Powered**: Not just visualization, but strategic advice
- **Beta Timeline**: Aug 29 (3 days)
- **Production**: Sep 9
- **Success Metric**: 4-8 hours faster settlement

## DISCOVERED INSPECTOR TOOLS
Found multiple inspector scripts in `/scripts/`:
- `inspect-travian-data.js` - Basic page inspector
- `inspect-travian-data-v2.js` - Enhanced version
- `inspect-all-pages.js` - Multi-page crawler
- `simple-page-inspector.js` - Lightweight inspector

These provide foundation for understanding game structure.

## IMPLEMENTATION PLAN

### Phase 1: Data Collectors (Today-Tomorrow)
1. Create master collector orchestrator
2. Implement overview parser (dorf3.php)
3. Add AJAX interceptor
4. Build memory/storage collectors
5. Test on live game

### Phase 2: AI Integration (Aug 27-28)
1. Settlement timing calculator
2. Claude prompt engineering
3. Action recommendation system
4. Test with beta users

### Phase 3: Extension Polish (Aug 29)
1. Package for team distribution
2. Simple installation process
3. Documentation
4. Beta release

## NEXT IMMEDIATE ACTIONS
1. Create `/packages/extension/src/collectors/` structure
2. Implement `master-collector.ts`
3. Build `overview-parser.ts` based on inspector findings
4. Test selectors on Doug's game

## TESTING COMMANDS
```bash
# In Replit after sync
cd /home/runner/TravianAssistant
git pull origin main
npm install
npm run build:extension

# Test inspector on game
node scripts/simple-page-inspector.js
```

## FILES TO CREATE
- `/packages/extension/src/collectors/master-collector.ts`
- `/packages/extension/src/collectors/overview-collector.ts`
- `/packages/extension/src/collectors/ajax-interceptor.ts`
- `/packages/extension/src/collectors/memory-collector.ts`
- `/packages/extension/src/ai/settlement-advisor.ts`
- `/packages/extension/src/ai/prompt-builder.ts`

## VERIFIED WORKING
- Vercel Proxy: https://travian-proxy-simple.vercel.app/api/proxy
- Chrome Extension structure exists
- Inspector tools functional

## NOTES
- Use existing inspector findings for selectors
- Focus on settlement optimization first
- Keep AI prompts concise but comprehensive
- Test everything on live game before beta