// TravianAssistant HUD-Backend Connector
// Provides real-time sync and AI chat integration

(function() {
  'use strict';
  
  console.log('[TravianAssistant] HUD-Backend Connector initializing...');
  
  // Configuration
  const CONFIG = {
    backendUrl: localStorage.getItem('TLA_BACKEND_URL') || 'https://workspace.dougdostal.repl.co',
    syncInterval: 30000, // 30 seconds
    accountId: null,
    debug: true
  };

  // Get or create account ID from email
  function getAccountId() {
    const email = localStorage.getItem('TLA_USER_EMAIL');
    if (!email) {
      const promptEmail = prompt('Please enter your email for TravianAssistant:');
      if (promptEmail) {
        localStorage.setItem('TLA_USER_EMAIL', promptEmail);
        // Simple hash for privacy
        CONFIG.accountId = btoa(promptEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
        localStorage.setItem('TLA_ACCOUNT_ID', CONFIG.accountId);
      }
    } else {
      CONFIG.accountId = localStorage.getItem('TLA_ACCOUNT_ID') || 
                        btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }
    return CONFIG.accountId;
  }

  // Scrape current game state
  function scrapeGameState() {
    const state = {
      resources: {
        wood: parseInt(document.querySelector('#l1')?.textContent?.replace(/[^\d]/g, '') || '0'),
        clay: parseInt(document.querySelector('#l2')?.textContent?.replace(/[^\d]/g, '') || '0'),
        iron: parseInt(document.querySelector('#l3')?.textContent?.replace(/[^\d]/g, '') || '0'),
        crop: parseInt(document.querySelector('#l4')?.textContent?.replace(/[^\d]/g, '') || '0')
      },
      production: {
        wood: parseInt(document.querySelector('.num.lumber')?.textContent?.match(/\d+/)?.[0] || '0'),
        clay: parseInt(document.querySelector('.num.clay')?.textContent?.match(/\d+/)?.[0] || '0'),
        iron: parseInt(document.querySelector('.num.iron')?.textContent?.match(/\d+/)?.[0] || '0'),
        crop: parseInt(document.querySelector('.num.crop')?.textContent?.match(/\d+/)?.[0] || '0')
      },
      village: {
        name: document.querySelector('.villageNameField')?.textContent || 'Unknown',
        population: parseInt(document.querySelector('.population')?.textContent?.match(/\d+/)?.[0] || '0')
      },
      hero: {
        level: parseInt(document.querySelector('.heroLevel')?.textContent?.match(/\d+/)?.[0] || '0'),
        health: parseInt(document.querySelector('.heroHealthBarText')?.textContent?.match(/\d+/)?.[0] || '100')
      },
      buildings: [],
      serverTime: document.querySelector('#servertime')?.textContent || new Date().toISOString()
    };

    // Try to get building data from village view
    if (window.location.href.includes('dorf2.php')) {
      document.querySelectorAll('.buildingSlot').forEach(slot => {
        const level = slot.querySelector('.level')?.textContent?.match(/\d+/)?.[0];
        const name = slot.querySelector('.name')?.textContent;
        if (name && level) {
          state.buildings.push({ name, level: parseInt(level) });
        }
      });
    }

    // Try to get CP data
    const cpElement = document.querySelector('.culturePoints');
    if (cpElement) {
      const cpText = cpElement.textContent;
      const current = cpText.match(/(\d+)\//)?.[1];
      const needed = cpText.match(/\/(\d+)/)?.[1];
      state.culturePoints = {
        current: parseInt(current || '0'),
        needed: parseInt(needed || '500'),
        production: parseInt(document.querySelector('.production.cp')?.textContent?.match(/\d+/)?.[0] || '0')
      };
    }

    return state;
  }

  // Sync game state with backend
  async function syncWithBackend() {
    if (!CONFIG.accountId) {
      console.log('[TravianAssistant] No account ID, skipping sync');
      return;
    }

    const gameState = scrapeGameState();
    
    try {
      // Send village data
      const response = await fetch(`${CONFIG.backendUrl}/api/village`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: CONFIG.accountId,
          village: {
            id: Date.now().toString(),
            name: gameState.village.name,
            population: gameState.village.population,
            resources: gameState.resources,
            production: gameState.production,
            buildings: gameState.buildings,
            hero: gameState.hero
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[TravianAssistant] Synced with backend, CP/day:', data.cpProduction);
        updateHUDStatus('synced', data.cpProduction);
      } else {
        updateHUDStatus('error');
      }

      // Update settlement tracking if we have CP data
      if (gameState.culturePoints) {
        await fetch(`${CONFIG.backendUrl}/api/settlement/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: CONFIG.accountId,
            cpCurrent: gameState.culturePoints.current,
            cpProduction: gameState.culturePoints.production,
            cpNeeded: gameState.culturePoints.needed,
            resourcesHourly: gameState.production,
            phase: determineGamePhase(gameState)
          })
        });
      }

    } catch (error) {
      console.error('[TravianAssistant] Sync error:', error);
      updateHUDStatus('offline');
    }
  }

  // Determine current game phase
  function determineGamePhase(state) {
    const population = state.village.population || 0;
    if (population < 100) return 'FOUNDATION';
    if (population < 200) return 'GROWTH';
    if (population < 400) return 'EXPANSION';
    return 'SETTLEMENT';
  }

  // Update HUD status indicator
  function updateHUDStatus(status, cpProduction) {
    const statusElement = document.querySelector('#tla-sync-status');
    if (statusElement) {
      const icons = {
        synced: '✅',
        offline: '❌',
        error: '⚠️'
      };
      statusElement.textContent = `${icons[status]} ${status === 'synced' ? `Synced (${cpProduction} CP/day)` : status}`;
    }
  }

  // Create enhanced HUD with AI chat
  function createEnhancedHUD() {
    // Check if HUD already exists
    if (document.querySelector('#tla-enhanced-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'tla-enhanced-hud';
    hud.innerHTML = `
      <style>
        #tla-enhanced-hud {
          position: fixed;
          top: 10px;
          right: 10px;
          width: 320px;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid #8B4513;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 10000;
          font-family: Arial, sans-serif;
        }
        .tla-header {
          background: linear-gradient(135deg, #8B4513, #A0522D);
          color: white;
          padding: 8px;
          border-radius: 6px 6px 0 0;
          cursor: move;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tla-content {
          padding: 10px;
          max-height: 400px;
          overflow-y: auto;
        }
        .tla-metric {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #eee;
        }
        .tla-chat-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
          margin-top: 10px;
        }
        .tla-chat-btn:hover {
          background: #1976D2;
        }
        #tla-chat-container {
          display: none;
          margin-top: 10px;
          border-top: 2px solid #eee;
          padding-top: 10px;
        }
        .tla-chat-messages {
          height: 200px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 8px;
          margin-bottom: 8px;
          background: #f9f9f9;
        }
        .tla-chat-input {
          width: 100%;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .tla-message {
          margin: 4px 0;
          padding: 4px;
        }
        .tla-message.user {
          text-align: right;
          color: #2196F3;
        }
        .tla-message.assistant {
          text-align: left;
          color: #4CAF50;
        }
      </style>
      <div class="tla-header">
        <span>🏰 TravianAssistant AI</span>
        <span id="tla-sync-status">⏳ Connecting...</span>
      </div>
      <div class="tla-content">
        <div id="tla-metrics">
          <div class="tla-metric">
            <span>📊 Loading game data...</span>
          </div>
        </div>
        <button class="tla-chat-btn" onclick="window.toggleTLAChat()">
          💬 Ask AI Strategy Advisor
        </button>
        <div id="tla-chat-container">
          <div class="tla-chat-messages" id="tla-chat-messages"></div>
          <input type="text" class="tla-chat-input" id="tla-chat-input" 
                 placeholder="Ask about strategy..." 
                 onkeypress="if(event.key==='Enter') window.sendTLAMessage()">
        </div>
      </div>
    `;
    
    document.body.appendChild(hud);
    
    // Make draggable
    makeDraggable(hud);
    
    // Update metrics
    updateHUDMetrics();
  }

  // Update HUD metrics display
  async function updateHUDMetrics() {
    if (!CONFIG.accountId) return;
    
    try {
      const response = await fetch(`${CONFIG.backendUrl}/api/game-state/${CONFIG.accountId}`);
      if (response.ok) {
        const data = await response.json();
        const metricsDiv = document.querySelector('#tla-metrics');
        if (metricsDiv && data.metrics) {
          metricsDiv.innerHTML = `
            <div class="tla-metric">
              <span>⏱️ Days to Settle:</span>
              <strong>${data.metrics.daysToSettle}</strong>
            </div>
            <div class="tla-metric">
              <span>🎯 Limiting Factor:</span>
              <strong>${data.metrics.limitingFactor}</strong>
            </div>
            <div class="tla-metric">
              <span>🏛️ CP per Day:</span>
              <strong>${data.metrics.cpPerDay}</strong>
            </div>
            <div class="tla-metric">
              <span>⚖️ Resource Balance:</span>
              <strong>${data.metrics.resourceBalance}</strong>
            </div>
            <div class="tla-metric">
              <span>📅 Game Phase:</span>
              <strong>${data.settlement?.phase || 'Unknown'}</strong>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('[TravianAssistant] Failed to fetch metrics:', error);
    }
  }

  // Make element draggable
  function makeDraggable(element) {
    const header = element.querySelector('.tla-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      element.style.left = (initialX + dx) + 'px';
      element.style.top = (initialY + dy) + 'px';
      element.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  // Toggle chat interface
  window.toggleTLAChat = function() {
    const chatContainer = document.querySelector('#tla-chat-container');
    if (chatContainer) {
      chatContainer.style.display = chatContainer.style.display === 'none' ? 'block' : 'none';
      if (chatContainer.style.display === 'block') {
        document.querySelector('#tla-chat-input').focus();
      }
    }
  };

  // Send message to AI
  window.sendTLAMessage = async function() {
    const input = document.querySelector('#tla-chat-input');
    const messagesDiv = document.querySelector('#tla-chat-messages');
    
    if (!input || !input.value.trim()) return;
    
    const userMessage = input.value;
    input.value = '';
    
    // Add user message to chat
    messagesDiv.innerHTML += `<div class="tla-message user">${userMessage}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Get current game state
    const gameState = scrapeGameState();
    
    try {
      const response = await fetch(`${CONFIG.backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: CONFIG.accountId,
          messages: [{ role: 'user', content: userMessage }],
          gameState: gameState
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.content?.[0]?.text || 'I need more information to help with that.';
        messagesDiv.innerHTML += `<div class="tla-message assistant">${aiResponse}</div>`;
      } else {
        messagesDiv.innerHTML += `<div class="tla-message assistant">⚠️ AI service unavailable. Check backend configuration.</div>`;
      }
    } catch (error) {
      console.error('[TravianAssistant] AI chat error:', error);
      messagesDiv.innerHTML += `<div class="tla-message assistant">❌ Connection error. Is the backend running?</div>`;
    }
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  // Initialize
  function initialize() {
    console.log('[TravianAssistant] Initializing HUD-Backend connector');
    
    // Get account ID
    getAccountId();
    
    // Create enhanced HUD
    createEnhancedHUD();
    
    // Initial sync
    syncWithBackend();
    
    // Set up periodic sync
    setInterval(() => {
      syncWithBackend();
      updateHUDMetrics();
    }, CONFIG.syncInterval);
    
    console.log('[TravianAssistant] Initialization complete');
  }

  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
