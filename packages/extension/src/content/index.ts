// packages/extension/src/content/index.ts
// Main content script entry point
// v0.7.0

import { safeScraper } from './safe-scraper';
import { overviewParser } from './overview-parser';
import { createHUD } from './hud';
import { initConversationalAI } from './conversational-ai-fixed';
import { VERSION } from '../version';

console.log(`[TLA Content] Loading TravianAssistant v${VERSION}`);

// Initialize components
async function initialize() {
  console.log(`[TLA Content] Initializing v${VERSION}...`);
  
  // Start safe scraping
  const gameState = await safeScraper.scrapeCurrentState();
  console.log('[TLA Content] Initial scrape complete:', gameState);
  
  // Initialize overview parser
  const villages = await overviewParser.getAllCachedVillages();
  console.log(`[TLA Content] Found ${villages.size} villages`);
  
  // Create HUD with version display
  const hud = createHUD();
  hud.setVersion(VERSION);
  hud.updateRecommendations([]);
  
  // Initialize conversational AI (chat interface)
  initConversationalAI();
  
  // Listen for game state requests from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REQUEST_GAME_STATE') {
      safeScraper.scrapeCurrentState().then(state => {
        sendResponse(state);
      });
      return true; // Async response
    }
  });
  
  // Periodic scraping
  setInterval(async () => {
    const state = await safeScraper.scrapeCurrentState();
    console.log('[TLA Content] Periodic scrape:', state);
    
    // Send to background for processing if significant changes
    if (state.currentVillageId) {
      chrome.runtime.sendMessage({
        type: 'SYNC_GAME_STATE',
        gameState: state
      });
    }
  }, 60000); // Every minute
  
  console.log(`[TLA Content] TravianAssistant v${VERSION} initialized`);
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for other modules
export { safeScraper, overviewParser };