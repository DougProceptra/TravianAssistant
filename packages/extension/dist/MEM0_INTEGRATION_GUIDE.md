# TravianAssistant mem0 Integration Instructions
*Created: September 4, 2025*

## Current Status
✅ **SAFE INTEGRATION COMPLETE**

We have successfully created a mem0-integrated version of the extension WITHOUT touching your working `content.js` file.

## Files Created
1. **`content-backup-20250904.js`** - Safety backup of your working version
2. **`mem0-integration.js`** - Standalone mem0 module 
3. **`content-with-mem0.js`** - Complete integrated version with mem0
4. **`restore-backup.sh`** - Emergency rollback script

## Testing Instructions

### Option A: Test Side-by-Side (SAFEST)
1. Keep your current extension working as-is
2. Create a test copy:
   ```bash
   cd packages/extension
   cp -r dist dist-mem0-test
   cd dist-mem0-test
   cp content-with-mem0.js content.js
   ```
3. Load as separate extension in Chrome for testing

### Option B: Direct Test (Still Safe - Backup Exists)
1. Navigate to extension directory:
   ```bash
   cd packages/extension/dist
   ```

2. Replace content.js with mem0 version:
   ```bash
   cp content.js content-original.js
   cp content-with-mem0.js content.js
   ```

3. Reload extension in Chrome:
   - Go to `chrome://extensions`
   - Click refresh on TravianAssistant
   - Clear localStorage in DevTools if needed

4. Test mem0 features:
   - Open Travian game
   - Should see email prompt on first load
   - Check for memory status indicator in HUD
   - Test chat functionality

### Emergency Rollback
If anything breaks:
```bash
cd packages/extension/dist
bash restore-backup.sh
```
Or manually:
```bash
cp content-backup-20250904.js content.js
```

## What Changed in mem0 Version

### Visual Changes
- Memory status indicator below server info
- Email prompt on first use (can skip for session-only memory)
- Chat header shows memory status

### Technical Changes
- Uses `TLA_USER_ID` instead of `TLA_ACCOUNT_ID`
- Sends to `/api/proxy` endpoint instead of `/api/anthropic`
- Includes full gameState with every message
- Generates persistent userId from email hash

### Backward Compatibility
- Automatically migrates existing `TLA_ACCOUNT_ID` to `TLA_USER_ID`
- All existing features preserved
- Can run without mem0 if user skips email

## Testing Checklist

### First Load
- [ ] Email prompt appears
- [ ] Can enter email OR skip
- [ ] Memory status shows correctly in HUD

### Chat Functionality
- [ ] Chat opens normally
- [ ] Messages send successfully
- [ ] AI responds with context

### Memory Testing
- [ ] Say "Remember I prefer defensive strategies"
- [ ] Close and reopen chat
- [ ] Ask "What strategy do I prefer?"
- [ ] Should recall the preference

### Vercel Logs
Check https://vercel.com/your-account/travian-proxy-simple/logs for:
```
[Proxy] userId: user_xxxxx
[Proxy] Has gameState: true
[mem0] Processing request for user: user_xxxxx...
✅ Retrieved X memories
✅ Memory stored successfully
```

## Troubleshooting

### If email prompt doesn't appear
```javascript
// In Chrome DevTools Console
localStorage.removeItem('TLA_USER_ID');
sessionStorage.removeItem('TLA_EMAIL_PROMPT_SHOWN');
// Then reload page
```

### If memory isn't working
1. Check Vercel logs for mem0 operations
2. Verify `MEM0_API_KEY` is set in Vercel env vars
3. Check browser console for errors

### If extension breaks
1. Run `bash restore-backup.sh`
2. Reload extension in Chrome
3. Everything returns to pre-mem0 state

## Next Steps

After successful testing:
1. Monitor for 24 hours
2. If stable, make mem0 version primary:
   ```bash
   cp content-with-mem0.js content.js
   git add .
   git commit -m "mem0 integration stable - making primary"
   git push
   ```

## Support

If issues arise:
- Backup is at `content-backup-20250904.js`
- Original also saved as `content-original.js` if you followed Option B
- Can always revert to working state

---

**Remember**: Your working version is completely safe. We've only created new files alongside it.