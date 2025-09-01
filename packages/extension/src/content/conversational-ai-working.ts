// WORKING Chat UI - v1.3.3 with drag and resize
// This version has working drag and resize functionality

import { safeScraper } from './safe-scraper';
import { VERSION } from '../version';

export function initConversationalAI() {
  console.log(`[TLA Chat] Initializing chat UI v${VERSION}`);
  
  // Create and ADD the chat button to the page
  const chatButton = document.createElement('div');
  chatButton.id = 'tla-chat-button';
  chatButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #8B4513, #A0522D);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 99999;
  `;
  chatButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  `;
  
  // ACTUALLY ADD IT TO THE PAGE
  document.body.appendChild(chatButton);
  console.log('[TLA Chat] Chat button added to page');
  
  // Create the chat interface with resize and drag capability
  const chatInterface = document.createElement('div');
  chatInterface.id = 'tla-chat-interface';
  chatInterface.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 380px;
    height: 500px;
    min-width: 320px;
    min-height: 400px;
    background: rgba(20, 20, 20, 0.95);
    border: 2px solid #8B4513;
    border-radius: 12px;
    display: none;
    z-index: 99998;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    resize: both;
    overflow: auto;
  `;
  
  chatInterface.innerHTML = `
    <div class="tla-chat-header" style="background: linear-gradient(135deg, #8B4513, #A0522D); padding: 12px; border-radius: 10px 10px 0 0; color: white; cursor: move; user-select: none;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">TravianAssistant Chat v${VERSION}</span>
        <button id="tla-chat-close" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
      </div>
    </div>
    <div id="tla-chat-messages" style="flex: 1; overflow-y: auto; padding: 16px; color: white; height: calc(100% - 120px);">
      <div style="background: rgba(139, 69, 19, 0.2); padding: 12px; border-radius: 8px;">
        <div style="margin-bottom: 8px; color: #4CAF50;">✓ v${VERSION} Initialized</div>
        <div style="margin-bottom: 8px; color: #4CAF50;">✓ Multi-village data collection active</div>
        <div style="margin-bottom: 8px;">Welcome! I'm your strategic advisor with full account visibility.</div>
        <div style="font-size: 0.9em; opacity: 0.8;">Drag header to move • Resize from corners</div>
      </div>
    </div>
    <div style="display: flex; padding: 12px; border-top: 1px solid rgba(139, 69, 19, 0.3); position: absolute; bottom: 0; left: 0; right: 0; background: rgba(20, 20, 20, 0.95); border-radius: 0 0 10px 10px;">
      <input id="tla-chat-input" type="text" placeholder="Ask me anything..." style="
        flex: 1;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(139, 69, 19, 0.5);
        border-radius: 6px;
        color: white;
        margin-right: 8px;
      "/>
      <button id="tla-chat-send" style="
        padding: 8px 16px;
        background: linear-gradient(135deg, #8B4513, #A0522D);
        border: none;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        cursor: pointer;
      ">Send</button>
    </div>
  `;
  
  // ACTUALLY ADD THE CHAT INTERFACE TO THE PAGE
  document.body.appendChild(chatInterface);
  console.log('[TLA Chat] Chat interface added to page');
  
  // Make the chat draggable
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let chatStartX = 0;
  let chatStartY = 0;
  
  const header = chatInterface.querySelector('.tla-chat-header') as HTMLElement;
  if (header) {
    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking the close button
      if ((e.target as HTMLElement).id === 'tla-chat-close') return;
      
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = chatInterface.getBoundingClientRect();
      chatStartX = rect.left;
      chatStartY = rect.top;
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      chatInterface.style.left = (chatStartX + deltaX) + 'px';
      chatInterface.style.top = (chatStartY + deltaY) + 'px';
      chatInterface.style.right = 'auto';
      chatInterface.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  // Toggle chat visibility
  chatButton.addEventListener('click', () => {
    const isVisible = chatInterface.style.display === 'block';
    chatInterface.style.display = isVisible ? 'none' : 'block';
    console.log(`[TLA Chat] Chat toggled: ${!isVisible ? 'shown' : 'hidden'}`);
    
    if (!isVisible) {
      const input = document.getElementById('tla-chat-input') as HTMLInputElement;
      if (input) input.focus();
    }
  });
  
  // Close button
  const closeBtn = document.getElementById('tla-chat-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chatInterface.style.display = 'none';
    });
  }
  
  // Send message functionality
  const sendMessage = async () => {
    const input = document.getElementById('tla-chat-input') as HTMLInputElement;
    const messagesDiv = document.getElementById('tla-chat-messages');
    
    if (!input || !messagesDiv) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    messagesDiv.innerHTML += `
      <div style="background: rgba(70, 130, 180, 0.2); padding: 8px 12px; border-radius: 8px; margin: 8px 0; text-align: right;">
        ${message}
      </div>
    `;
    input.value = '';
    
    // Add loading indicator
    messagesDiv.innerHTML += `
      <div id="loading" style="background: rgba(139, 69, 19, 0.15); padding: 8px 12px; border-radius: 8px; margin: 8px 0;">
        Analyzing game state...
      </div>
    `;
    
    try {
      // Get game state - WITH ALL VILLAGES
      const gameState = await safeScraper.getGameState();
      console.log('[TLA Chat] Sending to AI with complete game state:', {
        totalVillages: gameState.villages.length,
        currentVillage: gameState.currentVillageId,
        totalResources: gameState.totals.resources,
        totalProduction: gameState.totals.production,
        alerts: gameState.alerts.length
      });
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'CHAT_MESSAGE',
        message: message,
        gameState: gameState  // Full multi-village state
      }, (response) => {
        // Remove loading
        const loading = document.getElementById('loading');
        if (loading) loading.remove();
        
        // Add AI response
        if (response && response.success) {
          messagesDiv.innerHTML += `
            <div style="background: rgba(139, 69, 19, 0.15); padding: 8px 12px; border-radius: 8px; margin: 8px 0;">
              ${response.response || 'I received your message but had trouble processing it.'}
            </div>
          `;
        } else {
          messagesDiv.innerHTML += `
            <div style="background: rgba(255, 0, 0, 0.1); padding: 8px 12px; border-radius: 8px; margin: 8px 0;">
              Error: ${response?.error || 'Failed to get response'}
            </div>
          `;
        }
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      });
    } catch (error) {
      console.error('[TLA Chat] Error:', error);
      const loading = document.getElementById('loading');
      if (loading) loading.remove();
      
      messagesDiv.innerHTML += `
        <div style="background: rgba(255, 0, 0, 0.1); padding: 8px 12px; border-radius: 8px; margin: 8px 0;">
          Error: Failed to connect to AI
        </div>
      `;
    }
  };
  
  // Send button click
  const sendBtn = document.getElementById('tla-chat-send');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
  
  // Enter key to send
  const input = document.getElementById('tla-chat-input') as HTMLInputElement;
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  
  console.log(`[TLA Chat] Chat UI v${VERSION} initialization complete with drag/resize`);
}