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
      this.syncStatus = 'connected';
      this.gameData = {};
      this.staticGameData = null;
      this.chatOpen = false;
      this.chatMessages = [];
      this.init();
    }
    
    async init() {
      this.createHUD();
      this.initDragAndDrop();
      this.startDataCollection();
      this.loadPosition();
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
        
        .ta-chat-btn {
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
        
        .ta-chat-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
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
        this.addMessage('ai', 'Hello! I\'m your Travian Legends AI advisor. I have complete data on all troops, buildings, and game mechanics. I can also search for strategies and tips. Ask me anything!');
      }
    }
    
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
    
    async sendMessage() {
      const input = document.querySelector('.ta-chat-input input');
      const message = input.value.trim();
      if (!message) return;
      
      this.addMessage('user', message);
      input.value = '';
      
      // Show loading
      const loadingMessage = this.addMessage('ai', '...');
      
      try {
        // Load game data if needed
        if (!this.staticGameData) {
          await this.loadStaticGameData();
        }
        
        const messageLower = message.toLowerCase();
        
        // Build comprehensive game data context
        let gameDataContext = '';
        
        // Include ALL Egyptian troops if asking about Egyptian
        if (messageLower.includes('egyptian')) {
          const egyptianTroops = this.staticGameData?.troops?.filter(t => t.tribe === 'egyptians') || [];
          if (egyptianTroops.length > 0) {
            gameDataContext += '\n\nEGYPTIAN TROOPS (from game database):\n';
            egyptianTroops.forEach(t => {
              gameDataContext += `- ${t.name}: Attack ${t.attack}, Def Infantry ${t.defenseInfantry}, Def Cavalry ${t.defenseCavalry}, Speed ${t.speed}, Capacity ${t.capacity}, Consumption ${t.consumption}, Cost: ${t.costs.wood}/${t.costs.clay}/${t.costs.iron}/${t.costs.crop}, Training time: ${t.trainingTime}s\n`;
            });
          }
        }
        
        // Include building data if asking about buildings
        if (messageLower.includes('build') || messageLower.includes('academy') || messageLower.includes('barrack') || messageLower.includes('stable')) {
          const relevantBuildings = this.staticGameData?.buildings || [];
          if (relevantBuildings.length > 0) {
            gameDataContext += '\n\nBUILDINGS (from game database):\n';
            relevantBuildings.forEach(b => {
              gameDataContext += `- ${b.name}: ${b.benefits.description}, Max Level: ${b.maxLevel}`;
              if (b.requirements && Object.keys(b.requirements).length > 0) {
                gameDataContext += `, Requirements: ${JSON.stringify(b.requirements)}`;
              }
              if (b.tribeSpecific) {
                gameDataContext += ` (${b.tribe} only)`;
              }
              gameDataContext += '\n';
            });
          }
        }
        
        // Include all troops for general troop questions
        if ((messageLower.includes('troop') || messageLower.includes('unit')) && !messageLower.includes('egyptian')) {
          const allTroops = this.staticGameData?.troops || [];
          const tribes = [...new Set(allTroops.map(t => t.tribe))];
          gameDataContext += '\n\nALL TROOPS BY TRIBE (from game database):\n';
          tribes.forEach(tribe => {
            const tribeTroops = allTroops.filter(t => t.tribe === tribe);
            gameDataContext += `\n${tribe.toUpperCase()}:\n`;
            tribeTroops.forEach(t => {
              gameDataContext += `- ${t.name}: Attack ${t.attack}, Def ${t.defenseInfantry}/${t.defenseCavalry}, Speed ${t.speed}\n`;
            });
          });
        }
        
        // Build the system prompt with balanced instructions
        const systemPrompt = `You are an expert Travian Legends Version 4 game advisor. You have access to accurate game data and can search for strategies.

IMPORTANT GUIDELINES:
1. For questions about specific troops, buildings, costs, or stats: Use ONLY the game database provided below
2. For strategies, tips, build orders, or meta advice: You MAY search the web but ONLY for "Travian Legends" or "Travian Version 4" content
3. When searching, always include "Travian Legends" or "Travian Version 4" in your search query
4. Never reference ancient history or real-world Egypt/Rome/etc - only game content
5. If the game database below contains the answer, use it instead of searching

Current Player Status:
- Population: ${this.gameData.population || 0}
- Resources: Wood ${this.formatNumber(this.gameData.resources?.wood || 0)}, Clay ${this.formatNumber(this.gameData.resources?.clay || 0)}, Iron ${this.formatNumber(this.gameData.resources?.iron || 0)}, Crop ${this.formatNumber(this.gameData.resources?.crop || 0)}
- Server Day: ${this.gameData.serverDay || 'Unknown'}

GAME DATABASE (use this for specific stats/costs):
${gameDataContext || 'No specific game data loaded for this query.'}

When answering about strategies or gameplay tips not covered in the database above, you may search for "Travian Legends" guides and strategies.`;
        
        // Send request with proper format
        const request = {
          model: CONFIG.modelName,
          max_tokens: CONFIG.maxTokens,
          system: systemPrompt,
          messages: [
            { role: 'user', content: message }
          ]
        };
        
        console.log('[TLA] Sending request with game data and search permissions');
        
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
        // Collect resources
        const resources = {
          wood: parseInt(document.querySelector('#l1')?.textContent?.replace(/[^\d-]/g, '') || 0),
          clay: parseInt(document.querySelector('#l2')?.textContent?.replace(/[^\d-]/g, '') || 0),
          iron: parseInt(document.querySelector('#l3')?.textContent?.replace(/[^\d-]/g, '') || 0),
          crop: parseInt(document.querySelector('#l4')?.textContent?.replace(/[^\d-]/g, '') || 0)
        };
        
        // Update resource display
        document.getElementById('ta-wood').textContent = this.formatNumber(resources.wood);
        document.getElementById('ta-clay').textContent = this.formatNumber(resources.clay);
        document.getElementById('ta-iron').textContent = this.formatNumber(resources.iron);
        document.getElementById('ta-crop').textContent = this.formatNumber(resources.crop);
        
        // Get population - Look for it in multiple places
        let population = 0;
        
        // Check the McInfo panel on right side (from your screenshot)
        const mcInfoPop = document.querySelector('.McInfo .inhabitants, #McInfo .inhabitants');
        if (mcInfoPop) {
          const popText = mcInfoPop.textContent || '';
          const match = popText.match(/(\d+)/);
          if (match) {
            population = parseInt(match[1]);
          }
        }
        
        // Check village list
        if (!population) {
          const villageListPop = document.querySelector('.villageList .inhabitants, .sidebarBoxVillagelist .inhabitants');
          if (villageListPop) {
            const popText = villageListPop.textContent || '';
            const match = popText.match(/(\d+)/);
            if (match) {
              population = parseInt(match[1]);
            }
          }
        }
        
        document.getElementById('ta-pop').textContent = population || '0';
        
        // Get culture points - usually in the village list or stats
        let cpCurrent = 0;
        let cpNeeded = 0;
        
        // Look for culture points in various places
        const cpSelectors = [
          '.culturePoints',
          '[class*="culture"]',
          '.villageList .culturePoints',
          '#culturePoints'
        ];
        
        for (const selector of cpSelectors) {
          const cpElement = document.querySelector(selector);
          if (cpElement) {
            const cpText = cpElement.textContent || '';
            const cpMatch = cpText.match(/(\d+)\s*\/\s*(\d+)/);
            if (cpMatch) {
              cpCurrent = parseInt(cpMatch[1]);
              cpNeeded = parseInt(cpMatch[2]);
              break;
            }
          }
        }
        
        document.getElementById('ta-cp').textContent = cpNeeded ? `${cpCurrent}/${cpNeeded}` : '-';
        
        // Get server day
        const serverDay = this.calculateServerDay();
        if (serverDay !== null) {
          document.getElementById('ta-server-day').textContent = serverDay;
        }
        
        // Store game data
        this.gameData = {
          resources,
          population,
          culturePoints: { current: cpCurrent, needed: cpNeeded },
          serverDay,
          timestamp: new Date().toISOString()
        };
        
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
    
    calculateServerDay() {
      const serverInfo = document.querySelector('.serverTime');
      if (serverInfo) {
        const match = serverInfo.textContent.match(/Day (\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
      return null;
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
