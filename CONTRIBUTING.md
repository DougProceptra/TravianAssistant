# Contributing to TravianAssistant

## 🎯 Core Principle
**The AI agent IS the product.** Every change must serve this principle.

## 📁 Repository Hygiene Rules

### Before ANY Work
1. **Read these first**:
   - `SESSION_CONTEXT.md` - Current state and known issues
   - `docs/BUG_TRACKER.md` - What's actually broken
   - `docs/ARCHITECTURE.md` - System design philosophy

2. **Check current branch**:
   ```bash
   git status
   git branch
   ```

### File Organization

#### ✅ Where Files Belong
- **Source code** → `/packages/extension/src/`
- **Documentation** → `/docs/`
- **Test files** → `/test/` (minimal, focused tests only)
- **Scripts** → `/scripts/` (only if reusable)
- **Experiments** → `/archive/` (git-ignored)

#### ❌ Never in Root
- Test files (`test-*.js`)
- Debug scripts (`debug-*.js`)
- Data dumps (`*.json`, `*.txt` outputs)
- Database files (`*.db`, `*.sqlite`)
- Build artifacts (`*.zip`, generated files)

### Git Commit Standards

#### Commit Messages
```
[type]: Brief description

Longer explanation if needed.

Fixes: #issue
```

Types:
- `fix`: Bug fixes (especially the data pipeline!)
- `docs`: Documentation only
- `refactor`: Code restructuring (no feature change)
- `test`: Adding tests
- `chore`: Maintenance tasks

#### Examples
```
fix: Connect overview parser data to content script

The overview parser was finding 9 villages but the content
script was receiving 0. Fixed async/await issue in data retrieval.

Fixes: Data pipeline bug documented in BUG_TRACKER.md
```

### Branch Strategy
```bash
main                    # Stable, working code
├── fix/data-pipeline   # Current priority fix
├── archive/*           # Old branches (delete after merge)
└── experiment/*        # Try things (never merge directly)
```

### Before Committing

1. **Test the build**:
   ```bash
   cd packages/extension
   ./build-minimal.sh
   # Load in Chrome and verify it works
   ```

2. **Check what you're committing**:
   ```bash
   git status
   git diff --staged
   ```

3. **No junk files**:
   ```bash
   # If you see test files or experiments:
   mv test-*.js archive/test-files/
   mv debug-*.js archive/test-files/
   ```

### Code Review Checklist

Before merging ANY code:
- [ ] Does it fix the data pipeline bug? (Priority #1)
- [ ] Does it add UI complexity? (If yes, STOP)
- [ ] Does it break the working chat? (Test v0.9.5 baseline)
- [ ] Are all test files in `/archive/`?
- [ ] Is documentation updated?

## 🤖 AI Assistant Session Management

### During Work
AI assistants should:
1. Update `SESSION_CONTEXT.md` after significant changes
2. Keep updates concise (one line with timestamp and action)
3. Track the current focus and next actions

### Session Wrap-Up Protocol
When ending a development session, AI assistants MUST:

1. **Update SESSION_CONTEXT.md** with:
   - Current date/time
   - What was accomplished
   - What remains broken
   - Next priority action

2. **Display the updated SESSION_CONTEXT.md** to the user with:
   ```markdown
   ## Session Wrap-Up
   
   Here's the updated SESSION_CONTEXT.md:
   [Display the full updated content]
   
   ### Summary of This Session:
   - ✅ Completed: [what was fixed/added]
   - 🔴 Still Broken: [what's still not working]
   - 🎯 Next Priority: [specific next action]
   
   ### Questions for Confirmation:
   1. Is this status accurate?
   2. Should the next priority be different?
   3. Any additional context to record?
   ```

3. **Wait for user confirmation** before finalizing

## 🚫 What NOT to Do

### Never Add
- ❌ HUDs or data displays
- ❌ Complex UI elements beyond chat
- ❌ "Comprehensive" features
- ❌ Alternative architectures
- ❌ Test files in root

### Never Break
- ❌ The v0.9.5 draggable chat
- ❌ The Vercel proxy
- ❌ The simple build process

### Never Commit
- ❌ `node_modules/`
- ❌ `dist/` or build outputs
- ❌ `.env` files
- ❌ Database files
- ❌ Personal experiments

## 🎯 Current Priority

**THE ONE BUG THAT MATTERS**:
```javascript
// packages/extension/src/content/index.ts ~line 2474
// Parser finds 9 villages but content script gets 0
// THIS MUST BE FIXED BEFORE ANYTHING ELSE
```

## 📝 Documentation Updates

When changing code:
1. Update `SESSION_CONTEXT.md` with current state
2. Update `docs/BUG_TRACKER.md` if fixing/finding bugs
3. Keep `README.md` accurate about what works/doesn't

## 🤖 For AI Assistants

When working on this repository:
1. **Always check git status first**
2. **Read SESSION_CONTEXT.md before making changes**
3. **Never add features until data pipeline is fixed**
4. **Move test files to archive immediately**
5. **Commit messages must be specific**
6. **Test with real Travian game, not mock data**
7. **Follow session wrap-up protocol when ending work**

## 💡 Quick Commands

```bash
# Start work
git pull
git status
cat SESSION_CONTEXT.md

# Build and test
cd packages/extension
./build-minimal.sh
# Fix version: sed -i 's/"version": "1.0.0"/"version": "0.9.5"/' dist/manifest.json

# Clean up before commit
mv test-*.js archive/test-files/ 2>/dev/null
mv debug-*.js archive/test-files/ 2>/dev/null
git add -A
git status  # Review what you're committing!

# Commit with good message
git commit -m "fix: [specific description of what you fixed]"
git push
```

---

*Remember: The AI agent is the product. If your change doesn't help the AI give better advice, don't make it.*
