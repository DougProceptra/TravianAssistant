// Enhanced Multi-Village Scraper (SAFE VERSION - NO AUTO-NAVIGATION)
// Only collects data from current village unless explicitly requested

import { villageNavigator, type VillageData } from './village-navigator';
import { dataStore } from './data-persistence';

export interface EnhancedGameState {
  accountId: string;
  serverUrl: string;
  timestamp: number;
  currentVillageId: string;
  villages: Map<string, VillageData>;
  aggregates: {
    totalPopulation: number;
    totalProduction: {
      wood: number;
      clay: number;
      iron: number;
      crop: number;
      cropNet: number;
    };
    totalResources: {
      wood: number;
      clay: number;
      iron: number;
      crop: number;
    };
    villageCount: number;
    culturePoints: number;
    rank?: number;
  };
  trends?: {
    productionGrowth24h?: number;
    populationGrowth24h?: number;
    resourceFlow24h?: {
      wood: number;
      clay: number;
      iron: number;
      crop: number;
    };
  };
  alerts: Alert[];
}

interface Alert {
  type: 'overflow' | 'attack' | 'building' | 'resource';
  severity: 'critical' | 'high' | 'medium' | 'low';
  villageId?: string;
  message: string;
  timeToEvent?: string;
}

export class EnhancedScraper {
  private lastFullScrape: number = 0;
  private readonly FULL_SCRAPE_INTERVAL = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log('[TLA Scraper] Enhanced scraper initialized');
    // NO AUTOMATIC SCRAPING - removed schedulePeriodicScraping
  }

  /**
   * Scrape current page/village only (fast)
   */
  public scrapeCurrentVillage(): VillageData {
    const villageId = this.getCurrentVillageId();
    const villageName = this.getCurrentVillageName();
    
    console.log('[TLA Scraper] Scraping current village:', villageName);
    
    return {
      villageId,
      villageName,
      resources: this.scrapeResources(),
      production: this.scrapeProduction(),
      buildings: this.scrapeBuildings(),
      troops: this.scrapeTroops(),
      timestamp: Date.now()
    };
  }

  /**
   * DANGEROUS: Scrape entire account (all villages) - navigates between villages
   * Should only be called with explicit user permission
   */
  public async scrapeFullAccount(forceRefresh = false): Promise<EnhancedGameState> {
    console.log('[TLA Scraper] WARNING: Full account scrape requested - will navigate villages');
    
    // Always warn user before navigating
    if (!confirm('Full scan will navigate through all villages. This may interrupt your game. Continue?')) {
      console.log('[TLA Scraper] Full scan cancelled by user');
      // Return current village data only
      const currentData = this.scrapeCurrentVillage();
      const villages = new Map<string, VillageData>();
      villages.set(currentData.villageId, currentData);
      return this.buildEnhancedState(villages);
    }

    console.log('[TLA Scraper] Starting full account scrape with navigation...');
    
    // Use manual collection with navigation
    const allVillagesData = await villageNavigator.collectAllVillagesManual(
      () => this.scrapeCurrentVillage()
    );
    
    // Store in database
    await dataStore.storeAccountSnapshot(allVillagesData);
    
    // Store individual village snapshots
    for (const [villageId, data] of allVillagesData) {
      await dataStore.storeVillageSnapshot(data);
    }
    
    this.lastFullScrape = Date.now();
    
    // Build enhanced state with trends
    return this.buildEnhancedState(allVillagesData);
  }

  /**
   * SAFE: Get intelligent game state without navigation
   * Combines current village data with cached data from other villages
   */
  public async getSmartGameState(): Promise<EnhancedGameState> {
    console.log('[TLA Scraper] Getting smart game state (no navigation)');
    
    // First, get current village data quickly
    const currentVillage = this.scrapeCurrentVillage();
    
    // Build state with current village
    const villages = new Map<string, VillageData>();
    villages.set(currentVillage.villageId, currentVillage);
    
    // Add detected villages with cached/placeholder data
    const detectedVillages = villageNavigator.getVillages();
    
    // Get cached data for other villages from database
    for (const [villageId, village] of detectedVillages) {
      if (!villages.has(villageId)) {
        // Try to get cached data
        const cachedData = await dataStore.getLatestVillageSnapshot(villageId);
        if (cachedData) {
          villages.set(villageId, cachedData);
        } else {
          // Use placeholder data
          villages.set(villageId, village);
        }
      }
    }
    
    console.log(`[TLA Scraper] Smart state includes ${villages.size} villages (1 current, ${villages.size - 1} cached/detected)`);
    
    return this.buildEnhancedState(villages);
  }

  private async buildEnhancedState(villages: Map<string, VillageData>): Promise<EnhancedGameState> {
    const aggregates = this.calculateAggregates(villages);
    const alerts = await this.detectAlerts(villages);
    const trends = await this.calculateTrends(villages);
    
    return {
      accountId: this.getAccountId(),
      serverUrl: window.location.hostname,
      timestamp: Date.now(),
      currentVillageId: this.getCurrentVillageId(),
      villages,
      aggregates,
      trends,
      alerts
    };
  }

  private calculateAggregates(villages: Map<string, VillageData>) {
    let totalPopulation = 0;
    const totalProduction = { wood: 0, clay: 0, iron: 0, crop: 0, cropNet: 0 };
    const totalResources = { wood: 0, clay: 0, iron: 0, crop: 0 };
    
    villages.forEach(village => {
      // Sum production
      totalProduction.wood += village.production.wood || 0;
      totalProduction.clay += village.production.clay || 0;
      totalProduction.iron += village.production.iron || 0;
      totalProduction.crop += village.production.crop || 0;
      
      // Sum resources
      totalResources.wood += village.resources.wood || 0;
      totalResources.clay += village.resources.clay || 0;
      totalResources.iron += village.resources.iron || 0;
      totalResources.crop += village.resources.crop || 0;
      
      // Estimate population (would need proper calculation from buildings)
      totalPopulation += this.estimateVillagePopulation(village);
    });
    
    // Calculate net crop
    totalProduction.cropNet = totalProduction.crop - this.estimateCropConsumption(villages);
    
    return {
      totalPopulation,
      totalProduction,
      totalResources,
      villageCount: villages.size,
      culturePoints: this.scrapeCulturePoints(),
      rank: this.scrapeRank()
    };
  }

  private async detectAlerts(villages: Map<string, VillageData>): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    villages.forEach((village, villageId) => {
      // Check for resource overflow
      const warehouseCapacity = this.getWarehouseCapacity(village);
      const granaryCapacity = this.getGranaryCapacity(village);
      
      ['wood', 'clay', 'iron'].forEach(resource => {
        const res = resource as keyof typeof village.resources;
        if (village.production[res] > 0) {
          const hoursToOverflow = (warehouseCapacity - village.resources[res]) / village.production[res];
          
          if (hoursToOverflow < 2 && hoursToOverflow > 0) {
            alerts.push({
              type: 'overflow',
              severity: hoursToOverflow < 0.5 ? 'critical' : 'high',
              villageId,
              message: `${village.villageName}: ${resource} will overflow in ${this.formatTime(hoursToOverflow)}`,
              timeToEvent: this.formatTime(hoursToOverflow)
            });
          }
        }
      });
      
      // Check crop
      if (village.production.crop > 0) {
        const cropHoursToOverflow = (granaryCapacity - village.resources.crop) / village.production.crop;
        if (cropHoursToOverflow < 2 && cropHoursToOverflow > 0) {
          alerts.push({
            type: 'overflow',
            severity: cropHoursToOverflow < 0.5 ? 'critical' : 'high',
            villageId,
            message: `${village.villageName}: Crop will overflow in ${this.formatTime(cropHoursToOverflow)}`,
            timeToEvent: this.formatTime(cropHoursToOverflow)
          });
        }
      }
    });
    
    // Check for incoming attacks (would need to scrape rally point)
    const attacks = this.scrapeIncomingAttacks();
    attacks.forEach(attack => {
      alerts.push({
        type: 'attack',
        severity: 'critical',
        villageId: attack.targetVillageId,
        message: `Incoming attack in ${attack.timeToImpact}`,
        timeToEvent: attack.timeToImpact
      });
    });
    
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private async calculateTrends(villages: Map<string, VillageData>) {
    // Get historical data for trend calculation
    const historicalPromises = Array.from(villages.keys()).map(villageId =>
      dataStore.getVillageHistory(villageId, 24)
    );
    
    const historicalData = await Promise.all(historicalPromises);
    
    // Calculate 24h trends
    // This is a simplified version - you'd want more sophisticated analysis
    const trends = {
      productionGrowth24h: 0,
      populationGrowth24h: 0,
      resourceFlow24h: { wood: 0, clay: 0, iron: 0, crop: 0 }
    };
    
    // Would implement actual trend calculation here
    
    return trends;
  }

  // Helper methods for scraping specific elements
  private scrapeResources() {
    return {
      wood: this.parseNumberFromSelector('#l1'),
      clay: this.parseNumberFromSelector('#l2'),
      iron: this.parseNumberFromSelector('#l3'),
      crop: this.parseNumberFromSelector('#l4')
    };
  }

  private scrapeProduction() {
    // Would need to parse production values from resource fields or production overview
    return {
      wood: this.parseProduction('#production_wood') || 100,
      clay: this.parseProduction('#production_clay') || 100,
      iron: this.parseProduction('#production_iron') || 100,
      crop: this.parseProduction('#production_crop') || 100
    };
  }

  private scrapeBuildings() {
    const buildings: any[] = [];
    document.querySelectorAll('.buildingSlot').forEach(slot => {
      const level = slot.querySelector('.level')?.textContent;
      if (level) {
        buildings.push({
          id: slot.getAttribute('data-building-id'),
          level: parseInt(level),
          type: slot.classList[1] // Would need proper mapping
        });
      }
    });
    return buildings;
  }

  private scrapeTroops() {
    // Would need to scrape from barracks or rally point
    return [];
  }

  private scrapeIncomingAttacks() {
    // Would scrape from rally point movements
    return [];
  }

  private scrapeCulturePoints(): number {
    // Try multiple selectors for culture points
    const selectors = [
      '.culture_points',
      '#culture_points_value',
      '.culture .points',
      '[class*="culture"] .value'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const value = this.parseNumber(element);
        if (value > 0) return value;
      }
    }
    
    return 0; // Default if not found
  }

  private scrapeRank(): number | undefined {
    const rankElement = document.querySelector('.player_rank');
    return rankElement ? this.parseNumber(rankElement) : undefined;
  }

  private getCurrentVillageId(): string {
    // Extract from URL or village switcher
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('newdid') || 
           document.querySelector('.villageList .active a')?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] || 
           '0';
  }

  private getCurrentVillageName(): string {
    return document.querySelector('.villageList .active .name')?.textContent?.trim() || 
           document.querySelector('#villageNameField')?.textContent?.trim() || 
           'Unknown Village';
  }

  private getAccountId(): string {
    // Would need to extract from page or profile
    return 'account_' + window.location.hostname.replace(/\./g, '_');
  }

  private getWarehouseCapacity(village: VillageData): number {
    // Would calculate based on warehouse level
    return 10000; // Placeholder
  }

  private getGranaryCapacity(village: VillageData): number {
    // Would calculate based on granary level
    return 10000; // Placeholder
  }

  private estimateVillagePopulation(village: VillageData): number {
    // Simplified - would need proper calculation
    return village.buildings.length * 10;
  }

  private estimateCropConsumption(villages: Map<string, VillageData>): number {
    // Would calculate based on troops and buildings
    return villages.size * 50; // Placeholder
  }

  private parseNumber(element: Element | null): number {
    if (!element) return 0;
    const text = element.textContent || '0';
    return parseInt(text.replace(/[^\d-]/g, '')) || 0;
  }

  private parseNumberFromSelector(selector: string): number {
    if (!selector || selector === '0') {
      console.warn('[TLA Scraper] Invalid selector:', selector);
      return 0;
    }
    
    try {
      const element = document.querySelector(selector);
      return this.parseNumber(element);
    } catch (error) {
      console.error('[TLA Scraper] Error parsing selector:', selector, error);
      return 0;
    }
  }

  private parseProduction(selector: string): number {
    const element = document.querySelector(selector);
    if (!element) return 0;
    const text = element.textContent || '0';
    const match = text.match(/\+?(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private formatTime(hours: number): string {
    if (hours < 0) return 'Overflowing!';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  }
}

// Export singleton instance
export const enhancedScraper = new EnhancedScraper();