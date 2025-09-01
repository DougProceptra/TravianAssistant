/**
 * Safe Scraper FIXED - Updated selectors for current Travian HTML
 * Fixes resource scraping and adds current village/page detection
 */

import { overviewParser, type OverviewState, type VillageOverviewData } from './overview-parser';
import { ajaxInterceptor, type AjaxResponse } from './ajax-interceptor';
import { dataStore } from './data-persistence';

export interface SafeGameState {
  accountId: string;
  serverUrl: string;
  timestamp: number;
  villages: VillageOverviewData[];
  currentVillageId: string;
  currentVillageName: string;
  currentPage: {
    type: string; // 'resources', 'village', 'building', 'reports', etc.
    buildingId?: number;
    tab?: string;
  };
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
    console.log('[TLA Safe Scraper] Initializing safe data collection...');
  }

  /**
   * Initialize the safe scraper
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
    
    // Scrape current page on load
    this.scrapeCurrentPage();
    
    // Load cached state from storage
    await this.loadCachedState();
    
    // Set up periodic scraping (every 30 seconds)
    setInterval(() => {
      this.scrapeCurrentPage();
    }, 30000);
    
    this.isInitialized = true;
    console.log('[TLA Safe Scraper] Initialization complete');
  }

  /**
   * Get current game state (combines all data sources)
   */
  public async getGameState(forceRefresh = false): Promise<SafeGameState> {
    console.log('[TLA Safe Scraper] Getting game state...');
    
    // If we have recent data and not forcing refresh, return it
    if (!forceRefresh && this.currentState && this.isDataFresh()) {
      console.log('[TLA Safe Scraper] Returning cached state');
      return this.currentState;
    }
    
    // Fetch overview data (safe - single request to dorf3.php)
    const overviewState = await this.fetchOverviewSafely();
    
    // Enhance with current page data
    const currentPageData = this.scrapeCurrentPage();
    
    // Build complete state
    const gameState = this.buildGameState(overviewState, currentPageData);
    
    // Store state
    this.currentState = gameState;
    await this.persistState(gameState);
    
    // Notify listeners
    this.notifyUpdate(gameState);
    
    return gameState;
  }

  /**
   * Safely fetch overview data with rate limiting
   */
  private async fetchOverviewSafely(): Promise<OverviewState> {
    try {
      // Check rate limit (max once per minute)
      const lastOverviewFetch = this.currentState?.lastUpdate.overview || 0;
      const timeSinceLastFetch = Date.now() - lastOverviewFetch;
      
      if (timeSinceLastFetch < 60000) {
        console.log('[TLA Safe Scraper] Rate limited - using cached overview');
        return this.getCachedOverview();
      }
      
      console.log('[TLA Safe Scraper] Fetching overview page...');
      return await overviewParser.fetchAllVillages();
    } catch (error) {
      console.error('[TLA Safe Scraper] Overview fetch failed:', error);
      return this.getCachedOverview();
    }
  }

  /**
   * Get cached overview data
   */
  private getCachedOverview(): OverviewState {
    const cachedVillages = overviewParser.getAllCachedVillages();
    
    return {
      villages: cachedVillages,
      movements: {
        incoming: 0,
        outgoing: 0,
        attacks: []
      },
      culturePoints: {
        current: 0,
        production: 0,
        nextSlot: 0
      },
      timestamp: Date.now()
    };
  }

  /**
   * Detect current page type
   */
  private detectCurrentPage(): SafeGameState['currentPage'] {
    const url = window.location.href;
    const path = window.location.pathname;
    
    // Check for specific pages
    if (url.includes('dorf1.php')) {
      return { type: 'resources' };
    } else if (url.includes('dorf2.php')) {
      return { type: 'village' };
    } else if (url.includes('dorf3.php')) {
      return { type: 'overview' };
    } else if (url.includes('build.php')) {
      const buildingId = new URLSearchParams(window.location.search).get('id');
      const tab = new URLSearchParams(window.location.search).get('t');
      return { 
        type: 'building', 
        buildingId: buildingId ? parseInt(buildingId) : undefined,
        tab: tab || undefined
      };
    } else if (url.includes('berichte.php')) {
      return { type: 'reports' };
    } else if (url.includes('nachrichten.php')) {
      return { type: 'messages' };
    } else if (url.includes('statistiken.php')) {
      return { type: 'statistics' };
    } else if (url.includes('allianz.php')) {
      return { type: 'alliance' };
    } else if (url.includes('karte.php')) {
      return { type: 'map' };
    }
    
    return { type: 'unknown' };
  }

  /**
   * Scrape data from current page only (no navigation)
   * FIXED: Updated selectors for current Travian HTML
   */
  private scrapeCurrentPage(): Partial<SafeGameState> {
    console.log('[TLA Safe Scraper] Scraping current page...');
    
    const pageData: Partial<SafeGameState> = {};
    
    // Detect current page type
    pageData.currentPage = this.detectCurrentPage();
    console.log('[TLA Safe Scraper] Current page type:', pageData.currentPage.type);
    
    // Get current village ID and name
    // Method 1: From village list (most reliable)
    const activeVillageLink = document.querySelector('#sidebarBoxVillagelist .active a, .villageList .active a');
    if (activeVillageLink) {
      const href = activeVillageLink.getAttribute('href');
      const match = href?.match(/newdid=(\d+)/);
      if (match) {
        pageData.currentVillageId = match[1];
      }
      
      // Get village name from the active element
      const nameElement = activeVillageLink.querySelector('.name') || activeVillageLink;
      pageData.currentVillageName = nameElement?.textContent?.trim() || 'Unknown';
    }
    
    // Method 2: From URL params (fallback)
    if (!pageData.currentVillageId) {
      const urlParams = new URLSearchParams(window.location.search);
      const newdid = urlParams.get('newdid');
      if (newdid) {
        pageData.currentVillageId = newdid;
      }
    }
    
    // Method 3: From village name field (another fallback)
    if (!pageData.currentVillageName) {
      const villageNameField = document.querySelector('#villageNameField, .villageInfobox .name');
      if (villageNameField) {
        pageData.currentVillageName = villageNameField.textContent?.trim() || 'Unknown';
      }
    }
    
    console.log(`[TLA Safe Scraper] Current village: ${pageData.currentVillageName} (${pageData.currentVillageId})`);
    
    // FIXED: Updated resource selectors for current Travian
    const resourceData: Partial<VillageOverviewData> = {};
    
    // Primary method: Stock bar with specific IDs
    const stockBar = document.querySelector('#stockBar, .stockBar, #stockBarResource');
    if (stockBar) {
      console.log('[TLA Safe Scraper] Found stockBar, extracting resources...');
      
      // Try multiple selector patterns
      resourceData.resources = {
        wood: this.parseResourceValue('#l1, .l1, #stockBarResource1 .value, .wood .value, [class*="wood"] .value'),
        clay: this.parseResourceValue('#l2, .l2, #stockBarResource2 .value, .clay .value, [class*="clay"] .value'),
        iron: this.parseResourceValue('#l3, .l3, #stockBarResource3 .value, .iron .value, [class*="iron"] .value'),
        crop: this.parseResourceValue('#l4, .l4, #stockBarResource4 .value, .crop .value, [class*="crop"] .value')
      };
      
      // Also try to get capacities
      const warehouseCapacity = this.parseResourceValue('#stockBarWarehouse .capacity, .warehouse .capacity');
      const granaryCapacity = this.parseResourceValue('#stockBarGranary .capacity, .granary .capacity');
      
      if (warehouseCapacity > 0 || granaryCapacity > 0) {
        resourceData.storage = {
          warehouse: resourceData.resources.wood + resourceData.resources.clay + resourceData.resources.iron,
          warehouseCapacity: warehouseCapacity,
          granary: resourceData.resources.crop,
          granaryCapacity: granaryCapacity
        };
      }
    }
    
    // Alternative method: Resource fields on dorf1.php
    if (pageData.currentPage.type === 'resources') {
      const resourceFields = document.querySelectorAll('#resourceFieldContainer .resourceField, .resourceFieldContainer .level');
      console.log(`[TLA Safe Scraper] Found ${resourceFields.length} resource fields`);
    }
    
    // Get production rates (usually visible on dorf1.php or in tooltips)
    const productionTable = document.querySelector('.production, #production, .productionTable');
    if (productionTable) {
      const rows = productionTable.querySelectorAll('tr');
      if (rows.length >= 4) {
        resourceData.production = {
          wood: this.parseProductionValue(rows[0]),
          clay: this.parseProductionValue(rows[1]),
          iron: this.parseProductionValue(rows[2]),
          crop: this.parseProductionValue(rows[3])
        };
        console.log('[TLA Safe Scraper] Production rates found:', resourceData.production);
      }
    }
    
    // Alternative: Try to get production from individual elements
    if (!resourceData.production || Object.values(resourceData.production).every(v => v === 0)) {
      resourceData.production = {
        wood: this.parseResourceValue('.r1 .num, .production .r1, #production1'),
        clay: this.parseResourceValue('.r2 .num, .production .r2, #production2'),
        iron: this.parseResourceValue('.r3 .num, .production .r3, #production3'),
        crop: this.parseResourceValue('.r4 .num, .production .r4, #production4, .r5 .num')
      };
    }
    
    // Get building queue
    const buildQueue = document.querySelectorAll('.buildingList li, .buildQueue .name, .constructionList .name');
    if (buildQueue.length > 0) {
      resourceData.buildQueue = Array.from(buildQueue).map(el => {
        const nameEl = el.querySelector('.name') || el;
        const levelEl = el.querySelector('.lvl, .level') || el;
        const timerEl = el.querySelector('.timer, [id*="timer"], .buildDuration') || el;
        
        return {
          name: nameEl?.textContent?.trim() || '',
          level: parseInt(levelEl?.textContent?.match(/\d+/)?.[0] || '0'),
          timeRemaining: timerEl?.textContent?.trim() || ''
        };
      }).filter(item => item.name); // Filter out empty entries
      
      console.log(`[TLA Safe Scraper] Found ${resourceData.buildQueue.length} buildings in queue`);
    }
    
    // Get troops if on rally point or barracks
    if (pageData.currentPage.type === 'building') {
      const troopRows = document.querySelectorAll('.troops tr, .units tr, .troop_details tr');
      if (troopRows.length > 0) {
        console.log(`[TLA Safe Scraper] Found ${troopRows.length} troop rows`);
      }
    }
    
    // Get culture points (usually in header or side panel)
    const culturePointsEl = document.querySelector('.culturepointsContainer .points, #culture_points, .culturePoints .value');
    if (culturePointsEl) {
      const cp = this.parseNumber(culturePointsEl);
      if (cp > 0) {
        pageData.culturePoints = {
          current: cp,
          production: this.parseNumber('.culturepointsContainer .production, .culturePoints .production'),
          nextSlot: this.parseNumber('.culturepointsContainer .next, .culturePoints .next')
        };
        console.log('[TLA Safe Scraper] Culture points found:', pageData.culturePoints);
      }
    }
    
    // Log what we found
    console.log('[TLA Safe Scraper] Resources found:', resourceData.resources);
    console.log('[TLA Safe Scraper] Production found:', resourceData.production);
    console.log('[TLA Safe Scraper] Current village ID:', pageData.currentVillageId);
    
    // Store the resource data in current village context
    if (pageData.currentVillageId && resourceData.resources) {
      // Update the specific village in our state
      if (this.currentState) {
        const village = this.currentState.villages.find(v => v.id === pageData.currentVillageId);
        if (village) {
          Object.assign(village, resourceData);
          console.log('[TLA Safe Scraper] Updated village data:', village);
        }
      }
    }
    
    return { ...pageData, ...resourceData };
  }

  /**
   * Parse resource value from multiple possible selectors
   */
  private parseResourceValue(selectors: string): number {
    const selectorList = selectors.split(',').map(s => s.trim());
    
    for (const selector of selectorList) {
      const element = document.querySelector(selector);
      if (element) {
        const value = this.parseNumber(element);
        if (value > 0) {
          console.log(`[TLA Safe Scraper] Found value ${value} with selector: ${selector}`);
          return value;
        }
      }
    }
    
    return 0;
  }

  /**
   * Parse production value from a table row
   */
  private parseProductionValue(row: Element): number {
    // Look for the production value in the row
    const valueEl = row.querySelector('.num, .value, td:last-child');
    if (valueEl) {
      return this.parseNumber(valueEl);
    }
    return 0;
  }

  /**
   * Build complete game state from all sources
   */
  private buildGameState(overview: OverviewState, currentPage: Partial<SafeGameState>): SafeGameState {
    // Use current page data to enhance overview
    const villages = overview.villages.map(v => {
      if (v.id === currentPage.currentVillageId) {
        // Merge with current page data if available
        return { ...v, ...(currentPage as any) };
      }
      return v;
    });
    
    // Calculate totals
    const totals = this.calculateTotals(villages);
    
    // Detect alerts
    const alerts = this.detectAlerts(villages);
    
    return {
      accountId: this.getAccountId(),
      serverUrl: window.location.hostname,
      timestamp: Date.now(),
      villages,
      currentVillageId: currentPage.currentVillageId || villages.find(v => v.isActive)?.id || '0',
      currentVillageName: currentPage.currentVillageName || 'Unknown',
      currentPage: currentPage.currentPage || { type: 'unknown' },
      totals,
      alerts,
      movements: overview.movements,
      culturePoints: currentPage.culturePoints || overview.culturePoints,
      lastUpdate: {
        overview: overview.timestamp,
        ajax: Date.now(),
        currentPage: Date.now()
      }
    };
  }

  /**
   * Calculate account totals
   */
  private calculateTotals(villages: VillageOverviewData[]): SafeGameState['totals'] {
    const totals = {
      resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
      production: { wood: 0, clay: 0, iron: 0, crop: 0, cropNet: 0 },
      population: 0,
      villageCount: villages.length
    };
    
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
      
      // Sum population
      totals.population += village.population || 0;
    });
    
    // Calculate net crop (production minus consumption - simplified)
    const cropConsumption = Math.floor(totals.population * 0.5); // Rough estimate
    totals.production.cropNet = totals.production.crop - cropConsumption;
    
    return totals;
  }

  /**
   * Detect alerts (overflow, attacks, etc.)
   */
  private detectAlerts(villages: VillageOverviewData[]): Alert[] {
    const alerts: Alert[] = [];
    
    villages.forEach(village => {
      // Check for resource overflow
      if (village.storage && village.production) {
        const warehouseSpace = village.storage.warehouseCapacity - village.storage.warehouse;
        const granarySpace = village.storage.granaryCapacity - village.storage.granary;
        
        // Check warehouse resources
        ['wood', 'clay', 'iron'].forEach(resource => {
          const res = resource as keyof typeof village.resources;
          const production = village.production[res];
          
          if (production > 0 && warehouseSpace > 0) {
            const hoursToOverflow = warehouseSpace / (production * 3); // Divide by 3 for warehouse resources
            
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
        
        // Check crop overflow/starvation
        const cropProduction = village.production.crop;
        const cropNet = village.production.cropNet || cropProduction;
        
        if (cropNet > 0 && granarySpace > 0) {
          const hoursToOverflow = granarySpace / cropNet;
          
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
        } else if (cropNet < 0) {
          const hoursToStarvation = village.resources.crop / Math.abs(cropNet);
          
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
        const villageId = this.currentState.currentVillageId;
        const village = this.currentState.villages.find(v => v.id === villageId);
        
        if (village) {
          if (response.data.resources) {
            Object.assign(village.resources, response.data.resources);
          }
          if (response.data.production) {
            Object.assign(village.production, response.data.production);
          }
          
          // Recalculate totals
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
      
      // Recalculate
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
    const currentPageAge = now - this.currentState.lastUpdate.currentPage;
    
    // Consider data fresh if overview < 5 min old and current page < 30 sec old
    return overviewAge < 300000 && currentPageAge < 30000;
  }

  /**
   * Load cached state from storage
   */
  private async loadCachedState(): Promise<void> {
    try {
      const cached = await chrome.storage.local.get('tla_safe_state');
      if (cached.tla_safe_state) {
        this.currentState = cached.tla_safe_state;
        console.log('[TLA Safe Scraper] Loaded cached state');
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
  
  private parseNumber(selector: string | Element | null): number {
    if (!selector) return 0;
    
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!element) return 0;
    
    // Get text content and clean it
    let text = element.textContent || '0';
    
    // Handle different number formats (1,234 or 1.234 or 1 234)
    text = text.replace(/[^\d-]/g, '');
    
    const num = parseInt(text) || 0;
    return num;
  }
  
  private getAccountId(): string {
    return 'account_' + window.location.hostname.replace(/\./g, '_');
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
    console.log('[TLA Safe Scraper] Manual refresh requested');
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
