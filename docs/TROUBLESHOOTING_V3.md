# TravianAssistant V3 - Troubleshooting Guide

## Quick Diagnostics

### 1. Check Backend Health
```bash
curl http://localhost:3000/health
```
Expected output:
```json
{
  "status": "healthy",
  "version": "3.0.0",
  "database": "connected",
  "stats": { ... }
}
```

### 2. Test Chat Endpoint
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "email": "test@example.com"}'
```

### 3. Check Database
```bash
cd backend
sqlite3 ../travian.db ".tables"
# Should list: chat_history game_events performance_metrics player_snapshots recommendations villages
```

## Common Issues & Solutions

### Issue: "Backend not accessible" in extension
**Symptoms**: Chat shows offline message
**Solution**:
1. Ensure backend is running: `cd backend && node server.js`
2. Check port 3000 is free: `lsof -i :3000`
3. In Replit, ensure port 3000 is exposed

### Issue: "better-sqlite3" module not found
**Symptoms**: Error when starting backend
**Solution**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
# If still fails, try:
npm install better-sqlite3 --build-from-source
```

### Issue: Chat doesn't respond
**Symptoms**: Loading dots never resolve
**Solution**:
1. Check Vercel proxy is accessible:
```bash
curl https://travian-proxy-simple.vercel.app/api/proxy \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","messages":[{"role":"user","content":"test"}]}'
```
2. Check backend logs for errors
3. Ensure ANTHROPIC_API_KEY is set in Vercel

### Issue: Extension not loading
**Symptoms**: Extension doesn't appear on Travian pages
**Solution**:
1. Check manifest.json has correct permissions
2. Ensure you're on correct URL: `*.travian.com/*`
3. Reload extension in Chrome
4. Check console for errors (F12)

### Issue: Database lock error
**Symptoms**: "database is locked" error
**Solution**:
```bash
cd backend
rm ../travian.db-wal ../travian.db-shm
# Then reinitialize:
node init-db.js
```

### Issue: Map import fails
**Symptoms**: 404 or network error
**Solution**:
1. Check server URL is correct in import-map.js
2. Try manual download:
```bash
curl https://lusobr.x2.lusobrasileiro.travian.com/map.sql -o map.sql
```
3. If blocked, may need to add User-Agent headers

### Issue: CORS errors in console
**Symptoms**: "CORS policy" errors
**Solution**:
1. Backend server.js already has CORS configured
2. If still failing, check Chrome extension ID in CORS origins
3. Can temporarily disable CORS for testing:
```javascript
app.use(cors({ origin: '*' })); // TESTING ONLY
```

## Debug Commands

### View Recent Chat History
```bash
sqlite3 ../travian.db "SELECT datetime(timestamp,'localtime'), role, substr(content,1,50) FROM chat_history ORDER BY timestamp DESC LIMIT 10;"
```

### Check Recommendations
```bash
sqlite3 ../travian.db "SELECT * FROM recommendations WHERE completed = 0;"
```

### View Village Stats
```bash
sqlite3 ../travian.db "SELECT COUNT(*) as total, AVG(population) as avg_pop FROM villages;"
```

### Clear Chat History
```bash
sqlite3 ../travian.db "DELETE FROM chat_history;"
```

## Performance Tips

1. **Database Optimization**:
```bash
sqlite3 ../travian.db "VACUUM; ANALYZE;"
```

2. **Monitor Memory**:
```bash
# In Replit shell
free -h
df -h
```

3. **Check Node Process**:
```bash
ps aux | grep node
top -p [PID]
```

## Testing Checklist

- [ ] Backend starts: `node backend/server.js`
- [ ] Database exists: `ls -la travian.db`
- [ ] Health check passes: `curl localhost:3000/health`
- [ ] Extension loads in Chrome
- [ ] Chat button appears on Travian
- [ ] Email initialization works
- [ ] AI responds to messages
- [ ] Game state is captured
- [ ] Recommendations are generated

## Still Need Help?

1. Check backend logs in Replit console
2. Check Chrome DevTools console (F12)
3. Review SESSION_CONTEXT.md for setup steps
4. Ensure all dependencies installed
5. Try complete reinstall with setup-v3.sh

## Contact Points

- GitHub Issues: https://github.com/DougProceptra/TravianAssistant/issues
- Latest docs: /docs folder in repository
- Version: Check VERSION in extension and backend
