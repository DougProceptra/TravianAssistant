// Restored working drag/resize code from v0.9.5
import { VERSION } from '../version';

export function initConversationalAI() {
  console.log(`[TLA Chat] Initializing conversational AI v${VERSION}...`);
  
  // Create chat UI with working drag/resize
  const chatHTML = `
    <div id="tla-chat-interface" style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 500px;
      background: white;
      border: 2px solid #4a5568;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div class="tla-chat-header" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 6px 6px 0 0;
        cursor: move;
        user-select: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span style="font-weight: 600;">TravianAssistant AI Chat</span>
        <span style="font-size: 12px; opacity: 0.9;">v${VERSION}</span>
        <button class="tla-chat-close" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        ">×</button>
      </div>
      
      <div class="tla-chat-messages" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f7fafc;
      ">
        <div style="text-align: center; color: #718096; margin: 20px 0;">
          Welcome! I'm your strategic advisor. Ask me anything about your Travian game.
        </div>
      </div>
      
      <div class="tla-chat-input-container" style="
        padding: 12px;
        border-top: 1px solid #e2e8f0;
        background: white;
        border-radius: 0 0 6px 6px;
      ">
        <div style="display: flex; gap: 8px;">
          <input type="text" class="tla-chat-input" placeholder="Type your message or email..." style="
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            font-size: 14px;
          ">
          <button class="tla-chat-send" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
          ">Send</button>
        </div>
      </div>
      
      <div class="tla-resize-handle" style="
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 50%, #cbd5e0 50%);
      "></div>
    </div>
  `;
  
  // Remove existing if any
  const existing = document.getElementById('tla-chat-interface');
  if (existing) existing.remove();
  
  // Add to page
  document.body.insertAdjacentHTML('beforeend', chatHTML);
  
  // Get elements
  const chatInterface = document.getElementById('tla-chat-interface');
  const header = chatInterface.querySelector('.tla-chat-header');
  const closeBtn = chatInterface.querySelector('.tla-chat-close');
  const resizeHandle = chatInterface.querySelector('.tla-resize-handle');
  const input = chatInterface.querySelector('.tla-chat-input');
  const sendBtn = chatInterface.querySelector('.tla-chat-send');
  const messagesContainer = chatInterface.querySelector('.tla-chat-messages');
  
  // Dragging functionality
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  
  header.addEventListener('mousedown', (e) => {
    if (e.target === closeBtn) return;
    isDragging = true;
    dragOffset.x = e.clientX - chatInterface.offsetLeft;
    dragOffset.y = e.clientY - chatInterface.offsetTop;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    chatInterface.style.left = (e.clientX - dragOffset.x) + 'px';
    chatInterface.style.top = (e.clientY - dragOffset.y) + 'px';
    chatInterface.style.right = 'auto';
    chatInterface.style.bottom = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // Resizing functionality
  let isResizing = false;
  let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
  
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;
    resizeStart.width = chatInterface.offsetWidth;
    resizeStart.height = chatInterface.offsetHeight;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const width = resizeStart.width + (e.clientX - resizeStart.x);
    const height = resizeStart.height + (e.clientY - resizeStart.y);
    
    if (width > 300) chatInterface.style.width = width + 'px';
    if (height > 200) chatInterface.style.height = height + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
  
  // Close button
  closeBtn.addEventListener('click', () => {
    chatInterface.style.display = 'none';
  });
  
  // Send message function
  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    messagesContainer.insertAdjacentHTML('beforeend', `
      <div style="margin: 12px 0;">
        <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px;">You:</div>
        <div style="background: white; padding: 8px 12px; border-radius: 8px; color: #4a5568;">
          ${message}
        </div>
      </div>
    `);
    
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Get game state
    const gameState = await getGameState();
    
    // Send to AI with game context
    chrome.runtime.sendMessage({
      type: 'CHAT_MESSAGE',
      message: message,
      gameContext: gameState
    }, (response) => {
      if (response && response.reply) {
        messagesContainer.insertAdjacentHTML('beforeend', `
          <div style="margin: 12px 0;">
            <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px;">AI:</div>
            <div style="background: linear-gradient(135deg, #f6f8ff 0%, #f0f4ff 100%); padding: 8px 12px; border-radius: 8px; color: #4a5568;">
              ${response.reply}
            </div>
          </div>
        `);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }
  
  // Get game state for context
  async function getGameState() {
    try {
      // Try to get from safeScraper if available
      if (window.safeScraper && typeof window.safeScraper.getGameState === 'function') {
        return await window.safeScraper.getGameState();
      }
      
      // Fallback to basic scraping
      return {
        currentVillageId: new URLSearchParams(window.location.search).get('newdid'),
        resources: {
          wood: document.querySelector('#l1')?.textContent || '0',
          clay: document.querySelector('#l2')?.textContent || '0',
          iron: document.querySelector('#l3')?.textContent || '0',
          crop: document.querySelector('#l4')?.textContent || '0'
        },
        currentPage: window.location.pathname
      };
    } catch (error) {
      console.error('[TLA Chat] Error getting game state:', error);
      return null;
    }
  }
  
  // Event listeners
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  console.log(`[TLA Chat] Chat interface initialized v${VERSION}`);
}
