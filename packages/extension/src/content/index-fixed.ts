// Fixed version that creates instances locally
import { SafeScraper } from './safe-scraper';
import { OverviewParser } from './overview-parser';
import { createHUD } from './hud';
import { initConversationalAI } from './conversational-ai';
import { VERSION } from '../version';

console.log(`[TLA Content] Loading TravianAssistant v${VERSION}`);

// Create instances here instead of importing singletons
const safeScraper = new SafeScraper();
const overviewParser = new OverviewParser();

async function initialize() {
  console.log(`[TLA Content] Initializing v${VERSION}...`);
  
  const gameState = await safeScraper.getGameState();
  console.log('[TLA Content] Initial scrape complete:', gameState);
  
  const villages = await overviewParser.getAllCachedVillages();
  console.log(`[TLA Content] Found ${villages.size} villages`);
  
  const hud = createHUD();
  hud.setVersion(VERSION);
  hud.updateRecommendations([]);
  
  initConversationalAI();
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REQUEST_GAME_STATE') {
      safeScraper.getGameState().then(state => {
        sendResponse(state);
      });
      return true;
    }
  });
  
  setInterval(async () => {
    const state = await safeScraper.getGameState();
    console.log('[TLA Content] Periodic scrape:', state);
    
    if (state.currentVillageId) {
      chrome.runtime.sendMessage({
        type: 'SYNC_GAME_STATE',
        gameState: state
      });
    }
  }, 60000);
  
  console.log(`[TLA Content] TravianAssistant v${VERSION} initialized`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

export { safeScraper, overviewParser };
