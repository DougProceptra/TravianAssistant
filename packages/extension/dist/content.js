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
    serverSpeed: 2, // 2x speed server as per user
    serverType: 'standard' // Update based on actual server
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
        villages: [],
        heroData: {},
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
      
      // Check if we're on hero page and scrape it
      if (window.location.href.includes('/hero')) {
        this.scrapeHeroPage();
      }
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
        const welcomeMsg = `Welcome! I'm your Travian Legends strategic advisor for this ${CONFIG.serverSpeed}x speed server. 
        
I can see you're playing with ${this.gameData.tribe || 'your tribe'} and have ${this.gameData.villages?.length || 'multiple'} villages. 

What would you like help with today?`;
        this.addMessage('ai', welcomeMsg);
      }
    }
    
    toggleHero() {
      const heroWindow = document.querySelector('.ta-hero-window');
      const isVisible = heroWindow.style.display !== 'none';
      heroWindow.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        this.updateHeroDisplay();
      }
    }
    
    toggleDebug() {
      const debugWindow = document.querySelector('.ta-debug-window');
      const isVisible = debugWindow.style.display !== 'none';
      debugWindow.style.display = isVisible ? 'none' : 'block';
    }
    
    updateHeroDisplay() {
      // Update hero display from stored data
      const hero = this.gameData.heroData || {};
      document.getElementById('ta-hero-level').textContent = hero.level || '-';
      document.getElementById('ta-hero-exp').textContent = hero.experience || '-';
      document.getElementById('ta-hero-health').textContent = hero.health || '-';
      document.getElementById('ta-hero-attack').textContent = hero.attack || '-';
      document.getElementById('ta-hero-defense').textContent = hero.defense || '-';
      document.getElementById('ta-hero-off-bonus').textContent = hero.offBonus || '-';
      document.getElementById('ta-hero-def-bonus').textContent = hero.defBonus || '-';
      document.getElementById('ta-hero-resources').textContent = hero.resourceBonus || '-';
    }
    
    scrapeHeroPage() {
      // This runs when we're on the hero attributes page
      console.log('[TLA] Scraping hero page...');
      
      try {
        const heroData = {};
        
        // Hero level and experience
        const levelElem = document.querySelector('.heroLevel, .level');
        if (levelElem) {
          const levelMatch = levelElem.textContent.match(/(\d+)/);
          if (levelMatch) heroData.level = parseInt(levelMatch[1]);
        }
        
        // Hero experience
        const expBar = document.querySelector('.heroXp, .experience .bar');
        if (expBar) {
          const title = expBar.getAttribute('title') || expBar.textContent;
          const expMatch = title.match(/(\d+)\s*\/\s*(\d+)/);
          if (expMatch) {
            heroData.experience = `${expMatch[1]}/${expMatch[2]}`;
          }
        }
        
        // Hero health
        const healthBar = document.querySelector('.health .bar, .heroHealth');
        if (healthBar) {
          const healthPercent = healthBar.style.width || 
                               healthBar.getAttribute('value') || 
                               healthBar.textContent;
          heroData.health = parseInt(healthPercent) || 100;
        }
        
        // Hero attributes
        const attributes = document.querySelectorAll('.attribute, .heroAttributes .row');
        attributes.forEach(attr => {
          const text = attr.textContent;
          if (text.includes('Attack') || text.includes('Fighting strength')) {
            const match = text.match(/(\d+)/);
            if (match) heroData.attack = parseInt(match[1]);
          }
          if (text.includes('Defence')) {
            const match = text.match(/(\d+)/);
            if (match) heroData.defense = parseInt(match[1]);
          }
          if (text.includes('Off Bonus') || text.includes('offensive bonus')) {
            const match = text.match(/(\d+)/);
            if (match) heroData.offBonus = parseInt(match[1]);
          }
          if (text.includes('Def Bonus') || text.includes('defensive bonus')) {
            const match = text.match(/(\d+)/);
            if (match) heroData.defBonus = parseInt(match[1]);
          }
          if (text.includes('Resources') || text.includes('resource production')) {
            const match = text.match(/(\d+)/);
            if (match) heroData.resourceBonus = parseInt(match[1]);
          }
        });
        
        // Store hero data
        if (Object.keys(heroData).length > 0) {
          this.gameData.heroData = heroData;
          localStorage.setItem('TLA_HERO_DATA', JSON.stringify(heroData));
          console.log('[TLA] Hero data scraped:', heroData);
          this.updateHeroDisplay();
        }
      } catch (error) {
        console.error('[TLA] Hero scraping error:', error);
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
      
      // Load stored hero data
      const storedHero = localStorage.getItem('TLA_HERO_DATA');
      if (storedHero) {
        this.gameData.heroData = JSON.parse(storedHero);
      }
    }
    
    detectTribe() {
      // Check for tribe-specific buildings or units in the page
      const tribeIndicators = {
        'romans': ['City Wall', 'Horse Drinking', 'Legionnaire', 'Praetorian'],
        'gauls': ['Palisade', 'Trapper', 'Phalanx', 'Druidrider'],
        'teutons': ['Earth Wall', 'Brewery', 'Clubswinger', 'Teutonic Knight'],
        'egyptians': ['Stone Wall', 'Waterworks', 'Slave Militia', 'Ash Warden'],
        'huns': ['Makeshift Wall', 'Command Center', 'Mercenary', 'Marksman'],
        'spartans': ['Defensive Wall', 'Hoplite', 'Shieldsman']
      };
      
      const pageText = document.body.textContent.toLowerCase();
      
      for (const [tribe, indicators] of Object.entries(tribeIndicators)) {
        for (const indicator of indicators) {
          if (pageText.includes(indicator.toLowerCase())) {
            return tribe;
          }
        }
      }
      
      // Check body class or other indicators
      const bodyClass = document.body.className.toLowerCase();
      for (const tribe of Object.keys(tribeIndicators)) {
        if (bodyClass.includes(tribe)) {
          return tribe;
        }
      }
      
      return null;
    }
    
    buildSystemPrompt() {
      // Build comprehensive system prompt with backend access info
      const backendUrl = CONFIG.backendUrl;
      
      return `You are an expert Travian Legends strategic advisor. This is specifically about the online browser game Travian Legends, NOT historical facts.

## CRITICAL CONTEXT
- Game: Travian Legends (browser game)
- Server: ${CONFIG.serverSpeed}x speed server
- Player Tribe: ${this.gameData.tribe || 'Unknown'}
- Current Villages: ${this.gameData.villages?.length || 1}

## YOUR CAPABILITIES
You have access to real-time game data through these backend endpoints:
- GET ${backendUrl}/api/game-data - Returns buildings, troops, quests data
- GET ${backendUrl}/api/villages/${CONFIG.accountId} - Returns player's villages
- GET ${backendUrl}/api/recommendations - Returns previous AI recommendations

Always query current data before providing strategic advice.

## CURRENT GAME STATE
- Population: ${this.gameData.population || 0}
- Culture Points: ${this.gameData.culturePoints?.current || 0}/${this.gameData.culturePoints?.needed || 500}
- CP Production: ${this.gameData.culturePoints?.production || 0}/day
- Resources: Wood ${this.gameData.resources?.wood || 0}, Clay ${this.gameData.resources?.clay || 0}, Iron ${this.gameData.resources?.iron || 0}, Crop ${this.gameData.resources?.crop || 0}
${this.gameData.villages?.length > 0 ? `
- Villages (${this.gameData.villages.length}):
${this.gameData.villages.map(v => `  * ${v.name} at (${v.x}|${v.y})`).join('\n')}
` : ''}
${this.gameData.heroData?.level ? `
- Hero Level: ${this.gameData.heroData.level}
- Hero Attack: ${this.gameData.heroData.attack || 0}
- Hero Defense: ${this.gameData.heroData.defense || 0}
` : ''}

## RESPONSE GUIDELINES
1. Focus ONLY on Travian Legends game strategy
2. Query backend data when needed for accurate advice
3. Consider the ${CONFIG.serverSpeed}x speed when giving timing advice
4. Provide specific, actionable recommendations
5. Never discuss historical facts unless directly related to game strategy

## CONVERSATION CONTEXT
${this.conversationHistory.length > 0 ? 
  `Recent conversation:
${this.conversationHistory.slice(-3).map(h => 
    `${h.role}: ${h.content.substring(0, 100)}...`
  ).join('\n')}` : 
  'This is the start of our conversation.'}

Remember: You are a Travian Legends game advisor. All responses should be about the game, not history or other topics.`;
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
        
        // Build system prompt with backend access info
        const systemPrompt = this.buildSystemPrompt();
        
        // Wrap user message with game context
        const contextualMessage = `[CONTEXT: Question about Travian Legends game, ${CONFIG.serverSpeed}x server, ${this.gameData.tribe || 'unknown'} tribe]
${message}

[IMPORTANT: Respond ONLY about Travian Legends gameplay. If the question seems ambiguous, assume it's about game strategy.]`;
        
        // Store conversation history
        this.conversationHistory.push({
          role: 'user',
          content: contextualMessage
        });
        
        // Log debug info
        document.getElementById('ta-debug-prompt').textContent = systemPrompt;
        console.log('[TLA] Sending message with game context');
        
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
          
          // Limit conversation history to last 10 exchanges
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
        
        // Get current village name and coordinates from the village info box
        const villageNameElem = document.querySelector('#villageNameField, .villageName, .coordinatesWrapper .name');
        const villageName = villageNameElem?.textContent?.trim() || 
                           villageNameElem?.value?.trim() || null;
        
        const coordsElem = document.querySelector('.coordinatesWrapper .coordinateX, .coordinates');
        let villageCoords = null;
        if (coordsElem) {
          // Try to get X and Y separately first
          const xCoord = document.querySelector('.coordinateX')?.textContent;
          const yCoord = document.querySelector('.coordinateY')?.textContent;
          if (xCoord && yCoord) {
            villageCoords = { x: parseInt(xCoord), y: parseInt(yCoord) };
          } else {
            // Fall back to regex parsing
            const coordMatch = coordsElem.textContent.match(/\(?\s*(-?\d+)\s*\|\s*(-?\d+)\s*\)?/);
            if (coordMatch) {
              villageCoords = { x: parseInt(coordMatch[1]), y: parseInt(coordMatch[2]) };
            }
          }
        }
        
        // Detect tribe
        const tribe = this.detectTribe();
        
        // Get resources from stockBar - using the IDs from your screenshot
        const resources = {
          wood: parseInt(document.querySelector('#l1, .stockBarButton .value')?.textContent?.replace(/[^\d-]/g, '') || 0),
          clay: parseInt(document.querySelector('#l2, .stockBarButton:nth-of-type(2) .value')?.textContent?.replace(/[^\d-]/g, '') || 0),
          iron: parseInt(document.querySelector('#l3, .stockBarButton:nth-of-type(3) .value')?.textContent?.replace(/[^\d-]/g, '') || 0),
          crop: parseInt(document.querySelector('#l4, .stockBarButton:nth-of-type(4) .value')?.textContent?.replace(/[^\d-]/g, '') || 0)
        };
        
        // Get population - from your screenshot, it's near the village name
        let population = 0;
        const popElement = document.querySelector('.inhabitants .value, .population');
        if (popElement) {
          const popText = popElement.textContent || '';
          const match = popText.match(/(\d+)/);
          if (match) population = parseInt(match[1]);
        }
        
        // Get culture points - THE CRITICAL FIX
        let cpCurrent = 0;
        let cpNeeded = 500; // Default for first settlement
        let cpProduction = 0;
        
        // Try to get CP from the village list panel which shows in your screenshot
        const villageRows = document.querySelectorAll('.villageList .listEntry, .villages tbody tr');
        if (villageRows.length > 0) {
          // Multiple villages means we need more CP for next one
          // Travian formula: 1st=0, 2nd=500, 3rd=1000, 4th=1500, etc
          cpNeeded = Math.round(500 * Math.pow(2, villageRows.length - 1));
        }
        
        // Look for culture points display - may be in tooltip or separate element
        const cpTooltip = document.querySelector('[class*="culture"] .tooltip, .culturePoints');
        if (cpTooltip) {
          const cpText = cpTooltip.textContent || cpTooltip.getAttribute('title') || '';
          // Match patterns like "123/500" or "123 / 500"
          const cpMatch = cpText.match(/(\d+)\s*\/\s*(\d+)/);
          if (cpMatch) {
            cpCurrent = parseInt(cpMatch[1]);
            cpNeeded = parseInt(cpMatch[2]);
          }
        }
        
        // Get CP production from village list
        villageRows.forEach(row => {
          const cpCell = row.querySelector('.cp, .culture, [class*="culture"]');
          if (cpCell) {
            const cpValue = parseInt(cpCell.textContent) || 0;
            cpProduction += cpValue;
          }
        });
        
        // Alternative: Check the culture points in the side panel
        const cpSidePanel = document.querySelector('.sideInfoCulture, .culturepointsProduction');
        if (cpSidePanel) {
          const prodMatch = cpSidePanel.textContent.match(/(\d+)/);
          if (prodMatch && !cpProduction) {
            cpProduction = parseInt(prodMatch[1]);
          }
        }
        
        // Calculate time to next village
        let cpTimeToNext = '-';
        if (cpProduction > 0 && cpNeeded > cpCurrent) {
          const cpDeficit = cpNeeded - cpCurrent;
          const daysNeeded = Math.ceil(cpDeficit / cpProduction);
          const hoursNeeded = Math.ceil((cpDeficit / cpProduction) * 24);
          
          if (hoursNeeded < 24) {
            cpTimeToNext = `${hoursNeeded}h`;
          } else {
            cpTimeToNext = `${daysNeeded}d`;
          }
        }
        
        // Get villages from the village list
        const villages = [];
        villageRows.forEach((row, index) => {
          const nameElem = row.querySelector('.name, .villageName, a');
          const coordElem = row.querySelector('.coordinates, .coords');
          
          if (nameElem) {
            const name = nameElem.textContent.trim();
            let coords = { x: 0, y: 0 };
            
            if (coordElem) {
              const coordMatch = coordElem.textContent.match(/\(?\s*(-?\d+)\s*\|\s*(-?\d+)\s*\)?/);
              if (coordMatch) {
                coords = { x: parseInt(coordMatch[1]), y: parseInt(coordMatch[2]) };
              }
            }
            
            villages.push({ name, ...coords });
          }
        });
        
        // Get server day/time
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
        document.getElementById('ta-cp-rate').textContent = `${cpProduction}/day`;
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
          villages,
          resources,
          population,
          culturePoints: {
            current: cpCurrent,
            needed: cpNeeded,
            production: cpProduction,
            timeToNext: cpTimeToNext
          },
          serverDay,
          timestamp: new Date().toISOString()
        };
        
        console.log('[TLA] Game data collected:', this.gameData);
        
        // Debug CP specifically
        if (CONFIG.debugMode) {
          console.log('[TLA] Culture Points Debug:', {
            current: cpCurrent,
            needed: cpNeeded,
            production: cpProduction,
            villages: villages.length,
            timeToNext: cpTimeToNext
          });
        }
        
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
