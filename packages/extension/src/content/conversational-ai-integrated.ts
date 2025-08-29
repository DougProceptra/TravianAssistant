// packages/extension/src/content/conversational-ai-integrated.ts
// Enhanced chat UI with integrated game optimizer and strategic AI

import { gameIntegration } from './game-integration';
import { AIPromptEnhancer } from '../ai-prompt-enhancer';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export class ConversationalAI {
  private chatHistory: ChatMessage[] = [];
  private chatContainer: HTMLElement | null = null;
  private isMinimized: boolean = false;
  private position = { x: 20, y: 20 };
  private size = { width: 400, height: 500 };
  private isDragging = false;
  private isResizing = false;
  private dragOffset = { x: 0, y: 0 };

  constructor() {
    console.log('[TLA Chat] Initializing enhanced conversational AI v1.0.0...');
    this.initializeChat();
    this.loadChatState();
  }

  private initializeChat() {
    // Remove any existing chat
    const existing = document.getElementById('travian-assistant-chat');
    if (existing) existing.remove();

    // Create chat container with optimizer integration
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'travian-assistant-chat';
    this.chatContainer.innerHTML = `
      <div class="ta-chat-header">
        <span class="ta-chat-title">Travian AI Assistant</span>
        <div class="ta-chat-controls">
          <button class="ta-chat-minimize">_</button>
          <button class="ta-chat-close">×</button>
        </div>
      </div>
      <div class="ta-chat-quick-analysis" id="ta-quick-analysis">
        <!-- Quick analysis will be injected here -->
      </div>
      <div class="ta-chat-messages" id="ta-chat-messages">
        <div class="ta-chat-welcome">
          Welcome to Travian Assistant v1.0 - Strategic AI Mode
          <br><br>
          🎯 Game Optimizer Active - Targeting Top-5 Settlement
          <br>
          💡 Ask strategic questions or type "analyze" for full assessment
        </div>
      </div>
      <div class="ta-chat-input-container">
        <textarea 
          class="ta-chat-input" 
          id="ta-chat-input" 
          placeholder="Ask about strategy, timing, or next actions..."
          rows="2"
        ></textarea>
        <button class="ta-chat-send" id="ta-chat-send">Send</button>
      </div>
      <div class="ta-chat-resize-handle"></div>
    `;

    // Enhanced styles with optimizer UI elements
    const styles = `
      #travian-assistant-chat {
        position: fixed;
        top: ${this.position.y}px;
        left: ${this.position.x}px;
        width: ${this.size.width}px;
        height: ${this.size.height}px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #0f3460;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 10001;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #e94560;
      }

      .ta-chat-header {
        background: linear-gradient(90deg, #0f3460 0%, #16213e 100%);
        padding: 10px;
        border-radius: 6px 6px 0 0;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
      }

      .ta-chat-title {
        font-weight: bold;
        color: #00ff88;
        text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      }

      .ta-chat-controls button {
        background: transparent;
        border: 1px solid #00ff88;
        color: #00ff88;
        cursor: pointer;
        padding: 2px 8px;
        margin-left: 5px;
        border-radius: 3px;
        transition: all 0.3s;
      }

      .ta-chat-controls button:hover {
        background: #00ff88;
        color: #1a1a2e;
        box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      }

      .ta-chat-quick-analysis {
        background: rgba(15, 52, 96, 0.3);
        padding: 8px;
        border-bottom: 1px solid #0f3460;
        font-size: 12px;
        color: #00ff88;
        max-height: 80px;
        overflow-y: auto;
        display: none;
      }

      .ta-chat-quick-analysis.active {
        display: block;
      }

      .ta-chat-quick-analysis .metric {
        display: inline-block;
        margin: 2px 8px 2px 0;
        padding: 2px 6px;
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        border-radius: 3px;
      }

      .ta-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        background: rgba(0, 0, 0, 0.2);
      }

      .ta-chat-welcome {
        color: #00ff88;
        padding: 10px;
        background: rgba(15, 52, 96, 0.2);
        border-radius: 5px;
        margin-bottom: 10px;
        border-left: 3px solid #00ff88;
      }

      .ta-chat-message {
        margin-bottom: 10px;
        padding: 8px;
        border-radius: 5px;
        animation: fadeIn 0.3s;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .ta-chat-message.user {
        background: rgba(233, 69, 96, 0.2);
        border-left: 3px solid #e94560;
        margin-left: 20px;
      }

      .ta-chat-message.assistant {
        background: rgba(15, 52, 96, 0.3);
        border-left: 3px solid #00ff88;
        margin-right: 20px;
      }

      .ta-chat-message .timestamp {
        font-size: 10px;
        color: #666;
        margin-top: 4px;
      }

      .ta-chat-input-container {
        display: flex;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-top: 1px solid #0f3460;
        gap: 8px;
      }

      .ta-chat-input {
        flex: 1;
        background: rgba(15, 52, 96, 0.3);
        border: 1px solid #0f3460;
        color: #00ff88;
        padding: 8px;
        border-radius: 4px;
        resize: none;
        font-family: inherit;
        font-size: 13px;
      }

      .ta-chat-input:focus {
        outline: none;
        border-color: #00ff88;
        box-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
      }

      .ta-chat-send {
        background: linear-gradient(135deg, #00ff88 0%, #0f3460 100%);
        border: none;
        color: #1a1a2e;
        font-weight: bold;
        padding: 8px 20px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .ta-chat-send:hover {
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
      }

      .ta-chat-resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 50%, #00ff88 50%);
        border-radius: 0 0 6px 0;
      }

      .ta-chat-minimized #ta-chat-messages,
      .ta-chat-minimized .ta-chat-input-container,
      .ta-chat-minimized .ta-chat-quick-analysis,
      .ta-chat-minimized .ta-chat-resize-handle {
        display: none;
      }

      .ta-chat-minimized {
        height: auto !important;
      }

      /* Scrollbar styling */
      .ta-chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .ta-chat-messages::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }

      .ta-chat-messages::-webkit-scrollbar-thumb {
        background: #00ff88;
        border-radius: 3px;
      }
    `;

    // Add styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Add to page
    document.body.appendChild(this.chatContainer);

    // Setup event handlers
    this.setupEventHandlers();

    // Initialize quick analysis
    this.updateQuickAnalysis();

    console.log('[TLA Chat] Chat interface initialized v1.0.0');
  }

  private setupEventHandlers() {
    // Send button
    const sendButton = document.getElementById('ta-chat-send');
    if (sendButton) {
      sendButton.addEventListener('click', () => this.sendMessage());
    }

    // Enter key in input
    const input = document.getElementById('ta-chat-input') as HTMLTextAreaElement;
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Minimize button
    const minimizeButton = this.chatContainer?.querySelector('.ta-chat-minimize');
    if (minimizeButton) {
      minimizeButton.addEventListener('click', () => this.toggleMinimize());
    }

    // Close button
    const closeButton = this.chatContainer?.querySelector('.ta-chat-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }

    // Dragging
    const header = this.chatContainer?.querySelector('.ta-chat-header') as HTMLElement;
    if (header) {
      header.addEventListener('mousedown', (e) => this.startDrag(e));
    }

    // Resizing
    const resizeHandle = this.chatContainer?.querySelector('.ta-chat-resize-handle') as HTMLElement;
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
    }

    // Global mouse events for drag and resize
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());
  }

  private async sendMessage() {
    const input = document.getElementById('ta-chat-input') as HTMLTextAreaElement;
    const message = input?.value.trim();
    
    if (!message) return;

    // Add user message
    this.addMessage('user', message);
    input.value = '';

    // Check for special commands
    if (message.toLowerCase() === 'analyze') {
      await this.performFullAnalysis();
      return;
    }

    if (message.toLowerCase() === 'plan') {
      await this.showActionPlan();
      return;
    }

    // Get current game state
    const gameState = await this.getGameState();
    
    // Generate enhanced prompt with optimizer
    const enhancedPrompt = gameIntegration.generateAIPrompt(message, gameState);

    // Send to AI with enhanced context
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHAT_MESSAGE',
        message: enhancedPrompt,
        gameState: gameState
      });

      if (response?.success && response.reply) {
        this.addMessage('assistant', response.reply);
      } else {
        this.addMessage('assistant', 'Error: ' + (response?.error || 'Failed to get response'));
      }
    } catch (error) {
      console.error('[TLA Chat] Error sending message:', error);
      this.addMessage('assistant', 'Error connecting to AI service');
    }
  }

  private async performFullAnalysis() {
    const gameState = await this.getGameState();
    const analysis = gameIntegration.processGameState(gameState);
    
    let analysisText = '📊 **Full Strategic Analysis**\n\n';
    
    // Phase analysis
    if (analysis.analysis?.phase) {
      analysisText += `**Current Phase:** ${analysis.analysis.phase.name}\n`;
      analysisText += `**Focus:** ${analysis.analysis.phase.focus}\n\n`;
    }

    // Status check
    if (analysis.analysis?.onTrack !== undefined) {
      if (analysis.analysis.onTrack) {
        analysisText += '✅ **Status:** On track for top-5 settlement\n\n';
      } else {
        analysisText += '⚠️ **Status:** Behind schedule\n';
        if (analysis.analysis.behindBy) {
          analysisText += `**Issue:** ${analysis.analysis.behindBy.metric}\n`;
          analysisText += `**Current:** ${analysis.analysis.behindBy.current}\n`;
          analysisText += `**Target:** ${analysis.analysis.behindBy.target}\n\n`;
        }
      }
    }

    // Recommendations
    if (analysis.recommendations?.length > 0) {
      analysisText += '**Immediate Actions:**\n';
      analysis.recommendations.slice(0, 5).forEach((rec, i) => {
        analysisText += `${i + 1}. **${rec.type}**\n`;
        analysisText += `   ${rec.reasoning}\n`;
      });
    }

    this.addMessage('assistant', analysisText);
  }

  private async showActionPlan() {
    const plan = gameIntegration.getActionPlan('immediate');
    this.addMessage('assistant', plan);
  }

  private async getGameState() {
    // Get scraped data from the page
    const villages = this.scrapeVillages();
    
    return {
      villages,
      currentResources: this.scrapeResources(),
      production: this.scrapeProduction(),
      buildings: [],
      troops: [],
      quests: []
    };
  }

  private scrapeVillages(): any[] {
    // This would normally scrape from the page
    // Using window data if available
    const windowData = (window as any).TravianAssistant?.gameState;
    return windowData?.villages || [];
  }

  private scrapeResources(): any {
    // Scrape current resources from page
    return {
      wood: 500,
      clay: 500,
      iron: 500,
      crop: 500
    };
  }

  private scrapeProduction(): any {
    // Scrape production rates from page
    return {
      wood: 30,
      clay: 30,
      iron: 30,
      crop: 40
    };
  }

  private updateQuickAnalysis() {
    const analysisDiv = document.getElementById('ta-quick-analysis');
    if (!analysisDiv) return;

    const gameState = this.getGameState();
    const summary = gameIntegration.getQuickSummary(gameState);
    
    // Parse summary into metrics
    const lines = summary.split('\n').filter(line => line.trim());
    let metricsHtml = '';
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [label, value] = line.split(':');
        metricsHtml += `<span class="metric">${label.replace(/[⚠️✅🎯📍⚡]/g, '').trim()}: ${value.trim()}</span>`;
      }
    });

    if (metricsHtml) {
      analysisDiv.innerHTML = metricsHtml;
      analysisDiv.classList.add('active');
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    const messagesContainer = document.getElementById('ta-chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `ta-chat-message ${role}`;
    
    // Convert markdown-style formatting
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `
      <div class="content">${formattedContent}</div>
      <div class="timestamp">${new Date().toLocaleTimeString()}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Save to history
    this.chatHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    this.saveChatState();
  }

  private toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.chatContainer?.classList.toggle('ta-chat-minimized', this.isMinimized);
    this.saveChatState();
  }

  private close() {
    this.chatContainer?.remove();
    localStorage.setItem('ta-chat-open', 'false');
  }

  // Drag and resize handlers
  private startDrag(e: MouseEvent) {
    if (this.isMinimized) return;
    this.isDragging = true;
    this.dragOffset = {
      x: e.clientX - this.position.x,
      y: e.clientY - this.position.y
    };
  }

  private startResize(e: MouseEvent) {
    this.isResizing = true;
    e.preventDefault();
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging && this.chatContainer) {
      this.position.x = e.clientX - this.dragOffset.x;
      this.position.y = e.clientY - this.dragOffset.y;
      
      this.chatContainer.style.left = `${this.position.x}px`;
      this.chatContainer.style.top = `${this.position.y}px`;
    }

    if (this.isResizing && this.chatContainer) {
      this.size.width = e.clientX - this.position.x;
      this.size.height = e.clientY - this.position.y;
      
      this.size.width = Math.max(300, Math.min(800, this.size.width));
      this.size.height = Math.max(200, Math.min(600, this.size.height));
      
      this.chatContainer.style.width = `${this.size.width}px`;
      this.chatContainer.style.height = `${this.size.height}px`;
    }
  }

  private handleMouseUp() {
    if (this.isDragging || this.isResizing) {
      this.isDragging = false;
      this.isResizing = false;
      this.saveChatState();
    }
  }

  // State persistence
  private saveChatState() {
    const state = {
      history: this.chatHistory,
      position: this.position,
      size: this.size,
      minimized: this.isMinimized
    };
    localStorage.setItem('ta-chat-state', JSON.stringify(state));
  }

  private loadChatState() {
    const saved = localStorage.getItem('ta-chat-state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.chatHistory = state.history || [];
        this.position = state.position || this.position;
        this.size = state.size || this.size;
        this.isMinimized = state.minimized || false;

        // Apply loaded state
        if (this.chatContainer) {
          this.chatContainer.style.left = `${this.position.x}px`;
          this.chatContainer.style.top = `${this.position.y}px`;
          this.chatContainer.style.width = `${this.size.width}px`;
          this.chatContainer.style.height = `${this.size.height}px`;
          
          if (this.isMinimized) {
            this.chatContainer.classList.add('ta-chat-minimized');
          }
        }

        // Restore chat history
        const messagesContainer = document.getElementById('ta-chat-messages');
        if (messagesContainer && this.chatHistory.length > 0) {
          messagesContainer.innerHTML = '';
          this.chatHistory.forEach(msg => {
            this.addMessage(msg.role, msg.content);
          });
        }

        console.log(`[TLA Chat] Loaded chat state: ${this.chatHistory.length} messages`);
      } catch (e) {
        console.error('[TLA Chat] Failed to load state:', e);
      }
    }
  }
}
