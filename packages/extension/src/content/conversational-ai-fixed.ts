// packages/extension/src/content/conversational-ai-fixed.ts
// Chat interface for natural conversation with AI
// v0.9.6 - Fixed dragging scope, text wrap, and resize handle visibility

import { safeScraper } from './safe-scraper';
import { overviewParser } from './overview-parser';
import { VERSION } from '../version';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  userEmail: string | null;
  isInitialized: boolean;
}

class ConversationalAI {
  private chatState: ChatState = {
    messages: [],
    userEmail: null,
    isInitialized: false
  };
  
  private chatInterface: HTMLElement | null = null;
  private autoSaveInterval: number | null = null;
  
  // FIX 1: Move drag state to class level for proper scope
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private chatStartX: number = 0;
  private chatStartY: number = 0;

  async init() {
    console.log(`[TLA Chat] Initializing conversational AI v${VERSION}...`);
    
    // Load persisted state
    await this.loadState();
    
    // Create chat button
    const chatButton = this.createChatButton();
    document.body.appendChild(chatButton);
    
    // Create chat interface (hidden initially)
    this.chatInterface = this.createChatInterface();
    document.body.appendChild(this.chatInterface);
    
    // FIX 1: Setup drag with class-level variables
    this.setupDragFunctionality();
    
    // Toggle chat on button click
    chatButton.addEventListener('click', () => {
      const isVisible = this.chatInterface!.style.display === 'block';
      this.chatInterface!.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        // Focus input when opening
        const input = this.chatInterface!.querySelector('#tla-chat-input') as HTMLInputElement;
        input?.focus();
        
        // Restore chat history
        this.restoreChatHistory();
        
        // Check if user email is set
        this.checkUserInitialization();
      }
    });
    
    // Auto-save state every 30 seconds
    this.autoSaveInterval = window.setInterval(() => {
      this.saveState();
    }, 30000);
    
    // Save state before page unload
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });
    
    console.log(`[TLA Chat] Chat interface initialized v${VERSION}`);
  }

  private setupDragFunctionality() {
    const header = this.chatInterface!.querySelector(".tla-chat-header") as HTMLElement;
    if (header) {
      header.addEventListener("mousedown", (e) => {
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        const rect = this.chatInterface!.getBoundingClientRect();
        this.chatStartX = rect.left;
        this.chatStartY = rect.top;
        e.preventDefault();
      });
      
      document.addEventListener("mousemove", (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        this.chatInterface!.style.left = (this.chatStartX + deltaX) + "px";
        this.chatInterface!.style.top = (this.chatStartY + deltaY) + "px";
        this.chatInterface!.style.right = "auto";
        this.chatInterface!.style.bottom = "auto";
      });
      
      document.addEventListener("mouseup", () => {
        this.isDragging = false;
      });
    }
  }

  private async loadState() {
    try {
      const stored = await chrome.storage.local.get(['chatState']);
      if (stored.chatState) {
        this.chatState = stored.chatState;
        console.log('[TLA Chat] Loaded chat state:', this.chatState.messages.length, 'messages');
      }
      
      // Also check for email in sync storage
      const syncStored = await chrome.storage.sync.get(['userEmail']);
      if (syncStored.userEmail) {
        this.chatState.userEmail = syncStored.userEmail;
        this.chatState.isInitialized = true;
      }
    } catch (error) {
      console.error('[TLA Chat] Failed to load state:', error);
    }
  }

  private async saveState() {
    try {
      // Keep only last 50 messages to avoid storage limits
      if (this.chatState.messages.length > 50) {
        this.chatState.messages = this.chatState.messages.slice(-50);
      }
      
      await chrome.storage.local.set({ chatState: this.chatState });
      console.log('[TLA Chat] Saved chat state');
    } catch (error) {
      console.error('[TLA Chat] Failed to save state:', error);
    }
  }

  private isEmail(text: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text.trim());
  }

  private createChatButton(): HTMLElement {
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

  private createChatInterface(): HTMLElement {
    const chat = document.createElement('div');
    chat.id = 'tla-chat-interface';

    chat.innerHTML = `
      <div class="tla-chat-header">
        <span class="tla-chat-drag-handle" title="Drag to move">☰</span>
        <span class="tla-chat-title">TravianAssistant AI</span>
        <span class="tla-chat-version">v${VERSION}</span>
        <span class="tla-profile-status">${this.chatState.isInitialized ? "✓ Profile" : "⚠ Setup Required"}</span>
        <button class="tla-chat-clear" title="Clear chat">🗑️</button>
        <button class="tla-chat-close">×</button>
      </div>
      <div class="tla-chat-messages" id="tla-chat-messages">
        <div class="tla-chat-welcome">
          Welcome! I'm your strategic advisor for Travian.
          <br><br>
          ${this.chatState.isInitialized 
            ? `<strong>Ready to assist!</strong> Ask me anything about your game.`
            : `<strong>First time?</strong> Type your email to get started.`
          }
        </div>
      </div>
      <div class="tla-chat-input-area">
        <textarea id="tla-chat-input" placeholder="${
          this.chatState.isInitialized 
            ? 'Ask about your game strategy...' 
            : 'Enter your email to start...'
        }" rows="1"></textarea>
        <button id="tla-chat-send">Send</button>
      </div>
      <div class="tla-chat-suggestions" id="tla-chat-suggestions">
        <div class="tla-suggestion">Analyze my settlement strategy</div>
        <div class="tla-suggestion">Optimize my build order</div>
        <div class="tla-suggestion">When can I settle next village?</div>
      </div>
    `;
    
    // Style the chat interface with FIX 3: Better resize handle
    chat.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 480px;
      min-width: 320px;
      min-height: 400px;
      max-width: 600px;
      max-height: calc(100vh - 120px);
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid #8B4513;
      border-radius: 12px;
      display: none;
      flex-direction: column;
      z-index: 9998;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      resize: both;
      overflow: auto;
    `;
    
    // Add styles with FIX 2: Proper text wrap for input
    const style = document.createElement('style');
    style.textContent = `
      #tla-chat-interface {
        display: flex;
        flex-direction: column;
      }
      
      /* FIX 3: Custom resize handle */
      #tla-chat-interface::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: se-resize;
        background: linear-gradient(135deg, transparent 50%, rgba(139, 69, 19, 0.6) 50%);
        border-bottom-right-radius: 10px;
        pointer-events: auto;
      }
      
      .tla-chat-header {
        background: linear-gradient(135deg, #8B4513, #A0522D);
        padding: 12px;
        cursor: move;
        user-select: none;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
        gap: 8px;
      }
      
      .tla-chat-title {
        font-weight: bold;
        font-size: 16px;
        flex: 1;
      }
      
      .tla-chat-version {
        font-size: 11px;
        opacity: 0.7;
      }
      
      .tla-profile-status {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 8px;
      }
      
      .tla-chat-clear,
      .tla-chat-close {
        background: transparent;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .tla-chat-clear:hover,
      .tla-chat-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .tla-chat-messages {
        flex: 1;
        min-height: 200px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        color: white;
        font-size: 14px;
        line-height: 1.6;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      /* Custom scrollbar */
      .tla-chat-messages::-webkit-scrollbar {
        width: 8px;
      }
      
      .tla-chat-messages::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      
      .tla-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(139, 69, 19, 0.5);
        border-radius: 4px;
      }
      
      .tla-chat-messages::-webkit-scrollbar-thumb:hover {
        background: rgba(139, 69, 19, 0.7);
      }
      
      .tla-chat-welcome {
        background: rgba(139, 69, 19, 0.2);
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
      }
      
      .tla-chat-message {
        padding: 10px 14px;
        border-radius: 8px;
        animation: fadeIn 0.3s ease;
        max-width: 85%;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        white-space: pre-wrap;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .tla-chat-user {
        background: rgba(70, 130, 180, 0.25);
        align-self: flex-end;
        margin-left: auto;
      }
      
      .tla-chat-ai {
        background: rgba(139, 69, 19, 0.2);
        align-self: flex-start;
        margin-right: auto;
        border: 1px solid rgba(139, 69, 19, 0.3);
      }
      
      /* Format AI responses */
      .tla-chat-ai strong {
        color: #D4A574;
        font-weight: 600;
      }
      
      .tla-chat-ai ul,
      .tla-chat-ai ol {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .tla-chat-ai li {
        margin: 4px 0;
      }
      
      .tla-chat-ai p {
        margin: 8px 0;
      }
      
      .tla-chat-input-area {
        display: flex;
        padding: 12px;
        gap: 8px;
        border-top: 1px solid rgba(139, 69, 19, 0.3);
        align-items: flex-end;
      }
      
      /* FIX 2: Use textarea instead of input for proper text wrap */
      #tla-chat-input {
        flex: 1;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(139, 69, 19, 0.4);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s;
        resize: vertical;
        min-height: 40px;
        max-height: 120px;
        overflow-y: auto;
        line-height: 1.4;
      }
      
      #tla-chat-input:focus {
        outline: none;
        border-color: #A0522D;
        background: rgba(255, 255, 255, 0.12);
      }
      
      #tla-chat-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
      
      #tla-chat-send {
        padding: 10px 20px;
        background: linear-gradient(135deg, #8B4513, #A0522D);
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 40px;
      }
      
      #tla-chat-send:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(139, 69, 19, 0.4);
      }
      
      #tla-chat-send:active {
        transform: translateY(0);
      }
      
      .tla-chat-suggestions {
        padding: 8px;
        max-height: 100px;
        overflow-y: auto;
        border-top: 1px solid rgba(139, 69, 19, 0.3);
        display: none;
        flex-direction: column;
        gap: 4px;
      }
      
      .tla-suggestion {
        padding: 6px 10px;
        background: rgba(139, 69, 19, 0.15);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .tla-suggestion:hover {
        background: rgba(139, 69, 19, 0.3);
        color: white;
        transform: translateX(4px);
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
        0%, 80%, 100% { opacity: 0.4; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1.2); }
      }
      
      .tla-chat-timestamp {
        font-size: 10px;
        opacity: 0.5;
        margin-top: 4px;
      }
    `;
    document.head.appendChild(style);
    
    // Add event handlers
    this.setupEventHandlers(chat);
    
    return chat;
  }

  private setupEventHandlers(chat: HTMLElement) {
    const closeBtn = chat.querySelector('.tla-chat-close');
    const clearBtn = chat.querySelector('.tla-chat-clear');
    const input = chat.querySelector('#tla-chat-input') as HTMLTextAreaElement; // Changed to textarea
    const sendBtn = chat.querySelector('#tla-chat-send');
    const suggestions = chat.querySelectorAll('.tla-suggestion');
    
    closeBtn?.addEventListener('click', () => {
      chat.style.display = 'none';
    });
    
    clearBtn?.addEventListener('click', () => {
      if (confirm('Clear all chat history?')) {
        this.clearChat();
      }
    });
    
    // FIX 2: Auto-resize textarea
    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
    
    const sendMessage = async () => {
      const message = input.value.trim();
      if (!message) return;
      
      // Check if it's an email
      if (this.isEmail(message)) {
        await this.handleEmailInitialization(message);
        input.value = '';
        input.style.height = '40px'; // Reset height
        return;
      }
      
      // Display user message
      this.addMessage(message, 'user');
      input.value = '';
      input.style.height = '40px'; // Reset height
      
      // Show loading
      const loadingId = this.addMessage(
        '<span class="tla-chat-loading"></span><span class="tla-chat-loading"></span><span class="tla-chat-loading"></span>',
        'ai',
        false // Don't save loading message
      );
      
      try {
        // Get current game state
        const gameState = await safeScraper.scrapeCurrentState();
        
        // Send to AI with context about game start optimization
        const enhancedMessage = this.enhanceMessageWithContext(message, gameState);
        
        const response = await chrome.runtime.sendMessage({
          type: 'CHAT_MESSAGE',
          message: enhancedMessage,
          gameState: gameState
        });
        
        // Remove loading and show response
        this.removeMessage(loadingId);
        
        if (response.success) {
          const formattedResponse = this.formatAIResponse(response.response);
          this.addMessage(formattedResponse, 'ai');
        } else {
          this.addMessage(`Error: ${response.error}`, 'ai');
        }
      } catch (error) {
        this.removeMessage(loadingId);
        this.addMessage('Failed to get response. Please try again.', 'ai');
        console.error('[TLA Chat] Error:', error);
      }
    };
    
    sendBtn?.addEventListener('click', sendMessage);
    
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Handle suggestions
    suggestions.forEach(suggestion => {
      suggestion.addEventListener('click', () => {
        input.value = suggestion.textContent || '';
        sendMessage();
      });
    });
  }

  private enhanceMessageWithContext(message: string, gameState: any): string {
    // Add context about game start optimization if relevant
    const lowerMessage = message.toLowerCase();
    const settlementKeywords = ['settle', 'village', 'cp', 'culture', 'expand', 'next', 'when'];
    const buildKeywords = ['build', 'queue', 'order', 'upgrade', 'construct', 'focus'];
    
    let enhanced = message;
    
    if (settlementKeywords.some(kw => lowerMessage.includes(kw))) {
      enhanced += '\n[Context: Focus on settlement timing calculation. Consider: current CP, daily CP production, celebration potential, resource accumulation rate, and settler training time.]';
    }
    
    if (buildKeywords.some(kw => lowerMessage.includes(kw))) {
      enhanced += '\n[Context: Optimize for fastest path to settlement. Balance: resource production, CP generation from buildings, quest rewards, and population growth. Egyptian civilization specific optimizations if applicable.]';
    }
    
    // Add server age context
    if (gameState?.serverAge) {
      const serverDay = Math.floor(gameState.serverAge / 86400);
      enhanced += `\n[Server Day: ${serverDay}]`;
    }
    
    return enhanced;
  }

  private formatAIResponse(response: string): string {
    // Format the AI response for better readability
    let formatted = response;
    
    // Convert markdown-style headers to bold
    formatted = formatted.replace(/^### (.+)$/gm, '<strong>$1</strong>');
    formatted = formatted.replace(/^## (.+)$/gm, '<strong>$1</strong>');
    formatted = formatted.replace(/^# (.+)$/gm, '<strong>$1</strong>');
    
    // Convert markdown bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert numbered lists
    formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '$1. $2');
    
    // Convert bullet points
    formatted = formatted.replace(/^[\-\*\+] (.+)$/gm, '• $1');
    
    // Add line breaks for readability
    formatted = formatted.replace(/\n\n/g, '\n\n');
    
    // Highlight important numbers (times, resources, etc)
    formatted = formatted.replace(/\b(\d+:\d+:\d+)\b/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\b(\d+[kKmM]?)\s*(wood|clay|iron|crop|resources?)\b/gi, '<strong>$1</strong> $2');
    
    return formatted;
  }

  private addMessage(content: string, type: 'user' | 'ai', save: boolean = true): string {
    const messagesContainer = document.querySelector('#tla-chat-messages');
    if (!messagesContainer) return '';
    
    const messageDiv = document.createElement('div');
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    messageDiv.id = messageId;
    messageDiv.className = `tla-chat-message tla-chat-${type}`;
    messageDiv.innerHTML = content;
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'tla-chat-timestamp';
    timestampDiv.textContent = timestamp;
    messageDiv.appendChild(timestampDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Save to state
    if (save) {
      const chatMessage: ChatMessage = {
        id: messageId,
        type,
        content,
        timestamp: Date.now()
      };
      this.chatState.messages.push(chatMessage);
      this.saveState();
    }
    
    return messageId;
  }

  private removeMessage(messageId: string) {
    const message = document.getElementById(messageId);
    message?.remove();
  }

  private clearChat() {
    const messagesContainer = document.querySelector('#tla-chat-messages');
    if (!messagesContainer) return;
    
    // Remove all messages except welcome
    const messages = messagesContainer.querySelectorAll('.tla-chat-message');
    messages.forEach(msg => msg.remove());
    
    // Clear state
    this.chatState.messages = [];
    this.saveState();
    
    // Add cleared message
    this.addMessage('Chat history cleared', 'ai');
  }

  private restoreChatHistory() {
    const messagesContainer = document.querySelector('#tla-chat-messages');
    if (!messagesContainer || this.chatState.messages.length === 0) return;
    
    // Clear existing messages (except welcome)
    const existingMessages = messagesContainer.querySelectorAll('.tla-chat-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Restore messages from state
    this.chatState.messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.id = msg.id;
      messageDiv.className = `tla-chat-message tla-chat-${msg.type}`;
      messageDiv.innerHTML = msg.content;
      
      // Add timestamp
      const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const timestampDiv = document.createElement('div');
      timestampDiv.className = 'tla-chat-timestamp';
      timestampDiv.textContent = timestamp;
      messageDiv.appendChild(timestampDiv);
      
      messagesContainer.appendChild(messageDiv);
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private async handleEmailInitialization(email: string) {
    this.addMessage(`Setting up with email: ${email}`, 'user');
    
    const loadingId = this.addMessage(
      'Initializing your profile<span class="tla-chat-loading"></span><span class="tla-chat-loading"></span><span class="tla-chat-loading"></span>',
      'ai',
      false
    );
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SET_USER_EMAIL',
        email: email
      });
      
      this.removeMessage(loadingId);
      
      if (response.success) {
        this.chatState.userEmail = email;
        this.chatState.isInitialized = true;
        await this.saveState();
        
        this.addMessage(
          `Great! I've initialized your profile. I'll learn your playing style over time to give you personalized advice.\n\nFor optimal game start, I'll help you:\n• Reach settlement in <7 days\n• Optimize resource production\n• Complete quests efficiently\n• Plan your expansion strategy\n\nHow can I help you dominate this server?`,
          'ai'
        );
        
        // Show suggestions
        const suggestions = document.querySelector('#tla-chat-suggestions') as HTMLElement;
        if (suggestions) {
          suggestions.style.display = 'flex';
        }
        
        // Update input placeholder
        const input = document.querySelector('#tla-chat-input') as HTMLTextAreaElement;
        if (input) {
          input.placeholder = 'Ask about your game strategy...';
        }
      } else {
        this.addMessage(`Failed to initialize: ${response.error}`, 'ai');
      }
    } catch (error) {
      this.removeMessage(loadingId);
      this.addMessage('Failed to initialize. Please try again.', 'ai');
      console.error('[TLA Chat] Initialization error:', error);
    }
  }

  private async checkUserInitialization() {
    if (this.chatState.isInitialized) {
      // Already initialized from loaded state
      const suggestions = document.querySelector('#tla-chat-suggestions') as HTMLElement;
      if (suggestions) {
        suggestions.style.display = 'flex';
      }
      return;
    }
    
    try {
      const stored = await chrome.storage.sync.get(['userEmail']);
      if (stored.userEmail) {
        this.chatState.userEmail = stored.userEmail;
        this.chatState.isInitialized = true;
        
        // User already initialized, show suggestions
        const suggestions = document.querySelector('#tla-chat-suggestions') as HTMLElement;
        if (suggestions) {
          suggestions.style.display = 'flex';
        }
        
        // Update input placeholder
        const input = document.querySelector('#tla-chat-input') as HTMLTextAreaElement;
        if (input) {
          input.placeholder = 'Ask about your game strategy...';
        }
      }
    } catch (error) {
      console.error('[TLA Chat] Failed to check initialization:', error);
    }
  }
}

// Initialize the conversational AI
let conversationalAI: ConversationalAI | null = null;

export function initConversationalAI() {
  if (!conversationalAI) {
    conversationalAI = new ConversationalAI();
    conversationalAI.init();
  }
}

// Export for testing
export { ConversationalAI };