// packages/extension/src/popup/settings.ts
// Settings panel for Travian Assistant

import TravianChatAI from '../ai/ai-chat-client';

export class SettingsPanel {
  private chatAI: TravianChatAI;
  
  constructor() {
    this.chatAI = new TravianChatAI();
    this.initialize();
  }

  async initialize() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }
  }

  private setupUI() {
    const container = document.getElementById('settings-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="settings-panel">
        <h2>Travian AI Settings</h2>
        
        <div class="settings-section">
          <h3>User Configuration</h3>
          <div class="setting-item">
            <label for="user-email">Email (for user ID):</label>
            <input type="email" id="user-email" placeholder="your@email.com" />
            <button id="save-email">Generate ID</button>
            <div id="user-id-display" class="info-text"></div>
          </div>
        </div>

        <div class="settings-section">
          <h3>System Message</h3>
          <div class="setting-item">
            <label for="system-template">Quick Templates:</label>
            <select id="system-template">
              <option value="">-- Select Template --</option>
              <option value="default">Default Elite Strategist</option>
              <option value="earlyGame">Early Game Focus</option>
              <option value="midGame">Mid Game Focus</option>
              <option value="artifacts">Artifact Phase</option>
              <option value="endgame">Endgame/WW Focus</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label for="system-message">System Message:</label>
            <textarea 
              id="system-message" 
              rows="10" 
              placeholder="Enter the AI's system instructions..."
            ></textarea>
            <button id="save-system-message">Save System Message</button>
          </div>
        </div>

        <div class="settings-section">
          <h3>Proxy Configuration</h3>
          <div class="setting-item">
            <label for="proxy-url">API Proxy URL:</label>
            <input 
              type="url" 
              id="proxy-url" 
              value="https://travian-proxy-simple.vercel.app/api/proxy"
            />
            <button id="save-proxy">Save Proxy</button>
            <button id="test-connection">Test Connection</button>
          </div>
          <div id="connection-status" class="status-text"></div>
        </div>

        <div class="settings-section">
          <h3>Example Prompts</h3>
          <div class="prompts-list">
            <div class="prompt-example">
              <strong>Strategic Analysis:</strong>
              <code>What strategic opportunities do you see in my current position?</code>
            </div>
            <div class="prompt-example">
              <strong>Attack Response:</strong>
              <code>I'm being attacked in 4 hours. What are my options beyond defend or dodge?</code>
            </div>
            <div class="prompt-example">
              <strong>Settlement Timing:</strong>
              <code>Should I rush settlers or is there a better play here?</code>
            </div>
            <div class="prompt-example">
              <strong>Psychological Warfare:</strong>
              <code>How can I make my opponents think I'm weaker than I am?</code>
            </div>
            <div class="prompt-example">
              <strong>Misdirection:</strong>
              <code>How can I mislead scouts about my true strength?</code>
            </div>
            <div class="prompt-example">
              <strong>Resource Crisis:</strong>
              <code>I'm low on iron. What creative solutions do you see?</code>
            </div>
            <div class="prompt-example">
              <strong>Meta Analysis:</strong>
              <code>What is everyone else probably doing wrong right now?</code>
            </div>
          </div>
        </div>

        <div class="settings-footer">
          <button id="close-settings">Close</button>
          <button id="reset-defaults">Reset to Defaults</button>
        </div>
      </div>
    `;
    
    this.attachEventListeners();
    this.loadCurrentSettings();
  }

  private attachEventListeners() {
    // Save email/generate ID
    document.getElementById('save-email')?.addEventListener('click', async () => {
      const emailInput = document.getElementById('user-email') as HTMLInputElement;
      if (emailInput?.value) {
        const userId = await this.chatAI.initialize(emailInput.value);
        const display = document.getElementById('user-id-display');
        if (display) {
          display.textContent = `User ID: ${userId.substring(0, 8)}...`;
          display.classList.add('success');
        }
        this.showStatus('User ID generated successfully', 'success');
      }
    });

    // Template selection
    document.getElementById('system-template')?.addEventListener('change', (e) => {
      const select = e.target as HTMLSelectElement;
      if (select.value) {
        const templates = this.chatAI.getSystemMessageTemplates();
        const messageArea = document.getElementById('system-message') as HTMLTextAreaElement;
        if (messageArea && templates[select.value]) {
          messageArea.value = templates[select.value];
        }
      }
    });

    // Save system message
    document.getElementById('save-system-message')?.addEventListener('click', async () => {
      const messageArea = document.getElementById('system-message') as HTMLTextAreaElement;
      if (messageArea?.value) {
        await this.chatAI.updateSystemMessage(messageArea.value);
        this.showStatus('System message saved', 'success');
      }
    });

    // Save proxy URL
    document.getElementById('save-proxy')?.addEventListener('click', async () => {
      const proxyInput = document.getElementById('proxy-url') as HTMLInputElement;
      if (proxyInput?.value) {
        await chrome.storage.sync.set({ proxyUrl: proxyInput.value });
        this.showStatus('Proxy URL saved', 'success');
      }
    });

    // Test connection
    document.getElementById('test-connection')?.addEventListener('click', async () => {
      const statusDiv = document.getElementById('connection-status');
      if (statusDiv) {
        statusDiv.textContent = 'Testing connection...';
        statusDiv.className = 'status-text testing';
      }
      
      try {
        const response = await this.chatAI.chat('Test connection. Reply with "Connected successfully".');
        if (response.includes('Connected') || response.includes('successfully')) {
          this.showStatus('Connection successful!', 'success', 'connection-status');
        } else {
          this.showStatus('Connection works but unexpected response', 'warning', 'connection-status');
        }
      } catch (error) {
        this.showStatus('Connection failed: ' + error.message, 'error', 'connection-status');
      }
    });

    // Reset defaults
    document.getElementById('reset-defaults')?.addEventListener('click', () => {
      if (confirm('Reset all settings to defaults?')) {
        const templates = this.chatAI.getSystemMessageTemplates();
        const messageArea = document.getElementById('system-message') as HTMLTextAreaElement;
        if (messageArea) {
          messageArea.value = templates.default;
        }
        const proxyInput = document.getElementById('proxy-url') as HTMLInputElement;
        if (proxyInput) {
          proxyInput.value = 'https://travian-proxy-simple.vercel.app/api/proxy';
        }
        this.showStatus('Settings reset to defaults', 'info');
      }
    });

    // Close button
    document.getElementById('close-settings')?.addEventListener('click', () => {
      window.close();
    });
  }

  private async loadCurrentSettings() {
    // Load current system message
    const currentMessage = this.chatAI.getSystemMessage();
    const messageArea = document.getElementById('system-message') as HTMLTextAreaElement;
    if (messageArea) {
      messageArea.value = currentMessage;
    }
    
    // Load proxy URL
    const stored = await chrome.storage.sync.get(['proxyUrl', 'aiChatConfig']);
    if (stored.proxyUrl) {
      const proxyInput = document.getElementById('proxy-url') as HTMLInputElement;
      if (proxyInput) {
        proxyInput.value = stored.proxyUrl;
      }
    }
    
    // Load user ID if exists
    if (stored.aiChatConfig?.userId) {
      const display = document.getElementById('user-id-display');
      if (display) {
        display.textContent = `User ID: ${stored.aiChatConfig.userId.substring(0, 8)}...`;
      }
    }
  }

  private showStatus(message: string, type: 'success' | 'error' | 'warning' | 'info', elementId?: string) {
    const statusElement = elementId ? 
      document.getElementById(elementId) : 
      document.createElement('div');
    
    if (!elementId) {
      statusElement.className = `status-popup ${type}`;
      statusElement.textContent = message;
      document.body.appendChild(statusElement);
      
      setTimeout(() => {
        statusElement.remove();
      }, 3000);
    } else {
      statusElement.textContent = message;
      statusElement.className = `status-text ${type}`;
    }
  }
}

// Initialize when loaded
if (typeof window !== 'undefined') {
  new SettingsPanel();
}