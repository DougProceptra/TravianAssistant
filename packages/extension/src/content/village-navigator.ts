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
    // Find village switcher
    const villageSwitcher = document.querySelector('#sidebarBoxVillagelist');
    if (!villageSwitcher) {
      console.log('[TLA Navigator] No village switcher found - single village account');
      return;
    }
    
    // Parse all villages from the switcher
    const villageLinks = villageSwitcher.querySelectorAll('.villageList a');
    villageLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const villageId = this.extractVillageId(href);
      const villageName = link.querySelector('.name')?.textContent?.trim() || 'Unknown';
      
      if (villageId && !this.villages.has(villageId)) {
        this.villages.set(villageId, {
          villageId,
          villageName,
          resources: { wood: 0, clay: 0, iron: 0, crop: 0 },
          production: { wood: 0, clay: 0, iron: 0, crop: 0 },
          buildings: [],
          troops: [],
          timestamp: 0
        });
      }
    });
    
    // Detect current village
    const activeVillage = villageSwitcher.querySelector('.active a');
    if (activeVillage) {
      const href = activeVillage.getAttribute('href') || '';
      this.currentVillageId = this.extractVillageId(href);
    }
    
    console.log(`[TLA Navigator] Found ${this.villages.size} villages`);
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
    
    const allData = new Map<string, VillageData>();
    const villageIds = Array.from(this.villages.keys());
    
    // If single village, just scrape current
    if (villageIds.length === 0) {
      const currentData = scrapeFunction();
      allData.set(currentData.villageId, currentData);
      return allData;
    }
    
    // Multi-village: navigate and scrape each
    for (const villageId of villageIds) {
      try {
        // Switch to village if not current
        if (villageId !== this.currentVillageId) {
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
        
        console.log(`[TLA Navigator] Collected data for ${villageData.villageName}`);
        
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