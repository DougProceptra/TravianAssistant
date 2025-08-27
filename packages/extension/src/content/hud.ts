// packages/extension/src/content/hud.ts
// HUD overlay for displaying recommendations

export interface HUDConfig {
  position?: { x: number; y: number };
  expanded?: boolean;
  visible?: boolean;
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  action?: string;
  timestamp: Date;
}

export class HUD {
  private container: HTMLElement;
  private recommendations: Recommendation[] = [];
  private config: HUDConfig = {
    position: { x: 10, y: 60 },
    expanded: true,
    visible: true
  };
  private version: string = '';

  constructor() {
    this.container = this.createElement();
    this.attachToPage();
    this.loadConfig();
    this.makeMovable();
  }

  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'tla-hud';
    container.className = 'tla-hud';
    container.innerHTML = `
      <div class="tla-hud-header">
        <span class="tla-hud-title">TravianAssistant <span class="tla-version"></span></span>
        <div class="tla-hud-controls">
          <button class="tla-hud-minimize">_</button>
          <button class="tla-hud-close">×</button>
        </div>
      </div>
      <div class="tla-hud-content">
        <div class="tla-hud-recommendations">
          <div class="tla-hud-empty">Loading recommendations...</div>
        </div>
      </div>
    `;
    
    // Add event listeners
    const minimize = container.querySelector('.tla-hud-minimize') as HTMLElement;
    const close = container.querySelector('.tla-hud-close') as HTMLElement;
    const content = container.querySelector('.tla-hud-content') as HTMLElement;
    
    minimize?.addEventListener('click', () => {
      this.config.expanded = !this.config.expanded;
      content.style.display = this.config.expanded ? 'block' : 'none';
      minimize.textContent = this.config.expanded ? '_' : '□';
      this.saveConfig();
    });
    
    close?.addEventListener('click', () => {
      this.config.visible = false;
      container.style.display = 'none';
      this.saveConfig();
    });
    
    return container;
  }

  private attachToPage() {
    document.body.appendChild(this.container);
    this.applyStyles();
  }

  private applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .tla-hud {
        position: fixed;
        top: ${this.config.position?.y || 60}px;
        left: ${this.config.position?.x || 10}px;
        width: 320px;
        background: rgba(20, 20, 20, 0.95);
        border: 2px solid #8B4513;
        border-radius: 8px;
        color: #fff;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }
      
      .tla-hud-header {
        background: linear-gradient(135deg, #8B4513, #A0522D);
        padding: 8px 12px;
        border-radius: 6px 6px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      }
      
      .tla-hud-title {
        font-weight: bold;
        font-size: 16px;
      }
      
      .tla-version {
        font-size: 12px;
        opacity: 0.8;
        margin-left: 4px;
      }
      
      .tla-hud-controls {
        display: flex;
        gap: 5px;
      }
      
      .tla-hud-controls button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fff;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: all 0.2s;
      }
      
      .tla-hud-controls button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
      
      .tla-hud-content {
        padding: 12px;
        max-height: 400px;
        overflow-y: auto;
        display: ${this.config.expanded ? 'block' : 'none'};
      }
      
      .tla-hud-recommendations {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .tla-hud-recommendation {
        background: rgba(255, 255, 255, 0.05);
        padding: 8px;
        border-radius: 4px;
        border-left: 3px solid #8B4513;
      }
      
      .tla-hud-recommendation.priority-critical {
        border-left-color: #ff4444;
        background: rgba(255, 68, 68, 0.1);
      }
      
      .tla-hud-recommendation.priority-high {
        border-left-color: #ff9944;
        background: rgba(255, 153, 68, 0.1);
      }
      
      .tla-hud-recommendation.priority-medium {
        border-left-color: #ffcc44;
        background: rgba(255, 204, 68, 0.1);
      }
      
      .tla-hud-recommendation.priority-low {
        border-left-color: #44ff44;
        background: rgba(68, 255, 68, 0.1);
      }
      
      .tla-hud-category {
        font-size: 11px;
        text-transform: uppercase;
        opacity: 0.7;
        margin-bottom: 4px;
      }
      
      .tla-hud-message {
        font-size: 13px;
        line-height: 1.4;
      }
      
      .tla-hud-action {
        margin-top: 4px;
        font-size: 12px;
        color: #ffcc44;
        cursor: pointer;
      }
      
      .tla-hud-action:hover {
        text-decoration: underline;
      }
      
      .tla-hud-empty {
        text-align: center;
        opacity: 0.5;
        padding: 20px;
      }
    `;
    document.head.appendChild(style);
  }

  private makeMovable() {
    const header = this.container.querySelector('.tla-hud-header') as HTMLElement;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragOffset.x = e.clientX - this.container.offsetLeft;
      dragOffset.y = e.clientY - this.container.offsetTop;
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
      
      this.config.position = { x, y };
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.saveConfig();
      }
    });
  }

  public setVersion(version: string) {
    this.version = version;
    const versionElement = this.container.querySelector('.tla-version') as HTMLElement;
    if (versionElement) {
      versionElement.textContent = `v${version}`;
    }
  }

  public updateRecommendations(recommendations: Recommendation[]) {
    this.recommendations = recommendations;
    this.render();
  }

  private render() {
    const container = this.container.querySelector('.tla-hud-recommendations') as HTMLElement;
    
    if (this.recommendations.length === 0) {
      container.innerHTML = '<div class="tla-hud-empty">No recommendations available</div>';
      return;
    }
    
    container.innerHTML = this.recommendations
      .sort((a, b) => {
        const priorities = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorities[a.priority] - priorities[b.priority];
      })
      .map(rec => `
        <div class="tla-hud-recommendation priority-${rec.priority}">
          <div class="tla-hud-category">${rec.category}</div>
          <div class="tla-hud-message">${rec.message}</div>
          ${rec.action ? `<div class="tla-hud-action">${rec.action}</div>` : ''}
        </div>
      `)
      .join('');
  }

  private async loadConfig() {
    try {
      const stored = await chrome.storage.local.get(['hudConfig']);
      if (stored.hudConfig) {
        this.config = { ...this.config, ...stored.hudConfig };
        this.applyConfig();
      }
    } catch (error) {
      console.error('[TLA HUD] Failed to load config:', error);
    }
  }

  private async saveConfig() {
    try {
      await chrome.storage.local.set({ hudConfig: this.config });
    } catch (error) {
      console.error('[TLA HUD] Failed to save config:', error);
    }
  }

  private applyConfig() {
    if (this.config.position) {
      this.container.style.left = `${this.config.position.x}px`;
      this.container.style.top = `${this.config.position.y}px`;
    }
    
    const content = this.container.querySelector('.tla-hud-content') as HTMLElement;
    if (content) {
      content.style.display = this.config.expanded ? 'block' : 'none';
    }
    
    this.container.style.display = this.config.visible ? 'block' : 'none';
  }

  public show() {
    this.config.visible = true;
    this.container.style.display = 'block';
    this.saveConfig();
  }

  public hide() {
    this.config.visible = false;
    this.container.style.display = 'none';
    this.saveConfig();
  }

  public addRecommendation(recommendation: Recommendation) {
    this.recommendations.push(recommendation);
    this.render();
  }

  public clearRecommendations() {
    this.recommendations = [];
    this.render();
  }
}

export function createHUD(): HUD {
  return new HUD();
}