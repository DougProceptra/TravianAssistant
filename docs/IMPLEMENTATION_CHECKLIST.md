# Implementation Checklist for v1.1.0

## Session Start Protocol
1. [ ] Verify version 1.1.0 in all files
2. [ ] Check travian-proxy-simple is using claude-sonnet-4-20250514
3. [ ] Confirm extension options page has email field for context service

## Priority 1: Data Pipeline Fix ⚠️ CRITICAL
- [ ] Identify where scraper data is lost between parser and content script
- [ ] Fix connection so AI receives complete village data
- [ ] Verify AI receives complete game context
- [ ] Test: "What village am I in?" query returns correct answer
- [ ] Test: "What's my total production?" shows all villages

## Priority 2: Backend Validation
- [ ] Buildings data structure complete
- [ ] Troops data structure complete
- [ ] Hero data structure complete
- [ ] Game mechanics data validated
- [ ] Travel speeds accurate
- [ ] Build times accurate

## Priority 3: Context Intelligence Integration
- [ ] Add context_intelligence webhook calls to https://proceptra.app.n8n.cloud/mcp/context-tools
- [ ] Hash user email from options for user ID
- [ ] Store every interaction (request + response)
- [ ] Verify learning is captured in mem0
- [ ] Test pattern recognition across sessions

## Priority 4: End-to-End Testing
- [ ] Options page configuration works
- [ ] New server (Sept 1, 2025) compatibility verified
- [ ] Full workflow test with real game data
- [ ] Strategic advice is contextual and accurate
- [ ] User acceptance criteria met

## Success Criteria
- [ ] AI knows current game state (all villages, resources, troops)
- [ ] AI provides strategic (not just data) advice
- [ ] System learns from interactions
- [ ] Version 1.1.0 stable across all components
- [ ] No regression in chat UI functionality

## Testing Scenarios
1. **Basic Context**: "What village am I in?"
2. **Production**: "What's my total resource production?"
3. **Strategy**: "What should I build next?"
4. **Timing**: "When will I have enough culture points?"
5. **Military**: "How many troops do I have?"
6. **Learning**: Correct the AI, verify it remembers

## Known Issues to Avoid
- Don't add exports to content scripts (Chrome doesn't support)
- Don't trust version managers (manually verify)
- Don't break drag/resize functionality
- Don't create new UI elements

## Documentation to Keep Current
- [ ] SESSION_CONTEXT.md reflects actual state
- [ ] TravianAssistantV4.md matches implementation
- [ ] README.md has correct build instructions
- [ ] Remove/archive obsolete documentation

## Post-Implementation Cleanup
- [ ] Remove debug logging
- [ ] Archive old/wrong documentation
- [ ] Update README with user instructions
- [ ] Create release notes