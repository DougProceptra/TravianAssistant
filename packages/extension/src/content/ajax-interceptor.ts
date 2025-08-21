/**
 * AJAX Interceptor - Captures game AJAX requests for real-time updates
 * Based on Resource Bar Plus approach - no additional server calls
 */

export interface AjaxResponse {
  type: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

export interface ResourceUpdate {
  villageId: string;
  resources: {
    wood?: number;
    clay?: number;
    iron?: number;
    crop?: number;
  };
  production?: {
    wood?: number;
    clay?: number;
    iron?: number;
    crop?: number;
  };
}

export interface BuildingUpdate {
  villageId: string;
  buildingId: string;
  level: number;
  status: 'completed' | 'started' | 'cancelled';
}

export interface TroopUpdate {
  villageId: string;
  troops: any;
  movement?: {
    type: 'attack' | 'raid' | 'reinforcement' | 'return';
    target?: string;
    arrival?: string;
  };
}

type UpdateCallback = (update: AjaxResponse) => void;

export class AjaxInterceptor {
  private callbacks: Set<UpdateCallback> = new Set();
  private isInitialized = false;
  private capturedRequests: Map<string, AjaxResponse> = new Map();
  private readonly MAX_CACHE_SIZE = 100;
  
  constructor() {
    console.log('[TLA AJAX] Interceptor created');
  }

  /**
   * Initialize AJAX interception
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.log('[TLA AJAX] Already initialized');
      return;
    }

    console.log('[TLA AJAX] Initializing interceptors...');
    
    // Inject the interceptor script into the page
    this.injectInterceptorScript();
    
    // Listen for messages from the injected script
    this.setupMessageListener();
    
    this.isInitialized = true;
    console.log('[TLA AJAX] Interceptors initialized');
  }

  /**
   * Inject interceptor script into the page context
   */
  private injectInterceptorScript(): void {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        console.log('[TLA AJAX] Injecting interceptors into page context');
        
        // Store original methods
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        const originalFetch = window.fetch;
        
        // Intercept XMLHttpRequest
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          this._tla_method = method;
          this._tla_url = url;
          return originalXHROpen.apply(this, [method, url, ...args]);
        };
        
        XMLHttpRequest.prototype.send = function(body) {
          const xhr = this;
          
          // Add load event listener
          this.addEventListener('load', function() {
            // Only capture AJAX requests to game endpoints
            if (xhr._tla_url && (
              xhr._tla_url.includes('ajax.php') ||
              xhr._tla_url.includes('build.php') ||
              xhr._tla_url.includes('dorf1.php') ||
              xhr._tla_url.includes('dorf2.php') ||
              xhr._tla_url.includes('rally_point.php')
            )) {
              try {
                // Try to parse as JSON
                let responseData;
                try {
                  responseData = JSON.parse(xhr.responseText);
                } catch {
                  // Not JSON, might be HTML
                  responseData = xhr.responseText;
                }
                
                // Send to content script
                window.postMessage({
                  source: 'TLA_AJAX_INTERCEPTOR',
                  type: 'xhr_response',
                  url: xhr._tla_url,
                  method: xhr._tla_method,
                  status: xhr.status,
                  data: responseData,
                  timestamp: Date.now()
                }, '*');
              } catch (error) {
                console.error('[TLA AJAX] Error processing XHR response:', error);
              }
            }
          });
          
          return originalXHRSend.apply(this, arguments);
        };
        
        // Intercept fetch API
        window.fetch = async function(...args) {
          const [url, options = {}] = args;
          
          try {
            const response = await originalFetch.apply(this, args);
            
            // Only capture game endpoints
            if (typeof url === 'string' && (
              url.includes('ajax.php') ||
              url.includes('build.php') ||
              url.includes('dorf1.php') ||
              url.includes('dorf2.php') ||
              url.includes('rally_point.php')
            )) {
              // Clone response to read it
              const clone = response.clone();
              
              try {
                const data = await clone.json();
                
                window.postMessage({
                  source: 'TLA_AJAX_INTERCEPTOR',
                  type: 'fetch_response',
                  url: url,
                  method: options.method || 'GET',
                  status: response.status,
                  data: data,
                  timestamp: Date.now()
                }, '*');
              } catch {
                // Try as text if not JSON
                try {
                  const text = await clone.text();
                  window.postMessage({
                    source: 'TLA_AJAX_INTERCEPTOR',
                    type: 'fetch_response',
                    url: url,
                    method: options.method || 'GET',
                    status: response.status,
                    data: text,
                    timestamp: Date.now()
                  }, '*');
                } catch (error) {
                  console.error('[TLA AJAX] Error reading fetch response:', error);
                }
              }
            }
            
            return response;
          } catch (error) {
            // Re-throw to maintain normal error flow
            throw error;
          }
        };
        
        console.log('[TLA AJAX] Interceptors injected successfully');
      })();
    `;
    
    document.documentElement.appendChild(script);
    script.remove();
  }

  /**
   * Listen for messages from injected script
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;
      
      // Check if it's our message
      if (event.data?.source === 'TLA_AJAX_INTERCEPTOR') {
        const { type, url, method, status, data, timestamp } = event.data;
        
        // Create AJAX response object
        const response: AjaxResponse = {
          type,
          url,
          method,
          data,
          timestamp
        };
        
        // Process the intercepted data
        this.processInterceptedData(response);
        
        // Cache the request
        this.cacheRequest(response);
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
          try {
            callback(response);
          } catch (error) {
            console.error('[TLA AJAX] Callback error:', error);
          }
        });
      }
    });
  }

  /**
   * Process intercepted AJAX data to extract useful information
   */
  private processInterceptedData(response: AjaxResponse): void {
    const { url, data } = response;
    
    // Resource updates from various endpoints
    if (url.includes('ajax.php') && data) {
      this.processAjaxData(data);
    }
    
    // Building completions
    if (url.includes('build.php') && data) {
      this.processBuildingData(data);
    }
    
    // Village resource field updates (dorf1)
    if (url.includes('dorf1.php')) {
      this.processResourceFieldData(data);
    }
    
    // Village building updates (dorf2)
    if (url.includes('dorf2.php')) {
      this.processVillageBuildingData(data);
    }
    
    // Troop movements and attacks
    if (url.includes('rally_point.php')) {
      this.processTroopMovementData(data);
    }
  }

  /**
   * Process general AJAX data
   */
  private processAjaxData(data: any): void {
    if (typeof data !== 'object') return;
    
    // Check for resource updates
    if (data.resources) {
      const update: ResourceUpdate = {
        villageId: data.villageId || this.getCurrentVillageId(),
        resources: data.resources
      };
      
      this.broadcastUpdate('resource', update);
    }
    
    // Check for production updates
    if (data.production) {
      const update: ResourceUpdate = {
        villageId: data.villageId || this.getCurrentVillageId(),
        production: data.production
      };
      
      this.broadcastUpdate('production', update);
    }
    
    // Check for building queue updates
    if (data.buildingQueue) {
      this.broadcastUpdate('buildingQueue', data.buildingQueue);
    }
  }

  /**
   * Process building-related data
   */
  private processBuildingData(data: any): void {
    if (typeof data === 'string' && data.includes('buildingSlot')) {
      // Parse HTML for building updates
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      
      const buildingSlots = doc.querySelectorAll('.buildingSlot');
      buildingSlots.forEach(slot => {
        const level = slot.querySelector('.level')?.textContent;
        if (level) {
          const update: BuildingUpdate = {
            villageId: this.getCurrentVillageId(),
            buildingId: slot.getAttribute('data-building-id') || '',
            level: parseInt(level, 10),
            status: 'completed'
          };
          
          this.broadcastUpdate('building', update);
        }
      });
    }
  }

  /**
   * Process resource field data from dorf1
   */
  private processResourceFieldData(data: any): void {
    if (typeof data === 'string' && data.includes('resourceField')) {
      // Extract resource field levels and production
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      
      const fields = doc.querySelectorAll('.resourceField');
      const fieldData: any[] = [];
      
      fields.forEach(field => {
        const level = field.querySelector('.level')?.textContent;
        const type = field.className.match(/gid(\d+)/)?.[1];
        
        if (level && type) {
          fieldData.push({
            type: this.getResourceTypeFromGid(parseInt(type, 10)),
            level: parseInt(level, 10)
          });
        }
      });
      
      if (fieldData.length > 0) {
        this.broadcastUpdate('resourceFields', {
          villageId: this.getCurrentVillageId(),
          fields: fieldData
        });
      }
    }
  }

  /**
   * Process village building data from dorf2
   */
  private processVillageBuildingData(data: any): void {
    if (typeof data === 'string' && data.includes('buildings')) {
      // Extract building information
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      
      const buildings = doc.querySelectorAll('.building');
      const buildingData: any[] = [];
      
      buildings.forEach(building => {
        const level = building.querySelector('.level')?.textContent;
        const name = building.querySelector('.name')?.textContent;
        
        if (level && name) {
          buildingData.push({
            name: name.trim(),
            level: parseInt(level, 10)
          });
        }
      });
      
      if (buildingData.length > 0) {
        this.broadcastUpdate('villageBuildings', {
          villageId: this.getCurrentVillageId(),
          buildings: buildingData
        });
      }
    }
  }

  /**
   * Process troop movement data
   */
  private processTroopMovementData(data: any): void {
    if (typeof data === 'string' && data.includes('troop_details')) {
      // Extract troop movements
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      
      const movements = doc.querySelectorAll('.troop_details');
      const movementData: any[] = [];
      
      movements.forEach(movement => {
        const type = movement.classList.contains('inAttack') ? 'attack' : 
                     movement.classList.contains('inRaid') ? 'raid' : 
                     movement.classList.contains('inSupport') ? 'reinforcement' : 'return';
        
        const timer = movement.querySelector('.timer')?.textContent;
        
        if (timer) {
          movementData.push({
            type,
            arrival: timer,
            villageId: this.getCurrentVillageId()
          });
        }
      });
      
      if (movementData.length > 0) {
        this.broadcastUpdate('troopMovements', movementData);
      }
    }
  }

  /**
   * Broadcast update to listeners
   */
  private broadcastUpdate(type: string, data: any): void {
    window.dispatchEvent(new CustomEvent('TLA_DATA_UPDATE', {
      detail: { type, data, timestamp: Date.now() }
    }));
  }

  /**
   * Get resource type from building GID
   */
  private getResourceTypeFromGid(gid: number): string {
    if (gid >= 1 && gid <= 4) return 'wood';
    if (gid >= 5 && gid <= 8) return 'clay';
    if (gid >= 9 && gid <= 12) return 'iron';
    if (gid >= 13 && gid <= 18) return 'crop';
    return 'unknown';
  }

  /**
   * Get current village ID from page
   */
  private getCurrentVillageId(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('newdid') || 
           document.querySelector('.villageList .active a')?.getAttribute('href')?.match(/newdid=(\d+)/)?.[1] ||
           '0';
  }

  /**
   * Cache intercepted request
   */
  private cacheRequest(response: AjaxResponse): void {
    const key = `${response.method}_${response.url}_${response.timestamp}`;
    
    // Limit cache size
    if (this.capturedRequests.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.capturedRequests.keys().next().value;
      this.capturedRequests.delete(firstKey);
    }
    
    this.capturedRequests.set(key, response);
  }

  /**
   * Register callback for AJAX updates
   */
  public onUpdate(callback: UpdateCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get recent captured requests
   */
  public getRecentRequests(count = 10): AjaxResponse[] {
    const requests = Array.from(this.capturedRequests.values());
    return requests.slice(-count);
  }

  /**
   * Clear captured requests cache
   */
  public clearCache(): void {
    this.capturedRequests.clear();
    console.log('[TLA AJAX] Cache cleared');
  }

  /**
   * Check if interceptor is active
   */
  public isActive(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const ajaxInterceptor = new AjaxInterceptor();
