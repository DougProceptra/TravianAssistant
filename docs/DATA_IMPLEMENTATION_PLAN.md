# Data Extraction & Storage Implementation Plan
*Date: August 30, 2025*
*Target: T4 1x and T4 2x server data*

## Executive Summary

Based on research, we will implement a hybrid solution:
1. **Extraction**: Puppeteer on Replit (confirmed working)
2. **Storage**: Static JSON files + SQLite for queries
3. **Access**: TypeScript data access layer with caching

## Part 1: Puppeteer on Replit

### Confirmed Working Configuration

```javascript
// replit.nix - Add chromium dependency
{pkgs}: {
  deps = [
    pkgs.chromium
    pkgs.nodejs-18_x
  ];
}

// extraction script
const puppeteer = require("puppeteer");
const { exec } = require("node:child_process");
const { promisify } = require("node:util");

async function extractData() {
  // Get chromium path on Replit
  const { stdout: chromiumPath } = await promisify(exec)("which chromium");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: chromiumPath.trim()
  });
  
  const page = await browser.newPage();
  // Extract data...
  await browser.close();
}
```

### Key Findings
- ✅ Puppeteer DOES work on Replit with proper configuration
- ✅ Requires adding chromium to replit.nix dependencies
- ✅ Must use --no-sandbox flag for Replit environment
- ✅ Can run headless for automated extraction

## Part 2: Data Storage Architecture

### Current Database Schema (Existing)
We already have SQLite setup with:
- Villages table (coordinates, population)
- Resources table (current stocks)
- Production table (per hour rates)
- Buildings table (what's built where)

### New Static Game Data Storage

```
/backend/game-data/
├── t4-1x/
│   ├── buildings.json       # Building costs, times, effects
│   ├── troops.json          # Unit stats per tribe
│   ├── mechanics.json       # Culture points, celebrations, etc.
│   └── metadata.json        # Extraction date, version info
├── t4-2x/
│   ├── buildings.json
│   ├── troops.json
│   ├── mechanics.json
│   └── metadata.json
└── index.js                 # Data access layer
```

### Data Structure Design

```javascript
// buildings.json structure
{
  "server": {
    "version": "T4",
    "speed": 1,
    "extraction_date": "2025-08-30T12:00:00Z"
  },
  "buildings": {
    "main_building": {
      "id": 15,
      "max_level": 20,
      "category": "infrastructure",
      "levels": [
        {
          "level": 1,
          "costs": {
            "wood": 70,
            "clay": 40,
            "iron": 60,
            "crop": 20
          },
          "time": 2100,  // seconds at 1x speed
          "population": 2,
          "culture_points": 2,
          "effect": {
            "type": "building_time_reduction",
            "value": 1.0
          }
        },
        // ... levels 2-20
      ]
    },
    // ... all other buildings
  }
}

// troops.json structure
{
  "romans": {
    "legionnaire": {
      "id": 1,
      "attack": 40,
      "defense_infantry": 35,
      "defense_cavalry": 50,
      "speed": 6,
      "carry_capacity": 50,
      "upkeep": 1,
      "training_time": 1600,  // seconds at 1x
      "costs": {
        "wood": 120,
        "clay": 100,
        "iron": 150,
        "crop": 30
      },
      "requirements": {
        "barracks": 1
      }
    },
    // ... all Roman units
  },
  // ... all tribes
}
```

## Part 3: Data Access Layer

### TypeScript Interface

```typescript
// /backend/game-data/index.ts
export class TravianGameData {
  private data: Map<string, ServerData> = new Map();
  
  constructor() {
    this.loadData('t4-1x');
    this.loadData('t4-2x');
  }
  
  getBuildingCost(
    server: 'T4',
    speed: 1 | 2,
    building: string,
    level: number
  ): ResourceCost {
    const key = `t4-${speed}x`;
    const serverData = this.data.get(key);
    return serverData.buildings[building].levels[level - 1].costs;
  }
  
  getBuildTime(
    server: 'T4',
    speed: 1 | 2,
    building: string,
    level: number,
    mainBuildingLevel: number = 0
  ): number {
    const baseTime = this.getBaseTime(server, speed, building, level);
    const reduction = 1 + (mainBuildingLevel * 0.05); // 5% per MB level
    return Math.floor(baseTime / reduction);
  }
  
  getTroopStats(
    server: 'T4',
    speed: 1 | 2,
    tribe: string,
    unit: string
  ): TroopStats {
    const key = `t4-${speed}x`;
    return this.data.get(key).troops[tribe][unit];
  }
}
```

### Integration with Existing System

```javascript
// /backend/server.js - Add game data endpoints
const gameData = new TravianGameData();

app.get('/api/game-data/building/:building/:level', (req, res) => {
  const { building, level } = req.params;
  const { server = 'T4', speed = 2 } = req.query;
  
  const costs = gameData.getBuildingCost(server, speed, building, level);
  const time = gameData.getBuildTime(server, speed, building, level);
  
  res.json({ costs, time });
});

app.get('/api/game-data/troops/:tribe/:unit', (req, res) => {
  const { tribe, unit } = req.params;
  const { server = 'T4', speed = 2 } = req.query;
  
  const stats = gameData.getTroopStats(server, speed, tribe, unit);
  res.json(stats);
});
```

## Part 4: Extraction Implementation

### Replit Setup Script

```bash
#!/bin/bash
# setup-extraction.sh

# Install dependencies
npm install puppeteer

# Create extraction directories
mkdir -p backend/game-data/t4-1x
mkdir -p backend/game-data/t4-2x

# Update replit.nix
cat >> .replit << 'EOF'
[nix]
channel = "stable-21_11"

[nix.deps]
pkgs = ["chromium", "nodejs-18_x"]
EOF

echo "Extraction environment ready!"
```

### Extraction Script

```javascript
// /scripts/extract-kirilloid-data.js
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const SERVER_CONFIGS = [
  { 
    name: 't4-1x',
    url: 'http://travian.kirilloid.ru/build.php?s=0&a=t',
    params: { version: 'T4', speed: 1 }
  },
  { 
    name: 't4-2x',
    url: 'http://travian.kirilloid.ru/build.php?s=1&a=t',
    params: { version: 'T4', speed: 2 }
  }
];

async function extractServerData(browser, config) {
  const page = await browser.newPage();
  console.log(`Extracting ${config.name}...`);
  
  // Navigate to buildings page
  await page.goto(config.url, { waitUntil: 'networkidle2' });
  
  // Extract building data from JavaScript variables
  const buildingsData = await page.evaluate(() => {
    // Access global variables that Kirilloid uses
    if (typeof buildings !== 'undefined') {
      return buildings;
    }
    // Alternative: look for data in window object
    return window.gameData?.buildings || {};
  });
  
  // Navigate to troops page
  await page.goto(config.url.replace('build.php', 'troops.php'));
  
  const troopsData = await page.evaluate(() => {
    if (typeof troops !== 'undefined') {
      return troops;
    }
    return window.gameData?.troops || {};
  });
  
  // Save extracted data
  const outputDir = path.join(__dirname, '..', 'backend', 'game-data', config.name);
  
  await fs.writeFile(
    path.join(outputDir, 'buildings.json'),
    JSON.stringify({
      server: config.params,
      extraction_date: new Date().toISOString(),
      buildings: buildingsData
    }, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'troops.json'),
    JSON.stringify({
      server: config.params,
      extraction_date: new Date().toISOString(),
      troops: troopsData
    }, null, 2)
  );
  
  console.log(`✓ Extracted ${config.name}`);
}

async function main() {
  // Get chromium path on Replit
  const { exec } = require('node:child_process');
  const { promisify } = require('node:util');
  const { stdout: chromiumPath } = await promisify(exec)('which chromium');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: chromiumPath.trim()
  });
  
  try {
    for (const config of SERVER_CONFIGS) {
      await extractServerData(browser, config);
    }
  } finally {
    await browser.close();
  }
  
  console.log('Extraction complete!');
}

main().catch(console.error);
```

## Part 5: Chrome Extension Integration

### Using the Data in Extension

```typescript
// /packages/extension/src/services/gameDataService.ts
export class GameDataService {
  private cache = new Map<string, any>();
  
  async getBuildingInfo(building: string, level: number): Promise<BuildingInfo> {
    const cacheKey = `building-${building}-${level}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Get from backend API
    const response = await fetch(
      `${API_URL}/api/game-data/building/${building}/${level}?server=T4&speed=2`
    );
    
    const data = await response.json();
    this.cache.set(cacheKey, data);
    
    return data;
  }
  
  async getTroopInfo(tribe: string, unit: string): Promise<TroopInfo> {
    const cacheKey = `troop-${tribe}-${unit}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const response = await fetch(
      `${API_URL}/api/game-data/troops/${tribe}/${unit}?server=T4&speed=2`
    );
    
    const data = await response.json();
    this.cache.set(cacheKey, data);
    
    return data;
  }
}
```

### HUD Display Integration

```typescript
// /packages/extension/src/components/BuildingRecommendation.tsx
export function BuildingRecommendation({ building, currentLevel }: Props) {
  const [nextLevelInfo, setNextLevelInfo] = useState<BuildingInfo | null>(null);
  const gameData = new GameDataService();
  
  useEffect(() => {
    gameData.getBuildingInfo(building, currentLevel + 1)
      .then(setNextLevelInfo);
  }, [building, currentLevel]);
  
  if (!nextLevelInfo) return <div>Loading...</div>;
  
  return (
    <div className="building-recommendation">
      <h4>{building} → Level {currentLevel + 1}</h4>
      <div className="costs">
        <span>🪵 {nextLevelInfo.costs.wood}</span>
        <span>🧱 {nextLevelInfo.costs.clay}</span>
        <span>⚒️ {nextLevelInfo.costs.iron}</span>
        <span>🌾 {nextLevelInfo.costs.crop}</span>
      </div>
      <div className="time">
        ⏱️ {formatTime(nextLevelInfo.time)}
      </div>
      <div className="roi">
        ROI: {calculateROI(nextLevelInfo)} hours
      </div>
    </div>
  );
}
```

## Implementation Timeline

### Phase 1: Setup (30 minutes)
1. Configure Replit with chromium
2. Install puppeteer
3. Create directory structure
4. Test basic extraction

### Phase 2: Extract T4 2x Data (1 hour)
1. Navigate to Kirilloid site
2. Extract building data
3. Extract troop data
4. Save to JSON files
5. Validate against Doug's screenshot

### Phase 3: Extract T4 1x Data (30 minutes)
1. Change server selector
2. Re-run extraction
3. Compare differences
4. Document variations

### Phase 4: Build Access Layer (1 hour)
1. Create TypeScript interfaces
2. Build data service class
3. Add API endpoints
4. Test queries

### Phase 5: Integration (1 hour)
1. Update Chrome extension
2. Add data service
3. Display in HUD
4. Test end-to-end

## Total Time: 4 hours

## Validation Checklist

- [ ] Puppeteer runs on Replit
- [ ] Can navigate Kirilloid site
- [ ] Extracts building data correctly
- [ ] T4 2x Main Building level 6 costs match Doug's screenshot
- [ ] T4 1x data differs from T4 2x
- [ ] Data accessible via API
- [ ] Chrome extension displays data
- [ ] Response time <100ms

## Risk Mitigation

1. **If Puppeteer fails on Replit**: Use local extraction, upload JSON
2. **If Kirilloid blocks scraping**: Add delays, rotate user agents
3. **If data structure unexpected**: Manual inspection, adjust parsers
4. **If extraction incomplete**: Focus on critical buildings/troops first

## Questions Resolved

1. **Can we run Puppeteer on Replit?** YES - with chromium in nix deps
2. **How do we store the data?** Static JSON files + SQLite for dynamic data
3. **How do we present the data?** API endpoints + Chrome extension service

## Next Steps

1. Set up Replit environment with chromium
2. Test Puppeteer connection to Kirilloid
3. Extract one building as proof of concept
4. Validate against known values
5. Scale to full extraction

---

*This plan provides a complete path from extraction to presentation, leveraging Replit's capabilities while maintaining our existing architecture.*