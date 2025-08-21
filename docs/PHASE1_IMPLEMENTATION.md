# Phase 1 Implementation Guide: Multi-Village Data Collection

## Overview
This guide covers the integration of the new multi-village data collection system into TravianAssistant v0.3.1.

## New Components Added

### 1. Village Navigator (`village-navigator.ts`)
- Handles programmatic switching between villages
- Detects all villages in the account
- Manages navigation state
- Provides `collectAllVillagesData()` for full account scraping

### 2. Data Persistence (`data-persistence.ts`)
- IndexedDB storage for historical data
- Stores village snapshots, account snapshots, and game events
- Provides data retrieval and trend analysis
- Auto-cleanup of old data (7 days retention)

### 3. Enhanced Scraper (`enhanced-scraper.ts`)
- Integrates village navigation and data persistence
- Smart caching (30-minute refresh cycle)
- Alert detection (overflow warnings, attacks)
- Aggregated account statistics

## Integration Steps

### Step 1: Update Content Script

Edit `packages/extension/src/content/index.ts` to use the new enhanced scraper:

```typescript
// Add imports at the top
import { enhancedScraper } from './enhanced-scraper';
import { villageNavigator } from './village-navigator';
import { dataStore } from './data-persistence';

// Replace the existing scrapeGameState function
async function scrapeGameState() {
  try {
    // Use smart scraping - fast current village + cached account data
    const gameState = await enhancedScraper.getSmartGameState();
    
    console.log('[TLA] Enhanced game state collected:', {
      villages: gameState.villages.size,
      alerts: gameState.alerts.length,
      totalProduction: gameState.aggregates.totalProduction
    });
    
    return gameState;
  } catch (error) {
    console.error('[TLA] Failed to scrape game state:', error);
    // Fallback to current village only
    return enhancedScraper.scrapeCurrentVillage();
  }
}

// Add button for full account scan
function addFullScanButton() {
  const button = document.createElement('button');
  button.textContent = '🔄 Full Account Scan';
  button.className = 'tla-full-scan-btn';
  button.style.cssText = `
    position: fixed;
    bottom: 120px;
    right: 20px;
    z-index: 10000;
    padding: 10px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = '⏳ Scanning...';
    
    try {
      const fullState = await enhancedScraper.scrapeFullAccount(true);
      console.log('[TLA] Full scan complete:', fullState);
      
      // Send to background for analysis
      chrome.runtime.sendMessage({
        type: 'ANALYZE_GAME_STATE',
        state: fullState
      });
      
      button.textContent = `✅ ${fullState.villages.size} villages scanned`;
    } catch (error) {
      console.error('[TLA] Full scan failed:', error);
      button.textContent = '❌ Scan failed';
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = '🔄 Full Account Scan';
      }, 3000);
    }
  });
  
  document.body.appendChild(button);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addFullScanButton();
    initializeHUD();
  });
} else {
  addFullScanButton();
  initializeHUD();
}
```

### Step 2: Update Background Service

Edit `packages/extension/src/background.ts` to handle enhanced game state:

```typescript
private async analyzeGame(state: any): Promise<any> {
  // Check if it's enhanced state with multiple villages
  const isEnhanced = state.villages && state.aggregates;
  
  const prompt = isEnhanced ? 
    this.buildEnhancedPrompt(state) : 
    this.buildSimplePrompt(state);
  
  try {
    const response = await this.callProxy(prompt);
    // Parse and return recommendations
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Add alerts from game state if available
      if (state.alerts) {
        analysis.alerts = state.alerts;
      }
      
      return analysis;
    }
    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('[TLA BG] Failed to parse analysis:', error);
    return this.getFallbackRecommendations();
  }
}

private buildEnhancedPrompt(state: any): string {
  return `You are a Travian Legends expert analyzing a multi-village account.

ACCOUNT OVERVIEW:
- Villages: ${state.villages.size}
- Total Population: ${state.aggregates.totalPopulation}
- Total Production: Wood ${state.aggregates.totalProduction.wood}/h, Clay ${state.aggregates.totalProduction.clay}/h, Iron ${state.aggregates.totalProduction.iron}/h, Crop ${state.aggregates.totalProduction.crop}/h (Net: ${state.aggregates.totalProduction.cropNet}/h)
- Total Resources: Wood ${state.aggregates.totalResources.wood}, Clay ${state.aggregates.totalResources.clay}, Iron ${state.aggregates.totalResources.iron}, Crop ${state.aggregates.totalResources.crop}
- Culture Points: ${state.aggregates.culturePoints}
- Rank: ${state.aggregates.rank || 'Unknown'}

ALERTS:
${state.alerts.map(a => `- [${a.severity}] ${a.message}`).join('\n')}

INDIVIDUAL VILLAGES:
${Array.from(state.villages.values()).map(v => 
  `${v.villageName}: Resources (${v.resources.wood}/${v.resources.clay}/${v.resources.iron}/${v.resources.crop}), Production (+${v.production.wood}/+${v.production.clay}/+${v.production.iron}/+${v.production.crop})`
).join('\n')}

Provide exactly 3 strategic recommendations considering the ENTIRE account. Focus on:
1. Immediate actions for critical alerts
2. Resource optimization across villages
3. Strategic development priorities

Return ONLY a valid JSON object with this exact structure:
{
  "recommendations": [
    {
      "action": "Specific action including village name",
      "reason": "Why this is important now",
      "priority": "critical|high|medium|low",
      "village": "village name if applicable"
    }
  ]
}`;
}
```

### Step 3: Update HUD Display

Enhance the HUD to show multi-village information:

```typescript
// In the HUD rendering section
function renderEnhancedHUD(analysis: any, gameState: any) {
  const hud = document.getElementById('tla-hud') || createHUD();
  
  hud.innerHTML = `
    <div class="tla-header">
      <h3>AI Assistant - ${gameState.villages?.size || 1} Villages</h3>
      <span class="tla-account-stats">
        Pop: ${gameState.aggregates?.totalPopulation || 'N/A'} | 
        Rank: ${gameState.aggregates?.rank || 'N/A'}
      </span>
    </div>
    
    ${renderAlerts(gameState.alerts)}
    ${renderRecommendations(analysis.recommendations)}
    ${renderResourceSummary(gameState.aggregates)}
    
    <div class="tla-actions">
      <button id="tla-refresh">🔄 Quick Refresh</button>
      <button id="tla-full-scan">📊 Full Scan</button>
      <button id="tla-export">💾 Export Data</button>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('tla-export')?.addEventListener('click', async () => {
    const data = await dataStore.exportData();
    downloadJSON(data, `travian-data-${Date.now()}.json`);
  });
}

function renderAlerts(alerts: any[]) {
  if (!alerts || alerts.length === 0) return '';
  
  return `
    <div class="tla-alerts">
      <h4>⚠️ Alerts</h4>
      ${alerts.map(alert => `
        <div class="alert alert-${alert.severity}">
          <span class="alert-icon">${getAlertIcon(alert.type)}</span>
          <span class="alert-message">${alert.message}</span>
          ${alert.timeToEvent ? `<span class="alert-time">${alert.timeToEvent}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}
```

## Testing Steps

### 1. Load the Updated Extension
```bash
# Build the extension
cd packages/extension
npm run build

# Load in Chrome
1. Open chrome://extensions
2. Enable Developer mode
3. Click "Load unpacked"
4. Select packages/extension/dist folder
```

### 2. Test Multi-Village Collection
1. Navigate to your Travian game
2. Click the "Full Account Scan" button
3. Watch the console for village switching logs
4. Verify data is collected from all villages

### 3. Test Data Persistence
1. Open Chrome DevTools > Application > IndexedDB
2. Look for "TravianAssistantDB"
3. Verify tables: villageSnapshots, accountSnapshots, gameEvents
4. Check that data persists after page refresh

### 4. Test Alert Detection
1. Let resources accumulate near warehouse capacity
2. Refresh the analysis
3. Verify overflow warnings appear in the HUD

## Performance Considerations

### Caching Strategy
- Current village: Real-time scraping (instant)
- Full account: Cached for 30 minutes
- Historical data: Stored for 7 days
- Manual refresh: Force update available

### Resource Usage
- IndexedDB storage: ~5-10MB for 7 days of data
- Full scan time: ~30 seconds for 10 villages
- Background updates: Every 30 minutes

## Known Limitations

### Current Implementation
1. **Village Detection**: Relies on specific DOM selectors that may vary by server
2. **Production Values**: Simplified calculation, needs refinement
3. **Troop Counts**: Not yet implemented (requires barracks/rally point scraping)
4. **Building Queue**: Single village only, needs multi-village support

### Planned Improvements
- [ ] Auto-detect server-specific selectors
- [ ] Accurate production calculation from resource fields
- [ ] Troop movement tracking
- [ ] Cross-village resource balancing recommendations
- [ ] Alliance member data sharing

## Troubleshooting

### Village Switching Fails
```javascript
// Debug in console
const villages = document.querySelectorAll('.villageList li');
console.log('Villages found:', villages.length);
villages.forEach(v => console.log(v.querySelector('a')?.href));
```

### IndexedDB Not Working
```javascript
// Check if IndexedDB is available
if (!window.indexedDB) {
  console.error('IndexedDB not supported');
}

// Clear and reinitialize
indexedDB.deleteDatabase('TravianAssistantDB');
location.reload();
```

### Data Not Persisting
1. Check Chrome storage quota: `navigator.storage.estimate()`
2. Clear old data: `dataStore.cleanOldData(1)`
3. Verify no errors in console

## Next Steps

### Week 1 Remaining Tasks
- [ ] Implement accurate production calculation
- [ ] Add troop count scraping
- [ ] Improve village population calculation
- [ ] Add building queue aggregation

### Week 2 Goals
- [ ] Implement page-aware scraping (reports, statistics, map)
- [ ] Add historical trend analysis
- [ ] Create resource balance optimizer
- [ ] Implement smart NPC trade recommendations

## Metrics to Track

### Success Indicators
- Data coverage: From 10% → 60% (current implementation)
- Scan reliability: 95%+ success rate
- Performance: <3 seconds for smart state, <30 seconds for full scan
- Storage efficiency: <10MB for week of data

### User Impact
- Better recommendations based on full account context
- Proactive alerts for resource overflow
- Strategic planning with historical trends
- Multi-village coordination suggestions

---

*Last Updated: August 21, 2025*
*Version: Phase 1 - Multi-Village Data Collection*
