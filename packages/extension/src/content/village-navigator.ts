// Village Navigation and Multi-Village Data Collection

export interface VillageData {
  villageId: string;
  villageName: string;
  coordinates?: string;
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
  };
  buildings: any[];
  troops: any[];
  timestamp: number;
}

export class VillageNavigator {
  private villages: Map<string, VillageData> = new Map();
  private currentVillageId: string = '';
  
  constructor() {
    console.log('[TLA Navigator] Village navigator initialized');
    this.detectVillages();
  }
  
  private detectVillages(): void {
    // FIXED: Correct capitalization - sidebarBoxVillageList with capital L
    const villageSwitcher = document.querySelector('#sidebarBoxVillageList');
    if (!villageSwitcher) {
      // Try alternative selectors
      const altSwitcher = document.querySelector('.villageList');
      if (!altSwitcher) {
        console.log('[TLA Navigator] No village switcher found - single village account');
        return;
      }
      // Use alternative if found
      this.parseVillageList(altSwitcher);
      return;
    }
    
    // Parse villages from the main switcher
    this.parseVillageList(villageSwitcher);
  }
  
  private parseVillageList(container: Element): void {
    // Find all village links with newdid parameter
    const villageLinks = container.querySelectorAll('a[href*="newdid"]');
    
    villageLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const villageId = this.extractVillageId(href);
      
      // Get village name - it's the text content of the link
      const villageName = link.textContent?.trim() || 'Unknown';
      
      // Skip coordinate links and empty links
      if (villageId && villageName && !villageName.includes('(') && villageName !== '') {
        // Check if this is the active village
        const isActive = link.parentElement?.classList.contains('active') || 
                        link.classList.contains('active');
        
        if (isActive) {
          this.currentVillageId = villageId;
        }
        
        // Store village data
        if (!this.villages.has(villageId)) {
          this.villages.set(villageId, {
            villageId,
            villageName,
            resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
            production: { wood: 0, clay: 0, iron: 0, crop: 0 },
            buildings: [],
            troops: [],
            timestamp: 0
          });
          
          console.log(`[TLA Navigator] Found village: ${villageName} (${villageId})`);
        }
      }
    });
    
    // If no active village found, use first one or detect from URL
    if (!this.currentVillageId && this.villages.size > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVillageId = urlParams.get('newdid');
      if (urlVillageId && this.villages.has(urlVillageId)) {
        this.currentVillageId = urlVillageId;
      } else {
        // Use first village as fallback
        this.currentVillageId = this.villages.keys().next().value;
      }
    }
    
    console.log(`[TLA Navigator] Found ${this.villages.size} villages, current: ${this.currentVillageId}`);
  }
  
  private extractVillageId(href: string): string {
    const match = href.match(/newdid=(\d+)/);
    return match ? match[1] : '';
  }
  
  public getCurrentVillageId(): string {
    if (!this.currentVillageId) {
      // Try to detect from URL
      const urlParams = new URLSearchParams(window.location.search);
      this.currentVillageId = urlParams.get('newdid') || '0';
    }
    return this.currentVillageId;
  }
  
  public getVillages(): Map<string, VillageData> {
    // Re-detect if empty
    if (this.villages.size === 0) {
      console.log('[TLA Navigator] Re-detecting villages...');
      this.detectVillages();
    }
    return this.villages;
  }
  
  public async switchToVillage(villageId: string): Promise<boolean> {
    console.log(`[TLA Navigator] Switching to village ${villageId}`);
    
    // Find the village link
    const villageLink = document.querySelector(`a[href*="newdid=${villageId}"]`) as HTMLAnchorElement;
    
    if (!villageLink) {
      console.error(`[TLA Navigator] Village ${villageId} not found`);
      return false;
    }
    
    // Click the link to switch villages
    villageLink.click();
    
    // Wait for page to load
    await this.waitForPageLoad();
    
    // Update current village
    this.currentVillageId = villageId;
    
    return true;
  }
  
  public async collectAllVillagesData(
    scrapeFunction: () => VillageData
  ): Promise<Map<string, VillageData>> {
    console.log('[TLA Navigator] Starting multi-village data collection');
    
    // Make sure we have villages detected
    if (this.villages.size === 0) {
      this.detectVillages();
    }
    
    const allData = new Map<string, VillageData>();
    const villageIds = Array.from(this.villages.keys());
    
    // If still no villages found, just scrape current
    if (villageIds.length === 0) {
      console.log('[TLA Navigator] No villages found, scraping current page only');
      const currentData = scrapeFunction();
      allData.set(currentData.villageId, currentData);
      return allData;
    }
    
    console.log(`[TLA Navigator] Will collect data from ${villageIds.length} villages`);
    
    // Multi-village: navigate and scrape each
    for (const villageId of villageIds) {
      try {
        // Switch to village if not current
        if (villageId !== this.currentVillageId) {
          console.log(`[TLA Navigator] Switching to village ${villageId}...`);
          const switched = await this.switchToVillage(villageId);
          if (!switched) {
            console.error(`[TLA Navigator] Failed to switch to village ${villageId}`);
            continue;
          }
        }
        
        // Wait a bit for page to stabilize
        await this.wait(1000);
        
        // Scrape village data
        const villageData = scrapeFunction();
        allData.set(villageId, villageData);
        
        const villageName = this.villages.get(villageId)?.villageName || 'Unknown';
        console.log(`[TLA Navigator] Collected data for ${villageName} (${villageId})`);
        
        // Don't spam the server
        await this.wait(2000);
        
      } catch (error) {
        console.error(`[TLA Navigator] Error collecting data for village ${villageId}:`, error);
      }
    }
    
    console.log(`[TLA Navigator] Collected data from ${allData.size} villages`);
    return allData;
  }
  
  private async waitForPageLoad(): Promise<void> {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve(), { once: true });
        // Timeout after 10 seconds
        setTimeout(() => resolve(), 10000);
      }
    });
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const villageNavigator = new VillageNavigator();