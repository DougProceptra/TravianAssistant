// Village Overview Scraper - Uses the game's built-in overview popup
// This avoids navigating between villages and gets all data at once

export interface VillageOverviewData {
  villageId: string;
  villageName: string;
  coordinates: string;
  resources: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
  warehouse: number;
  granary: number;
  production: {
    wood: number;
    clay: number;
    iron: number;
    crop: number;
  };
  troops: {
    own: { [unitName: string]: number };
    reinforcements: { [unitName: string]: number };
  };
  buildings: number;
  culturePoints: number;
  celebrations: number;
  attacks: number;
}

export class VillageOverviewScraper {
  
  /**
   * Check if village overview popup is open
   */
  public isOverviewOpen(): boolean {
    // Look for the overview popup - it has tabs like "Overview", "Resources", "Culture points", "Troops"
    const overviewPopup = document.querySelector('.villageOverview, #villageOverview, [class*="village"][class*="overview"]');
    if (!overviewPopup) return false;
    
    // Check if it's visible
    const style = window.getComputedStyle(overviewPopup);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }
  
  /**
   * Scrape all villages from the overview popup
   */
  public scrapeOverviewPopup(): Map<string, VillageOverviewData> {
    const villages = new Map<string, VillageOverviewData>();
    
    if (!this.isOverviewOpen()) {
      console.log('[TLA Overview] Overview popup not open');
      return villages;
    }
    
    // Check which tab is active
    const activeTab = document.querySelector('.villageOverview .active, .tabActive')?.textContent?.trim() || '';
    console.log(`[TLA Overview] Active tab: ${activeTab}`);
    
    if (activeTab.includes('Resources')) {
      return this.scrapeResourcesTab();
    } else if (activeTab.includes('Troops')) {
      return this.scrapeTroopsTab();
    } else if (activeTab.includes('Culture')) {
      return this.scrapeCultureTab();
    } else {
      // Overview tab - has general info
      return this.scrapeOverviewTab();
    }
  }
  
  /**
   * Scrape Resources tab
   */
  private scrapeResourcesTab(): Map<string, VillageOverviewData> {
    const villages = new Map<string, VillageOverviewData>();
    
    // Find all rows in the resources table
    const rows = document.querySelectorAll('.villageOverview table tr, #villageOverview table tr');
    
    rows.forEach((row, index) => {
      // Skip header row
      if (index === 0 || row.querySelector('th')) return;
      
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return;
      
      // Extract village name and ID
      const villageCell = cells[0];
      const villageLink = villageCell.querySelector('a');
      const villageName = villageCell.textContent?.trim() || `Village ${index}`;
      const villageId = this.extractVillageId(villageLink?.getAttribute('href') || '');
      
      if (!villageId) return;
      
      const data: VillageOverviewData = {
        villageId,
        villageName,
        coordinates: '', // Not in resources tab
        resources: {
          wood: this.parseNumber(cells[1]),
          clay: this.parseNumber(cells[2]),
          iron: this.parseNumber(cells[3]),
          crop: this.parseNumber(cells[4])
        },
        warehouse: this.parseNumber(cells[5]) || 0,
        granary: this.parseNumber(cells[6]) || 0,
        production: {
          wood: 0, // Would need to switch to production view
          clay: 0,
          iron: 0,
          crop: 0
        },
        troops: { own: {}, reinforcements: {} },
        buildings: 0,
        culturePoints: 0,
        celebrations: 0,
        attacks: 0
      };
      
      villages.set(villageId, data);
    });
    
    console.log(`[TLA Overview] Scraped ${villages.size} villages from Resources tab`);
    return villages;
  }
  
  /**
   * Scrape Troops tab
   */
  private scrapeTroopsTab(): Map<string, VillageOverviewData> {
    const villages = new Map<string, VillageOverviewData>();
    
    // The troops tab has two sections: Own troops and Troops in villages
    const ownTroopsSection = document.querySelector('.villageOverview .own, #ownTroops');
    const reinforcementsSection = document.querySelector('.villageOverview .reinforcements, #reinforcements');
    
    // Parse own troops table
    if (ownTroopsSection) {
      const rows = ownTroopsSection.querySelectorAll('tr');
      rows.forEach((row, index) => {
        if (index < 2) return; // Skip headers
        
        const villageCell = row.querySelector('td:first-child');
        const villageName = villageCell?.textContent?.trim() || '';
        const villageId = this.extractVillageIdFromRow(row);
        
        if (!villageId) return;
        
        const troops: { [key: string]: number } = {};
        const troopCells = row.querySelectorAll('td.unit, td[class*="unit"]');
        troopCells.forEach((cell, unitIndex) => {
          const count = this.parseNumber(cell);
          if (count > 0) {
            troops[`unit_${unitIndex}`] = count;
          }
        });
        
        const data: VillageOverviewData = {
          villageId,
          villageName,
          coordinates: '',
          resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
          warehouse: 0,
          granary: 0,
          production: { wood: 0, clay: 0, iron: 0, crop: 0 },
          troops: { own: troops, reinforcements: {} },
          buildings: 0,
          culturePoints: 0,
          celebrations: 0,
          attacks: 0
        };
        
        villages.set(villageId, data);
      });
    }
    
    console.log(`[TLA Overview] Scraped ${villages.size} villages from Troops tab`);
    return villages;
  }
  
  /**
   * Scrape Overview tab
   */
  private scrapeOverviewTab(): Map<string, VillageOverviewData> {
    const villages = new Map<string, VillageOverviewData>();
    
    const rows = document.querySelectorAll('.villageOverview table tr, #villageOverview table tr');
    
    rows.forEach((row, index) => {
      if (index === 0 || row.querySelector('th')) return;
      
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) return;
      
      const villageCell = cells[0];
      const villageName = villageCell.textContent?.trim() || '';
      const villageId = this.extractVillageIdFromRow(row);
      
      if (!villageId) return;
      
      const data: VillageOverviewData = {
        villageId,
        villageName,
        coordinates: '',
        resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
        warehouse: 0,
        granary: 0,
        production: { wood: 0, clay: 0, iron: 0, crop: 0 },
        troops: { own: {}, reinforcements: {} },
        buildings: this.parseNumber(cells[2]) || 0,
        culturePoints: 0,
        celebrations: 0,
        attacks: this.parseNumber(cells[1]) || 0
      };
      
      villages.set(villageId, data);
    });
    
    console.log(`[TLA Overview] Scraped ${villages.size} villages from Overview tab`);
    return villages;
  }
  
  /**
   * Scrape Culture tab
   */
  private scrapeCultureTab(): Map<string, VillageOverviewData> {
    const villages = new Map<string, VillageOverviewData>();
    
    const rows = document.querySelectorAll('.villageOverview table tr, #villageOverview table tr');
    
    rows.forEach((row, index) => {
      if (index === 0 || row.querySelector('th')) return;
      
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return;
      
      const villageCell = cells[0];
      const villageName = villageCell.textContent?.trim() || '';
      const villageId = this.extractVillageIdFromRow(row);
      
      if (!villageId) return;
      
      const data: VillageOverviewData = {
        villageId,
        villageName,
        coordinates: '',
        resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
        warehouse: 0,
        granary: 0,
        production: { wood: 0, clay: 0, iron: 0, crop: 0 },
        troops: { own: {}, reinforcements: {} },
        buildings: 0,
        culturePoints: this.parseNumber(cells[1]) || 0,
        celebrations: this.parseNumber(cells[2]) || 0,
        attacks: 0
      };
      
      villages.set(villageId, data);
    });
    
    console.log(`[TLA Overview] Scraped ${villages.size} villages from Culture tab`);
    return villages;
  }
  
  /**
   * Open the village overview popup programmatically
   */
  public async openOverviewPopup(): Promise<boolean> {
    // Find the eye icon button next to village list
    const overviewButton = document.querySelector('.villageListBarButton .iconButton.village, [class*="overview"][class*="button"], .eye');
    
    if (!overviewButton) {
      console.log('[TLA Overview] Could not find overview button');
      return false;
    }
    
    // Click the button
    (overviewButton as HTMLElement).click();
    
    // Wait for popup to appear
    await this.waitForPopup();
    
    return this.isOverviewOpen();
  }
  
  /**
   * Click through all tabs to collect complete data
   */
  public async scrapeAllTabs(): Promise<Map<string, VillageOverviewData>> {
    const allData = new Map<string, VillageOverviewData>();
    
    if (!this.isOverviewOpen()) {
      const opened = await this.openOverviewPopup();
      if (!opened) {
        console.log('[TLA Overview] Failed to open overview popup');
        return allData;
      }
    }
    
    // Find all tabs
    const tabs = document.querySelectorAll('.villageOverview .tab, .tabItem');
    console.log(`[TLA Overview] Found ${tabs.length} tabs`);
    
    for (const tab of tabs) {
      const tabName = tab.textContent?.trim() || '';
      console.log(`[TLA Overview] Clicking tab: ${tabName}`);
      
      // Click the tab
      (tab as HTMLElement).click();
      await this.wait(500); // Wait for content to load
      
      // Scrape data from this tab
      const tabData = this.scrapeOverviewPopup();
      
      // Merge data
      tabData.forEach((village, id) => {
        const existing = allData.get(id) || village;
        // Merge non-zero values
        const merged = { ...existing };
        
        if (village.resources.wood > 0) merged.resources = village.resources;
        if (village.warehouse > 0) merged.warehouse = village.warehouse;
        if (village.granary > 0) merged.granary = village.granary;
        if (village.production.wood > 0) merged.production = village.production;
        if (Object.keys(village.troops.own).length > 0) merged.troops = village.troops;
        if (village.buildings > 0) merged.buildings = village.buildings;
        if (village.culturePoints > 0) merged.culturePoints = village.culturePoints;
        if (village.attacks > 0) merged.attacks = village.attacks;
        
        allData.set(id, merged);
      });
    }
    
    console.log(`[TLA Overview] Collected data for ${allData.size} villages across all tabs`);
    return allData;
  }
  
  // Helper methods
  private extractVillageId(href: string): string {
    const match = href.match(/newdid=(\d+)/);
    return match ? match[1] : '';
  }
  
  private extractVillageIdFromRow(row: Element): string {
    const link = row.querySelector('a[href*="newdid"]');
    if (link) {
      return this.extractVillageId(link.getAttribute('href') || '');
    }
    // Try to find village ID in data attributes or classes
    const dataId = row.getAttribute('data-village-id');
    if (dataId) return dataId;
    
    return '';
  }
  
  private parseNumber(element: Element | null): number {
    if (!element) return 0;
    const text = element.textContent || '0';
    // Remove formatting and parse
    const cleaned = text.replace(/[^\d-]/g, '');
    return parseInt(cleaned) || 0;
  }
  
  private async waitForPopup(maxWait = 5000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      if (this.isOverviewOpen()) {
        return;
      }
      await this.wait(100);
    }
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
export const overviewScraper = new VillageOverviewScraper();