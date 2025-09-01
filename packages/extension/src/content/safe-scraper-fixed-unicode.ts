// Safe Scraper - Fixed Unicode number parsing
// Version 1.3.1 - Minimal fix for number parsing issue

import { OverviewParser } from './overview-parser';

// Type imports
interface VillageOverviewData {
  id: string;
  name: string;
  resources: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
  production?: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
  storage?: {
    warehouse: number;
    warehouseCapacity: number;
    granary: number;
    granaryCapacity: number;
  };
  buildQueue?: Array<{
    name: string;
    level: number;
    timeRemaining: string;
  }>;
}

interface OverviewState {
  villages: VillageOverviewData[];
  movements: {
    incoming: number;
    outgoing: number;
    merchants: number;
  };
  production: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
}

interface SafeGameState {
  accountId: string;
  serverUrl: string;
  timestamp: number;
  villages: VillageOverviewData[];
  currentVillageId: string;
  totals: {
    population: number;
    villages: number;
    production: {
      wood: number;
      clay: number;
      iron: number;
      crop: number;
    };
  };
  alerts: any[];
  lastUpdate: {
    overview: number;
    currentPage: number;
  };
}

const overviewParser = new OverviewParser();

export class SafeScraper {
  private currentState: SafeGameState | null = null;
  private isInitialized = false;

  constructor() {
    console.log('[TLA Safe Scraper] Initializing safe data collection...');
    this.initialize();
  }

  private async initialize() {
    console.log('[TLA Safe Scraper] Setting up safe data collection...');
    
    // Listen for data updates from other sources
    window.addEventListener('TLA_DATA_UPDATE', (event: any) => {
      this.handleDataUpdate(event.detail);
    });
    
    // Scrape current page on load
    this.scrapeCurrentPage();
    
    // Load cached state from storage
    await this.loadCachedState();
    
    this.isInitialized = true;
    console.log('[TLA Safe Scraper] Initialization complete');
  }

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

  private scrapeCurrentPage(): Partial<VillageOverviewData> {
    console.log('[TLA Safe Scraper] Scraping current page...');
    
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
    
    // Get production if visible
    const productionElements = document.querySelectorAll('.production');
    if (productionElements.length >= 4) {
      data.production = {
        wood: this.parseNumber(productionElements[0]),
        clay: this.parseNumber(productionElements[1]),
        iron: this.parseNumber(productionElements[2]),
        crop: this.parseNumber(productionElements[3])
      };
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
    
    console.log('[TLA Safe Scraper] Current page data:', data);
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
    const digitsOnly = normalized.replace(/[^\d]/g, '');
    
    const result = parseInt(digitsOnly) || 0;
    
    // Debug logging to verify fix
    if (result > 0) {
      console.log(`[TLA Parse] "${text}" -> ${result}`);
    }
    
    return result;
  }

  private getCurrentVillageId(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('newdid') || 
           document.querySelector('.villageList .active a')?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] ||
           '0';
  }

  private buildGameState(overview: OverviewState, currentPage: Partial<VillageOverviewData>): SafeGameState {
    const currentVillageId = this.getCurrentVillageId();
    
    // Merge current page data with overview
    const villages = overview.villages.map(v => {
      if (v.id === currentVillageId && currentPage.resources) {
        return { ...v, ...currentPage };
      }
      return v;
    });
    
    // Calculate totals
    const totals = {
      population: villages.reduce((sum, v) => sum + (v.resources?.crop || 0), 0),
      villages: villages.length,
      production: {
        wood: villages.reduce((sum, v) => sum + (v.production?.wood || 0), 0),
        clay: villages.reduce((sum, v) => sum + (v.production?.clay || 0), 0),
        iron: villages.reduce((sum, v) => sum + (v.production?.iron || 0), 0),
        crop: villages.reduce((sum, v) => sum + (v.production?.crop || 0), 0)
      }
    };
    
    return {
      accountId: this.getAccountId(),
      serverUrl: window.location.hostname,
      timestamp: Date.now(),
      villages,
      currentVillageId,
      totals,
      alerts: [],
      lastUpdate: {
        overview: Date.now(),
        currentPage: Date.now()
      }
    };
  }

  private getAccountId(): string {
    const server = window.location.hostname.replace(/\./g, '_');
    return `account_${server}`;
  }

  private getCachedOverview(): OverviewState {
    const cachedVillages = overviewParser.getAllCachedVillages();
    
    return {
      villages: cachedVillages,
      movements: {
        incoming: 0,
        outgoing: 0,
        merchants: 0
      },
      production: {
        wood: 0,
        clay: 0,
        iron: 0,
        crop: 0
      }
    };
  }

  private isDataFresh(): boolean {
    if (!this.currentState) return false;
    const age = Date.now() - this.currentState.timestamp;
    return age < 30000; // 30 seconds
  }

  private async loadCachedState() {
    try {
      const stored = await chrome.storage.local.get('gameState');
      if (stored.gameState) {
        this.currentState = stored.gameState;
        console.log('[TLA Safe Scraper] Loaded cached state');
      }
    } catch (error) {
      console.error('[TLA Safe Scraper] Failed to load cached state:', error);
    }
  }

  private async persistState(state: SafeGameState) {
    try {
      await chrome.storage.local.set({ gameState: state });
    } catch (error) {
      console.error('[TLA Safe Scraper] Failed to persist state:', error);
    }
  }

  private notifyUpdate(state: SafeGameState) {
    window.dispatchEvent(new CustomEvent('TLA_STATE_UPDATE', { detail: state }));
  }

  private handleDataUpdate(data: any) {
    console.log('[TLA Safe Scraper] Received data update:', data);
    // Handle external data updates if needed
  }

  public getCurrentState(): SafeGameState | null {
    return this.currentState;
  }

  public refreshCurrentPage() {
    return this.getGameState(true);
  }
}
