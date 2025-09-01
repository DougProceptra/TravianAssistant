// Enhanced content script with fixed scrapers and prompt system
import { initConversationalAI } from './conversational-ai';
import { safeScraper } from './safe-scraper-fixed';
import { overviewParser } from './overview-parser';
import { ajaxInterceptor } from './ajax-interceptor';
import { dataStore } from './data-persistence';

console.log('[TLA Content] Enhanced version loading...');

// Initialize all components
async function initialize() {
  try {
    // Initialize data persistence
    await dataStore.initialize();
    
    // Initialize safe scraper with fixed selectors
    await safeScraper.initialize();
    
    // Initialize AJAX interceptor
    ajaxInterceptor.initialize();
    
    // Initialize chat interface
    initConversationalAI();
    
    // Perform initial scrape
    const gameState = await safeScraper.getGameState();
    console.log('[TLA Content] Initial game state:', {
      villages: gameState.villages.length,
      currentVillage: gameState.currentVillageName,
      currentPage: gameState.currentPage,
      hasResources: gameState.totals?.resources?.wood > 0
    });
    
    // Set up periodic scraping
    setInterval(async () => {
      const state = await safeScraper.getGameState();
      console.log('[TLA Content] Periodic update:', {
        currentVillage: state.currentVillageName,
        resources: state.totals?.resources
      });
    }, 30000); // Every 30 seconds
    
    console.log('[TLA Content] Enhanced initialization complete');
  } catch (error) {
    console.error('[TLA Content] Initialization error:', error);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
