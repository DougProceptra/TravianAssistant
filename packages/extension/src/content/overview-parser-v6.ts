/**
 * Overview Parser - Fixed version for actual Travian HTML structure
 * Fetches dorf3.php to get all village data without navigation
 * v0.6.0 - FIXED selectors based on actual Travian HTML
 */

export interface VillageOverviewData {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  isActive: boolean;
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
    cropNet?: number;
  };
  storage: {
    warehouse: number;
    warehouseCapacity: number;
    granary: number;
    granaryCapacity: number;
  };
  troops?: {
    home: number;
    away: number;
    total: number;
  };
  loyalty?: number;
  buildQueue?: Array<{
    name: string;
    level: number;
    timeRemaining: string;
  }>;
}

export interface OverviewState {
  villages: VillageOverviewData[];
  movements: {
    incoming: number;
    outgoing: number;
    attacks: Array<{
      villageId: string;
      timeToArrival: string;
      type: 'attack' | 'raid' | 'reinforcement';
    }>;
  };
  culturePoints: {
    current: number;
    production: number;
    nextSlot: number;
  };
  timestamp: number;
}

export class OverviewParser {
  private cache: Map<string, VillageOverviewData> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 60000;
  private readonly OVERVIEW_URL = '/dorf3.php';
  
  constructor() {
    console.log('[TLA Overview] Parser v0.6.0 initialized - with fixed selectors');
  }

  public getAllCachedVillages(): VillageOverviewData[] {
    return Array.from(this.cache.values());
  }

  async fetchAllVillages(forceRefresh = false): Promise<OverviewState> {
    const now = Date.now();
    
    if (!forceRefresh && this.cache.size > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      console.log('[TLA Overview] Using cached data');
      return this.buildOverviewState();
    }

    try {
      console.log('[TLA Overview] Fetching overview page from:', this.OVERVIEW_URL);
      
      const response = await fetch(this.OVERVIEW_URL, {
        credentials: 'same-origin',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch overview: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      console.log('[TLA Overview] Received HTML, parsing villages...');
      
      const villages = this.parseOverviewHTML(html);
      
      this.cache.clear();
      villages.forEach(v => this.cache.set(v.id, v));
      this.lastFetch = now;
      
      console.log(`[TLA Overview] Successfully parsed ${villages.length} villages`);
      
      return this.buildOverviewState();
    } catch (error) {
      console.error('[TLA Overview] Fetch failed:', error);
      
      if (this.cache.size > 0) {
        console.log('[TLA Overview] Returning cached data after error');
        return this.buildOverviewState();
      }
      
      return this.getCurrentVillageOnly();
    }
  }

  private parseOverviewHTML(html: string): VillageOverviewData[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const villages: VillageOverviewData[] = [];

    // Try multiple selectors for the overview table
    const tableSelectors = [
      'table#overview',
      'table.overview',
      'table[id*="overview"]',
      '#overviewContentBox table',
      '.contentContainer table',
      'table.villageOverview',
      '#villageList table',
      'table'
    ];

    let overviewTable: Element | null = null;
    for (const selector of tableSelectors) {
      overviewTable = doc.querySelector(selector);
      if (overviewTable) {
        console.log(`[TLA Overview] Found table using selector: ${selector}`);
        break;
      }
    }

    if (overviewTable) {
      const rows = overviewTable.querySelectorAll('tbody tr, tr');
      console.log(`[TLA Overview] Found ${rows.length} rows in table`);
      
      rows.forEach((row, index) => {
        try {
          const village = this.parseVillageRow(row, index);
          if (village) {
            villages.push(village);
            console.log(`[TLA Overview] Parsed village ${index + 1}:`, village.name);
          }
        } catch (error) {
          console.error(`[TLA Overview] Failed to parse row ${index}:`, error);
        }
      });
    }

    // Fallback: Check sidebar/navigation for villages
    if (villages.length === 0) {
      console.log('[TLA Overview] No villages from table, checking sidebar...');
      
      const sidebarSelectors = [
        '#sidebarBoxVillagelist li a',
        '.villageList a[href*="newdid="]',
        '#villageList a[href*="newdid="]',
        '.sidebarBox a[href*="newdid="]',
        'a[href*="newdid="]'
      ];

      for (const selector of sidebarSelectors) {
        const sidebarVillages = doc.querySelectorAll(selector);
        if (sidebarVillages.length > 0) {
          console.log(`[TLA Overview] Found ${sidebarVillages.length} villages in sidebar`);
          
          sidebarVillages.forEach((link) => {
            const id = link.getAttribute('href')?.match(/newdid=(\d+)/)?.[1];
            const name = link.textContent?.trim();
            
            if (id && name) {
              villages.push({
                id,
                name,
                coordinates: { x: 0, y: 0 },
                isActive: link.classList?.contains('active') || false,
                resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
                production: { wood: 0, clay: 0, iron: 0, crop: 0 },
                storage: {
                  warehouse: 0,
                  warehouseCapacity: 0,
                  granary: 0,
                  granaryCapacity: 0
                }
              });
            }
          });
          
          if (villages.length > 0) break;
        }
      }
    }

    // Last resort: Create from current page
    if (villages.length === 0) {
      console.log('[TLA Overview] Creating village from current page data...');
      const currentVillage = this.createVillageFromCurrentPage(doc);
      if (currentVillage) {
        villages.push(currentVillage);
      }
    }

    console.log(`[TLA Overview] Total villages parsed: ${villages.length}`);
    return villages;
  }

  private parseVillageRow(row: Element, index: number): VillageOverviewData | null {
    const cells = row.querySelectorAll('td, th');
    if (cells.length < 2) return null;

    let villageId = '';
    let villageName = '';

    for (const cell of cells) {
      const link = cell.querySelector('a[href*="newdid="]');
      if (link) {
        villageId = link.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] || '';
        villageName = link.textContent?.trim() || `Village ${index + 1}`;
        break;
      }
    }

    if (!villageId) return null;

    return {
      id: villageId,
      name: villageName,
      coordinates: { x: 0, y: 0 },
      isActive: row.classList?.contains('active') || false,
      resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
      production: { wood: 0, clay: 0, iron: 0, crop: 0 },
      storage: {
        warehouse: 0,
        warehouseCapacity: 0,
        granary: 0,
        granaryCapacity: 0
      }
    };
  }

  private createVillageFromCurrentPage(doc: Document): VillageOverviewData | null {
    let villageId = '';
    
    const urlMatch = doc.location?.search?.match(/newdid=(\d+)/);
    if (urlMatch) {
      villageId = urlMatch[1];
    }
    
    if (!villageId) {
      const activeLink = doc.querySelector('.villageList .active a[href*="newdid="], .active a[href*="newdid="]');
      if (activeLink) {
        villageId = activeLink.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] || '';
      }
    }

    if (!villageId) {
      villageId = 'current_' + Date.now();
    }

    const villageName = doc.querySelector('#villageNameField')?.textContent?.trim() ||
                       doc.querySelector('.villageList .active')?.textContent?.trim() ||
                       'Current Village';

    return {
      id: villageId,
      name: villageName,
      coordinates: { x: 0, y: 0 },
      isActive: true,
      resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
      production: { wood: 0, clay: 0, iron: 0, crop: 0 },
      storage: {
        warehouse: 0,
        warehouseCapacity: 0,
        granary: 0,
        granaryCapacity: 0
      }
    };
  }

  private buildOverviewState(): OverviewState {
    const villages = Array.from(this.cache.values());
    const enrichedVillages = this.enrichCurrentVillage(villages);
    
    return {
      villages: enrichedVillages,
      movements: {
        incoming: 0,
        outgoing: 0,
        attacks: []
      },
      culturePoints: {
        current: 0,
        production: 0,
        nextSlot: this.calculateNextCPRequirement(villages.length)
      },
      timestamp: Date.now()
    };
  }

  private enrichCurrentVillage(villages: VillageOverviewData[]): VillageOverviewData[] {
    const urlParams = new URLSearchParams(window.location.search);
    const currentVillageId = urlParams.get('newdid') || this.getActiveVillageId();
    
    if (!currentVillageId) return villages;

    const villageIndex = villages.findIndex(v => v.id === currentVillageId);
    if (villageIndex === -1) return villages;

    const enrichedVillage = { ...villages[villageIndex] };
    
    const resources = {
      wood: this.parseNumber(document.querySelector('#l1')?.textContent || '0'),
      clay: this.parseNumber(document.querySelector('#l2')?.textContent || '0'),
      iron: this.parseNumber(document.querySelector('#l3')?.textContent || '0'),
      crop: this.parseNumber(document.querySelector('#l4')?.textContent || '0')
    };

    if (resources.wood > 0 || resources.clay > 0 || resources.iron > 0 || resources.crop > 0) {
      enrichedVillage.resources = resources;
      enrichedVillage.isActive = true;
    }

    villages[villageIndex] = enrichedVillage;
    return villages;
  }

  private getActiveVillageId(): string | null {
    const activeLink = document.querySelector('.villageList .active a[href*="newdid="], .active a[href*="newdid="]');
    if (activeLink) {
      return activeLink.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] || null;
    }
    return null;
  }

  private calculateNextCPRequirement(currentVillageCount: number): number {
    const requirements = [0, 0, 2000, 8000, 20000, 40000, 70000, 112000, 168000, 240000, 330000];
    const nextVillageNum = currentVillageCount + 1;
    
    if (nextVillageNum < requirements.length) {
      return requirements[nextVillageNum];
    }
    
    return Math.round(requirements[10] * Math.pow(1.3, nextVillageNum - 10));
  }

  private getCurrentVillageOnly(): OverviewState {
    const currentVillage = this.scrapeCurrentVillage();
    
    return {
      villages: currentVillage ? [currentVillage] : [],
      movements: {
        incoming: 0,
        outgoing: 0,
        attacks: []
      },
      culturePoints: {
        current: 0,
        production: 0,
        nextSlot: 2000
      },
      timestamp: Date.now()
    };
  }

  private scrapeCurrentVillage(): VillageOverviewData | null {
    const urlParams = new URLSearchParams(window.location.search);
    const villageId = urlParams.get('newdid') || this.getActiveVillageId() || '0';

    const resources = {
      wood: this.parseNumber(document.querySelector('#l1')?.textContent || '0'),
      clay: this.parseNumber(document.querySelector('#l2')?.textContent || '0'),
      iron: this.parseNumber(document.querySelector('#l3')?.textContent || '0'),
      crop: this.parseNumber(document.querySelector('#l4')?.textContent || '0')
    };

    if (resources.wood === 0 && resources.clay === 0 && resources.iron === 0 && resources.crop === 0) {
      return null;
    }

    const villageName = document.querySelector('#villageNameField')?.textContent?.trim() ||
                       document.querySelector('.villageList .active')?.textContent?.trim() ||
                       'Current Village';

    return {
      id: villageId,
      name: villageName,
      coordinates: { x: 0, y: 0 },
      isActive: true,
      resources,
      production: { wood: 0, clay: 0, iron: 0, crop: 0 },
      storage: {
        warehouse: 0,
        warehouseCapacity: 0,
        granary: 0,
        granaryCapacity: 0
      }
    };
  }

  private parseNumber(text: string | null | undefined): number {
    if (!text) return 0;
    const cleaned = text.replace(/[^\d\-]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }

  public clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
    console.log('[TLA Overview] Cache cleared');
  }
}

export const overviewParser = new OverviewParser();