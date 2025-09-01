import { overviewParser } from './overview-parser';
import { statisticsParser } from './statistics-parser';
import { GameState, VillageProduction } from '../types';

export class TravianDataCollector {
  private cachedVillagesData: GameState['villages'] = [];
  private lastStatsFetch: number = 0;
  private STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  constructor() {
    console.log('🎮 TravianDataCollector initialized');
    this.setupDataInterceptors();
  }

  /**
   * Setup interceptors to catch village data from various sources
   */
  private setupDataInterceptors() {
    // Intercept village switch to capture production data
    this.interceptVillageSwitch();
    
    // Check for statistics page data
    if (statisticsParser.isStatisticsPage()) {
      this.updateCacheFromStatistics();
    }
  }

  /**
   * Get current game state with all available data
   */
  async collectGameState(): Promise<GameState> {
    console.log('📊 Collecting game state...');
    
    const gameState: GameState = {
      currentVillage: this.getCurrentVillageData(),
      villages: await this.getAllVillagesData(),
      resources: this.getCurrentResources(),
      timestamp: Date.now()
    };

    // Calculate totals
    if (gameState.villages.length > 0) {
      gameState.totalProduction = statisticsParser.getTotalProduction(gameState.villages);
      console.log('📈 Total production across all villages:', gameState.totalProduction);
    }

    return gameState;
  }

  /**
   * Get current village data using window.resources.production
   * FIXED: Access window object properly
   */
  private getCurrentVillageData(): GameState['currentVillage'] {
    // Try to get production data from window.resources
    let production = undefined;
    let storage = undefined;
    let maxStorage = undefined;
    
    // Access window.resources if it exists
    if (typeof window !== 'undefined' && (window as any).resources) {
      const resources = (window as any).resources;
      console.log('📦 Found window.resources:', resources);
      
      if (resources.production) {
        production = {
          wood: resources.production.l1 || 0,
          clay: resources.production.l2 || 0,
          iron: resources.production.l3 || 0,
          crop: resources.production.l4 || 0,
          freeCrop: resources.production.l5 || 0
        };
        console.log('✅ Got production from window.resources:', production);
      }
      
      if (resources.storage) {
        storage = {
          wood: resources.storage.l1 || 0,
          clay: resources.storage.l2 || 0,
          iron: resources.storage.l3 || 0,
          crop: resources.storage.l4 || 0
        };
      }
      
      if (resources.maxStorage) {
        maxStorage = {
          warehouse: resources.maxStorage.l1 || 0,
          granary: resources.maxStorage.l4 || 0
        };
      }
    } else {
      console.warn('⚠️ window.resources not found, data may be incomplete');
    }
    
    // Get active village name from UI
    const activeVillage = document.querySelector('#sidebarBoxVillagelist .active a');
    const villageName = activeVillage?.textContent?.trim() || 'Unknown Village';
    
    // Extract village ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const villageId = urlParams.get('newdid') || 
                     document.querySelector('#sidebarBoxVillagelist .active a')?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1];
    
    return {
      id: villageId || undefined,
      name: villageName,
      coordinates: { x: 0, y: 0 }, // TODO: Extract from page
      isActive: true,
      production: production,
      resources: storage,
      capacity: maxStorage
    };
  }

  /**
   * Get all villages data from cache or fetch new data
   */
  private async getAllVillagesData(): Promise<GameState['villages']> {
    // First, update current village in cache
    const currentVillage = this.getCurrentVillageData();
    this.updateVillageInCache(currentVillage);
    
    // Check if we need fresh data from statistics page
    const now = Date.now();
    if (now - this.lastStatsFetch > this.STATS_CACHE_DURATION) {
      console.log('Cache expired, consider fetching fresh data from statistics page');
      // We could auto-navigate here, but better to let user trigger it
    }
    
    // Return cached data (will be empty array if no data yet)
    return this.cachedVillagesData;
  }

  /**
   * Update a specific village in the cache
   */
  private updateVillageInCache(village: GameState['currentVillage']) {
    if (!village.id || !village.production) return;
    
    const existingIndex = this.cachedVillagesData.findIndex(v => v.id === village.id);
    
    if (existingIndex >= 0) {
      // Update existing village data
      this.cachedVillagesData[existingIndex] = {
        ...this.cachedVillagesData[existingIndex],
        ...village,
        production: village.production
      };
    } else {
      // Add new village
      this.cachedVillagesData.push({
        id: village.id,
        name: village.name,
        coordinates: village.coordinates,
        isActive: village.isActive,
        production: village.production
      });
    }
    
    console.log(`Updated cache for village ${village.name}:`, village.production);
  }

  /**
   * Update cache from statistics page
   */
  private updateCacheFromStatistics() {
    console.log('📊 Updating cache from statistics page');
    const villages = statisticsParser.parseStatisticsPage();
    
    if (villages.length > 0) {
      this.cachedVillagesData = villages;
      this.lastStatsFetch = Date.now();
      console.log(`✅ Cached data for ${villages.length} villages from statistics page`);
      
      // Store in Chrome storage for persistence
      this.saveCacheToStorage();
    }
  }

  /**
   * Intercept village switching to capture data
   */
  private interceptVillageSwitch() {
    // Listen for clicks on village links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const villageLink = target.closest('a[href*="newdid"]');
      
      if (villageLink) {
        // Small delay to let page load
        setTimeout(() => {
          const newVillageData = this.getCurrentVillageData();
          this.updateVillageInCache(newVillageData);
        }, 1000);
      }
    });
  }

  /**
   * Get current resources
   */
  private getCurrentResources(): GameState['resources'] {
    if (typeof window !== 'undefined' && (window as any).resources?.storage) {
      const storage = (window as any).resources.storage;
      return {
        wood: storage.l1 || 0,
        clay: storage.l2 || 0,
        iron: storage.l3 || 0,
        crop: storage.l4 || 0
      };
    }
    return undefined;
  }

  /**
   * Save cache to Chrome storage
   */
  private async saveCacheToStorage() {
    try {
      await chrome.storage.local.set({
        villagesCache: this.cachedVillagesData,
        lastStatsFetch: this.lastStatsFetch
      });
      console.log('💾 Cache saved to storage');
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  /**
   * Load cache from Chrome storage
   */
  async loadCacheFromStorage() {
    try {
      const data = await chrome.storage.local.get(['villagesCache', 'lastStatsFetch']);
      if (data.villagesCache) {
        this.cachedVillagesData = data.villagesCache;
        this.lastStatsFetch = data.lastStatsFetch || 0;
        console.log(`💾 Loaded ${this.cachedVillagesData.length} villages from storage cache`);
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }

  /**
   * Public method to trigger statistics page fetch
   */
  async fetchFromStatisticsPage(): Promise<boolean> {
    if (statisticsParser.isStatisticsPage()) {
      this.updateCacheFromStatistics();
      return true;
    } else {
      console.log('Not on statistics page. Navigate to statistics/general to update all village data.');
      return false;
    }
  }
}

// Export singleton instance
export const dataCollector = new TravianDataCollector();