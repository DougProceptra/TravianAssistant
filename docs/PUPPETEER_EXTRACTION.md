# Puppeteer Data Extraction Guide

## Overview
This guide explains how to extract Travian game mechanics data from kirilloid.ru using Puppeteer on Replit and store it in SQLite database.

## Quick Start

### 1. Setup on Replit
```bash
# Clone the repository to Replit
git clone https://github.com/DougProceptra/TravianAssistant.git
cd TravianAssistant

# Run the setup script
chmod +x scripts/setup-puppeteer.sh
./scripts/setup-puppeteer.sh
```

### 2. Run Minimal POC (Recommended First Step)
```bash
# Extract just Main Building data to validate approach
node scripts/extract-kirilloid-minimal.js
```

### 3. Validate Results
The POC will extract Main Building data and validate Level 6 for T4 2x server:
- **Expected**: Wood=240, Clay=135, Iron=205, Crop=70
- If validation passes ✅, the extraction method is correct
- If validation fails ❌, check the page structure

### 4. Run Full Extraction (After Validation)
```bash
# Extract all buildings, troops, and game mechanics
node scripts/extract-kirilloid-puppeteer.js
```

## File Structure

```
TravianAssistant/
├── scripts/
│   ├── extract-kirilloid-minimal.js    # Minimal POC extractor
│   ├── extract-kirilloid-puppeteer.js  # Full data extractor
│   └── setup-puppeteer.sh              # Setup script
├── backend/
│   └── travian.db                      # SQLite database
└── replit.nix                          # Replit configuration
```

## Database Schema

### game_data_buildings
- `server_version` (T4, T5, etc.)
- `server_speed` (1, 2, 3, etc.)
- `building_id` (unique identifier)
- `building_name` (display name)
- `level` (1-20+)
- Resource costs: `wood_cost`, `clay_cost`, `iron_cost`, `crop_cost`
- `time_seconds` (build time)
- `population` (population increase)
- `culture_points` (CP generated)

### game_data_troops
- Tribe information
- Combat stats: `attack`, `defense_infantry`, `defense_cavalry`
- `speed_fields_per_hour`
- `carry_capacity`
- `upkeep_per_hour`
- Training costs and time

### game_data_mechanics
- Culture point requirements for villages
- Celebration costs
- Hero experience levels
- Other game constants

## Validation Checkpoint

The system validates extraction accuracy using T4 2x Main Building Level 6:

```javascript
const VALIDATION_DATA = {
    building: 'main_building',
    level: 6,
    server_speed: 2,
    expected: {
        wood: 240,
        clay: 135,
        iron: 205,
        crop: 70
    }
};
```

## Troubleshooting

### Puppeteer Won't Launch
```bash
# Check if Chromium is installed
which chromium

# If not, update replit.nix and restart Replit
```

### Database Not Found
```bash
# Create backend directory and initialize DB
mkdir -p backend
node scripts/init-puppeteer-db.js
```

### Extraction Returns No Data
- Check if kirilloid.ru is accessible
- Try setting `HEADLESS = false` in the script to see browser
- Check console logs for page structure issues

### Validation Fails
- The page structure might have changed
- Use browser DevTools to inspect the actual table structure
- Update the extraction logic in `evaluate()` functions

## Query Database

### Using SQLite CLI
```bash
sqlite3 backend/travian.db

# Example queries
SELECT * FROM game_data_buildings WHERE building_name='Main Building' AND level=6;
SELECT COUNT(*) FROM game_data_buildings;
.tables
.schema game_data_buildings
```

### Using Node.js
```javascript
const Database = require('better-sqlite3');
const db = new Database('backend/travian.db');

const result = db.prepare(
    'SELECT * FROM game_data_buildings WHERE level = ?'
).all(6);

console.log(result);
```

## Next Steps

1. **After Successful Extraction**:
   - Integrate data with Chrome extension
   - Build calculation engines
   - Create AI recommendation system

2. **Extend Extraction**:
   - Add more server versions (T5, Annual Special)
   - Extract additional mechanics (adventures, auctions)
   - Add data transformation for extension format

## Technical Notes

### Puppeteer on Replit
Replit requires specific Chrome launch arguments:
```javascript
{
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu'
    ]
}
```

### Performance Tips
- Extract during off-peak hours to avoid rate limiting
- Add delays between page navigations
- Use `headless: true` for faster extraction
- Cache extracted data to avoid re-extraction

## Support

If extraction fails or you need different data:
1. Check page structure manually at http://travian.kirilloid.ru
2. Update selectors in extraction scripts
3. Run validation before full extraction
4. Check GitHub issues for known problems

---

*Last Updated: August 30, 2025*
