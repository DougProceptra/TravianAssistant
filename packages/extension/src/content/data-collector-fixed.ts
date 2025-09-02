/**
 * Fixed Data Collector using proper context access
 * Solves the "window.resources not found" issue
 */

import { VillageData, ResourceData, GameState } from '../types';

export class DataCollectorFixed {
  private lastUpdate: number = 0;
  private cachedData: GameState | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log('[TLA Fixed Collector] Initializing...');
    
    // Set up message listener for data from injected script
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'TLA_PAGE_DATA') {
        this.handlePageData(event.data.payload);
      }
    });

    // Inject data extractor into page
    this.injectDataExtractor();
    
    // Set up periodic collection
    setInterval(() => this.requestPageData(), 5000);
    
    // Initial collection
    setTimeout(() => this.requestPageData(), 100);
  }

  private injectDataExtractor() {
    // Create script element with data extraction code
    const script = document.createElement('script');
    script.id = 'tla-data-extractor';
    
    // Use textContent to avoid CSP issues
    script.textContent = `
      // TLA Data Extractor - Runs in page context
      (function() {
        window.__tlaExtractor = {
          getData: function() {
            const data = {
              timestamp: Date.now(),
              url: window.location.href,
              resources: null,
              villages: [],
              currentVillage: null,
              gameConstants: null
            };
            
            // Get resources if available
            if (typeof window.resources !== 'undefined') {
              data.resources = {
                production: window.resources.production || {},
                storage: window.resources.storage || {},
                maxStorage: window.resources.maxStorage || {}
              };
              console.log('[TLA Extractor] Found window.resources:', data.resources);
            }
            
            // Get Travian object if available
            if (typeof window.Travian !== 'undefined') {
              data.gameConstants = {
                round: window.Travian.Variables?.round,
                speed: window.Travian.Variables?.speed,
                worldId: window.Travian.Variables?.worldId
              };
            }
            
            // Get current village from UI
            const activeVillage = document.querySelector('#villageList .active');
            if (activeVillage) {
              data.currentVillage = {
                id: activeVillage.getAttribute('data-did'),
                name: activeVillage.querySelector('.name')?.textContent?.trim()
              };
            }
            
            // Get all villages from village list
            const villageElements = document.querySelectorAll('#villageList li');
            villageElements.forEach(el => {
              const villageData = {
                id: el.getAttribute('data-did'),
                name: el.querySelector('.name')?.textContent?.trim(),
                x: el.getAttribute('data-x'),
                y: el.getAttribute('data-y'),
                isActive: el.classList.contains('active')
              };
              if (villageData.id) {
                data.villages.push(villageData);
              }
            });
            
            return data;
          },
          
          sendData: function() {
            const data = this.getData();
            window.postMessage({
              type: 'TLA_PAGE_DATA',
              payload: data
            }, '*');
          }
        };
        
        // Listen for requests from content script
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'TLA_REQUEST_DATA') {
            window.__tlaExtractor.sendData();
          }
        });
        
        // Send initial data
        setTimeout(function() {
          window.__tlaExtractor.sendData();
        }, 100);
        
        console.log('[TLA Extractor] Data extractor initialized in page context');
      })();
    `;
    
    // Inject the script
    const target = document.head || document.documentElement;
    target.appendChild(script);
    
    console.log('[TLA Fixed Collector] Data extractor injected');
  }

  private requestPageData() {
    // Request data from page context
    window.postMessage({ type: 'TLA_REQUEST_DATA' }, '*');
  }

  private handlePageData(data: any) {
    console.log('[TLA Fixed Collector] Received page data:', data);
    
    if (data.resources) {
      console.log('[TLA Fixed Collector] ✅ Resources found:', data.resources);
      
      // Store in cache
      this.cachedData = {
        currentVillage: this.parseCurrentVillage(data),
        allVillages: data.villages || [],
        totalProduction: this.calculateTotalProduction(data.resources.production),
        alerts: [],
        timestamp: data.timestamp
      };
      
      this.lastUpdate = Date.now();
      
      // Store in Chrome storage
      chrome.storage.local.set({
        latestGameData: this.cachedData,
        lastDataUpdate: this.lastUpdate
      });
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('tla-data-collected', {
        detail: this.cachedData
      }));
    } else {
      console.log('[TLA Fixed Collector] ⚠️ No resources in page data');
    }
  }

  private parseCurrentVillage(data: any): VillageData {
    const production = data.resources?.production || {};
    
    return {
      id: data.currentVillage?.id || 'unknown',
      name: data.currentVillage?.name || 'Current Village',
      coordinates: { x: 0, y: 0 },
      production: {
        wood: production.l1 || 0,
        clay: production.l2 || 0,
        iron: production.l3 || 0,
        crop: production.l4 || 0,
        freeCrop: production.l5 || 0
      },
      storage: data.resources?.storage || {},
      alerts: []
    };
  }

  private calculateTotalProduction(production: any): ResourceData {
    return {
      wood: production?.l1 || 0,
      clay: production?.l2 || 0,
      iron: production?.l3 || 0,
      crop: production?.l4 || 0,
      freeCrop: production?.l5 || 0
    };
  }

  public async getGameState(): Promise<GameState | null> {
    // First try to get fresh data
    this.requestPageData();
    
    // Wait a bit for response
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return cached data or fetch from storage
    if (this.cachedData && (Date.now() - this.lastUpdate < 10000)) {
      return this.cachedData;
    }
    
    // Try to get from storage
    return new Promise((resolve) => {
      chrome.storage.local.get(['latestGameData'], (result) => {
        resolve(result.latestGameData || null);
      });
    });
  }

  public forceUpdate() {
    console.log('[TLA Fixed Collector] Forcing data update...');
    this.requestPageData();
  }
}

export default DataCollectorFixed;