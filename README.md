# TravianAssistant v0.9.5

AI-powered strategic advisor for Travian Legends. **The AI agent IS the product.**

## 🟢 Current Status

### What Works
- ✅ **Chat Interface**: Draggable and resizable window
- ✅ **AI Integration**: Claude Sonnet 4 via Vercel proxy
- ✅ **Village Detection**: Finds all 9 villages from overview page

### Known Issues
- 🔴 **Data Pipeline Bug**: Scrapers find 9 villages but AI receives 0
  - See [docs/BUG_TRACKER.md](docs/BUG_TRACKER.md) for details

## 📋 Core Philosophy

This is an **AI-first** application:
- **NO HUDs** - The AI chat is the entire interface
- **NO data displays** - The AI interprets and explains
- **NO automation** - Strategic advice only

The extension is just plumbing to get game data to the AI.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/DougProceptra/TravianAssistant.git
cd TravianAssistant

# Build the working version
cd packages/extension
git checkout a00eca9  # Last known working version
./build-minimal.sh

# Fix version number (build system bug)
sed -i 's/"version": "1.0.0"/"version": "0.9.5"/' dist/manifest.json

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

## 🎯 User Experience Goal

**User asks**: "What should I build next?"

**AI responds**: "Your village at (50|-30) should upgrade the iron mine to level 8. This will take 45 minutes and increase production by 120/hour. You have sufficient resources."

That's it. No complex UI. Just intelligent conversation.

## 🏗️ Architecture

```
Travian Game Page
       ↓
  Data Scrapers (✅ finds 9 villages)
       ↓
  Content Script (🔴 sees 0 villages - BUG HERE)
       ↓
  Background Worker
       ↓
  Vercel Proxy (✅ works)
       ↓
  Claude AI (✅ works)
       ↓
  Chat Response (✅ works)
```

## 📁 Repository Structure

```
TravianAssistant/
├── packages/extension/     # Chrome extension source
├── api/                   # Vercel proxy endpoint
├── docs/                  # Documentation
├── SESSION_CONTEXT.md     # Current development state
├── CONTRIBUTING.md        # Repository hygiene rules
├── AI_PROMPT_TEMPLATE.md  # How to start AI sessions
└── archive/               # Old/experimental files (not synced)
```

## 🐛 The One Bug That Matters

```javascript
// Console output showing the disconnect:
content.js:48 [TLA Overview] Successfully parsed 9 villages  ✅
content.js:2474 [TLA Content] Found 0 villages              🔴

// The fix is probably:
// Current (broken):
const villages = overviewParser.getAllCachedVillages(); 

// Should be:
const villages = await overviewParser.getAllVillages();
```

## 📚 Documentation

### Essential Reading
- [CONTRIBUTING.md](CONTRIBUTING.md) - **READ FIRST** - Repository rules and hygiene
- [SESSION_CONTEXT.md](SESSION_CONTEXT.md) - Current state and lessons learned
- [AI_PROMPT_TEMPLATE.md](AI_PROMPT_TEMPLATE.md) - How to work with AI assistants

### Technical Documentation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
- [docs/BUG_TRACKER.md](docs/BUG_TRACKER.md) - Known issues and fixes
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Setup instructions
- [docs/data-structures.md](docs/data-structures.md) - Game data formats

## 👨‍💻 Contributing

**IMPORTANT**: Read [CONTRIBUTING.md](CONTRIBUTING.md) before making ANY changes.

Key rules:
1. **No new features** until the data pipeline bug is fixed
2. **Test files go in `/archive/`**, never in root
3. **Don't break the v0.9.5 draggable chat**
4. **Commit messages must be specific**
5. **The AI agent is the product** - no complex UI

## 🤖 Working with AI Assistants

When starting a session with Claude or another AI:
1. Use the prompt template in [AI_PROMPT_TEMPLATE.md](AI_PROMPT_TEMPLATE.md)
2. Ensure the AI reads [CONTRIBUTING.md](CONTRIBUTING.md) first
3. Have it check [SESSION_CONTEXT.md](SESSION_CONTEXT.md) for current state
4. Focus ONLY on the data pipeline bug until it's fixed

## ⚠️ Important Notes

1. **DO NOT** add complex UI features - the AI chat is the interface
2. **DO NOT** break the v0.9.5 draggable chat - it works
3. **DO** fix the data pipeline bug first before any new features
4. **DO** test with actual game data
5. **DO** follow repository hygiene rules in [CONTRIBUTING.md](CONTRIBUTING.md)

## 🔧 Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup instructions.

**Primary focus**: Fix the data pipeline bug without breaking the working chat UI.

---

*Remember: The AI agent is the product. Everything else is just plumbing.*
