// TravianAssistant HUD with Mem0 Integration and Full Game Context
(function() {
  'use strict';
  
  console.log('[TLA] TravianAssistant with Mem0 Active!');
  
  const CONFIG = {
    backendUrl: 'https://3a6514bb-7f32-479b-978e-cb64d6f1bf42-00-1j1tdn8b0kpfn.riker.replit.dev',
    proxyUrl: 'https://travian-proxy-simple.vercel.app/api/proxy',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 2000,
    userId: null,  // Will be set after email capture
    syncInterval: 60000,
    debugMode: true,
    serverSpeed: 2
  };
  
  // Email capture and hashing functions
  async function getUserId() {
    let userId = localStorage.getItem('TLA_USER_ID');
    
    if (!userId) {
      const email = await showEmailPrompt();
      if (email) {
        userId = await hashEmail(email);
        localStorage.setItem('TLA_USER_ID', userId);
        localStorage.setItem('TLA_USER_EMAIL_MASKED', email.split('@')[0] + '@***');
        console.log('[TLA] User registered:', userId);
      } else {
        userId = 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('TLA_USER_ID', userId);
        console.log('[TLA] Anonymous user:', userId);
      }
    }
    
    return userId;
  }
  
  async function hashEmail(email) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return 'user_' + hashHex.substring(0, 16);
  }
  
  function showEmailPrompt() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.id = 'tla-email-modal-wrapper';
      modal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 100000;
        "></div>
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          z-index: 100001;
          max-width: 400px;
        ">
          <h3 style="margin-top: 0; color: #333;">TravianAssistant Setup</h3>
          <p style="color: #666;">Enter your email for personalized AI memory across sessions:</p>
          <input type="email" id="tla-email-input" placeholder="your.email@example.com" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            margin: 10px 0;
            box-sizing: border-box;
          "/>
          <p style="font-size: 11px; color: #999;">
            Your email is hashed locally for privacy. We never store or see your actual email.
          </p>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="tla-email-skip" style="
              padding: 8px 16px;
              border: 1px solid #ddd;
              background: white;
              border-radius: 6px;
              cursor: pointer;
            ">Skip (No Memory)</button>
            <button id="tla-email-submit" style="
              padding: 8px 16px;
              background: #3498db;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
            ">Start</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      document.getElementById('tla-email-submit').addEventListener('click', () => {
        const email = document.getElementById('tla-email-input').value;
        if (email && email.includes('@')) {
          modal.remove();
          resolve(email);
        } else {
          alert('Please enter a valid email address');
        }
      });
      
      document.getElementById('tla-email-skip').addEventListener('click', () => {
        modal.remove();
        resolve(null);
      });
      
      document.getElementById('tla-email-input').focus();
    });
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
        production: {},
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
      this.conversationHistory = [];
      
      // Initialize user first, then continue
      this.initUser().then(() => this.init());
    }
    
    async initUser() {
      CONFIG.userId = await getUserId();
      console.log('[TLA] User initialized:', CONFIG.userId);
    }
    
    async init() {
      this.createHUD();
      this.initDragAndDrop();
      await this.loadStaticGameData();
      await this.loadStoredData();
      this.startDataCollection();
      this.loadPosition();
      
      // Set up URL change detection for single-page app navigation
      this.setupNavigationDetection();
      
      // Initial capture attempts
      this.captureCulturePoints();
      this.captureProduction();
      this.captureHeroData();
    }
    
    setupNavigationDetection() {
      // Listen for URL changes (for single-page apps)
      let lastUrl = location.href;
      new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
          lastUrl = url;
          console.log('[TLA] Navigation detected to:', url);
          
          // Wait a bit for page to load then try capturing
          setTimeout(() => {
            this.captureCulturePoints();
            this.captureHeroData();
            this.captureProduction();
          }, 1000);
        }
      }).observe(document, { subtree: true, childList: true });
      
      // Also listen for popstate events
      window.addEventListener('popstate', () => {
        console.log('[TLA] Popstate navigation to:', window.location.href);
        setTimeout(() => {
          this.captureCulturePoints();
          this.captureHeroData();
          this.captureProduction();
        }, 1000);
      });
    }
    
    createHUD() {
      const hud = document.createElement('div');
      hud.id = 'travian-assistant-hud';
      hud.innerHTML = `
        <div class="ta-header">
          <span class="ta-title">TravianAssistant</span>
          <div class="ta-buttons">
            <button class="ta-chat-btn" title="AI Chat">💬</button>
            <button class="ta-hero-btn" title="Hero Info">⚔️</button>
            <button class="ta-minimize">_</button>
            <button class="ta-close">×</button>
          </div>
        </div>
        <div class="ta-content">
          <div class="ta-status">
            <span class="sync-indicator ${this.syncStatus}"></span>
            <span id="ta-server-info">-</span>
          </div>
          
          <!-- Culture Points Section -->
          <div class="ta-section ta-culture">
            <div class="ta-row">
              <span class="ta-icon">🌟</span>
              <span id="ta-cp">-/-</span>
            </div>
            <div class="ta-row">
              <span class="ta-icon">📈</span>
              <span id="ta-cp-rate">-/day</span>
            </div>
            <div class="ta-row">
              <span class="ta-icon">⏱️</span>
              <span id="ta-cp-time">-</span>
            </div>
          </div>
          
          <!-- Resources Section -->
          <div class="ta-section ta-resources">
            <div class="ta-resource-row">
              <span class="res-icon wood">🪵</span>
              <span class="res-current" id="ta-wood">-</span>
              <span class="res-production" id="ta-wood-prod">-/h</span>
            </div>
            <div class="ta-resource-row">
              <span class="res-icon clay">🧱</span>
              <span class="res-current" id="ta-clay">-</span>
              <span class="res-production" id="ta-clay-prod">-/h</span>
            </div>
            <div class="ta-resource-row">
              <span class="res-icon iron">⚙️</span>
              <span class="res-current" id="ta-iron">-</span>
              <span class="res-production" id="ta-iron-prod">-/h</span>
            </div>
            <div class="ta-resource-row">
              <span class="res-icon crop">🌾</span>
              <span class="res-current" id="ta-crop">-</span>
              <span class="res-production" id="ta-crop-prod">-/h</span>
            </div>
          </div>
          
          <!-- Village Info Section -->
          <div class="ta-section ta-info">
            <div class="ta-row">
              <span class="ta-icon">👥</span>
              <span id="ta-pop">-</span>
            </div>
          </div>
        </div>
        
        <!-- Hero Window -->
        <div class="ta-hero-window" style="display: none;">
          <div class="ta-window-header">
            <span>Hero Stats</span>
            <button class="ta-hero-close">×</button>
          </div>
          <div class="ta-window-content">
            <div class="hero-stat">Level: <span id="ta-hero-level">-</span></div>
            <div class="hero-stat">Experience: <span id="ta-hero-exp">-</span></div>
            <div class="hero-stat">Health: <span id="ta-hero-health">-</span>%</div>
            <div class="hero-stat">Fighting Strength: <span id="ta-hero-fighting">-</span></div>
            <div class="hero-stat">Off Bonus: <span id="ta-hero-off-bonus">-</span>%</div>
            <div class="hero-stat">Def Bonus: <span id="ta-hero-def-bonus">-</span>%</div>
            <div class="hero-stat">Resources: <span id="ta-hero-resources">-</span></div>
          </div>
        </div>
        
        <!-- Chat Window -->
        <div class="ta-chat-window" style="display: none;">
          <div class="ta-chat-header">
            <span>AI Strategic Advisor</span>
            <button class="ta-chat-close">×</button>
          </div>
          <div class="ta-chat-messages"></div>
          <div class="ta-chat-input">
            <input type="text" placeholder="Ask for strategic advice..." />
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
      document.querySelector('.ta-hero-btn').addEventListener('click', () => this.toggleHero());
      document.querySelector('.ta-chat-close').addEventListener('click', () => this.toggleChat());
      document.querySelector('.ta-hero-close').addEventListener('click', () => this.toggleHero());
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
          width: 240px;
          background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          z-index: 10000;
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          color: white;
          font-size: 13px;
        }
        
        .ta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          cursor: move;
          background: rgba(0,0,0,0.3);
          border-radius: 12px 12px 0 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .ta-title {
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.5px;
        }
        
        .ta-buttons {
          display: flex;
          gap: 4px;
        }
        
        .ta-header button {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          cursor: pointer;
          font-size: 14px;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .ta-header button:hover {
          background: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        
        .ta-chat-btn, .ta-hero-btn {
          font-size: 16px !important;
        }
        
        .ta-content {
          padding: 12px;
        }
        
        .ta-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          font-size: 11px;
          opacity: 0.9;
        }
        
        .sync-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .sync-indicator.connected {
          background: #4CAF50;
          animation: pulse 2s infinite;
          box-shadow: 0 0 8px #4CAF50;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .ta-section {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 10px;
        }
        
        .ta-section:last-child {
          margin-bottom: 0;
        }
        
        .ta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }
        
        .ta-icon {
          font-size: 14px;
          width: 20px;
          text-align: center;
        }
        
        /* Resources Section Special Layout */
        .ta-resources {
          background: rgba(255,255,255,0.12);
        }
        
        .ta-resource-row {
          display: grid;
          grid-template-columns: 24px 1fr 1fr;
          align-items: center;
          gap: 8px;
          padding: 5px 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        .ta-resource-row:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .res-icon {
          font-size: 16px;
          text-align: center;
        }
        
        .res-current {
          font-weight: 600;
          font-size: 13px;
        }
        
        .res-production {
          font-size: 11px;
          opacity: 0.9;
          text-align: right;
        }
        
        /* Culture Points Section */
        .ta-culture {
          background: rgba(255,215,0,0.1);
          border: 1px solid rgba(255,215,0,0.2);
        }
        
        /* Info Section */
        .ta-info {
          background: rgba(255,255,255,0.08);
        }
        
        /* Windows */
        .ta-hero-window, .ta-chat-window {
          position: absolute;
          top: 100%;
          margin-top: 10px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          color: #333;
        }
        
        .ta-hero-window {
          right: 0;
          width: 220px;
        }
        
        .ta-chat-window {
          left: 0;
          width: 380px;
          height: 450px;
          display: flex;
          flex-direction: column;
          resize: both;
          overflow: auto;
          min-width: 320px;
          min-height: 300px;
          max-width: 600px;
          max-height: 600px;
        }
        
        .ta-window-header, .ta-chat-header {
          padding: 10px 12px;
          background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-weight: 600;
        }
        
        .ta-window-content {
          padding: 12px;
          font-size: 12px;
        }
        
        .hero-stat {
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
          padding: 4px;
          border-radius: 4px;
        }
        
        .hero-stat:hover {
          background: #f5f5f5;
        }
        
        .ta-chat-messages {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
        }
        
        .chat-message {
          margin-bottom: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          max-width: 80%;
          white-space: pre-wrap;
          font-size: 13px;
        }
        
        .user-message {
          background: #e3f2fd;
          margin-left: auto;
          text-align: right;
        }
        
        .ai-message {
          background: #f5f5f5;
          border-left: 3px solid #3498db;
        }
        
        .ta-chat-input {
          display: flex;
          padding: 10px;
          border-top: 1px solid #e0e0e0;
          gap: 8px;
        }
        
        .ta-chat-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          outline: none;
          font-size: 13px;
        }
        
        .ta-chat-input input:focus {
          border-color: #3498db;
        }
        
        .ta-chat-send {
          padding: 8px 16px;
          background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: transform 0.2s;
        }
        
        .ta-chat-send:hover {
          transform: scale(1.05);
        }
        
        .ta-chat-resize {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 20px;
          height: 20px;
          cursor: nwse-resize;
          opacity: 0.3;
        }
        
        #travian-assistant-hud.minimized .ta-content,
        #travian-assistant-hud.minimized .ta-chat-window,
        #travian-assistant-hud.minimized .ta-hero-window {
          display: none;
        }
        
        #travian-assistant-hud.minimized {
          width: auto;
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
        
        if (newWidth >= 320 && newWidth <= 600) {
          chatWindow.style.width = newWidth + 'px';
        }
        if (newHeight >= 300 && newHeight <= 600) {
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
        const welcomeMsg = 'Welcome! I am your Travian Legends strategic advisor for this ' + CONFIG.serverSpeed + 'x speed server.\n\nBased on your current data, you have ' + (this.gameData.culturePoints?.hoursRemaining || 'unknown') + ' hours until your next settlement.\n\nHow can I help optimize your gameplay today?';
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
    
    async loadStoredData() {
      const storedCP = localStorage.getItem('TLA_CP_DATA');
      if (storedCP) {
        this.gameData.culturePoints = JSON.parse(storedCP);
        console.log('[TLA] Loaded stored CP data:', this.gameData.culturePoints);
      }
      
      const storedProd = localStorage.getItem('TLA_PRODUCTION');
      if (storedProd) {
        this.gameData.production = JSON.parse(storedProd);
        console.log('[TLA] Loaded stored production:', this.gameData.production);
      }
      
      const storedHero = localStorage.getItem('TLA_HERO_DATA');
      if (storedHero) {
        this.gameData.heroData = JSON.parse(storedHero);
        console.log('[TLA] Loaded stored hero data:', this.gameData.heroData);
        this.updateHeroDisplay(); // Update display with stored data
      }
    }
    
    captureCulturePoints() {
      // Debug: Log current URL and check for CP buildings
      const currentUrl = window.location.href;
      console.log('[TLA] Checking for CP data at:', currentUrl);
      
      // More flexible URL matching
      const isCPBuilding = currentUrl.includes('build.php') && (
        currentUrl.includes('gid=24') || // Town Hall
        currentUrl.includes('gid=25') || // Residence  
        currentUrl.includes('gid=26') || // Palace
        currentUrl.includes('gid=29')    // Treasury
      );
      
      if (isCPBuilding) {
        console.log('[TLA] On culture building - attempting CP capture...');
        
        // Try multiple selectors for different Travian versions
        const cpData = {};
        const bodyText = document.body.innerText;
        
        // Debug: Log first 500 chars to see what we're working with
        console.log('[TLA] Page text sample:', bodyText.substring(0, 500));
        
        // Try various text patterns
        const patterns = [
          /Culture points produced so far[\s\S]*?(\d{3,})/,
          /Current culture points[\s\S]*?(\d{3,})/,
          /Culture points[\s\S]*?(\d{3,})/,
          /CP[\s\S]*?(\d{3,})/
        ];
        
        for (const pattern of patterns) {
          const match = bodyText.match(pattern);
          if (match) {
            cpData.current = parseInt(match[1]);
            console.log('[TLA] Found current CP:', cpData.current);
            break;
          }
        }
        
        // Look for needed CP
        const neededPatterns = [
          /Next village controllable at[\s\S]*?(\d{3,})/,
          /Next village at[\s\S]*?(\d{3,})/,
          /Required[\s\S]*?(\d{3,})/
        ];
        
        for (const pattern of neededPatterns) {
          const match = bodyText.match(pattern);
          if (match) {
            cpData.needed = parseInt(match[1]);
            console.log('[TLA] Found needed CP:', cpData.needed);
            break;
          }
        }
        
        // Store if we found anything
        if (cpData.current || cpData.needed) {
          this.gameData.culturePoints = cpData;
          localStorage.setItem('TLA_CP_DATA', JSON.stringify({
            ...cpData,
            timestamp: new Date().toISOString()
          }));
          console.log('[TLA] Stored CP data:', cpData);
          this.updateDisplay();
        } else {
          console.log('[TLA] No CP data found on page');
        }
      } else {
        console.log('[TLA] Not on a CP building page');
      }
    }
    
    captureProduction() {
      if (window.location.href.includes('dorf1.php')) {
        console.log('[TLA] On overview page - capturing production...');
        const production = {};
        
        document.querySelectorAll('.villageInfobox.production .num').forEach((elem, idx) => {
          const value = parseInt(elem.textContent.replace(/[^\d]/g, ''));
          if (value) {
            if (idx === 0) production.wood = value;
            else if (idx === 1) production.clay = value;
            else if (idx === 2) production.iron = value;
            else if (idx === 3) production.crop = value;
          }
        });
        
        if (production.wood) {
          this.gameData.production = production;
          localStorage.setItem('TLA_PRODUCTION', JSON.stringify({
            ...production,
            timestamp: new Date().toISOString()
          }));
          console.log('[TLA] Captured production:', production);
        }
      }
    }
    
    captureHeroData() {
      const currentUrl = window.location.href;
      console.log('[TLA] Checking for hero data at:', currentUrl);
      
      // More flexible URL matching for hero pages
      const isHeroPage = currentUrl.includes('hero.php') || 
                        currentUrl.includes('/hero/') ||
                        currentUrl.includes('hero') && currentUrl.includes('attributes');
      
      if (isHeroPage) {
        console.log('[TLA] On hero page - attempting hero data capture...');
        
        // Add delay to let page fully load
        setTimeout(() => {
          const heroData = {};
          const bodyText = document.body.textContent;
          
          // Debug: Log a sample of page text
          console.log('[TLA] Hero page text sample:', bodyText.substring(0, 500));
          
          // Try multiple selectors and patterns
          // Look for level in various places
          const levelPatterns = [
            /Hero Level[\s:]*(\d+)/i,
            /Level[\s:]*(\d+)/i,
            /Lvl[\s:]*(\d+)/i,
            /Hero.*?(\d+)/i
          ];
          
          for (const pattern of levelPatterns) {
            const match = bodyText.match(pattern);
            if (match) {
              const level = parseInt(match[1]);
              if (level >= 0 && level <= 100) { // Sanity check
                heroData.level = level;
                console.log('[TLA] Found hero level:', heroData.level);
                break;
              }
            }
          }
          
          // Look for experience
          const expPatterns = [
            /Experience[\s:]*(\d{1,})/i,
            /Exp[\s:]*(\d{1,})/i,
            /XP[\s:]*(\d{1,})/i
          ];
          
          for (const pattern of expPatterns) {
            const match = bodyText.match(pattern);
            if (match) {
              heroData.experience = parseInt(match[1]);
              console.log('[TLA] Found experience:', heroData.experience);
              break;
            }
          }
          
          // Look for health
          const healthPatterns = [
            /Health[\s:]*(\d+)%/i,
            /HP[\s:]*(\d+)%/i,
            /(\d+)%.*?health/i
          ];
          
          for (const pattern of healthPatterns) {
            const match = bodyText.match(pattern);
            if (match) {
              heroData.health = parseInt(match[1]);
              console.log('[TLA] Found health:', heroData.health);
              break;
            }
          }
          
          // Store if we found anything
          if (Object.keys(heroData).length > 0) {
            const existingData = this.gameData.heroData || {};
            this.gameData.heroData = { ...existingData, ...heroData };
            
            localStorage.setItem('TLA_HERO_DATA', JSON.stringify({
              ...this.gameData.heroData,
              timestamp: new Date().toISOString()
            }));
            console.log('[TLA] Captured and stored hero data:', this.gameData.heroData);
            this.updateHeroDisplay();
          } else {
            console.log('[TLA] No hero data found on page');
          }
        }, 1500); // Wait 1.5 seconds for page to load
      } else {
        console.log('[TLA] Not on a hero page');
      }
    }
    
    updateHeroDisplay() {
      const hero = this.gameData.heroData || {};
      document.getElementById('ta-hero-level').textContent = hero.level || '-';
      document.getElementById('ta-hero-exp').textContent = hero.experience ? this.formatNumber(hero.experience) : '-';
      document.getElementById('ta-hero-health').textContent = hero.health !== undefined ? hero.health + '%' : '-';
      document.getElementById('ta-hero-fighting').textContent = hero.fightingStrength ? this.formatNumber(hero.fightingStrength) : '-';
      document.getElementById('ta-hero-off-bonus').textContent = hero.offBonus !== undefined ? hero.offBonus.toFixed(1) + '%' : '-';
      document.getElementById('ta-hero-def-bonus').textContent = hero.defBonus !== undefined ? hero.defBonus.toFixed(1) + '%' : '-';
      
      if (hero.resourceProduction) {
        const prod = hero.resourceProduction;
        const resourceText = this.formatNumber(prod.wood || 0) + '/' + 
                            this.formatNumber(prod.clay || 0) + '/' + 
                            this.formatNumber(prod.iron || 0) + '/' + 
                            this.formatNumber(prod.crop || 0) + ' /h';
        document.getElementById('ta-hero-resources').textContent = resourceText;
      } else {
        document.getElementById('ta-hero-resources').textContent = '-';
      }
    }
    
    detectTribe() {
      const tribeIndicators = {
        'romans': ['City Wall', 'Legionnaire'],
        'gauls': ['Palisade', 'Phalanx'],
        'teutons': ['Earth Wall', 'Clubswinger'],
        'egyptians': ['Stone Wall', 'Slave Militia'],
        'huns': ['Makeshift Wall', 'Mercenary'],
        'spartans': ['Defensive Wall', 'Hoplite']
      };
      
      const pageText = document.body.textContent.toLowerCase();
      for (const [tribe, indicators] of Object.entries(tribeIndicators)) {
        for (const indicator of indicators) {
          if (pageText.includes(indicator.toLowerCase())) {
            return tribe;
          }
        }
      }
      return null;
    }
    
    buildSystemPrompt() {
      const backendUrl = CONFIG.backendUrl;
      return 'You are an expert Travian Legends strategic advisor. This is the online game, NOT historical information.\n\n' +
             '## CONTEXT\n' +
             '- Server: ' + CONFIG.serverSpeed + 'x speed\n' +
             '- Tribe: ' + (this.gameData.tribe || 'Unknown') + '\n' +
             '- Villages: ' + (this.gameData.villages?.length || 1) + '\n' +
             '- Culture Points: ' + (this.gameData.culturePoints?.current || 0) + '/' + (this.gameData.culturePoints?.needed || 'unknown') + '\n' +
             '- Time to Settlement: ' + (this.gameData.culturePoints?.hoursRemaining || 'unknown') + ' hours\n' +
             '- Resources: Wood ' + (this.gameData.resources?.wood || 0) + ', Clay ' + (this.gameData.resources?.clay || 0) + ', Iron ' + (this.gameData.resources?.iron || 0) + ', Crop ' + (this.gameData.resources?.crop || 0) + '\n\n' +
             '## BACKEND ACCESS\n' +
             'You can query these endpoints:\n' +
             '- GET ' + backendUrl + '/api/game-data\n' +
             '- GET ' + backendUrl + '/api/villages/' + CONFIG.userId + '\n\n' +
             'Always provide strategic advice specific to Travian Legends gameplay.';
    }
    
    async sendMessage() {
      const input = document.querySelector('.ta-chat-input input');
      const message = input.value.trim();
      if (!message) return;
      
      this.addMessage('user', message);
      input.value = '';
      
      const loadingMessage = this.addMessage('ai', '...');
      
      try {
        // Fetch game mechanics if relevant keywords detected
        let gameMechanics = null;
        if (message.match(/build|upgrade|troop|hero|settle|culture|CP|resource/i)) {
          gameMechanics = await this.fetchGameMechanics(message);
        }
        
        // Build comprehensive context for mem0 and Claude
        const fullContext = {
          userId: CONFIG.userId,  // Critical for mem0 segregation
          message: message,
          gameState: {
            resources: this.gameData.resources,
            production: this.gameData.production,
            culturePoints: this.gameData.culturePoints,
            heroData: this.gameData.heroData,
            villages: this.gameData.villages,
            population: this.gameData.population,
            tribe: this.gameData.tribe || 'unknown',
            serverSpeed: CONFIG.serverSpeed,
            timestamp: new Date().toISOString()
          },
          gameMechanics: gameMechanics,
          conversationId: sessionStorage.getItem('TLA_CONVERSATION_ID') || this.generateConversationId()
        };
        
        console.log('[TLA] Sending to AI with full context:', fullContext);
        
        // Send to Vercel proxy (which will handle mem0)
        const response = await fetch(CONFIG.proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullContext)
        });
        
        if (!response.ok) throw new Error('API error: ' + response.status);
        
        const data = await response.json();
        this.removeLoadingMessage(loadingMessage);
        
        if (data.content && data.content[0]) {
          const aiResponse = data.content[0].text;
          this.addMessage('ai', aiResponse);
          
          this.conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: aiResponse }
          );
          
          if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
          }
        }
      } catch (error) {
        console.error('[TLA] AI Error:', error);
        this.removeLoadingMessage(loadingMessage);
        this.addMessage('ai', 'Error: ' + error.message);
      }
    }
    
    async fetchGameMechanics(query) {
      try {
        const response = await fetch(CONFIG.backendUrl + '/api/game-mechanics-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            tribe: this.gameData.tribe,
            villages: this.gameData.villages?.length || 1
          })
        });
        
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('[TLA] Failed to fetch game mechanics:', error);
      }
      return null;
    }
    
    generateConversationId() {
      const id = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('TLA_CONVERSATION_ID', id);
      return id;
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
      messageDiv.className = 'chat-message ' + (type === 'user' ? 'user-message' : 'ai-message');
      messageDiv.textContent = text;
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      return message;
    }
    
    async loadStaticGameData() {
      try {
        console.log('[TLA] Loading game data from backend...');
        const response = await fetch(CONFIG.backendUrl + '/api/game-data');
        if (response.ok) {
          this.staticGameData = await response.json();
        }
      } catch (error) {
        console.error('[TLA] Failed to load game data:', error);
      }
    }
    
    startDataCollection() {
      this.collectData();
      setInterval(() => this.collectData(), CONFIG.syncInterval);
    }
    
    collectData() {
      try {
        const serverName = window.location.hostname.split('.')[0] || null;
        const playerName = document.querySelector('.playerName')?.textContent || null;
        const villageNameElem = document.querySelector('#villageNameField');
        const villageName = villageNameElem?.value?.trim() || null;
        
        const coordX = document.querySelector('.coordinateX')?.textContent;
        const coordY = document.querySelector('.coordinateY')?.textContent;
        let villageCoords = null;
        if (coordX && coordY) {
          villageCoords = {
            x: parseInt(coordX.replace(/[^\d-]/g, '')),
            y: parseInt(coordY.replace(/[^\d-]/g, ''))
          };
        }
        
        const tribe = this.detectTribe();
        
        const resources = {
          wood: parseInt(document.querySelector('#l1')?.textContent?.replace(/[^\d]/g, '') || 0),
          clay: parseInt(document.querySelector('#l2')?.textContent?.replace(/[^\d]/g, '') || 0),
          iron: parseInt(document.querySelector('#l3')?.textContent?.replace(/[^\d]/g, '') || 0),
          crop: parseInt(document.querySelector('#l4')?.textContent?.replace(/[^\d]/g, '') || 0)
        };
        
        let population = 0;
        document.querySelectorAll('[class*="inhabitants"], [class*="population"]').forEach(elem => {
          const match = elem.textContent?.match(/(\d+)/);
          if (match) population = Math.max(population, parseInt(match[1]));
        });
        
        const villages = [];
        document.querySelectorAll('#sidebarBoxVillagelist .listEntry').forEach(entry => {
          const name = entry.querySelector('.name')?.textContent?.trim();
          const coordElem = entry.querySelector('.coordinatesGrid');
          if (name && coordElem) {
            const x = coordElem.querySelector('.coordinateX')?.textContent;
            const y = coordElem.querySelector('.coordinateY')?.textContent;
            if (x && y) {
              villages.push({
                name,
                x: parseInt(x.replace(/[^\d-]/g, '')),
                y: parseInt(y.replace(/[^\d-]/g, ''))
              });
            }
          }
        });
        
        this.gameData = {
          ...this.gameData,
          serverName,
          playerName,
          tribe,
          villageName,
          villageCoords,
          resources,
          population,
          villages: villages.length > 0 ? villages : this.gameData.villages,
          timestamp: new Date().toISOString()
        };
        
        this.updateDisplay();
        this.syncToBackend();
        
      } catch (error) {
        console.error('[TLA] Data collection error:', error);
      }
    }
    
    updateDisplay() {
      const serverInfo = (this.gameData.serverName || 'Server') + ' - ' + (this.gameData.tribe || 'Unknown');
      document.getElementById('ta-server-info').textContent = serverInfo;
      
      const cp = this.gameData.culturePoints || {};
      if (cp.current && cp.needed) {
        document.getElementById('ta-cp').textContent = this.formatNumber(cp.current) + '/' + this.formatNumber(cp.needed);
        document.getElementById('ta-cp-rate').textContent = this.formatNumber(cp.totalPerDay || 0) + '/day';
        document.getElementById('ta-cp-time').textContent = cp.hoursRemaining ? cp.hoursRemaining + 'h left' : '-';
      }
      
      const res = this.gameData.resources || {};
      const prod = this.gameData.production || {};
      
      document.getElementById('ta-wood').textContent = this.formatNumber(res.wood || 0);
      document.getElementById('ta-wood-prod').textContent = prod.wood ? '+' + this.formatNumber(prod.wood) + '/h' : '-';
      
      document.getElementById('ta-clay').textContent = this.formatNumber(res.clay || 0);
      document.getElementById('ta-clay-prod').textContent = prod.clay ? '+' + this.formatNumber(prod.clay) + '/h' : '-';
      
      document.getElementById('ta-iron').textContent = this.formatNumber(res.iron || 0);
      document.getElementById('ta-iron-prod').textContent = prod.iron ? '+' + this.formatNumber(prod.iron) + '/h' : '-';
      
      document.getElementById('ta-crop').textContent = this.formatNumber(res.crop || 0);
      document.getElementById('ta-crop-prod').textContent = prod.crop ? '+' + this.formatNumber(prod.crop) + '/h' : '-';
      
      document.getElementById('ta-pop').textContent = this.gameData.population || '-';
    }
    
    formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
    }
    
    async syncToBackend() {
      try {
        await fetch(CONFIG.backendUrl + '/api/village', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: CONFIG.userId,  // Changed from accountId
            village: this.gameData
          })
        });
        this.updateSyncStatus('connected');
      } catch (error) {
        console.error('[TLA] Sync error:', error);
        this.updateSyncStatus('offline');
      }
    }
    
    updateSyncStatus(status) {
      this.syncStatus = status;
      const indicator = document.querySelector('.sync-indicator');
      if (indicator) {
        indicator.className = 'sync-indicator ' + status;
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