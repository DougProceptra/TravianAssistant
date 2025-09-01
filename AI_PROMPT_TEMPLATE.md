# AI Assistant Prompt Template

Use this prompt when starting a session with Claude or another AI assistant to work on TravianAssistant.

---

## Prompt to Use:

```
I need help with the TravianAssistant Chrome extension project. 

CRITICAL CONTEXT:
- The AI agent IS the product - everything else is just plumbing
- There's ONE critical bug: scrapers find 9 villages but AI receives 0
- Version v0.9.5 has working draggable chat UI - DO NOT BREAK IT
- NO new features until the data pipeline bug is fixed

Before suggesting ANY changes:
1. Read the CONTRIBUTING.md file
2. Check SESSION_CONTEXT.md for current state
3. Review docs/BUG_TRACKER.md for the critical bug details

Repository: https://github.com/DougProceptra/TravianAssistant

Key principles:
- No HUDs or complex UI - the chat IS the interface
- Test files go in /archive/, not root
- Commit messages must be specific and describe what was fixed
- Always run git status before making changes

Current priority: Fix the data pipeline bug where the overview parser finds 9 villages but the content script receives 0 (around line 2474 in packages/extension/src/content/index.ts).

What specific aspect should we work on today?
```

---

## Quick Reference Commands

Include these in your prompt if needed:

```bash
# Check current state
git status
cat SESSION_CONTEXT.md

# Build extension
cd packages/extension
./build-minimal.sh
sed -i 's/"version": "1.0.0"/"version": "0.9.5"/' dist/manifest.json

# Clean up test files before commit
mv test-*.js archive/test-files/ 2>/dev/null
mv debug-*.js archive/test-files/ 2>/dev/null

# Commit with good message
git add -A
git commit -m "fix: [specific change description]"
git push
```

---

## What to Tell the AI NOT to Do

Always include these restrictions:
- Don't add new UI features
- Don't create HUDs or data displays
- Don't reorganize the repository structure
- Don't add test files to root directory
- Don't break the v0.9.5 draggable chat
- Don't work on anything except the data pipeline bug (until it's fixed)

---

## Session Checklist

When starting a session, ensure the AI:
- [ ] Reads CONTRIBUTING.md first
- [ ] Checks SESSION_CONTEXT.md for current state
- [ ] Reviews the bug in BUG_TRACKER.md
- [ ] Runs git status before making changes
- [ ] Focuses ONLY on the data pipeline bug
- [ ] Tests changes with real Travian game
- [ ] Moves any test files to archive/
- [ ] Uses specific commit messages

---

*Remember: The simpler the prompt, the better. The repository documentation now contains all the detailed rules.*
