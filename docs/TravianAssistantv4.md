# TravianAssistant V4 Architecture Documentation
*Last Updated: September 4, 2025*
*Version: 4.0.0 - Production Ready with mem0 Integration*

## System Overview

TravianAssistant is a Chrome extension that provides AI-powered strategic advice for Travian Legends players. It features real-time game state analysis, persistent memory via mem0, and low-latency Claude AI integration.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Chrome Browser                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              TravianAssistant Extension                │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ content.js  │  │ background.js │  │  manifest   │ │  │
│  │  │   (Main)    │  │  (Service     │  │  .json      │ │  │
│  │  │             │  │   Worker)     │  │             │ │  │
│  │  └──────┬──────┘  └───────┬───────┘  └──────────────┘ │  │
│  │         │                 │                           │  │
│  │  ┌──────▼──────────────────▼────────┐                │  │
│  │  │     HUD & Chat Interface         │                │  │
│  │  │  - Draggable Chat Window         │                │  │
│  │  │  - Memory Status Indicator       │                │  │
│  │  │  - Game State Display            │                │  │
│  │  └────────────────┬──────────────────┘                │  │
│  └───────────────────┼────────────────────────────────────┘  │
└──────────────────────┼────────────────────────────────────┘
                       │
                       ▼ HTTPS
        ┌──────────────────────────────┐
        │   Vercel Edge Function       │
        │   (travian-proxy-simple)     │
        │                              │
        │  ┌────────────────────────┐  │
        │  │     /api/proxy.js      │  │
        │  │  - Parallel Processing │  │
        │  │  - 301 Redirect Fix    │  │
        │  │  - Fire & Forget Store │  │
        │  └──────┬─────────┬───────┘  │
        └─────────┼─────────┼──────────┘
                  │         │
     Parallel ────┼─────────┼──── Requests
                  ▼         ▼
    ┌─────────────────┐ ┌──────────────────┐
    │    mem0 API     │ │  Anthropic API   │
    │  (api.mem0.ai)  │ │  Claude Sonnet   │
    │                 │ │                  │
    │ - User Memories │ │ - Game Analysis  │
    │ - Preferences   │ │ - Strategy       │
    │ - Game Context  │ │ - Recommendations│
    └─────────────────┘ └──────────────────┘
```

## Repository Structure

### Main Repository: `DougProceptra/TravianAssistant`

```
TravianAssistant/
├── packages/
│   └── extension/
│       ├── dist/                     # Production-ready extension files
│       │   ├── content.js            # Main content script with mem0
│       │   ├── content-with-mem0.js  # mem0 integrated version
│       │   ├── content-backup-*.js   # Backup versions
│       │   ├── mem0-integration.js   # mem0 module
│       │   ├── background.js         # Service worker
│       │   ├── manifest.json         # Extension manifest
│       │   ├── icon-*.png            # Extension icons
│       │   ├── clean-test.sh         # Cleanup script
│       │   └── restore-backup.sh     # Rollback script
│       ├── src/                      # Source files (TypeScript)
│       │   ├── content/
│       │   └── background.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   ├── TravianAssistantv4.md        # THIS FILE - Architecture doc
│   └── TRAVIAN_ASSISTANT_V3_COMPLETE.md
├── SESSION_CONTEXT.md                # Current session status
├── README.md                          # Project overview
└── package.json                       # Root package config
```

### Proxy Repository: `DougProceptra/travian-proxy-simple`

```
travian-proxy-simple/
├── api/
│   ├── proxy.js                      # Main proxy (parallel processing)
│   └── proxy-backup-sequential.js    # Backup sequential version
├── package.json
└── vercel.json                       # Vercel deployment config
```

## Core Components

### 1. Chrome Extension (`/packages/extension/dist/`)

#### content.js (Main Content Script)
**Location**: `/packages/extension/dist/content.js`
**Purpose**: Injected into Travian game pages
**Key Features**:
- Game state scraping (resources, villages, population)
- HUD overlay rendering
- Chat interface management
- mem0 integration for persistent memory
- WebSocket-like message handling with background script

#### background.js (Service Worker)
**Location**: `/packages/extension/dist/background.js`
**Purpose**: Handles API communication and extension lifecycle
**Key Features**:
- Message routing between content script and external APIs
- CORS bypass for API calls
- Extension state management
- Error handling and retry logic

#### manifest.json
**Location**: `/packages/extension/dist/manifest.json`
**Configuration**:
```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["*://*.travian.com/*"],
  "content_scripts": [{
    "matches": ["*://*.travian.com/game/*"],
    "js": ["content.js"]
  }]
}
```

### 2. Vercel Proxy (`travian-proxy-simple`)

#### proxy.js (Parallel Processing Version)
**Location**: `travian-proxy-simple/api/proxy.js`
**URL**: `https://travian-proxy-simple.vercel.app/api/proxy`
**Features**:
- Parallel mem0 search and Claude processing
- 301 redirect handling for mem0 API
- Fire-and-forget background storage
- ~500ms latency reduction
- Comprehensive error handling

**Environment Variables Required**:
- `ANTHROPIC_API_KEY` - Claude API access
- `MEM0_API_KEY` - mem0 memory storage

### 3. mem0 Integration

#### mem0-integration.js
**Location**: `/packages/extension/dist/mem0-integration.js`
**Purpose**: Handles user identification and memory persistence
**Key Features**:
- User ID generation and storage
- Email masking for privacy
- Session-only vs persistent memory modes
- Memory status indicators

#### Memory Flow:
1. User provides email (optional) → Stored as masked ID
2. Each message searches relevant memories
3. Claude receives memories in context
4. Conversation stored for future reference
5. Background storage doesn't block responses

### 4. Data Scraping System

#### Scraped Data Points:
- **Resources**: Wood, Clay, Iron, Crop (current & production)
- **Villages**: Count, coordinates, names
- **Population**: Current total
- **Culture Points**: Current/needed for next settlement
- **Hero**: Level, health, experience
- **Buildings**: Queue status
- **Troops**: Training queue

## API Integrations

### Anthropic Claude API
- **Model**: claude-3-5-sonnet-20241022
- **Endpoint**: https://api.anthropic.com/v1/messages
- **Max Tokens**: 2000
- **Temperature**: 0.7

### mem0 API
- **Base URL**: https://api.mem0.ai
- **Endpoints**:
  - `GET /v1/memories/` - Search memories
  - `POST /v1/memories/` - Store memories
- **Authentication**: Token-based (Bearer token)

## Performance Optimizations

### Current Performance Metrics:
- **Total Response Time**: <2 seconds
- **mem0 Search**: ~250ms (parallel)
- **Claude Response**: ~1500-2000ms
- **Memory Storage**: ~250ms (background)

### Optimization Techniques:
1. **Parallel Processing**: mem0 and Claude run simultaneously
2. **Fire-and-Forget Storage**: Responses sent before storage completes
3. **301 Redirect Handling**: Automatic following of API redirects
4. **Error Resilience**: Failed mem0 calls don't block Claude

## Security & Privacy

### Data Protection:
- Email addresses masked (only domain shown)
- User IDs hashed and anonymized
- All API keys stored in environment variables
- No sensitive data in client-side code

### API Key Management:
- Vercel environment variables for production
- No keys in GitHub repository
- Separate keys for development/production

## Testing & Deployment

### Local Testing:
```bash
# Clean test environment
cd packages/extension/dist
bash clean-test.sh

# Load extension in Chrome
1. Navigate to chrome://extensions
2. Enable Developer Mode
3. Load Unpacked → Select dist/ folder
```

### Deployment:
- **Extension**: Manual load or Chrome Web Store
- **Proxy**: Auto-deploys to Vercel on git push
- **Rollback**: `bash restore-backup.sh` if needed

## File Cleanup Requirements

### Files Definitely Not Needed:
- `/kirilloid-travian` - Empty file
- `/add-ai-chat.patch` - Old patch file
- `/add-ai-chat-endpoint.patch` - Old patch file
- `/migrate-to-clean.sh` - Migration complete
- `/run-cleanup.sh` - One-time script
- `/test-backend.js` - Old test file
- `/server.backup.js` - Old backup

### Files to Archive:
- `/server-enhanced.js` - Replaced by Vercel
- `/server-updates.js` - Old server code
- `/replit*` files - If not using Replit anymore
- `/admin.html` - Old admin interface
- `/test-api.html` - Old test page

## Current Status (September 4, 2025)

### ✅ Completed:
- Chrome extension with full game scraping
- AI chat interface with Claude integration
- mem0 persistent memory system
- Parallel processing for low latency
- User identification system
- Fire-and-forget storage optimization

### 🚧 In Progress:
- HUD improvements and positioning
- Enhanced data scraping accuracy
- UI polish and responsiveness

### 📋 Next Steps:
1. Complete HUD positioning system
2. Add village switcher integration
3. Implement troop movement tracking
4. Add battle report analysis
5. Create alliance coordination features

## Support & Maintenance

### Quick Commands:
```bash
# Test extension
chrome://extensions → Reload

# Check logs
Vercel Dashboard → Functions → Logs

# Rollback if needed
cd packages/extension/dist
cp content-backup-20250904.js content.js

# Clean test
bash clean-test.sh
```

### Key Repositories:
- Main: https://github.com/DougProceptra/TravianAssistant
- Proxy: https://github.com/DougProceptra/travian-proxy-simple
- Vercel: https://vercel.com/dougproceptra/travian-proxy-simple

---

*This architecture document reflects the production-ready state of TravianAssistant V4 with full mem0 integration and parallel processing optimizations.*