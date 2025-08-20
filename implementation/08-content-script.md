# Content Script

## File: `src/content/index.ts`

The main content script that initializes the assistant on Travian game pages.

```typescript
import { StateCollector } from './state-collector';
import { SmartHUD } from './smart-hud';
import { GameState, Analysis, PlayerProfile } from '../shared/types';

class TravianAssistant {
  private collector: StateCollector;
  private hud: SmartHUD;
  private analysisInterval: number | null = null;
  private isActive = true;
  
  constructor() {
    this.collector = new StateCollector();
    this.hud = new SmartHUD();
    
    this.initialize();
  }
  
  private async initialize() {
    // Check if we're on a Travian game page
    if (!this.isGamePage()) {
      console.log('TravianAssistant: Not a game page, skipping initialization');
      return;
    }
    
    console.log('TravianAssistant: Initializing on game page');
    
    // Set up message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request);
    });
    
    // Initial analysis
    await this.performAnalysis();
    
    // Set up periodic analysis (every 60 seconds)
    this.analysisInterval = window.setInterval(() => {
      if (this.isActive) {
        this.performAnalysis();
      }
    }, 60000);
    
    // Listen for page changes (Travian uses AJAX)
    this.observePageChanges();
    
    // Show HUD
    this.showHUD();
  }
  
  private isGamePage(): boolean {
    // Check if we're on a game page (not login/lobby)
    return !!(
      document.querySelector('#villageList') ||
      document.querySelector('#navigation') ||
      document.querySelector('.serverTime') ||
      document.querySelector('#sidebarBoxVillagelist')
    );
  }
  
  private async performAnalysis() {
    try {
      const gameState = this.collector.collect();
      
      // Send to background for analysis
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_GAME_STATE',
        gameState
      });
      
      if (response.error) {
        console.error('Analysis error:', response.error);
        this.showError(response.error);
      } else if (response.analysis) {
        this.hud.render(response.analysis, response.profile);
      }
    } catch (error) {
      console.error('Failed to perform analysis:', error);
    }
  }
  
  private handleMessage(request: any) {
    switch (request.type) {
      case 'ANALYSIS_READY':
        this.hud.render(request.analysis, request.profile);
        break;
        
      case 'ANSWER_READY':
        this.hud.showAnswer(request.answer);
        break;
        
      case 'TOGGLE_HUD':
        this.toggleHUD();
        break;
    }
  }
  
  private observePageChanges() {
    // Observe for AJAX page changes
    const observer = new MutationObserver((mutations) => {
      // Check if significant content changed
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if game content area changed
          const target = mutation.target as HTMLElement;
          if (target.id === 'content' || target.classList.contains('contentContainer')) {
            console.log('Page content changed, re-analyzing...');
            setTimeout(() => this.performAnalysis(), 1000); // Wait for content to settle
            break;
          }
        }
      }
    });
    
    // Start observing
    const contentArea = document.querySelector('#content') || document.body;
    observer.observe(contentArea, {
      childList: true,
      subtree: true
    });
  }
  
  private showHUD() {
    // Get current analysis if available
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_ANALYSIS' }).then(response => {
      if (response.analysis) {
        this.hud.render(response.analysis, response.profile);
      } else {
        this.hud.render(null, response.profile);
      }
    });
  }
  
  private toggleHUD() {
    this.isActive = !this.isActive;
    if (this.isActive) {
      this.showHUD();
      this.performAnalysis();
    }
  }
  
  private showError(error: string) {
    // Create or update error notification
    let errorDiv = document.querySelector('.travian-ai-error') as HTMLElement;
    
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'travian-ai-error';
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10001;
        font-size: 14px;
        max-width: 300px;
      `;
      document.body.appendChild(errorDiv);
    }
    
    errorDiv.textContent = error;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TravianAssistant());
} else {
  new TravianAssistant();
}
```

## Key Features

- **Auto-initialization**: Detects game pages automatically
- **Periodic Analysis**: Updates every 60 seconds
- **AJAX Detection**: Re-analyzes when page content changes
- **Error Handling**: User-friendly error notifications
- **HUD Management**: Controls overlay display

## Page Detection

The script identifies Travian game pages by looking for specific elements:
- `#villageList` - Village selector
- `#navigation` - Main navigation menu
- `.serverTime` - Server time display
- `#sidebarBoxVillagelist` - Sidebar village list

## Communication Flow

1. Content script collects game state
2. Sends to background service worker
3. Background calls Claude API
4. Analysis returned to content script
5. HUD displays recommendations

## Performance Optimizations

- Debounced page change detection
- Cached analysis results
- Minimal DOM manipulation
- Efficient event listeners