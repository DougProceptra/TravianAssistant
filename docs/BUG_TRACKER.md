# Known Issues & Bug Tracker

## 🔴 CRITICAL: Data Pipeline Bug

**Status**: BROKEN  
**Version**: v0.9.5  
**Priority**: HIGHEST  
**First Observed**: September 1, 2025  

### Description
The overview parser successfully finds all 9 villages, but the content script receives 0 villages. This breaks the entire data flow to the AI agent.

### Console Evidence
```javascript
content.js:48 [TLA Overview] Successfully parsed 9 villages  ✅
content.js:2474 [TLA Content] Found 0 villages              🔴
```

### Location
- **File**: `packages/extension/src/content/index.ts`
- **Lines**: Around line 2474
- **Parser**: `packages/extension/src/scrapers/overview-parser.ts`

### Probable Cause
The content script is likely calling the wrong method or not awaiting an async call:

```javascript
// Current (broken):
const villages = overviewParser.getAllCachedVillages(); 

// Likely fix:
const villages = await overviewParser.getAllVillages();
// OR
const villages = overviewParser.getParsedVillages();
```

### Investigation Steps
1. Check what methods the overview parser exports
2. Verify if the parser stores data that needs to be retrieved
3. Check if there's an async/await issue
4. Verify the data is actually being stored after parsing

### Workaround
None currently. The bug prevents all game data from reaching the AI.

---

## ⚠️ Version Management Issue

**Status**: Annoying but manageable  
**Version**: All versions  
**Priority**: Low  

### Description
Build system keeps resetting version to "1.0.0" instead of maintaining correct version.

### Workaround
After each build:
```bash
sed -i 's/"version": "1.0.0"/"version": "0.9.5"/' dist/manifest.json
```

### Files That Need Sync
1. `build-minimal.sh` - VERSION="0.9.5"
2. `src/version.ts` - VERSION = '0.9.5'
3. `manifest.json` - "version": "0.9.5"

---

## ✅ Fixed Issues

### Chat UI Drag & Resize (FIXED in v0.9.5)
- **Problem**: Chat window wasn't draggable or resizable
- **Solution**: Implemented in commit a00eca9
- **Status**: Working correctly

### API Connection (FIXED)
- **Problem**: Direct calls to Anthropic API blocked by CORS
- **Solution**: Vercel proxy at `/api/anthropic.js`
- **Status**: Working correctly

---

## 📋 Testing Checklist

When testing fixes:

### Data Pipeline
- [ ] Open village overview (dorf3.php)
- [ ] Check console for "Successfully parsed X villages"
- [ ] Check console for "Found X villages" (should match)
- [ ] Ask AI "How many villages do I have?"
- [ ] AI should report correct number

### Chat Interface
- [ ] Chat button appears on game page
- [ ] Chat window opens when clicked
- [ ] Can drag window by header
- [ ] Can resize from corner
- [ ] Position persists on close/reopen
- [ ] Messages send to AI
- [ ] AI responses appear

### API Connection
- [ ] No CORS errors in console
- [ ] API requests go through Vercel
- [ ] Responses return within 5 seconds

---

## 🚫 Non-Issues (Working as Intended)

### No HUD Elements
This is intentional. The AI chat is the only interface.

### No Data Displays
This is intentional. The AI interprets and explains data.

### Simple Chat UI
This is intentional. Complexity is in the AI, not the UI.

---

## 📝 Notes for Developers

1. **Always test with v0.9.5 base** (commit a00eca9)
2. **Don't add UI features** - fix data pipeline first
3. **Check both console logs** - parser AND content script
4. **Test with actual game** - not mock data

---

*Last Updated: September 1, 2025*
