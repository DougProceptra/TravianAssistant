# TravianAssistant 2.0 - Application Design Document

*Last Updated: August 21, 2025*

## Executive Summary

Based on analysis of the Resource Bar extension (10,000+ lines of code), we are pivoting from dangerous navigation-based scanning to safe, efficient data collection using Travian's built-in overview page and AJAX interception. This eliminates gameplay interruption while providing complete multi-village data.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│  Content Script Layer                                        │
│  ├── Overview Parser (dorf3.php scraper)                    │
│  ├── AJAX Interceptor (XMLHttpRequest monitor)              │
│  ├── Village Switcher Parser (dropdown data)                │
│  ├── LocalStorage Monitor (game data cache)                 │
│  └── Current Page Scraper (active village only)             │
├─────────────────────────────────────────────────────────────┤
│  Data Aggregation Layer                                      │
│  ├── Village State Manager (combines all sources)           │
│  ├── IndexedDB Persistence (historical data)                │
│  └── Change Detection (updates only changed data)           │
├─────────────────────────────────────────────────────────────┤
│  Service Worker (Background)                                 │
│  ├── Vercel Proxy Client → Claude API                       │
│  ├── Data Sync Coordinator                                  │
│  └── Notification Manager                                   │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                    │
│  ├── Resource Bar (all villages summary)                    │
│  ├── HUD Overlay (recommendations)                          │
│  └── Chat Interface (Claude interaction)                    │
└─────────────────────────────────────────────────────────────┘
```

## Key Discovery: How Resource Bar Works

After analyzing the Resource Bar extension, we discovered it uses four primary techniques to gather all village data WITHOUT navigation:

### 1. Overview Page Parsing (`dorf3.php`)
- Single page contains ALL villages data
- Resources, production, troops, buildings for every village
- No navigation required - just fetch and parse

### 2. AJAX Interception
- Game already makes multi-village AJAX calls
- Intercept responses for real-time updates
- No additional server requests needed

### 3. LocalStorage/Cookie Mining
- Game caches village data locally
- Read without server calls
- Historical data available

### 4. Village Switcher Data
- Dropdown contains all village IDs and names
- Always present on every page
- Provides village list without navigation

## Data Collection Strategy

### Primary Data Source: Overview Page (`dorf3.php`)

```typescript
interface OverviewParser {
  // Fetches and parses the overview page WITHOUT navigation
  fetchOverviewData(): Promise<VillageOverviewData>;
  
  // Data available from overview:
  interface VillageOverviewData {
    villages: Array<{
      id: string;
      name: string;
      coordinates: { x: number; y: number };
      resources: {
        wood: number;
        clay: number;
        iron: number;
        crop: number;
      };
      production: {
        wood: number;
        clay: number;
        iron: number;
        crop: number;
      };
      storage: {
        warehouse: number;
        granary: number;
      };
      troops: TroopCounts;
      buildQueue: BuildingQueue[];
    }>;
    movements: TroopMovement[];
    incomingAttacks: Attack[];
  }
}
```

### Secondary: AJAX Interception

```typescript
interface AjaxInterceptor {
  // Monitors all game AJAX calls
  interceptRequests(): void;
  
  // Captures:
  interface InterceptedData {
    resourceUpdates: ResourceUpdate[];      // Real-time resource changes
    buildingCompletions: BuildComplete[];   // Building finished events
    incomingAttacks: AttackAlert[];        // New attack warnings
    marketTransactions: Trade[];           // Market activity
    troopMovements: Movement[];            // Troop updates
  }
}
```

### Tertiary: LocalStorage/Cookie Mining

```typescript
interface StorageMonitor {
  // Reads game's own cached data
  extractGameCache(): GameCacheData;
  
  // Available data:
  interface GameCacheData {
    lastVillageStates: VillageState[];     // Last known states
    userPreferences: UserPrefs;            // Game settings
    sessionData: SessionInfo;              // Current session
    historicalData: HistoricalCache;       // Past states
  }
}
```

## Implementation Phases

### Phase 1: Safe Data Collection (Week 1)

#### 1.1 Remove ALL Navigation Code
- **DELETE** `packages/extension/src/content/village-navigator.ts`
- **REMOVE** "Full Scan" functionality from HUD
- **DISABLE** auto-navigation features
- **REMOVE** village switching logic

#### 1.2 Implement Overview Parser

```typescript
// New file: packages/extension/src/content/overview-parser.ts
export class OverviewParser {
  private overviewUrl = '/dorf3.php';
  private cache: Map<string, VillageData> = new Map();
  
  async fetchAllVillages(): Promise<VillageData[]> {
    try {
      // Fetch overview page once
      const response = await fetch(this.overviewUrl);
      if (!response.ok) throw new Error(`Failed to fetch overview: ${response.status}`);
      
      const html = await response.text();
      return this.parseOverviewHTML(html);
    } catch (error) {
      console.error('[TLA] Overview fetch failed:', error);
      // Return cached data if available
      return Array.from(this.cache.values());
    }
  }
  
  private parseOverviewHTML(html: string): VillageData[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const villages: VillageData[] = [];
    
    // Parse villages table
    const villageTable = doc.querySelector('#villages');
    if (!villageTable) {
      console.error('[TLA] No villages table found in overview');
      return villages;
    }
    
    const rows = villageTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const village = this.parseVillageRow(row);
      if (village) {
        villages.push(village);
        this.cache.set(village.id, village);
      }
    });
    
    return villages;
  }
  
  private parseVillageRow(row: Element): VillageData | null {
    // Extract village data from table row
    const cells = row.querySelectorAll('td');
    if (cells.length < 10) return null;
    
    return {
      id: this.extractVillageId(cells[0]),
      name: cells[0].textContent?.trim() || '',
      coordinates: this.extractCoordinates(cells[1]),
      resources: {
        wood: parseInt(cells[2].textContent || '0'),
        clay: parseInt(cells[3].textContent || '0'),
        iron: parseInt(cells[4].textContent || '0'),
        crop: parseInt(cells[5].textContent || '0')
      },
      production: {
        wood: parseInt(cells[6].textContent || '0'),
        clay: parseInt(cells[7].textContent || '0'),
        iron: parseInt(cells[8].textContent || '0'),
        crop: parseInt(cells[9].textContent || '0')
      }
    };
  }
}
```

#### 1.3 Implement AJAX Interceptor

```typescript
// New file: packages/extension/src/content/ajax-interceptor.ts
export class AjaxInterceptor {
  private listeners: Map<string, Function[]> = new Map();
  
  initialize() {
    // Intercept XMLHttpRequest
    this.interceptXHR();
    // Intercept fetch API
    this.interceptFetch();
    
    console.log('[TLA] AJAX Interceptor initialized');
  }
  
  private interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(...args) {
      const [method, url] = args;
      this._tla_url = url;
      this._tla_method = method;
      return originalOpen.apply(this, args);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('load', function() {
        if (this._tla_url?.includes('ajax.php')) {
          try {
            const data = JSON.parse(this.responseText);
            window.postMessage({
              type: 'TLA_AJAX_RESPONSE',
              url: this._tla_url,
              method: this._tla_method,
              data: data,
              timestamp: Date.now()
            }, '*');
          } catch (e) {
            // Not JSON response
          }
        }
      });
      return originalSend.apply(this, args);
    };
  }
  
  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      
      // Clone response to read it
      const url = args[0];
      if (url?.includes('ajax.php')) {
        const clone = response.clone();
        try {
          const data = await clone.json();
          window.postMessage({
            type: 'TLA_AJAX_RESPONSE',
            url: url,
            method: 'FETCH',
            data: data,
            timestamp: Date.now()
          }, '*');
        } catch (e) {
          // Not JSON response
        }
      }
      
      return response;
    };
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }
}
```

### Phase 2: Data Aggregation (Week 2)

#### 2.1 Village State Manager

```typescript
// New file: packages/extension/src/content/village-state-manager.ts
export class VillageStateManager {
  private villages: Map<string, VillageState> = new Map();
  private lastUpdate: number = 0;
  private updateInterval = 60000; // 1 minute minimum between updates
  
  async updateFromOverview(data: VillageData[]) {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      console.log('[TLA] Skipping update - too soon');
      return;
    }
    
    data.forEach(village => {
      const existing = this.villages.get(village.id);
      if (existing) {
        // Merge with existing data
        this.mergeVillageData(existing, village);
      } else {
        // New village
        this.villages.set(village.id, village);
      }
    });
    
    this.lastUpdate = now;
    this.persistToStorage();
  }
  
  updateFromAjax(ajaxData: any) {
    // Apply real-time updates without full refresh
    if (ajaxData.village) {
      const village = this.villages.get(ajaxData.village.id);
      if (village) {
        Object.assign(village, ajaxData.village);
        this.persistToStorage();
      }
    }
  }
  
  updateFromCurrentPage(pageData: any) {
    // Update active village with detailed data
    const activeId = this.getActiveVillageId();
    if (activeId) {
      const village = this.villages.get(activeId);
      if (village) {
        // Current page has more detailed data
        Object.assign(village, pageData);
        this.persistToStorage();
      }
    }
  }
  
  getAggregatedState(): GameState {
    return {
      villages: Array.from(this.villages.values()),
      totalProduction: this.calculateTotalProduction(),
      totalResources: this.calculateTotalResources(),
      totalPopulation: this.calculateTotalPopulation(),
      incomingAttacks: this.getAllIncomingAttacks(),
      timestamp: Date.now()
    };
  }
  
  private calculateTotalProduction() {
    let total = { wood: 0, clay: 0, iron: 0, crop: 0 };
    this.villages.forEach(v => {
      total.wood += v.production.wood;
      total.clay += v.production.clay;
      total.iron += v.production.iron;
      total.crop += v.production.crop;
    });
    return total;
  }
  
  private persistToStorage() {
    // Save to IndexedDB
    const data = this.getAggregatedState();
    chrome.storage.local.set({ 
      'tla_village_state': data,
      'tla_last_update': Date.now()
    });
  }
}
```

#### 2.2 Storage Monitor

```typescript
// New file: packages/extension/src/content/storage-monitor.ts
export class StorageMonitor {
  private pollingInterval = 5000; // Check every 5 seconds
  private lastCheck = 0;
  
  startMonitoring() {
    setInterval(() => this.checkStorage(), this.pollingInterval);
  }
  
  private checkStorage() {
    // Check localStorage for game data
    const gameData = this.extractGameData();
    if (gameData && gameData.timestamp > this.lastCheck) {
      window.postMessage({
        type: 'TLA_STORAGE_UPDATE',
        data: gameData
      }, '*');
      this.lastCheck = gameData.timestamp;
    }
  }
  
  private extractGameData() {
    const relevantKeys = [
      'village',
      'resources',
      'production',
      'troops',
      'building'
    ];
    
    const data: any = {};
    
    for (const key in localStorage) {
      if (relevantKeys.some(k => key.includes(k))) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    
    return {
      ...data,
      timestamp: Date.now()
    };
  }
}
```

### Phase 3: Enhanced AI Integration (Week 3)

#### 3.1 Complete Game State Prompts

```typescript
// Update: packages/extension/src/background.ts
class EnhancedAIAnalyzer {
  private buildComprehensivePrompt(gameState: GameState): string {
    return `
You are a Travian Legends expert analyzing a complete account state.

ACCOUNT OVERVIEW:
- Server: ${gameState.server}
- Tribe: ${gameState.tribe}
- Villages: ${gameState.villages.length}
- Total Population: ${gameState.totalPopulation}
- Account Age: Day ${gameState.serverDay}

RESOURCE SUMMARY:
- Total Production/hour:
  Wood: ${gameState.totalProduction.wood}
  Clay: ${gameState.totalProduction.clay}
  Iron: ${gameState.totalProduction.iron}
  Crop: ${gameState.totalProduction.crop} (Net: ${gameState.totalProduction.cropNet})

- Total Resources:
  Wood: ${gameState.totalResources.wood}
  Clay: ${gameState.totalResources.clay}
  Iron: ${gameState.totalResources.iron}
  Crop: ${gameState.totalResources.crop}

PER-VILLAGE DETAILS:
${gameState.villages.map((v, i) => `
Village ${i+1}: ${v.name} (${v.coordinates.x}|${v.coordinates.y})
- Resources: W:${v.resources.wood} C:${v.resources.clay} I:${v.resources.iron} Cr:${v.resources.crop}
- Production: W:${v.production.wood} C:${v.production.clay} I:${v.production.iron} Cr:${v.production.crop}
- Storage: Warehouse ${v.storage.warehouse}/${v.storage.warehouseCapacity}, Granary ${v.storage.granary}/${v.storage.granaryCapacity}
- Overflow Warning: ${v.overflowTime ? `${Math.floor(v.overflowTime/3600)}h ${Math.floor((v.overflowTime%3600)/60)}m` : 'None'}
- Buildings in Queue: ${v.buildQueue.length}
- Troops Present: ${v.troops.total}
`).join('\n')}

THREATS & OPPORTUNITIES:
- Incoming Attacks: ${gameState.incomingAttacks.length}
${gameState.incomingAttacks.map(a => `  - Attack arriving in ${a.timeToArrival} from ${a.attacker}`).join('\n')}

HISTORICAL TRENDS (Last 24h):
- Resource Growth Rate: ${gameState.trends.resourceGrowth}%
- Population Growth: +${gameState.trends.populationGrowth}
- Military Strength Change: ${gameState.trends.militaryChange}%

PLAYER PROFILE:
- Play Style: ${gameState.profile.style}
- Time Available: ${gameState.profile.hoursPerDay} hours/day
- Primary Goal: ${gameState.profile.goal}

Provide exactly 5 strategic recommendations. For each:
1. Specific action to take
2. Which village(s) affected
3. Resources/time required
4. Expected benefit
5. Priority (Critical/High/Medium/Low)

Consider:
- Resource overflow prevention
- Balanced growth across villages
- Defense requirements
- Alliance obligations
- Long-term strategic positioning

Format response as JSON for parsing.
`;
  }
}
```

### Phase 4: UI Components

#### 4.1 Resource Bar Component

```typescript
// New file: packages/extension/src/content/components/ResourceBar.tsx
import React, { useState, useEffect } from 'react';

export function ResourceBar() {
  const [villages, setVillages] = useState<VillageData[]>([]);
  const [totals, setTotals] = useState<ResourceTotals>();
  const [warnings, setWarnings] = useState<OverflowWarning[]>([]);
  
  useEffect(() => {
    // Subscribe to state updates
    const listener = (data: GameState) => {
      setVillages(data.villages);
      setTotals(data.totalProduction);
      setWarnings(calculateWarnings(data.villages));
    };
    
    window.addEventListener('TLA_STATE_UPDATE', listener);
    return () => window.removeEventListener('TLA_STATE_UPDATE', listener);
  }, []);
  
  return (
    <div className="tla-resource-bar">
      {/* Total Production Display */}
      <div className="tla-totals">
        <span className="tla-wood">🪵 {totals?.wood}/h</span>
        <span className="tla-clay">🧱 {totals?.clay}/h</span>
        <span className="tla-iron">⚙️ {totals?.iron}/h</span>
        <span className="tla-crop">🌾 {totals?.crop}/h</span>
      </div>
      
      {/* Overflow Warnings */}
      {warnings.length > 0 && (
        <div className="tla-warnings">
          {warnings.map(w => (
            <div key={w.villageId} className="tla-warning">
              ⚠️ {w.villageName}: {w.resource} full in {formatTime(w.timeToFull)}
            </div>
          ))}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="tla-actions">
        <button onClick={refreshOverview}>🔄 Refresh</button>
        <button onClick={analyzeWithAI}>🤖 Analyze</button>
        <button onClick={toggleDetails}>📊 Details</button>
      </div>
    </div>
  );
}
```

## Safety Features

### No Auto-Navigation
- Completely removed from codebase
- No automatic village switching
- No interference with user actions

### Manual Refresh Only
- User must click to update
- Respects game's rate limits
- Never interrupts gameplay

### Error Recovery
```typescript
class SafeDataCollector {
  async collectWithFallback() {
    try {
      // Try overview page first
      return await this.overviewParser.fetchAllVillages();
    } catch (error) {
      console.log('[TLA] Overview failed, using cache');
      
      try {
        // Fall back to cached data
        return await this.storage.getCachedVillages();
      } catch (cacheError) {
        console.log('[TLA] Cache failed, using current village only');
        
        // Last resort: current village only
        return [await this.scraper.scrapeCurrentVillage()];
      }
    }
  }
}
```

### Rate Limiting
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits = {
    overview: { max: 10, window: 60000 },  // 10 per minute
    ajax: { max: 100, window: 60000 },     // 100 per minute
    ai: { max: 20, window: 3600000 }       // 20 per hour
  };
  
  canMakeRequest(type: string): boolean {
    const now = Date.now();
    const limit = this.limits[type];
    const requests = this.requests.get(type) || [];
    
    // Remove old requests outside window
    const recent = requests.filter(t => now - t < limit.window);
    
    if (recent.length >= limit.max) {
      return false;
    }
    
    recent.push(now);
    this.requests.set(type, recent);
    return true;
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// Test each parser component
describe('OverviewParser', () => {
  it('should parse all villages from overview HTML', () => {
    const html = loadFixture('overview.html');
    const parser = new OverviewParser();
    const villages = parser.parseHTML(html);
    
    expect(villages).toHaveLength(6);
    expect(villages[0]).toHaveProperty('resources');
    expect(villages[0]).toHaveProperty('production');
  });
});
```

### Integration Tests
```typescript
// Test data flow between components
describe('Data Aggregation', () => {
  it('should combine data from multiple sources', async () => {
    const stateManager = new VillageStateManager();
    
    // Add overview data
    await stateManager.updateFromOverview(overviewData);
    
    // Add AJAX update
    stateManager.updateFromAjax(ajaxUpdate);
    
    // Verify aggregation
    const state = stateManager.getAggregatedState();
    expect(state.villages).toHaveLength(6);
    expect(state.totalProduction.wood).toBeGreaterThan(0);
  });
});
```

### Safety Tests
```typescript
// Verify no unwanted navigation
describe('Safety Features', () => {
  it('should never navigate automatically', () => {
    const spy = jest.spyOn(window.location, 'href', 'set');
    
    // Run all data collection
    collector.collectAllData();
    
    // Verify no navigation
    expect(spy).not.toHaveBeenCalled();
  });
});
```

## Migration Path

### From Current Version (0.4.x) to 2.0

1. **Backup User Data**
   ```typescript
   async function backupUserData() {
     const data = await chrome.storage.local.get();
     await chrome.storage.local.set({
       'tla_backup_v1': data,
       'tla_backup_date': Date.now()
     });
   }
   ```

2. **Remove Dangerous Features**
   - Delete navigation code
   - Disable Full Scan
   - Remove auto-refresh with navigation

3. **Deploy Safe Version**
   - Version 2.0.0 with overview parser only
   - Monitor for issues
   - Gradually add features

4. **Data Migration**
   ```typescript
   async function migrateData() {
     const oldData = await chrome.storage.local.get('tla_villages');
     if (oldData.tla_villages) {
       // Convert old format to new
       const newFormat = convertToV2Format(oldData.tla_villages);
       await chrome.storage.local.set({
         'tla_village_state': newFormat
       });
     }
   }
   ```

## Performance Metrics

### Target Performance
- Overview fetch: < 2 seconds
- Data aggregation: < 100ms
- UI update: < 50ms
- Memory usage: < 50MB
- CPU usage: < 5%

### Monitoring
```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  measure(operation: string, fn: Function) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    // Store metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)?.push(duration);
    
    // Log if slow
    if (duration > 1000) {
      console.warn(`[TLA] Slow operation: ${operation} took ${duration}ms`);
    }
    
    return result;
  }
  
  getStats(operation: string) {
    const times = this.metrics.get(operation) || [];
    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    };
  }
}
```

## Security Considerations

### API Key Protection
- Never store API keys in extension
- Use Vercel proxy for all Claude API calls
- Proxy URL: `https://travian-proxy-simple.vercel.app/api/proxy`

### Data Privacy
- All data stored locally in browser
- No user data sent to external servers (except Claude API via proxy)
- User can clear all data at any time

### Game Rules Compliance
- No automation of game actions
- No server scraping beyond normal user actions
- Respects rate limits
- No advantage over normal gameplay

## Deployment Plan

### Phase 1: Safety First (Immediate)
1. Remove all navigation code
2. Deploy version 2.0.0-alpha
3. Test with small group

### Phase 2: Core Features (Week 1)
1. Overview parser
2. Basic resource bar
3. Manual refresh only

### Phase 3: Enhanced Features (Week 2)
1. AJAX interception
2. Real-time updates
3. Overflow warnings

### Phase 4: AI Integration (Week 3)
1. Complete game state
2. Enhanced prompts
3. Strategic recommendations

### Phase 5: Polish (Week 4)
1. Performance optimization
2. UI improvements
3. Documentation

## Success Metrics

### Technical Metrics
- Zero navigation events
- < 10 server requests per hour
- < 100ms UI response time
- Zero gameplay interruptions

### User Metrics
- All village data visible
- Accurate resource tracking
- Useful AI recommendations
- No complaints about interference

### Comparison with Resource Bar
- Feature parity for data collection
- Better AI integration
- Cleaner UI
- Open source advantage

## Conclusion

This redesign completely eliminates the dangerous navigation-based approach in favor of safe, efficient data collection methods discovered in the Resource Bar extension. The new architecture provides:

1. **Complete Data**: All villages without navigation
2. **Real-time Updates**: Via AJAX interception
3. **Safety**: No gameplay interruption
4. **Performance**: Minimal server requests
5. **Intelligence**: Full context for Claude AI

The key insight is that Travian already provides all the data we need - we just need to collect it the right way.

---
*This document represents a complete architectural pivot based on analysis of the Resource Bar extension's successful approach.*