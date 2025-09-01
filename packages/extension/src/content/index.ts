// packages/extension/src/content/index.ts
// Main content script entry point
// v1.1.0 - Remove exports for Chrome extension compatibility

import { safeScraper } from './safe-scraper';
import { overviewParser } from './overview-parser';
import { createHUD } from './hud';
import { initConversationalAI } from './conversational-ai';
import { VERSION } from '../version';

console.log(`[TLA Content] Loading TravianAssistant v${VERSION}`);

// Initialize components
async function initialize() {
  console.log(`[TLA Content] Initializing v${VERSION}...`);
  
  // Initialize safe scraper first
  await safeScraper.initialize();
  
  // Start safe scraping
  const gameState = await safeScraper.getGameState();
  console.log('[TLA Content] Initial scrape complete:', gameState);
  
  // Initialize overview parser
  const villages = overviewParser.getAllCachedVillages();
  console.log(`[TLA Content] Found ${villages.length} villages`);
  
  // Create HUD with version display
  const hud = createHUD();
  hud.setVersion(VERSION);
  hud.updateRecommendations([]);
  
  // Initialize conversational AI (chat interface)
  initConversationalAI();
  
  // Listen for game state requests from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REQUEST_GAME_STATE') {
      safeScraper.getGameState().then(state => {
        sendResponse(state);
      });
      return true; // Async response
    }
  });
  
  // Periodic scraping
  setInterval(async () => {
    const state = await safeScraper.getGameState();
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

// NO EXPORTS for Chrome extension content scripts
// These modules are available internally but not exported