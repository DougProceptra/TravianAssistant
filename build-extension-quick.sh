#!/bin/bash

# Quick build script for Chrome Extension
# Optimized for testing Settlement Race on new server

echo "🏗️  Building TravianAssistant Extension for Testing"
echo "=================================================="

# Navigate to extension directory
cd packages/extension

# Check if dist exists, create if not
if [ ! -d "dist" ]; then
  mkdir -p dist
fi

# Build manifest.json with dynamic backend URL
if [ -z "$BACKEND_URL" ]; then
  # Default to Replit URL based on environment
  if [ ! -z "$REPL_SLUG" ]; then
    BACKEND_URL="https://${REPL_SLUG}.${REPL_OWNER}.repl.co"
  else
    BACKEND_URL="http://localhost:3000"
  fi
fi

echo "📡 Backend URL: $BACKEND_URL"

# Create manifest.json
cat > dist/manifest.json << EOF
{
  "manifest_version": 3,
  "name": "TravianAssistant V2 - Settlement Race",
  "version": "2.0.0",
  "description": "AI-powered Travian assistant focused on fastest settlement",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "*://*.travian.com/*",
    "$BACKEND_URL/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["*://*.travian.com/game.php*"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon-16.png",
      "48": "icon-48.png",
      "128": "icon-128.png"
    }
  },
  "icons": {
    "16": "icon-16.png",
    "48": "icon-48.png",
    "128": "icon-128.png"
  }
}
EOF

# Copy core files
echo "📂 Copying extension files..."

# Content script with Settlement Race focus
cat > dist/content.js << 'EOF'
// TravianAssistant V2 - Settlement Race Optimizer
console.log('🏰 TravianAssistant Settlement Race Active!');

// Configuration
const CONFIG = {
  backendUrl: localStorage.getItem('TLA_BACKEND_URL') || 'http://localhost:3000',
  accountId: localStorage.getItem('TLA_ACCOUNT_ID') || null,
  updateInterval: 60000 // 1 minute
};

// Settlement Race Data Provider
class SettlementDataProvider {
  constructor() {
    this.lastUpdate = null;
    this.data = {};
  }

  async collectGameState() {
    const state = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      serverTime: this.getServerTime(),
      resources: await this.getResources(),
      village: this.getVillageInfo(),
      buildings: this.getBuildings(),
      hero: this.getHeroInfo(),
      quests: this.getActiveQuests()
    };

    // Calculate CP and settlement prediction
    state.settlement = this.calculateSettlement(state);
    
    return state;
  }

  async getResources() {
    // Inject script to access window.resources
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.textContent = `
        window.postMessage({
          type: 'TLA_RESOURCES',
          data: window.resources || {}
        }, '*');
      `;
      document.head.appendChild(script);
      script.remove();

      window.addEventListener('message', function handler(e) {
        if (e.data.type === 'TLA_RESOURCES') {
          window.removeEventListener('message', handler);
          resolve(e.data.data);
        }
      });

      // Timeout fallback
      setTimeout(() => resolve({}), 1000);
    });
  }

  getVillageInfo() {
    const info = {};
    
    // Village name
    const villageNameEl = document.querySelector('#villageNameField');
    if (villageNameEl) {
      info.name = villageNameEl.textContent.trim();
    }

    // Coordinates
    const coordsEl = document.querySelector('.coordinatesWrapper');
    if (coordsEl) {
      const coords = coordsEl.textContent.match(/\((-?\d+)[|,]\s*(-?\d+)\)/);
      if (coords) {
        info.x = parseInt(coords[1]);
        info.y = parseInt(coords[2]);
      }
    }

    // Population
    const popEl = document.querySelector('.inhabitants');
    if (popEl) {
      info.population = parseInt(popEl.textContent) || 0;
    }

    return info;
  }

  getBuildings() {
    const buildings = [];
    
    // Building queue
    const queueItems = document.querySelectorAll('.buildingList li');
    queueItems.forEach(item => {
      const nameEl = item.querySelector('.name');
      const timerEl = item.querySelector('.timer');
      if (nameEl && timerEl) {
        buildings.push({
          name: nameEl.textContent.trim(),
          timeLeft: timerEl.getAttribute('value') || timerEl.textContent
        });
      }
    });

    return buildings;
  }

  getHeroInfo() {
    const hero = {};
    
    // Hero health
    const healthEl = document.querySelector('.heroHealthBarBox .bar');
    if (healthEl) {
      hero.health = parseInt(healthEl.style.width) || 0;
    }

    // Hero level
    const levelEl = document.querySelector('.heroLevel');
    if (levelEl) {
      hero.level = parseInt(levelEl.textContent) || 0;
    }

    // Adventure count
    const adventureEl = document.querySelector('.adventure .content');
    if (adventureEl) {
      hero.adventures = parseInt(adventureEl.textContent) || 0;
    }

    return hero;
  }

  getActiveQuests() {
    const quests = [];
    const questEls = document.querySelectorAll('.quest.questActive');
    
    questEls.forEach(el => {
      const nameEl = el.querySelector('.questTitle');
      if (nameEl) {
        quests.push({
          name: nameEl.textContent.trim(),
          active: true
        });
      }
    });

    return quests;
  }

  getServerTime() {
    const timeEl = document.querySelector('#servertime .timer');
    return timeEl ? timeEl.textContent : new Date().toISOString();
  }

  calculateSettlement(state) {
    // Basic CP calculation
    const BASE_CP = 2; // Starting CP production
    const CELEBRATION_CP = 500; // Small celebration
    
    const calc = {
      currentCP: parseInt(localStorage.getItem('TLA_CP') || '0'),
      cpProduction: BASE_CP,
      cpNeeded: 500,
      daysToSettle: 999,
      phase: 'UNKNOWN'
    };

    // Determine phase based on time
    const serverStart = localStorage.getItem('TLA_SERVER_START');
    if (serverStart) {
      const hoursSinceStart = (Date.now() - new Date(serverStart)) / 3600000;
      
      if (hoursSinceStart < 24) calc.phase = 'FOUNDATION';
      else if (hoursSinceStart < 72) calc.phase = 'CP_RUSH';
      else if (hoursSinceStart < 120) calc.phase = 'RESIDENCE_PREP';
      else calc.phase = 'SETTLER_TRAINING';
    }

    // Calculate days to settle
    if (calc.cpProduction > 0) {
      calc.daysToSettle = Math.ceil((calc.cpNeeded - calc.currentCP) / calc.cpProduction);
    }

    return calc;
  }
}

// HUD Display
class SettlementHUD {
  constructor() {
    this.visible = true;
    this.provider = new SettlementDataProvider();
  }

  inject() {
    if (document.getElementById('tla-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'tla-hud';
    hud.innerHTML = `
      <div class="tla-header">
        <span>🏰 Settlement Race</span>
        <button class="tla-minimize">_</button>
      </div>
      <div class="tla-content">
        <div class="tla-status">Initializing...</div>
        <div class="tla-recommendations"></div>
        <div class="tla-sync-status"></div>
      </div>
    `;

    document.body.appendChild(hud);
    this.attachEvents();
    this.update();
  }

  attachEvents() {
    const minimizeBtn = document.querySelector('.tla-minimize');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        const content = document.querySelector('.tla-content');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      });
    }
  }

  async update() {
    const state = await this.provider.collectGameState();
    
    // Update HUD display
    const statusEl = document.querySelector('.tla-status');
    const recsEl = document.querySelector('.tla-recommendations');
    
    if (statusEl && state.settlement) {
      statusEl.innerHTML = `
        <div>📊 Phase: <strong>${state.settlement.phase}</strong></div>
        <div>🎯 CP: ${state.settlement.currentCP}/${state.settlement.cpNeeded}</div>
        <div>📅 Settlement: ~${state.settlement.daysToSettle} days</div>
      `;
    }

    if (recsEl) {
      recsEl.innerHTML = this.getRecommendations(state);
    }

    // Send to backend
    this.syncToBackend(state);

    // Schedule next update
    setTimeout(() => this.update(), CONFIG.updateInterval);
  }

  getRecommendations(state) {
    const recs = [];
    
    if (state.settlement.phase === 'FOUNDATION') {
      recs.push('🌾 Focus: Resource fields to level 2');
      recs.push('📜 Complete all resource quests');
    } else if (state.settlement.phase === 'CP_RUSH') {
      recs.push('🏛️ Build: Embassy, Marketplace');
      recs.push('🎉 Plan small celebration');
    } else if (state.settlement.phase === 'RESIDENCE_PREP') {
      recs.push('🏠 Priority: Residence to level 10');
      recs.push('🎓 Build: Academy for settlers');
    } else if (state.settlement.phase === 'SETTLER_TRAINING') {
      recs.push('👥 Train: 3 settlers ASAP');
      recs.push('📍 Scout: Best settlement location');
    }

    if (state.hero && state.hero.adventures > 0) {
      recs.push(`⚔️ Hero: ${state.hero.adventures} adventures available!`);
    }

    return recs.map(r => `<div class="tla-rec">${r}</div>`).join('');
  }

  async syncToBackend(state) {
    if (!CONFIG.accountId || !CONFIG.backendUrl) return;

    try {
      const response = await fetch(`${CONFIG.backendUrl}/api/village`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: CONFIG.accountId,
          village: state
        })
      });

      const syncEl = document.querySelector('.tla-sync-status');
      if (syncEl) {
        if (response.ok) {
          syncEl.innerHTML = '✅ Synced';
        } else {
          syncEl.innerHTML = '⚠️ Sync failed';
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('🚀 TravianAssistant initializing...');
  
  // Check for account setup
  if (!CONFIG.accountId) {
    const email = prompt('Enter your email for TravianAssistant:');
    if (email) {
      // Simple hash for privacy
      CONFIG.accountId = btoa(email).replace(/[^a-zA-Z0-9]/g, '');
      localStorage.setItem('TLA_ACCOUNT_ID', CONFIG.accountId);
    }
  }

  // Inject HUD
  const hud = new SettlementHUD();
  hud.inject();
}
EOF

# Create popup.html
cat > dist/popup.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <style>
    body { width: 300px; padding: 10px; font-family: Arial; }
    h2 { margin-top: 0; }
    .status { padding: 5px; background: #f0f0f0; border-radius: 3px; margin: 5px 0; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
    input { width: 100%; padding: 5px; margin: 5px 0; }
    button { width: 100%; padding: 8px; background: #007bff; color: white; border: none; cursor: pointer; }
    button:hover { background: #0056b3; }
  </style>
</head>
<body>
  <h2>🏰 TravianAssistant</h2>
  <div id="status" class="status">Loading...</div>
  
  <div id="config">
    <label>Backend URL:</label>
    <input type="text" id="backendUrl" placeholder="https://workspace.dougdostal.repl.co">
    
    <label>Your Email:</label>
    <input type="email" id="email" placeholder="your@email.com">
    
    <button id="save">Save Configuration</button>
  </div>
  
  <div id="stats" style="display:none;">
    <h3>Settlement Progress</h3>
    <div id="settlement-info"></div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
EOF

# Create popup.js
cat > dist/popup.js << 'EOF'
// Popup configuration script
document.addEventListener('DOMContentLoaded', function() {
  // Load saved config
  const backendUrl = localStorage.getItem('TLA_BACKEND_URL') || '';
  const accountId = localStorage.getItem('TLA_ACCOUNT_ID') || '';
  
  document.getElementById('backendUrl').value = backendUrl;
  
  if (accountId) {
    document.getElementById('status').className = 'status success';
    document.getElementById('status').textContent = '✅ Connected';
    document.getElementById('stats').style.display = 'block';
  } else {
    document.getElementById('status').className = 'status error';
    document.getElementById('status').textContent = '⚠️ Not configured';
  }
  
  // Save configuration
  document.getElementById('save').addEventListener('click', function() {
    const url = document.getElementById('backendUrl').value;
    const email = document.getElementById('email').value;
    
    if (url && email) {
      localStorage.setItem('TLA_BACKEND_URL', url);
      localStorage.setItem('TLA_ACCOUNT_ID', btoa(email).replace(/[^a-zA-Z0-9]/g, ''));
      
      document.getElementById('status').className = 'status success';
      document.getElementById('status').textContent = '✅ Configuration saved!';
      
      // Reload active tab to apply changes
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.reload(tabs[0].id);
      });
    }
  });
});
EOF

# Create styles.css
cat > dist/styles.css << 'EOF'
/* TravianAssistant HUD Styles */
#tla-hud {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 300px;
  background: white;
  border: 2px solid #4CAF50;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 10000;
  font-family: Arial, sans-serif;
}

.tla-header {
  background: #4CAF50;
  color: white;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.tla-minimize {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
  padding: 0 5px;
}

.tla-content {
  padding: 10px;
}

.tla-status {
  background: #f0f0f0;
  padding: 8px;
  border-radius: 3px;
  margin-bottom: 10px;
}

.tla-status div {
  margin: 3px 0;
}

.tla-rec {
  padding: 5px;
  margin: 3px 0;
  background: #e8f5e9;
  border-left: 3px solid #4CAF50;
}

.tla-sync-status {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}
EOF

# Create simple background.js
cat > dist/background.js << 'EOF'
// Background service worker
console.log('TravianAssistant background service running');

// Handle extension installation
chrome.runtime.onInstalled.addListener(function() {
  console.log('TravianAssistant installed');
});
EOF

# Create placeholder icons
echo "🎨 Creating placeholder icons..."
for size in 16 48 128; do
  echo "Icon-${size}" > dist/icon-${size}.png
done

echo ""
echo "✅ Extension built successfully!"
echo "📁 Output: packages/extension/dist/"
echo ""
echo "To install in Chrome:"
echo "1. Open chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'dist' folder"
echo ""
echo "Backend URL: $BACKEND_URL"
