// Travian Legends Assistant - Content Script (v0.4.0)
// - Multi-village data collection
// - IndexedDB persistence with 7-day history
// - Conversational AI interface
// - Enhanced scraping with alerts

// Import new components
import { enhancedScraper, type EnhancedGameState } from './enhanced-scraper';
import { villageNavigator } from './village-navigator';
import { dataStore } from './data-persistence';
import { chatAI, StrategicCalculators } from './conversational-ai';

(() => {
  const VERSION = "0.4.0"; // Updated for multi-village support!
  const LOOP_MS = 5000;

  // ---------- Utils ----------
  const $ = (sel: string, root: ParentNode = document) =>
    root.querySelector<HTMLElement>(sel) || null;
  const $all = (sel: string, root: ParentNode = document) =>
    Array.from(root.querySelectorAll<HTMLElement>(sel));

  const txt = (el: Element | null | undefined) =>
    (el?.textContent || "").trim() || undefined;

  const toNum = (s?: string) => {
    if (!s) return undefined;
    const cleaned = s.replace(/[^\d.,]/g, "").replace(/\u202F|\u00A0/g, "");
    const m = cleaned.match(/[\d.,]+/g);
    if (!m) return undefined;
    const last = m[m.length - 1].replace(/,/g, "");
    const n = Number(last);
    return isFinite(n) ? n : undefined;
  };

  function nowStamp() {
    const d = new Date();
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function identifyPage(path: string) {
    const p = path.toLowerCase();
    if (p.includes("dorf1")) return "dorf1";
    if (p.includes("dorf2")) return "dorf2";
    if (p.includes("/hero/inventory")) return "hero_inventory";
    if (p.includes("/hero/attributes")) return "hero_attributes";
    if (p.includes("/hero/appearance")) return "hero_appearance";
    if (p.includes("gid=16")) return "rallypoint";
    if (p.includes("statistics")) return "statistics";
    if (p.includes("map")) return "map";
    if (p.includes("reports")) return "reports";
    if (p.includes("alliance")) return "alliance";
    return "other";
  }

  // ---------- HUD ----------
  const HUD_ID = "tla-hud";
  let currentGameState: EnhancedGameState | null = null;
  let aiRecommendations: any = null;
  let isFullScanRunning = false;

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
          <span id="tla-villages" style="color:#4fc3f7;font-weight:bold">1 village</span>
          <span id="tla-heart" title="last update" style="opacity:0.7">--:--:--</span>
        </div>
      </div>
      
      <div id="tla-alerts" style="margin-bottom:8px;display:none;"></div>
      
      <div id="tla-stats" style="margin-bottom:8px;padding:6px;background:rgba(255,255,255,0.05);border-radius:6px;font-size:11px;display:none;">
        <div id="tla-total-prod" style="margin-bottom:4px;"></div>
        <div id="tla-total-res"></div>
      </div>
      
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <button id="tla-btn-quick" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #555;background:#2d7d46;color:#fff;cursor:pointer;font-weight:bold;">
          🔄 Quick Analyze
        </button>
        <button id="tla-btn-full" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #555;background:#1e88e5;color:#fff;cursor:pointer;font-weight:bold;">
          📊 Full Scan
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
    `;
    document.documentElement.appendChild(el);

    // Wire buttons
    $("#tla-btn-quick", el)?.addEventListener("click", quickAnalyze);
    $("#tla-btn-full", el)?.addEventListener("click", fullAccountScan);
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

  function updateHUD(state: EnhancedGameState | null) {
    const hud = ensureHUD();
    $("#tla-ver", hud)!.textContent = `v${VERSION}`;
    $("#tla-heart", hud)!.textContent = nowStamp();
    
    if (!state) return;
    
    // Update village count
    const villageCount = state.villages?.size || 1;
    $("#tla-villages", hud)!.textContent = `${villageCount} village${villageCount > 1 ? 's' : ''}`;
    
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
    
    // Show aggregated stats if multi-village
    const statsEl = $("#tla-stats", hud)!;
    if (state.aggregates && villageCount > 1) {
      statsEl.style.display = "block";
      $("#tla-total-prod", statsEl)!.innerHTML = `
        <strong>Total Production:</strong> 
        <span style="color:#8bc34a">+${state.aggregates.totalProduction.wood}</span>/
        <span style="color:#ff9800">+${state.aggregates.totalProduction.clay}</span>/
        <span style="color:#9e9e9e">+${state.aggregates.totalProduction.iron}</span>/
        <span style="color:#fdd835">+${state.aggregates.totalProduction.crop}</span> /hr
      `;
      $("#tla-total-res", statsEl)!.innerHTML = `
        <strong>Total Resources:</strong> 
        ${Math.floor((state.aggregates.totalResources.wood + 
                      state.aggregates.totalResources.clay + 
                      state.aggregates.totalResources.iron + 
                      state.aggregates.totalResources.crop) / 1000)}k
      `;
    } else {
      statsEl.style.display = "none";
    }
  }

  // ---------- Main Functions ----------
  async function quickAnalyze() {
    try {
      showMsg("Analyzing current village...", true);
      currentGameState = await enhancedScraper.getSmartGameState();
      updateHUD(currentGameState);
      showMsg(`Analysis complete! (${currentGameState.villages.size} villages)`);
      console.log('[TLA] Quick analysis:', currentGameState);
    } catch (error) {
      console.error('[TLA] Quick analyze failed:', error);
      showMsg("Analysis failed - see console");
    }
  }

  async function fullAccountScan() {
    if (isFullScanRunning) {
      showMsg("Scan already in progress...");
      return;
    }
    
    try {
      isFullScanRunning = true;
      const fullBtn = document.getElementById("tla-btn-full") as HTMLButtonElement;
      if (fullBtn) {
        fullBtn.disabled = true;
        fullBtn.textContent = "⏳ Scanning...";
      }
      
      showMsg("Starting full account scan...", true);
      currentGameState = await enhancedScraper.scrapeFullAccount(true);
      updateHUD(currentGameState);
      
      const villageCount = currentGameState.villages.size;
      showMsg(`Full scan complete! ${villageCount} villages analyzed`);
      console.log('[TLA] Full account scan:', currentGameState);
      
      // Auto-trigger AI analysis after full scan
      setTimeout(() => requestAIAnalysis(), 1000);
      
    } catch (error) {
      console.error('[TLA] Full scan failed:', error);
      showMsg("Full scan failed - see console");
    } finally {
      isFullScanRunning = false;
      const fullBtn = document.getElementById("tla-btn-full") as HTMLButtonElement;
      if (fullBtn) {
        fullBtn.disabled = false;
        fullBtn.textContent = "📊 Full Scan";
      }
    }
  }

  async function requestAIAnalysis() {
    if (!currentGameState) {
      showMsg("Run analysis first!");
      return;
    }
    
    try {
      showMsg("Getting AI recommendations...", true);
      
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_GAME_STATE',
        state: currentGameState
      });
      
      if (response.success) {
        aiRecommendations = response;
        renderAIRecommendations();
        showMsg("AI analysis complete!");
      } else {
        showMsg(`AI Error: ${response.error}`);
      }
    } catch (error) {
      console.error('[TLA] AI request failed:', error);
      showMsg("Failed to connect to AI");
    }
  }

  function renderAIRecommendations() {
    if (!aiRecommendations || !aiRecommendations.recommendations) return;
    
    let aiPanel = document.getElementById('tla-ai-panel') as HTMLDivElement | null;
    if (!aiPanel) {
      aiPanel = document.createElement('div');
      aiPanel.id = 'tla-ai-panel';
      aiPanel.style.cssText = `
        position: fixed;
        top: 180px;
        right: 8px;
        width: 350px;
        max-height: 500px;
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
    
    const recs = aiRecommendations.recommendations || [];
    const alerts = aiRecommendations.alerts || currentGameState?.alerts || [];
    
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
              ${alert.message}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div style="margin-bottom:12px;">
        <h4 style="margin:0 0 8px 0; font-size:13px; color:#66bb6a;">✅ Recommendations</h4>
        ${recs.map((rec: any, i: number) => `
          <div style="margin-bottom:8px; padding:10px; background:rgba(255,255,255,0.05); border-radius:6px; border-left:3px solid ${
            rec.priority === 'critical' ? '#f44336' :
            rec.priority === 'high' ? '#ff9800' : 
            rec.priority === 'medium' ? '#ffeb3b' : '#66bb6a'
          };">
            <div style="font-weight:bold; color:#fff; margin-bottom:4px;">
              ${i + 1}. ${rec.action}
            </div>
            <div style="font-size:12px; color:#bbb;">
              ${rec.reason}
            </div>
            ${rec.village ? `
              <div style="font-size:11px; color:#4fc3f7; margin-top:4px;">
                📍 ${rec.village}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <div style="padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); font-size:11px; color:#666;">
        Analysis based on ${currentGameState?.villages?.size || 1} villages • Claude Sonnet 4
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
    
    const suggestions = chatAI.getSuggestedQuestions(currentGameState);
    
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
        
        ${suggestions.length > 0 ? `
          <div style="margin-bottom:10px;">
            <div style="font-size:11px; color:#888; margin-bottom:6px;">Suggested questions:</div>
            ${suggestions.map(q => `
              <button class="tla-suggestion" style="display:block; width:100%; text-align:left; padding:6px 8px; margin-bottom:4px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#4fc3f7; cursor:pointer; font-size:12px;">
                ${q}
              </button>
            `).join('')}
          </div>
        ` : ''}
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
        if (!currentGameState) {
          await quickAnalyze();
        }
        
        const answer = await chatAI.askQuestion(question, currentGameState);
        
        messagesEl!.innerHTML += `
          <div style="margin-bottom:10px;">
            <div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid #4fc3f7;">
              ${answer.replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
        
      } catch (error) {
        console.error('[TLA] Chat error:', error);
        messagesEl!.innerHTML += `
          <div style="margin-bottom:10px;">
            <div style="padding:8px; background:rgba(244,67,54,0.1); border-radius:4px; color:#f44336;">
              Failed to get response. Please try again.
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
    
    const stateCopy = {
      ...currentGameState,
      villages: Array.from(currentGameState.villages.entries())
    };
    
    navigator.clipboard.writeText(JSON.stringify(stateCopy, null, 2))
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
    console.log('[TLA] v' + VERSION + ' initializing...');
    
    // Ensure HUD
    ensureHUD();
    
    // Do initial quick analysis
    await quickAnalyze();
    
    // Set up periodic refresh (every 5 minutes)
    setInterval(async () => {
      if (!document.hidden && !isFullScanRunning) {
        await quickAnalyze();
      }
    }, 5 * 60 * 1000);
    
    // Expose for debugging
    (window as any).TLA = {
      version: VERSION,
      state: () => currentGameState,
      scraper: enhancedScraper,
      navigator: villageNavigator,
      dataStore: dataStore,
      chat: chatAI,
      debug: () => {
        console.log('[TLA Debug]', {
          state: currentGameState,
          recommendations: aiRecommendations,
          villages: villageNavigator.getVillages()
        });
      }
    };
    
    console.log('[TLA] Ready! Use TLA.debug() in console for info.');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();