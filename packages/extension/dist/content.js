// TravianAssistant Settlement Race HUD with AI Chat
(function() {
  'use strict';
  
  console.log('[TLA] Settlement Race with AI Chat Active!');
  
  const CONFIG = {
    backendUrl: 'https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev',
    proxyUrl: 'https://travian-proxy-simple.vercel.app/api/proxy',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 2000,
    accountId: localStorage.getItem('TLA_ACCOUNT_ID') || generateAccountId(),
    syncInterval: 60000 // 60 seconds
  };
  
  function generateAccountId() {
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('TLA_ACCOUNT_ID', id);
    return id;
  }
  
  class TravianHUD {
    constructor() {
      this.syncStatus = 'connecting';
      this.gameData = {};
      this.staticGameData = null; // Cache for troops/buildings data from backend
      this.chatOpen = false;
      this.chatMessages = [];
      this.init();
    }
    
    async init() {
      this.createHUD();
      this.initDragAndDrop();
      this.startDataCollection();
      this.loadPosition();
      // Load static game data from backend on initialization
      await this.loadStaticGameData();
    }
    
    createHUD() {
      const hud = document.createElement('div');
      hud.id = 'travian-assistant-hud';
      hud.innerHTML = `
        <div class="ta-header">
          <span class="ta-title">TravianAssistant</span>
          <button class="ta-chat-btn" title="AI Chat">💬</button>
          <button class="ta-minimize">_</button>
          <button class="ta-close">×</button>
        </div>
        <div class="ta-content">
          <div class="ta-status">
            <span class="sync-indicator ${this.syncStatus}">
              ${this.syncStatus === 'synced' ? '✅' : '❌'} ${this.syncStatus === 'synced' ? 'Synced' : 'Offline'}
            </span>
          </div>
          <div class="ta-metrics">
            <div class="metric">
              <label>Population:</label>
              <span id="ta-pop">-</span>
            </div>
            <div class="metric">
              <label>Wood:</label>
              <span id="ta-wood">-</span>
            </div>
            <div class="metric">
              <label>Clay:</label>
              <span id="ta-clay">-</span>
            </div>
            <div class="metric">
              <label>Iron:</label>
              <span id="ta-iron">-</span>
            </div>
            <div class="metric">
              <label>Crop:</label>
              <span id="ta-crop">-</span>
            </div>
            <div class="metric">
              <label>Server Day:</label>
              <span id="ta-server-day">-</span>
            </div>
          </div>
        </div>
        <div class="ta-chat-window" style="display: none;">
          <div class="ta-chat-header">
            <span>AI Advisor</span>
            <button class="ta-chat-close">×</button>
          </div>
          <div class="ta-chat-messages"></div>
          <div class="ta-chat-input">
            <input type="text" placeholder="Ask for Travian advice..." />
            <button class="ta-chat-send">Send</button>
          </div>
          <div class="ta-chat-resize"></div>
        </div>
      `;
      
      this.addStyles();
      document.body.appendChild(hud);
      
      // Event listeners
      document.querySelector('.ta-minimize').addEventListener('click', () => this.toggleMinimize());
      document.querySelector('.ta-close').addEventListener('click', () => this.close());
      document.querySelector('.ta-chat-btn').addEventListener('click', () => this.toggleChat());
      document.querySelector('.ta-chat-close').addEventListener('click', () => this.toggleChat());
      document.querySelector('.ta-chat-send').addEventListener('click', () => this.sendMessage());
      document.querySelector('.ta-chat-input input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
      
      // Resize functionality
      this.initResize();
    }
    
    addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        #travian-assistant-hud {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 300px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 10000;
          font-family: Arial, sans-serif;
          color: white;
        }
        
        .ta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          cursor: move;
          background: rgba(0,0,0,0.2);
          border-radius: 12px 12px 0 0;
        }
        
        .ta-title {
          font-weight: bold;
          font-size: 14px;
        }
        
        .ta-header button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
          padding: 0 6px;
          opacity: 0.8;
        }
        
        .ta-header button:hover {
          opacity: 1;
        }
        
        .ta-chat-btn {
          font-size: 18px !important;
        }
        
        .ta-content {
          padding: 15px;
        }
        
        .ta-status {
          margin-bottom: 15px;
          padding: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 6px;
        }
        
        .sync-indicator {
          font-size: 13px;
        }
        
        .ta-metrics {
          display: grid;
          gap: 8px;
        }
        
        .metric {
          display: flex;
          justify-content: space-between;
          padding: 5px 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          font-size: 13px;
        }
        
        .ta-chat-window {
          position: absolute;
          top: 100%;
          margin-top: 10px;
          left: 0;
          width: 350px;
          height: 400px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          resize: both;
          overflow: auto;
          min-width: 300px;
          min-height: 200px;
          max-width: 600px;
          max-height: 600px;
        }
        
        .ta-chat-header {
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .ta-chat-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
        }
        
        .ta-chat-messages {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          color: #333;
        }
        
        .chat-message {
          margin-bottom: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          max-width: 80%;
          white-space: pre-wrap;
        }
        
        .user-message {
          background: #f0f0f0;
          margin-left: auto;
          text-align: right;
        }
        
        .ai-message {
          background: #e8f4fd;
          border-left: 3px solid #667eea;
        }
        
        .ta-chat-input {
          display: flex;
          padding: 12px;
          border-top: 1px solid #e0e0e0;
        }
        
        .ta-chat-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          outline: none;
        }
        
        .ta-chat-send {
          margin-left: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
        }
        
        .ta-chat-resize {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 20px;
          height: 20px;
          cursor: se-resize;
        }
        
        #travian-assistant-hud.minimized .ta-content,
        #travian-assistant-hud.minimized .ta-chat-window {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }
    
    initDragAndDrop() {
      const header = document.querySelector('.ta-header');
      const hud = document.getElementById('travian-assistant-hud');
      let isDragging = false;
      let startX, startY, startLeft, startTop;
      
      header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = hud.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        e.preventDefault();
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        hud.style.left = (startLeft + dx) + 'px';
        hud.style.top = (startTop + dy) + 'px';
        hud.style.right = 'auto';
      });
      
      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          this.savePosition();
        }
      });
    }
    
    initResize() {
      const chatWindow = document.querySelector('.ta-chat-window');
      const resizeHandle = document.querySelector('.ta-chat-resize');
      let isResizing = false;
      
      resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        e.preventDefault();
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const rect = chatWindow.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const newHeight = e.clientY - rect.top;
        
        if (newWidth >= 300 && newWidth <= 600) {
          chatWindow.style.width = newWidth + 'px';
        }
        if (newHeight >= 200 && newHeight <= 600) {
          chatWindow.style.height = newHeight + 'px';
        }
      });
      
      document.addEventListener('mouseup', () => {
        isResizing = false;
      });
    }
    
    toggleChat() {
      const chatWindow = document.querySelector('.ta-chat-window');
      this.chatOpen = !this.chatOpen;
      chatWindow.style.display = this.chatOpen ? 'flex' : 'none';
      
      if (this.chatOpen && this.chatMessages.length === 0) {
        this.addMessage('ai', 'Hello! I\'m your Travian AI advisor. I have access to complete game data including all troops, buildings, and mechanics for all tribes. Ask me about strategies, build orders, or any game mechanics!');
      }
    }
    
    // Load static game data (troops, buildings, quests) from backend
    async loadStaticGameData() {
      try {
        const response = await fetch(`${CONFIG.backendUrl}/api/game-data`);
        if (response.ok) {
          this.staticGameData = await response.json();
          console.log('[TLA] Loaded game data:', {
            buildings: this.staticGameData.buildings?.length || 0,
            troops: this.staticGameData.troops?.length || 0,
            quests: this.staticGameData.quests?.length || 0
          });
        }
      } catch (error) {
        console.error('[TLA] Failed to load game data:', error);
      }
    }
    
    // Enhanced scraping functions
    scrapeBuildings() {
      const buildings = [];
      
      // Check if we're on village view (dorf2.php)
      if (window.location.href.includes('dorf2.php')) {
        document.querySelectorAll('.buildingSlot').forEach(slot => {
          const level = slot.querySelector('.level')?.textContent?.replace(/[^\d]/g, '');
          const name = slot.querySelector('.name')?.textContent;
          if (name && level) {
            buildings.push({ name, level: parseInt(level) });
          }
        });
      }
      
      // Check building queue
      const queue = [];
      document.querySelectorAll('.buildingList li').forEach(item => {
        const name = item.querySelector('.name')?.textContent;
        const timeLeft = item.querySelector('.timer')?.textContent;
        if (name) {
          queue.push({ name, timeLeft });
        }
      });
      
      return { buildings, queue };
    }
    
    scrapeTroops() {
      const troops = {};
      
      // Try to find troop counts in various places
      // Barracks/Stable training view
      document.querySelectorAll('.troop_details').forEach(detail => {
        const name = detail.querySelector('.desc')?.textContent;
        const count = detail.querySelector('.value')?.textContent;
        if (name && count) {
          troops[name] = parseInt(count) || 0;
        }
      });
      
      // Rally point overview
      document.querySelectorAll('.units tr').forEach(row => {
        const unitClass = row.className;
        const count = row.querySelector('td.num')?.textContent;
        if (unitClass && count) {
          troops[unitClass] = parseInt(count) || 0;
        }
      });
      
      return troops;
    }
    
    scrapeQuests() {
      const quests = [];
      
      // Quest list
      document.querySelectorAll('.quest').forEach(quest => {
        const title = quest.querySelector('.questTitle')?.textContent;
        const status = quest.querySelector('.questStatus')?.textContent;
        const reward = quest.querySelector('.reward')?.textContent;
        if (title) {
          quests.push({ title, status, reward });
        }
      });
      
      return quests;
    }
    
    calculateServerDay() {
      // Try to find server age from page
      const serverInfo = document.querySelector('.serverTime');
      if (serverInfo) {
        const match = serverInfo.textContent.match(/Day (\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
      
      // Fallback: calculate from stored start date if available
      const serverStart = localStorage.getItem('TLA_SERVER_START');
      if (serverStart) {
        const days = Math.floor((Date.now() - new Date(serverStart)) / (1000 * 60 * 60 * 24));
        return days;
      }
      
      return null;
    }
    
    determinePhase() {
      const serverDay = this.calculateServerDay();
      if (!serverDay) return 'unknown';
      
      if (serverDay < 10) return 'early_game';
      if (serverDay < 50) return 'mid_game';
      if (serverDay < 100) return 'late_game';
      return 'end_game';
    }
    
    detectTribe() {
      // Check for tribe-specific elements or classes
      const tribeClasses = ['romans', 'gauls', 'teutons', 'egyptians', 'huns', 'spartans'];
      for (const tribe of tribeClasses) {
        if (document.body.className.includes(tribe)) {
          return tribe;
        }
      }
      
      // Check for tribe-specific buildings
      if (document.querySelector('.waterworks')) return 'egyptians';
      if (document.querySelector('.brewery')) return 'teutons';
      if (document.querySelector('.trapper')) return 'gauls';
      if (document.querySelector('.horseDrinkingTrough')) return 'romans';
      
      return 'unknown';
    }
    
    async sendMessage() {
      const input = document.querySelector('.ta-chat-input input');
      const message = input.value.trim();
      if (!message) return;
      
      this.addMessage('user', message);
      input.value = '';
      
      // Show loading indicator
      const loadingMessage = this.addMessage('ai', '...');
      
      try {
        // First, fetch latest game data from backend if not loaded
        if (!this.staticGameData) {
          await this.loadStaticGameData();
        }
        
        // Create a simplified game context
        const gameContext = {
          currentResources: this.gameData.resources || {},
          population: this.gameData.population || 0,
          serverDay: this.gameData.serverDay || 'unknown',
          gamePhase: this.gameData.gamePhase || 'unknown',
          tribe: this.gameData.tribe || 'unknown',
          
          // Include summary info about available game data
          availableData: {
            buildingsCount: this.staticGameData?.buildings?.length || 0,
            troopsCount: this.staticGameData?.troops?.length || 0,
            questsCount: this.staticGameData?.quests?.length || 0,
            tribesAvailable: [...new Set(this.staticGameData?.troops?.map(t => t.tribe) || [])]
          }
        };
        
        // Find relevant troops/buildings based on the message
        let relevantTroops = [];
        let relevantBuildings = [];
        
        // Check if user is asking about specific tribe
        const tribeMentioned = message.toLowerCase().match(/(egyptian|roman|gaul|teuton|hun|spartan)/);
        if (tribeMentioned) {
          const tribe = tribeMentioned[1] + (tribeMentioned[1] === 'egyptian' ? 's' : 's');
          relevantTroops = this.staticGameData?.troops?.filter(t => t.tribe === tribe) || [];
        }
        
        // Check if asking about specific units
        const unitKeywords = ['slave', 'militia', 'ash', 'warden', 'khopesh', 'warrior', 'troop', 'unit', 'infantry', 'cavalry'];
        if (unitKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
          relevantTroops = this.staticGameData?.troops || [];
        }
        
        // Check if asking about buildings
        const buildingKeywords = ['building', 'barracks', 'stable', 'wall', 'warehouse', 'granary', 'waterworks'];
        if (buildingKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
          relevantBuildings = this.staticGameData?.buildings || [];
        }
        
        // Build context-aware system prompt
        const systemPrompt = `You are an expert Travian Legends advisor. 

Current Game State:
- Resources: Wood ${gameContext.currentResources.wood || 0}, Clay ${gameContext.currentResources.clay || 0}, Iron ${gameContext.currentResources.iron || 0}, Crop ${gameContext.currentResources.crop || 0}
- Population: ${gameContext.population}
- Server Day: ${gameContext.serverDay}
- Game Phase: ${gameContext.gamePhase}
- Player Tribe: ${gameContext.tribe}

Available Game Data:
- ${gameContext.availableData.buildingsCount} building types loaded
- ${gameContext.availableData.troopsCount} troop types for tribes: ${gameContext.availableData.tribesAvailable.join(', ')}

${relevantTroops.length > 0 ? `
Relevant Troop Data:
${relevantTroops.slice(0, 10).map(t => 
  `- ${t.name} (${t.tribe}): Attack ${t.attack}, Def Inf ${t.defenseInfantry}, Def Cav ${t.defenseCavalry}, Speed ${t.speed}, Cost: ${t.costs.wood}/${t.costs.clay}/${t.costs.iron}/${t.costs.crop}`
).join('\n')}` : ''}

${relevantBuildings.length > 0 ? `
Relevant Building Data:
${relevantBuildings.slice(0, 10).map(b => 
  `- ${b.name}: ${b.benefits.description}${b.tribeSpecific ? ` (${b.tribe} only)` : ''}`
).join('\n')}` : ''}

Provide specific, actionable advice based on the game data available. Use actual stats and numbers when discussing troops or buildings.`;
        
        // Prepare messages for AI with limited context
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ];
        
        const response = await fetch(CONFIG.proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages,
            model: CONFIG.modelName,
            max_tokens: CONFIG.maxTokens
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove loading message
        if (loadingMessage) {
          const messagesDiv = document.querySelector('.ta-chat-messages');
          const loadingElement = Array.from(messagesDiv.children).find(el => 
            el.textContent === '...' && el.classList.contains('ai-message')
          );
          if (loadingElement) {
            loadingElement.remove();
            this.chatMessages = this.chatMessages.filter(m => m !== loadingMessage);
          }
        }
        
        if (data.content && data.content[0]) {
          this.addMessage('ai', data.content[0].text);
        } else {
          this.addMessage('ai', 'Sorry, I didn\'t get a proper response. Please try again.');
        }
      } catch (error) {
        console.error('[TLA] AI Error:', error);
        
        // Remove loading message
        if (loadingMessage) {
          const messagesDiv = document.querySelector('.ta-chat-messages');
          const loadingElement = Array.from(messagesDiv.children).find(el => 
            el.textContent === '...' && el.classList.contains('ai-message')
          );
          if (loadingElement) {
            loadingElement.remove();
            this.chatMessages = this.chatMessages.filter(m => m !== loadingMessage);
          }
        }
        
        this.addMessage('ai', `Error: ${error.message}. Please try again with a simpler question.`);
      }
    }
    
    addMessage(type, text) {
      const message = { type, text };
      this.chatMessages.push(message);
      const messagesDiv = document.querySelector('.ta-chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `chat-message ${type === 'user' ? 'user-message' : 'ai-message'}`;
      messageDiv.textContent = text;
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      return message;
    }
    
    toggleMinimize() {
      const hud = document.getElementById('travian-assistant-hud');
      hud.classList.toggle('minimized');
    }
    
    close() {
      const hud = document.getElementById('travian-assistant-hud');
      hud.remove();
    }
    
    savePosition() {
      const hud = document.getElementById('travian-assistant-hud');
      const rect = hud.getBoundingClientRect();
      localStorage.setItem('TLA_HUD_POSITION', JSON.stringify({
        left: rect.left,
        top: rect.top
      }));
    }
    
    loadPosition() {
      const saved = localStorage.getItem('TLA_HUD_POSITION');
      if (saved) {
        const pos = JSON.parse(saved);
        const hud = document.getElementById('travian-assistant-hud');
        hud.style.left = pos.left + 'px';
        hud.style.top = pos.top + 'px';
        hud.style.right = 'auto';
      }
    }
    
    startDataCollection() {
      this.collectData();
      setInterval(() => this.collectData(), CONFIG.syncInterval); // Now 60 seconds
    }
    
    collectData() {
      try {
        // Collect current resources - Fixed selectors for Travian
        const resources = {
          wood: parseInt(document.querySelector('#l1, .lumber')?.textContent?.replace(/[^\d]/g, '') || 
                document.querySelector('[class*="lumber"] .value')?.textContent?.replace(/[^\d]/g, '') || 0),
          clay: parseInt(document.querySelector('#l2, .clay')?.textContent?.replace(/[^\d]/g, '') || 
                document.querySelector('[class*="clay"] .value')?.textContent?.replace(/[^\d]/g, '') || 0),
          iron: parseInt(document.querySelector('#l3, .iron')?.textContent?.replace(/[^\d]/g, '') || 
                document.querySelector('[class*="iron"] .value')?.textContent?.replace(/[^\d]/g, '') || 0),
          crop: parseInt(document.querySelector('#l4, .crop')?.textContent?.replace(/[^\d]/g, '') || 
                document.querySelector('[class*="crop"] .value')?.textContent?.replace(/[^\d]/g, '') || 0)
        };
        
        // Update HUD display
        document.getElementById('ta-wood').textContent = resources.wood.toLocaleString();
        document.getElementById('ta-clay').textContent = resources.clay.toLocaleString();
        document.getElementById('ta-iron').textContent = resources.iron.toLocaleString();
        document.getElementById('ta-crop').textContent = resources.crop.toLocaleString();
        
        // Get population - Fixed selector for actual game
        let population = 0;
        
        // Try multiple selectors for population
        const popSelectors = [
          '.inhabitants .value',
          '.population .value',
          '.inhabitants',
          '[class*="population"] .value',
          '.populationBadge .value'
        ];
        
        for (const selector of popSelectors) {
          const popElement = document.querySelector(selector);
          if (popElement) {
            const popText = popElement.textContent || popElement.innerText;
            const popMatch = popText.match(/(\d+)/);
            if (popMatch) {
              population = parseInt(popMatch[1]);
              break;
            }
          }
        }
        
        // Fallback: check the villages list on the right side
        if (population === 0) {
          const villageInfo = document.querySelector('.villageList .active .inhabitants, .sidebarBoxVillagelist .active .inhabitants');
          if (villageInfo) {
            const popMatch = villageInfo.textContent.match(/(\d+)/);
            if (popMatch) {
              population = parseInt(popMatch[1]);
            }
          }
        }
        
        document.getElementById('ta-pop').textContent = population || '-';
        
        // Get server day
        const serverDay = this.calculateServerDay();
        if (serverDay !== null) {
          document.getElementById('ta-server-day').textContent = serverDay;
        }
        
        // Enhanced game data with all scraped info
        this.gameData = {
          resources,
          population,
          serverDay,
          gamePhase: this.determinePhase(),
          tribe: this.detectTribe(),
          timestamp: new Date().toISOString()
        };
        
        // Update sync status
        this.updateSyncStatus('synced');
        
        // Send to backend
        this.syncToBackend();
        
      } catch (error) {
        console.error('[TLA] Data collection error:', error);
        this.updateSyncStatus('error');
      }
    }
    
    async syncToBackend() {
      try {
        const response = await fetch(`${CONFIG.backendUrl}/api/village`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: CONFIG.accountId,
            village: this.gameData
          })
        });
        
        if (response.ok) {
          this.updateSyncStatus('synced');
        }
      } catch (error) {
        console.error('[TLA] Sync error:', error);
        this.updateSyncStatus('offline');
      }
    }
    
    updateSyncStatus(status) {
      this.syncStatus = status;
      const indicator = document.querySelector('.sync-indicator');
      if (indicator) {
        indicator.className = `sync-indicator ${status}`;
        indicator.innerHTML = status === 'synced' 
          ? '✅ Synced'
          : status === 'offline' 
            ? '❌ Offline'
            : '⚠️ Error';
      }
    }
  }
  
  // Initialize when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TravianHUD());
  } else {
    new TravianHUD();
  }
})();
