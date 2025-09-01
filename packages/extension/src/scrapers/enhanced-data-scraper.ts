// Enhanced Data Scraper - Fixes the data pipeline issue
// Ensures scraped data actually reaches the AI with proper values

interface VillageData {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  population: number;
  isActive: boolean;
}

interface ResourceData {
  wood: number;
  clay: number;
  iron: number;
  crop: number;
  warehouseCapacity: number;
  granaryCapacity: number;
  freeCrop: number;
  production: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
}

interface GameContext {
  user: string; // Hashed email for user identification
  currentVillage: VillageData | null;
  allVillages: VillageData[];
  resources: ResourceData;
  currentPage: string;
  serverTime: string;
  tribe: string;
  totals: {
    villages: number;
    population: number;
    culturePoints: number;
    production: {
      wood: number;
      clay: number;
      iron: number;
      crop: number;
    };
  };
}

export class EnhancedDataScraper {
  private static instance: EnhancedDataScraper;
  private lastContext: GameContext | null = null;
  private userEmail: string = '';

  private constructor() {
    this.initializeUserEmail();
  }

  static getInstance(): EnhancedDataScraper {
    if (!EnhancedDataScraper.instance) {
      EnhancedDataScraper.instance = new EnhancedDataScraper();
    }
    return EnhancedDataScraper.instance;
  }

  private async initializeUserEmail() {
    // Get user email from storage for identification
    const stored = await chrome.storage.sync.get(['userEmail']);
    if (stored.userEmail) {
      this.userEmail = this.hashEmail(stored.userEmail);
      console.log('[Enhanced Scraper] User email hash initialized:', this.userEmail);
    }
  }

  private hashEmail(email: string): string {
    // Simple hash for privacy
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async setUserEmail(email: string) {
    this.userEmail = this.hashEmail(email);
    await chrome.storage.sync.set({ userEmail: email });
    console.log('[Enhanced Scraper] User email stored and hashed');
  }

  scrapeGameContext(): GameContext {
    console.log('[Enhanced Scraper] Starting comprehensive data scrape...');

    const context: GameContext = {
      user: this.userEmail || 'anonymous',
      currentVillage: this.scrapeCurrentVillage(),
      allVillages: this.scrapeAllVillages(),
      resources: this.scrapeResources(),
      currentPage: window.location.pathname,
      serverTime: this.scrapeServerTime(),
      tribe: this.scrapeTribe(),
      totals: this.scrapeTotals()
    };

    // Log the actual scraped values for debugging
    console.log('[Enhanced Scraper] Scraped context:', {
      user: context.user,
      currentVillage: context.currentVillage,
      villageCount: context.allVillages.length,
      resources: context.resources,
      page: context.currentPage
    });

    this.lastContext = context;
    return context;
  }

  private scrapeCurrentVillage(): VillageData | null {
    try {
      // Try multiple selectors for different Travian versions
      const villageNameEl = document.querySelector('#villageNameField, .villageNameField, [class*="village-name"]');
      const coordsEl = document.querySelector('#villageCoordinates, .villageCoordinates, [class*="coordinates"]');
      
      if (!villageNameEl) {
        console.log('[Enhanced Scraper] No village name element found');
        return null;
      }

      const name = villageNameEl.textContent?.trim() || 'Unknown Village';
      
      // Extract coordinates
      let x = 0, y = 0;
      if (coordsEl) {
        const coordMatch = coordsEl.textContent?.match(/\(?\s*(-?\d+)\s*[|,]\s*(-?\d+)\s*\)?/);
        if (coordMatch) {
          x = parseInt(coordMatch[1]);
          y = parseInt(coordMatch[2]);
        }
      }

      // Get village ID from various possible sources
      const villageId = this.extractVillageId();

      // Get population
      const population = this.extractNumber(
        document.querySelector('.inhabitants, [class*="population"], #population')?.textContent
      );

      console.log(`[Enhanced Scraper] Current village: ${name} (${x}|${y}) Pop: ${population}`);

      return {
        id: villageId,
        name,
        coordinates: { x, y },
        population,
        isActive: true
      };
    } catch (error) {
      console.error('[Enhanced Scraper] Error scraping current village:', error);
      return null;
    }
  }

  private scrapeAllVillages(): VillageData[] {
    const villages: VillageData[] = [];
    
    try {
      // Try to find village list
      const villageElements = document.querySelectorAll(
        '#sidebarBoxVillagelist li, ' +
        '.villageList li, ' +
        '[class*="village-item"], ' +
        '#villageList a'
      );

      villageElements.forEach(el => {
        const nameEl = el.querySelector('.name, .villageName') || el;
        const name = nameEl.textContent?.trim();
        
        if (name) {
          const coordMatch = el.textContent?.match(/\(?\s*(-?\d+)\s*[|,]\s*(-?\d+)\s*\)?/);
          const x = coordMatch ? parseInt(coordMatch[1]) : 0;
          const y = coordMatch ? parseInt(coordMatch[2]) : 0;
          
          villages.push({
            id: el.getAttribute('data-did') || el.querySelector('a')?.href?.match(/newdid=(\d+)/)?.[1] || '',
            name,
            coordinates: { x, y },
            population: 0,
            isActive: el.classList.contains('active')
          });
        }
      });

      // If no villages found in list, at least add current village
      if (villages.length === 0) {
        const current = this.scrapeCurrentVillage();
        if (current) villages.push(current);
      }

      console.log(`[Enhanced Scraper] Found ${villages.length} villages`);
    } catch (error) {
      console.error('[Enhanced Scraper] Error scraping villages:', error);
    }

    return villages;
  }

  private scrapeResources(): ResourceData {
    const resources: ResourceData = {
      wood: 0,
      clay: 0,
      iron: 0,
      crop: 0,
      warehouseCapacity: 0,
      granaryCapacity: 0,
      freeCrop: 0,
      production: {
        wood: 0,
        clay: 0,
        iron: 0,
        crop: 0
      }
    };

    try {
      // Scrape current resources - try multiple selectors
      resources.wood = this.extractNumber(
        document.querySelector('#l1, .lumber, [class*="wood"], #stockBarResource1')?.textContent
      );
      resources.clay = this.extractNumber(
        document.querySelector('#l2, .clay, [class*="clay"], #stockBarResource2')?.textContent
      );
      resources.iron = this.extractNumber(
        document.querySelector('#l3, .iron, [class*="iron"], #stockBarResource3')?.textContent
      );
      resources.crop = this.extractNumber(
        document.querySelector('#l4, .crop, [class*="crop"], #stockBarResource4')?.textContent
      );

      // Scrape capacities
      resources.warehouseCapacity = this.extractNumber(
        document.querySelector('.warehouse, [class*="warehouse-capacity"], #stockBarCapacity')?.textContent
      );
      resources.granaryCapacity = this.extractNumber(
        document.querySelector('.granary, [class*="granary-capacity"]')?.textContent
      );

      // Scrape free crop
      resources.freeCrop = this.extractNumber(
        document.querySelector('#stockBarFreeCrop, .freeCrop, [class*="free-crop"]')?.textContent
      );

      // Scrape production rates
      const productionElements = document.querySelectorAll('.production, [class*="production-rate"]');
      productionElements.forEach((el, index) => {
        const value = this.extractNumber(el.textContent);
        if (index === 0) resources.production.wood = value;
        else if (index === 1) resources.production.clay = value;
        else if (index === 2) resources.production.iron = value;
        else if (index === 3) resources.production.crop = value;
      });

      console.log('[Enhanced Scraper] Resources scraped:', resources);
    } catch (error) {
      console.error('[Enhanced Scraper] Error scraping resources:', error);
    }

    return resources;
  }

  private scrapeTotals() {
    const totals = {
      villages: 1,
      population: 0,
      culturePoints: 0,
      production: {
        wood: 0,
        clay: 0,
        iron: 0,
        crop: 0
      }
    };

    try {
      // Get village count
      const villageCount = document.querySelector('[class*="village-count"], .villageCount');
      if (villageCount) {
        totals.villages = this.extractNumber(villageCount.textContent) || 1;
      }

      // Get total population
      const popElement = document.querySelector('.totalPopulation, [class*="total-pop"]');
      if (popElement) {
        totals.population = this.extractNumber(popElement.textContent);
      }

      // Get culture points
      const cultureElement = document.querySelector('.culturePoints, [class*="culture"]');
      if (cultureElement) {
        totals.culturePoints = this.extractNumber(cultureElement.textContent);
      }

      // Sum up production from all villages if available
      const resources = this.scrapeResources();
      totals.production = resources.production;

    } catch (error) {
      console.error('[Enhanced Scraper] Error scraping totals:', error);
    }

    return totals;
  }

  private scrapeServerTime(): string {
    const timeEl = document.querySelector('#servertime, .serverTime, [class*="server-time"]');
    return timeEl?.textContent?.trim() || new Date().toISOString();
  }

  private scrapeTribe(): string {
    // Try to detect tribe from various indicators
    const tribeIndicators = [
      { selector: '.tribe1, .romans', tribe: 'Romans' },
      { selector: '.tribe2, .teutons', tribe: 'Teutons' },
      { selector: '.tribe3, .gauls', tribe: 'Gauls' },
      { selector: '.tribe4, .nature', tribe: 'Nature' },
      { selector: '.tribe5, .natars', tribe: 'Natars' },
      { selector: '.tribe6, .egyptians', tribe: 'Egyptians' },
      { selector: '.tribe7, .huns', tribe: 'Huns' }
    ];

    for (const indicator of tribeIndicators) {
      if (document.querySelector(indicator.selector)) {
        return indicator.tribe;
      }
    }

    // Check in text content
    const bodyText = document.body.textContent?.toLowerCase() || '';
    if (bodyText.includes('egyptian')) return 'Egyptians';
    if (bodyText.includes('hun')) return 'Huns';
    if (bodyText.includes('roman')) return 'Romans';
    if (bodyText.includes('teuton')) return 'Teutons';
    if (bodyText.includes('gaul')) return 'Gauls';

    return 'Unknown';
  }

  private extractVillageId(): string {
    // Try various methods to get village ID
    const urlMatch = window.location.href.match(/newdid=(\d+)/);
    if (urlMatch) return urlMatch[1];

    const activeVillage = document.querySelector('.villageList .active, #sidebarBoxVillagelist .active');
    if (activeVillage) {
      const idAttr = activeVillage.getAttribute('data-did');
      if (idAttr) return idAttr;
    }

    // Fallback to coordinates as ID
    const coords = document.querySelector('#villageCoordinates')?.textContent;
    if (coords) return coords.replace(/[^0-9-]/g, '');

    return 'unknown';
  }

  private extractNumber(text: string | null | undefined): number {
    if (!text) return 0;
    
    // Remove non-numeric characters except minus and dot
    const cleaned = text.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? 0 : Math.floor(num);
  }

  getLastContext(): GameContext | null {
    return this.lastContext;
  }

  // Method to ensure data is properly formatted for AI
  prepareContextForAI(): string {
    const context = this.scrapeGameContext();
    
    const aiContext = {
      user: context.user,
      currentVillage: context.currentVillage ? {
        name: context.currentVillage.name,
        coords: `${context.currentVillage.coordinates.x}|${context.currentVillage.coordinates.y}`,
        population: context.currentVillage.population
      } : null,
      villageCount: context.allVillages.length,
      resources: {
        current: {
          wood: context.resources.wood,
          clay: context.resources.clay,
          iron: context.resources.iron,
          crop: context.resources.crop
        },
        capacity: {
          warehouse: context.resources.warehouseCapacity,
          granary: context.resources.granaryCapacity
        },
        production: context.resources.production,
        freeCrop: context.resources.freeCrop
      },
      tribe: context.tribe,
      totals: context.totals,
      currentPage: context.currentPage
    };

    return JSON.stringify(aiContext, null, 2);
  }
}

// Export singleton instance
export const dataScraper = EnhancedDataScraper.getInstance();
