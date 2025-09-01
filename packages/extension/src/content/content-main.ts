// Main content script - Integrates all components
// This is the main entry point for the Travian Assistant

import { dataPipeline } from '../integration/data-pipeline-integration';

// Version info for debugging
const VERSION = '1.1.0';
console.log(`[Travian Assistant v${VERSION}] Content script initializing...`);

// Main initialization function
async function initializeTravianAssistant() {
  try {
    console.log('[TA Content] Starting Travian Assistant initialization...');

    // Check if we're on a Travian game page
    if (!isValidTravianPage()) {
      console.log('[TA Content] Not a valid Travian game page, skipping initialization');
      return;
    }

    // Initialize the data pipeline (handles scraping and data flow)
    console.log('[TA Content] Initializing data pipeline...');
    const pipeline = dataPipeline;
    
    // Load existing chat UI if it exists
    await loadChatUI();

    // Set up message listeners for background script communication
    setupMessageListeners();

    // Initialize keyboard shortcuts
    setupKeyboardShortcuts();

    console.log('[TA Content] Travian Assistant initialized successfully!');
    
    // Send initialization complete message
    chrome.runtime.sendMessage({
      type: 'CONTENT_SCRIPT_READY',
      version: VERSION,
      url: window.location.href
    });

  } catch (error) {
    console.error('[TA Content] Failed to initialize:', error);
  }
}

// Check if current page is a valid Travian game page
function isValidTravianPage(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  const validPatterns = [
    'travian',
    'kingdoms',
    'tx3',
    'ts1',
    'ts2',
    'ts3',
    'ts4',
    'ts5',
    'ts19',
    'ts20',
    'ts29',
    'ts30'
  ];
  
  return validPatterns.some(pattern => hostname.includes(pattern));
}

// Load the chat UI component
async function loadChatUI() {
  try {
    // Check if chat UI script exists
    const chatScript = chrome.runtime.getURL('conversational-ai.js');
    
    // Inject the chat UI script
    const script = document.createElement('script');
    script.src = chatScript;
    script.type = 'module';
    script.onload = () => {
      console.log('[TA Content] Chat UI script loaded');
    };
    script.onerror = (error) => {
      console.error('[TA Content] Failed to load chat UI:', error);
    };
    
    document.head.appendChild(script);
  } catch (error) {
    console.error('[TA Content] Error loading chat UI:', error);
  }
}

// Set up message listeners for background script communication
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[TA Content] Received message:', request.type);
    
    switch (request.type) {
      case 'PING':
        sendResponse({ status: 'alive', version: VERSION });
        break;
        
      case 'GET_GAME_STATE':
        // Get current game context from data pipeline
        const context = dataPipeline.getCurrentContext();
        sendResponse({ success: true, context });
        break;
        
      case 'GET_AI_CONTEXT':
        // Get AI-formatted context
        const aiContext = dataPipeline.getAIContext();
        sendResponse({ success: true, context: aiContext });
        break;
        
      case 'TOGGLE_CHAT':
        toggleChatUI();
        sendResponse({ success: true });
        break;
        
      case 'REFRESH_DATA':
        // Force data collection
        chrome.runtime.sendMessage({ type: 'REFRESH_DATA' });
        sendResponse({ success: true });
        break;
        
      default:
        console.log('[TA Content] Unknown message type:', request.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
    
    return true; // Keep channel open for async responses
  });
}

// Set up keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + Shift + A to toggle chat
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
      event.preventDefault();
      toggleChatUI();
    }
    
    // Ctrl/Cmd + Shift + R to refresh data
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      chrome.runtime.sendMessage({ type: 'REFRESH_DATA' });
      console.log('[TA Content] Data refresh triggered');
    }
  });
}

// Toggle chat UI visibility
function toggleChatUI() {
  const chatContainer = document.querySelector('#travian-ai-chat, .travian-ai-chat');
  if (chatContainer) {
    const isHidden = (chatContainer as HTMLElement).style.display === 'none';
    (chatContainer as HTMLElement).style.display = isHidden ? 'block' : 'none';
    console.log('[TA Content] Chat UI toggled:', isHidden ? 'shown' : 'hidden');
  } else {
    console.log('[TA Content] Chat UI not found, attempting to load...');
    loadChatUI();
  }
}

// Error handling
window.addEventListener('error', (event) => {
  if (event.filename?.includes('travian-assistant')) {
    console.error('[TA Content] Runtime error:', event.error);
    chrome.runtime.sendMessage({
      type: 'ERROR_REPORT',
      error: {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      }
    });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTravianAssistant);
} else {
  // DOM already loaded
  initializeTravianAssistant();
}

// Handle extension updates/reloads
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'content-script') {
    port.onDisconnect.addListener(() => {
      console.log('[TA Content] Extension disconnected, cleaning up...');
      // Cleanup if needed
    });
  }
});

// Export for debugging
(window as any).travianAssistant = {
  version: VERSION,
  pipeline: dataPipeline,
  refreshData: () => chrome.runtime.sendMessage({ type: 'REFRESH_DATA' }),
  toggleChat: toggleChatUI,
  getContext: () => dataPipeline.getCurrentContext(),
  getAIContext: () => dataPipeline.getAIContext()
};

console.log('[TA Content] Content script loaded successfully');
