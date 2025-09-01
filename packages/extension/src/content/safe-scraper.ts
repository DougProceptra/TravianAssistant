/**
 * Safe Scraper - Combines overview parser, AJAX interceptor, and current page data
 * PRIORITY: Always collect ALL villages data for strategic decisions
 * Version 1.5.1 - Using window.resources.production for accurate data
 */

import { overviewParser, type OverviewState, type VillageOverviewData } from './overview-parser';
import { ajaxInterceptor, type AjaxResponse } from './ajax-interceptor';
import { dataStore } from './data-persistence';

export interface SafeGameState {
  accountId: string;
  serverUrl: string;
  timestamp: number;
  villages: VillageOverviewData[];  // ALL villages, always
  currentVillageId: string;  // Which one is active in browser
  totals: {
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
      cropNet: number;
    };
    population: number;
    villageCount: number;
  };
  alerts: Alert[];
  movements: {
    incoming: number;
    outgoing: number;
    attacks: any[];
  };
  culturePoints: {
    current: number;
    production: number;
    nextSlot: number;
  };
  lastUpdate: {
    overview: number;
    ajax: number;
    currentPage: number;
  };
}

interface Alert {
  type: 'overflow' | 'attack' | 'building' | 'starvation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  villageId: string;
  villageName: string;
  message: string;
  timeToEvent?: string;
}

export class SafeScraper {
  private currentState: SafeGameState | null = null;
  private updateCallbacks: Set<(state: SafeGameState) => void> = new Set();
  private isInitialized = false;
  
  constructor() {
    console.log('[TLA Safe Scraper] Initializing MULTI-VILLAGE data collection...');
  }

  /**
   * Initialize the safe scraper - PUBLIC METHOD for index.ts
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[TLA Safe Scraper] Already initialized');
      return;
    }

    console.log('[TLA Safe Scraper] Setting up safe data collection...');
    
    // Initialize AJAX interceptor (passive listening only)
    ajaxInterceptor.initialize();
    
    // Subscribe to AJAX updates
    ajaxInterceptor.onUpdate((response) => {
      this.handleAjaxUpdate(response);
    });
    
    // Listen for custom update events
    window.addEventListener('TLA_DATA_UPDATE', (event: any) => {
      this.handleDataUpdate(event.detail);
    });
    
    // CRITICAL: Immediately fetch ALL villages data on initialization
    console.log('[TLA Safe Scraper] Fetching initial ALL VILLAGES data...');
    await this.getGameState(true);  // Force refresh to get all villages
    
    this.isInitialized = true;
    console.log('[TLA Safe Scraper] Initialization complete with ALL villages loaded');
  }

  /**
   * Get current game state - ALWAYS includes ALL villages
   */
  public async getGameState(forceRefresh = false): Promise<SafeGameState> {
    console.log('[TLA Safe Scraper] Getting COMPLETE game state (all villages)...');
    
    // Check if we need fresh overview data
    const needsOverview = forceRefresh || 
                          !this.currentState || 
                          !this.isOverviewDataFresh() ||
                          this.currentState.villages.length === 0;
    
    let overviewState: OverviewState;
    
    if (needsOverview) {
      // ALWAYS fetch overview for ALL villages
      console.log('[TLA Safe Scraper] Fetching ALL VILLAGES from overview...');
      overviewState = await this.fetchOverviewSafely();
      
      // Validate we got multi-village data
      if (overviewState.villages.length === 0) {
        console.warn('[TLA Safe Scraper] No villages found in overview! Attempting alternate fetch...');
        // Try to get from village switcher or other sources
        overviewState = await this.attemptAlternateVillagesFetch();
      }
      
      console.log(`[TLA Safe Scraper] Found ${overviewState.villages.length} villages in account`);
    } else {
      console.log('[TLA Safe Scraper] Using cached overview data');
      overviewState = this.getCachedOverview();
    }
    
    // Enhance ONLY current village with detailed page data
    const currentPageData = this.scrapeCurrentPage();
    console.log('[TLA Safe Scraper] Enhanced current village data:', currentPageData.name);
    
    // Build complete state with ALL villages
    const gameState = this.buildGameState(overviewState, currentPageData);
    
    // Log summary for verification
    console.log('[TLA Safe Scraper] Game state summary:', {
      totalVillages: gameState.villages.length,
      currentVillage: gameState.villages.find(v => v.id === gameState.currentVillageId)?.name,
      totalResources: gameState.totals.resources,
      totalProduction: gameState.totals.production,
      alerts: gameState.alerts.length
    });
    
    // Store state
    this.currentState = gameState;
    await this.persistState(gameState);
    
    // Notify listeners
    this.notifyUpdate(gameState);
    
    return gameState;
  }

  /**
   * Safely fetch overview data with rate limiting
   * CRITICAL: This is where we get ALL villages data
   */
  private async fetchOverviewSafely(): Promise<OverviewState> {
    try {
      // Check rate limit (max once per 30 seconds for overview)
      const lastOverviewFetch = this.currentState?.lastUpdate.overview || 0;
      const timeSinceLastFetch = Date.now() - lastOverviewFetch;
      
      if (timeSinceLastFetch < 30000 && this.currentState?.villages.length > 0) {
        console.log('[TLA Safe Scraper] Rate limited - using cached overview');
        return this.getCachedOverview();
      }
      
      console.log('[TLA Safe Scraper] Fetching overview page (dorf3.php) for ALL villages...');
      const overview = await overviewParser.fetchAllVillages();
      
      // Validate we got data
      if (!overview.villages || overview.villages.length === 0) {
        console.error('[TLA Safe Scraper] Overview fetch returned no villages!');
        // Fall back to cached if available
        if (this.currentState?.villages.length > 0) {
          return this.getCachedOverview();
        }
      }
      
      return overview;
    } catch (error) {
      console.error('[TLA Safe Scraper] Overview fetch failed:', error);
      return this.getCachedOverview();
    }
  }

  /**
   * Attempt to get villages data from alternate sources
   */
  private async attemptAlternateVillagesFetch(): Promise<OverviewState> {
    console.log('[TLA Safe Scraper] Attempting alternate village data fetch...');
    
    // Try to get from village switcher dropdown
    const villageSwitcher = document.querySelector('.villageList');
    if (villageSwitcher) {
      const villageLinks = villageSwitcher.querySelectorAll('a[href*="newdid"]');
      console.log(`[TLA Safe Scraper] Found ${villageLinks.length} villages in switcher`);
      
      const villages: VillageOverviewData[] = Array.from(villageLinks).map(link => {
        const href = link.getAttribute('href') || '';
        const id = href.match(/newdid=(\d+)/)?.[1] || '0';
        const name = link.querySelector('.name')?.textContent?.trim() || 'Unknown';
        
        return {
          id,
          name,
          resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
          production: { wood: 0, clay: 0, iron: 0, crop: 0 },
          isActive: link.parentElement?.classList.contains('active') || false
        };
      });
      
      return {
        villages,
        movements: { incoming: 0, outgoing: 0, attacks: [] },
        culturePoints: { current: 0, production: 0, nextSlot: 0 },
        timestamp: Date.now()
      };
    }
    
    // If no switcher, at least return current village
    const currentVillage = this.scrapeCurrentPage();
    return {
      villages: [{
        id: currentVillage.id || '0',
        name: currentVillage.name || 'Unknown',
        resources: currentVillage.resources || { wood: 0, clay: 0, iron: 0, crop: 0 },
        production: currentVillage.production || { wood: 0, clay: 0, iron: 0, crop: 0 },
        isActive: true
      }],
      movements: { incoming: 0, outgoing: 0, attacks: [] },
      culturePoints: { current: 0, production: 0, nextSlot: 0 },
      timestamp: Date.now()
    };
  }

  /**
   * Get cached overview data
   */
  private getCachedOverview(): OverviewState {
    const cachedVillages = this.currentState?.villages || overviewParser.getAllCachedVillages();
    
    console.log(`[TLA Safe Scraper] Using cached data for ${cachedVillages.length} villages`);
    
    return {
      villages: cachedVillages,
      movements: this.currentState?.movements || { incoming: 0, outgoing: 0, attacks: [] },
      culturePoints: this.currentState?.culturePoints || { current: 0, production: 0, nextSlot: 0 },
      timestamp: this.currentState?.timestamp || Date.now()
    };
  }

  /**
   * Check if overview data is fresh enough
   */
  private isOverviewDataFresh(): boolean {
    if (!this.currentState) return false;
    
    const now = Date.now();
    const overviewAge = now - this.currentState.lastUpdate.overview;
    
    // Consider overview stale after 1 minute (we want fresh multi-village data)
    return overviewAge < 60000;
  }

  /**
   * Scrape data from current page only (enhances one village in the full set)
   */
  private scrapeCurrentPage(): Partial<VillageOverviewData> {
    console.log('[TLA Safe Scraper] Scraping current page for enhanced detail...');
    
    const data: Partial<VillageOverviewData> = {};
    
    // Get village ID
    const urlParams = new URLSearchParams(window.location.search);
    data.id = urlParams.get('newdid') || 
              document.querySelector('.villageList .active a')?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] ||
              '0';
    
    // Get village name
    data.name = document.querySelector('.villageList .active .name')?.textContent?.trim() || 
                document.querySelector('#villageNameField')?.textContent?.trim() || 
                'Unknown';
    
    // Get resources from stockBar - WITH UNICODE FIX
    data.resources = {
      wood: this.parseNumber('#l1'),
      clay: this.parseNumber('#l2'),
      iron: this.parseNumber('#l3'),
      crop: this.parseNumber('#l4')
    };
    
    // FIXED: Get production from window.resources.production object
    // This is the REAL production data, not DOM elements
    const gameResources = (window as any).resources;
    if (gameResources?.production) {
      console.log('[TLA Safe Scraper] Using window.resources.production for real data:', gameResources.production);
      data.production = {
        wood: gameResources.production.l1 || 0,
        clay: gameResources.production.l2 || 0,
        iron: gameResources.production.l3 || 0,
        crop: gameResources.production.l4 || 0  // Can be negative, that's OK
      };
      
      // Also get free crop if available
      if (gameResources.production.l5 !== undefined) {
        (data as any).freeCrop = gameResources.production.l5;
        console.log('[TLA Safe Scraper] Free crop (after consumption):', gameResources.production.l5);
      }
    } else {
      // Fallback to DOM scraping if window.resources not available
      console.warn('[TLA Safe Scraper] window.resources.production not found, falling back to DOM');
      
      // Try to find production values in DOM (less reliable)
      const productionSelectors = [
        '.production',
        '.stockBarTable .res .num',
        '.resources .production'
      ];
      
      let productionElements: NodeListOf<Element> | null = null;
      for (const selector of productionSelectors) {
        productionElements = document.querySelectorAll(selector);
        if (productionElements.length >= 4) {
          console.log(`[TLA Safe Scraper] Found production with selector: ${selector}`);
          break;
        }
      }
      
      if (productionElements && productionElements.length >= 4) {
        data.production = {
          wood: this.parseNumber(productionElements[0]),
          clay: this.parseNumber(productionElements[1]),
          iron: this.parseNumber(productionElements[2]),
          crop: this.parseNumber(productionElements[3])
        };
      } else {
        console.error('[TLA Safe Scraper] Could not find production data');
        data.production = { wood: 0, clay: 0, iron: 0, crop: 0 };
      }
    }
    
    // Get warehouse/granary info
    const warehouseBar = document.querySelector('.warehouse .capacity');
    const granaryBar = document.querySelector('.granary .capacity');
    
    if (warehouseBar || granaryBar) {
      data.storage = {
        warehouse: data.resources.wood + data.resources.clay + data.resources.iron,
        warehouseCapacity: this.parseNumber(warehouseBar),
        granary: data.resources.crop,
        granaryCapacity: this.parseNumber(granaryBar)
      };
    }
    
    // Check for building queue
    const buildQueue = document.querySelectorAll('.buildQueue .name');
    if (buildQueue.length > 0) {
      data.buildQueue = Array.from(buildQueue).map(el => ({
        name: el.textContent?.trim() || '',
        level: parseInt(el.nextElementSibling?.textContent || '0'),
        timeRemaining: el.parentElement?.querySelector('.timer')?.textContent || ''
      }));
    }
    
    // Get troops if on rally point or barracks
    const troopElements = document.querySelectorAll('.troop_details .unit');
    if (troopElements.length > 0) {
      data.troops = Array.from(troopElements).map(el => ({
        type: el.className.replace('unit', '').trim(),
        count: this.parseNumber(el.querySelector('.value'))
      }));
    }
    
    console.log('[TLA Safe Scraper] Current page enhanced data:', data);
    return data;
  }

  /**
   * FIXED: Parse number with Unicode handling
   * Travian uses special Unicode characters in numbers that break parseInt
   */
  private parseNumber(selector: string | Element | null): number {
    if (!selector) return 0;
    
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!element) return 0;
    
    const text = element.textContent || '0';
    
    // CRITICAL FIX: Normalize Unicode characters before parsing
    // This handles the special Unicode commas and spaces Travian uses
    const normalized = text.normalize('NFKC');
    
    // Remove all non-digit characters after normalization
    const digitsOnly = normalized.replace(/[^\d-]/g, '');  // Keep minus sign for negative values
    
    const result = parseInt(digitsOnly) || 0;
    
    // Debug logging to verify fix
    if (result > 0 && result !== parseInt(text.replace(/[^\d-]/g, ''))) {
      console.log(`[TLA Parse Unicode Fix] "${text}" -> ${result}`);
    }
    
    return result;
  }

  /**
   * Build complete game state from all sources
   * ENSURES: All villages are included, current page only enhances one
   */
  private buildGameState(overview: OverviewState, currentPage: Partial<VillageOverviewData>): SafeGameState {
    // Start with ALL villages from overview
    let villages = [...overview.villages];
    
    // If we have no villages from overview, ensure at least current village
    if (villages.length === 0) {
      console.warn('[TLA Safe Scraper] No villages in overview, using current page only');
      villages = [{
        id: currentPage.id || '0',
        name: currentPage.name || 'Unknown',
        resources: currentPage.resources || { wood: 0, clay: 0, iron: 0, crop: 0 },
        production: currentPage.production || { wood: 0, clay: 0, iron: 0, crop: 0 },
        storage: currentPage.storage,
        buildQueue: currentPage.buildQueue,
        troops: currentPage.troops,
        isActive: true
      }];
    } else {
      // Enhance the current village with detailed page data
      villages = villages.map(v => {
        if (v.id === currentPage.id) {
          // Merge with more detailed current page data
          console.log(`[TLA Safe Scraper] Enhancing village ${v.name} with current page data`);
          return { ...v, ...currentPage };
        }
        return v;
      });
    }
    
    // Calculate totals across ALL villages
    const totals = this.calculateTotals(villages);
    
    // Detect alerts across ALL villages
    const alerts = this.detectAlerts(villages);
    
    // Get current village ID
    const currentVillageId = currentPage.id || villages.find(v => v.isActive)?.id || '0';
    
    console.log(`[TLA Safe Scraper] Built state with ${villages.length} villages, current: ${currentVillageId}`);
    
    return {
      accountId: this.getAccountId(),
      serverUrl: window.location.hostname,
      timestamp: Date.now(),
      villages,  // ALL villages always included
      currentVillageId,
      totals,
      alerts,
      movements: overview.movements,
      culturePoints: overview.culturePoints,
      lastUpdate: {
        overview: overview.timestamp,
        ajax: Date.now(),
        currentPage: Date.now()
      }
    };
  }

  /**
   * Calculate account totals - ACROSS ALL VILLAGES
   */
  private calculateTotals(villages: VillageOverviewData[]): SafeGameState['totals'] {
    const totals = {
      resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
      production: { wood: 0, clay: 0, iron: 0, crop: 0, cropNet: 0 },
      population: 0,
      villageCount: villages.length
    };
    
    console.log(`[TLA Safe Scraper] Calculating totals for ${villages.length} villages`);
    
    villages.forEach(village => {
      // Sum resources
      totals.resources.wood += village.resources.wood;
      totals.resources.clay += village.resources.clay;
      totals.resources.iron += village.resources.iron;
      totals.resources.crop += village.resources.crop;
      
      // Sum production
      totals.production.wood += village.production.wood;
      totals.production.clay += village.production.clay;
      totals.production.iron += village.production.iron;
      totals.production.crop += village.production.crop;
      
      // Estimate population (would need proper calculation)
      totals.population += this.estimatePopulation(village);
    });
    
    // Calculate net crop (production minus consumption)
    const cropConsumption = this.estimateCropConsumption(villages);
    totals.production.cropNet = totals.production.crop - cropConsumption;
    
    return totals;
  }

  /**
   * Detect alerts - CHECK ALL VILLAGES
   */
  private detectAlerts(villages: VillageOverviewData[]): Alert[] {
    const alerts: Alert[] = [];
    
    console.log(`[TLA Safe Scraper] Checking alerts for ${villages.length} villages`);
    
    villages.forEach(village => {
      // Check for resource overflow
      if (village.storage) {
        const warehouseSpace = village.storage.warehouseCapacity - village.storage.warehouse;
        const granarySpace = village.storage.granaryCapacity - village.storage.granary;
        
        // Check each resource for overflow
        ['wood', 'clay', 'iron'].forEach(resource => {
          const res = resource as keyof typeof village.resources;
          const production = village.production[res];
          
          if (production > 0 && warehouseSpace > 0) {
            const hoursToOverflow = warehouseSpace / production;
            
            if (hoursToOverflow < 3) {
              alerts.push({
                type: 'overflow',
                severity: hoursToOverflow < 1 ? 'critical' : hoursToOverflow < 2 ? 'high' : 'medium',
                villageId: village.id,
                villageName: village.name,
                message: `${resource} will overflow in ${this.formatTime(hoursToOverflow)}`,
                timeToEvent: this.formatTime(hoursToOverflow)
              });
            }
          }
        });
        
        // Check crop overflow
        if (village.production.crop > 0 && granarySpace > 0) {
          const hoursToOverflow = granarySpace / village.production.crop;
          
          if (hoursToOverflow < 3) {
            alerts.push({
              type: 'overflow',
              severity: hoursToOverflow < 1 ? 'critical' : hoursToOverflow < 2 ? 'high' : 'medium',
              villageId: village.id,
              villageName: village.name,
              message: `Crop will overflow in ${this.formatTime(hoursToOverflow)}`,
              timeToEvent: this.formatTime(hoursToOverflow)
            });
          }
        }
        
        // Check for crop starvation
        if (village.production.cropNet && village.production.cropNet < 0) {
          const hoursToStarvation = village.resources.crop / Math.abs(village.production.cropNet);
          
          if (hoursToStarvation < 6) {
            alerts.push({
              type: 'starvation',
              severity: hoursToStarvation < 1 ? 'critical' : hoursToStarvation < 3 ? 'high' : 'medium',
              villageId: village.id,
              villageName: village.name,
              message: `Crop will run out in ${this.formatTime(hoursToStarvation)}`,
              timeToEvent: this.formatTime(hoursToStarvation)
            });
          }
        }
      }
    });
    
    // Sort alerts by severity
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Handle AJAX updates
   */
  private handleAjaxUpdate(response: AjaxResponse): void {
    console.log('[TLA Safe Scraper] AJAX update received:', response.url);
    
    // Update current state with AJAX data if relevant
    if (this.currentState) {
      // Update last AJAX time
      this.currentState.lastUpdate.ajax = Date.now();
      
      // If it's resource or production update, merge it
      if (response.data?.resources || response.data?.production) {
        const villageId = this.getCurrentVillageId();
        const village = this.currentState.villages.find(v => v.id === villageId);
        
        if (village) {
          if (response.data.resources) {
            Object.assign(village.resources, response.data.resources);
          }
          if (response.data.production) {
            Object.assign(village.production, response.data.production);
          }
          
          // Recalculate totals for ALL villages
          this.currentState.totals = this.calculateTotals(this.currentState.villages);
          
          // Notify update
          this.notifyUpdate(this.currentState);
        }
      }
    }
  }

  /**
   * Handle custom data updates
   */
  private handleDataUpdate(detail: any): void {
    console.log('[TLA Safe Scraper] Data update:', detail.type);
    
    // Process based on update type
    switch (detail.type) {
      case 'resource':
      case 'production':
      case 'building':
        // Trigger partial state update
        this.updatePartialState(detail.data);
        break;
    }
  }

  /**
   * Update partial state without full refresh
   */
  private async updatePartialState(data: any): Promise<void> {
    if (!this.currentState) return;
    
    // Update affected village
    const village = this.currentState.villages.find(v => v.id === data.villageId);
    if (village && data) {
      Object.assign(village, data);
      
      // Recalculate across ALL villages
      this.currentState.totals = this.calculateTotals(this.currentState.villages);
      this.currentState.alerts = this.detectAlerts(this.currentState.villages);
      
      // Persist and notify
      await this.persistState(this.currentState);
      this.notifyUpdate(this.currentState);
    }
  }

  /**
   * Check if cached data is fresh
   */
  private isDataFresh(): boolean {
    if (!this.currentState) return false;
    
    const now = Date.now();
    const overviewAge = now - this.currentState.lastUpdate.overview;
    const ajaxAge = now - this.currentState.lastUpdate.ajax;
    
    // Consider data fresh if overview < 2 min old and AJAX < 30 sec old
    return overviewAge < 120000 && ajaxAge < 30000;
  }

  /**
   * Load cached state from storage
   */
  private async loadCachedState(): Promise<void> {
    try {
      const cached = await chrome.storage.local.get('tla_safe_state');
      if (cached.tla_safe_state) {
        this.currentState = cached.tla_safe_state;
        console.log(`[TLA Safe Scraper] Loaded cached state with ${this.currentState.villages.length} villages`);
      }
    } catch (error) {
      console.error('[TLA Safe Scraper] Failed to load cached state:', error);
    }
  }

  /**
   * Persist state to storage
   */
  private async persistState(state: SafeGameState): Promise<void> {
    try {
      await chrome.storage.local.set({ 'tla_safe_state': state });
      
      // Also store in IndexedDB for historical tracking
      await dataStore.storeAccountSnapshot(new Map(state.villages.map(v => [v.id, v as any])));
    } catch (error) {
      console.error('[TLA Safe Scraper] Failed to persist state:', error);
    }
  }

  /**
   * Notify listeners of state update
   */
  private notifyUpdate(state: SafeGameState): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[TLA Safe Scraper] Update callback error:', error);
      }
    });
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('TLA_STATE_UPDATE', {
      detail: state
    }));
  }

  /**
   * Subscribe to state updates
   */
  public onStateUpdate(callback: (state: SafeGameState) => void): () => void {
    this.updateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Helper functions
   */
  
  private getCurrentVillageId(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('newdid') || 
           document.querySelector('.villageList .active a')?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] ||
           '0';
  }
  
  private getAccountId(): string {
    return 'account_' + window.location.hostname.replace(/\./g, '_');
  }
  
  private estimatePopulation(village: VillageOverviewData): number {
    // Simplified estimation - would need proper calculation
    return 100 * (village.buildQueue?.length || 1);
  }
  
  private estimateCropConsumption(villages: VillageOverviewData[]): number {
    // Simplified - would calculate based on troops and buildings
    return villages.length * 50;
  }
  
  private formatTime(hours: number): string {
    if (hours < 0) return 'Now!';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  }
  
  /**
   * Manual refresh (user-triggered)
   */
  public async refresh(): Promise<SafeGameState> {
    console.log('[TLA Safe Scraper] Manual refresh requested - fetching ALL villages');
    return this.getGameState(true);
  }
  
  /**
   * Get current state without fetching
   */
  public getCurrentState(): SafeGameState | null {
    return this.currentState;
  }
}

// Export singleton instance
export const safeScraper = new SafeScraper();
