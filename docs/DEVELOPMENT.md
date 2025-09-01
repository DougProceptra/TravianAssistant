# Development Guide

## Prerequisites

- Node.js 18+ and npm
- Chrome browser for testing
- Git

## Setup

```bash
# Clone repository
git clone https://github.com/DougProceptra/TravianAssistant.git
cd TravianAssistant

# Install dependencies
cd packages/extension
npm install
```

## Building

### Quick Build (Recommended)
```bash
cd packages/extension
./build-minimal.sh

# Fix version number (known bug)
sed -i 's/"version": "1.0.0"/"version": "0.9.5"/' dist/manifest.json
```

### Manual Build
```bash
cd packages/extension
npm run build
```

## Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `packages/extension/dist/` folder
5. The extension icon should appear in your toolbar

## Testing

1. Navigate to your Travian game
2. Click the TLA button that appears
3. The chat interface should open
4. Ask the AI a question about your game

## Working with the v0.9.5 Base

The last known working version is at commit `a00eca9`:

```bash
# Checkout working version
git checkout a00eca9

# Build it
./build-minimal.sh

# Test that chat UI works (draggable/resizable)
```

## Project Structure

```
packages/extension/
├── src/
│   ├── background/      # Service worker
│   ├── content/         # Content scripts (BUG HERE)
│   ├── scrapers/        # Data extraction
│   └── lib/            # Shared utilities
├── manifest.json        # Extension config
├── build-minimal.sh     # Build script
└── dist/               # Build output (git ignored)
```

## The Critical Bug

The data pipeline is broken at the connection between scrapers and content script:

```javascript
// scrapers/overview-parser.ts - WORKS
console.log("[TLA Overview] Successfully parsed 9 villages");

// content/index.ts - BROKEN
console.log("[TLA Content] Found 0 villages");
```

To fix: Check how `content/index.ts` retrieves villages from the parser.

## Environment Variables

Create `/api/.env` for the Vercel proxy:
```
ANTHROPIC_API_KEY=your-api-key-here
```

## Common Issues

### Extension doesn't appear
- Check that Developer mode is enabled
- Reload the extension
- Check console for errors

### Chat doesn't work
- Verify you're on v0.9.5
- Check browser console for errors
- Ensure you're on a Travian page

### Version shows wrong
- Run the sed command after building
- Check manifest.json in dist/

## Development Workflow

1. **Make changes** in `src/`
2. **Build** with `./build-minimal.sh`
3. **Fix version** with sed command
4. **Reload extension** in Chrome
5. **Test** on Travian game
6. **Check console** for errors

## Important Notes

- **DO NOT** add complex UI - the AI chat is the interface
- **DO NOT** break the draggable chat that works in v0.9.5
- **DO** fix the data pipeline bug first
- **DO** test with real game data

## Getting Help

- Check [docs/BUG_TRACKER.md](BUG_TRACKER.md) for known issues
- Review [SESSION_CONTEXT.md](../SESSION_CONTEXT.md) for current state
- See [ARCHITECTURE.md](ARCHITECTURE.md) for system design

---

*Focus: Fix the data pipeline bug without breaking the working chat UI.*
