// TravianAssistant Data Collector System
// Master collector that orchestrates all data collection

export interface VillageData {
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
    warehouseMax: number;
    granaryMax: number;
  };
  buildings?: any[];
  troops?: any;
}

export interface GameState {
  villages: VillageData[];
  account: {
    tribe: string;
    population: number;
    culture: {
      current: number;
      required: number;
      daily: number;
    };
  };
  timestamp: number;
  pageType: string;
  currentVillage?: string;
}

export class MasterCollector {
  private collectors: Map<string, any> = new Map();
  private cache: GameState = {
    villages: [],
    account: {
      tribe: 'Unknown',
      population: 0,
      culture: { current: 0, required: 0, daily: 0 }
    },
    timestamp: 0,
    pageType: 'unknown'
  };

  constructor() {
    console.log('[TLA Master] Initializing data collection system');
    this.initialize();
  }

  private async initialize() {
    // Import collectors dynamically to avoid circular dependencies
    const [
      { OverviewCollector },
      { CurrentPageCollector },
      { AjaxInterceptor },
      { MemoryCollector }
    ] = await Promise.all([
      import('./overview-collector'),
      import('./current-page-collector'),
      import('./ajax-interceptor'),
      import('./memory-collector')
    ]);

    this.collectors.set('overview', new OverviewCollector());
    this.collectors.set('currentPage', new CurrentPageCollector());
    this.collectors.set('ajax', new AjaxInterceptor());
    this.collectors.set('memory', new MemoryCollector());

    // Setup AJAX interception
    this.collectors.get('ajax').on('update', (data: any) => {
      this.handleRealtimeUpdate(data);
    });

    console.log('[TLA Master] All collectors initialized');
  }

  async collectFullState(): Promise<GameState> {
    console.log('[TLA Master] Collecting full game state...');
    
    try {
      // Try overview first (most comprehensive data)
      const overviewData = await this.collectors.get('overview').collect();
      if (overviewData && overviewData.villages.length > 0) {
        this.cache.villages = overviewData.villages;
        console.log(`[TLA Master] Got ${overviewData.villages.length} villages from overview`);
      }
    } catch (error) {
      console.warn('[TLA Master] Overview collection failed:', error);
    }

    try {
      // Collect current page data
      const currentPageData = await this.collectors.get('currentPage').collect();
      if (currentPageData) {
        this.mergeCurrentPageData(currentPageData);
      }
    } catch (error) {
      console.warn('[TLA Master] Current page collection failed:', error);
    }

    try {
      // Get memory/storage data
      const memoryData = await this.collectors.get('memory').collect();
      if (memoryData) {
        this.mergeMemoryData(memoryData);
      }
    } catch (error) {
      console.warn('[TLA Master] Memory collection failed:', error);
    }

    // Update timestamp
    this.cache.timestamp = Date.now();
    
    // Determine page type
    this.cache.pageType = this.detectPageType();

    console.log('[TLA Master] Collection complete:', {
      villages: this.cache.villages.length,
      pageType: this.cache.pageType,
      hasAccount: !!this.cache.account
    });

    return this.cache;
  }

  private detectPageType(): string {
    const url = window.location.href;
    if (url.includes('dorf1.php')) return 'resources';
    if (url.includes('dorf2.php')) return 'buildings';
    if (url.includes('dorf3.php')) return 'overview';
    if (url.includes('build.php')) {
      if (url.includes('gid=16')) return 'rally_point';
      return 'building';
    }
    if (url.includes('spieler.php')) return 'profile';
    if (url.includes('statistiken.php')) return 'statistics';
    return 'unknown';
  }

  private mergeCurrentPageData(data: any) {
    // If we have current village data, update or add it
    if (data.villageId && data.resources) {
      const existingIndex = this.cache.villages.findIndex(v => v.id === data.villageId);
      
      if (existingIndex >= 0) {
        // Update existing village
        Object.assign(this.cache.villages[existingIndex], data);
      } else {
        // Add new village (current page only)
        this.cache.villages.push({
          id: data.villageId,
          name: data.villageName || 'Current Village',
          coordinates: data.coordinates || { x: 0, y: 0 },
          resources: data.resources,
          production: data.production || { wood: 0, clay: 0, iron: 0, crop: 0 },
          storage: data.storage || {
            warehouse: 0,
            granary: 0,
            warehouseMax: 0,
            granaryMax: 0
          }
        });
      }
    }

    // Update account data if available
    if (data.account) {
      Object.assign(this.cache.account, data.account);
    }
  }

  private mergeMemoryData(data: any) {
    // Merge data from localStorage/window objects
    if (data.villages) {
      data.villages.forEach((village: VillageData) => {
        const existingIndex = this.cache.villages.findIndex(v => v.id === village.id);
        if (existingIndex < 0) {
          this.cache.villages.push(village);
        }
      });
    }

    if (data.account) {
      Object.assign(this.cache.account, data.account);
    }
  }

  private handleRealtimeUpdate(data: any) {
    console.log('[TLA Master] Realtime update received:', data.type);
    
    // Update cache with realtime data
    if (data.villageId && data.resources) {
      const village = this.cache.villages.find(v => v.id === data.villageId);
      if (village && data.resources) {
        village.resources = data.resources;
      }
    }
  }

  getCache(): GameState {
    return this.cache;
  }

  async getSettlementData() {
    // Specialized method for settlement advisor
    await this.collectFullState();
    
    return {
      villages: this.cache.villages,
      culture: this.cache.account.culture,
      population: this.cache.account.population,
      totalProduction: this.calculateTotalProduction(),
      nextSettlementRequirements: this.calculateSettlementRequirements()
    };
  }

  private calculateTotalProduction() {
    const total = { wood: 0, clay: 0, iron: 0, crop: 0 };
    
    this.cache.villages.forEach(village => {
      if (village.production) {
        total.wood += village.production.wood;
        total.clay += village.production.clay;
        total.iron += village.production.iron;
        total.crop += village.production.crop;
      }
    });
    
    return total;
  }

  private calculateSettlementRequirements() {
    // Standard requirements for settling
    const settlers = 3;
    const resourcesNeeded = {
      wood: 750,
      clay: 750,
      iron: 750,
      crop: 750
    };
    
    // Culture point requirements based on number of villages
    const villageCount = this.cache.villages.length;
    const cpRequired = this.getCulturePointsRequired(villageCount + 1);
    
    return {
      settlers,
      resources: resourcesNeeded,
      culturePoints: cpRequired,
      currentCP: this.cache.account.culture.current,
      cpDeficit: Math.max(0, cpRequired - this.cache.account.culture.current),
      daysToCP: this.cache.account.culture.daily > 0
        ? Math.ceil((cpRequired - this.cache.account.culture.current) / this.cache.account.culture.daily)
        : 999
    };
  }

  private getCulturePointsRequired(villageNumber: number): number {
    // Travian formula for CP requirements
    const requirements = [0, 0, 2000, 8000, 20000, 40000, 70000, 112000, 168000, 240000, 330000];
    
    if (villageNumber < requirements.length) {
      return requirements[villageNumber];
    }
    
    // Formula for villages beyond the table
    return Math.round(requirements[10] * Math.pow(1.3, villageNumber - 10));
  }
}

// Export singleton instance
export const masterCollector = new MasterCollector();

// Expose to window for debugging
declare global {
  interface Window {
    TLA_MasterCollector: MasterCollector;
  }
}

if (typeof window !== 'undefined') {
  window.TLA_MasterCollector = masterCollector;
}
