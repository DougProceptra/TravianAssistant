# New Server Testing Plan - Settlement Race Focus

## 🎯 Testing Objectives
Test the TravianAssistant V2 Settlement Race Optimizer on a fresh server to achieve the fastest possible second village (Day 6 target).

## 📅 Server Start Checklist

### Hour 0-1: Initial Setup
- [ ] Register on new server as **Egyptians**
- [ ] Complete tutorial
- [ ] Install TravianAssistant extension
- [ ] Configure backend URL: `https://workspace.dougdostal.repl.co`
- [ ] Verify HUD appears on game page
- [ ] Check data syncing to backend

### Hour 1-6: Foundation Phase
- [ ] Follow HUD recommendations for resource fields
- [ ] Complete all resource production quests
- [ ] Send hero on first adventure
- [ ] Verify CP tracking in HUD
- [ ] Monitor resource balance

### Hour 6-24: Resource Base
- [ ] Push all resource fields to level 1
- [ ] Start level 2 on crop fields
- [ ] Complete building quests
- [ ] Check hero for adventures (every 30 min)
- [ ] Clear nearest oasis (if hero strong enough)

## 🧪 Feature Testing Matrix

| Feature | Expected Behavior | Status | Notes |
|---------|------------------|--------|-------|
| **Data Collection** |
| Resource tracking | Updates every minute | [ ] | Check window.resources |
| Building queue | Shows current builds | [ ] | |
| Hero status | Health/level/adventures | [ ] | |
| Quest tracking | Active quests listed | [ ] | |
| **Settlement Calculator** |
| CP display | Current/needed (x/500) | [ ] | |
| Phase detection | FOUNDATION→CP_RUSH→RESIDENCE→SETTLERS | [ ] | |
| Time prediction | Days to settlement | [ ] | |
| Build recommendations | Phase-appropriate | [ ] | |
| **Hero Management** |
| Adventure counter | Shows available count | [ ] | |
| Oasis recommendations | When to clear | [ ] | |
| Resource calculation | 40 per animal level | [ ] | |
| **Backend Sync** |
| Data persistence | Survives page refresh | [ ] | |
| Multi-village ready | Stores per village | [ ] | |
| Admin dashboard | Shows player data | [ ] | |

## 📊 Key Metrics to Track

### Day 1 (0-24 hours)
- [ ] All resource fields level 1+
- [ ] Main Building level 3+
- [ ] Warehouse/Granary started
- [ ] 5+ adventures completed
- [ ] 1+ oasis cleared

### Day 2 (24-48 hours)
- [ ] One resource type level 5
- [ ] Marketplace built
- [ ] Embassy started
- [ ] 10+ adventures completed
- [ ] CP production: 10+/day

### Day 3 (48-72 hours)
- [ ] Residence construction started
- [ ] Academy planned
- [ ] CP: 150+/500
- [ ] Resource production: 200+/hour total

### Day 4-5 (72-120 hours)
- [ ] Residence level 10
- [ ] Academy built
- [ ] CP: 350+/500
- [ ] Settlers research started

### Day 6 (120-144 hours)
- [ ] 3 settlers trained
- [ ] 500 CP reached
- [ ] **SETTLEMENT ACHIEVED** 🎉

## 🐛 Bug Report Template

```markdown
### Issue Description
[What happened?]

### Expected Behavior
[What should happen?]

### Steps to Reproduce
1. [First step]
2. [Second step]

### Game State
- Server day: 
- Village name:
- Population:
- Phase shown in HUD:

### Console Errors
```
[Paste any errors]
```

### Screenshot
[Attach if relevant]
```

## 🔧 Troubleshooting Guide

### HUD Not Appearing
1. Check extension is enabled
2. Verify on correct domain (`*.travian.com`)
3. Check console for errors
4. Reload page

### Data Not Syncing
1. Verify backend URL in popup
2. Check network tab for failed requests
3. Ensure email configured
4. Test backend health: `https://workspace.dougdostal.repl.co/health`

### Wrong Recommendations
1. Clear localStorage
2. Re-enter server start time
3. Verify game state detection
4. Check phase calculation

### Hero Data Missing
1. Visit hero page once
2. Check for adventures manually
3. Verify hero element selectors
4. Report if consistent issue

## 🚀 Optimization Tips

### Gold Usage Priority
1. **Day 1**: Save for NPC
2. **Day 2**: NPC for balance
3. **Day 3-4**: Instant build CP buildings
4. **Day 5-6**: Finish settlers if needed

### Hero Adventures
- Check every 30 minutes
- Always keep hero busy
- Prioritize resource rewards
- Clear oases between adventures

### Resource Balance
- Never let warehouses overflow
- NPC when one resource >2x others
- Prioritize crop for troops
- Keep production balanced

### CP Maximization
1. Embassy (24 CP/day)
2. Marketplace (20 CP/day)
3. Small celebration (500 CP)
4. Main Building levels
5. Cranny (cheap CP)

## 📈 Success Criteria

### Minimum Viable Performance
- Settlement by Day 7
- Top 50 on server
- No major bugs
- Data properly tracked

### Target Performance  
- Settlement by Day 6
- Top 20 on server
- All features working
- Accurate predictions

### Stretch Goals
- Settlement before Day 6
- Top 10 on server
- Perfect optimization
- Zero manual planning needed

## 📱 Quick Commands

### In Replit Shell
```bash
# Start server
npm start

# Check logs
tail -f server.log

# Reset database
rm -rf db/ && node scripts/init-v3-database.js

# Build extension
chmod +x build-extension-quick.sh
./build-extension-quick.sh
```

### In Browser Console
```javascript
// Check game state
window.resources

// Force HUD update
document.querySelector('#tla-hud').update()

// View stored data
localStorage.getItem('TLA_SETTLEMENT_DATA')

// Clear all data
localStorage.clear()
```

## 🎯 Daily Testing Focus

### Day 1: Core Functionality
- Data collection working
- HUD displaying correctly
- Backend syncing
- Basic recommendations

### Day 2: Optimization Accuracy
- CP calculations correct
- Phase transitions smooth
- Build order optimal
- Quest tracking accurate

### Day 3: Hero Integration
- Adventure notifications
- Oasis clearing tips
- Resource calculations
- Experience tracking

### Day 4-5: Settlement Preparation
- Residence progress tracking
- Settler cost calculations
- Location scouting tips
- Final push reminders

### Day 6: Settlement Execution
- Final CP countdown
- Settler completion alerts
- Location confirmation
- Settlement success!

---

## 📞 Support During Testing

- **Backend Status**: https://workspace.dougdostal.repl.co/health
- **Admin Panel**: https://workspace.dougdostal.repl.co/admin.html
- **GitHub Issues**: Create with bug report template
- **Quick Fixes**: Check troubleshooting guide first

**Goal**: Prove that TravianAssistant can achieve top-20 settlement with <2 hours daily play time! 🏆
