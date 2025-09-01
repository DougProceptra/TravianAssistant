# AI Development Workflow - MANDATORY RULES

## CRITICAL: No Code in Chat Policy

### ❌ NEVER DO THIS:
- Display full file contents in chat
- Show code snippets longer than 5 lines
- Copy/paste existing code for review
- Create artifacts with full implementations

### ✅ ALWAYS DO THIS:
1. **Identify issue** → Brief summary only
2. **Create fix** → Push directly to GitHub
3. **Notify with commit** → Share commit SHA/link
4. **User pulls** → `git pull` on Replit

## Workflow Commands

### For AI Assistant:
```
When fixing bugs or adding features:
1. Use github:create_or_update_file
2. Create new file with version suffix (e.g., -v2.ts)
3. Provide ONE LINE summary: "Fixed X by doing Y - see commit ABC123"
4. NO CODE IN CHAT
```

### For Developer:
```bash
# After AI posts commit
git pull
cp [new-file] [target-file]  # If versioned file
npm run build
npm test
```

## Token Economy Rules

### High Token Cost (AVOID):
- Downloading files with github:get_file_contents then displaying
- Creating artifacts with full code
- Explaining code line-by-line
- Showing diffs in chat

### Low Token Cost (PREFER):
- Direct GitHub operations
- Commit references
- Brief summaries
- "Fixed in commit X" messages

## Enforcement Checklist

Before AI responds with code:
- [ ] Is it under 5 lines? → OK to show
- [ ] Is it a fix? → Push to GitHub
- [ ] Is it exploration? → Summarize findings only
- [ ] Is it debugging? → Show relevant error only

## Example Interactions

### WRONG:
```
AI: "Here's the fixed file: [500 lines of code]"
AI: "Let me show you the current implementation: [downloads and displays]"
```

### RIGHT:
```
AI: "Fixed village parsing bug - pushed as overview-parser-v6.ts (commit a29ae4d)"
AI: "Issue found: wrong selector on line 247. Fix pushed to GitHub."
```

## Quick Reference for AI

When user says "fix X":
1. Research issue (don't show findings)
2. Push fix to GitHub
3. Response: "Fixed [issue] in [file] - pull latest from GitHub"

When user says "show me X":
1. Instead of showing: "X is in [file] at [location]"
2. Or push example to: `/examples/X-example.ts`

## This is NOT a suggestion - it's a REQUIREMENT

Every response with >5 lines of code that isn't pushed to GitHub wastes:
- Context window tokens
- User's time
- AI processing capacity
- Session coherence

**DEFAULT ACTION: Push to GitHub, notify with commit, move on.**
