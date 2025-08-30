# Simplified Data Architecture for AI-Centric System
*Updated: August 30, 2025*

## Core Principle: Claude is the Brain

The AI agent handles ALL calculations, optimizations, and decision-making. We just provide raw data.

## Simplified Data Flow

```
1. Static Game Data (JSON files) → Claude reads when needed
2. Dynamic Game State (from browser) → Claude analyzes in real-time  
3. Claude's Recommendations → Display in existing extension
```

## What Changes from Previous Plan

### ❌ NO LONGER NEEDED:
- Complex TypeScript data access layer
- Calculation functions (ROI, build time, etc.)
- Caching mechanisms
- Multiple API endpoints
- Separate recommendation engine

### ✅ WHAT WE KEEP (Simplified):
- Puppeteer extraction on Replit
- Raw JSON data files
- Simple data lookup for Claude

## New Simplified Structure

```
/backend/game-data/
├── t4-1x.json          # ALL T4 1x data in one file
├── t4-2x.json          # ALL T4 2x data in one file
└── lookup.js           # Simple function for Claude to query data
```

## Data Format for Claude

```javascript
// t4-2x.json - Structured for Claude's consumption
{
  "metadata": {
    "server": "T4",
    "speed": 2,
    "extraction_date": "2025-08-30",
    "description": "2x speed means all times are halved, costs unchanged"
  },
  
  "buildings": {
    "main_building": {
      "id": 15,
      "purpose": "Reduces construction time of other buildings",
      "max_level": 20,
      "levels": {
        "1": {
          "wood": 70, "clay": 40, "iron": 60, "crop": 20,
          "time_seconds": 1050,  // Already adjusted for 2x
          "population": 2,
          "culture_points": 2,
          "effect": "3% construction time reduction"
        },
        "2": {
          "wood": 90, "clay": 50, "iron": 75, "crop": 25,
          "time_seconds": 1100,
          "population": 1,
          "culture_points": 3,
          "effect": "6% construction time reduction"
        }
        // ... all levels with human-readable effects
      }
    }
    // ... all buildings
  },
  
  "troops": {
    "romans": {
      "legionnaire": {
        "description": "Basic Roman infantry",
        "attack": 40,
        "defense_infantry": 35,
        "defense_cavalry": 50,
        "speed_fields_per_hour": 6,
        "carry_capacity": 50,
        "upkeep_per_hour": 1,
        "training_time_seconds": 800,  // Adjusted for 2x
        "costs": {
          "wood": 120, "clay": 100, "iron": 150, "crop": 30
        }
      }
      // ... all units
    }
    // ... all tribes
  },
  
  "game_mechanics": {
    "culture_points_for_villages": {
      "2": 200,   // CP needed for 2nd village on 2x server
      "3": 800,
      "4": 2000
      // ... up to 100+
    },
    "celebrations": {
      "small": {
        "culture_points": 250,
        "duration_hours": 24,
        "description": "Town celebration providing culture points"
      }
    },
    "oasis_bonuses": {
      "wood_25": {
        "bonus_percent": 25,
        "typical_defenders": "10-20 nature troops"
      }
    }
  }
}
```

## Claude's Enhanced Prompt Context

```javascript
// When Claude analyzes game state, provide:
const context = {
  gameData: {
    server: "T4",
    speed: 2,
    data: require('./game-data/t4-2x.json')  // Full data file
  },
  
  currentGameState: {
    // Scraped from browser
    villages: [...],
    resources: {...},
    buildings: {...},
    troops: {...}
  },
  
  instructions: `
    You have access to complete Travian game mechanics data.
    Calculate optimal strategies considering:
    - ROI for each building upgrade (production increase vs cost)
    - Build queue optimization 
    - Resource balance management
    - Troop cost efficiency
    - Culture point accumulation strategies
    
    All calculations should account for the ${speed}x server speed.
    Provide specific, actionable recommendations.
  `
};
```

## Simple Data Access for Claude

```javascript
// /backend/game-data/lookup.js
// This is ALL we need - just data retrieval, no calculations

function getGameData(server, speed) {
  const filename = `${server.toLowerCase()}-${speed}x.json`;
  return require(`./${filename}`);
}

function getBuildingData(server, speed, buildingName, level) {
  const data = getGameData(server, speed);
  return data.buildings[buildingName]?.levels[level];
}

function getTroopData(server, speed, tribe, unit) {
  const data = getGameData(server, speed);
  return data.troops[tribe]?.[unit];
}

// That's it! Claude does everything else
module.exports = { getGameData, getBuildingData, getTroopData };
```

## Integration with Existing AI Agent

```javascript
// In your existing AI agent extension
async function enhanceClaudeContext(gameState) {
  // Load game mechanics data
  const gameData = await fetch('/api/game-data/t4-2x.json');
  
  // Combine with current game state
  const enhancedPrompt = {
    systemContext: "You are a Travian strategy expert with access to exact game mechanics.",
    gameData: await gameData.json(),
    currentState: gameState,
    
    request: "Analyze this game state and provide strategic recommendations. " +
             "Calculate ROI for possible actions. Consider resource balance, " +
             "building queue efficiency, and long-term growth trajectory."
  };
  
  // Send to Claude
  const recommendations = await callClaude(enhancedPrompt);
  
  // Display in existing extension UI
  displayRecommendations(recommendations);
}
```

## What This Means for Implementation

### Faster Development (2-3 hours instead of 4+)
1. **Extract data** with Puppeteer (1 hour)
2. **Save as JSON** files (included above)
3. **Simple lookup functions** for Claude (30 min)
4. **Integrate with existing agent** (30 min)
5. **Test with Claude** (30 min)

### No Complex Systems Needed
- ❌ NO calculation engine
- ❌ NO caching layer  
- ❌ NO TypeScript interfaces
- ❌ NO multiple API endpoints
- ✅ Just data + Claude's intelligence

### Claude Handles All Intelligence
- ROI calculations
- Build order optimization
- Resource management strategies
- Troop composition recommendations
- Settlement timing decisions
- Culture point strategies

## Example Claude Analysis

```markdown
## Current Situation Analysis

Based on the T4 2x game data and your current state:

### Immediate Actions (Next 30 minutes)
1. **Upgrade Cropland #7 to Level 3**
   - Cost: 115 wood, 80 clay, 40 iron, 40 crop
   - Time: 8 minutes (with your Main Building level 5)
   - ROI: 2.3 hours (best current option)
   - Reason: Your crop production is limiting growth

2. **Queue Woodcutter #1 to Level 4**
   - Will complete while you sleep
   - Balances resource production for morning

### Strategic Plan (Next 24 hours)
- Focus: Reaching 200 CP for second village
- Current CP: 147/200
- Projected settlement: Tomorrow 14:30
- Critical path: Embassy → Academy → Residence

### Resource Management
Your current production ratios are suboptimal:
- Wood: 120/hr (need +40)
- Clay: 110/hr (adequate)
- Iron: 90/hr (excess)
- Crop: 45/hr (CRITICAL - need +30)

I recommend NPC trading 500 iron for crop immediately.
```

## Benefits of AI-Centric Approach

1. **Flexibility**: Claude adapts strategies based on game situation
2. **Intelligence**: Complex multi-factor optimization without coding it
3. **Explanation**: Claude explains WHY each recommendation makes sense
4. **Learning**: Claude can learn from your play style over time
5. **Simplicity**: We maintain less code, Claude does the heavy lifting

## Questions Resolved

1. **Do we need a calculation engine?** NO - Claude is the engine
2. **Do we need complex data structures?** NO - Simple JSON is enough
3. **Do we need caching?** NO - Game data is static, state updates are real-time
4. **Do we need multiple endpoints?** NO - One data file per server config

## Next Steps

1. Set up Puppeteer on Replit (30 min)
2. Extract T4 1x and 2x data (1 hour)
3. Format as Claude-friendly JSON (30 min)
4. Add simple lookup function (15 min)
5. Test with Claude in existing agent (30 min)

**Total: ~2.5 hours** vs 4+ hours in original plan

---

*This simplified approach leverages Claude's intelligence instead of building our own calculation systems. Perfect for a solopreneur who wants maximum impact with minimum code maintenance.*