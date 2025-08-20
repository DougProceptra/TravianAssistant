# Background Service Worker

## File: `src/background/index.ts`

The background service worker handles all communication between the content script, options page, and Claude API.

```typescript
import { ClaudeService } from './claude-service';
import { ProfileManager } from './profile-manager';
import { GameState, PlayerProfile, Analysis } from '../shared/types';

class BackgroundService {
  private claude: ClaudeService | null = null;
  private profileManager: ProfileManager;
  private currentAnalysis: Analysis | null = null;
  private lastGameState: GameState | null = null;
  
  constructor() {
    this.profileManager = new ProfileManager();
    this.initializeService();
    this.setupMessageHandlers();
  }
  
  private async initializeService() {
    // Get API key from storage
    const result = await chrome.storage.local.get(['apiKey']);
    if (result.apiKey) {
      this.claude = new ClaudeService(result.apiKey);
    }
  }
  
  private setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender).then(sendResponse);
      return true; // Keep channel open for async response
    });
  }
  
  private async handleMessage(request: any, sender: any) {
    switch (request.type) {
      case 'SET_API_KEY':
        return this.setApiKey(request.apiKey);
        
      case 'ANALYZE_GAME_STATE':
        return this.analyzeGameState(request.gameState);
        
      case 'REFRESH_ANALYSIS':
        if (this.lastGameState) {
          return this.analyzeGameState(this.lastGameState);
        }
        return { error: 'No game state available' };
        
      case 'GET_CURRENT_ANALYSIS':
        return {
          analysis: this.currentAnalysis,
          profile: await this.profileManager.getActiveProfile()
        };
        
      case 'ASK_QUESTION':
        return this.askQuestion(request.question);
        
      case 'SAVE_PROFILE':
        return this.profileManager.saveProfile(request.profile);
        
      case 'GET_PROFILES':
        return this.profileManager.getAllProfiles();
        
      case 'SET_ACTIVE_PROFILE':
        return this.profileManager.setActiveProfile(request.profileId);
        
      case 'IMPORT_PROFILE':
        return this.profileManager.importProfile(request.code);
        
      case 'EXPORT_PROFILE':
        return this.profileManager.exportProfile(request.profileId);
        
      case 'OPEN_SETTINGS':
        chrome.runtime.openOptionsPage();
        return { success: true };
        
      case 'EXECUTE_ACTION':
        return this.executeAction(request.action);
        
      default:
        return { error: 'Unknown message type' };
    }
  }
  
  private async setApiKey(apiKey: string) {
    await chrome.storage.local.set({ apiKey });
    this.claude = new ClaudeService(apiKey);
    return { success: true };
  }
  
  private async analyzeGameState(gameState: GameState) {
    if (!this.claude) {
      return { error: 'API key not set. Please configure in settings.' };
    }
    
    this.lastGameState = gameState;
    const profile = await this.profileManager.getActiveProfile();
    
    if (!profile) {
      return { error: 'No active profile. Please create one in settings.' };
    }
    
    try {
      const analysis = await this.claude.analyzeGameState(gameState, profile);
      this.currentAnalysis = analysis;
      
      // Send to all tabs
      const tabs = await chrome.tabs.query({ url: '*://*.travian.com/*' });
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ANALYSIS_READY',
            analysis,
            profile
          });
        }
      });
      
      return { analysis, profile };
    } catch (error) {
      console.error('Analysis error:', error);
      return { error: 'Failed to analyze game state' };
    }
  }
  
  private async askQuestion(question: string) {
    if (!this.claude || !this.lastGameState) {
      return { error: 'Not ready. Please refresh the page.' };
    }
    
    const profile = await this.profileManager.getActiveProfile();
    if (!profile) {
      return { error: 'No active profile' };
    }
    
    try {
      const answer = await this.claude.askQuestion(question, this.lastGameState, profile);
      
      // Send answer to content script
      const tabs = await chrome.tabs.query({ url: '*://*.travian.com/*' });
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ANSWER_READY',
            answer
          });
        }
      });
      
      return { answer };
    } catch (error) {
      console.error('Question error:', error);
      return { error: 'Failed to get answer' };
    }
  }
  
  private async executeAction(action: any) {
    console.log('Executing action:', action);
    // Here you would implement actual game automation
    // For now, just return success
    return { success: true, message: 'Action logged (automation not implemented)' };
  }
}

// Initialize service
new BackgroundService();
```

## Key Features

- **Message Router**: Handles all extension communication
- **State Management**: Maintains game state and analysis results
- **Profile Integration**: Coordinates with ProfileManager
- **Error Handling**: Graceful degradation when API unavailable
- **Tab Communication**: Broadcasts updates to all game tabs

## Message Types

| Message Type | Purpose | Response |
|-------------|---------|----------|
| SET_API_KEY | Store Claude API key | Success confirmation |
| ANALYZE_GAME_STATE | Analyze current game | Analysis + recommendations |
| REFRESH_ANALYSIS | Re-analyze last state | Updated analysis |
| GET_CURRENT_ANALYSIS | Get cached analysis | Current analysis + profile |
| ASK_QUESTION | Natural language Q&A | AI response text |
| SAVE_PROFILE | Save player profile | Saved profile |
| GET_PROFILES | List all profiles | Profile array |
| SET_ACTIVE_PROFILE | Change active profile | Success confirmation |
| IMPORT_PROFILE | Import shared profile | Imported profile |
| EXPORT_PROFILE | Export profile code | Shareable code |
| OPEN_SETTINGS | Open options page | Success confirmation |
| EXECUTE_ACTION | Execute game action | Action result |