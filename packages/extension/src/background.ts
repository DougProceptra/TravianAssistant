// packages/extension/src/background.ts
// v0.5.0 - Elite AI Integration

import { backendSync } from './background/backend-sync';
import TravianAIClient from './ai/ai-client';

console.log('[TLA BG] Background service starting... v0.5.0 - Elite AI');

const PROXY_URL = 'https://travian-proxy-simple.vercel.app/api/proxy';

class BackgroundService {
  private proxyUrl: string = PROXY_URL;
  private initialized: boolean = false;
  private aiClient: TravianAIClient;
  private lastContext: any = {};

  constructor() {
    console.log('[TLA BG] Constructing background service with Elite AI');
    this.aiClient = new TravianAIClient(this.proxyUrl);
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
      const stored = await chrome.storage.sync.get(['proxyUrl', 'aiContext']);
      if (stored.proxyUrl) {
        this.proxyUrl = stored.proxyUrl;
        this.aiClient = new TravianAIClient(this.proxyUrl);
        console.log('[TLA BG] Using custom proxy URL');
      }
      if (stored.aiContext) {
        this.lastContext = stored.aiContext;
        console.log('[TLA BG] Loaded AI context from storage');
      }
    } catch (err) {
      console.error('[TLA BG] Storage error:', err);
    }

    // Set up message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[TLA BG] Message received:', request.type);
      
      // Handle message async
      this.handleMessage(request)
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
    console.log('[TLA BG] Background service initialized with Elite AI');
    console.log('[TLA BG] Proxy URL:', this.proxyUrl);
    
    // Test proxy connection
    this.testProxyConnection();
  }

  private async testProxyConnection() {
    try {
      console.log('[TLA BG] Testing proxy connection...');
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      
      if (response.ok) {
        console.log('[TLA BG] Proxy connection successful!');
      } else {
        console.error('[TLA BG] Proxy returned error:', response.status);
      }
    } catch (err) {
      console.error('[TLA BG] Proxy connection test failed:', err);
    }
  }

  private async handleMessage(request: any): Promise<any> {
    console.log('[TLA BG] Handling message type:', request.type);
    
    switch (request.type) {
      case 'PING':
        return { success: true, message: 'Elite AI service is running' };

      case 'SET_PROXY_URL':
        this.proxyUrl = request.url;
        this.aiClient = new TravianAIClient(this.proxyUrl);
        await chrome.storage.sync.set({ proxyUrl: this.proxyUrl });
        return { success: true };

      case 'TEST_CONNECTION':
        try {
          const testState = {
            villages: new Map([['test', { villageName: 'Test Village' }]]),
            currentVillageId: 'test',
            serverAge: 86400,
            playerRank: 100,
            timestamp: Date.now()
          };
          const response = await this.aiClient.askQuestion(
            'Confirm connection with a brief competitive Travian insight.',
            testState
          );
          return { success: true, response };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case 'ANALYZE_GAME_STATE':
        try {
          console.log('[TLA BG] Analyzing game state with Elite AI...');
          const gameState = request.payload || request.state;
          const decisionType = request.decisionType || 'daily_review';
          
          // First sync to backend if available
          let syncResult = { success: false, alerts: [] };
          try {
            syncResult = await backendSync.syncGameState(gameState);
          } catch (err) {
            console.log('[TLA BG] Backend sync skipped:', err);
          }
          
          // Get Elite AI analysis
          const analysis = await this.aiClient.analyzeGameState(
            gameState,
            decisionType,
            this.lastContext
          );
          
          // Store patterns if significant
          if (analysis.confidence > 0.7 && analysis.insights) {
            await this.storePatterns(analysis.insights);
          }
          
          return { 
            success: true, 
            ...analysis,
            alerts: syncResult.alerts || [],
            backendSync: syncResult.success
          };
        } catch (error: any) {
          console.error('[TLA BG] Analysis failed:', error);
          return { success: false, error: error.message };
        }

      case 'ASK_AI_QUESTION':
        try {
          console.log('[TLA BG] Processing strategic question...');
          const gameState = request.gameState;
          const answer = await this.aiClient.askQuestion(
            request.question || request.prompt,
            gameState,
            this.lastContext
          );
          return { success: true, answer };
        } catch (error: any) {
          console.error('[TLA BG] Question failed:', error);
          return { success: false, error: error.message };
        }

      case 'STRATEGIC_ANALYSIS':
        try {
          console.log('[TLA BG] Running strategic analysis:', request.analysisType);
          const gameState = request.gameState;
          
          // Map analysis types to decision types
          const decisionMap: { [key: string]: string } = {
            'daily': 'daily_review',
            'attack': 'under_attack',
            'settlement': 'settlement',
            'resources': 'resource_crisis',
            'artifacts': 'artifact_prep'
          };
          
          const decisionType = decisionMap[request.analysisType] || 'daily_review';
          const analysis = await this.aiClient.analyzeGameState(
            gameState,
            decisionType,
            this.lastContext
          );
          
          return {
            success: true,
            ...analysis,
            analysisType: request.analysisType
          };
        } catch (error: any) {
          console.error('[TLA BG] Strategic analysis failed:', error);
          return { success: false, error: error.message };
        }

      case 'UPDATE_CONTEXT':
        try {
          // Store learned patterns and server intelligence
          const { patterns, serverMeta, playerProfiles } = request.context;
          this.lastContext = {
            ...this.lastContext,
            patterns: patterns || this.lastContext.patterns,
            serverMeta: serverMeta || this.lastContext.serverMeta,
            playerProfiles: playerProfiles || this.lastContext.playerProfiles
          };
          
          await chrome.storage.sync.set({ aiContext: this.lastContext });
          console.log('[TLA BG] AI context updated');
          
          return { success: true, message: 'Context updated' };
        } catch (error: any) {
          console.error('[TLA BG] Context update failed:', error);
          return { success: false, error: error.message };
        }

      default:
        console.log('[TLA BG] Unknown message type:', request.type);
        return { success: false, error: 'Unknown message type' };
    }
  }

  private async storePatterns(insights: string[]) {
    try {
      // Add timestamp to patterns
      const pattern = {
        timestamp: new Date().toISOString(),
        insights: insights
      };
      
      // Get existing patterns
      const stored = await chrome.storage.local.get(['patterns']);
      const patterns = stored.patterns || [];
      
      // Add new pattern (keep last 50)
      patterns.unshift(pattern);
      if (patterns.length > 50) {
        patterns.pop();
      }
      
      // Store updated patterns
      await chrome.storage.local.set({ patterns });
      console.log('[TLA BG] Stored', insights.length, 'new insights');
    } catch (error) {
      console.error('[TLA BG] Failed to store patterns:', error);
    }
  }
}

// Initialize service
const bgService = new BackgroundService();

// Keep service alive with less frequent heartbeat
setInterval(() => {
  console.log('[TLA BG] Elite AI service alive');
}, 60000); // Once per minute

console.log('[TLA BG] Elite AI background script loaded');