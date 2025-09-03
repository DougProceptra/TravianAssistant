# Mem0 Integration Implementation Notes

## What Changed

### 1. Extension (content.js → content-mem0.js)
- Added email capture on first use
- Hash email to create userId for privacy
- Include full game context in every message to AI
- Fetch game mechanics from backend when relevant

### 2. Backend (server.js)
- Added `/api/game-mechanics-context` endpoint
- Updated `/api/village` to use userId instead of accountId

### 3. Vercel Proxy (needs update)
Add this to your Vercel proxy:

```javascript
import { Memory } from 'mem0ai';

const memory = new Memory({
  api_key: process.env.MEM0_API_KEY,
  user_id: req.body.userId
});

// Before sending to Claude
const memories = await memory.search(req.body.message, {
  user_id: req.body.userId,
  limit: 5
});

// After Claude responds
await memory.add({
  messages: [
    { role: 'user', content: req.body.message },
    { role: 'assistant', content: claudeResponse }
  ],
  user_id: req.body.userId,
  metadata: {
    gamePhase: determineGamePhase(req.body.gameState),
    timestamp: new Date().toISOString()
  }
});
```

## Setup Steps

1. Add to Vercel environment variables:
   - `MEM0_API_KEY=your_mem0_api_key`
   - `ANTHROPIC_API_KEY=your_anthropic_key`

2. Update extension:
   - Copy content-mem0.js over content.js
   - Or rename and update manifest.json

3. Update backend:
   - Add the new endpoints from server-updates.js
   - Restart Replit server

## Testing

1. Clear localStorage to trigger email prompt
2. Enter email (gets hashed for privacy)
3. Visit game pages to collect data
4. Ask strategic question in chat
5. Verify userId is passed and memories work

## Key Benefits

- Each user has segregated memory via hashed email
- AI sees full game context with every query
- Learns patterns over time
- Works across devices with same email