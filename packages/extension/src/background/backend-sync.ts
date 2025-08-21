// Backend Sync Service
// Connects extension to backend (local or remote)
// v0.4.4 - Configured for Replit deployment

import { EnhancedGameState } from '../content/enhanced-scraper';

class BackendSync {
  private apiUrl: string = '';
  private wsUrl: string = '';
  private ws: WebSocket | null = null;
  private accountId: string = '';
  private syncInterval: number | null = null;
  private isEnabled: boolean = false;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    console.log('[TLA Backend] Initializing backend sync');
    
    // Get backend URL from storage (can be configured in options)
    const stored = await chrome.storage.sync.get(['backendUrl', 'backendEnabled']);
    
    // Default to ENABLED with your Replit URL
    this.isEnabled = stored.backendEnabled !== false; // Default true
    
    if (!this.isEnabled) {
      console.log('[TLA Backend] Backend sync disabled');
      return;
    }
    
    // Use configured URL or YOUR REPLIT URL as default
    const baseUrl = stored.backendUrl || 'https://TravianAssistant.dougdostal.replit.dev';
    this.apiUrl = `${baseUrl}/api`;
    
    // Convert HTTP to WS for WebSocket
    const wsBase = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    // Replit uses same port for both HTTP and WebSocket
    this.wsUrl = wsBase;
    
    console.log('[TLA Backend] Using API URL:', this.apiUrl);
    console.log('[TLA Backend] Using WebSocket URL:', this.wsUrl);
    
    // Get or create account ID
    const accountStored = await chrome.storage.local.get(['accountId', 'serverUrl']);
    
    if (!accountStored.accountId) {
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
      this.accountId = accountStored.accountId;
    }
    
    // Only connect WebSocket if backend is enabled
    if (this.isEnabled) {
      this.connectWebSocket();
      this.startPeriodicSync();
    }
    
    console.log('[TLA Backend] Initialized with account:', this.accountId);
  }
  
  private async createAccount(serverUrl: string) {
    if (!this.isEnabled) return;
    
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
    if (!this.isEnabled) return;
    
    try {
      console.log('[TLA Backend] Connecting to WebSocket:', this.wsUrl);
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('[TLA Backend] WebSocket connected');
        // Authenticate with backend
        this.ws?.send(JSON.stringify({
          type: 'auth',
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
        console.log('[TLA Backend] WebSocket disconnected');
        if (this.isEnabled) {
          console.log('[TLA Backend] Will retry in 30 seconds...');
          setTimeout(() => this.connectWebSocket(), 30000);
        }
      };
      
    } catch (error) {
      console.error('[TLA Backend] WebSocket connection failed:', error);
    }
  }
  
  public async syncGameState(gameState: EnhancedGameState): Promise<any> {
    if (!this.isEnabled) {
      return { success: false, error: 'Backend sync disabled' };
    }
    
    if (!this.accountId) {
      console.error('[TLA Backend] No account ID');
      return { success: false, error: 'No account ID' };
    }
    
    try {
      // Convert Map to array for JSON serialization
      const villages = Array.from(gameState.villages.values());
      
      const response = await fetch(`${this.apiUrl}/villages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: this.accountId,
          village: villages[0], // Send first village for now
          villages, // Also send all villages
          timestamp: gameState.timestamp
        })
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[TLA Backend] Sync complete:', result);
      
      // Return success for display
      return {
        success: true,
        message: result.message || 'Data synced',
        timestamp: result.timestamp
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
    if (!this.isEnabled || !this.accountId) {
      return null;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/villages/${this.accountId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get account: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('[TLA Backend] Failed to get account overview:', error);
      return null;
    }
  }
  
  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      const data = await response.json();
      console.log('[TLA Backend] Health check:', data);
      return data.status === 'healthy';
    } catch (error) {
      console.error('[TLA Backend] Health check failed:', error);
      return false;
    }
  }
  
  public async getVillageHistory(villageId: string, hours: number = 24): Promise<any[]> {
    if (!this.isEnabled) return [];
    
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
    if (!this.isEnabled) return false;
    
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
    if (!this.isEnabled) return;
    
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
    if (!this.isEnabled) return;
    
    // Send message to content script to collect fresh data
    const tabs = await chrome.tabs.query({ url: '*://*.travian.com/*' });
    
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id!, {
        type: 'REQUEST_FRESH_SYNC'
      });
    }
  }
  
  // Method to update backend URL
  public async updateBackendUrl(url: string, enabled: boolean = true) {
    await chrome.storage.sync.set({ 
      backendUrl: url,
      backendEnabled: enabled 
    });
    
    // Reinitialize with new URL
    this.isEnabled = enabled;
    if (enabled) {
      const baseUrl = url;
      this.apiUrl = `${baseUrl}/api`;
      const wsBase = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      this.wsUrl = wsBase;
      
      // Reconnect WebSocket
      if (this.ws) {
        this.ws.close();
      }
      this.connectWebSocket();
    } else {
      // Disable backend
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    }
  }
}

// Export singleton instance
export const backendSync = new BackendSync();