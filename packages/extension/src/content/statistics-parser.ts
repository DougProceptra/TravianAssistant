import { GameState, VillageProduction } from '../types';

export class StatisticsParser {
  /**
   * Parse production data from the statistics/general page
   * This page shows all villages with their production rates
   */
  parseStatisticsPage(): GameState['villages'] {
    console.log('📊 Parsing statistics page for production data');
    
    const villages: GameState['villages'] = [];
    
    // Find the production table on statistics page
    const tables = document.querySelectorAll('table.hover');
    
    for (const table of tables) {
      // Look for production table by checking headers
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
      
      // Check if this is the production table (has resource columns)
      const hasResourceColumns = headers.some(h => h.includes('Wood') || h.includes('Lumber')) ||
                                 headers.some(h => h.includes('Clay') || h.includes('Brick')) ||
                                 headers.some(h => h.includes('Iron')) ||
                                 headers.some(h => h.includes('Crop') || h.includes('Wheat'));
      
      if (hasResourceColumns) {
        console.log('Found production table with headers:', headers);
        
        // Parse each row
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
          const cells = Array.from(row.querySelectorAll('td'));
          
          if (cells.length >= 5) {
            // Extract village data
            const nameCell = cells[0];
            const villageLink = nameCell.querySelector('a');
            const villageName = villageLink?.textContent?.trim() || `Village ${index + 1}`;
            
            // Extract village ID from link if available
            const href = villageLink?.getAttribute('href') || '';
            const didMatch = href.match(/[?&]newdid=(\d+)/);
            const villageId = didMatch ? didMatch[1] : undefined;
            
            // Parse production values (remove commas and convert to numbers)
            const parseProduction = (text: string): number => {
              const cleaned = text.replace(/[,\s]/g, '');
              return parseInt(cleaned) || 0;
            };
            
            const production: VillageProduction = {
              wood: parseProduction(cells[1]?.textContent || '0'),
              clay: parseProduction(cells[2]?.textContent || '0'),
              iron: parseProduction(cells[3]?.textContent || '0'),
              crop: parseProduction(cells[4]?.textContent || '0')
            };
            
            // Calculate free crop (if there's a 5th column for it)
            if (cells.length >= 6) {
              production.freeCrop = parseProduction(cells[5]?.textContent || '0');
            }
            
            villages.push({
              id: villageId,
              name: villageName,
              coordinates: { x: 0, y: 0 }, // Not available on statistics page
              isActive: false, // Will be set separately
              production
            });
            
            console.log(`Parsed village ${villageName}:`, production);
          }
        });
        
        break; // Found the production table, stop searching
      }
    }
    
    if (villages.length === 0) {
      console.warn('No production table found on statistics page');
      
      // Try alternative table structures
      const allTables = document.querySelectorAll('table');
      allTables.forEach((table, i) => {
        console.log(`Table ${i} first row:`, table.querySelector('tr')?.textContent?.trim());
      });
    }
    
    return villages;
  }
  
  /**
   * Get total production across all villages
   */
  getTotalProduction(villages: GameState['villages']): VillageProduction {
    return villages.reduce((total, village) => {
      if (village.production) {
        total.wood += village.production.wood;
        total.clay += village.production.clay;
        total.iron += village.production.iron;
        total.crop += village.production.crop;
        total.freeCrop = (total.freeCrop || 0) + (village.production.freeCrop || 0);
      }
      return total;
    }, {
      wood: 0,
      clay: 0,
      iron: 0,
      crop: 0,
      freeCrop: 0
    });
  }
  
  /**
   * Check if we're on the statistics page
   */
  isStatisticsPage(): boolean {
    return window.location.pathname.includes('/statistics/');
  }
  
  /**
   * Automatically navigate to statistics page to get all village data
   * This is a one-time operation when user wants complete data
   */
  async navigateToStatisticsPage(): Promise<void> {
    const statsLink = document.querySelector('a[href*="/statistics/general"]');
    if (statsLink instanceof HTMLAnchorElement) {
      console.log('Navigating to statistics page for complete village data...');
      statsLink.click();
    } else {
      console.warn('Statistics page link not found');
    }
  }
}

// Export singleton instance
export const statisticsParser = new StatisticsParser();