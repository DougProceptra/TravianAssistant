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
    syncInterval: 60000, // 60 seconds
    debugMode: true // Enable debug logging
  };
  
  function generateAccountId() {
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('TLA_ACCOUNT_ID', id);
    return id;
  }
  
  class TravianHUD {
    constructor() {
      this.syncStatus = 'connected';
      this.gameData = {};
      this.staticGameData = null;
      this.chatOpen = false;
      this.chatMessages = [];
      this.promptHistory = [];
      this.init();
    }
    
    async init() {
      this.createHUD();
      this.initDragAndDrop();
      // Load static game data FIRST before starting collection
      await this.loadStaticGameData();
      this.startDataCollection();
      this.loadPosition();
    }
    
    createHUD() {
      const hud = document.createElement('div');
      hud.id = 'travian-assistant-hud';
      hud.innerHTML = `
        <div class="ta-header">
          <span class="ta-title">TravianAssistant</span>
          <button class="ta-chat-btn" title="AI Chat">💬</button>
          <button class="ta-hero-btn" title="Hero Info">⚔️</button>
          <button class="ta-minimize">_</button>
          <button class="ta-close">×</button>
        </div>
        <div class="ta-content">
          <div class="ta-status">
            <span class="sync-indicator ${this.syncStatus}"></span>
          </div>
          <div class="ta-metrics">
            <div class="metric-row">
              <span class="metric-icon">👥</span>
              <span id="ta-pop">-</span>
              <span class="metric-icon">🌟</span>
              <span id="ta-cp">-/-</span>
            </div>
            <div class="metric-row">
              <span class="res-icon wood">🪵</span>
              <span id="ta-wood">-</span>
              <span class="res-icon clay">🧱</span>
              <span id="ta-clay">-</span>
            </div>
            <div class="metric-row">
              <span class="res-icon iron">⚙️</span>
              <span id="ta-iron">-</span>
              <span class="res-icon crop">🌾</span>
              <span id="ta-crop">-</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Day:</span>
              <span id="ta-server-day">-</span>
            </div>
          </div>
        </div>
        <div class="ta-hero-window" style="display: none;">
          <div class="ta-hero-header">
            <span>Hero Stats</span>
            <button class="ta-hero-close">×</button>
          </div>
          <div class="ta-hero-content">
            <div class="hero-stat">Level: <span id="ta-hero-level">-</span></div>
            <div class="hero-stat">Attack: <span id="ta-hero-attack">-</span></div>
            <div class="hero-stat">Defense: <span id="ta-hero-defense">-</span></div>
            <div class="hero-stat">Off Bonus: <span id="ta-hero-off-bonus">-</span>%</div>
            <div class="hero-stat">Def Bonus: <span id="ta-hero-def-bonus">-</span>%</div>
            <div class="hero-stat">Resources: <span id="ta-hero-resources">-</span>%</div>
          </div>
        </div>
        <div class="ta-chat-window" style="display: none;">
          <div class="ta-chat-header">
            <span>AI Advisor</span>
            <button class="ta-debug-btn" title="Debug">🐛</button>
            <button class="ta-chat-close">×</button>
          </div>
          <div class="ta-chat-messages"></div>
          <div class="ta-chat-input">
            <input type="text" placeholder="Ask for Travian advice..." />
            <button class="ta-chat-send">Send</button>
          </div>
          <div class="ta-chat-resize"></div>
        </div>
        <div class="ta-debug-window" style="display: none;">
          <div class="ta-debug-header">
            <span>Debug: Last Prompt</span>
            <button class="ta-debug-close">×</button>
          </div>
          <div class="ta-debug-content">
            <pre id="ta-debug-prompt"></pre>
          </div>
        </div>
      `;
      
      this.addStyles();
      document.body.appendChild(hud);
      
      // Event listeners
      document.querySelector('.ta-minimize').addEventListener('click', () => this.toggleMinimize());
      document.querySelector('.ta-close').addEventListener('click', () => this.close());
      document.querySelector('.ta-chat-btn').addEventListener('click', () => this.toggleChat());
      document.querySelector('.ta-hero-btn').addEventListener('click', () => this.toggleHero());
      document.querySelector('.ta-chat-close').addEventListener('click', () => this.toggleChat());
      document.querySelector('.ta-hero-close').addEventListener('click', () => this.toggleHero());
      document.querySelector('.ta-chat-send').addEventListener('click', () => this.sendMessage());
      document.querySelector('.ta-chat-input input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
      document.querySelector('.ta-debug-btn').addEventListener('click', () => this.toggleDebug());
      document.querySelector('.ta-debug-close').addEventListener('click', () => this.toggleDebug());
      
      this.initResize();
    }
    
    addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        #travian-assistant-hud {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 200px;
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
          padding: 8px 10px;
          cursor: move;
          background: rgba(0,0,0,0.2);
          border-radius: 12px 12px 0 0;
        }
        
        .ta-title {
          font-weight: bold;
          font-size: 12px;
        }
        
        .ta-header button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          padding: 0 4px;
          opacity: 0.8;
          margin-left: 2px;
        }
        
        .ta-header button:hover {
          opacity: 1;
        }
        
        .ta-chat-btn, .ta-hero-btn {
          font-size: 16px !important;
        }
        
        .ta-content {
          padding: 8px;
        }
        
        .ta-status {
          text-align: center;
          margin-bottom: 8px;
        }
        
        .sync-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
        }
        
        .sync-indicator.connected {
          background: #4CAF50;
          animation: pulse 2s infinite;
        }
        
        .sync-indicator.offline {
          background: #f44336;
        }
        
        .sync-indicator.error {
          background: #ff9800;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .ta-metrics {
          font-size: 11px;
        }
        
        .metric-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px 0;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          margin-bottom: 3px;
          padding: 2px 5px;
        }
        
        .metric-icon, .res-icon {
          font-size: 12px;
          margin-right: 3px;
        }
        
        .metric-label {
          font-weight: bold;
          margin-right: 5px;
        }
        
        .ta-hero-window {
          position: absolute;
          top: 100%;
          margin-top: 10px;
          right: 0;
          width: 180px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          color: #333;
        }
        
        .ta-hero-header {
          padding: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }
        
        .ta-hero-content {
          padding: 10px;
          font-size: 12px;
        }
        
        .hero-stat {
          margin-bottom: 5px;
          display: flex;
          justify-content: space-between;
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
          padding: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .ta-chat-close, .ta-hero-close, .ta-debug-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
        }
        
        .ta-debug-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          margin-right: 5px;
        }
        
        .ta-chat-messages {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          color: #333;
        }
        
        .chat-message {
          margin-bottom: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          max-width: 80%;
          white-space: pre-wrap;
          font-size: 14px;
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
          padding: 10px;
          border-top: 1px solid #e0e0e0;
        }
        
        .ta-chat-input input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 20px;
          outline: none;
          font-size: 13px;
        }
        
        .ta-chat-send {
          margin-left: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
        }
        
        .ta-chat-resize {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 15px;
          height: 15px;
          cursor: se-resize;
        }
        
        .ta-debug-window {
          position: absolute;
          top: 50px;
          left: -400px;
          width: 380px;
          max-height: 500px;
          background: #1e1e1e;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          color: #fff;
          overflow: hidden;
        }
        
        .ta-debug-header {
          padding: 10px;
          background: #2d2d2d;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .ta-debug-content {
          padding: 10px;
          overflow-y: auto;
          max-height: 450px;
        }
        
        .ta-debug-content pre {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
        }
        
        #travian-assistant-hud.minimized .ta-content,
        #travian-assistant-hud.minimized .ta-chat-window,
        #travian-assistant-hud.minimized .ta-hero-window {
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
        this.addMessage('ai', 'Welcome to Travian Legends! I have complete data on all troops, buildings, and game mechanics. Ask me about Egyptian strategies, build orders, or troop stats!');
      }
    }
    
    toggleHero() {
      const heroWindow = document.querySelector('.ta-hero-window');
      const isVisible = heroWindow.style.display !== 'none';
      heroWindow.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        this.updateHeroStats();
      }
    }
    
    toggleDebug() {
      const debugWindow = document.querySelector('.ta-debug-window');
      const isVisible = debugWindow.style.display !== 'none';
      debugWindow.style.display = isVisible ? 'none' : 'block';
    }
    
    updateHeroStats() {
      // Scrape hero stats from the game page
      const heroLevel = document.querySelector('.heroLevel')?.textContent || 
                       document.querySelector('[class*="hero"] .level')?.textContent || '0';
      const heroAttack = document.querySelector('.heroAttack')?.textContent || '0';
      const heroDefense = document.querySelector('.heroDefense')?.textContent || '0';
      
      document.getElementById('ta-hero-level').textContent = heroLevel;
      document.getElementById('ta-hero-attack').textContent = heroAttack;
      document.getElementById('ta-hero-defense').textContent = heroDefense;
      document.getElementById('ta-hero-off-bonus').textContent = '0';
      document.getElementById('ta-hero-def-bonus').textContent = '0';
      document.getElementById('ta-hero-resources').textContent = '0';
    }
    
    async loadStaticGameData() {
      try {
        console.log('[TLA] Loading game data from backend...');
        const response = await fetch(`${CONFIG.backendUrl}/api/game-data`);
        if (response.ok) {
          this.staticGameData = await response.json();
          console.log('[TLA] Loaded game data:', {
            buildings: this.staticGameData.buildings?.length || 0,
            troops: this.staticGameData.troops?.length || 0,
            quests: this.staticGameData.quests?.length || 0
          });
          
          // Log Egyptian troops specifically
          const egyptianTroops = this.staticGameData?.troops?.filter(t => t.tribe === 'egyptians');
          console.log('[TLA] Egyptian troops loaded:', egyptianTroops?.length || 0);
        } else {
          console.error('[TLA] Failed to load game data:', response.status);
        }
      } catch (error) {
        console.error('[TLA] Failed to load game data:', error);
      }
    }
    
    async sendMessage() {
      const input = document.querySelector('.ta-chat-input input');
      const message = input.value.trim();
      if (!message) return;
      
      this.addMessage('user', message);
      input.value = '';
      
      // Show loading
      const loadingMessage = this.addMessage('ai', '...');
      
      try {
        // Ensure game data is loaded
        if (!this.staticGameData || !this.staticGameData.troops) {
          console.log('[TLA] Game data not loaded, fetching...');
          await this.loadStaticGameData();
        }
        
        // Get Egyptian troops data
        const egyptianTroops = this.staticGameData?.troops?.filter(t => t.tribe === 'egyptians') || [];
        console.log('[TLA] Using Egyptian troops:', egyptianTroops.length);
        
        // Build comprehensive Egyptian troop list
        let troopsList = '';
        if (egyptianTroops.length > 0) {
          troopsList = egyptianTroops.map(t => 
            `- ${t.name}: Attack ${t.attack}, Def ${t.defenseInfantry}/${t.defenseCavalry}, Speed ${t.speed}, Cost: ${t.costs.wood}/${t.costs.clay}/${t.costs.iron}/${t.costs.crop}, Training: ${t.trainingTime}s`
          ).join('\n');
        } else {
          // Fallback if data didn't load
          troopsList = `- Slave Militia: Attack 10, Def 30/20, Speed 7, Cost: 45/60/30/15, Training: 780s
- Ash Warden: Attack 30, Def 55/40, Speed 6, Cost: 115/100/145/60, Training: 1560s
- Khopesh Warrior: Attack 65, Def 50/20, Speed 5, Cost: 170/180/220/80, Training: 1820s
- Sopdu Explorer: Attack 0, Def 20/10, Speed 16, Cost: 170/150/20/40, Training: 1140s
- Anhur Guard: Attack 50, Def 110/50, Speed 15, Cost: 360/330/280/120, Training: 2640s
- Resheph Chariot: Attack 110, Def 120/150, Speed 10, Cost: 450/560/610/180, Training: 3160s`;
        }
        
        // Build the CORRECT system prompt
        const systemPrompt = `You are an expert advisor for TRAVIAN LEGENDS Version 4 browser game.

IMPORTANT: This is TRAVIAN LEGENDS - NOT Age of Empires, NOT Civilization, NOT any other game!

CURRENT GAME STATE:
- Player Tribe: EGYPTIANS
- Server Day: ${this.gameData.serverDay || 1}
- Population: ${this.gameData.population || 7}
- Resources: Wood ${this.gameData.resources?.wood || 0}, Clay ${this.gameData.resources?.clay || 0}, Iron ${this.gameData.resources?.iron || 0}, Crop ${this.gameData.resources?.crop || 0}

EGYPTIAN TROOPS (Travian Legends):
${troopsList}

EGYPTIAN UNIQUE FEATURES:
- Waterworks: Special building, +5% oasis bonus per level (max level 20)
- Stone Wall: Highest durability defensive structure
- Cheap early game unit: Slave Militia (45/60/30/15 resources)
- Strong defensive unit: Ash Warden (55/40 defense)

STARTING TASKS FOR NEW EGYPTIAN PLAYER:
1. Complete tutorial quests for free resources
2. Build all resource fields to level 1
3. Build one resource type to level 2 (use quest rewards)
4. Build Main Building level 1
5. Build Warehouse level 1
6. Build Granary level 1
7. Focus one resource type to level 5 (usually crop or clay)
8. Build Rally Point
9. Build Barracks
10. Train 5-10 Slave Militia for early defense

Remember: Always answer specifically about TRAVIAN LEGENDS mechanics and strategies. Never reference other games.`;
        
        // Store and display debug info
        const debugInfo = `USER: ${message}\n\nSYSTEM PROMPT:\n${systemPrompt}`;
        document.getElementById('ta-debug-prompt').textContent = debugInfo;
        console.log('[TLA] Full prompt sent:', debugInfo);
        
        // Send request
        const request = {
          model: CONFIG.modelName,
          max_tokens: CONFIG.maxTokens,
          system: systemPrompt,
          messages: [
            { role: 'user', content: message }
          ]
        };
        
        const response = await fetch(CONFIG.proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[TLA] API Error:', response.status, errorText);
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove loading
        this.removeLoadingMessage(loadingMessage);
        
        if (data.content && data.content[0]) {
          this.addMessage('ai', data.content[0].text);
        } else {
          this.addMessage('ai', 'Sorry, I didn\'t get a proper response. Please try again.');
        }
      } catch (error) {
        console.error('[TLA] AI Error:', error);
        this.removeLoadingMessage(loadingMessage);
        this.addMessage('ai', `Error: ${error.message}`);
      }
    }
    
    removeLoadingMessage(loadingMessage) {
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
      setInterval(() => this.collectData(), CONFIG.syncInterval);
    }
    
    collectData() {
      try {
        // Debug: Log what we're looking for
        console.log('[TLA] Collecting data from page...');
        
        // Collect resources - these IDs are standard in Travian
        const resources = {
          wood: parseInt(document.querySelector('#l1')?.textContent?.replace(/[^\d-]/g, '') || 
                        document.querySelector('.lumber')?.textContent?.replace(/[^\d-]/g, '') || 0),
          clay: parseInt(document.querySelector('#l2')?.textContent?.replace(/[^\d-]/g, '') || 
                        document.querySelector('.clay')?.textContent?.replace(/[^\d-]/g, '') || 0),
          iron: parseInt(document.querySelector('#l3')?.textContent?.replace(/[^\d-]/g, '') || 
                        document.querySelector('.iron')?.textContent?.replace(/[^\d-]/g, '') || 0),
          crop: parseInt(document.querySelector('#l4')?.textContent?.replace(/[^\d-]/g, '') || 
                        document.querySelector('.crop')?.textContent?.replace(/[^\d-]/g, '') || 0)
        };
        
        console.log('[TLA] Resources found:', resources);
        
        // Update resource display
        document.getElementById('ta-wood').textContent = this.formatNumber(resources.wood);
        document.getElementById('ta-clay').textContent = this.formatNumber(resources.clay);
        document.getElementById('ta-iron').textContent = this.formatNumber(resources.iron);
        document.getElementById('ta-crop').textContent = this.formatNumber(resources.crop);
        
        // Get population - Try multiple selectors
        let population = 7; // Default for new village
        
        // Check various possible locations for population
        const popSelectors = [
          '.inhabitants',
          '.population',
          '[title*="Population"]',
          '.villageInfobox .value:first',
          '#villageList .inhabitants',
          '.sidebarBoxVillagelist .inhabitants'
        ];
        
        for (const selector of popSelectors) {
          const elem = document.querySelector(selector);
          if (elem) {
            const text = elem.textContent || elem.getAttribute('title') || '';
            const match = text.match(/(\d+)/);
            if (match) {
              population = parseInt(match[1]);
              console.log('[TLA] Population found with selector', selector, ':', population);
              break;
            }
          }
        }
        
        document.getElementById('ta-pop').textContent = population;
        
        // Get culture points
        let cpCurrent = 0;
        let cpNeeded = 500; // Default for first village
        
        const cpSelectors = [
          '.culturePoints',
          '[title*="Culture points"]',
          '.culture_points',
          '#culture_points'
        ];
        
        for (const selector of cpSelectors) {
          const elem = document.querySelector(selector);
          if (elem) {
            const text = elem.textContent || elem.getAttribute('title') || '';
            const match = text.match(/(\d+)\s*\/\s*(\d+)/);
            if (match) {
              cpCurrent = parseInt(match[1]);
              cpNeeded = parseInt(match[2]);
              console.log('[TLA] Culture points found:', cpCurrent, '/', cpNeeded);
              break;
            }
          }
        }
        
        document.getElementById('ta-cp').textContent = `${cpCurrent}/${cpNeeded}`;
        
        // Get server day
        let serverDay = 1;
        const serverTimeElem = document.querySelector('.serverTime');
        if (serverTimeElem) {
          const text = serverTimeElem.textContent || '';
          const dayMatch = text.match(/Day\s+(\d+)/i);
          if (dayMatch) {
            serverDay = parseInt(dayMatch[1]);
          }
        }
        
        document.getElementById('ta-server-day').textContent = serverDay;
        
        // Store game data
        this.gameData = {
          resources,
          population,
          culturePoints: { current: cpCurrent, needed: cpNeeded },
          serverDay,
          timestamp: new Date().toISOString()
        };
        
        console.log('[TLA] Game data collected:', this.gameData);
        
        this.updateSyncStatus('connected');
        this.syncToBackend();
        
      } catch (error) {
        console.error('[TLA] Data collection error:', error);
        this.updateSyncStatus('error');
      }
    }
    
    formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
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
          this.updateSyncStatus('connected');
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
