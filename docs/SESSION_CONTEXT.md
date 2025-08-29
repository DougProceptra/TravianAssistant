# TravianAssistant Session Context
*Last Updated: August 29, 2025, 12:07 PM EST*

## 🚨 DATA VALIDATION - RUN THIS BEFORE TRUSTING CALCULATIONS

### Validate All Building Data:
```bash
cd packages/extension
node validate.mjs
```

This will check:
- All building costs against Kirilloid values
- Missing buildings (we found Hero Mansion was missing!)
- Build time accuracy
- Formula calculations

**If validation fails**: Update `travian-constants.ts` with correct values

## 🚨 CRITICAL BUILD INSTRUCTIONS - USE THIS METHOD

### ⚠️ DO NOT USE VITE - IT'S BROKEN
Vite has persistent dependency issues with workspaces. Use our simple build instead.

### ✅ CORRECT BUILD METHOD (30 seconds):
```bash
# From project root
cd packages/extension

# Check if dist/ already exists with files
ls -la dist/

# If dist/ has files, you're ready to load in Chrome!
# If not or to rebuild:
node build-simple.mjs

# Or if that fails, the dist/ from previous builds works
```

### 📦 LOAD IN CHROME:
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `packages/extension/dist/` folder
5. Pin the extension to toolbar

## ✅ FIXES APPLIED

### Hero Mansion Issue Fixed:
- **Problem**: Hero Mansion base costs were missing
- **Solution**: Added correct base costs (700, 670, 700, 240)
- **Build times**: Added exact times from Kirilloid

### Data Validation System Created:
- `validate-data.ts` - Comprehensive validation
- `validate.mjs` - Runner script
- Checks ALL buildings against known accurate values

## ⚠️ KNOWN MISSING BUILDINGS

From validation, these buildings still need data:
- Rally Point
- Stables
- Workshop
- Blacksmith
- Armory
- Treasury
- Trade Office
- Cranny
- Great Warehouse
- Great Granary
- Stonemason
- Brewery
- Trapper
- Sawmill
- Brickyard
- Iron Foundry
- Grain Mill
- Bakery

**Impact**: Calculations for these buildings will fail until data is added

## 🎮 YOUR SERVERS

| Server | Speed | When | Setting |
|--------|-------|------|---------|
| Current | 2x | Now | Default in extension |
| Annual Special | 1x | Sept 9 | Use preset button |

## 📊 VALIDATED FORMULAS

These are confirmed accurate:
- ✅ Hero Mansion costs (all levels)
- ✅ Main Building costs
- ✅ Barracks costs
- ✅ Marketplace costs
- ✅ Resource field costs (Woodcutter, etc.)
- ✅ Build times with server speed

## 🔧 IF BUILD ISSUES OCCUR

The `dist/` folder already contains a working build. If you have issues:

1. **Option 1**: Use existing dist/ folder (already built)
2. **Option 2**: Run `node build-simple.mjs`
3. **Option 3**: Copy files manually:
   ```bash
   cp manifest.json dist/
   cp public/* dist/
   cp -r src/options dist/
   ```

## 💡 TESTING YOUR FORMULAS

1. Load extension in Chrome
2. Click extension icon → Options
3. Configure server (2x for current)
4. Click "Test Formulas" button
5. Check console for calculation results

## 📝 NEXT STEPS

1. **Run validation**: `node validate.mjs`
2. **Add missing building data** from Kirilloid
3. **Re-validate** after adding data
4. **Test with real queries** in game

---

**Version**: 1.0.1
**Build Method**: build-simple.mjs (NOT Vite)
**Status**: PARTIALLY VALIDATED - Some buildings missing
**Your dist/ folder**: Already has working files!