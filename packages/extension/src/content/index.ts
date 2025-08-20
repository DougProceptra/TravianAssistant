// packages/extension/src/content/index.ts
// Travian Legends Assistant - Content Script with SmartHUD Integration
import { SmartHUD } from './smart-hud';
import { GameState, PageKind, ResourceState, Village, Building, HeroState, Movement } from '../lib/types';

(() => {
  const VERSION = "1.0.0"; // Updated for SmartHUD integration
  const LOOP_MS = 5000;
  
  // Initialize SmartHUD
  let smartHUD: SmartHUD | null = null;

  // ---------- Utils ----------
  const $ = (sel: string, root: ParentNode = document) =>
    root.querySelector<HTMLElement>(sel) || null;
  const $all = (sel: string, root: ParentNode = document) =>
    Array.from(root.querySelectorAll<HTMLElement>(sel));
  const txt = (el: Element | null | undefined) =>
    (el?.textContent || "").trim() || undefined;
  const toNum = (s?: string) => {
    if (!s) return undefined;
    const cleaned = s.replace(/[^\d.,]/g, "").replace(/\u202F|\u00A0/g, "");
    const m = cleaned.match(/[\d.,]+/g);
    if (!m) return undefined;
    const last = m[m.length - 1].replace(/,/g, "");
    const n = Number(last);
    return isFinite(n) ? n : undefined;
  };

  function pick(selectors: string[], root: ParentNode = document): { value?: string; sel?: string } {
    for (const s of selectors) {
      const el = $(s, root);
      const v = txt(el);
      if (v) return { value: v, sel: s };
    }
    return {};
  }

  function pickNum(selectors: string[], root: ParentNode = document) {
    const p = pick(selectors, root);
    return { value: toNum(p.value), sel: p.sel };
  }

  // ---------- Page Detection ----------
  function detectPage(): PageKind {
    const path = window.location.pathname;
    if (path.includes('dorf1.php')) return 'dorf1';
    if (path.includes('dorf2.php')) return 'dorf2';
    if (path.includes('hero.php')) return 'hero';
    if (path.includes('build.php')) {
      const gid = new URLSearchParams(window.location.search).get('gid');
      if (gid === '16') return 'rally';
      if (gid === '17') return 'market';
    }
    if (path.includes('berichte.php')) return 'reports';
    if (path.includes('nachrichten.php')) return 'messages';
    if (path.includes('allianz.php')) return 'alliance';
    return 'other';
  }

  // ---------- State Collection ----------
  function collectGameState(): GameState {
    const page = detectPage();
    
    // Collect resources
    const resources: ResourceState = {
      wood: pickNum(['#l1', '.lumber .value']).value || 0,
      clay: pickNum(['#l2', '.clay .value']).value || 0,
      iron: pickNum(['#l3', '.iron .value']).value || 0,
      crop: pickNum(['#l4', '.crop .value']).value || 0,
      woodProduction: pickNum(['.lumber .production']).value || 0,
      clayProduction: pickNum(['.clay .production']).value || 0,
      ironProduction: pickNum(['.iron .production']).value || 0,
      cropProduction: pickNum(['.crop .production']).value || 0,
      freeCrop: pickNum(['.crop .freeCrop']).value || 0,
      warehouseCapacity: pickNum(['.warehouse .capacity']).value || 0,
      granaryCapacity: pickNum(['.granary .capacity']).value || 0
    };

    // Collect villages
    const villages: Village[] = [];
    $all('#sidebarBoxVillagelist .villageList li').forEach(li => {
      const name = txt(li.querySelector('.name'));
      const coords = txt(li.querySelector('.coordinates'));
      if (name && coords) {
        const match = coords.match(/\(([-\d]+)\|([-\d]+)\)/);
        if (match) {
          villages.push({
            id: li.getAttribute('data-did') || '',
            name,
            x: parseInt(match[1]),
            y: parseInt(match[2]),
            population: toNum(txt(li.querySelector('.inhabitants'))) || 0,
            isCapital: li.classList.contains('mainVillage'),
            loyalty: 100 // Default, would need to fetch from another page
          });
        }
      }
    });

    // Collect buildings
    const buildings: Building[] = [];
    if (page === 'dorf2') {
      $all('.buildingSlot').forEach(slot => {
        const level = toNum(txt(slot.querySelector('.level')));
        const name = txt(slot.querySelector('.name'));
        if (name && level) {
          buildings.push({
            id: slot.getAttribute('data-aid') || '',
            name,
            level,
            isUpgrading: slot.classList.contains('underConstruction'),
            position: toNum(slot.getAttribute('data-aid'))
          });
        }
      });
    }

    // Collect hero state
    const hero: HeroState = {
      level: pickNum(['.heroLevel']).value || 0,
      health: pickNum(['.heroHealth']).value || 100,
      experience: pickNum(['.heroExperience']).value || 0,
      attack: 0, // Would need to parse from hero page
      defense: 0,
      isHome: !$('.heroStatus .heroRunning'),
      isMoving: !!$('.heroStatus .heroRunning')
    };

    // Collect movements
    const movements: Movement[] = [];
    $all('.troop_details').forEach(detail => {
      const type = detail.classList.contains('inRaid') ? 'incoming_attack' : 
                   detail.classList.contains('inSupport') ? 'incoming_support' : 
                   'returning';
      movements.push({
        id: detail.getAttribute('data-moveid') || '',
        type: type as any,
        arrivalTime: Date.now() + (toNum(txt(detail.querySelector('.timer'))) || 0) * 1000,
        origin: txt(detail.querySelector('.origin')),
        destination: txt(detail.querySelector('.destination'))
      });
    });

    // Build complete game state
    const gameState: GameState = {
      timestamp: Date.now(),
      page,
      url: window.location.href,
      server: {
        name: window.location.hostname,
        speed: 1, // Would need to detect from server info
        troopSpeed: 1,
        worldId: window.location.hostname.split('.')[0]
      },
      villages,
      resources,
      buildings,
      troops: {}, // Would need to collect from barracks/rally point
      hero,
      movements,
      reports: []
    };

    return gameState;
  }

  // ---------- SmartHUD Integration ----------
  function initializeHUD() {
    if (!smartHUD) {
      smartHUD = new SmartHUD();
      smartHUD.render();
      console.log('[TLA] SmartHUD initialized');
    }
  }

  function destroyHUD() {
    if (smartHUD) {
      smartHUD.destroy();
      smartHUD = null;
      console.log('[TLA] SmartHUD destroyed');
    }
  }

  // ---------- Message Handlers ----------
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[TLA] Content received message:', request.type);
    
    switch (request.type) {
      case 'COLLECT_STATE':
        const state = collectGameState();
        sendResponse({ success: true, state });
        break;
        
      case 'UPDATE_ANALYSIS':
        if (smartHUD && request.analysis) {
          smartHUD.updateAnalysis(request.analysis);
        }
        sendResponse({ success: true });
        break;
        
      case 'SHOW_HUD':
        initializeHUD();
        sendResponse({ success: true });
        break;
        
      case 'HIDE_HUD':
        if (smartHUD) {
          smartHUD.hide();
        }
        sendResponse({ success: true });
        break;
        
      case 'DESTROY_HUD':
        destroyHUD();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
    
    return true; // Keep channel open for async response
  });

  // ---------- Main Loop ----------
  let loopTimer: number | null = null;
  let isTabVisible = true;

  function scrapeLoop() {
    if (!isTabVisible) return;
    
    const state = collectGameState();
    
    // Send state to background for analysis
    chrome.runtime.sendMessage({
      type: 'STATE_UPDATE',
      state
    }, response => {
      if (response && response.analysis && smartHUD) {
        smartHUD.updateAnalysis(response.analysis);
      }
    });
  }

  function startLoop() {
    stopLoop();
    scrapeLoop(); // Initial scrape
    loopTimer = window.setInterval(scrapeLoop, LOOP_MS);
    console.log('[TLA] Started scraping loop');
  }

  function stopLoop() {
    if (loopTimer !== null) {
      clearInterval(loopTimer);
      loopTimer = null;
      console.log('[TLA] Stopped scraping loop');
    }
  }

  // ---------- Visibility Handling ----------
  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
    if (isTabVisible) {
      startLoop();
    } else {
      stopLoop();
    }
  });

  // ---------- Initialization ----------
  function initialize() {
    console.log('[TLA] Travian Legends Assistant initializing...');
    
    // Check if we're on a Travian page
    const hostname = window.location.hostname;
    if (!hostname.includes('travian.com')) {
      console.log('[TLA] Not a Travian page, skipping initialization');
      return;
    }
    
    // Initialize SmartHUD
    initializeHUD();
    
    // Start scraping loop
    startLoop();
    
    // Notify background that content script is ready
    chrome.runtime.sendMessage({ type: 'CONTENT_READY' });
    
    console.log(`[TLA] Initialized v${VERSION} on ${detectPage()} page`);
  }

  // ---------- Debug Interface ----------
  (window as any).TLA = {
    version: VERSION,
    getState: collectGameState,
    showHUD: initializeHUD,
    hideHUD: () => smartHUD?.hide(),
    destroyHUD: destroyHUD,
    debug: () => {
      const state = collectGameState();
      console.log('[TLA] Current State:', state);
      return state;
    }
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
