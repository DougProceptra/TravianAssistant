// Travian Legends Assistant - Content Script (v0.5.1)
// REFACTORED: Now uses safe scraping (overview page + AJAX interception)
// Fixed: Chat error handling and automatic data refresh

// Import new safe scraping components
import { safeScraper, type SafeGameState } from './safe-scraper';
import { overviewParser } from './overview-parser';
import { ajaxInterceptor } from './ajax-interceptor';
import { dataStore } from './data-persistence';
import { chatAI, StrategicCalculators } from './conversational-ai';

// Make TLA globally available
declare global {
  interface Window {
    TLA: any;
  }
}

(() => {
  const VERSION = "0.5.1";
  const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
  const AUTO_REFRESH_ON_START = true; // Auto-fetch data on initialization

  // ---------- Utils ----------
  const $ = (sel: string, root: ParentNode = document) =>
    root.querySelector<HTMLElement>(sel) || null;

  function nowStamp() {
    const d = new Date();
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  // ---------- Background Service Check ----------
  async function checkBackgroundService(): Promise<boolean> {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'PING' });
      return response?.success === true;
    } catch (err) {
      console.error('[TLA] Background service not responding:', err);
      return false;
    }
  }

  // ---------- HUD ----------
  const HUD_ID = "tla-hud";
  let currentGameState: SafeGameState | null = null;
  let aiRecommendations: any = null;
  let lastRefresh = 0;
  let isRefreshing = false;

  function ensureHUD() {
    let el = document.getElementById(HUD_ID) as HTMLDivElement | null;
    if (el) return el;

    el = document.createElement("div");
    el.id = HUD_ID;
    el.style.position = "fixed";
    el.style.top = "8px";
    el.style.right = "8px";
    el.style.zIndex = "2147483647";
    el.style.font = "12px/1.3 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    el.style.color = "#eee";
    el.style.background = "rgba(0,0,0,.75)";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "10px";
    el.style.backdropFilter = "blur(4px)";
    el.style.boxShadow = "0 4px 12px rgba(0,0,0,.4)";
    el.style.minWidth = "280px";
    el.style.maxWidth = "350px";
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div><b>TLA</b> <span id="tla-ver"></span></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="tla-villages" style="color:#4fc3f7;font-weight:bold">-- villages</span>
          <span id="tla-heart" title="last update" style="opacity:0.7">--:--:--</span>
        </div>
      </div>
      
      <div id="tla-safe-mode" style="padding:4px 6px;margin-bottom:8px;background:rgba(76,175,80,0.2);border-radius:4px;font-size:11px;color:#4caf50;">
        ✅ Safe Mode: No navigation required
      </div>
      
      <div id="tla-bg-status" style="display:none;padding:4px 6px;margin-bottom:8px;background:rgba(244,67,54,0.2);border-radius:4px;font-size:11px;color:#f44336;">
        ⚠️ Background service not connected
      </div>
      
      <div id="tla-alerts" style="margin-bottom:8px;display:none;"></div>
      
      <div id="tla-stats" style="margin-bottom:8px;padding:6px;background:rgba(255,255,255,0.05);border-radius:6px;font-size:11px;">
        <div id="tla-total-prod" style="margin-bottom:4px;"></div>
        <div id="tla-total-res"></div>
      </div>
      
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <button id="tla-btn-refresh" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #555;background:#2d7d46;color:#fff;cursor:pointer;font-weight:bold;">
          🔄 Refresh Data
        </button>
        <button id="tla-btn-overview" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #555;background:#1e88e5;color:#fff;cursor:pointer;font-weight:bold;">
          📊 Overview Page
        </button>
      </div>
      
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <button id="tla-btn-ai" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #555;background:#4fc3f7;color:#000;cursor:pointer;font-weight:bold;">
          🤖 AI Analysis
        </button>
        <button id="tla-btn-chat" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #555;background:#9c27b0;color:#fff;cursor:pointer;font-weight:bold;">
          💬 Ask Question
        </button>
      </div>
      
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button id="tla-btn-export" style="flex:1;padding:4px 8px;border-radius:4px;border:1px solid #444;background:#333;color:#aaa;cursor:pointer;font-size:11px;">
          💾 Export
        </button>
        <button id="tla-btn-copy" style="flex:1;padding:4px 8px;border-radius:4px;border:1px solid #444;background:#333;color:#aaa;cursor:pointer;font-size:11px;">
          📋 Copy
        </button>
        <button id="tla-btn-clear" style="flex:1;padding:4px 8px;border-radius:4px;border:1px solid #444;background:#333;color:#aaa;cursor:pointer;font-size:11px;">
          🗑️ Clear
        </button>
      </div>
      
      <div id="tla-msg" style="margin-top:8px;padding:6px;background:rgba(255,255,255,0.1);border-radius:4px;font-size:11px;display:none;"></div>
      
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;color:#666;">
        Auto-refresh: every 15 min • AJAX monitoring active
      </div>
    `;
    document.documentElement.appendChild(el);

    // Wire buttons
    $("#tla-btn-refresh", el)?.addEventListener("click", refreshData);
    $("#tla-btn-overview", el)?.addEventListener("click", goToOverview);
    $("#tla-btn-ai", el)?.addEventListener("click", requestAIAnalysis);
    $("#tla-btn-chat", el)?.addEventListener("click", openChatInterface);
    $("#tla-btn-export", el)?.addEventListener("click", exportData);
    $("#tla-btn-copy", el)?.addEventListener("click", copyGameState);
    $("#tla-btn-clear", el)?.addEventListener("click", clearOldData);

    return el;
  }

  function showMsg(s: string, persist = false) {
    const el = document.getElementById("tla-msg");
    if (!el) return;
    el.textContent = s;
    el.style.display = "block";
    if (!persist) {
      setTimeout(() => {
        if (el.textContent === s) {
          el.style.display = "none";
          el.textContent = "";
        }
      }, 3000);
    }
  }

  function updateHUD(state: SafeGameState | null) {
    const hud = ensureHUD();
    $("#tla-ver", hud)!.textContent = `v${VERSION}`;
    $("#tla-heart", hud)!.textContent = nowStamp();
    lastRefresh = Date.now();
    
    if (!state) return;
    
    // Update village count
    const villageCount = state.villages?.length || 0;
    $("#tla-villages", hud)!.textContent = `${villageCount} village${villageCount !== 1 ? 's' : ''}`;
    
    // Show alerts if any
    const alertsEl = $("#tla-alerts", hud)!;
    if (state.alerts && state.alerts.length > 0) {
      alertsEl.style.display = "block";
      alertsEl.innerHTML = state.alerts.slice(0, 3).map(alert => `
        <div style="padding:4px 6px;margin-bottom:4px;background:${
          alert.severity === 'critical' ? 'rgba(244,67,54,0.2)' :
          alert.severity === 'high' ? 'rgba(255,152,0,0.2)' :
          'rgba(255,235,59,0.2)'
        };border-radius:4px;font-size:11px;border-left:3px solid ${
          alert.severity === 'critical' ? '#f44336' :
          alert.severity === 'high' ? '#ff9800' :
          '#ffeb3b'
        };">
          ${alert.message}
        </div>
      `).join('');
    } else {
      alertsEl.style.display = "none";
    }
    
    // Show aggregated stats
    const statsEl = $("#tla-stats", hud)!;
    if (state.totals) {
      $("#tla-total-prod", statsEl)!.innerHTML = `
        <strong>Total Production:</strong> 
        <span style="color:#8bc34a">+${state.totals.production.wood}</span>/
        <span style="color:#ff9800">+${state.totals.production.clay}</span>/
        <span style="color:#9e9e9e">+${state.totals.production.iron}</span>/
        <span style="color:#fdd835">+${state.totals.production.crop}</span> /hr
        ${state.totals.production.cropNet < 0 ? 
          `<span style="color:#f44336"> (Net: ${state.totals.production.cropNet})</span>` : ''}
      `;
      $("#tla-total-res", statsEl)!.innerHTML = `
        <strong>Total Resources:</strong> 
        ${Math.floor((state.totals.resources.wood + 
                      state.totals.resources.clay + 
                      state.totals.resources.iron + 
                      state.totals.resources.crop) / 1000)}k
        • Pop: ${state.totals.population}
      `;
    }
  }

  // ---------- Main Functions ----------
  async function refreshData(forceRefresh = true) {
    if (isRefreshing) {
      console.log('[TLA] Already refreshing, skipping...');
      return;
    }
    
    try {
      isRefreshing = true;
      showMsg("Fetching all village data...", true);
      
      // Force refresh from overview page
      currentGameState = await safeScraper.refresh(forceRefresh);
      
      updateHUD(currentGameState);
      showMsg(`Data refreshed! (${currentGameState.villages.length} villages)`);
      console.log('[TLA] Safe refresh complete:', currentGameState);
      
      // If we got 0 villages and we're not on the overview page, try to fetch it
      if (currentGameState.villages.length === 0 && !window.location.pathname.includes('statistics')) {
        showMsg("No villages found. Trying to fetch overview...", true);
        // The safeScraper should handle fetching via AJAX
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentGameState = await safeScraper.refresh(true);
        updateHUD(currentGameState);
      }
      
    } catch (error) {
      console.error('[TLA] Refresh failed:', error);
      showMsg("Refresh failed - see console");
    } finally {
      isRefreshing = false;
    }
  }

  function goToOverview() {
    // Navigate to overview page - use the correct URL for this server
    window.location.href = '/village/statistics';
  }

  async function requestAIAnalysis() {
    if (!currentGameState || currentGameState.villages.length === 0) {
      showMsg("No village data! Refreshing...");
      await refreshData();
      if (!currentGameState || currentGameState.villages.length === 0) {
        showMsg("Still no villages. Please go to Overview page.");
        return;
      }
    }
    
    // Check background service first
    const bgAlive = await checkBackgroundService();
    if (!bgAlive) {
      showMsg("Background service not connected. Please reload extension.");
      document.getElementById('tla-bg-status')!.style.display = 'block';
      return;
    }
    
    try {
      showMsg("Getting AI recommendations...", true);
      
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_GAME_STATE',
        state: currentGameState
      });
      
      console.log('[TLA] AI response:', response);
      
      if (response.success) {
        aiRecommendations = response;
        renderAIRecommendations();
        showMsg("AI analysis complete!");
      } else {
        showMsg(`AI Error: ${response.error || 'Unknown error'}`);
        console.error('[TLA] AI analysis error:', response);
      }
    } catch (error) {
      console.error('[TLA] AI request failed:', error);
      showMsg("Failed to connect to AI - reload extension");
    }
  }

  function renderAIRecommendations() {
    if (!aiRecommendations) return;
    
    // Parse the recommendations
    let recommendations = [];
    let reasoning = '';
    
    if (typeof aiRecommendations.recommendations === 'string') {
      // Parse Claude's response
      const lines = aiRecommendations.recommendations.split('\n');
      let currentRec: any = null;
      
      for (const line of lines) {
        if (line.match(/^\d+\./)) {
          if (currentRec) recommendations.push(currentRec);
          currentRec = {
            action: line.replace(/^\d+\.\s*/, '').split(':')[0],
            reason: line.split(':').slice(1).join(':').trim(),
            priority: 'medium'
          };
        } else if (currentRec && line.trim()) {
          currentRec.reason += ' ' + line.trim();
        } else if (line.includes('Analysis:') || line.includes('Strategy:')) {
          reasoning += line + '\n';
        }
      }
      if (currentRec) recommendations.push(currentRec);
    } else {
      recommendations = aiRecommendations.recommendations || [];
      reasoning = aiRecommendations.reasoning || '';
    }
    
    let aiPanel = document.getElementById('tla-ai-panel') as HTMLDivElement | null;
    if (!aiPanel) {
      aiPanel = document.createElement('div');
      aiPanel.id = 'tla-ai-panel';
      aiPanel.style.cssText = `
        position: fixed;
        top: 180px;
        right: 8px;
        width: 400px;
        max-height: 600px;
        overflow-y: auto;
        z-index: 2147483646;
        font: 13px/1.5 system-ui, sans-serif;
        color: #eee;
        background: rgba(0, 0, 0, 0.95);
        padding: 14px;
        border-radius: 10px;
        backdrop-filter: blur(10px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.6);
        border: 1px solid rgba(79, 195, 247, 0.3);
      `;
      document.documentElement.appendChild(aiPanel);
    }
    
    const alerts = currentGameState?.alerts || [];
    
    aiPanel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0; font-size:16px; color:#4fc3f7;">🤖 AI Strategic Analysis</h3>
        <button id="tla-ai-close" style="background:none; border:none; color:#999; cursor:pointer; font-size:20px;">×</button>
      </div>
      
      ${alerts.length > 0 ? `
        <div style="margin-bottom:12px;">
          <h4 style="margin:0 0 8px 0; font-size:13px; color:#ff9800;">⚠️ Alerts</h4>
          ${alerts.map((alert: any) => `
            <div style="padding:6px 8px; margin-bottom:4px; background:rgba(255,152,0,0.1); border-radius:4px; font-size:12px; border-left:3px solid ${
              alert.severity === 'critical' ? '#f44336' : '#ff9800'
            };">
              ${alert.villageName}: ${alert.message}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div style="margin-bottom:12px;">
        <h4 style="margin:0 0 8px 0; font-size:13px; color:#66bb6a;">✅ Recommendations</h4>
        ${recommendations.length > 0 ? recommendations.map((rec: any, i: number) => `
          <div style="margin-bottom:8px; padding:10px; background:rgba(255,255,255,0.05); border-radius:6px; border-left:3px solid ${
            rec.priority === 'critical' ? '#f44336' :
            rec.priority === 'high' ? '#ff9800' : 
            rec.priority === 'medium' ? '#ffeb3b' : '#66bb6a'
          };">
            <div style="font-weight:bold; color:#fff; margin-bottom:4px;">
              ${i + 1}. ${rec.action}
            </div>
            ${rec.reason ? `
              <div style="font-size:12px; color:#bbb;">
                ${rec.reason}
              </div>
            ` : ''}
          </div>
        `).join('') : `
          <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:6px;">
            <pre style="margin:0; white-space:pre-wrap; font-family:inherit; color:#bbb;">
${aiRecommendations.recommendations || 'No specific recommendations available.'}
            </pre>
          </div>
        `}
      </div>
      
      <div style="padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); font-size:11px; color:#666;">
        Analysis based on ${currentGameState?.villages?.length || 0} villages • Claude Sonnet 4
      </div>
    `;
    
    document.getElementById('tla-ai-close')?.addEventListener('click', () => {
      aiPanel?.remove();
    });
  }

  function openChatInterface() {
    let chatPanel = document.getElementById('tla-chat-panel') as HTMLDivElement | null;
    if (chatPanel) {
      chatPanel.style.display = chatPanel.style.display === 'none' ? 'block' : 'none';
      return;
    }
    
    chatPanel = document.createElement('div');
    chatPanel.id = 'tla-chat-panel';
    chatPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 8px;
      width: 400px;
      height: 500px;
      z-index: 2147483645;
      font: 13px/1.5 system-ui, sans-serif;
      color: #eee;
      background: rgba(0, 0, 0, 0.95);
      border-radius: 10px;
      backdrop-filter: blur(10px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.6);
      border: 1px solid rgba(156, 39, 176, 0.3);
      display: flex;
      flex-direction: column;
    `;
    
    const suggestions = [
      "What should I build next?",
      "When will my resources overflow?",
      "How many troops do I need for defense?",
      "What's my biggest bottleneck?"
    ];
    
    chatPanel.innerHTML = `
      <div style="padding:14px; border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:16px; color:#9c27b0;">💬 Strategic Advisor</h3>
          <button id="tla-chat-close" style="background:none; border:none; color:#999; cursor:pointer; font-size:20px;">×</button>
        </div>
      </div>
      
      <div id="tla-chat-messages" style="flex:1; overflow-y:auto; padding:14px;">
        <div style="padding:10px; background:rgba(156,39,176,0.1); border-radius:6px; margin-bottom:10px;">
          <div style="font-weight:bold; margin-bottom:4px;">Welcome to TravianAssistant AI!</div>
          <div style="font-size:12px; color:#bbb;">Ask me anything about your game strategy.</div>
        </div>
        
        <div style="margin-bottom:10px;">
          <div style="font-size:11px; color:#888; margin-bottom:6px;">Suggested questions:</div>
          ${suggestions.map(q => `
            <button class="tla-suggestion" style="display:block; width:100%; text-align:left; padding:6px 8px; margin-bottom:4px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#4fc3f7; cursor:pointer; font-size:12px;">
              ${q}
            </button>
          `).join('')}
        </div>
      </div>
      
      <div style="padding:14px; border-top:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex; gap:8px;">
          <input id="tla-chat-input" type="text" placeholder="Ask about troops, buildings, strategy..." 
                 style="flex:1; padding:8px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:4px; color:#fff;">
          <button id="tla-chat-send" style="padding:8px 16px; background:#9c27b0; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
            Send
          </button>
        </div>
      </div>
    `;
    
    document.documentElement.appendChild(chatPanel);
    
    // Wire up chat events
    document.getElementById('tla-chat-close')?.addEventListener('click', () => {
      chatPanel?.remove();
    });
    
    const input = document.getElementById('tla-chat-input') as HTMLInputElement;
    const sendBtn = document.getElementById('tla-chat-send');
    const messagesEl = document.getElementById('tla-chat-messages');
    
    async function sendMessage() {
      const question = input.value.trim();
      if (!question) return;
      
      // Add user message
      messagesEl!.innerHTML += `
        <div style="margin-bottom:10px; text-align:right;">
          <div style="display:inline-block; padding:8px 12px; background:rgba(156,39,176,0.2); border-radius:8px; max-width:80%;">
            ${question}
          </div>
        </div>
      `;
      
      input.value = '';
      input.disabled = true;
      sendBtn!.textContent = '...';
      
      // Get AI response
      try {
        const bgAlive = await checkBackgroundService();
        if (!bgAlive) {
          throw new Error('Background service not connected');
        }
        
        if (!currentGameState || currentGameState.villages.length === 0) {
          await refreshData();
          if (!currentGameState || currentGameState.villages.length === 0) {
            throw new Error('No village data available');
          }
        }
        
        const response = await chrome.runtime.sendMessage({
          type: 'CHAT_MESSAGE',
          message: question,
          state: currentGameState
        });
        
        if (response?.success && response?.answer) {
          // Safe string handling - ensure answer exists and is a string
          const answer = String(response.answer || 'No response received');
          const formattedAnswer = answer.replace(/\n/g, '<br>');
          
          messagesEl!.innerHTML += `
            <div style="margin-bottom:10px;">
              <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid #4fc3f7;">
                ${formattedAnswer}
              </div>
            </div>
          `;
        } else {
          throw new Error(response?.error || 'Failed to get response');
        }
        
      } catch (error: any) {
        console.error('[TLA] Chat error:', error);
        messagesEl!.innerHTML += `
          <div style="margin-bottom:10px;">
            <div style="padding:8px; background:rgba(244,67,54,0.1); border-radius:4px; color:#f44336;">
              Error: ${error?.message || error || 'Unknown error'}
            </div>
          </div>
        `;
      } finally {
        input.disabled = false;
        sendBtn!.textContent = 'Send';
        input.focus();
        messagesEl!.scrollTop = messagesEl!.scrollHeight;
      }
    }
    
    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Handle suggestion clicks
    document.querySelectorAll('.tla-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.textContent || '';
        sendMessage();
      });
    });
  }

  async function exportData() {
    try {
      const data = await dataStore.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travian-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg("Data exported!");
    } catch (error) {
      console.error('[TLA] Export failed:', error);
      showMsg("Export failed");
    }
  }

  function copyGameState() {
    if (!currentGameState) {
      showMsg("No data to copy");
      return;
    }
    
    navigator.clipboard.writeText(JSON.stringify(currentGameState, null, 2))
      .then(() => showMsg("Copied to clipboard!"))
      .catch(() => showMsg("Copy failed"));
  }

  async function clearOldData() {
    if (confirm("Clear data older than 1 day?")) {
      await dataStore.cleanOldData(1);
      showMsg("Old data cleared");
    }
  }

  // ---------- Initialize ----------
  async function initialize() {
    console.log('[TLA] v' + VERSION + ' initializing (SAFE MODE)...');
    
    // Initialize safe scraper
    await safeScraper.initialize();
    
    // Check background service
    const bgAlive = await checkBackgroundService();
    if (!bgAlive) {
      console.warn('[TLA] Background service not responding - reload extension from chrome://extensions/');
      const statusEl = document.getElementById('tla-bg-status');
      if (statusEl) statusEl.style.display = 'block';
    } else {
      console.log('[TLA] Background service connected');
    }
    
    // Ensure HUD
    ensureHUD();
    
    // Auto-refresh data on start
    if (AUTO_REFRESH_ON_START) {
      console.log('[TLA] Auto-refreshing data on startup...');
      await refreshData(true);
    }
    
    // Subscribe to state updates
    safeScraper.onStateUpdate((state) => {
      currentGameState = state;
      updateHUD(state);
      console.log('[TLA] State updated:', state);
    });
    
    // Set up periodic refresh (every 15 minutes)
    setInterval(async () => {
      if (!document.hidden) {
        const timeSinceRefresh = Date.now() - lastRefresh;
        if (timeSinceRefresh >= REFRESH_INTERVAL) {
          console.log('[TLA] Auto-refresh triggered');
          await refreshData(true);
        }
      }
    }, 60 * 1000); // Check every minute
    
    // Expose TLA to window for debugging
    window.TLA = {
      version: VERSION,
      state: () => currentGameState,
      scraper: safeScraper,
      overviewParser,
      ajaxInterceptor,
      dataStore,
      testBg: checkBackgroundService,
      debug: () => {
        console.log('[TLA Debug]', {
          state: currentGameState,
          recommendations: aiRecommendations,
          lastRefresh: new Date(lastRefresh).toLocaleTimeString()
        });
        return {
          version: VERSION,
          safeMode: true,
          state: currentGameState,
          recommendations: aiRecommendations,
          backgroundAlive: checkBackgroundService()
        };
      }
    };
    
    console.log('[TLA] Ready! SAFE MODE active - no navigation required');
    console.log('[TLA] Data collection via overview page + AJAX interception');
    console.log('[TLA] Use window.TLA.debug() for info');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
