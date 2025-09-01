// Options page JavaScript - handles settings and custom prompts

const PRESET_PROMPTS = {
  aggressive: `I'm an aggressive player focused on rapid expansion and dominating my region.

Strategic priorities:
1. Fast settler production for expansion
2. Early raiding for resource acquisition  
3. Offensive troop focus (90% offense, 10% defense)
4. Target inactive and smaller players for conquest
5. Minimize building defenses - troops are my defense

Key preferences:
- Gold usage for instant completion is acceptable
- Risk tolerance is high - growth over safety
- Alliance warfare participation is priority
- Aim for top attacker rankings
- 2-3 hours daily play time available`,

  defensive: `I prefer a defensive, turtle strategy focused on sustainable growth.

Strategic priorities:
1. Maximum resource field development before expansion
2. Strong defensive troops in every village
3. Cranny levels to protect resources
4. Wall/defensive building priority
5. Avoid confrontation until absolutely necessary

Key preferences:
- Conservative resource management
- Build complete infrastructure before settling
- Maintain 2:1 defense to offense ratio
- Focus on culture point generation
- Prefer diplomacy over warfare`,

  economic: `I'm an economic player focused on resource production and trade.

Strategic priorities:
1. Maximize resource field levels (all to 10+)
2. Trade route optimization between villages
3. Marketplace and merchant focus
4. Supply alliance members with resources
5. Minimal troop production - only for protection

Key preferences:
- Every village specialized for specific resources
- NPC trading for resource balance
- Gold for resource bonuses acceptable
- Avoid military conflicts
- Support role in alliance`,

  casual: `I'm a casual player with limited time, need efficiency over optimization.

Strategic priorities:
1. Simple build queues I can set and forget
2. Defensive troops to avoid constant attacks
3. Steady growth over rapid expansion
4. Clear daily action lists
5. Avoid complex coordination requirements

Key preferences:
- Maximum 30 minutes daily play time
- Prefer automated/queued actions
- Avoid high-maintenance strategies
- Focus on fun over ranking
- Sustainable without gold usage`,

  competitive: `I'm playing to win - top 10 finish or delete.

Strategic priorities:
1. Optimal efficiency in every decision
2. Coordinate with alliance for artifacts/WW
3. Multiple expansion waves planned
4. Both hammer and anvil villages
5. Spy network and intelligence gathering

Key preferences:
- 4+ hours daily availability
- Gold usage for all advantages
- Detailed timing calculations required
- Aggressive diplomacy and warfare
- Meta-game participation (Discord, etc.)`
};

// Load saved settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = await chrome.storage.sync.get([
      'serverUrl',
      'serverSpeed', 
      'tribe',
      'customPrompt',
      'userEmail',
      'allianceTag'
    ]);
    
    // Populate form fields
    if (settings.serverUrl) {
      document.getElementById('serverUrl').value = settings.serverUrl;
    } else {
      // Try to detect from current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url?.includes('travian.com')) {
        const url = new URL(tabs[0].url);
        document.getElementById('serverUrl').value = url.hostname;
      }
    }
    
    if (settings.serverSpeed) {
      document.getElementById('serverSpeed').value = settings.serverSpeed;
    }
    
    if (settings.tribe) {
      document.getElementById('tribe').value = settings.tribe;
    }
    
    if (settings.customPrompt) {
      document.getElementById('customPrompt').value = settings.customPrompt;
    }
    
    if (settings.userEmail) {
      document.getElementById('userEmail').value = settings.userEmail;
    }
    
    if (settings.allianceTag) {
      document.getElementById('allianceTag').value = settings.allianceTag;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', async () => {
  const settings = {
    serverUrl: document.getElementById('serverUrl').value,
    serverSpeed: document.getElementById('serverSpeed').value,
    tribe: document.getElementById('tribe').value,
    customPrompt: document.getElementById('customPrompt').value,
    userEmail: document.getElementById('userEmail').value,
    allianceTag: document.getElementById('allianceTag').value
  };
  
  try {
    await chrome.storage.sync.set(settings);
    showStatus('Settings saved successfully!', 'success');
    
    // Notify content scripts of settings change
    const tabs = await chrome.tabs.query({ url: '*://*.travian.com/*' });
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_UPDATED',
        settings: settings
      });
    });
  } catch (error) {
    showStatus('Failed to save settings: ' + error.message, 'error');
  }
});

// Reset to defaults
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('serverUrl').value = '';
  document.getElementById('serverSpeed').value = '1';
  document.getElementById('tribe').value = 'romans';
  document.getElementById('customPrompt').value = PRESET_PROMPTS.aggressive;
  document.getElementById('userEmail').value = '';
  document.getElementById('allianceTag').value = '';
  
  showStatus('Reset to default settings (not saved yet)', 'success');
});

// Test connection
document.getElementById('testBtn').addEventListener('click', async () => {
  const serverUrl = document.getElementById('serverUrl').value;
  
  if (!serverUrl) {
    showStatus('Please enter a server URL first', 'error');
    return;
  }
  
  try {
    // Try to fetch the server page
    const response = await fetch(`https://${serverUrl}/dorf1.php`, { 
      mode: 'no-cors' 
    });
    
    showStatus('Server connection looks good! Make sure the extension is active on that domain.', 'success');
  } catch (error) {
    showStatus('Could not connect to server. Check the URL and try again.', 'error');
  }
});

// Load preset prompts
function loadPreset(preset) {
  if (PRESET_PROMPTS[preset]) {
    document.getElementById('customPrompt').value = PRESET_PROMPTS[preset];
    showStatus(`Loaded ${preset} strategy template`, 'success');
  }
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusEl.className = 'status';
  }, 3000);
}

// Make loadPreset available globally for onclick handlers
window.loadPreset = loadPreset;
