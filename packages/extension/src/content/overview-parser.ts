/**
 * Overview Parser - Safe multi-village data collection
 * Fetches village/statistics overview page to get all village data without navigation
 * v0.5.3 - Fixed URL and improved error handling
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
  // FIXED: Updated to correct URL based on actual game
  private readonly OVERVIEW_URL = '/village/statistics';
  
  constructor() {
    console.log('[TLA Overview] Parser v0.5.3 initialized - using /village/statistics');
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
      console.log('[TLA Overview] Received HTML, length:', html.length);
      
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

    // Primary selector for the overview table
    const overviewTable = doc.querySelector('table#overview');
    
    if (overviewTable) {
      console.log('[TLA Overview] Found table#overview');
      
      // Get all rows from tbody
      const rows = overviewTable.querySelectorAll('tbody tr');
      console.log(`[TLA Overview] Found ${rows.length} village rows`);
      
      rows.forEach((row, index) => {
        try {
          const village = this.parseVillageRowFromOverview(row);
          if (village) {
            villages.push(village);
            console.log(`[TLA Overview] Parsed village ${index + 1}:`, village.name);
          }
        } catch (error) {
          console.error(`[TLA Overview] Failed to parse row ${index}:`, error);
        }
      });
    } else {
      console.warn('[TLA Overview] table#overview not found, trying alternative selectors');
      
      // Try other possible selectors
      const selectors = [
        '#villages tbody tr',
        '.villageList tbody tr',
        '.overviewTable tbody tr',
        'table.overview tbody tr'
      ];

      for (const selector of selectors) {
        const rows = doc.querySelectorAll(selector);
        if (rows.length > 0) {
          console.log(`[TLA Overview] Found villages using selector: ${selector}`);
          rows.forEach((row, index) => {
            try {
              const village = this.parseVillageRow(row);
              if (village) {
                villages.push(village);
              }
            } catch (error) {
              console.error(`[TLA Overview] Failed to parse village row ${index}:`, error);
            }
          });
          break;
        }
      }
    }

    if (villages.length === 0) {
      console.warn('[TLA Overview] No villages parsed, trying alternative format');
      return this.parseAlternativeFormat(doc);
    }

    // Also extract culture points and other account-wide data
    this.parseAccountData(doc);

    return villages;
  }

  /**
   * Parse a village row from the overview table (table#overview specific)
   */
  private parseVillageRowFromOverview(row: Element): VillageOverviewData | null {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) return null;

    // Based on observed structure:
    // Cell 0: Village name with link
    // Cell 1: Attack indicator (if any)
    // Cell 2: Coordinates  
    // Cell 3+: Resources or other data

    // Extract village link and ID
    const villageLink = cells[0]?.querySelector('a[href*="newdid="]');
    if (!villageLink) {
      console.warn('[TLA Overview] No village link found in row');
      return null;
    }

    const villageId = villageLink.getAttribute('href')?.match(/newdid=(\d+)/)?.[1];
    if (!villageId) {
      console.warn('[TLA Overview] Could not extract village ID');
      return null;
    }

    // Extract village name
    const villageName = villageLink.textContent?.trim() || 'Unknown';

    // Extract coordinates - might be in different cells depending on attack status
    let coordText = '';
    for (let i = 1; i < Math.min(cells.length, 4); i++) {
      const text = cells[i].textContent || '';
      if (text.includes('(') && text.includes('|')) {
        coordText = text;
        break;
      }
    }
    
    const coordinates = this.parseCoordinates(coordText);

    // Extract resources - usually after coordinates
    const resources = {
      wood: 0,
      clay: 0,
      iron: 0,
      crop: 0
    };

    // Look for resource values in remaining cells
    let resourceStartIndex = -1;
    for (let i = 2; i < cells.length; i++) {
      const text = cells[i].textContent?.trim() || '';
      // Check if this looks like a resource value (number possibly with k suffix)
      if (/^\d+k?$/.test(text.replace(/[,.\s]/g, ''))) {
        resourceStartIndex = i;
        break;
      }
    }

    if (resourceStartIndex > 0 && resourceStartIndex + 3 < cells.length) {
      resources.wood = this.parseNumber(cells[resourceStartIndex].textContent || '0');
      resources.clay = this.parseNumber(cells[resourceStartIndex + 1].textContent || '0');
      resources.iron = this.parseNumber(cells[resourceStartIndex + 2].textContent || '0');
      resources.crop = this.parseNumber(cells[resourceStartIndex + 3].textContent || '0');
    }

    // Check if this is the active village
    const isActive = row.classList.contains('active') || 
                     row.classList.contains('hl') ||
                     !!row.querySelector('.active');

    return {
      id: villageId,
      name: villageName,
      coordinates,
      isActive,
      resources,
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
   * Parse a single village row from the overview table (fallback method)
   */
  private parseVillageRow(row: Element): VillageOverviewData | null {
    const cells = row.querySelectorAll('td');
    if (cells.length < 5) return null;

    // Extract village ID from link
    const villageLink = row.querySelector('a[href*="newdid="]');
    const villageId = villageLink?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1];
    
    if (!villageId) return null;

    // Extract village name
    const villageName = villageLink?.textContent?.trim() || 'Unknown';

    // Extract coordinates
    const coordText = row.querySelector('.coords, .coordinates')?.textContent || '';
    const coords = this.parseCoordinates(coordText);

    // Extract resources (usually in specific cells)
    const resources = this.parseResourceCells(cells);

    // Extract production
    const production = this.parseProductionCells(cells);

    // Extract storage info
    const storage = this.parseStorageInfo(row);

    // Check if this is the active village
    const isActive = row.classList.contains('active') || 
                     row.querySelector('.active') !== null;

    return {
      id: villageId,
      name: villageName,
      coordinates: coords,
      isActive,
      resources,
      production,
      storage,
      loyalty: this.parseLoyalty(row)
    };
  }

  /**
   * Parse coordinates from text like "(12|-34)"
   */
  private parseCoordinates(text: string): { x: number; y: number } {
    const match = text.match(/\(?\s*(-?\d+)\s*\|\s*(-?\d+)\s*\)?/);
    if (match) {
      return {
        x: parseInt(match[1], 10),
        y: parseInt(match[2], 10)
      };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Parse resource values from table cells
   */
  private parseResourceCells(cells: NodeListOf<Element>): VillageOverviewData['resources'] {
    const resources = {
      wood: 0,
      clay: 0,
      iron: 0,
      crop: 0
    };

    // Resources are typically in cells 2-5 or similar positions
    // Try to find cells with resource classes or parse by position
    const resourceClasses = ['wood', 'clay', 'iron', 'crop', 'lumber', 'brick'];
    
    cells.forEach((cell, index) => {
      const text = cell.textContent?.trim() || '0';
      const value = this.parseNumber(text);
      
      // Check for resource-specific classes
      if (cell.classList.contains('lumber') || cell.classList.contains('wood')) {
        resources.wood = value;
      } else if (cell.classList.contains('clay') || cell.classList.contains('brick')) {
        resources.clay = value;
      } else if (cell.classList.contains('iron')) {
        resources.iron = value;
      } else if (cell.classList.contains('crop') || cell.classList.contains('grain')) {
        resources.crop = value;
      } else if (index >= 2 && index <= 5 && value > 0) {
        // Fallback to position-based parsing
        switch (index - 2) {
          case 0: resources.wood = value; break;
          case 1: resources.clay = value; break;
          case 2: resources.iron = value; break;
          case 3: resources.crop = value; break;
        }
      }
    });

    return resources;
  }

  /**
   * Parse production values
   */
  private parseProductionCells(cells: NodeListOf<Element>): VillageOverviewData['production'] {
    const production = {
      wood: 0,
      clay: 0,
      iron: 0,
      crop: 0,
      cropNet: 0
    };

    // Production values often have + prefix or are in specific cells
    cells.forEach((cell, index) => {
      const text = cell.textContent?.trim() || '';
      
      // Look for production indicators (+ prefix or /h suffix)
      if (text.includes('+') || text.includes('/h')) {
        const value = this.parseNumber(text);
        
        // Try to determine resource type by class or position
        if (cell.classList.contains('production')) {
          const prevCell = cells[index - 1];
          if (prevCell?.classList.contains('wood')) production.wood = value;
          else if (prevCell?.classList.contains('clay')) production.clay = value;
          else if (prevCell?.classList.contains('iron')) production.iron = value;
          else if (prevCell?.classList.contains('crop')) production.crop = value;
        }
      }
    });

    return production;
  }

  /**
   * Parse storage information
   */
  private parseStorageInfo(row: Element): VillageOverviewData['storage'] {
    const storage = {
      warehouse: 0,
      warehouseCapacity: 0,
      granary: 0,
      granaryCapacity: 0
    };

    // Look for storage indicators
    const storageText = row.querySelector('.storage')?.textContent || '';
    const warehouseMatch = storageText.match(/(\d+)\s*\/\s*(\d+)/);
    
    if (warehouseMatch) {
      storage.warehouse = parseInt(warehouseMatch[1], 10);
      storage.warehouseCapacity = parseInt(warehouseMatch[2], 10);
    }

    return storage;
  }

  /**
   * Parse loyalty percentage
   */
  private parseLoyalty(row: Element): number | undefined {
    const loyaltyElement = row.querySelector('.loyalty');
    if (loyaltyElement) {
      return this.parseNumber(loyaltyElement.textContent || '100');
    }
    return undefined;
  }

  /**
   * Alternative parsing for different overview formats
   */
  private parseAlternativeFormat(doc: Document): VillageOverviewData[] {
    const villages: VillageOverviewData[] = [];
    
    // Try to find village data in other formats
    // Some servers use divs instead of tables
    const villageDivs = doc.querySelectorAll('.village, .villageBox, [class*="village_"]');
    
    villageDivs.forEach(div => {
      const id = div.getAttribute('data-village-id') || 
                 div.querySelector('a[href*="newdid="]')?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1];
      
      if (id) {
        const name = div.querySelector('.name, .villageName')?.textContent?.trim() || 'Unknown';
        const coordText = div.querySelector('.coords, .coordinates')?.textContent || '';
        
        villages.push({
          id,
          name,
          coordinates: this.parseCoordinates(coordText),
          isActive: div.classList.contains('active'),
          resources: this.extractResourcesFromDiv(div),
          production: this.extractProductionFromDiv(div),
          storage: this.extractStorageFromDiv(div)
        });
      }
    });

    return villages;
  }

  /**
   * Extract resources from div-based layout
   */
  private extractResourcesFromDiv(div: Element): VillageOverviewData['resources'] {
    return {
      wood: this.parseNumber(div.querySelector('.r1, .wood')?.textContent || '0'),
      clay: this.parseNumber(div.querySelector('.r2, .clay')?.textContent || '0'),
      iron: this.parseNumber(div.querySelector('.r3, .iron')?.textContent || '0'),
      crop: this.parseNumber(div.querySelector('.r4, .crop')?.textContent || '0')
    };
  }

  /**
   * Extract production from div-based layout
   */
  private extractProductionFromDiv(div: Element): VillageOverviewData['production'] {
    return {
      wood: this.parseNumber(div.querySelector('.p1, .production-wood')?.textContent || '0'),
      clay: this.parseNumber(div.querySelector('.p2, .production-clay')?.textContent || '0'),
      iron: this.parseNumber(div.querySelector('.p3, .production-iron')?.textContent || '0'),
      crop: this.parseNumber(div.querySelector('.p4, .production-crop')?.textContent || '0')
    };
  }

  /**
   * Extract storage from div-based layout
   */
  private extractStorageFromDiv(div: Element): VillageOverviewData['storage'] {
    const warehouseText = div.querySelector('.warehouse')?.textContent || '';
    const granaryText = div.querySelector('.granary')?.textContent || '';
    
    const warehouseMatch = warehouseText.match(/(\d+)\s*\/\s*(\d+)/);
    const granaryMatch = granaryText.match(/(\d+)\s*\/\s*(\d+)/);
    
    return {
      warehouse: warehouseMatch ? parseInt(warehouseMatch[1], 10) : 0,
      warehouseCapacity: warehouseMatch ? parseInt(warehouseMatch[2], 10) : 0,
      granary: granaryMatch ? parseInt(granaryMatch[1], 10) : 0,
      granaryCapacity: granaryMatch ? parseInt(granaryMatch[2], 10) : 0
    };
  }

  /**
   * Parse account-wide data like culture points
   */
  private parseAccountData(doc: Document): void {
    // Culture points
    const cultureElement = doc.querySelector('.culture_points, #culture_points, [class*="culture"]');
    if (cultureElement) {
      const current = this.parseNumber(cultureElement.querySelector('.value')?.textContent || '0');
      const production = this.parseNumber(cultureElement.querySelector('.production')?.textContent || '0');
      
      // Store in a way we can access later
      (window as any).__tla_culture = { current, production };
    }

    // Player rank
    const rankElement = doc.querySelector('.rank, .player-rank, #rank');
    if (rankElement) {
      (window as any).__tla_rank = this.parseNumber(rankElement.textContent || '0');
    }
  }

  /**
   * Build the complete overview state
   */
  private buildOverviewState(): OverviewState {
    const villages = Array.from(this.cache.values());
    
    // Calculate totals and aggregates
    const state: OverviewState = {
      villages,
      movements: {
        incoming: 0,
        outgoing: 0,
        attacks: []
      },
      culturePoints: (window as any).__tla_culture || {
        current: 0,
        production: 0,
        nextSlot: 0
      },
      timestamp: Date.now()
    };

    // Check for attacks in the current page (if on rally point)
    this.checkForAttacks(state);

    return state;
  }

  /**
   * Check current page for attack information
   */
  private checkForAttacks(state: OverviewState): void {
    // Check if we're on a page that shows movements
    const movements = document.querySelectorAll('.troop_details.inRaid, .troop_details.inAttack');
    
    movements.forEach(movement => {
      const timer = movement.querySelector('.timer, .in');
      if (timer) {
        const timeText = timer.textContent || '';
        const villageLink = movement.querySelector('a[href*="newdid="]');
        const villageId = villageLink?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1];
        
        if (villageId) {
          state.movements.attacks.push({
            villageId,
            timeToArrival: timeText,
            type: movement.classList.contains('inAttack') ? 'attack' : 'raid'
          });
        }
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
        nextSlot: 0
      },
      timestamp: Date.now()
    };
  }

  /**
   * Scrape data from the current page (without navigation)
   */
  private scrapeCurrentVillage(): VillageOverviewData | null {
    // Get village ID from URL or page
    const urlParams = new URLSearchParams(window.location.search);
    const villageId = urlParams.get('newdid') || 
                     document.querySelector('.villageList .active a')?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] ||
                     '0';

    const villageName = document.querySelector('.villageList .active .name')?.textContent?.trim() || 
                       document.querySelector('#villageNameField')?.textContent?.trim() || 
                       'Current Village';

    // Get coordinates
    const coordElement = document.querySelector('.villageList .active .coordinates, .village_coordinates');
    const coordinates = coordElement ? this.parseCoordinates(coordElement.textContent || '') : { x: 0, y: 0 };

    // Get resources from stockBar
    const resources = {
      wood: this.parseNumber(document.querySelector('#l1')?.textContent || '0'),
      clay: this.parseNumber(document.querySelector('#l2')?.textContent || '0'),
      iron: this.parseNumber(document.querySelector('#l3')?.textContent || '0'),
      crop: this.parseNumber(document.querySelector('#l4')?.textContent || '0')
    };

    // Get warehouse/granary capacity
    const warehouseBar = document.querySelector('.warehouse .capacity');
    const granaryBar = document.querySelector('.granary .capacity');
    
    const storage = {
      warehouse: resources.wood + resources.clay + resources.iron,
      warehouseCapacity: this.parseNumber(warehouseBar?.textContent || '0'),
      granary: resources.crop,
      granaryCapacity: this.parseNumber(granaryBar?.textContent || '0')
    };

    return {
      id: villageId,
      name: villageName,
      coordinates,
      isActive: true,
      resources,
      production: {
        wood: 0,
        clay: 0,
        iron: 0,
        crop: 0
      },
      storage
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
   * Get cached village data by ID
   */
  public getCachedVillage(villageId: string): VillageOverviewData | undefined {
    return this.cache.get(villageId);
  }

  /**
   * Get all cached villages
   */
  public getAllCachedVillages(): VillageOverviewData[] {
    return Array.from(this.cache.values());
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
