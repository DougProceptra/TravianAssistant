# TravianAssistant Development Guide

## ⚠️ CRITICAL: READ THIS FIRST ⚠️

### The Most Important Things to Know
1. **Build uses `-fixed.ts` files** - The build script uses `index-fixed.ts` and `conversational-ai-fixed.ts`, NOT the regular versions
2. **Proxy URL**: `https://travian-proxy-simple.vercel.app/api/proxy` (NOT any other URL)
3. **API Method**: Use `safeScraper.getGameState()` NOT `scrapeCurrentState()`
4. **Background Handler**: Must handle `CHAT_MESSAGE` type
5. **Replit Path**: `~/workspace` (NOT `/home/runner/TravianAssistant`)

## Project Structure

```
TravianAssistant/
├── packages/extension/          # Chrome Extension
│   ├── src/
│   │   ├── content/
│   │   │   ├── index.ts               # IGNORED by build
│   │   │   ├── index-fixed.ts         # ← ACTUAL ENTRY POINT
│   │   │   ├── conversational-ai.ts   # IGNORED by build  
│   │   │   ├── conversational-ai-fixed.ts # ← ACTUAL CHAT UI
│   │   │   ├── safe-scraper.ts        # Data collection
│   │   │   └── overview-parser.ts     # Village parsing
│   │   └── background.ts               # Service worker
│   ├── build-simple.sh                 # Build script (USES -fixed.ts files!)
│   └── dist/                           # Built extension (download this)
├── backend/                     # SQLite backend (port 3002)
│   ├── server-sqlite-fixed.js  # Current working server
│   └── travian.db              # Database with map data
└── docs/
    ├── SESSION_CONTEXT.md      # Session state (UPDATE FREQUENTLY)
    └── DEVELOPMENT_GUIDE.md   # This file

```

## Build Process

### How the Extension Actually Builds
```bash
cd ~/workspace/packages/extension
./build-simple.sh
```

**What happens:**
1. Auto-increments version in manifest.json
2. Bundles `src/content/index-fixed.ts` → `dist/content.js`
3. Bundles `src/background.ts` → `dist/background.js`
4. Uses rollup first, falls back to esbuild if it fails
5. Creates dist/ folder ready for Chrome

### Why -fixed.ts Files?
Historical evolution created parallel versions:
- Original files had issues
- Rather than break working code, `-fixed.ts` versions were created
- Build script was updated to use `-fixed.ts` files
- Original files left in place but IGNORED

**⚠️ ALWAYS EDIT THE -fixed.ts FILES!**

## Common Pitfalls & Solutions

### Problem: "Chat doesn't connect to AI"
**Symptoms**: "Failed to get response" error
**Causes & Fixes**:
1. Wrong proxy URL → Use `https://travian-proxy-simple.vercel.app/api/proxy`
2. Wrong method call → Use `safeScraper.getGameState()` not `scrapeCurrentState()`
3. Background handler missing → Ensure `CHAT_MESSAGE` case exists
4. Editing wrong file → Edit `conversational-ai-fixed.ts` not `conversational-ai.ts`

### Problem: "Changes don't appear after rebuild"
**Cause**: Editing the wrong file
**Fix**: Edit `-fixed.ts` versions, not regular `.ts` files

### Problem: "Window position doesn't persist"
**Cause**: Not saving to chrome.storage.local
**Fix**: Ensure windowState is saved on drag/resize/close

## API Architecture

### Data Flow
```
Game Page → Content Script → Background Service → Vercel Proxy → Claude API
                ↓                                       ↓
         IndexedDB (local)                    (No backend currently)
```

### Message Types (Background Service)
- `CHAT_MESSAGE` - Chat interface messages
- `ANALYZE_GAME_STATE` - HUD analysis request
- `SET_USER_EMAIL` - Initialize user profile
- `PING` - Test connection

### Vercel Proxy
- URL: `https://travian-proxy-simple.vercel.app/api/proxy`
- Handles Anthropic API key
- Adds CORS headers
- Simple standalone deployment (NOT in main repo)

## Current State (Aug 28, 2025)

### ✅ Working
- Data scraping (8 villages confirmed)
- HUD display
- Chat UI (drag, resize, persist)
- Vercel proxy connection
- SQLite backend with map data

### 🔧 Recent Fixes (v0.9.11)
- Fixed API method call
- Added window state persistence
- Removed hardcoded sample content

### ❌ Known Issues
- Multi-village analysis incomplete
- No backend sync (only local storage)
- Cost optimization needed

## Development Workflow

### Before Making Changes
1. **Check build script** - See what files it actually uses
2. **Trace imports** - Follow the import chain from entry point
3. **Review this guide** - Check for gotchas
4. **Update SESSION_CONTEXT.md** - Keep it current

### Testing Changes
1. Run build: `./build-simple.sh`
2. Download dist/ folder from Replit
3. Reload extension in Chrome
4. Check browser console for errors
5. Check service worker console

### After Making Changes
1. **Update this guide** if you discovered new gotchas
2. **Update SESSION_CONTEXT.md** with current state
3. **Commit working version** immediately
4. **Document WHY** not just what

## Version History

### v0.9.11 (Aug 28, 2025)
- Fixed chat API connection
- Added window state persistence
- Removed sample content
- **CRITICAL**: Discovered build uses -fixed.ts files

### v0.9.10 (Aug 28, 2025)
- Attempted fixes on wrong files
- Issue: Edited conversational-ai.ts instead of conversational-ai-fixed.ts

### v0.9.9 (Aug 27, 2025)
- Chat UI working but not persistent
- API connection issues

## Questions to Ask Before Coding

1. **Which file does the build actually use?**
2. **What's the entry point?**
3. **Is there a -fixed version?**
4. **What imports this file?**
5. **Will this break existing functionality?**

## Emergency Fixes

### If Nothing Works
```bash
# Check what's actually running
cd ~/workspace/packages/extension
grep -r "scrapeCurrentState\|getGameState" dist/

# Check which proxy URL is in use
grep -r "proxy" dist/

# Verify build is using correct files
cat build-simple.sh | grep "index"
```

### Reset to Known Good State
```bash
git checkout main
git pull
./build-simple.sh
```

---

**Remember**: The codebase has evolved through many iterations. Not everything is clean or logical. When in doubt, trace the actual execution path rather than assuming the obvious path.