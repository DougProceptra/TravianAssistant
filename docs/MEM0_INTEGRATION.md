# Mem0 Integration Plan for TravianAssistant

## Overview
Integrate mem0.ai for persistent memory management across user sessions, enabling personalized AI strategic advice.

## Key Changes Required

### 1. Extension (content.js)
- Replace random accountId with email-based userId (hashed)
- Include full game context in sendMessage()
- Fetch game mechanics from backend when relevant

### 2. Vercel Proxy (/api/proxy.js)
- Query mem0 before sending to Claude
- Store conversations in mem0 after Claude responds
- Use userId for memory segregation

### 3. Backend (server.js)
- Add `/api/game-mechanics-context` endpoint
- Update all endpoints to use userId instead of accountId

## Implementation Steps

1. **Update extension to capture email and hash it**
2. **Modify sendMessage() to include gameData**
3. **Update Vercel proxy to integrate mem0**
4. **Test with multiple users**

## Environment Variables Needed

### Vercel
```
MEM0_API_KEY=your_mem0_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Data Flow
```
User Query → Extension (with game context) → Vercel (mem0 lookup) → Claude → Vercel (mem0 store) → Extension
```

## Testing
- Clear localStorage to trigger email prompt
- Enter email for userId generation
- Ask strategic questions
- Verify memories are stored/retrieved

## Branch
All changes are in `feature/mem0-integration` branch.
