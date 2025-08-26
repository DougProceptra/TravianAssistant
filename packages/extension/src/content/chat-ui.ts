// packages/extension/src/content/chat-ui.ts
// Movable chat interface for Travian Assistant

export class ChatUI {
  private container: HTMLElement | null = null;
  private chatBox: HTMLElement | null = null;
  private isOpen: boolean = false;
  private isDragging: boolean = false;
  private dragOffset = { x: 0, y: 0 };
  private position = { x: 20, y: 20 };
  private onSendMessage: (message: string) => Promise<string>;
  
  constructor(onSendMessage: (message: string) => Promise<string>) {
    this.onSendMessage = onSendMessage;
    this.loadPosition();
  }

  /**
   * Initialize the chat UI
   */
  async initialize() {
    this.createChatButton();
    this.createChatBox();
    this.attachEventListeners();
    this.applyPosition();
  }

  /**
   * Toggle chat visibility
   */
  toggle() {
    this.isOpen = !this.isOpen;
    this.updateVisibility();
    
    if (this.isOpen && this.chatBox) {
      // Focus input when opened
      const input = this.chatBox.querySelector('.ta-chat-input') as HTMLInputElement;
      if (input) input.focus();
    }
  }

  /**
   * Add message to chat
   */
  addMessage(message: string, isUser: boolean = false) {
    const messagesContainer = this.chatBox?.querySelector('.ta-chat-messages');
    if (!messagesContainer) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = isUser ? 'ta-message ta-user' : 'ta-message ta-ai';
    messageEl.innerHTML = `
      <div class="ta-message-role">${isUser ? 'You' : 'AI Strategist'}</div>
      <div class="ta-message-content">${this.formatMessage(message)}</div>
    `;
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Show loading indicator
   */
  setLoading(loading: boolean) {
    const input = this.chatBox?.querySelector('.ta-chat-input') as HTMLInputElement;
    const button = this.chatBox?.querySelector('.ta-send-button') as HTMLButtonElement;
    
    if (input) input.disabled = loading;
    if (button) button.disabled = loading;
    
    if (loading) {
      this.addMessage('Analyzing...', false);
    }
  }

  // Private methods

  private createChatButton() {
    const button = document.createElement('div');
    button.id = 'ta-chat-button';
    button.className = 'ta-chat-button';
    button.innerHTML = '💬';
    button.title = 'Travian AI Strategic Chat';
    
    button.addEventListener('click', () => this.toggle());
    
    document.body.appendChild(button);
  }

  private createChatBox() {
    this.container = document.createElement('div');
    this.container.id = 'ta-chat-container';
    this.container.className = 'ta-chat-container';
    this.container.style.display = 'none';
    
    this.container.innerHTML = `
      <div class="ta-chat-header">
        <div class="ta-drag-handle">☰</div>
        <div class="ta-chat-title">Travian AI Strategist</div>
        <div class="ta-chat-controls">
          <button class="ta-settings-btn" title="Settings">⚙️</button>
          <button class="ta-minimize-btn" title="Minimize">_</button>
          <button class="ta-close-btn" title="Close">×</button>
        </div>
      </div>
      <div class="ta-chat-content">
        <div class="ta-chat-messages"></div>
        <div class="ta-example-prompts" style="display: none;">
          <div class="ta-prompt-title">Example Questions:</div>
          <div class="ta-prompt-item" data-prompt="strategic">📊 Strategic opportunities?</div>
          <div class="ta-prompt-item" data-prompt="attack">⚔️ Being attacked - options?</div>
          <div class="ta-prompt-item" data-prompt="settlement">🏘️ Settlement timing?</div>
          <div class="ta-prompt-item" data-prompt="psychology">🧠 Psychological plays?</div>
          <div class="ta-prompt-item" data-prompt="deception">🎭 Misdirection tactics?</div>
        </div>
        <div class="ta-chat-input-container">
          <input type="text" class="ta-chat-input" placeholder="Ask about strategy..." />
          <button class="ta-send-button">Send</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.container);
    this.chatBox = this.container;
    
    // Add welcome message
    this.addMessage("Elite strategist ready. Ask me anything about your game - I'll provide insights beyond the obvious moves.", false);
  }

  private attachEventListeners() {
    if (!this.chatBox) return;
    
    // Drag functionality
    const dragHandle = this.chatBox.querySelector('.ta-drag-handle');
    if (dragHandle) {
      dragHandle.addEventListener('mousedown', (e) => this.startDragging(e as MouseEvent));
    }
    
    // Close button
    const closeBtn = this.chatBox.querySelector('.ta-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggle());
    }
    
    // Minimize button
    const minimizeBtn = this.chatBox.querySelector('.ta-minimize-btn');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.minimize());
    }
    
    // Settings button
    const settingsBtn = this.chatBox.querySelector('.ta-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }
    
    // Send message
    const input = this.chatBox.querySelector('.ta-chat-input') as HTMLInputElement;
    const sendBtn = this.chatBox.querySelector('.ta-send-button');
    
    if (input && sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
    
    // Example prompts
    const prompts = this.chatBox.querySelectorAll('.ta-prompt-item');
    prompts.forEach(prompt => {
      prompt.addEventListener('click', () => {
        const type = prompt.getAttribute('data-prompt');
        this.insertExamplePrompt(type || '');
      });
    });
    
    // Global mouse events for dragging
    document.addEventListener('mousemove', (e) => this.handleDragging(e));
    document.addEventListener('mouseup', () => this.stopDragging());
  }

  private startDragging(e: MouseEvent) {
    this.isDragging = true;
    const rect = this.chatBox!.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Add dragging class for visual feedback
    this.chatBox!.classList.add('dragging');
  }

  private handleDragging(e: MouseEvent) {
    if (!this.isDragging || !this.chatBox) return;
    
    e.preventDefault();
    
    this.position = {
      x: e.clientX - this.dragOffset.x,
      y: e.clientY - this.dragOffset.y
    };
    
    // Keep within viewport
    const maxX = window.innerWidth - this.chatBox.offsetWidth;
    const maxY = window.innerHeight - this.chatBox.offsetHeight;
    
    this.position.x = Math.max(0, Math.min(this.position.x, maxX));
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));
    
    this.applyPosition();
  }

  private stopDragging() {
    if (this.isDragging) {
      this.isDragging = false;
      this.chatBox?.classList.remove('dragging');
      this.savePosition();
    }
  }

  private applyPosition() {
    if (this.chatBox) {
      this.chatBox.style.left = `${this.position.x}px`;
      this.chatBox.style.top = `${this.position.y}px`;
    }
  }

  private async savePosition() {
    try {
      await chrome.storage.local.set({ chatPosition: this.position });
    } catch (error) {
      console.error('[Chat UI] Failed to save position:', error);
    }
  }

  private async loadPosition() {
    try {
      const stored = await chrome.storage.local.get(['chatPosition']);
      if (stored.chatPosition) {
        this.position = stored.chatPosition;
      }
    } catch (error) {
      console.error('[Chat UI] Failed to load position:', error);
    }
  }

  private updateVisibility() {
    if (this.container) {
      this.container.style.display = this.isOpen ? 'block' : 'none';
    }
    
    // Update button appearance
    const button = document.getElementById('ta-chat-button');
    if (button) {
      button.classList.toggle('active', this.isOpen);
    }
  }

  private minimize() {
    const content = this.chatBox?.querySelector('.ta-chat-content') as HTMLElement;
    if (content) {
      const isMinimized = content.style.display === 'none';
      content.style.display = isMinimized ? 'flex' : 'none';
      this.chatBox?.classList.toggle('minimized', !isMinimized);
    }
  }

  private async sendMessage() {
    const input = this.chatBox?.querySelector('.ta-chat-input') as HTMLInputElement;
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';
    
    // Add user message
    this.addMessage(message, true);
    
    // Show loading
    this.setLoading(true);
    
    try {
      // Get AI response
      const response = await this.onSendMessage(message);
      
      // Remove loading message
      const messages = this.chatBox?.querySelector('.ta-chat-messages');
      if (messages && messages.lastElementChild?.textContent?.includes('Analyzing...')) {
        messages.removeChild(messages.lastElementChild);
      }
      
      // Add AI response
      this.addMessage(response, false);
    } catch (error) {
      console.error('[Chat UI] Failed to get response:', error);
      this.addMessage('Failed to connect. Please try again.', false);
    } finally {
      this.setLoading(false);
    }
  }

  private formatMessage(message: string): string {
    // Convert markdown-style formatting to HTML
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private insertExamplePrompt(type: string) {
    const prompts: { [key: string]: string } = {
      strategic: "What strategic opportunities do you see in my current position?",
      attack: "I'm being attacked in 4 hours. What are my options beyond defend or dodge?",
      settlement: "Should I rush settlers or is there a better play here?",
      psychology: "How can I make my opponents think I'm weaker than I am?",
      deception: "How can I mislead scouts about my true strength?"
    };
    
    const input = this.chatBox?.querySelector('.ta-chat-input') as HTMLInputElement;
    if (input && prompts[type]) {
      input.value = prompts[type];
      input.focus();
    }
  }

  private openSettings() {
    // Send message to open settings panel
    chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
  }
}

export default ChatUI;