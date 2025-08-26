/**
 * Overview Parser - Safe multi-village data collection
 * Fetches dorf3.php to get all village data without navigation
 * v0.5.5 - Added getAllCachedVillages method for safe-scraper compatibility
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
  private readonly CACHE_DURATION = 60000; // 1 minute cache
  // FIXED: Use dorf3.php which is confirmed working
  private readonly OVERVIEW_URL = '/dorf3.php';
  
  constructor() {
    console.log('[TLA Overview] Parser v0.5.5 initialized - using /dorf3.php');
  }

  /**
   * Get all cached villages - REQUIRED BY safe-scraper.ts
   * Returns the current cache as an array
   */
  public getAllCachedVillages(): VillageOverviewData[] {
    return Array.from(this.cache.values());
  }

  /**
   * Fetches all village data from overview page WITHOUT navigation
   */
  async fetchAllVillages(forceRefresh = false): Promise<OverviewState> {
    const now = Date.now();
    
    // Use cache if recent and not forcing refresh
    if (!forceRefresh && this.cache.size > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      console.log('[TLA Overview] Using cached data');
      return this.buildOverviewState();
    }

    try {
      console.log('[TLA Overview] Fetching overview page from:', this.OVERVIEW_URL);
      
      // Fetch the overview page
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
      
      // Update cache
      this.cache.clear();
      villages.forEach(v => this.cache.set(v.id, v));
      this.lastFetch = now;
      
      console.log(`[TLA Overview] Successfully parsed ${villages.length} villages`);
      
      return this.buildOverviewState();
    } catch (error) {
      console.error('[TLA Overview] Fetch failed:', error);
      
      // Return cached data if available
      if (this.cache.size > 0) {
        console.log('[TLA Overview] Returning cached data after error');
        return this.buildOverviewState();
      }
      
      // Fall back to current village only
      return this.getCurrentVillageOnly();
    }
  }

  /**
   * Parse the overview HTML to extract village data
   */
  private parseOverviewHTML(html: string): VillageOverviewData[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const villages: VillageOverviewData[] = [];

    // FIXED: Use the correct selector #overview which exists on dorf3.php
    const overviewTable = doc.querySelector('table#overview');
    
    if (overviewTable) {
      console.log('[TLA Overview] Found table#overview');
      
      // Get all rows from tbody
      const rows = overviewTable.querySelectorAll('tbody tr');
      console.log(`[TLA Overview] Found ${rows.length} village rows`);
      
      rows.forEach((row, index) => {
        try {
          const village = this.parseVillageRowSimplified(row, index);
          if (village) {
            villages.push(village);
            console.log(`[TLA Overview] Parsed village ${index + 1}:`, village.name);
          }
        } catch (error) {
          console.error(`[TLA Overview] Failed to parse row ${index}:`, error);
        }
      });
    }

    // Also try to get village data from the sidebar if overview parsing fails
    if (villages.length === 0) {
      console.log('[TLA Overview] No villages from table, checking sidebar');
      const sidebarVillages = doc.querySelectorAll('#sidebarBoxVillagelist a[href*="newdid="], .villageList a[href*="newdid="]');
      
      sidebarVillages.forEach((link) => {
        const id = link.getAttribute('href')?.match(/newdid=(\d+)/)?.[1];
        const name = link.textContent?.trim();
        
        if (id && name) {
          // Create basic village entry from sidebar
          villages.push({
            id,
            name,
            coordinates: { x: 0, y: 0 }, // Will be filled from current page if active
            isActive: false,
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
      
      console.log(`[TLA Overview] Got ${villages.length} villages from sidebar`);
    }

    // Extract culture points from the page
    this.parseCulturePoints(doc);

    return villages;
  }

  /**
   * Simplified parser for the specific dorf3.php table structure
   * Based on observed structure: 5 cells per row
   */
  private parseVillageRowSimplified(row: Element, index: number): VillageOverviewData | null {
    const cells = row.querySelectorAll('td');
    
    // Skip if not enough cells
    if (cells.length < 2) return null;

    // First cell contains village name with link
    const villageLink = cells[0]?.querySelector('a[href*="newdid="]');
    if (!villageLink) {
      console.warn(`[TLA Overview] No village link found in row ${index}`);
      return null;
    }

    const villageId = villageLink.getAttribute('href')?.match(/newdid=(\d+)/)?.[1];
    if (!villageId) {
      console.warn(`[TLA Overview] Could not extract village ID from row ${index}`);
      return null;
    }

    const villageName = villageLink.textContent?.trim() || `Village ${index + 1}`;

    // For now, create a basic village entry
    // The actual resources/production will be filled when visiting the village
    // or from AJAX interceptor
    return {
      id: villageId,
      name: villageName,
      coordinates: { x: 0, y: 0 }, // Will be updated from other sources
      isActive: false,
      resources: {
        wood: 0,
        clay: 0,
        iron: 0,
        crop: 0
      },
      production: {
        wood: 0,
        clay: 0,
        iron: 0,
        crop: 0
      },
      storage: {
        warehouse: 0,
        warehouseCapacity: 0,
        granary: 0,
        granaryCapacity: 0
      }
    };
  }

  /**
   * Parse culture points from the overview page
   */
  private parseCulturePoints(doc: Document): void {
    // Look for culture point elements
    const cultureSelectors = [
      '.culture_points',
      '#culture_points',
      '[class*="culture"]',
      'div.pointsWrap',
      '.culturePoints'
    ];

    for (const selector of cultureSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const text = element.textContent || '';
        const numbers = text.match(/\d+/g);
        
        if (numbers && numbers.length > 0) {
          const current = parseInt(numbers[0], 10);
          const production = numbers.length > 1 ? parseInt(numbers[1], 10) : 0;
          
          // Store globally for access
          (window as any).__tla_culture = { 
            current, 
            production,
            nextSlot: 0 // Will be calculated based on village count
          };
          
          console.log(`[TLA Overview] Culture points found - Current: ${current}, Production: ${production}`);
          break;
        }
      }
    }
  }

  /**
   * Build the complete overview state
   */
  private buildOverviewState(): OverviewState {
    const villages = Array.from(this.cache.values());
    
    // Enrich with current page data if we're on a village page
    const currentVillageData = this.enrichCurrentVillage(villages);
    
    const state: OverviewState = {
      villages: currentVillageData,
      movements: {
        incoming: 0,
        outgoing: 0,
        attacks: []
      },
      culturePoints: (window as any).__tla_culture || {
        current: 0,
        production: 0,
        nextSlot: this.calculateNextCPRequirement(villages.length)
      },
      timestamp: Date.now()
    };

    // Check for attacks
    this.checkForAttacks(state);

    return state;
  }

  /**
   * Enrich village data with current page information
   */
  private enrichCurrentVillage(villages: VillageOverviewData[]): VillageOverviewData[] {
    // Get current village ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentVillageId = urlParams.get('newdid') || this.getActiveVillageId();
    
    if (!currentVillageId) return villages;

    // Find the village in our list
    const villageIndex = villages.findIndex(v => v.id === currentVillageId);
    if (villageIndex === -1) return villages;

    // Enrich with current page data
    const enrichedVillage = { ...villages[villageIndex] };
    
    // Get resources from current page
    const resources = {
      wood: this.parseNumber(document.querySelector('#l1')?.textContent || '0'),
      clay: this.parseNumber(document.querySelector('#l2')?.textContent || '0'),
      iron: this.parseNumber(document.querySelector('#l3')?.textContent || '0'),
      crop: this.parseNumber(document.querySelector('#l4')?.textContent || '0')
    };

    if (resources.wood > 0) {
      enrichedVillage.resources = resources;
      enrichedVillage.isActive = true;
    }

    // Get coordinates if available
    const coordElement = document.querySelector('.coordinatesWrapper .coordinateX');
    if (coordElement) {
      const xCoord = this.parseNumber(coordElement.textContent || '0');
      const yCoord = this.parseNumber(document.querySelector('.coordinateY')?.textContent || '0');
      if (xCoord !== 0) {
        enrichedVillage.coordinates = { x: xCoord, y: yCoord };
      }
    }

    // Get production if available
    const productionElements = document.querySelectorAll('.production');
    if (productionElements.length >= 4) {
      enrichedVillage.production = {
        wood: this.parseNumber(productionElements[0]?.textContent || '0'),
        clay: this.parseNumber(productionElements[1]?.textContent || '0'),
        iron: this.parseNumber(productionElements[2]?.textContent || '0'),
        crop: this.parseNumber(productionElements[3]?.textContent || '0')
      };
    }

    // Update the village in the array
    villages[villageIndex] = enrichedVillage;
    
    return villages;
  }

  /**
   * Get the active village ID from the page
   */
  private getActiveVillageId(): string | null {
    // Check various places for active village
    const activeLink = document.querySelector('.villageList .active a[href*="newdid="], #sidebarBoxVillagelist .active a[href*="newdid="]');
    if (activeLink) {
      return activeLink.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] || null;
    }
    
    // Check coordinates wrapper
    const coordWrapper = document.querySelector('.coordinatesWrapper');
    if (coordWrapper) {
      const villageId = coordWrapper.getAttribute('data-did');
      if (villageId) return villageId;
    }

    return null;
  }

  /**
   * Calculate CP requirement for next village
   */
  private calculateNextCPRequirement(currentVillageCount: number): number {
    // Standard Travian CP requirements
    const requirements = [0, 0, 2000, 8000, 20000, 40000, 70000, 112000, 168000, 240000, 330000];
    
    const nextVillageNum = currentVillageCount + 1;
    
    if (nextVillageNum < requirements.length) {
      return requirements[nextVillageNum];
    }
    
    // Formula for villages beyond the table
    return Math.round(requirements[10] * Math.pow(1.3, nextVillageNum - 10));
  }

  /**
   * Check current page for attack information
   */
  private checkForAttacks(state: OverviewState): void {
    // Check for movement indicators
    const movements = document.querySelectorAll('.troop_details.inRaid, .troop_details.inAttack, .movement');
    
    movements.forEach(movement => {
      const timer = movement.querySelector('.timer, .in, span[id*="timer"]');
      if (timer) {
        const timeText = timer.textContent || '';
        const isAttack = movement.classList.contains('inAttack') || 
                         movement.textContent?.toLowerCase().includes('attack');
        
        state.movements.attacks.push({
          villageId: state.villages[0]?.id || '0', // Current village
          timeToArrival: timeText,
          type: isAttack ? 'attack' : 'raid'
        });
      }
    });

    state.movements.incoming = state.movements.attacks.length;
  }

  /**
   * Fallback to get current village only
   */
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
        nextSlot: 2000 // Default for 3rd village
      },
      timestamp: Date.now()
    };
  }

  /**
   * Scrape data from the current page
   */
  private scrapeCurrentVillage(): VillageOverviewData | null {
    const urlParams = new URLSearchParams(window.location.search);
    const villageId = urlParams.get('newdid') || this.getActiveVillageId() || '0';

    const resources = {
      wood: this.parseNumber(document.querySelector('#l1')?.textContent || '0'),
      clay: this.parseNumber(document.querySelector('#l2')?.textContent || '0'),
      iron: this.parseNumber(document.querySelector('#l3')?.textContent || '0'),
      crop: this.parseNumber(document.querySelector('#l4')?.textContent || '0')
    };

    // Only return if we actually have resource data
    if (resources.wood === 0 && resources.clay === 0 && resources.iron === 0 && resources.crop === 0) {
      return null;
    }

    return {
      id: villageId,
      name: 'Current Village',
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

  /**
   * Parse number from text, handling various formats
   */
  private parseNumber(text: string): number {
    if (!text) return 0;
    
    // Remove non-numeric characters except minus and dot
    const cleaned = text.replace(/[^\d\-\.]/g, '');
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? 0 : Math.floor(num);
  }

  /**
   * Clear cache to force refresh on next fetch
   */
  public clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
    console.log('[TLA Overview] Cache cleared');
  }
}

// Export singleton instance
export const overviewParser = new OverviewParser();