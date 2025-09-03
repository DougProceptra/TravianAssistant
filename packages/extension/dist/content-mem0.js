// TravianAssistant with Mem0 Integration
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
  
  // Main HUD class with mem0 integration
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
    
    // Updated sendMessage with full game context
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
    
    // New method to fetch game mechanics from backend
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
    
    // Updated syncToBackend to use userId
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
    
    // ... rest of the existing methods stay the same ...
  }
  
  // Note: This is a partial file showing the key changes.
  // The full file would include all existing methods from content.js
  // with only the specific changes shown above.
  
})();