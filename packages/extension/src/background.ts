// packages/extension/src/background.ts
// v0.6.0 - Chat-based AI with editable system messages

import { backendSync } from './background/backend-sync';
import TravianChatAI from './ai/ai-chat-client';

console.log('[TLA BG] Background service starting... v0.6.0 - Chat AI');

const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

class BackgroundService {
  private proxyUrl: string = PROXY_URL;
  private initialized: boolean = false;
  private chatAI: TravianChatAI;

  constructor() {
    console.log('[TLA BG] Constructing background service with Chat AI');
    this.chatAI = new TravianChatAI(this.proxyUrl);
    this.initialize().catch(err => {
      console.error('[TLA BG] Failed to initialize:', err);
    });
  }

  private async initialize() {
    if (this.initialized) {
      console.log('[TLA BG] Already initialized');
      return;
    }

    // Check if proxy URL is configured
    try {
      const stored = await chrome.storage.sync.get(['proxyUrl', 'userEmail']);
      if (stored.proxyUrl) {
        this.proxyUrl = stored.proxyUrl;
        this.chatAI = new TravianChatAI(this.proxyUrl);
        console.log('[TLA BG] Using custom proxy URL');
      }
      if (stored.userEmail) {
        await this.chatAI.initialize(stored.userEmail);
        console.log('[TLA BG] User ID initialized');
      }
    } catch (err) {
      console.error('[TLA BG] Storage error:', err);
    }

    // Set up message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[TLA BG] Message received:', request.type);
      
      // Handle message async
      this.handleMessage(request, sender)
        .then(response => {
          console.log('[TLA BG] Sending response:', response?.success ? 'success' : 'failed');
          sendResponse(response);
        })
        .catch(error => {
          console.error('[TLA BG] Handler error:', error);
          sendResponse({ success: false, error: error.message });
        });
      
      return true; // Keep channel open for async response
    });

    this.initialized = true;
    console.log('[TLA BG] Background service initialized with Chat AI');
    console.log('[TLA BG] Proxy URL:', this.proxyUrl);
  }

  private async handleMessage(request: any, sender: any): Promise<any> {
    console.log('[TLA BG] Handling message type:', request.type);
    
    switch (request.type) {
      case 'PING':
        return { success: true, message: 'Chat AI service is running' };

      case 'SET_USER_EMAIL':
        try {
          const userId = await this.chatAI.initialize(request.email);
          await chrome.storage.sync.set({ userEmail: request.email });
          return { success: true, userId };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'UPDATE_SYSTEM_MESSAGE':
        try {
          await this.chatAI.updateSystemMessage(request.message);
          return { success: true, message: 'System message updated' };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'CHAT_MESSAGE':
        try {
          console.log('[TLA BG] Processing chat message...');
          const gameState = request.gameState;
          const response = await this.chatAI.chat(request.message, gameState);
          return { success: true, response };
        } catch (error: any) {
          console.error('[TLA BG] Chat failed:', error);
          return { success: false, error: error.message };
        }

      case 'GET_EXAMPLE_PROMPTS':
        const prompts = this.chatAI.getExamplePrompts();
        return { success: true, prompts };

      case 'GET_SYSTEM_TEMPLATES':
        const templates = this.chatAI.getSystemMessageTemplates();
        return { success: true, templates };

      case 'OPEN_SETTINGS':
        // Open settings page in new tab
        chrome.tabs.create({
          url: chrome.runtime.getURL('popup/settings.html')
        });
        return { success: true };

      case 'GET_GAME_STATE':
        // Request game state from content script
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.id) {
            const response = await chrome.tabs.sendMessage(tabs[0].id, { 
              type: 'REQUEST_GAME_STATE' 
            });
            return { success: true, gameState: response };
          }
          return { success: false, error: 'No active tab' };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'SYNC_GAME_STATE':
        try {
          const gameState = request.gameState;
          // Optional backend sync
          let syncResult = { success: false };
          try {
            syncResult = await backendSync.syncGameState(gameState);
          } catch (err) {
            console.log('[TLA BG] Backend sync skipped:', err);
          }
          return { success: true, backendSync: syncResult.success };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      default:
        console.log('[TLA BG] Unknown message type:', request.type);
        return { success: false, error: 'Unknown message type' };
    }
  }
}

// Initialize service
const bgService = new BackgroundService();

// Keep service alive with less frequent heartbeat
setInterval(() => {
  console.log('[TLA BG] Chat AI service alive');
}, 60000); // Once per minute

console.log('[TLA BG] Chat AI background script loaded');