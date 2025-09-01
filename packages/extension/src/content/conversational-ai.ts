// packages/extension/src/content/conversational-ai.ts
// Chat interface for natural conversation with AI
// v1.1.0 - Fixed position persistence and email initialization

import { safeScraper } from './safe-scraper';
import { overviewParser } from './overview-parser';
import { VERSION } from '../version';

export function initConversationalAI() {
  console.log(`[TLA Chat] Initializing conversational AI v${VERSION}...`);
  
  // Load saved position
  const savedPosition = localStorage.getItem('tla_chat_position');
  const position = savedPosition ? JSON.parse(savedPosition) : { bottom: 90, right: 20 };
  
  // Create chat button
  const chatButton = createChatButton();
  document.body.appendChild(chatButton);
  
  // Create chat interface (hidden initially)
  const chatInterface = createChatInterface(position);
  document.body.appendChild(chatInterface);
  
  // Make chat draggable and resizable
  makeResizable(chatInterface);
  makeDraggable(chatInterface);
  
  // Toggle chat on button click
  chatButton.addEventListener('click', () => {
    const isVisible = chatInterface.style.display === 'block';
    chatInterface.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      // Focus input when opening
      const input = chatInterface.querySelector('#tla-chat-input') as HTMLInputElement;
      input?.focus();
      
      // Check if user email is set
      checkUserInitialization();
    }
  });
  
  console.log(`[TLA Chat] Chat interface initialized v${VERSION}`);
}

function isEmail(text: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(text.trim());
}

function createChatButton(): HTMLElement {
  const button = document.createElement('div');
  button.id = 'tla-chat-button';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  `;
  
  // Style the button
  button.style.cssText = `
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
    z-index: 9999;
    transition: transform 0.2s, box-shadow 0.2s;
  `;
  
  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  });
  
  return button;
}

function createChatInterface(position: {bottom: number, right: number}): HTMLElement {
  const chat = document.createElement('div');
  chat.id = 'tla-chat-interface';
  chat.innerHTML = `
    <div class="tla-chat-header">
      <span class="tla-chat-title">TravianAssistant AI Chat</span>
      <span class="tla-chat-version">v${VERSION}</span>
      <button class="tla-chat-close">×</button>
    </div>
    <div class="tla-chat-messages" id="tla-chat-messages">
      <div class="tla-chat-welcome" id="tla-chat-welcome">
        Welcome! I'm your strategic advisor. Ask me anything about your Travian game.
        <br><br>
        <strong>First time?</strong> Type your email to get started.
      </div>
    </div>
    <div class="tla-chat-input-area">
      <input type="text" id="tla-chat-input" placeholder="Type your message or email..." />
      <button id="tla-chat-send">Send</button>
    </div>
    <div class="tla-chat-suggestions" id="tla-chat-suggestions" style="display: none;">
      <div class="tla-suggestion">What should I focus on right now?</div>
      <div class="tla-suggestion">Analyze my current position</div>
      <div class="tla-suggestion">How can I grow faster?</div>
      <div class="tla-suggestion">What are my defensive options?</div>
    </div>
  `;
  
  // Style the chat interface with saved position
  chat.style.cssText = `
    position: fixed;
    bottom: ${position.bottom}px;
    right: ${position.right}px;
    width: 380px;
    height: 500px;
    background: rgba(20, 20, 20, 0.95);
    border: 2px solid #8B4513;
    border-radius: 12px;
    display: none;
    flex-direction: column;
    z-index: 9998;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    resize: both;
    overflow: auto;
    min-width: 300px;
    min-height: 400px;
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .tla-chat-header {
      background: linear-gradient(135deg, #8B4513, #A0522D);
      padding: 12px;
      border-radius: 10px 10px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
      cursor: move;
    }
    
    .tla-chat-title {
      font-weight: bold;
      font-size: 16px;
    }
    
    .tla-chat-version {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .tla-chat-close {
      background: transparent;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .tla-chat-close:hover {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .tla-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      color: white;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .tla-chat-welcome {
      background: rgba(139, 69, 19, 0.2);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .tla-chat-message {
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .tla-chat-user {
      background: rgba(70, 130, 180, 0.2);
      text-align: right;
      margin-left: 40px;
    }
    
    .tla-chat-ai {
      background: rgba(139, 69, 19, 0.15);
      margin-right: 40px;
    }
    
    .tla-chat-input-area {
      display: flex;
      padding: 12px;
      border-top: 1px solid rgba(139, 69, 19, 0.3);
    }
    
    #tla-chat-input {
      flex: 1;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(139, 69, 19, 0.5);
      border-radius: 6px;
      color: white;
      font-size: 14px;
      margin-right: 8px;
    }
    
    #tla-chat-input:focus {
      outline: none;
      border-color: #8B4513;
      background: rgba(255, 255, 255, 0.15);
    }
    
    #tla-chat-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    
    #tla-chat-send {
      padding: 8px 16px;
      background: linear-gradient(135deg, #8B4513, #A0522D);
      border: none;
      border-radius: 6px;
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    #tla-chat-send:hover {
      transform: scale(1.05);
    }
    
    #tla-chat-send:active {
      transform: scale(0.95);
    }
    
    .tla-chat-suggestions {
      padding: 8px;
      border-top: 1px solid rgba(139, 69, 19, 0.3);
    }
    
    .tla-suggestion {
      padding: 6px 10px;
      margin: 4px 0;
      background: rgba(139, 69, 19, 0.1);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .tla-suggestion:hover {
      background: rgba(139, 69, 19, 0.3);
      color: white;
    }
    
    .tla-chat-loading {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      animation: pulse 1.4s infinite;
      margin: 0 2px;
    }
    
    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.6; transform: scale(1); }
      40% { opacity: 1; transform: scale(1.2); }
    }
  `;
  document.head.appendChild(style);
  
  // Add event handlers
  const closeBtn = chat.querySelector('.tla-chat-close');
  const input = chat.querySelector('#tla-chat-input') as HTMLInputElement;
  const sendBtn = chat.querySelector('#tla-chat-send');
  const suggestions = chat.querySelectorAll('.tla-suggestion');
  
  closeBtn?.addEventListener('click', () => {
    chat.style.display = 'none';
  });
  
  const sendMessage = async () => {
    const message = input.value.trim();
    if (!message) return;
    
    console.log('[TLA Chat] Sending message:', message);
    
    // Check if it's an email
    if (isEmail(message)) {
      await handleEmailInitialization(message);
      input.value = '';
      return;
    }
    
    // Display user message
    addMessage(message, 'user');
    input.value = '';
    
    // Show loading
    const loadingId = addMessage(
      '<span class="tla-chat-loading"></span><span class="tla-chat-loading"></span><span class="tla-chat-loading"></span>',
      'ai'
    );
    
    try {
      // Get current game state
      const gameState = await safeScraper.getGameState();
      console.log('[TLA Chat] Sending game state to AI:', gameState);
      
      // Send to AI
      const response = await chrome.runtime.sendMessage({
        type: 'CHAT_MESSAGE',
        message: message,
        gameState: gameState
      });
      
      console.log('[TLA Chat] Received response:', response);
      
      // Remove loading and show response
      removeMessage(loadingId);
      
      if (response.success) {
        addMessage(response.response, 'ai');
      } else {
        addMessage(`Error: ${response.error}`, 'ai');
      }
    } catch (error) {
      removeMessage(loadingId);
      addMessage('Failed to get response. Please try again.', 'ai');
      console.error('[TLA Chat] Error:', error);
    }
  };
  
  sendBtn?.addEventListener('click', sendMessage);
  
  input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Handle suggestion clicks
  suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
      input.value = suggestion.textContent || '';
      sendMessage();
    });
  });
  
  return chat;
}

function addMessage(content: string, type: 'user' | 'ai'): string {
  const messagesContainer = document.querySelector('#tla-chat-messages');
  if (!messagesContainer) return '';
  
  const messageDiv = document.createElement('div');
  const messageId = `msg-${Date.now()}`;
  messageDiv.id = messageId;
  messageDiv.className = `tla-chat-message tla-chat-${type}`;
  messageDiv.innerHTML = content;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageId;
}

function removeMessage(messageId: string) {
  const message = document.getElementById(messageId);
  message?.remove();
}

async function handleEmailInitialization(email: string) {
  addMessage(`Setting up with email: ${email}`, 'user');
  
  const loadingId = addMessage(
    'Initializing your profile<span class="tla-chat-loading"></span><span class="tla-chat-loading"></span><span class="tla-chat-loading"></span>',
    'ai'
  );
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SET_USER_EMAIL',
      email: email
    });
    
    removeMessage(loadingId);
    
    if (response.success) {
      // Update welcome message to show initialized
      const welcome = document.querySelector('#tla-chat-welcome');
      if (welcome) {
        welcome.innerHTML = `
          <strong>Profile Initialized!</strong><br>
          Email: ${email}<br><br>
          I'll learn your playing style over time to give you personalized advice.
          How can I help you dominate this server?
        `;
      }
      
      addMessage(
        `Great! I've initialized your profile. I'll learn your playing style over time to give you personalized advice. How can I help you dominate this server?`,
        'ai'
      );
      
      // Show suggestions
      const suggestions = document.querySelector('#tla-chat-suggestions') as HTMLElement;
      if (suggestions) {
        suggestions.style.display = 'block';
      }
      
      // Save initialized state
      localStorage.setItem('tla_user_email', email);
    } else {
      addMessage(`Failed to initialize: ${response.error}`, 'ai');
    }
  } catch (error) {
    removeMessage(loadingId);
    addMessage('Failed to initialize. Please try again.', 'ai');
    console.error('[TLA Chat] Initialization error:', error);
  }
}

async function checkUserInitialization() {
  try {
    // Check localStorage first
    const localEmail = localStorage.getItem('tla_user_email');
    if (localEmail) {
      // User already initialized, show in welcome
      const welcome = document.querySelector('#tla-chat-welcome');
      if (welcome) {
        welcome.innerHTML = `
          <strong>Welcome back!</strong><br>
          Profile: ${localEmail}<br><br>
          How can I help you with your Travian strategy today?
        `;
      }
      
      // Show suggestions
      const suggestions = document.querySelector('#tla-chat-suggestions') as HTMLElement;
      if (suggestions) {
        suggestions.style.display = 'block';
      }
      return;
    }
    
    // Also check chrome storage
    const stored = await chrome.storage.sync.get(['userEmail']);
    if (stored.userEmail) {
      // Save to localStorage for faster access
      localStorage.setItem('tla_user_email', stored.userEmail);
      
      // Update welcome
      const welcome = document.querySelector('#tla-chat-welcome');
      if (welcome) {
        welcome.innerHTML = `
          <strong>Welcome back!</strong><br>
          Profile: ${stored.userEmail}<br><br>
          How can I help you with your Travian strategy today?
        `;
      }
      
      // Show suggestions
      const suggestions = document.querySelector('#tla-chat-suggestions') as HTMLElement;
      if (suggestions) {
        suggestions.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('[TLA Chat] Failed to check initialization:', error);
  }
}

function makeDraggable(element: HTMLElement) {
  const header = element.querySelector('.tla-chat-header') as HTMLElement;
  if (!header) return;
  
  let isDragging = false;
  let startX: number;
  let startY: number;
  let startRight: number;
  let startBottom: number;
  
  header.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).classList.contains('tla-chat-close')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startRight = parseInt(element.style.right);
    startBottom = parseInt(element.style.bottom);
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
  
  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    
    const deltaX = startX - e.clientX;
    const deltaY = e.clientY - startY;
    
    const newRight = Math.max(0, startRight + deltaX);
    const newBottom = Math.max(0, startBottom + deltaY);
    
    element.style.right = newRight + 'px';
    element.style.bottom = newBottom + 'px';
    
    // Save position
    localStorage.setItem('tla_chat_position', JSON.stringify({
      bottom: newBottom,
      right: newRight
    }));
  }
  
  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}

function makeResizable(element: HTMLElement) {
  // Browser's native resize handles this with resize: both in CSS
  // Just save size on resize
  const resizeObserver = new ResizeObserver(() => {
    localStorage.setItem('tla_chat_size', JSON.stringify({
      width: element.offsetWidth,
      height: element.offsetHeight
    }));
  });
  
  resizeObserver.observe(element);
  
  // Load saved size
  const savedSize = localStorage.getItem('tla_chat_size');
  if (savedSize) {
    const size = JSON.parse(savedSize);
    element.style.width = size.width + 'px';
    element.style.height = size.height + 'px';
  }
}