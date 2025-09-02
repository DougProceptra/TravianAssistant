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
    syncInterval: 60000,
    debugMode: true,
    serverSpeed: 1, // 1x speed server
    serverType: 'reign_of_fire' // Special server type
  };
  
  function generateAccountId() {
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('TLA_ACCOUNT_ID', id);
    return id;
  }
  
  class TravianHUD {
    constructor() {
      this.syncStatus = 'connected';
      this.gameData = {
        serverName: null,
        playerName: null,
        tribe: null,
        villageName: null,
        villageCoords: null,
        resources: {},
        population: 0,
        culturePoints: {},
        serverDay: null,
        serverTime: null
      };
      this.staticGameData = null;
      this.chatOpen = false;
      this.chatMessages = [];
      this.conversationHistory = []; // Full conversation history for context
      this.promptHistory = [];
      this.init();
    }
    
    async init() {
      this.createHUD();
      this.initDragAndDrop();
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
            <span id="ta-server-info" style="font-size: 10px; opacity: 0.8;">-</span>
          </div>
          <div class="ta-metrics">
            <div class="metric-row">
              <span class="metric-icon">👥</span>
              <span id="ta-pop">-</span>
              <span class="metric-icon">🌟</span>
              <span id="ta-cp">-/-</span>
            </div>
            <div class="metric-row">
              <span class="metric-icon">📈</span>
              <span id="ta-cp-rate">-/day</span>
              <span class="metric-icon">⏱️</span>
              <span id="ta-cp-time">-</span>
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
              <span class="metric-label">Village:</span>
              <span id="ta-village-coords">-</span>
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
            <div class="hero-stat">Experience: <span id="ta-hero-exp">-</span></div>
            <div class="hero-stat">Health: <span id="ta-hero-health">-</span>%</div>
            <div class="hero-stat">Attack: <span id="ta-hero-attack">-</span></div>
            <div class="hero-stat">Defense: <span id="ta-hero-defense">-</span></div>
            <div class="hero-stat">Off Bonus: <span id="ta-hero-off-bonus">-</span>%</div>
            <div class="hero-stat">Def Bonus: <span id="ta-hero-def-bonus">-</span>%</div>
            <div class="hero-stat">Resources: <span id="ta-hero-resources">-</span>%</div>
          </div>
        </div>
        <div class="ta-chat-window" style="display: none;">
          <div class="ta-chat-header">
            <span>AI Strategic Advisor</span>
            <button class="ta-debug-btn" title="Debug">🐛</button>
            <button class="ta-chat-close">×</button>
          </div>
          <div class="ta-chat-messages"></div>
          <div class="ta-chat-input">
            <input type="text" placeholder="Ask for strategic advice..." />
            <button class="ta-chat-send">Send</button>
          </div>
          <div class="ta-chat-resize"></div>
        </div>
        <div class="ta-debug-window" style="display: none;">
          <div class="ta-debug-header">
            <span>Debug: System Prompt</span>
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
          width: 220px;
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
          padding: 2px 5px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          margin-bottom: 3px;
        }
        
        .metric-icon, .res-icon {
          font-size: 12px;
          margin-right: 3px;
        }
        
        .metric-label {
          font-weight: bold;
          margin-right: 5px;
          font-size: 10px;
        }
        
        .ta-hero-window {
          position: absolute;
          top: 100%;
          margin-top: 10px;
          right: 0;
          width: 200px;
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
      
      resizeHandle?.addEventListener('mousedown', (e) => {
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
        const welcomeMsg = `Welcome! I'm your Travian Legends strategic advisor for this ${CONFIG.serverSpeed}x speed ${CONFIG.serverType.replace('_', ' ')} server. My goal is to help you optimize for a fast settler rush and long-term success. What's your current priority?`;
        this.addMessage('ai', welcomeMsg);
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
      // Try to scrape hero data from hero page or hero icon
      const heroIcon = document.querySelector('.heroImage, .hero_image, [class*="hero"]');
      if (heroIcon) {
        const levelMatch = (heroIcon.title || heroIcon.textContent || '').match(/Level\s*(\d+)/i);
        if (levelMatch) {
          document.getElementById('ta-hero-level').textContent = levelMatch[1];
        }
        
        const healthBar = document.querySelector('.heroHealthBar, [class*="heroHealth"]');
        if (healthBar) {
          const healthPercent = healthBar.style.width || healthBar.getAttribute('value') || '100';
          document.getElementById('ta-hero-health').textContent = parseInt(healthPercent);
        }
      }
      
      if (window.location.href.includes('hero')) {
        const attackPower = document.querySelector('.attackPower, [class*="attack"] .value')?.textContent || '0';
        const defensePower = document.querySelector('.defensePower, [class*="defense"] .value')?.textContent || '0';
        
        document.getElementById('ta-hero-attack').textContent = attackPower;
        document.getElementById('ta-hero-defense').textContent = defensePower;
      }
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
        }
      } catch (error) {
        console.error('[TLA] Failed to load game data:', error);
      }
    }
    
    detectTribe() {
      const tribeIndicators = {
        'romans': ['City Wall', 'Horse Drinking', 'Legionnaire', 'Praetorian'],
        'gauls': ['Palisade', 'Trapper', 'Phalanx', 'Druidrider'],
        'teutons': ['Earth Wall', 'Brewery', 'Clubswinger', 'Teutonic Knight'],
        'egyptians': ['Stone Wall', 'Waterworks', 'Slave Militia', 'Ash Warden'],
        'huns': ['Makeshift Wall', 'Command Center', 'Mercenary', 'Marksman'],
        'spartans': ['Defensive Wall', 'Hoplite', 'Shieldsman']
      };
      
      for (const [tribe, indicators] of Object.entries(tribeIndicators)) {
        for (const indicator of indicators) {
          if (document.body.textContent.includes(indicator)) {
            return tribe;
          }
        }
      }
      
      const bodyClass = document.body.className.toLowerCase();
      for (const tribe of Object.keys(tribeIndicators)) {
        if (bodyClass.includes(tribe)) {
          return tribe;
        }
      }
      
      return null;
    }
    
    buildSystemPrompt() {
      // Get relevant troops for the player's tribe
      let troopsDatabase = '';
      if (this.gameData.tribe && this.staticGameData?.troops) {
        const tribeTroops = this.staticGameData.troops.filter(t => 
          t.tribe === this.gameData.tribe
        );
        if (tribeTroops.length > 0) {
          troopsDatabase = `
## TRIBE-SPECIFIC TROOPS (${this.gameData.tribe.toUpperCase()})
${tribeTroops.map(t => 
  `* ${t.name}: Attack ${t.attack}, Def ${t.defenseInfantry}/${t.defenseCavalry}, Speed ${t.speed}, Cost: ${t.costs.wood}/${t.costs.clay}/${t.costs.iron}/${t.costs.crop}, Training: ${t.trainingTime}s`
).join('\n')}`;
        }
      }
      
      // Build the comprehensive system prompt based on expert recommendations
      return `You are an expert AI assistant designed to act as a strategic advisor for the game Travian Legends. You are playing on a ${CONFIG.serverSpeed}x speed "${CONFIG.serverType.replace('_', ' ')}" special server.

## ROLE AND OBJECTIVE
* **Primary Role:** Expert Travian Legends advisor. Your goal is to help the player, ${this.gameData.playerName || '[unknown]'}, optimize their account for long-term success.
* **Immediate Objective (Early Game):** Your main priority is to guide the player to settle their next village as quickly as possible. This involves generating the required Culture Points (CP) and resources for 3 settlers efficiently and at the same time. Think outside of the box, considering unconventional build orders, hero management, and resource allocation.
* **Server Context:** This is a "${CONFIG.serverType.replace('_', ' ')}" server. Be aware of the unique mechanics, such as Victory Points, regional control, and the endgame that differs from a standard server.

## DATA PROVIDED
You will receive the player's account state as a structured data object. This data is updated every 60 seconds.

### SERVER_STATE:
* Server: ${this.gameData.serverName || 'unknown'}
* Player: ${this.gameData.playerName || 'unknown'}
* Tribe: ${this.gameData.tribe ? this.gameData.tribe.toUpperCase() : 'UNKNOWN'}
* Current Village: ${this.gameData.villageName || 'unknown'} ${this.gameData.villageCoords ? `at (${this.gameData.villageCoords.x}|${this.gameData.villageCoords.y})` : ''}
* Server Day: ${this.gameData.serverDay || 'unknown'}
* Population: ${this.gameData.population || 0}
* Culture Points: ${this.gameData.culturePoints?.current || 0}/${this.gameData.culturePoints?.needed || 500} (${this.gameData.culturePoints?.perDay || 0}/day, ${this.gameData.culturePoints?.timeToNext || 'unknown'} to next)
* Resources: Wood ${this.gameData.resources?.wood || 0}, Clay ${this.gameData.resources?.clay || 0}, Iron ${this.gameData.resources?.iron || 0}, Crop ${this.gameData.resources?.crop || 0}

${troopsDatabase}

### HERO_STATS:
* Level: ${document.getElementById('ta-hero-level')?.textContent || 'unknown'}
* Health: ${document.getElementById('ta-hero-health')?.textContent || 'unknown'}%
* Attack: ${document.getElementById('ta-hero-attack')?.textContent || 'unknown'}
* Defense: ${document.getElementById('ta-hero-defense')?.textContent || 'unknown'}

## CAPABILITIES & LIMITATIONS
* **Advisory Only:** You are a strategic advisor. You CANNOT take any action on the account (e.g., send troops, build, allocate hero points). All advice must be actionable for the player to execute.
* **Limited Information:** You CANNOT see:
    * Other players' villages, troops, or building queues
    * Real-time combat data or enemy warehouse contents
    * The game map (e.g., nearby villages, oasis bonuses)
    * The player's hero inventory or skill points
* **You MUST rely on web searches for external information and meta-strategies when needed**

## THINKING PROCESS
1. **Analyze Current State:** Review the provided SERVER_STATE and any GAME_MECHANICS_DATABASE
2. **Define Next Steps:** Based on the player's immediate objective (fast settler rush), identify the specific requirements (e.g., resources for Residence 10, Academy 10, 3 Settlers; required CP)
3. **Search & Strategize:** Use your search tool to find external information about optimal strategies. Look for guides on "fast settler rush," "${this.gameData.tribe || 'tribe'} strategy," "early game CP generation," and "${CONFIG.serverType.replace('_', ' ')}" specific tips. Synthesize this information with the data you have
4. **Formulate Advice:** Create a prioritized, actionable plan. Consider the most efficient build order and resource allocation. Think about unconventional approaches. For example, is it better to put hero points into resource production or fighting strength for raiding?
5. **Present Plan:** Structure your response clearly. Use a priority-ranked list, time-based suggestions, and a breakdown of resource requirements. Explicitly state the trade-offs of any non-obvious advice

## OUTPUT FORMAT
Provide your advice in a structured, easy-to-read format. Use headings, bullet points, and tables where appropriate. Be specific about timing and resource requirements.

## CONVERSATION CONTEXT
${this.conversationHistory.length > 0 ? 
  `Previous conversation summary: ${this.conversationHistory.slice(-3).map(h => 
    `${h.role}: ${h.content.substring(0, 100)}...`
  ).join('\n')}` : 
  'This is the start of our conversation.'}`;
    }
    
    async sendMessage() {
      const input = document.querySelector('.ta-chat-input input');
      const message = input.value.trim();
      if (!message) return;
      
      this.addMessage('user', message);
      input.value = '';
      
      const loadingMessage = this.addMessage('ai', '...');
      
      try {
        // Ensure we have game data
        if (!this.staticGameData) {
          await this.loadStaticGameData();
        }
        
        // Build the expert-recommended system prompt
        const systemPrompt = this.buildSystemPrompt();
        
        // Store conversation history
        this.conversationHistory.push({
          role: 'user',
          content: message
        });
        
        // Log debug info
        document.getElementById('ta-debug-prompt').textContent = systemPrompt;
        console.log('[TLA] Using expert-recommended prompt structure');
        
        // Send request with full conversation context
        const request = {
          model: CONFIG.modelName,
          max_tokens: CONFIG.maxTokens,
          system: systemPrompt,
          messages: this.conversationHistory
        };
        
        const response = await fetch(CONFIG.proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        this.removeLoadingMessage(loadingMessage);
        
        if (data.content && data.content[0]) {
          const aiResponse = data.content[0].text;
          this.addMessage('ai', aiResponse);
          
          // Store AI response in conversation history
          this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
          });
          
          // Limit conversation history to last 10 exchanges to manage token usage
          if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
          }
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
        // Get server and player info
        const serverName = document.querySelector('.serverName')?.textContent || 
                          window.location.hostname.split('.')[0] || null;
        
        const playerName = document.querySelector('.playerName')?.textContent ||
                          document.querySelector('[class*="player"] .name')?.textContent || null;
        
        // Get village name and coordinates
        const villageNameElem = document.querySelector('.villageName, .coordinatesWrapper .name');
        const villageName = villageNameElem?.textContent?.trim() || null;
        
        const coordsElem = document.querySelector('.coordinates, .coordinatesWrapper .coordinates');
        let villageCoords = null;
        if (coordsElem) {
          const coordMatch = coordsElem.textContent.match(/\(?\s*(-?\d+)\s*\|\s*(-?\d+)\s*\)?/);
          if (coordMatch) {
            villageCoords = { x: parseInt(coordMatch[1]), y: parseInt(coordMatch[2]) };
          }
        }
        
        // Detect tribe
        const tribe = this.detectTribe();
        
        // Get resources
        const resources = {
          wood: parseInt(document.querySelector('#l1')?.textContent?.replace(/[^\d-]/g, '') || 0),
          clay: parseInt(document.querySelector('#l2')?.textContent?.replace(/[^\d-]/g, '') || 0),
          iron: parseInt(document.querySelector('#l3')?.textContent?.replace(/[^\d-]/g, '') || 0),
          crop: parseInt(document.querySelector('#l4')?.textContent?.replace(/[^\d-]/g, '') || 0)
        };
        
        // Get population
        let population = 0;
        const popElement = document.querySelector('.inhabitants, .population, [title*="Population"]');
        if (popElement) {
          const match = (popElement.textContent || popElement.title || '').match(/(\d+)/);
          if (match) population = parseInt(match[1]);
        }
        
        // Get culture points
        let cpCurrent = 0;
        let cpNeeded = 500;
        let cpPerDay = 0;
        
        const cpElement = document.querySelector('.culturePoints, [title*="Culture"], .culture_points');
        if (cpElement) {
          const cpText = cpElement.textContent || cpElement.title || '';
          const cpMatch = cpText.match(/(\d+)\s*\/\s*(\d+)/);
          if (cpMatch) {
            cpCurrent = parseInt(cpMatch[1]);
            cpNeeded = parseInt(cpMatch[2]);
          }
          const cpRateMatch = cpText.match(/(\d+)\s*per\s*day/i);
          if (cpRateMatch) {
            cpPerDay = parseInt(cpRateMatch[1]);
          }
        }
        
        // Calculate time to next village
        let cpTimeToNext = '-';
        if (cpPerDay > 0 && cpNeeded > cpCurrent) {
          const daysNeeded = Math.ceil((cpNeeded - cpCurrent) / cpPerDay);
          const hoursNeeded = daysNeeded * 24;
          if (hoursNeeded < 24) {
            cpTimeToNext = `${hoursNeeded}h`;
          } else {
            cpTimeToNext = `${daysNeeded}d`;
          }
        }
        
        // Get server day
        let serverDay = null;
        const serverTimeElem = document.querySelector('.serverTime');
        if (serverTimeElem) {
          const dayMatch = serverTimeElem.textContent.match(/Day\s+(\d+)/i);
          if (dayMatch) {
            serverDay = parseInt(dayMatch[1]);
          }
        }
        
        // Update display
        document.getElementById('ta-wood').textContent = this.formatNumber(resources.wood);
        document.getElementById('ta-clay').textContent = this.formatNumber(resources.clay);
        document.getElementById('ta-iron').textContent = this.formatNumber(resources.iron);
        document.getElementById('ta-crop').textContent = this.formatNumber(resources.crop);
        document.getElementById('ta-pop').textContent = population;
        document.getElementById('ta-cp').textContent = `${cpCurrent}/${cpNeeded}`;
        document.getElementById('ta-cp-rate').textContent = `${cpPerDay}/day`;
        document.getElementById('ta-cp-time').textContent = cpTimeToNext;
        document.getElementById('ta-server-day').textContent = serverDay || '-';
        document.getElementById('ta-village-coords').textContent = 
          villageCoords ? `(${villageCoords.x}|${villageCoords.y})` : '-';
        document.getElementById('ta-server-info').textContent = 
          `${serverName || 'Server'} - ${tribe || 'Unknown'}`;
        
        // Store all game data
        this.gameData = {
          serverName,
          playerName,
          tribe,
          villageName,
          villageCoords,
          resources,
          population,
          culturePoints: {
            current: cpCurrent,
            needed: cpNeeded,
            perDay: cpPerDay,
            timeToNext: cpTimeToNext
          },
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
