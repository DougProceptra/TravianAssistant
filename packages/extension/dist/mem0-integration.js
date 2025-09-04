// TravianAssistant mem0 Integration Module
// Version: 1.0.0
// Created: September 4, 2025
// Purpose: Add persistent memory capabilities to TravianAssistant

window.TLA_MEM0 = (function() {
  'use strict';
  
  // Email capture and userId generation functions
  async function getUserId() {
    let userId = localStorage.getItem('TLA_USER_ID');
    
    // Check for legacy accountId and migrate if found
    const legacyAccountId = localStorage.getItem('TLA_ACCOUNT_ID');
    if (!userId && legacyAccountId) {
      console.log('[TLA-mem0] Migrating from TLA_ACCOUNT_ID to TLA_USER_ID');
      userId = legacyAccountId;
      localStorage.setItem('TLA_USER_ID', userId);
      // Don't remove legacy ID yet in case other code depends on it
    }
    
    if (!userId) {
      const email = await showEmailPrompt();
      if (email) {
        userId = await hashEmail(email);
        localStorage.setItem('TLA_USER_ID', userId);
        localStorage.setItem('TLA_USER_EMAIL_MASKED', email.split('@')[0] + '@***');
        localStorage.setItem('TLA_MEMORY_STATUS', 'personalized');
        console.log('[TLA-mem0] User registered with personalized memory:', userId);
      } else {
        userId = 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('TLA_USER_ID', userId);
        localStorage.setItem('TLA_MEMORY_STATUS', 'session');
        console.log('[TLA-mem0] User using session-only memory:', userId);
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
      // Check if we've already shown the prompt this session
      if (sessionStorage.getItem('TLA_EMAIL_PROMPT_SHOWN')) {
        console.log('[TLA-mem0] Email prompt already shown this session, skipping');
        resolve(null);
        return;
      }
      
      sessionStorage.setItem('TLA_EMAIL_PROMPT_SHOWN', 'true');
      
      const modal = document.createElement('div');
      modal.id = 'tla-email-modal-wrapper';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100000;
        animation: fadeIn 0.3s ease-out;
      `;
      
      modal.innerHTML = `
        <div style="
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
        "></div>
        <div style="
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          z-index: 100001;
          max-width: 400px;
          animation: slideDown 0.3s ease-out;
        ">
          <h3 style="margin-top: 0; color: #333; font-family: 'Segoe UI', sans-serif;">
            🧠 TravianAssistant AI Memory
          </h3>
          <p style="color: #666; font-family: 'Segoe UI', sans-serif; line-height: 1.5;">
            Enable AI memory to remember your preferences, strategies, and game patterns across sessions.
          </p>
          <input type="email" id="tla-email-input" placeholder="your.email@example.com" style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            margin: 10px 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', sans-serif;
          "/>
          <p style="font-size: 11px; color: #999; font-family: 'Segoe UI', sans-serif;">
            🔒 Your email is hashed locally for privacy. We never store or transmit your actual email address.
          </p>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="tla-email-skip" style="
              padding: 8px 16px;
              border: 1px solid #ddd;
              background: white;
              border-radius: 6px;
              cursor: pointer;
              font-family: 'Segoe UI', sans-serif;
            ">Skip (Session Memory)</button>
            <button id="tla-email-submit" style="
              padding: 8px 16px;
              background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-family: 'Segoe UI', sans-serif;
              font-weight: 600;
            ">Enable Full Memory</button>
          </div>
        </div>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideDown {
            from { 
              opacity: 0;
              transform: translate(-50%, -60%);
            }
            to { 
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        </style>
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
      
      // Focus the input field
      setTimeout(() => {
        document.getElementById('tla-email-input')?.focus();
      }, 100);
    });
  }

  // Memory status display component
  function createMemoryStatusBadge() {
    const status = localStorage.getItem('TLA_MEMORY_STATUS') || 'none';
    const maskedEmail = localStorage.getItem('TLA_USER_EMAIL_MASKED');
    
    let statusText = '';
    let statusColor = '';
    let statusIcon = '';
    
    if (status === 'personalized' && maskedEmail) {
      statusText = `Memory: ${maskedEmail}`;
      statusColor = '#4CAF50';
      statusIcon = '✅';
    } else if (status === 'session') {
      statusText = 'Memory: Session Only';
      statusColor = '#FFA726';
      statusIcon = '⚠️';
    } else {
      statusText = 'Memory: Not Configured';
      statusColor = '#EF5350';
      statusIcon = '❌';
    }
    
    const badge = document.createElement('div');
    badge.id = 'tla-memory-status';
    badge.style.cssText = `
      background: ${statusColor};
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    `;
    badge.innerHTML = `<span>${statusIcon}</span><span>${statusText}</span>`;
    
    return badge;
  }

  // Enhanced message sending with full context
  async function sendMessageWithContext(message, gameData, conversationHistory) {
    const userId = await getUserId();
    const conversationId = sessionStorage.getItem('TLA_CONVERSATION_ID') || 
                          'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    if (!sessionStorage.getItem('TLA_CONVERSATION_ID')) {
      sessionStorage.setItem('TLA_CONVERSATION_ID', conversationId);
    }
    
    // Build the full context for mem0
    const fullContext = {
      userId: userId,
      message: message,
      gameState: gameData,
      conversationId: conversationId,
      timestamp: new Date().toISOString()
    };
    
    console.log('[TLA-mem0] Sending message with context:', {
      userId: fullContext.userId,
      hasGameState: !!fullContext.gameState,
      conversationId: fullContext.conversationId
    });
    
    // Send to the proxy endpoint that handles mem0
    const response = await fetch('https://travian-proxy-simple.vercel.app/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullContext)
    });
    
    if (!response.ok) {
      throw new Error('API error: ' + response.status);
    }
    
    return await response.json();
  }

  // Public API
  return {
    getUserId,
    showEmailPrompt,
    createMemoryStatusBadge,
    sendMessageWithContext,
    
    // Initialize mem0 for an existing HUD instance
    async initialize() {
      console.log('[TLA-mem0] Initializing mem0 integration...');
      const userId = await getUserId();
      console.log('[TLA-mem0] Initialized with userId:', userId);
      return userId;
    },
    
    // Check if mem0 is properly configured
    isConfigured() {
      const userId = localStorage.getItem('TLA_USER_ID');
      const status = localStorage.getItem('TLA_MEMORY_STATUS');
      return !!userId && !!status;
    },
    
    // Get current memory status
    getStatus() {
      return {
        userId: localStorage.getItem('TLA_USER_ID'),
        status: localStorage.getItem('TLA_MEMORY_STATUS') || 'none',
        maskedEmail: localStorage.getItem('TLA_USER_EMAIL_MASKED')
      };
    }
  };
})();

console.log('[TLA-mem0] mem0 integration module loaded');
