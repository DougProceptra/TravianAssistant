// packages/extension/src/diagnostics/page-auditor.ts
// This tool helps us understand what data is available on each Travian page

interface PageAudit {
  url: string;
  pageType: string;
  timestamp: number;
  dataAvailable: {
    resources?: boolean;
    buildings?: boolean;
    troops?: boolean;
    hero?: boolean;
    quests?: boolean;
    reports?: boolean;
    map?: boolean;
    alliance?: boolean;
    fields?: boolean;
    production?: boolean;
  };
  selectors: {
    [key: string]: {
      selector: string;
      found: boolean;
      sampleData?: any;
    };
  };
  apiCalls: {
    url: string;
    method: string;
    payload?: any;
    response?: any;
  }[];
}

export class TravianPageAuditor {
  private audits: PageAudit[] = [];
  private currentAudit: PageAudit | null = null;

  constructor() {
    this.interceptNetworkCalls();
    this.startAudit();
  }

  private startAudit(): void {
    // Create audit for current page
    this.currentAudit = {
      url: window.location.href,
      pageType: this.detectPageType(),
      timestamp: Date.now(),
      dataAvailable: {},
      selectors: {},
      apiCalls: []
    };

    // Run all detection methods
    this.detectResources();
    this.detectBuildings();
    this.detectTroops();
    this.detectHero();
    this.detectQuests();
    this.detectFields();
    this.detectProduction();
    this.detectMap();

    // Save audit after 2 seconds to catch AJAX calls
    setTimeout(() => {
      this.saveAudit();
    }, 2000);
  }

  private detectPageType(): string {
    const url = window.location.href;
    
    // Check URL patterns
    if (url.includes('dorf1.php')) return 'resource_fields';
    if (url.includes('dorf2.php')) return 'village_center';
    if (url.includes('build.php')) {
      const gid = new URLSearchParams(window.location.search).get('gid');
      if (gid) return `building_gid_${gid}`;
      return 'building';
    }
    if (url.includes('spieler.php')) return 'player_profile';
    if (url.includes('allianz.php')) return 'alliance';
    if (url.includes('berichte.php')) return 'reports';
    if (url.includes('messages.php')) return 'messages';
    if (url.includes('statistiken.php')) return 'statistics';
    if (url.includes('karte.php')) return 'map';
    if (url.includes('hero.php')) return 'hero';
    
    return 'unknown';
  }

  private detectResources(): void {
    const selectors = {
      wood: ['#l1', '.resource.r1', '[class*="wood"]'],
      clay: ['#l2', '.resource.r2', '[class*="clay"]'],
      iron: ['#l3', '.resource.r3', '[class*="iron"]'],
      crop: ['#l4', '.resource.r4', '[class*="crop"]'],
      warehouse: ['#stockBarWarehouse', '.warehouse'],
      granary: ['#stockBarGranary', '.granary']
    };

    let foundAny = false;
    
    for (const [resource, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        const element = document.querySelector(selector);
        if (element) {
          this.currentAudit!.selectors[`resource_${resource}`] = {
            selector,
            found: true,
            sampleData: element.textContent?.trim()
          };
          foundAny = true;
          break;
        }
      }
    }

    this.currentAudit!.dataAvailable.resources = foundAny;
  }

  private detectBuildings(): void {
    const selectors = {
      buildingList: ['.buildingList', '#village_map', '.buildings'],
      buildingSlot: ['.buildingSlot', '.building', '[class*="buildingSlot"]'],
      constructionList: ['.constructionList', '.under_progress', '.buildDuration'],
      buildingLevel: ['.level', '.stufe', '[class*="level"]']
    };

    let foundAny = false;

    for (const [feature, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          this.currentAudit!.selectors[`building_${feature}`] = {
            selector,
            found: true,
            sampleData: `Found ${elements.length} elements`
          };
          foundAny = true;
          break;
        }
      }
    }

    this.currentAudit!.dataAvailable.buildings = foundAny;
  }

  private detectTroops(): void {
    const selectors = {
      troopTable: ['.troops', '#troops', '[class*="troop"]'],
      unitCount: ['.unit', '.num', '[class*="unit"]'],
      training: ['.trainUnits', '.under_progress', '[class*="training"]']
    };

    let foundAny = false;

    for (const [feature, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        const element = document.querySelector(selector);
        if (element) {
          this.currentAudit!.selectors[`troops_${feature}`] = {
            selector,
            found: true,
            sampleData: element.textContent?.trim().substring(0, 100)
          };
          foundAny = true;
          break;
        }
      }
    }

    this.currentAudit!.dataAvailable.troops = foundAny;
  }

  private detectHero(): void {
    const selectors = {
      heroStatus: ['#heroImageButton', '.heroStatus', '[class*="hero"]'],
      heroLevel: ['.heroLevel', '.level', '[class*="heroLevel"]'],
      experience: ['.experience', '.exp', '[class*="experience"]']
    };

    let foundAny = false;

    for (const [feature, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        const element = document.querySelector(selector);
        if (element) {
          this.currentAudit!.selectors[`hero_${feature}`] = {
            selector,
            found: true,
            sampleData: element.textContent?.trim()
          };
          foundAny = true;
          break;
        }
      }
    }

    this.currentAudit!.dataAvailable.hero = foundAny;
  }

  private detectQuests(): void {
    const selectors = {
      questList: ['.questList', '#questmasterButton', '[class*="quest"]'],
      questItem: ['.quest', '.questTask', '[class*="questTask"]']
    };

    let foundAny = false;

    for (const [feature, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        const element = document.querySelector(selector);
        if (element) {
          this.currentAudit!.selectors[`quest_${feature}`] = {
            selector,
            found: true,
            sampleData: element.textContent?.trim().substring(0, 100)
          };
          foundAny = true;
          break;
        }
      }
    }

    this.currentAudit!.dataAvailable.quests = foundAny;
  }

  private detectFields(): void {
    // Specifically for dorf1.php resource fields
    const selectors = {
      resourceField: ['.resourceField', '.rf', '[class*="gid"]'],
      fieldLevel: ['.labelLayer', '.level', '[class*="level"]'],
      fieldType: ['[class*="gid1"]', '[class*="gid2"]', '[class*="gid3"]', '[class*="gid4"]']
    };

    let foundAny = false;

    for (const [feature, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          this.currentAudit!.selectors[`field_${feature}`] = {
            selector,
            found: true,
            sampleData: `Found ${elements.length} fields`
          };
          foundAny = true;
          break;
        }
      }
    }

    this.currentAudit!.dataAvailable.fields = foundAny;
  }

  private detectProduction(): void {
    const selectors = {
      production: ['.production', '#production', '[class*="production"]'],
      productionRate: ['.res_prod', '.num', '[class*="prod"]']
    };

    let foundAny = false;

    for (const [feature, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        const element = document.querySelector(selector);
        if (element) {
          this.currentAudit!.selectors[`production_${feature}`] = {
            selector,
            found: true,
            sampleData: element.textContent?.trim()
          };
          foundAny = true;
          break;
        }
      }
    }

    this.currentAudit!.dataAvailable.production = foundAny;
  }

  private detectMap(): void {
    const selectors = {
      mapContainer: ['#mapContainer', '.map', '[class*="map"]'],
      mapTile: ['.mapTile', '.tile', '[class*="tile"]']
    };

    let foundAny = false;

    for (const [feature, selectorList] of Object.entries(selectors)) {
      for (const selector of selectorList) {
        const element = document.querySelector(selector);
        if (element) {
          this.currentAudit!.selectors[`map_${feature}`] = {
            selector,
            found: true,
            sampleData: 'Map element found'
          };
          foundAny = true;
          break;
        }
      }
    }

    this.currentAudit!.dataAvailable.map = foundAny;
  }

  private interceptNetworkCalls(): void {
    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (this.currentAudit) {
        const url = args[0] as string;
        const init = args[1] as RequestInit;
        
        // Clone response to read it
        const clonedResponse = response.clone();
        const responseData = await clonedResponse.text();
        
        this.currentAudit.apiCalls.push({
          url,
          method: init?.method || 'GET',
          payload: init?.body,
          response: responseData.substring(0, 500) // First 500 chars
        });
      }
      
      return response;
    };

    // Intercept XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      let method = '';
      let url = '';
      
      xhr.open = function(...args: any) {
        method = args[0];
        url = args[1];
        return originalOpen.apply(xhr, args);
      };
      
      xhr.send = function(data: any) {
        xhr.addEventListener('load', function() {
          if (self.currentAudit) {
            self.currentAudit.apiCalls.push({
              url,
              method,
              payload: data,
              response: xhr.responseText.substring(0, 500)
            });
          }
        });
        
        return originalSend.apply(xhr, [data]);
      };
      
      return xhr;
    } as any;
  }

  private saveAudit(): void {
    if (!this.currentAudit) return;
    
    this.audits.push(this.currentAudit);
    
    // Send to backend
    this.sendToBackend(this.currentAudit);
    
    // Also save to localStorage for debugging
    const existingAudits = JSON.parse(localStorage.getItem('travian_page_audits') || '[]');
    existingAudits.push(this.currentAudit);
    
    // Keep only last 50 audits
    if (existingAudits.length > 50) {
      existingAudits.shift();
    }
    
    localStorage.setItem('travian_page_audits', JSON.stringify(existingAudits));
    
    console.log('[Page Auditor] Audit saved:', this.currentAudit);
    
    // Show summary in console
    this.printAuditSummary();
  }

  private async sendToBackend(audit: PageAudit): Promise<void> {
    try {
      await fetch('http://localhost:3002/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(audit)
      });
    } catch (error) {
      console.error('[Page Auditor] Failed to send to backend:', error);
    }
  }

  private printAuditSummary(): void {
    if (!this.currentAudit) return;
    
    console.group(`📊 Page Audit: ${this.currentAudit.pageType}`);
    console.log('URL:', this.currentAudit.url);
    console.log('Data Available:', this.currentAudit.dataAvailable);
    console.log('Working Selectors:', Object.entries(this.currentAudit.selectors)
      .filter(([_, data]) => data.found)
      .map(([key, data]) => `${key}: ${data.selector}`)
    );
    console.log('API Calls Detected:', this.currentAudit.apiCalls.length);
    console.groupEnd();
  }

  // Public method to manually trigger audit
  public runAudit(): PageAudit | null {
    this.startAudit();
    return this.currentAudit;
  }

  // Get all audits
  public getAudits(): PageAudit[] {
    const stored = localStorage.getItem('travian_page_audits');
    return stored ? JSON.parse(stored) : this.audits;
  }

  // Get audit summary
  public getSummary(): any {
    const audits = this.getAudits();
    const summary: any = {
      totalPages: audits.length,
      pageTypes: {},
      dataAvailability: {},
      commonSelectors: {}
    };

    audits.forEach(audit => {
      // Count page types
      summary.pageTypes[audit.pageType] = (summary.pageTypes[audit.pageType] || 0) + 1;
      
      // Track data availability
      Object.entries(audit.dataAvailable).forEach(([key, available]) => {
        if (available) {
          summary.dataAvailability[key] = (summary.dataAvailability[key] || 0) + 1;
        }
      });
      
      // Track successful selectors
      Object.entries(audit.selectors).forEach(([key, data]) => {
        if (data.found) {
          if (!summary.commonSelectors[key]) {
            summary.commonSelectors[key] = {
              selector: data.selector,
              count: 0
            };
          }
          summary.commonSelectors[key].count++;
        }
      });
    });

    return summary;
  }
}

// Auto-start auditor when script loads
if (typeof window !== 'undefined') {
  (window as any).travianAuditor = new TravianPageAuditor();
  console.log('[Page Auditor] Started. Access via window.travianAuditor');
  console.log('Commands: travianAuditor.runAudit(), travianAuditor.getSummary(), travianAuditor.getAudits()');
}
