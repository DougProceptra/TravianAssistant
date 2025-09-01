# CRITICAL STATE - September 1, 2025

## ⚠️ REGRESSION ALERT
We've broken more than we've fixed. Current state is WORSE than v0.9.5.

## What We Broke Today
1. ✅ Villages now parse (9 found) BUT don't reach AI
2. ❌ Chat UI drag/resize works BUT messages don't send
3. ❌ Game state not passed to AI context
4. ❌ Version still stuck at 1.0.5 (should be 1.1.0)

## Root Cause Analysis
- **Problem 1**: We fixed parsing but broke the data pipeline to AI
- **Problem 2**: Restored UI code but didn't connect message handling
- **Problem 3**: Background script not receiving/processing messages
- **Problem 4**: Game context not being included in AI calls

## Files Changed Today (DO NOT LOSE)
- `overview-parser-v6.ts` - GOOD, keep this
- `conversational-ai-restored.ts` - PARTIAL, needs message handling
- `index-noexport.ts` - GOOD, fixes export error

## Recovery Plan for Next Session

### Option A: Surgical Fix (Recommended)
```bash
# 1. Keep the good parser
cp src/content/overview-parser-v6.ts src/content/overview-parser.ts

# 2. Revert to working v0.9.5 chat
git show v0.9.5:packages/extension/src/content/conversational-ai.ts > src/content/conversational-ai.ts

# 3. Fix the background message handler
# Need to ensure background.js passes gameContext to AI
```

### Option B: Full Revert
```bash
git checkout v0.9.5 -- packages/extension/src
git cherry-pick [commits with parser fix]
```

## Critical Issues to Fix

### 1. Message Handler (background.js)
```javascript
// MUST handle these messages:
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHAT_MESSAGE') {
    // Include gameContext in AI call
    callAI(request.message, request.gameContext)
      .then(reply => sendResponse({reply}));
    return true;
  }
});
```

### 2. Game Context Pipeline
```javascript
// conversational-ai.ts must:
1. Get game state from safeScraper
2. Include it in message to background
3. Background must pass it to AI proxy
```

### 3. Version Management
- ALL files must use VERSION from version.ts
- Manifest, extension, all components = 1.1.0

## Console Analysis
- ✅ Parser working: "Parsed village 2: 000" etc
- ✅ 9 villages found and stored
- ❌ Chat initialized but not connected
- ❌ "Found 0 villages" on first load (cache issue)

## DO NOT ATTEMPT
- Complex refactoring
- New features
- Architecture changes

## JUST FIX
1. Message passing from chat → background → AI
2. Include game context in every AI call
3. Set version to 1.1.0 everywhere

## Test Checklist
- [ ] Can send message in chat
- [ ] AI receives game context
- [ ] AI knows current village
- [ ] Drag/resize still works
- [ ] Version shows 1.1.0

## Emergency Rollback
If next session fails:
```bash
git checkout 98b28e8e  # Last known good
cp overview-parser-v6.ts ...  # Keep only the parser fix
```

---
**STATUS: CRITICAL - Extension partially broken**
**RISK: High - May need full revert**
**TIME WASTED: 2+ hours**
