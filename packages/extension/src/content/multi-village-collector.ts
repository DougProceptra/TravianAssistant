/**
 * Multi-Village Production Collector
 * Gets production data for ALL villages without navigation
 */

export class MultiVillageCollector {
  private cache: any = null;
  private lastUpdate: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log('[TLA Multi-Village] Initializing collector...');
    
    // Set up message listener for page context data
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'TLA_ALL_VILLAGES_DATA') {
        this.handleAllVillagesData(event.data.payload);
      }
    });

    // Inject the multi-village extractor
    this.injectExtractor();
    
    // Initial collection
    setTimeout(() => this.collectAllVillages(), 500);
    
    // Periodic collection
    setInterval(() => this.collectAllVillages(), 60000);
  }

  private injectExtractor() {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        window.__tlaMultiVillage = {
          // Method 1: Try to get from fieldsOfVillage if it exists
          getFromFieldsData: function() {
            if (window.fieldsOfVillage) {
              console.log('[TLA Multi-Village] Found fieldsOfVillage:', window.fieldsOfVillage);
              // This might contain production data for all villages
              return window.fieldsOfVillage;
            }
            return null;
          },
          
          // Method 2: Parse from overview table if on dorf3.php
          getFromOverviewTable: function() {
            if (!window.location.href.includes('dorf3.php')) {
              return null;
            }
            
            const villages = [];
            const rows = document.querySelectorAll('#overview tbody tr');
            
            rows.forEach((row, index) => {
              const cells = row.querySelectorAll('td');
              if (cells.length < 5) return;
              
              const villageData = {
                index: index,
                name: cells[0]?.querySelector('a')?.textContent?.trim(),
                id: cells[0]?.querySelector('a')?.href?.match(/newdid=(\\d+)/)?.[1],
                // Production cells might be in different positions
                resources: {
                  wood: this.parseNumber(cells[1]?.textContent),
                  clay: this.parseNumber(cells[2]?.textContent),
                  iron: this.parseNumber(cells[3]?.textContent),
                  crop: this.parseNumber(cells[4]?.textContent)
                }
              };
              
              if (villageData.name) {
                villages.push(villageData);
              }
            });
            
            return villages;
          },
          
          // Method 3: Fetch statistics page via AJAX
          fetchStatisticsPage: async function() {
            try {
              const response = await fetch('/statistics/general');
              const html = await response.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              
              const villages = [];
              const rows = doc.querySelectorAll('table.statisticsTable tbody tr');
              
              rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                  const villageLink = cells[1]?.querySelector('a');
                  const villageData = {
                    name: villageLink?.textContent?.trim(),
                    id: villageLink?.href?.match(/newdid=(\\d+)/)?.[1],
                    production: {
                      wood: this.parseNumber(cells[2]?.textContent),
                      clay: this.parseNumber(cells[3]?.textContent),
                      iron: this.parseNumber(cells[4]?.textContent),
                      crop: this.parseNumber(cells[5]?.textContent)
                    }
                  };
                  
                  if (villageData.name) {
                    villages.push(villageData);
                    console.log('[TLA Multi-Village] Parsed village from statistics:', villageData);
                  }
                }
              });
              
              return villages;
            } catch (error) {
              console.error('[TLA Multi-Village] Error fetching statistics:', error);
              return null;
            }
          },
          
          // Method 4: Check if game has a villages array/object
          getFromGameVariables: function() {
            // Check various possible game variables
            const possibleSources = [
              window.villages,
              window.villageList,
              window.Travian?.Villages,
              window.Travian?.Game?.villages,
              window.gameData?.villages
            ];
            
            for (const source of possibleSources) {
              if (source) {
                console.log('[TLA Multi-Village] Found game variable:', source);
                return source;
              }
            }
            
            return null;
          },
          
          // Helper to parse numbers from text
          parseNumber: function(text) {
            if (!text) return 0;
            return parseInt(text.replace(/[^0-9-]/g, '')) || 0;
          },
          
          // Main collection function
          collectAll: async function() {
            const result = {
              timestamp: Date.now(),
              source: 'unknown',
              villages: [],
              totalProduction: {
                wood: 0,
                clay: 0,
                iron: 0,
                crop: 0
              },
              currentVillageProduction: null
            };
            
            // Get current village production if available
            if (window.resources && window.resources.production) {
              result.currentVillageProduction = window.resources.production;
              console.log('[TLA Multi-Village] Current village production:', result.currentVillageProduction);
            }
            
            // Try each method in order of preference
            
            // 1. Try overview table (if on that page)
            let data = this.getFromOverviewTable();
            if (data && data.length > 0) {
              result.villages = data;
              result.source = 'overview_table';
            }
            
            // 2. Try statistics page via AJAX
            if (!result.villages.length) {
              data = await this.fetchStatisticsPage();
              if (data && data.length > 0) {
                result.villages = data;
                result.source = 'statistics_ajax';
              }
            }
            
            // 3. Try game variables
            if (!result.villages.length) {
              data = this.getFromGameVariables();
              if (data) {
                result.villages = Array.isArray(data) ? data : [data];
                result.source = 'game_variables';
              }
            }
            
            // 4. Try fieldsOfVillage
            if (!result.villages.length) {
              data = this.getFromFieldsData();
              if (data) {
                result.fieldsData = data;
                result.source = 'fields_data';
              }
            }
            
            // Calculate totals
            if (result.villages.length > 0) {
              result.villages.forEach(village => {
                if (village.production) {
                  result.totalProduction.wood += village.production.wood || 0;
                  result.totalProduction.clay += village.production.clay || 0;
                  result.totalProduction.iron += village.production.iron || 0;
                  result.totalProduction.crop += village.production.crop || 0;
                } else if (village.resources) {
                  result.totalProduction.wood += village.resources.wood || 0;
                  result.totalProduction.clay += village.resources.clay || 0;
                  result.totalProduction.iron += village.resources.iron || 0;
                  result.totalProduction.crop += village.resources.crop || 0;
                }
              });
            }
            
            console.log('[TLA Multi-Village] Collection complete:', result);
            return result;
          },
          
          // Send data to content script
          sendData: async function() {
            const data = await this.collectAll();
            window.postMessage({
              type: 'TLA_ALL_VILLAGES_DATA',
              payload: data
            }, '*');
          }
        };
        
        // Listen for requests
        window.addEventListener('message', function(event) {
          if (event.data?.type === 'TLA_REQUEST_ALL_VILLAGES') {
            window.__tlaMultiVillage.sendData();
          }
        });
        
        console.log('[TLA Multi-Village] Extractor ready in page context');
      })();
    `;
    
    document.head.appendChild(script);
    script.remove();
  }

  public collectAllVillages() {
    console.log('[TLA Multi-Village] Requesting all villages data...');
    window.postMessage({ type: 'TLA_REQUEST_ALL_VILLAGES' }, '*');
  }

  private handleAllVillagesData(data: any) {
    console.log('[TLA Multi-Village] Received data from', data.source, ':', data);
    
    if (data.villages?.length > 0 || data.totalProduction) {
      this.cache = data;
      this.lastUpdate = Date.now();
      
      // Store in Chrome storage
      chrome.storage.local.set({
        allVillagesData: data,
        lastAllVillagesUpdate: this.lastUpdate
      });
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('tla-all-villages-collected', {
        detail: data
      }));
      
      console.log(`[TLA Multi-Village] ✅ Total Production: 
        Wood: ${data.totalProduction.wood}/h
        Clay: ${data.totalProduction.clay}/h
        Iron: ${data.totalProduction.iron}/h
        Crop: ${data.totalProduction.crop}/h
        Villages: ${data.villages.length}`);
    } else {
      console.log('[TLA Multi-Village] ⚠️ No villages data found, will retry...');
    }
  }

  public async getAllVillagesProduction(): Promise<any> {
    // Return cache if fresh
    if (this.cache && (Date.now() - this.lastUpdate < this.CACHE_DURATION)) {
      return this.cache;
    }
    
    // Try to collect new data
    this.collectAllVillages();
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return whatever we have
    return this.cache;
  }

  // Add button to trigger statistics page navigation
  public addUpdateButton() {
    if (document.getElementById('tla-update-all-villages')) return;
    
    const button = document.createElement('button');
    button.id = 'tla-update-all-villages';
    button.innerHTML = '📊 Update All Villages';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      padding: 10px 15px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      z-index: 10000;
      font-size: 14px;
    `;
    
    button.addEventListener('click', () => {
      // Navigate to statistics page
      window.location.href = '/statistics/general';
    });
    
    document.body.appendChild(button);
    console.log('[TLA Multi-Village] Update button added');
  }
}

export default MultiVillageCollector;