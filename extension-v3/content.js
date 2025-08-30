/**
 * TravianAssistant V3 - Content Script
 * Scrapes game data and displays AI recommendations
 */

// Configuration
const CONFIG = {
  // Update this to your Replit backend URL
  API_URL: 'https://travianassistant-v3.YOUR_USERNAME.repl.co',
  // For local testing:
  // API_URL: 'http://localhost:3000',
  
  UPDATE_INTERVAL: 60000, // 1 minute
  HUD_POSITION: { x: 10, y: 60 }
};

// State management
let hudVisible = true;
let recommendations = [];
let gameState = {};
let updateTimer = null;

/**
 * Initialize the assistant
 */
function init() {
  console.log('🚀 TravianAssistant V3 initializing...');
  
  // Create HUD
  createHUD();
  
  // Start data collection
  collectGameData();
  
  // Set up periodic updates
  updateTimer = setInterval(() => {
    collectGameData();
  }, CONFIG.UPDATE_INTERVAL);
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleMessage);
  
  console.log('✅ TravianAssistant V3 ready!');
}

/**
 * Create the HUD overlay
 */
function createHUD() {
  // Remove existing HUD if present
  const existing = document.getElementById('travian-assistant-hud');
  if (existing) existing.remove();
  
  const hud = document.createElement('div');
  hud.id = 'travian-assistant-hud';
  hud.innerHTML = `
    <div class="ta-header">
      <span class="ta-title">🎯 Travian Assistant V3</span>
      <div class="ta-controls">
        <button id="ta-chat-btn" title="Ask AI">💬</button>
        <button id="ta-refresh-btn" title="Refresh">🔄</button>
        <button id="ta-minimize-btn" title="Minimize">_</button>
      </div>
    </div>
    <div class="ta-content" id="ta-content">
      <div class="ta-section">
        <h3>🎮 Game Status</h3>
        <div id="ta-game-status">Analyzing...</div>
      </div>
      <div class="ta-section">
        <h3>📋 Recommendations</h3>
        <div id="ta-recommendations">Loading...</div>
      </div>
      <div class="ta-section">
        <h3>⏱️ Timeline</h3>
        <div id="ta-timeline">Calculating...</div>
      </div>
    </div>
    <div class="ta-chat-panel" id="ta-chat-panel" style="display: none;">
      <div class="ta-chat-messages" id="ta-chat-messages"></div>
      <div class="ta-chat-input">
        <input type="text" id="ta-chat-input" placeholder="Ask anything about Travian strategy...">
        <button id="ta-chat-send">Send</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(hud);
  
  // Make HUD draggable
  makeHudDraggable();
  
  // Attach event listeners
  document.getElementById('ta-minimize-btn').addEventListener('click', toggleHUD);
  document.getElementById('ta-refresh-btn').addEventListener('click', () => collectGameData());
  document.getElementById('ta-chat-btn').addEventListener('click', toggleChat);
  document.getElementById('ta-chat-send').addEventListener('click', sendChatMessage);
  document.getElementById('ta-chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
}

/**
 * Collect game data from the page
 */
function collectGameData() {
  console.log('📊 Collecting game data...');
  
  try {
    // Get server info
    const serverInfo = extractServerInfo();
    
    // Get resources
    const resources = extractResources();
    
    // Get villages
    const villages = extractVillages();
    
    // Get buildings
    const buildings = extractBuildings();
    
    // Get troops
    const troops = extractTroops();
    
    // Compile game state
    gameState = {
      timestamp: Date.now(),
      serverInfo,
      resources,
      villages,
      buildings,
      troops,
      buildingQueue: extractBuildingQueue(),
      culturePoints: extractCulturePoints(),
      hero: extractHeroInfo(),
      serverStart: serverInfo.serverStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Estimate if not found
    };
    
    // Send to backend for analysis
    analyzeGameState();
    
  } catch (error) {
    console.error('❌ Error collecting game data:', error);
    updateHUD({
      error: 'Failed to collect game data. Please refresh the page.'
    });
  }
}

/**
 * Extract server information
 */
function extractServerInfo() {
  const info = {
    url: window.location.hostname,
    speed: 1,
    tribe: 'unknown',
    serverStart: null
  };
  
  // Try to detect server speed (look for x2, x3, etc in URL or page)
  if (document.body.textContent.includes('Speed x2') || window.location.hostname.includes('x2')) {
    info.speed = 2;
  }
  
  // Detect tribe from images or text
  const troopImages = document.querySelectorAll('img[src*="unit"]');
  if (troopImages.length > 0) {
    const src = troopImages[0].src;
    if (src.includes('u5') || src.includes('u6')) info.tribe = 'egyptians';
    else if (src.includes('u1')) info.tribe = 'romans';
    else if (src.includes('u11')) info.tribe = 'teutons';
    else if (src.includes('u21')) info.tribe = 'gauls';
  }
  
  return info;
}

/**
 * Extract current resources
 */
function extractResources() {
  const resources = {
    wood: 0,
    clay: 0,
    iron: 0,
    crop: 0,
    storage: { warehouse: 0, granary: 0 }
  };
  
  // Try multiple selectors for different Travian versions
  const selectors = [
    '#stockBar .stockBarButton', // T4.6
    '.resources .resource', // T5
    '#res .r1, #res .r2, #res .r3, #res .r4' // Legacy
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length >= 4) {
      resources.wood = parseInt(elements[0].textContent.replace(/\D/g, '')) || 0;
      resources.clay = parseInt(elements[1].textContent.replace(/\D/g, '')) || 0;
      resources.iron = parseInt(elements[2].textContent.replace(/\D/g, '')) || 0;
      resources.crop = parseInt(elements[3].textContent.replace(/\D/g, '')) || 0;
      break;
    }
  }
  
  // Get storage capacity
  const warehouseEl = document.querySelector('.warehouse, .capacity');
  if (warehouseEl) {
    const match = warehouseEl.textContent.match(/(\d+)/);
    if (match) resources.storage.warehouse = parseInt(match[1]);
  }
  
  return resources;
}

/**
 * Extract villages list
 */
function extractVillages() {
  const villages = [];
  
  // Try to find village list
  const villageLinks = document.querySelectorAll('#sidebarBoxVillagelist a, .villageList a, #vlist a');
  
  villageLinks.forEach(link => {
    const name = link.textContent.trim();
    const coords = link.querySelector('.coords, .coordinates');
    
    if (name && coords) {
      const match = coords.textContent.match(/\((-?\d+)[|,](-?\d+)\)/);
      if (match) {
        villages.push({
          name,
          x: parseInt(match[1]),
          y: parseInt(match[2]),
          active: link.classList.contains('active')
        });
      }
    }
  });
  
  // If no villages found, at least add current village
  if (villages.length === 0) {
    villages.push({
      name: 'Main Village',
      x: 0,
      y: 0,
      active: true
    });
  }
  
  return villages;
}

/**
 * Extract buildings in current village
 */
function extractBuildings() {
  const buildings = {};
  
  // Resource fields
  const fields = document.querySelectorAll('.buildingSlot, .gid1, .gid2, .gid3, .gid4');
  fields.forEach(field => {
    const level = field.querySelector('.level, .lvl');
    if (level) {
      const fieldNum = field.className.match(/buildingSlot(\d+)/)?.[1] || 
                      field.className.match(/aid(\d+)/)?.[1];
      if (fieldNum) {
        buildings[`field_${fieldNum}`] = {
          level: parseInt(level.textContent) || 0
        };
      }
    }
  });
  
  // Village buildings
  const villageBuildings = document.querySelectorAll('#village_map .building, .buildings .building');
  villageBuildings.forEach(building => {
    const name = building.querySelector('.name')?.textContent || 'unknown';
    const level = building.querySelector('.level')?.textContent || '0';
    buildings[name] = { level: parseInt(level) };
  });
  
  return buildings;
}

/**
 * Extract troop counts
 */
function extractTroops() {
  const troops = {};
  
  // Try to find troop overview
  const troopRows = document.querySelectorAll('.troop_details tr, .troops tr');
  troopRows.forEach(row => {
    const name = row.querySelector('.desc')?.textContent || '';
    const count = row.querySelector('.val')?.textContent || '0';
    if (name) {
      troops[name] = parseInt(count);
    }
  });
  
  return troops;
}

/**
 * Extract building queue
 */
function extractBuildingQueue() {
  const queue = [];
  
  const queueItems = document.querySelectorAll('.buildingList li, .construction li');
  queueItems.forEach(item => {
    const name = item.querySelector('.name')?.textContent || '';
    const timer = item.querySelector('.timer, .duration')?.textContent || '';
    
    if (name) {
      queue.push({
        building: name,
        timeRemaining: timer
      });
    }
  });
  
  return queue;
}

/**
 * Extract culture points
 */
function extractCulturePoints() {
  const cpElement = document.querySelector('.culture_points, #cp, .cp');
  if (cpElement) {
    return parseInt(cpElement.textContent.replace(/\D/g, '')) || 0;
  }
  return 0;
}

/**
 * Extract hero information
 */
function extractHeroInfo() {
  return {
    level: 0,
    health: 100,
    experience: 0
  };
}

/**
 * Send game state to backend for analysis
 */
async function analyzeGameState() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameState })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    recommendations = data.recommendations || [];
    
    updateHUD(data);
    
  } catch (error) {
    console.error('❌ Failed to analyze game state:', error);
    
    // Fallback to local analysis
    performLocalAnalysis();
  }
}

/**
 * Perform basic local analysis if backend is unavailable
 */
function performLocalAnalysis() {
  const localRecs = [];
  
  // Check building queue
  if (!gameState.buildingQueue || gameState.buildingQueue.length === 0) {
    localRecs.push({
      priority: 1,
      type: 'BUILD_QUEUE_EMPTY',
      action: 'Start a building upgrade',
      reasoning: 'Building queue is empty - wasting valuable time'
    });
  }
  
  // Check resources
  const totalRes = (gameState.resources?.wood || 0) + 
                  (gameState.resources?.clay || 0) + 
                  (gameState.resources?.iron || 0) + 
                  (gameState.resources?.crop || 0);
  
  if (totalRes < 500) {
    localRecs.push({
      priority: 2,
      type: 'LOW_RESOURCES',
      action: 'Focus on resource fields',
      reasoning: 'Very low resources - prioritize field upgrades'
    });
  }
  
  recommendations = localRecs;
  updateHUD({ recommendations: localRecs });
}

/**
 * Update HUD with latest data
 */
function updateHUD(data) {
  // Update game status
  const statusEl = document.getElementById('ta-game-status');
  if (statusEl) {
    if (data.error) {
      statusEl.innerHTML = `<span class="error">${data.error}</span>`;
    } else {
      const villages = gameState.villages?.length || 1;
      const pop = gameState.villages?.reduce((sum, v) => sum + (v.population || 0), 0) || 0;
      statusEl.innerHTML = `
        <div>Villages: ${villages}</div>
        <div>Population: ${pop}</div>
        <div>Resources: ${Math.round((gameState.resources?.wood || 0) + (gameState.resources?.clay || 0) + (gameState.resources?.iron || 0) + (gameState.resources?.crop || 0))}</div>
      `;
    }
  }
  
  // Update recommendations
  const recsEl = document.getElementById('ta-recommendations');
  if (recsEl && recommendations.length > 0) {
    recsEl.innerHTML = recommendations.slice(0, 3).map(rec => `
      <div class="ta-recommendation priority-${rec.priority}">
        <strong>${rec.type}</strong>
        <div>${rec.action || rec.reasoning}</div>
      </div>
    `).join('');
  }
  
  // Update timeline
  const timelineEl = document.getElementById('ta-timeline');
  if (timelineEl && data.timeline) {
    timelineEl.innerHTML = data.timeline.map(event => `
      <div class="ta-timeline-event">
        <span class="time">Hour ${event.hour}:</span>
        <span>${event.event}</span>
      </div>
    `).join('');
  }
}

/**
 * Make HUD draggable
 */
function makeHudDraggable() {
  const hud = document.getElementById('travian-assistant-hud');
  const header = hud.querySelector('.ta-header');
  
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = CONFIG.HUD_POSITION.x;
  let yOffset = CONFIG.HUD_POSITION.y;
  
  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  function dragStart(e) {
    if (e.target.tagName === 'BUTTON') return;
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    header.style.cursor = 'grabbing';
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    xOffset = currentX;
    yOffset = currentY;
    
    hud.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }
  
  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    header.style.cursor = 'grab';
  }
}

/**
 * Toggle HUD visibility
 */
function toggleHUD() {
  const content = document.getElementById('ta-content');
  const chat = document.getElementById('ta-chat-panel');
  
  hudVisible = !hudVisible;
  content.style.display = hudVisible ? 'block' : 'none';
  chat.style.display = 'none';
  
  document.getElementById('ta-minimize-btn').textContent = hudVisible ? '_' : '□';
}

/**
 * Toggle chat panel
 */
function toggleChat() {
  const chat = document.getElementById('ta-chat-panel');
  const isVisible = chat.style.display === 'block';
  
  chat.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible) {
    document.getElementById('ta-chat-input').focus();
  }
}

/**
 * Send chat message to AI
 */
async function sendChatMessage() {
  const input = document.getElementById('ta-chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addChatMessage('user', message);
  input.value = '';
  
  try {
    const response = await fetch(`${CONFIG.API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        gameState,
        sessionId: 'travian-v3'
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    addChatMessage('assistant', data.response);
    
    // Update recommendations if provided
    if (data.recommendations) {
      recommendations = data.recommendations;
      updateHUD({ recommendations });
    }
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    addChatMessage('error', 'Failed to connect to AI. Please check your connection.');
  }
}

/**
 * Add message to chat panel
 */
function addChatMessage(role, content) {
  const messages = document.getElementById('ta-chat-messages');
  const messageEl = document.createElement('div');
  messageEl.className = `ta-chat-message ta-chat-${role}`;
  messageEl.innerHTML = `
    <div class="ta-chat-role">${role === 'user' ? 'You' : role === 'assistant' ? 'AI' : 'System'}</div>
    <div class="ta-chat-content">${content}</div>
  `;
  messages.appendChild(messageEl);
  messages.scrollTop = messages.scrollHeight;
}

/**
 * Handle messages from background script
 */
function handleMessage(request, sender, sendResponse) {
  if (request.action === 'update') {
    collectGameData();
  } else if (request.action === 'toggle') {
    toggleHUD();
  }
  
  sendResponse({ success: true });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
