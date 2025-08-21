// Enhanced Multi-Village Scraper
// Integrates village navigation, data persistence, and intelligent collection

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
    
    // Set up periodic full account scraping
    this.schedulePeriodicScraping();
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
   * Scrape entire account (all villages) - slower but comprehensive
   */
  public async scrapeFullAccount(forceRefresh = false): Promise<EnhancedGameState> {
    // Check if we should use cached data
    if (!forceRefresh && this.shouldUseCachedData()) {
      console.log('[TLA Scraper] Using cached account data');
      const cached = await dataStore.getLatestAccountSnapshot();
      if (cached) {
        return this.buildEnhancedState(cached.villages);
      }
    }

    console.log('[TLA Scraper] Starting full account scrape...');
    
    // Collect data from all villages
    const allVillagesData = await villageNavigator.collectAllVillagesData(
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
   * Get intelligent game state with minimal overhead
   */
  public async getSmartGameState(): Promise<EnhancedGameState> {
    // First, get current village data quickly
    const currentVillage = this.scrapeCurrentVillage();
    
    // Get cached account data if available
    const cachedAccount = await dataStore.getLatestAccountSnapshot();
    
    if (cachedAccount && this.shouldUseCachedData()) {
      // Update only current village in the cached data
      cachedAccount.villages.set(currentVillage.villageId, currentVillage);
      return this.buildEnhancedState(cachedAccount.villages);
    }
    
    // If no cache or too old, do full scrape
    return this.scrapeFullAccount(true);
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
        const hoursToOverflow = (warehouseCapacity - village.resources[res]) / village.production[res];
        
        if (hoursToOverflow < 2) {
          alerts.push({
            type: 'overflow',
            severity: hoursToOverflow < 0.5 ? 'critical' : 'high',
            villageId,
            message: `${village.villageName}: ${resource} will overflow in ${this.formatTime(hoursToOverflow)}`,
            timeToEvent: this.formatTime(hoursToOverflow)
          });
        }
      });
      
      // Check crop
      const cropHoursToOverflow = (granaryCapacity - village.resources.crop) / village.production.crop;
      if (cropHoursToOverflow < 2) {
        alerts.push({
          type: 'overflow',
          severity: cropHoursToOverflow < 0.5 ? 'critical' : 'high',
          villageId,
          message: `${village.villageName}: Crop will overflow in ${this.formatTime(cropHoursToOverflow)}`,
          timeToEvent: this.formatTime(cropHoursToOverflow)
        });
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

  private schedulePeriodicScraping() {
    // Schedule full scrape every 30 minutes
    setInterval(async () => {
      console.log('[TLA Scraper] Running scheduled full account scrape');
      await this.scrapeFullAccount(true);
    }, this.FULL_SCRAPE_INTERVAL);
    
    // Clean old data daily
    setInterval(async () => {
      console.log('[TLA Scraper] Cleaning old data');
      await dataStore.cleanOldData(7); // Keep 7 days
    }, 24 * 60 * 60 * 1000);
  }

  private shouldUseCachedData(): boolean {
    return (Date.now() - this.lastFullScrape) < this.FULL_SCRAPE_INTERVAL;
  }

  // Helper methods for scraping specific elements
  private scrapeResources() {
    return {
      wood: this.parseNumber('#l1'),
      clay: this.parseNumber('#l2'),
      iron: this.parseNumber('#l3'),
      crop: this.parseNumber('#l4')
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
    const cpElement = document.querySelector('.culture_points');
    return this.parseNumber(cpElement?.textContent || '0');
  }

  private scrapeRank(): number | undefined {
    const rankElement = document.querySelector('.player_rank');
    return rankElement ? this.parseNumber(rankElement.textContent || '0') : undefined;
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

  private parseNumber(selector: string | Element): number {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    const text = element?.textContent || '0';
    return parseInt(text.replace(/[^\d-]/g, '')) || 0;
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
