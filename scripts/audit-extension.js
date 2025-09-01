// Audit script for TravianAssistant - run in browser console
console.log("=== TravianAssistant Audit v1.0 ===");
console.log("Run this in the browser console while on Travian");

// 1. Check if extension is loaded
console.log("\n1. EXTENSION CHECK:");
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log("✓ Chrome extension context found");
} else {
  console.log("✗ No extension context");
}

// 2. Check for TLA elements
console.log("\n2. UI ELEMENTS:");
const chatUI = document.querySelector('#tla-chat-interface');
console.log(chatUI ? "✓ Chat UI found" : "✗ Chat UI missing");

const dragHandle = document.querySelector('.tla-chat-header');
console.log(dragHandle ? "✓ Drag handle found" : "✗ Drag handle missing");

const resizeHandle = document.querySelector('.tla-resize-handle');
console.log(resizeHandle ? "✓ Resize handle found" : "✗ Resize handle missing");

// 3. Check game data scraping
console.log("\n3. GAME DATA:");
const resources = {
  wood: document.querySelector('#l1')?.textContent || "not found",
  clay: document.querySelector('#l2')?.textContent || "not found", 
  iron: document.querySelector('#l3')?.textContent || "not found",
  crop: document.querySelector('#l4')?.textContent || "not found"
};
console.log("Resources:", resources);

const villageLinks = document.querySelectorAll('a[href*="newdid="]');
console.log(`Villages found: ${villageLinks.length}`);

// 4. Check for data in window object
console.log("\n4. WINDOW DATA:");
console.log("Game state:", window.__tla_gameState || "not found");
console.log("Safe scraper:", window.safeScraper || "not found");

// 5. Check localStorage
console.log("\n5. STORAGE:");
const storage = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.includes('tla') || key.includes('travian')) {
    storage[key] = localStorage.getItem(key)?.substring(0, 50) + "...";
  }
}
console.log("TLA Storage:", storage);

// 6. Check event listeners
console.log("\n6. EVENT LISTENERS:");
const chatHeader = document.querySelector('.tla-chat-header');
if (chatHeader) {
  const listeners = getEventListeners ? getEventListeners(chatHeader) : "Can't check (use Chrome DevTools)";
  console.log("Drag listeners:", listeners);
}

// 7. Check CSS classes
console.log("\n7. CSS CLASSES:");
const styles = document.querySelector('style[data-tla-styles]');
console.log(styles ? "✓ TLA styles found" : "✗ TLA styles missing");

// 8. Test message passing
console.log("\n8. MESSAGE PASSING:");
if (window.chrome && chrome.runtime) {
  chrome.runtime.sendMessage({type: 'PING'}, response => {
    console.log("Background response:", response || "no response");
  });
}

// 9. Check current page context
console.log("\n9. PAGE CONTEXT:");
console.log("Current URL:", window.location.href);
console.log("Page type:", window.location.pathname);
const villageId = new URLSearchParams(window.location.search).get('newdid');
console.log("Current village ID:", villageId || "not found");

// 10. Check for conflicting scripts
console.log("\n10. POTENTIAL CONFLICTS:");
const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s);
console.log("Loaded scripts:", scripts.length);

console.log("\n=== Audit Complete ===");
console.log("Share the output above to diagnose issues");

// Also try to get game state programmatically
(async function() {
  console.log("\n11. ATTEMPTING TO GET GAME STATE:");
  
  // Try method 1: Direct window access
  if (window.safeScraper && typeof window.safeScraper.getGameState === 'function') {
    try {
      const state = await window.safeScraper.getGameState();
      console.log("Game state retrieved:", state);
    } catch (e) {
      console.log("Error getting game state:", e);
    }
  }
  
  // Try method 2: Message to content script
  window.postMessage({ type: 'TLA_GET_STATE' }, '*');
  
  // Listen for response
  window.addEventListener('message', function(event) {
    if (event.data.type === 'TLA_STATE_RESPONSE') {
      console.log("State via message:", event.data.state);
    }
  });
})();