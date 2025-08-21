// Village Navigation Controller for Multi-Village Data Collection
// Handles programmatic switching between villages and data aggregation

export interface Village {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  isActive: boolean;
}

export interface VillageData {
  villageId: string;
  villageName: string;
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
  private villages: Village[] = [];
  private currentVillageId: string | null = null;
  
  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Detect village switcher and extract village list
    await this.detectVillages();
  }

  private async detectVillages(): Promise<Village[]> {
    // Travian village switcher is typically in .villageList or similar
    const villageElements = document.querySelectorAll('#sidebarBoxVillagelist .villageList li');
    
    this.villages = Array.from(villageElements).map(el => {
      const link = el.querySelector('a');
      const coordsMatch = link?.textContent?.match(/\((-?\d+)\|(-?\d+)\)/);
      
      return {
        id: link?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] || '',
        name: link?.querySelector('.name')?.textContent?.trim() || '',
        coordinates: {
          x: parseInt(coordsMatch?.[1] || '0'),
          y: parseInt(coordsMatch?.[2] || '0')
        },
        isActive: el.classList.contains('active')
      };
    }).filter(v => v.id);

    // Store current village
    this.currentVillageId = this.villages.find(v => v.isActive)?.id || null;
    
    console.log('[TLA] Detected villages:', this.villages);
    return this.villages;
  }

  public async switchToVillage(villageId: string): Promise<boolean> {
    if (this.currentVillageId === villageId) {
      console.log('[TLA] Already in village:', villageId);
      return true;
    }

    console.log('[TLA] Switching to village:', villageId);
    
    // Find the village link
    const villageLink = document.querySelector(`a[href*="newdid=${villageId}"]`) as HTMLAnchorElement;
    
    if (!villageLink) {
      console.error('[TLA] Village link not found for:', villageId);
      return false;
    }

    // Create a promise that resolves when the page updates
    return new Promise((resolve) => {
      // Listen for AJAX completion or page change
      const observer = new MutationObserver((mutations) => {
        // Check if village switch completed by looking for active class change
        const activeVillage = document.querySelector('.villageList li.active a');
        if (activeVillage?.getAttribute('href')?.includes(`newdid=${villageId}`)) {
          observer.disconnect();
          this.currentVillageId = villageId;
          console.log('[TLA] Village switch complete:', villageId);
          
          // Wait a bit for data to fully load
          setTimeout(() => resolve(true), 1000);
        }
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });

      // Trigger the village switch
      villageLink.click();

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        console.warn('[TLA] Village switch timeout');
        resolve(false);
      }, 10000);
    });
  }

  public async collectAllVillagesData(
    scrapeFunction: () => VillageData
  ): Promise<Map<string, VillageData>> {
    const allData = new Map<string, VillageData>();
    
    // Ensure we have the village list
    if (this.villages.length === 0) {
      await this.detectVillages();
    }

    console.log('[TLA] Starting multi-village data collection for', this.villages.length, 'villages');
    
    for (const village of this.villages) {
      try {
        // Switch to village
        const switched = await this.switchToVillage(village.id);
        
        if (!switched) {
          console.error('[TLA] Failed to switch to village:', village.name);
          continue;
        }

        // Wait for page to stabilize
        await this.waitForPageLoad();
        
        // Collect data using provided scrape function
        const data = scrapeFunction();
        data.villageId = village.id;
        data.villageName = village.name;
        data.timestamp = Date.now();
        
        allData.set(village.id, data);
        console.log('[TLA] Collected data for village:', village.name);
        
        // Don't spam the server
        await this.delay(1500);
        
      } catch (error) {
        console.error('[TLA] Error collecting data for village:', village.name, error);
      }
    }

    console.log('[TLA] Multi-village collection complete. Collected:', allData.size, 'villages');
    return allData;
  }

  private async waitForPageLoad(): Promise<void> {
    return new Promise(resolve => {
      // Wait for key elements to be present
      const checkInterval = setInterval(() => {
        const resourcesLoaded = document.querySelector('#l1');
        const buildingsLoaded = document.querySelector('.buildingSlot');
        
        if (resourcesLoaded && buildingsLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getVillages(): Village[] {
    return this.villages;
  }

  public getCurrentVillageId(): string | null {
    return this.currentVillageId;
  }
}

// Export singleton instance
export const villageNavigator = new VillageNavigator();
