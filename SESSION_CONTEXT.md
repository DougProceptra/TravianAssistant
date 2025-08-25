# TravianAssistant Session Context
**Last Updated**: August 25, 2025 - Data Discovery Phase
**Current Version**: Backend v1.0.0, Extension v0.5.1
**Status**: Testing safe scraper with real game data

## 🎯 CURRENT FOCUS

### Data Discovery Mission
We're mapping exactly what data exists on Travian game pages because the overview page provides less than expected:
- Only shows village names, coordinates, and merchant counts
- NO individual resource/production/population data in overview table
- Need to inspect statistics tabs to find where real data lives

### Discovered Issues
1. **HUD showing fake data**: Total production and resources are calculated, not scraped
2. **Population**: 785 is correct for CURRENT village only (not total)
3. **Overview limitations**: `/village/statistics/overview` only has basic info
4. **ResourceBarPlus conflict**: Another extension Doug is replacing

## 📊 PAGES TO INSPECT

### Statistics Tabs (Priority)
- [x] `/village/statistics/overview` - Basic village list only
- [ ] `/village/statistics/resources` - Detailed resource data?
- [ ] `/village/statistics/culturepoints` - Culture point generation
- [ ] `/village/statistics/troops` - Troop counts per village

### Game Pages (Secondary)
- [ ] `/production.php` - Resource production rates
- [ ] `/build.php` - Village buildings
- [ ] `/build.php?id=39` - Rally point (troops)
- [ ] Marketplace - Trade data
- [ ] Map - Other players' villages

## ✅ WHAT'S WORKING

### Backend (v1.0.0)
- SQLite database with correct schema
- All 6 test endpoints passing
- Account and village storage working

### Extension (v0.5.1) 
- Safe scraper mode (no navigation)
- AJAX interceptor initialized
- Basic data collection from overview
- HUD displays (but with wrong data)

## 🔴 WHAT NEEDS FIXING

### Critical Issues
1. **Fake calculations**: Remove hardcoded math, get real data
2. **Chat function**: "Ask a question" failing with error
3. **Data accuracy**: Scrapers not getting actual game values

### Data Collection Gaps
- Production rates per village
- Resource stockpiles per village  
- Population per village
- Culture points
- Troop counts
- Building information

## 🚀 NEXT IMMEDIATE ACTIONS

### Step 1: Complete Page Inspection
Run the enhanced inspector (v2) on each statistics tab to map data structure

### Step 2: Fix Scrapers
Based on inspection results, update scrapers to get real data from correct locations

### Step 3: Update Database Schema
Expand schema to store all discovered data fields

### Step 4: Remove Fake Calculations
Replace hardcoded math with actual scraped values

## 📝 Inspector Code Location
The enhanced inspector v2 is at:
```
scripts/inspect-travian-data-v2.js
```

## 🔑 Session Rules

1. **No assumptions** - Inspect actual pages, don't guess structure
2. **Test everything** - Working means tested with real data
3. **Update continuously** - Keep SESSION_CONTEXT current
4. **Remove stale info** - Delete outdated content immediately

---

*Current session focus: Map real data structure via inspection, fix scrapers to collect actual values, remove all fake calculations.*