// packages/extension/src/content/smart-hud.ts
import { Analysis, Recommendation } from '../lib/types';

export class SmartHUD {
  private container: HTMLElement | null = null;
  private isMinimized = false;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private position = { x: 20, y: 20 };
  private recommendations: Recommendation[] = [];
  private lastAnalysis: Analysis | null = null;

  constructor() {
    this.loadPosition();
  }

  render() {
    // Remove existing HUD if present
    this.destroy();

    // Create HUD container
    this.container = document.createElement('div');
    this.container.className = 'travian-ai-hud';
    this.container.innerHTML = this.getHUDHTML();
    
    // Add styles
    this.injectStyles();
    
    // Add to page
    document.body.appendChild(this.container);
    
    // Set position
    this.updatePosition();
    
    // Attach event listeners
    this.attachEventListeners();
  }

  private getHUDHTML(): string {
    return `
      <div class="tai-header">
        <div class="tai-title">
          <span class="tai-icon">🤖</span>
          <span>AI Assistant</span>
        </div>
        <div class="tai-controls">
          <button class="tai-refresh" title="Analyze Now">🔄</button>
          <button class="tai-minimize" title="Minimize">_</button>
          <button class="tai-close" title="Close">✕</button>
        </div>
      </div>
      
      <div class="tai-content">
        <div class="tai-recommendations">
          ${this.renderRecommendations()}
        </div>
        
        <div class="tai-chat">
          <input type="text" class="tai-chat-input" 
                 placeholder="Ask about your game strategy..." />
          <button class="tai-chat-send">Ask</button>
        </div>
        
        <div class="tai-status">
          <span class="tai-credits">Credits: <span class="credits-count">--</span></span>
          <span class="tai-last-update">Updated: <span class="update-time">Never</span></span>
        </div>
      </div>
      
      <div class="tai-answer-panel" style="display: none;">
        <div class="tai-answer-header">
          <span>AI Response</span>
          <button class="tai-answer-close">✕</button>
        </div>
        <div class="tai-answer-content"></div>
      </div>
    `;
  }

  private renderRecommendations(): string {
    if (!this.recommendations.length) {
      return '<div class="tai-empty">Click refresh to analyze game state</div>';
    }

    return this.recommendations.map((rec, i) => `
      <div class="tai-recommendation priority-${rec.priority}">
        <div class="tai-rec-number">${i + 1}</div>
        <div class="tai-rec-content">
          <div class="tai-rec-action">${rec.action}</div>
          <div class="tai-rec-reason">${rec.reason}</div>
          <div class="tai-rec-benefit">
            <span class="tai-rec-time">⏱ ${rec.timeRequired || 'Quick'}</span>
            <span class="tai-rec-impact">${rec.expectedBenefit}</span>
          </div>
        </div>
        ${rec.actionCode ? `
          <button class="tai-rec-execute" data-action="${rec.actionCode}">
            Execute
          </button>
        ` : ''}
      </div>
    `).join('');
  }

  private injectStyles() {
    if (document.getElementById('travian-ai-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'travian-ai-styles';
    styles.textContent = `
      .travian-ai-hud {
        position: fixed;
        width: 380px;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        transition: all 0.3s ease;
      }

      .travian-ai-hud.minimized {
        height: 45px !important;
        width: 200px !important;
      }

      .travian-ai-hud.minimized .tai-content,
      .travian-ai-hud.minimized .tai-answer-panel {
        display: none !important;
      }

      .tai-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        background: rgba(0,0,0,0.2);
        border-radius: 12px 12px 0 0;
        cursor: move;
        user-select: none;
      }

      .tai-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
      }

      .tai-icon {
        font-size: 18px;
      }

      .tai-controls {
        display: flex;
        gap: 8px;
      }

      .tai-controls button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .tai-controls button:hover {
        background: rgba(255,255,255,0.3);
        transform: scale(1.1);
      }

      .tai-content {
        padding: 15px;
      }

      .tai-recommendations {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 15px;
      }

      .tai-recommendation {
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        display: flex;
        align-items: start;
        gap: 12px;
        transition: all 0.2s;
      }

      .tai-recommendation:hover {
        background: rgba(255,255,255,0.15);
        transform: translateX(5px);
      }

      .tai-recommendation.priority-high {
        border-left: 3px solid #ff6b6b;
      }

      .tai-recommendation.priority-medium {
        border-left: 3px solid #ffd93d;
      }

      .tai-recommendation.priority-low {
        border-left: 3px solid #6bcf7f;
      }

      .tai-rec-number {
        background: rgba(255,255,255,0.2);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        flex-shrink: 0;
      }

      .tai-rec-content {
        flex: 1;
      }

      .tai-rec-action {
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .tai-rec-reason {
        font-size: 11px;
        opacity: 0.9;
        line-height: 1.4;
        margin-bottom: 6px;
      }

      .tai-rec-benefit {
        display: flex;
        gap: 12px;
        font-size: 10px;
        opacity: 0.8;
      }

      .tai-rec-execute {
        background: rgba(76, 175, 80, 0.9);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tai-rec-execute:hover {
        background: rgba(76, 175, 80, 1);
        transform: scale(1.05);
      }

      .tai-chat {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }

      .tai-chat-input {
        flex: 1;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        padding: 8px 12px;
        color: white;
        font-size: 12px;
      }

      .tai-chat-input::placeholder {
        color: rgba(255,255,255,0.6);
      }

      .tai-chat-input:focus {
        outline: none;
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.4);
      }

      .tai-chat-send {
        background: rgba(33, 150, 243, 0.9);
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tai-chat-send:hover {
        background: rgba(33, 150, 243, 1);
        transform: scale(1.05);
      }

      .tai-status {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        opacity: 0.7;
        padding-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.1);
      }

      .tai-answer-panel {
        background: rgba(0,0,0,0.3);
        border-radius: 0 0 12px 12px;
        max-height: 200px;
        overflow-y: auto;
      }

      .tai-answer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: rgba(0,0,0,0.2);
        font-size: 12px;
        font-weight: 600;
      }

      .tai-answer-close {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .tai-answer-close:hover {
        opacity: 1;
      }

      .tai-answer-content {
        padding: 15px;
        font-size: 12px;
        line-height: 1.6;
      }

      .tai-empty {
        text-align: center;
        padding: 30px;
        opacity: 0.7;
        font-size: 13px;
      }

      /* Scrollbar styles */
      .tai-recommendations::-webkit-scrollbar,
      .tai-answer-panel::-webkit-scrollbar {
        width: 6px;
      }

      .tai-recommendations::-webkit-scrollbar-track,
      .tai-answer-panel::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
      }

      .tai-recommendations::-webkit-scrollbar-thumb,
      .tai-answer-panel::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.3);
        border-radius: 3px;
      }

      .tai-recommendations::-webkit-scrollbar-thumb:hover,
      .tai-answer-panel::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.4);
      }
    `;

    document.head.appendChild(styles);
  }

  private attachEventListeners() {
    if (!this.container) return;

    // Header drag functionality
    const header = this.container.querySelector('.tai-header') as HTMLElement;
    if (header) {
      header.addEventListener('mousedown', this.startDrag.bind(this));
    }

    // Control buttons
    const refreshBtn = this.container.querySelector('.tai-refresh');
    const minimizeBtn = this.container.querySelector('.tai-minimize');
    const closeBtn = this.container.querySelector('.tai-close');

    refreshBtn?.addEventListener('click', () => this.onRefresh());
    minimizeBtn?.addEventListener('click', () => this.toggleMinimize());
    closeBtn?.addEventListener('click', () => this.destroy());

    // Chat functionality
    const chatInput = this.container.querySelector('.tai-chat-input') as HTMLInputElement;
    const chatSend = this.container.querySelector('.tai-chat-send');

    chatSend?.addEventListener('click', () => this.sendChat());
    chatInput?.addEventListener('keypress', (e: any) => {
      if (e.key === 'Enter') this.sendChat();
    });

    // Execute buttons
    this.container.querySelectorAll('.tai-rec-execute').forEach(btn => {
      btn.addEventListener('click', (e: any) => {
        this.executeAction(e.target.dataset.action);
      });
    });

    // Answer panel close
    const answerClose = this.container.querySelector('.tai-answer-close');
    answerClose?.addEventListener('click', () => this.hideAnswer());

    // Global mouse events for dragging
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  }

  private startDrag(e: MouseEvent) {
    this.isDragging = true;
    const rect = this.container!.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    this.container!.style.transition = 'none';
  }

  private onDrag(e: MouseEvent) {
    if (!this.isDragging || !this.container) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    // Keep within viewport
    const maxX = window.innerWidth - this.container.offsetWidth;
    const maxY = window.innerHeight - this.container.offsetHeight;

    this.position.x = Math.max(0, Math.min(x, maxX));
    this.position.y = Math.max(0, Math.min(y, maxY));

    this.updatePosition();
  }

  private stopDrag() {
    if (this.isDragging && this.container) {
      this.isDragging = false;
      this.container.style.transition = 'all 0.3s ease';
      this.savePosition();
    }
  }

  private updatePosition() {
    if (!this.container) return;
    this.container.style.left = `${this.position.x}px`;
    this.container.style.top = `${this.position.y}px`;
  }

  private toggleMinimize() {
    if (!this.container) return;
    this.isMinimized = !this.isMinimized;
    this.container.classList.toggle('minimized', this.isMinimized);
  }

  private async onRefresh() {
    const refreshBtn = this.container?.querySelector('.tai-refresh') as HTMLElement;
    if (refreshBtn) {
      refreshBtn.style.animation = 'spin 1s linear infinite';
    }

    // Request analysis from background
    chrome.runtime.sendMessage({ type: 'ANALYZE_NOW' }, (response) => {
      if (refreshBtn) {
        refreshBtn.style.animation = '';
      }

      if (response.success && response.analysis) {
        this.updateAnalysis(response.analysis);
      }
    });
  }

  private async sendChat() {
    const input = this.container?.querySelector('.tai-chat-input') as HTMLInputElement;
    if (!input || !input.value.trim()) return;

    const question = input.value.trim();
    input.value = '';
    input.disabled = true;

    // Show loading in answer panel
    this.showAnswer('Thinking...');

    chrome.runtime.sendMessage(
      { type: 'ASK_QUESTION', question },
      (response) => {
        input.disabled = false;
        if (response.success) {
          this.showAnswer(response.answer);
        } else {
          this.showAnswer('Error: ' + (response.error || 'Failed to get response'));
        }
      }
    );
  }

  private showAnswer(content: string) {
    const panel = this.container?.querySelector('.tai-answer-panel') as HTMLElement;
    const answerContent = this.container?.querySelector('.tai-answer-content') as HTMLElement;

    if (panel && answerContent) {
      answerContent.innerHTML = content.replace(/\n/g, '<br>');
      panel.style.display = 'block';
    }
  }

  private hideAnswer() {
    const panel = this.container?.querySelector('.tai-answer-panel') as HTMLElement;
    if (panel) {
      panel.style.display = 'none';
    }
  }

  private executeAction(actionCode: string) {
    console.log('Executing action:', actionCode);
    // TODO: Implement actual action execution
    
    chrome.runtime.sendMessage({
      type: 'EXECUTE_ACTION',
      actionCode
    }, (response) => {
      if (response.success) {
        this.showAnswer(`Action executed: ${actionCode}`);
      } else {
        this.showAnswer(`Failed to execute: ${response.error}`);
      }
    });
  }

  updateAnalysis(analysis: Analysis) {
    this.lastAnalysis = analysis;
    this.recommendations = analysis.recommendations || [];
    
    // Update recommendations display
    const recsContainer = this.container?.querySelector('.tai-recommendations');
    if (recsContainer) {
      recsContainer.innerHTML = this.renderRecommendations();
      
      // Re-attach execute button listeners
      recsContainer.querySelectorAll('.tai-rec-execute').forEach(btn => {
        btn.addEventListener('click', (e: any) => {
          this.executeAction(e.target.dataset.action);
        });
      });
    }

    // Update status
    this.updateStatus(analysis);
  }

  private updateStatus(analysis: Analysis) {
    const creditsSpan = this.container?.querySelector('.credits-count');
    const updateSpan = this.container?.querySelector('.update-time');

    if (creditsSpan && analysis.creditsRemaining !== undefined) {
      creditsSpan.textContent = analysis.creditsRemaining.toString();
    }

    if (updateSpan) {
      const now = new Date();
      updateSpan.textContent = now.toLocaleTimeString();
    }
  }

  private savePosition() {
    chrome.storage.local.set({
      hudPosition: this.position,
      hudMinimized: this.isMinimized
    });
  }

  private loadPosition() {
    chrome.storage.local.get(['hudPosition', 'hudMinimized'], (result) => {
      if (result.hudPosition) {
        this.position = result.hudPosition;
      }
      if (result.hudMinimized !== undefined) {
        this.isMinimized = result.hudMinimized;
      }
    });
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
