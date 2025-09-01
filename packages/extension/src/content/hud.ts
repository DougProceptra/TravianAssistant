// HUD Module - Displays strategic recommendations
// v1.0.6 - Enhanced with real multi-village data display

export interface HUDRecommendation {
  priority: 'high' | 'medium' | 'low';
  text: string;
  action?: string;
}

export class TravianHUD {
  private container: HTMLDivElement;
  private recommendations: string[] = [];
  private version: string = '1.0.6';
  private isMinimized: boolean = false;
  private isDragging: boolean = false;
  private dragOffset = { x: 0, y: 0 };
  
  constructor() {
    this.container = this.createHUD();
    this.attachEventListeners();
    this.loadPosition();
  }
  
  private createHUD(): HTMLDivElement {
    const hud = document.createElement('div');
    hud.id = 'travian-assistant-hud';
    hud.innerHTML = `
      <div class="ta-hud-header">
        <span class="ta-hud-title">TravianAssistant v${this.version}</span>
        <div class="ta-hud-controls">
          <button class="ta-minimize-btn">_</button>
          <button class="ta-close-btn">×</button>
        </div>
      </div>
      <div class="ta-hud-content">
        <div class="ta-data-quality">
          <span class="ta-quality-label">Data Quality:</span>
          <span class="ta-quality-value">0%</span>
          <div class="ta-quality-bar">
            <div class="ta-quality-fill" style="width: 0%"></div>
          </div>
        </div>
        <div class="ta-recommendations">
          <div class="ta-loading">Collecting game data...</div>
        </div>
        <div class="ta-villages-summary">
          <h4>Villages Overview</h4>
          <div class="ta-villages-list"></div>
        </div>
        <div class="ta-priorities">
          <h4>Current Priorities</h4>
          <ul class="ta-priorities-list"></ul>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #travian-assistant-hud {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 350px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #0f3460;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #e8e8e8;
        transition: all 0.3s ease;
      }
      
      #travian-assistant-hud.minimized {
        height: auto !important;
      }
      
      #travian-assistant-hud.minimized .ta-hud-content {
        display: none;
      }
      
      .ta-hud-header {
        background: linear-gradient(90deg, #0f3460 0%, #53354a 100%);
        padding: 12px 15px;
        border-radius: 10px 10px 0 0;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
      }
      
      .ta-hud-title {
        font-weight: 600;
        font-size: 14px;
        color: #00fff0;
        text-shadow: 0 0 10px rgba(0, 255, 240, 0.5);
      }
      
      .ta-hud-controls {
        display: flex;
        gap: 8px;
      }
      
      .ta-hud-controls button {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 4px 10px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 16px;
        transition: all 0.2s;
      }
      
      .ta-hud-controls button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }
      
      .ta-hud-content {
        padding: 15px;
        max-height: 600px;
        overflow-y: auto;
      }
      
      .ta-data-quality {
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
      }
      
      .ta-quality-label {
        font-size: 12px;
        color: #aaa;
      }
      
      .ta-quality-value {
        font-size: 14px;
        font-weight: bold;
        color: #00fff0;
        margin-left: 8px;
      }
      
      .ta-quality-bar {
        margin-top: 8px;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .ta-quality-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #00d2d3);
        transition: width 0.5s ease;
      }
      
      .ta-recommendations {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
        min-height: 60px;
      }
      
      .ta-recommendations .ta-loading {
        color: #888;
        font-style: italic;
        text-align: center;
      }
      
      .ta-recommendation-item {
        padding: 8px 10px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.05);
        border-left: 3px solid #00fff0;
        border-radius: 4px;
        font-size: 13px;
        line-height: 1.4;
      }
      
      .ta-villages-summary {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 15px;
      }
      
      .ta-villages-summary h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #00fff0;
        font-weight: 600;
      }
      
      .ta-villages-list {
        font-size: 12px;
      }
      
      .ta-village-item {
        padding: 6px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .ta-village-item:last-child {
        border-bottom: none;
      }
      
      .ta-village-name {
        color: #feca57;
        font-weight: 500;
      }
      
      .ta-village-stats {
        color: #aaa;
        font-size: 11px;
        margin-top: 2px;
      }
      
      .ta-priorities {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 12px;
      }
      
      .ta-priorities h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #ff6b6b;
        font-weight: 600;
      }
      
      .ta-priorities-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 12px;
      }
      
      .ta-priorities-list li {
        padding: 6px 0;
        padding-left: 20px;
        position: relative;
        color: #ddd;
      }
      
      .ta-priorities-list li:before {
        content: "⚠";
        position: absolute;
        left: 0;
        color: #feca57;
      }
      
      /* Custom scrollbar */
      .ta-hud-content::-webkit-scrollbar {
        width: 6px;
      }
      
      .ta-hud-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }
      
      .ta-hud-content::-webkit-scrollbar-thumb {
        background: rgba(0, 255, 240, 0.3);
        border-radius: 3px;
      }
      
      .ta-hud-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 255, 240, 0.5);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(hud);
    
    return hud;
  }
  
  private attachEventListeners(): void {
    const header = this.container.querySelector('.ta-hud-header') as HTMLElement;
    const minimizeBtn = this.container.querySelector('.ta-minimize-btn') as HTMLButtonElement;
    const closeBtn = this.container.querySelector('.ta-close-btn') as HTMLButtonElement;
    
    // Drag functionality
    header.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      
      this.isDragging = true;
      this.dragOffset.x = e.clientX - this.container.offsetLeft;
      this.dragOffset.y = e.clientY - this.container.offsetTop;
      
      document.addEventListener('mousemove', this.handleDrag);
      document.addEventListener('mouseup', this.handleDragEnd);
    });
    
    // Minimize/Maximize
    minimizeBtn.addEventListener('click', () => {
      this.isMinimized = !this.isMinimized;
      this.container.classList.toggle('minimized');
      minimizeBtn.textContent = this.isMinimized ? '□' : '_';
      this.savePosition();
    });
    
    // Close (hide)
    closeBtn.addEventListener('click', () => {
      this.container.style.display = 'none';
      this.savePosition();
    });
  }
  
  private handleDrag = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    
    e.preventDefault();
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    // Keep within viewport
    const maxX = window.innerWidth - this.container.offsetWidth;
    const maxY = window.innerHeight - this.container.offsetHeight;
    
    this.container.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    this.container.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    this.container.style.right = 'auto';
  };
  
  private handleDragEnd = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    this.savePosition();
  };
  
  private savePosition(): void {
    const position = {
      left: this.container.style.left,
      top: this.container.style.top,
      minimized: this.isMinimized,
      hidden: this.container.style.display === 'none'
    };
    localStorage.setItem('ta-hud-position', JSON.stringify(position));
  }
  
  private loadPosition(): void {
    const saved = localStorage.getItem('ta-hud-position');
    if (saved) {
      try {
        const position = JSON.parse(saved);
        if (position.left) this.container.style.left = position.left;
        if (position.top) this.container.style.top = position.top;
        if (position.left || position.top) this.container.style.right = 'auto';
        if (position.minimized) {
          this.isMinimized = true;
          this.container.classList.add('minimized');
          const minimizeBtn = this.container.querySelector('.ta-minimize-btn') as HTMLButtonElement;
          if (minimizeBtn) minimizeBtn.textContent = '□';
        }
        if (position.hidden) {
          this.container.style.display = 'none';
        }
      } catch (e) {
        console.error('[TravianAssistant] Failed to load HUD position:', e);
      }
    }
  }
  
  public updateRecommendations(recommendations: string[]): void {
    this.recommendations = recommendations;
    const container = this.container.querySelector('.ta-recommendations');
    
    if (!container) return;
    
    if (recommendations.length === 0) {
      container.innerHTML = '<div class="ta-loading">Analyzing game state...</div>';
    } else {
      container.innerHTML = recommendations
        .map(rec => `<div class="ta-recommendation-item">${rec}</div>`)
        .join('');
    }
  }
  
  public updateVillages(villages: any[]): void {
    const container = this.container.querySelector('.ta-villages-list');
    if (!container) return;
    
    if (villages.length === 0) {
      container.innerHTML = '<div style="color: #888;">No villages detected</div>';
    } else {
      container.innerHTML = villages
        .map(v => `
          <div class="ta-village-item">
            <div class="ta-village-name">${v.name} (${v.coordinates?.x || 0}|${v.coordinates?.y || 0})</div>
            <div class="ta-village-stats">
              Pop: ${v.population || 0} | 
              Prod: +${v.production?.wood || 0}/+${v.production?.clay || 0}/+${v.production?.iron || 0}/+${v.production?.cropNet || 0}
            </div>
          </div>
        `)
        .join('');
    }
  }
  
  public updatePriorities(priorities: string[]): void {
    const container = this.container.querySelector('.ta-priorities-list');
    if (!container) return;
    
    if (priorities.length === 0) {
      container.innerHTML = '<li style="color: #888;">No urgent priorities</li>';
    } else {
      container.innerHTML = priorities
        .slice(0, 5) // Show top 5 priorities
        .map(p => `<li>${p}</li>`)
        .join('');
    }
  }
  
  public updateDataQuality(quality: number): void {
    const valueElement = this.container.querySelector('.ta-quality-value') as HTMLElement;
    const fillElement = this.container.querySelector('.ta-quality-fill') as HTMLElement;
    
    if (valueElement) {
      valueElement.textContent = `${quality}%`;
    }
    
    if (fillElement) {
      fillElement.style.width = `${quality}%`;
    }
  }
  
  public setVersion(version: string): void {
    this.version = version;
    const titleElement = this.container.querySelector('.ta-hud-title');
    if (titleElement) {
      titleElement.textContent = `TravianAssistant v${version}`;
    }
  }
  
  public show(): void {
    this.container.style.display = 'block';
    this.savePosition();
  }
  
  public hide(): void {
    this.container.style.display = 'none';
    this.savePosition();
  }
  
  public destroy(): void {
    this.container.remove();
  }
}

// Factory function
export function createHUD(): TravianHUD {
  return new TravianHUD();
}
