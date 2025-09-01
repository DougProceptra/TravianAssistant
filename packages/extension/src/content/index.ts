// packages/extension/src/content/index.ts
// Main content script entry point
// v1.3.4 - Integrated new data collection system with statistics page support

import { safeScraper } from './safe-scraper';
import { dataCollector } from './data-collector';
import { createHUD } from './hud';
import { initConversationalAI } from './conversational-ai-working';
import { VERSION } from '../version';

console.log(`[TLA Content] Loading TravianAssistant v${VERSION}`);

// Initialize components
async function initialize() {
  console.log(`[TLA Content] Initializing v${VERSION}...`);
  
  // Load cached village data from storage
  await dataCollector.loadCacheFromStorage();
  console.log('[TLA Content] Cache loaded from storage');
  
  // Initialize safe scraper for current page data
  await safeScraper.initialize();
  
  // Get initial game state using new collector
  const gameState = await dataCollector.collectGameState();
  console.log('[TLA Content] Initial game state collected:', {
    currentVillage: gameState.currentVillage?.name,
    totalVillages: gameState.villages?.length || 0,
    totalProduction: gameState.totalProduction
  });
  
  // Auto-update from statistics page if we're on it
  if (window.location.pathname.includes('/statistics/')) {
    console.log('[TLA Content] 📊 On statistics page, updating all village data...');
    setTimeout(async () => {
      const success = await dataCollector.fetchFromStatisticsPage();
      if (success) {
        console.log('[TLA Content] ✅ All village data updated from statistics page');
        
        // Notify HUD of updated data
        const updatedState = await dataCollector.collectGameState();
        chrome.runtime.sendMessage({
          type: 'GAME_STATE_UPDATED',
          gameState: updatedState
        });
      }
    }, 1000);
  }
  
  // Create HUD with version display
  const hud = createHUD();
  hud.setVersion(VERSION);
  hud.updateRecommendations([]);
  
  // Initialize chat UI
  initConversationalAI();
  
  // Listen for messages from background/HUD
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REQUEST_GAME_STATE') {
      console.log('[TLA Content] Game state requested');
      dataCollector.collectGameState().then(state => {
        console.log('[TLA Content] Sending game state with total production:', state.totalProduction);
        sendResponse(state);
      }).catch(error => {
        console.error('[TLA Content] Error collecting game state:', error);
        sendResponse({ error: error.message });
      });
      return true; // Async response
    }
    
    if (request.type === 'UPDATE_FROM_STATISTICS') {
      console.log('[TLA Content] Request to update from statistics page');
      dataCollector.fetchFromStatisticsPage().then(success => {
        if (success) {
          sendResponse({ success: true, message: 'Data updated from statistics page' });
        } else {
          sendResponse({ 
            success: false, 
            message: 'Please navigate to Statistics > General to update all village data' 
          });
        }
      });
      return true;
    }
  });
  
  // Periodic data collection and sync
  setInterval(async () => {
    const state = await dataCollector.collectGameState();
    console.log('[TLA Content] Periodic collection:', {
      villages: state.villages?.length || 0,
      totalCrop: state.totalProduction?.crop || 0
    });
    
    // Send to background for AI processing if we have complete data
    if (state.totalProduction && state.totalProduction.crop !== 0) {
      chrome.runtime.sendMessage({
        type: 'SYNC_GAME_STATE',
        gameState: state
      });
    }
  }, 60000); // Every minute
  
  // Add helper button to navigate to statistics page
  if (!window.location.pathname.includes('/statistics/')) {
    const statsButton = document.createElement('button');
    statsButton.textContent = '📊 Update All Villages';
    statsButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      padding: 10px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    `;
    statsButton.onclick = () => {
      window.location.href = '/statistics/general';
    };
    document.body.appendChild(statsButton);
  }
  
  console.log(`[TLA Content] TravianAssistant v${VERSION} initialized with data collector`);
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// NO EXPORTS for Chrome extension content scripts