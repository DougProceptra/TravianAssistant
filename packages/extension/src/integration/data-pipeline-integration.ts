// Data Pipeline Integration - Connects scraper to AI chat
// Ensures scraped data reaches AI with proper context

import { dataScraper } from '../scrapers/enhanced-data-scraper';

export class DataPipelineIntegration {
  private static instance: DataPipelineIntegration;
  private isInitialized = false;
  private scrapeInterval: number | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): DataPipelineIntegration {
    if (!DataPipelineIntegration.instance) {
      DataPipelineIntegration.instance = new DataPipelineIntegration();
    }
    return DataPipelineIntegration.instance;
  }

  private async initialize() {
    if (this.isInitialized) return;

    console.log('[Data Pipeline] Initializing data pipeline integration...');

    // Check for user email on initialization
    await this.checkAndRequestUserEmail();

    // Set up continuous data collection
    this.startDataCollection();

    // Listen for chat messages to inject context
    this.setupChatIntegration();

    // Listen for AI requests from chat
    this.setupMessageListeners();

    this.isInitialized = true;
    console.log('[Data Pipeline] Integration initialized successfully');
  }

  private async checkAndRequestUserEmail() {
    const stored = await chrome.storage.sync.get(['userEmail']);
    
    if (!stored.userEmail) {
      console.log('[Data Pipeline] No user email found, prompting user...');
      
      // Create a non-intrusive prompt for email
      const emailPrompt = document.createElement('div');
      emailPrompt.id = 'travian-assistant-email-prompt';
      emailPrompt.innerHTML = `
        <div style="
          position: fixed;
          top: 10px;
          right: 10px;
          background: #2c3e50;
          color: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          z-index: 999999;
          font-family: Arial, sans-serif;
          max-width: 350px;
        ">
          <h4 style="margin: 0 0 10px 0; font-size: 16px;">Travian Assistant Setup</h4>
          <p style="margin: 0 0 10px 0; font-size: 14px;">
            Enter your email to enable personalized AI assistance:
          </p>
          <input type="email" id="ta-email-input" placeholder="your.email@example.com" 
            style="
              width: 100%;
              padding: 8px;
              border: none;
              border-radius: 4px;
              margin-bottom: 10px;
              font-size: 14px;
            ">
          <div style="display: flex; gap: 10px;">
            <button id="ta-email-save" style="
              flex: 1;
              padding: 8px;
              background: #27ae60;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">Save</button>
            <button id="ta-email-skip" style="
              flex: 1;
              padding: 8px;
              background: #7f8c8d;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">Skip</button>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #bdc3c7;">
            Your email is hashed for privacy and used only to separate your game data.
          </p>
        </div>
      `;

      document.body.appendChild(emailPrompt);

      // Handle save button
      document.getElementById('ta-email-save')?.addEventListener('click', async () => {
        const input = document.getElementById('ta-email-input') as HTMLInputElement;
        const email = input?.value?.trim();
        
        if (email && email.includes('@')) {
          await dataScraper.setUserEmail(email);
          emailPrompt.remove();
          console.log('[Data Pipeline] User email saved');
          
          // Trigger initial data collection
          this.collectAndStoreData();
        } else {
          alert('Please enter a valid email address');
        }
      });

      // Handle skip button
      document.getElementById('ta-email-skip')?.addEventListener('click', () => {
        emailPrompt.remove();
        console.log('[Data Pipeline] User skipped email setup');
      });
    } else {
      await dataScraper.setUserEmail(stored.userEmail);
      console.log('[Data Pipeline] User email loaded from storage');
    }
  }

  private startDataCollection() {
    // Collect data immediately
    this.collectAndStoreData();

    // Set up periodic collection (every 30 seconds)
    this.scrapeInterval = window.setInterval(() => {
      this.collectAndStoreData();
    }, 30000);

    // Also collect on page navigation
    const observer = new MutationObserver(() => {
      this.collectAndStoreData();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[Data Pipeline] Data collection started');
  }

  private collectAndStoreData() {
    try {
      const gameContext = dataScraper.scrapeGameContext();
      
      // Store in chrome storage for background script access
      chrome.storage.local.set({ 
        gameContext,
        lastUpdate: Date.now() 
      });

      // Send to background script
      chrome.runtime.sendMessage({
        type: 'GAME_CONTEXT_UPDATE',
        context: gameContext
      });

      console.log('[Data Pipeline] Game context collected and stored:', {
        user: gameContext.user,
        villages: gameContext.allVillages.length,
        resources: gameContext.resources
      });
    } catch (error) {
      console.error('[Data Pipeline] Error collecting data:', error);
    }
  }

  private setupChatIntegration() {
    // Monitor for chat UI elements
    const checkForChat = () => {
      const chatContainer = document.querySelector('#travian-ai-chat, .travian-ai-chat, [data-travian-chat]');
      
      if (chatContainer) {
        this.enhanceChatWithContext(chatContainer as HTMLElement);
      }
    };

    // Check periodically for chat UI
    setInterval(checkForChat, 1000);
  }

  private enhanceChatWithContext(chatContainer: HTMLElement) {
    // Add data attribute with current context
    const context = dataScraper.prepareContextForAI();
    chatContainer.setAttribute('data-game-context', context);

    // Intercept send button clicks
    const sendButton = chatContainer.querySelector('[data-send], .send-button, button[type="submit"]');
    if (sendButton && !sendButton.hasAttribute('data-enhanced')) {
      sendButton.setAttribute('data-enhanced', 'true');
      
      sendButton.addEventListener('click', (e) => {
        this.injectContextIntoMessage();
      });
    }

    // Intercept Enter key in input
    const input = chatContainer.querySelector('input[type="text"], textarea');
    if (input && !input.hasAttribute('data-enhanced')) {
      input.setAttribute('data-enhanced', 'true');
      
      input.addEventListener('keypress', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' && !(e as KeyboardEvent).shiftKey) {
          this.injectContextIntoMessage();
        }
      });
    }
  }

  private injectContextIntoMessage() {
    // Get fresh game context
    const context = dataScraper.scrapeGameContext();
    
    // Send context with message
    chrome.runtime.sendMessage({
      type: 'CHAT_MESSAGE_WITH_CONTEXT',
      gameContext: context,
      timestamp: Date.now()
    });

    console.log('[Data Pipeline] Injected game context into chat message');
  }

  private setupMessageListeners() {
    // Listen for requests from chat or background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'GET_GAME_CONTEXT') {
        const context = dataScraper.scrapeGameContext();
        sendResponse({ success: true, context });
        console.log('[Data Pipeline] Provided game context on request');
      } else if (request.type === 'REQUEST_USER_EMAIL') {
        this.checkAndRequestUserEmail();
        sendResponse({ success: true });
      } else if (request.type === 'REFRESH_DATA') {
        this.collectAndStoreData();
        sendResponse({ success: true });
      }
      return true; // Keep channel open for async response
    });
  }

  // Public method to get current context
  getCurrentContext() {
    return dataScraper.scrapeGameContext();
  }

  // Public method to get AI-formatted context
  getAIContext(): string {
    return dataScraper.prepareContextForAI();
  }

  // Cleanup method
  destroy() {
    if (this.scrapeInterval) {
      clearInterval(this.scrapeInterval);
      this.scrapeInterval = null;
    }
    console.log('[Data Pipeline] Integration destroyed');
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined' && window.location.hostname.includes('travian')) {
  console.log('[Data Pipeline] Detected Travian game page, initializing...');
  const pipeline = DataPipelineIntegration.getInstance();
  
  // Export for debugging
  (window as any).travianDataPipeline = pipeline;
}

export const dataPipeline = DataPipelineIntegration.getInstance();
