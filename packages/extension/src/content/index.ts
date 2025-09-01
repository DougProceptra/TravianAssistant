// Main content script entry point
// v1.0.6 - Complete data collection integration
// NO EXPORTS - Content scripts can't use ES6 modules

import { safeScraper } from './safe-scraper';
import { overviewParser } from './overview-parser';
import { createHUD } from './hud';
import { initConversationalAI } from './conversational-ai';
import { VERSION } from '../version';

console.log(`[TravianAssistant] v${VERSION} Loading with comprehensive data collection...`);

// Initialize components
async function initialize() {
  console.log(`[TravianAssistant] Initializing v${VERSION}...`);
  
  try {
    // Initialize safe scraper first
    await safeScraper.initialize();
    
    // Get initial game state
    const gameState = await safeScraper.getGameState();
    console.log('[TravianAssistant] Initial game state collected:', gameState);
    
    // Get villages from overview parser
    const villages = overviewParser.getAllCachedVillages();
    console.log(`[TravianAssistant] Found ${villages.length} villages`);
    
    // Initialize HUD with version and data
    const hud = createHUD();
    hud.setVersion(VERSION);
    
    // Display data in HUD
    if (gameState) {
      const recommendations = [
        `Villages: ${villages.length}`,
        `Current Village: ${gameState.currentVillageName || 'Unknown'}`,
        `Resources: W:${gameState.resources?.wood || 0} C:${gameState.resources?.clay || 0} I:${gameState.resources?.iron || 0} Cr:${gameState.resources?.crop || 0}`
      ];
      
      hud.updateRecommendations(recommendations);
      hud.updateVillages(villages);
      hud.updateDataQuality(villages.length > 0 ? 80 : 40);
    }
    
    // Initialize conversational AI
    initConversationalAI();
    
    // Listen for game state requests from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'REQUEST_GAME_STATE') {
        safeScraper.getGameState().then(state => {
          sendResponse({
            ...state,
            villages: overviewParser.getAllCachedVillages()
          });
        });
        return true; // Async response
      }
    });
    
    // Periodic data collection
    setInterval(async () => {
      const state = await safeScraper.getGameState();
      const villages = overviewParser.getAllCachedVillages();
      
      console.log('[TravianAssistant] Periodic update:', {
        villages: villages.length,
        currentVillage: state.currentVillageName
      });
      
      // Update HUD with fresh data
      hud.updateVillages(villages);
      hud.updateDataQuality(villages.length > 0 ? 80 : 40);
      
      // Send updates to background
      if (state.currentVillageId) {
        chrome.runtime.sendMessage({
          type: 'SYNC_GAME_STATE',
          gameState: state,
          villages: villages
        });
      }
    }, 30000); // Every 30 seconds
    
    console.log(`[TravianAssistant] v${VERSION} initialized successfully`);
    
    // Expose for debugging (NO EXPORT - use window object)
    (window as any).TravianAssistant = {
      version: VERSION,
      getState: () => safeScraper.getGameState(),
      getVillages: () => overviewParser.getAllCachedVillages(),
      safeScraper,
      overviewParser
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

// NO EXPORTS - Content scripts can't use ES6 module exports