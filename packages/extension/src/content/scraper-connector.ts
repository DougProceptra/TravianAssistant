// Fixed Content Script - Connects scraper to backend
// Properly uses the enhanced scraper and sends data to Replit

import { dataScraper } from '../scrapers/enhanced-data-scraper';

console.log('[TravianAssistant] Content script loading...');

// Configuration
const BACKEND_URL = 'https://travianassistant.replit.app'; // Update with your Replit URL
const SYNC_INTERVAL = 60000; // 1 minute

// Initialize the content script
async function initialize() {
  console.log('[TravianAssistant] Initializing content script...');
  
  // Set up user email if available
  const stored = await chrome.storage.sync.get(['userEmail']);
  if (stored.userEmail) {
    await dataScraper.setUserEmail(stored.userEmail);
  }
  
  // Initial scrape
  performScrape();
  
  // Set up periodic scraping
  setInterval(performScrape, SYNC_INTERVAL);
  
  // Listen for messages from extension
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REQUEST_GAME_STATE') {
      const gameState = dataScraper.scrapeGameContext();
      sendResponse(gameState);
    } else if (request.type === 'SCRAPE_NOW') {
      performScrape();
      sendResponse({ success: true });
    }
    return true;
  });
  
  console.log('[TravianAssistant] Content script initialized');
}

// Perform scraping and send to backend
async function performScrape() {
  try {
    console.log('[TravianAssistant] Starting scrape...');
    
    // Get game context
    const context = dataScraper.scrapeGameContext();
    
    // Log what we found
    console.log('[TravianAssistant] Scraped context:', {
      user: context.user,
      currentVillage: context.currentVillage?.name,
      resources: context.resources,
      tribe: context.tribe
    });
    
    // Send to backend if we have data
    if (context.currentVillage) {
      await sendToBackend(context);
    }
    
    // Store locally for extension use
    await chrome.storage.local.set({ 
      gameContext: context,
      lastScrape: new Date().toISOString()
    });
    
    // Send to background script for AI processing
    chrome.runtime.sendMessage({
      type: 'GAME_STATE_UPDATE',
      gameState: context
    });
    
  } catch (error) {
    console.error('[TravianAssistant] Scrape error:', error);
  }
}

// Send scraped data to backend
async function sendToBackend(context) {
  try {
    // Prepare village data
    const villageData = {
      accountId: context.user || 'anonymous',
      village: {
        id: context.currentVillage?.id || 'unknown',
        name: context.currentVillage?.name,
        coordinates: context.currentVillage?.coordinates,
        population: context.currentVillage?.population,
        resources: context.resources,
        production: context.resources.production,
        buildings: [], // TODO: Scrape buildings
        troops: [] // TODO: Scrape troops
      }
    };
    
    // Send to backend
    const response = await fetch(`${BACKEND_URL}/api/village`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(villageData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[TravianAssistant] Data sent to backend:', result);
    } else {
      console.error('[TravianAssistant] Backend error:', response.status);
    }
  } catch (error) {
    console.error('[TravianAssistant] Failed to send to backend:', error);
  }
}

// Additional scrapers for specific pages
function scrapeQuestsIfAvailable() {
  const quests = [];
  
  // Try to find quest elements
  const questElements = document.querySelectorAll('.quest, [class*="quest-item"]');
  questElements.forEach(el => {
    const name = el.querySelector('.name, .quest-name')?.textContent?.trim();
    const reward = el.querySelector('.reward, .quest-reward')?.textContent?.trim();
    const status = el.classList.contains('completed') ? 'completed' : 'active';
    
    if (name) {
      quests.push({ name, reward, status });
    }
  });
  
  if (quests.length > 0) {
    console.log('[TravianAssistant] Found quests:', quests);
    chrome.storage.local.set({ quests, questsUpdated: new Date().toISOString() });
  }
  
  return quests;
}

function scrapeBuildingsIfAvailable() {
  const buildings = [];
  
  // Village center buildings
  const buildingSlots = document.querySelectorAll('.buildingSlot, [class*="building-slot"]');
  buildingSlots.forEach(el => {
    const level = el.querySelector('.level, [class*="level"]')?.textContent?.trim();
    const name = el.querySelector('.name, [class*="building-name"]')?.textContent?.trim();
    const buildingId = el.getAttribute('data-building-id') || el.className.match(/building(\d+)/)?.[1];
    
    if (buildingId) {
      buildings.push({
        id: buildingId,
        name: name || `Building ${buildingId}`,
        level: parseInt(level) || 0
      });
    }
  });
  
  if (buildings.length > 0) {
    console.log('[TravianAssistant] Found buildings:', buildings);
    chrome.storage.local.set({ buildings, buildingsUpdated: new Date().toISOString() });
  }
  
  return buildings;
}

// Import map.sql if on the correct page
async function checkForMapData() {
  // Check if we're on a page that might have map.sql link
  const mapLink = document.querySelector('a[href*="map.sql"]');
  if (mapLink) {
    console.log('[TravianAssistant] Found map.sql link:', mapLink.href);
    
    // Notify user
    if (confirm('TravianAssistant: Found map.sql link. Import world data?')) {
      try {
        const response = await fetch(mapLink.href);
        const sql = await response.text();
        
        // Send to backend
        const result = await fetch(`${BACKEND_URL}/api/map`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql })
        });
        
        if (result.ok) {
          const data = await result.json();
          alert(`TravianAssistant: Imported ${data.imported} villages from map.sql`);
        }
      } catch (error) {
        console.error('[TravianAssistant] Map import error:', error);
        alert('TravianAssistant: Failed to import map data');
      }
    }
  }
}

// Page-specific enhancements
function enhancePage() {
  const path = window.location.pathname;
  
  // Add visual indicators
  const indicator = document.createElement('div');
  indicator.id = 'travian-assistant-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 10000;
    cursor: pointer;
  `;
  indicator.textContent = 'TA Active';
  indicator.title = 'TravianAssistant is collecting data';
  indicator.onclick = () => {
    performScrape();
    indicator.textContent = 'Scraping...';
    setTimeout(() => {
      indicator.textContent = 'TA Active';
    }, 1000);
  };
  document.body.appendChild(indicator);
  
  // Page-specific scrapers
  if (path.includes('dorf1') || path.includes('village')) {
    scrapeBuildingsIfAvailable();
  }
  
  if (path.includes('quest')) {
    scrapeQuestsIfAvailable();
  }
  
  // Check for map.sql
  checkForMapData();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
    enhancePage();
  });
} else {
  initialize();
  enhancePage();
}
