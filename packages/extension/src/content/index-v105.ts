// Content script v1.0.5 with resource detection
import { initConversationalAI } from './conversational-ai';
import { safeScraper } from './safe-scraper';
import { overviewParser } from './overview-parser';
import { ajaxInterceptor } from './ajax-interceptor';
import { dataStore } from './data-persistence';
import { detectResources } from './resource-detector';

console.log('[TLA Content] v1.0.5 with resource detection loading...');

// Initialize all components
async function initialize() {
  try {
    // Initialize data persistence
    await dataStore.initialize();
    
    // Initialize scrapers
    await safeScraper.initialize();
    ajaxInterceptor.initialize();
    
    // Initialize chat
    initConversationalAI();
    
    // Start resource detection
    console.log('[TLA Content] Starting resource detector...');
    detectResources();
    
    // Listen for detected resources and update state
    window.addEventListener('TLA_RESOURCES_DETECTED', (event: any) => {
      console.log('[TLA Content] Resources detected:', event.detail);
      
      // Update safe scraper with detected resources
      const currentState = safeScraper.getCurrentState();
      if (currentState && currentState.currentVillageId) {
        const village = currentState.villages.find(v => v.id === currentState.currentVillageId);
        if (village) {
          village.resources = event.detail;
          // Trigger state update
          safeScraper.refresh();
        }
      }
    });
    
    // Initial scrape
    const gameState = await safeScraper.getGameState();
    console.log('[TLA Content] Initial state:', {
      villages: gameState.villages.length,
      currentVillage: gameState.currentVillageId,
      resources: window.TLA_RESOURCES || 'detecting...'
    });
    
    // Periodic updates
    setInterval(async () => {
      const state = await safeScraper.getGameState();
      // Check if we have resources from detector
      if (window.TLA_RESOURCES) {
        const currentVillage = state.villages.find(v => v.id === state.currentVillageId);
        if (currentVillage && window.TLA_RESOURCES.wood > 0) {
          currentVillage.resources = window.TLA_RESOURCES;
        }
      }
      console.log('[TLA Content] Periodic update with resources:', window.TLA_RESOURCES);
    }, 30000);
    
    console.log('[TLA Content] v1.0.5 initialization complete');
  } catch (error) {
    console.error('[TLA Content] Init error:', error);
  }
}

// Start when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for debugging
(window as any).TLA = {
  safeScraper,
  overviewParser,
  detectResources,
  version: '1.0.5'
};
