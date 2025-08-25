# TravianAssistant Session Context
**Last Updated**: August 25, 2025 - Sub-tab exploration complete
**Current Version**: Backend v1.0.0, Extension v0.5.1
**Status**: Data discovery in progress - found rich data in statistics sub-tabs

## 📊 DATA DISCOVERY UPDATE

### Sub-Tab Findings:

#### Warehouse Tab (`/resources/warehouse`)
- 7 villages with **7 cells each**
- Shows fill percentages and time to full
- Cell structure: Village, Wood%, Clay%, Iron%, Time to full wood/clay/iron, Crop%, Time to full crop

#### Production Tab (`/resources/production`)
- 9 villages with **5 cells each**
- Shows hourly production rates
- Cell structure: Village, Wood/hr, Clay/hr, Iron/hr, Total production
- **Note**: `window.production` object exists on this page!

#### Capacity Tab (`/resources/capacity`)
- 9 villages with **3 cells each**
- Shows storage capacities
- Cell structure: Village, Warehouse capacity, Granary capacity

#### Troops Tab (`/troops`)
- Shows troop counts per village
- **12 cells** for each village (10 troop types + village name + total?)
- Multiple tables for different troop categories

#### Support Tab (`/troops/support`)
- Shows reinforcements between villages
- **10 separate tables** (one per village showing support details)
- 11 cells per row in support details

### JavaScript Variables Discovery:
- `window.resources`: Always present (current village data)
- `window.production`: Only on production sub-tab!
- `window.Travian`: Always present (game config)

## 🔍 STILL TO DISCOVER

### Critical Missing Data:
1. **Village coordinates** - Need to find where stored
2. **Population per village** - Not found in inspected tabs yet
3. **Culture points** - Need to check culture tab
4. **Building levels** - Need to check individual village pages
5. **Hero information** - Not explored yet
6. **Alliance data** - Not explored yet
7. **Map data** - Not explored yet
8. **Market/trade routes** - Not explored yet
9. **Attack/defense reports** - Not explored yet
10. **Messages/IGMs** - Not explored yet

### Pages to Explore:
- `/village/statistics/culturepoints`
- `/dorf1.php` (resource fields view)
- `/dorf2.php` (buildings view)
- `/build.php?id=39` (rally point - movements)
- `/build.php?id=17` (marketplace - trades)
- `/hero.php` (hero stats)
- `/allianz.php` (alliance)
- `/berichte.php` (reports)
- `/messages.php` (messages)

### Questions to Answer:
1. Where are village coordinates stored?
2. How to get population data?
3. Can we access building queue data?
4. Where is merchant/trade data?
5. How to detect incoming attacks?

## ✅ CONFIRMED WORKING

### Data Collection Methods:
1. **JavaScript variables** (`window.resources`, `window.production`)
2. **Statistics tables** with consistent IDs
3. **ResourceBarPlus selectors** (`#l1`, `#l2`, etc.)

### Table IDs Found:
- `table#overview` - Overview tab
- `table#ressources` - Resources main tab
- `table#warehouse` - Warehouse sub-tab
- `table#production` - Production sub-tab  
- `table#capacity` - Capacity sub-tab
- `table#troops` - Troops tab

## 🎯 NEXT SESSION PRIORITIES

1. **Explore culture points tab** - Critical for game progression
2. **Check village pages** (`dorf1.php`, `dorf2.php`) for building data
3. **Find village coordinates** - Essential for map features
4. **Explore hero page** - Important for complete account status
5. **Check rally point** - For movement/attack detection

## 📝 Key Insights

1. **Sub-tabs have specialized data** - Each focuses on specific aspects
2. **Window objects vary by page** - `window.production` only on production tab
3. **Table structures are consistent** - Can build reliable parsers
4. **Multiple data sources needed** - Must combine JS vars + tables
5. **Some data still hidden** - Coordinates, population not found yet

---

*Data discovery ~60% complete. Need to explore remaining pages for full picture.*