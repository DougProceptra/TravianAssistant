# TravianAssistant Session Context

## ⚠️ MANDATORY READING INSTRUCTION ⚠️
**You must read every word of this document. You must read it 3 times. The first as a senior architect guiding the work of an application. The second time is as a developer that will be executing the steps and directions emanating from document and the third time as business analyst making sure you understand the functions and processes being addressed and how they affect the game. You cannot proceed until you fully comprehend every aspect of the SESSION_CONTEXT.md document.**

## 🛑 MANDATORY STOP GATES - DO NOT PROCEED WITHOUT THESE

### BEFORE ANY CODE CHANGE:
- [ ] Run `grep [function] dist/background.js` - VERIFY what's actually there
- [ ] Run `node -c dist/background.js` - CHECK for syntax errors
- [ ] State: "The EXACT error I'm fixing is: _____" (no fix without error)
- [ ] State: "I verified this error exists by: _____" (no assumption)

### IF YOU CANNOT CHECK ALL BOXES, STOP.

## ⚠️ FAILURE COUNTER
- Attempts without diagnosis: 0 (increment each violation)
- Files rewritten without verification: 0
- At 3 failures: AGENT MUST STOP

## 🎯 CURRENT FOCUS (ONE THING ONLY)
Problem: Background service worker not receiving messages ("Could not establish connection. Receiving end does not exist")
Verified by: Chrome DevTools console error when sending chat message
Next diagnostic step: Check if background.js is valid JavaScript using `node -c dist/background.js`

## ENFORCEMENT RULE
Every successful fix MUST be committed immediately:
`git add -A && git commit -m "VERIFIED FIX: [specific issue]" && git push`
If not committed within 5 minutes = IT DIDN'T WORK

## ⚠️ CRITICAL: CORRECT GITHUB REPOSITORY ⚠️
**GitHub Repository**: https://github.com/DougProceptra/TravianAssistant
- Owner: **DougProceptra** (NOT dougyb83, NOT DougZackowski)  
- Repository: **TravianAssistant**
- Main branch: **main**
- **VERIFY BEFORE ANY WORK**: `git remote -v` should show `origin	https://github.com/DougProceptra/TravianAssistant.git`

## ⚠️ REPLIT WORKSPACE ⚠️
**Replit URL**: https://replit.com/@dougdostal/TravianAssistant
- Workspace path: `~/workspace`
- Extension path: `~/workspace/packages/extension`
- Build output: `~/workspace/packages/extension/dist`

---

*Last Updated: August 27, 2025, 22:45 PST*
*Session Status: CRITICAL - Background service worker not connecting*

## 🔴 CURRENT SESSION - ENFORCEMENT ACTIVE
### What We Know
1. **Version**: v0.8.3 built but still not working
2. **Content script**: Loads and runs successfully
3. **Background service**: Not receiving messages
4. **Error**: "Could not establish connection. Receiving end does not exist"

### What Has Been Tried (DO NOT REPEAT)
1. Rewriting background.js multiple times - FAILED
2. Changing imports in conversational-ai-fixed.ts - Already correct
3. Updating versions - No effect on functionality

## CURRENT STATUS: v0.8.3 - BACKGROUND SERVICE NOT CONNECTING

### File Structure Reality
```
packages/extension/
├── src/
│   ├── content/
│   │   ├── conversational-ai-fixed.ts (FIXED VERSION - Being used correctly)
│   │   └── index-fixed.ts (IMPORTS CORRECT FILE)
│   └── background.ts (NEEDS DIAGNOSIS)
├── dist/
│   ├── content.js (82KB - working, parsing villages)
│   ├── background.js (8KB - NOT CONNECTING - NEEDS DIAGNOSIS)
│   └── manifest.json (v0.8.3)
└── build-minimal.sh (current build script)
```

### Current Errors
- Background script: "Could not establish connection. Receiving end does not exist"
- This means service worker is not running or not handling messages

## NEXT REQUIRED ACTION
1. Run `node -c dist/background.js` to check for syntax errors
2. Check chrome://extensions service worker console for actual errors
3. Only then propose ONE fix based on findings

## BUILD SYSTEM
Current version: **v0.8.3**
```bash
cd packages/extension
./build-minimal.sh  # Uses index-fixed.ts as entry point
```

## WHAT ACTUALLY WORKS
- Extension loads ✓
- Data collection works (8 villages parsed) ✓
- Chat UI appears ✓
- Content script runs ✓
- **Background service worker NOT WORKING**

## GIT STATUS IN REPLIT
- Many uncommitted changes
- Need to commit once fix is verified

---
*Session active: Enforcement gates in place to prevent waste*
