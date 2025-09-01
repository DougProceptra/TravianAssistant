# TravianAssistant Architecture

## Core Principle: AI Agent First

The entire application is built around a single concept: **The AI agent IS the product**.

## System Flow

```
Travian Game Page
       ↓
  [Data Scrapers]
       ↓
  [Content Script]  ← 🔴 BUG: Data lost here
       ↓
  [Background Worker]
       ↓
  [Vercel Proxy]
       ↓
  [Claude Sonnet 4]
       ↓
  [Chat Response]
```

## Component Responsibilities

### Data Scrapers (`/packages/extension/src/scrapers/`)
- Extract game state from DOM
- Parse village data, resources, buildings
- **Current Status**: ✅ Working - finds 9 villages

### Content Script (`/packages/extension/src/content/`)
- Coordinates scrapers
- Manages chat UI
- Sends data to background worker
- **Current Status**: 🔴 Broken - receives 0 villages from scrapers

### Background Worker (`/packages/extension/src/background/`)
- Handles API communication
- Manages extension state
- Routes messages between content and API
- **Current Status**: ✅ Working

### Vercel Proxy (`/api/anthropic.js`)
- Proxies requests to Anthropic API
- Handles CORS issues
- Manages API keys
- **Current Status**: ✅ Working

### Chat Interface
- Draggable and resizable window
- Simple message input/output
- **Current Status**: ✅ Working in v0.9.5

## Design Decisions

### What We Build
- **Intelligent Analysis**: AI interprets complex game state
- **Strategic Advice**: Recommendations based on full context
- **Natural Conversation**: Chat-based interaction

### What We DON'T Build
- ❌ **HUDs**: No visual overlays showing data
- ❌ **Dashboards**: No statistics displays
- ❌ **Calculators**: AI does the math
- ❌ **Automation**: No automatic actions
- ❌ **Complex UI**: Chat is the only interface

## Data Flow Example

1. **User opens village overview** (dorf3.php)
2. **Scraper extracts data**:
   ```javascript
   // Overview parser finds:
   villages: [
     { id: "24488", name: "000", pop: 456 },
     { id: "20985", name: "001", pop: 234 },
     // ... 7 more villages
   ]
   ```

3. **Content script should receive data** (but currently doesn't)

4. **AI gets context and responds**:
   ```
   User: "What's my production?"
   AI: "Your 9 villages produce 45,000 resources per hour..."
   ```

## The Critical Bug

```javascript
// packages/extension/src/content/index.ts

// Line ~48: Parser works
console.log("[TLA Overview] Successfully parsed 9 villages");

// Line ~2474: Data lost
console.log("[TLA Content] Found 0 villages");

// The connection between parser and content script is broken
```

## Success Metrics

1. **Data Accuracy**: AI receives complete game state
2. **Response Quality**: Advice is specific and actionable
3. **UI Simplicity**: Just a chat window, nothing else
4. **Performance**: <1 second to gather and send data

## Technology Stack

- **Extension**: Chrome Manifest V3
- **Language**: TypeScript
- **Build**: Custom bash scripts
- **API Proxy**: Vercel Edge Functions
- **AI Model**: Claude Sonnet 4
- **Storage**: Chrome storage API

## Future Considerations

Once the data pipeline is fixed:
1. Add conversation memory
2. Improve context understanding
3. Learn player preferences
4. Track advice outcomes

But FIRST: Fix the data pipeline bug.

---

*Remember: Every feature must serve the AI agent. If it doesn't help the AI give better advice, we don't build it.*
