# TravianAssistant

AI-powered strategic advisor for Travian Legends browser game.

## Current Status (August 31, 2025)

✅ **Working**
- Chrome Extension v1.0.4 with chat interface
- AI responds via Claude (through Vercel proxy)
- Detects all villages from game
- Chat is draggable, resizable, persistent

⚠️ **Needs Fixing**
- Resource scraping (outdated selectors)
- Building level detection
- Server configuration UI

## Quick Start

### 1. Build Extension
```bash
cd packages/extension
./build-minimal.sh
```

### 2. Load in Chrome
1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select `packages/extension/dist` folder

### 3. Use in Game
1. Navigate to your Travian server
2. Chat interface appears (drag to position)
3. Ask questions like "What should I build next?"

## Documentation

**Essential Docs** (Start Here):
- [`docs/SESSION_CONTEXT.md`](docs/SESSION_CONTEXT.md) - Current state, what's broken, next steps
- [`docs/TravianAssistantV4.md`](docs/TravianAssistantV4.md) - Architecture and design

**Reference**:
- [`docs/data-structures.md`](docs/data-structures.md) - Game data format
- [`test-ai-agent-local.js`](test-ai-agent-local.js) - Test AI without extension

## Project Structure

```
/packages/extension/    # Chrome extension source
/backend/              # Replit server (game data)
/data/                 # Game mechanics (troops, buildings)
/docs/                 # Documentation
```

## Backend Services

### Replit Backend
- URL: https://TravianAssistant.dougdostal.replit.dev
- Provides game mechanics data
- Run: `node backend/server.js`

### Vercel Proxy
- URL: https://travian-proxy-simple.vercel.app
- Handles CORS for Claude API
- Already deployed

## Development

### Version Management
```bash
cd packages/extension
node scripts/version-manager.cjs set 1.0.5
node scripts/version-manager.cjs sync
./build-minimal.sh
```

### Testing
```bash
# Test AI locally without extension
node test-ai-agent-local.js

# Check system state
node test-current-state.js
```

## Known Issues

1. **Resource Scraping**: Selectors need updating for current Travian version
2. **No Server Config**: Hardcoded to 2x speed server
3. **Limited Context**: AI doesn't see full game state yet

See [`docs/SESSION_CONTEXT.md`](docs/SESSION_CONTEXT.md) for detailed status.

## License

Private project - Not for public distribution

---

*For detailed information about architecture, current issues, and next steps, see the documentation folder.*
