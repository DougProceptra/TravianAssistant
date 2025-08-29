# Updating Game Data from Kirilloid

## Overview
Our game data is extracted from the Kirilloid repository to ensure 100% accuracy with their calculators. When Travian updates the game, Kirilloid typically updates within days, and we can pull those changes.

## Update Process

### Manual Update (Recommended)
Run this single command to check for and apply updates:

```bash
./scripts/update-game-data.sh
```

This script will:
1. Pull latest from Kirilloid repository
2. Extract the new data
3. Transform to our TypeScript structure
4. Run validation tests
5. Generate an update report

### What Gets Updated
- **Building costs/times** - If resources or build times change
- **Troop stats** - Attack, defense, speed adjustments
- **New features** - New buildings, troops, or items added
- **Formula changes** - Combat calculations, production rates
- **Server variations** - New server types or speeds

### Version Tracking
We track the Kirilloid commit hash in `.kirilloid-hash` to know when updates are available.

## Update Frequency

### Typical Game Update Schedule
- **Major updates**: 2-3 times per year (new tribes, buildings)
- **Balance patches**: Monthly (troop stats, costs)
- **Bug fixes**: Weekly (formula corrections)

### Our Update Strategy
1. **Check weekly** during active development
2. **Check monthly** during maintenance mode
3. **Immediate update** when players report discrepancies

## Validation After Updates

After running the update script, validate:

```bash
# Run game data tests
npm run test:game-data

# Compare specific calculations
npm run validate:kirilloid-parity
```

## Handling Breaking Changes

If Kirilloid makes structural changes:

1. **Review changes**: Check their commit history
2. **Update extractors**: Modify `extract-kirilloid-data.js` if needed
3. **Update types**: Adjust `types.ts` for new data structures
4. **Test thoroughly**: Ensure AI can still use the data

## Rollback Process

If an update causes issues:

```bash
# Revert game data files
git checkout HEAD~1 packages/extension/src/game-data/

# Revert Kirilloid repo to previous version
cd kirilloid-travian
git checkout <previous-hash>
cd ..

# Re-run extraction with old version
./scripts/extract-kirilloid-data.js
```

## Automation Options

### GitHub Action (Optional)
We can set up a GitHub Action to check daily and create an issue when updates are available. See `.github/workflows/check-kirilloid-updates.yml`

### NPM Script
Add to package.json:
```json
{
  "scripts": {
    "update:game-data": "./scripts/update-game-data.sh",
    "check:game-updates": "node scripts/check-for-updates.js"
  }
}
```

## Benefits of This Approach

1. **Zero maintenance** - We don't manually maintain game data
2. **Always accurate** - Direct from Kirilloid's tested data
3. **Fast updates** - Single command to update everything
4. **Traceable** - Git history shows exactly what changed
5. **Testable** - Can validate our data matches Kirilloid

## Troubleshooting

### Common Issues

**Issue**: Extraction script fails
**Solution**: Check if Kirilloid changed their file structure

**Issue**: TypeScript compilation errors after update
**Solution**: Update our types.ts to match new data structure

**Issue**: AI gives incorrect calculations
**Solution**: Validate formulas.ts matches Kirilloid's calculations

## Example Update Workflow

```bash
# 1. Check for updates
./scripts/update-game-data.sh

# 2. Review what changed
cat packages/extension/src/game-data/UPDATE_LOG.md

# 3. Test the changes
npm run test:game-data

# 4. Test in extension
npm run build:extension
# Load in Chrome and test

# 5. Commit if good
git add packages/extension/src/game-data/
git commit -m "Update game data from Kirilloid (add new Egyptian building)"
git push
```
