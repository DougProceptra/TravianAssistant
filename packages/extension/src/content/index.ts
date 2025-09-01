// Main content script entry point
// v1.0.6 - Complete data collection integration

import { masterCollector } from './collectors/master-collector';
import { eliteScraper } from './content/elite-scraper';
import { safeScraper } from './content/safe-scraper';
import { overviewParser } from './content/overview-parser';
import { createHUD } from './content/hud';
import { initConversationalAI } from './content/conversational-ai';
import { VERSION } from './version';

console.log(`[TravianAssistant] v${VERSION} Loading with comprehensive data collection...`);

// Initialize components
async function initialize() {
  console.log(`[TravianAssistant] Initializing v${VERSION}...`);
  
  try {
    // Initialize master collector first (orchestrates everything)
    console.log('[TravianAssistant] Starting Master Data Collector...');
    
    // Initialize individual scrapers
    await safeScraper.initialize();
    
    // Get comprehensive game state
    const comprehensiveState = await masterCollector.getComprehensiveState(true);
    console.log('[TravianAssistant] Initial comprehensive state collected:', {
      villages: comprehensiveState.villages.length,
      totalPopulation: comprehensiveState.totals.population,
      dataQuality: comprehensiveState.dataQuality + '%',
      missingData: comprehensiveState.missingData
    });
    
    // Initialize HUD with version and data
    const hud = createHUD();
    hud.setVersion(VERSION);
    
    // Display real data in HUD
    if (comprehensiveState.totals) {
      hud.updateRecommendations([
        `Villages: ${comprehensiveState.villages.length}`,
        `Total Population: ${comprehensiveState.totals.population}`,
        `Total Production: W:${comprehensiveState.totals.production.wood} C:${comprehensiveState.totals.production.clay} I:${comprehensiveState.totals.production.iron} Cr:${comprehensiveState.totals.production.cropNet}`,
        `Data Quality: ${comprehensiveState.dataQuality}%`
      ]);
    }
    
    // Initialize conversational AI with comprehensive data
    initConversationalAI();
    
    // Listen for game state requests from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'REQUEST_GAME_STATE') {
        masterCollector.getComprehensiveState().then(state => {
          // Send comprehensive state with AI-ready prompt
          masterCollector.getAIPromptData().then(promptData => {
            sendResponse({
              ...state,
              aiPrompt: promptData
            });
          });
        });
        return true; // Async response
      }
      
      if (request.type === 'GET_AI_PROMPT') {
        masterCollector.getAIPromptData().then(promptData => {
          sendResponse({ prompt: promptData });
        });
        return true;
      }
    });
    
    // Periodic comprehensive data collection
    setInterval(async () => {
      const state = await masterCollector.getComprehensiveState(false);
      console.log('[TravianAssistant] Periodic update:', {
        villages: state.villages.length,
        dataQuality: state.dataQuality + '%',
        priorities: state.aiContext.priorities
      });
      
      // Update HUD with fresh data
      if (state.totals) {
        hud.updateRecommendations([
          `Villages: ${state.villages.length}`,
          `Population: ${state.totals.population}`,
          `Resources: W:${state.totals.resources.wood} C:${state.totals.resources.clay} I:${state.totals.resources.iron} Cr:${state.totals.resources.crop}`,
          `Production: +${state.totals.production.wood}/+${state.totals.production.clay}/+${state.totals.production.iron}/+${state.totals.production.cropNet}`,
          ...state.aiContext.priorities.slice(0, 3) // Show top 3 priorities
        ]);
      }
      
      // Send significant updates to background
      if (state.villages.length > 0) {
        chrome.runtime.sendMessage({
          type: 'SYNC_GAME_STATE',
          gameState: state,
          dataQuality: state.dataQuality
        });
      }
    }, 30000); // Every 30 seconds
    
    // Monitor for page changes (Travian is single-page app-like)
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(async () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('[TravianAssistant] Page changed, refreshing data...');
        
        // Force refresh on page change
        const newState = await masterCollector.getComprehensiveState(true);
        console.log('[TravianAssistant] New page data:', {
          page: newState.aiContext.currentPage,
          village: newState.aiContext.currentVillageId
        });
      }
    });
    
    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log(`[TravianAssistant] v${VERSION} initialized successfully with comprehensive data collection`);
    
    // Expose for debugging
    (window as any).TravianAssistant = {
      version: VERSION,
      getState: () => masterCollector.getComprehensiveState(),
      getAIPrompt: () => masterCollector.getAIPromptData(),
      eliteScraper,
      safeScraper,
      overviewParser,
      masterCollector
    };
    
  } catch (error) {
    console.error('[TravianAssistant] Initialization error:', error);
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for other modules
export { masterCollector, eliteScraper, safeScraper, overviewParser };
