// Backend Sync Service
// Connects extension to local SQLite backend

import { EnhancedGameState } from '../content/enhanced-scraper';

class BackendSync {
  private apiUrl: string = 'http://localhost:3001/api';
  private wsUrl: string = 'ws://localhost:3002';
  private ws: WebSocket | null = null;
  private accountId: string = '';
  private syncInterval: number | null = null;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    console.log('[TLA Backend] Initializing backend sync');
    
    // Get or create account ID
    const stored = await chrome.storage.local.get(['accountId', 'serverUrl']);
    
    if (!stored.accountId) {
      // Generate account ID from server URL
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tabs[0]?.url || '';
      const hostname = new URL(url).hostname;
      this.accountId = `account_${hostname.replace(/\./g, '_')}_${Date.now()}`;
      
      await chrome.storage.local.set({ 
        accountId: this.accountId,
        serverUrl: hostname 
      });
      
      // Create account in backend
      await this.createAccount(hostname);
    } else {
      this.accountId = stored.accountId;
    }
    
    // Connect WebSocket
    this.connectWebSocket();
    
    // Start periodic sync (every 5 minutes)
    this.startPeriodicSync();
    
    console.log('[TLA Backend] Initialized with account:', this.accountId);
  }
  
  private async createAccount(serverUrl: string) {
    try {
      const response = await fetch(`${this.apiUrl}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: this.accountId,
          serverUrl,
          accountName: 'Player',
          tribe: 'Unknown'
        })
      });
      
      const result = await response.json();
      console.log('[TLA Backend] Account created:', result);
    } catch (error) {
      console.error('[TLA Backend] Failed to create account:', error);
    }
  }
  
  private connectWebSocket() {
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('[TLA Backend] WebSocket connected');
        // Register account
        this.ws?.send(JSON.stringify({
          type: 'register',
          accountId: this.accountId
        }));
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[TLA Backend] WebSocket message:', data);
          
          if (data.type === 'request_sync') {
            // Backend requesting fresh data
            this.requestFreshSync();
          }
        } catch (error) {
          console.error('[TLA Backend] WebSocket message error:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[TLA Backend] WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('[TLA Backend] WebSocket disconnected, reconnecting in 5s...');
        setTimeout(() => this.connectWebSocket(), 5000);
      };
      
    } catch (error) {
      console.error('[TLA Backend] WebSocket connection failed:', error);
    }
  }
  
  public async syncGameState(gameState: EnhancedGameState): Promise<any> {
    if (!this.accountId) {
      console.error('[TLA Backend] No account ID');
      return { success: false, error: 'No account ID' };
    }
    
    try {
      // Convert Map to array for JSON serialization
      const villages = Array.from(gameState.villages.values());
      
      const response = await fetch(`${this.apiUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: this.accountId,
          villages,
          timestamp: gameState.timestamp
        })
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[TLA Backend] Sync complete:', result);
      
      // Return alerts for display
      return {
        success: true,
        alerts: result.alerts || [],
        stats: {
          villagesUpdated: result.villagesUpdated || 0
        }
      };
      
    } catch (error) {
      console.error('[TLA Backend] Sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  public async getAccountOverview(): Promise<any> {
    if (!this.accountId) {
      return null;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/account/${this.accountId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get account: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('[TLA Backend] Failed to get account overview:', error);
      return null;
    }
  }
  
  public async getVillageHistory(villageId: string, hours: number = 24): Promise<any[]> {
    try {
      const dbVillageId = `${this.accountId}_${villageId}`;
      const response = await fetch(`${this.apiUrl}/history/${dbVillageId}?hours=${hours}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get history: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('[TLA Backend] Failed to get village history:', error);
      return [];
    }
  }
  
  public async resolveAlert(alertId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/alert/${alertId}/resolve`, {
        method: 'PATCH'
      });
      
      return response.ok;
      
    } catch (error) {
      console.error('[TLA Backend] Failed to resolve alert:', error);
      return false;
    }
  }
  
  private startPeriodicSync() {
    // Clear existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.requestFreshSync();
    }, 5 * 60 * 1000) as any;
  }
  
  private async requestFreshSync() {
    // Send message to content script to collect fresh data
    const tabs = await chrome.tabs.query({ url: '*://*.travian.com/*' });
    
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id!, {
        type: 'REQUEST_FRESH_SYNC'
      });
    }
  }
}

// Export singleton instance
export const backendSync = new BackendSync();