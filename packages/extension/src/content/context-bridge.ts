/**
 * Context Bridge for accessing page-level window.resources
 * This script runs in the page context and sends data to content script
 */

export class ContextBridge {
  private messagePrefix = 'TLA_BRIDGE';
  private pollInterval: number | null = null;

  constructor() {
    this.setupBridge();
  }

  private setupBridge() {
    // Method 1: Inject a script that runs in page context
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Poll for window.resources and send to content script
        function sendResourceData() {
          if (window.resources && window.resources.production) {
            const gameData = {
              resources: window.resources,
              travian: window.Travian ? {
                constants: window.Travian.Constants,
                variables: window.Travian.Variables
              } : null,
              villages: window.villages ? Array.from(window.villages).map(v => ({
                id: v.getAttribute('data-did'),
                name: v.querySelector('.name')?.textContent
              })) : [],
              fieldsOfVillage: window.fieldsOfVillage || null,
              timestamp: Date.now()
            };
            
            // Send to content script via custom event
            window.postMessage({
              type: 'TLA_GAME_DATA',
              data: gameData
            }, '*');
            
            console.log('[TLA Bridge] Sent game data to content script:', gameData);
          }
        }
        
        // Send data immediately if available
        sendResourceData();
        
        // Set up periodic updates (every 5 seconds)
        setInterval(sendResourceData, 5000);
        
        // Also send on any AJAX completion
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          return originalFetch.apply(this, args).then(response => {
            setTimeout(sendResourceData, 100); // Send after AJAX completes
            return response;
          });
        };
        
        // Hook into XMLHttpRequest as well
        const originalXHR = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function() {
          this.addEventListener('load', () => {
            setTimeout(sendResourceData, 100);
          });
          return originalXHR.apply(this, arguments);
        };
        
        console.log('[TLA Bridge] Context bridge initialized in page context');
      })();
    `;
    
    // Inject the script
    (document.head || document.documentElement).appendChild(script);
    script.remove(); // Clean up
    
    // Listen for messages from page context
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'TLA_GAME_DATA') {
        this.handleGameData(event.data.data);
      }
    });
    
    console.log('[TLA Bridge] Content script listener set up');
  }

  private handleGameData(data: any) {
    // Store in extension storage
    chrome.storage.local.set({
      gameData: data,
      lastUpdate: Date.now()
    });
    
    // Log for debugging
    console.log('[TLA Bridge] Received game data:', data);
    
    // Dispatch custom event for other parts of extension
    window.dispatchEvent(new CustomEvent('tla-game-data-update', { 
      detail: data 
    }));
  }

  // Alternative method using window.wrappedJSObject (Firefox) or accessor property
  public tryDirectAccess(): any {
    try {
      // Method 2: Try to access via accessor property
      const gameDataScript = document.createElement('script');
      gameDataScript.textContent = `
        Object.defineProperty(window, '__tlaGameData', {
          get: function() {
            return {
              resources: window.resources,
              travian: window.Travian,
              villages: window.villages,
              timestamp: Date.now()
            };
          }
        });
      `;
      document.head.appendChild(gameDataScript);
      gameDataScript.remove();
      
      // Try to read it
      return (window as any).__tlaGameData;
    } catch (e) {
      console.error('[TLA Bridge] Direct access failed:', e);
      return null;
    }
  }

  // Get latest data from storage
  public async getLatestData(): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['gameData', 'lastUpdate'], (result) => {
        resolve(result.gameData || null);
      });
    });
  }

  // Force a data collection
  public requestDataUpdate() {
    // Inject a one-time script to send data
    const script = document.createElement('script');
    script.textContent = `
      if (window.resources) {
        window.postMessage({
          type: 'TLA_GAME_DATA',
          data: {
            resources: window.resources,
            timestamp: Date.now()
          }
        }, '*');
      }
    `;
    document.head.appendChild(script);
    script.remove();
  }
}

// Export for use in content script
export default ContextBridge;