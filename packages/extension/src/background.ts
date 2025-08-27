// packages/extension/src/background.ts
// v0.8.0 - Updated to use local V3 backend

import { backendSync } from './background/backend-sync';
import { VERSION } from './version';

console.log(`[TLA BG] Background service starting... v${VERSION}`);

// Use local backend for chat
const LOCAL_BACKEND_URL = 'http://localhost:3000';
const VERCEL_PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

class BackgroundService {
  private backendUrl: string = LOCAL_BACKEND_URL;
  private initialized: boolean = false;
  private sessionId: string = `session-${Date.now()}`;

  constructor() {
    console.log(`[TLA BG] Constructing background service v${VERSION}`);
    this.initialize().catch(err => {
      console.error('[TLA BG] Failed to initialize:', err);
    });
  }

  private async initialize() {
    if (this.initialized) {
      console.log('[TLA BG] Already initialized');
      return;
    }

    try {
      // Check if backend is accessible
      const healthCheck = await fetch(`${this.backendUrl}/health`).catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        console.warn('[TLA BG] Local backend not accessible, chat will be limited');
      } else {
        const health = await healthCheck.json();
        console.log('[TLA BG] Backend connected:', health);
      }
      
      // Check stored settings
      const stored = await chrome.storage.sync.get(['userEmail', 'backendUrl']);
      if (stored.backendUrl) {
        this.backendUrl = stored.backendUrl;
        console.log('[TLA BG] Using custom backend URL:', this.backendUrl);
      }
      
      if (stored.userEmail) {
        console.log('[TLA BG] User email found:', stored.userEmail);
      }
    } catch (err) {
      console.error('[TLA BG] Storage/initialization error:', err);
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
    console.log('[TLA BG] Background service initialized');
    console.log('[TLA BG] Backend URL:', this.backendUrl);
    console.log('[TLA BG] Version:', VERSION);
  }

  private async handleMessage(request: any, sender: any): Promise<any> {
    console.log('[TLA BG] Handling message type:', request.type);
    
    switch (request.type) {
      case 'PING':
        return { success: true, message: `TravianAssistant v${VERSION} is running` };

      case 'SET_USER_EMAIL':
        try {
          await chrome.storage.sync.set({ userEmail: request.email });
          // Initialize chat session with backend
          const response = await fetch(`${this.backendUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: 'Initialize user',
              email: request.email,
              sessionId: this.sessionId
            })
          });
          
          if (response.ok) {
            return { success: true, userId: request.email };
          }
          return { success: true, userId: request.email, backendStatus: 'offline' };
        } catch (error: any) {
          // Backend might be offline, but we can still store the email
          await chrome.storage.sync.set({ userEmail: request.email });
          return { success: true, userId: request.email, backendStatus: 'offline' };
        }

      case 'CHAT_MESSAGE':
        try {
          console.log('[TLA BG] Processing chat message...');
          const { message, gameState } = request;
          
          // Get stored email
          const stored = await chrome.storage.sync.get(['userEmail']);
          
          // Call local backend
          const response = await fetch(`${this.backendUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              email: stored.userEmail || 'anonymous',
              gameState: gameState || {},
              sessionId: this.sessionId
            })
          });
          
          if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
          }
          
          const data = await response.json();
          return { 
            success: true, 
            response: data.response,
            recommendations: data.recommendations 
          };
        } catch (error: any) {
          console.error('[TLA BG] Chat failed:', error);
          // Fallback to simple response if backend is offline
          return { 
            success: true, 
            response: "I'm currently offline. Please ensure the TravianAssistant backend is running on port 3000. You can start it with: cd backend && npm run server"
          };
        }

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
          
          // Send to backend for analysis
          const response = await fetch(`${this.backendUrl}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameState })
          });
          
          if (response.ok) {
            const data = await response.json();
            return { 
              success: true, 
              recommendations: data.recommendations,
              metrics: data.metrics 
            };
          }
          
          return { success: false, error: 'Backend sync failed' };
        } catch (error: any) {
          console.log('[TLA BG] Backend sync skipped:', error.message);
          return { success: false, error: error.message };
        }

      case 'SYNC_MAP':
        try {
          // Trigger map sync on backend
          const response = await fetch(`${this.backendUrl}/api/sync-map`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          
          if (response.ok) {
            const data = await response.json();
            return { success: true, stats: data.stats };
          }
          
          return { success: false, error: 'Map sync failed' };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'GET_EXAMPLE_PROMPTS':
        return { 
          success: true, 
          prompts: [
            "What should I focus on right now?",
            "Analyze my current resource production",
            "When should I settle my next village?",
            "What troops should I build?",
            "How can I improve my defense?",
            "What's the optimal build order for this village?",
            "Should I join an alliance?",
            "How do I prepare for artifacts?"
          ]
        };

      case 'OPEN_SETTINGS':
        // Open settings page in new tab
        chrome.tabs.create({
          url: chrome.runtime.getURL('popup/settings.html')
        });
        return { success: true };

      default:
        console.log('[TLA BG] Unknown message type:', request.type);
        return { success: false, error: 'Unknown message type' };
    }
  }
}

// Initialize service
const bgService = new BackgroundService();

// Keep service alive with heartbeat
setInterval(() => {
  console.log(`[TLA BG] TravianAssistant service alive - v${VERSION}`);
  
  // Optionally check backend health
  fetch('http://localhost:3000/health')
    .then(res => res.json())
    .then(health => console.log('[TLA BG] Backend status:', health.status))
    .catch(() => console.log('[TLA BG] Backend offline'));
}, 60000); // Once per minute

console.log(`[TLA BG] Background script loaded - v${VERSION}`);