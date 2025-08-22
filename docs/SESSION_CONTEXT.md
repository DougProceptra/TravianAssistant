# TravianAssistant Session Context
*Last Updated: August 22, 2025, 13:45 PST*
*Session Health: 🟢 Fresh*

## CURRENT STATE
- **Working**: Safe scraping v0.5.0 - Overview parser + AJAX interceptor (no navigation)
- **Proxy**: Operational at https://travian-proxy-simple.vercel.app/api/proxy
- **Focus**: Planning next phase - need to test current implementation first
- **Next Step**: Pull latest changes and test safe scraping on actual game

## RECENT CHANGES
- Completed context management system design (Aug 22)
- Refactored to safe scraping without navigation (Aug 21 evening)
- Removed navigation-based village switching (Aug 21)

## BLOCKERS & ISSUES
- Need to verify selector compatibility with Doug's specific Travian server
- Safe scraping implementation not yet tested on live game

## ARCHITECTURE & DESIGN
- See: `/docs/APPLICATION_DESIGN_V2.md` for full architecture
- See: `/docs/DEVELOPMENT_ROADMAP_v3.md` for roadmap
- Recent Decision: Use overview page parsing + AJAX interception instead of navigation

## KEY TECHNICAL DETAILS
Safe Data Collection System:
- `overview-parser.ts` - Fetches `/dorf3.php` for ALL villages
- `ajax-interceptor.ts` - Monitors game's AJAX calls
- `safe-scraper.ts` - Combines all data sources
- NO NAVIGATION = NO GAMEPLAY INTERRUPTION

## ENDPOINTS & SERVICES
- Vercel Proxy: https://travian-proxy-simple.vercel.app/api/proxy - ✅ Working
- Claude AI: Sonnet 4 integration - ✅ Functional
- Build: Ready to test after pulling latest

## PENDING DECISIONS
- Which features to prioritize after testing (map scanner vs alliance tools)
- Selector compatibility approach if current ones don't work

## DEBUG COMMANDS
```javascript
window.TLA.debug()           // Check current state
window.TLA.state()           // Get detailed state
window.TLA.overviewParser.fetchAllVillages() // Test parser
window.TLA.ajaxInterceptor.isActive()       // Check AJAX
```

## NOTES
- Context management system established with 3 layers
- SESSION_CONTEXT.md is living document (3-5 updates per session)
- Pattern recognition via context_intelligence tool
