// Test script for TravianAssistant Chrome Extension
// Run this in the browser console on a Travian page with the extension loaded

console.log('🧪 TravianAssistant Test Suite v1.0');
console.log('=====================================');

// Test 1: Check if extension is loaded
console.log('\n📦 Test 1: Extension Load Check');
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  console.log('✅ Chrome extension API available');
  console.log('   Extension ID:', chrome.runtime.id);
} else {
  console.error('❌ Chrome extension API not available');
}

// Test 2: Check for content script elements
console.log('\n🎨 Test 2: UI Elements Check');
const chatButton = document.getElementById('tla-chat-button');
const hudElement = document.querySelector('.tla-hud');
if (chatButton) {
  console.log('✅ Chat button found');
} else {
  console.error('❌ Chat button not found');
}
if (hudElement) {
  console.log('✅ HUD element found');
} else {
  console.warn('⚠️ HUD element not found (may be hidden)');
}

// Test 3: Background service ping
console.log('\n📡 Test 3: Background Service Check');
chrome.runtime.sendMessage({type: 'PING'}, response => {
  if (response && response.success) {
    console.log('✅ Background service responding:', response.message);
  } else {
    console.error('❌ Background service not responding');
  }
});

// Test 4: Test chat with minimal data
console.log('\n💬 Test 4: Chat API Test');
setTimeout(() => {
  const testMessage = 'What should I focus on with 8 villages?';
  const testState = {
    villages: [
      {id: '1', name: 'Village 1', population: 500},
      {id: '2', name: 'Village 2', population: 400},
      {id: '3', name: 'Village 3', population: 300},
      {id: '4', name: 'Village 4', population: 250},
      {id: '5', name: 'Village 5', population: 200},
      {id: '6', name: 'Village 6', population: 150},
      {id: '7', name: 'Village 7', population: 100},
      {id: '8', name: 'Village 8', population: 50}
    ],
    resources: {
      wood: 1000,
      clay: 1200,
      iron: 800,
      crop: 2000,
      woodProduction: 500,
      clayProduction: 450,
      ironProduction: 400,
      cropProduction: 600
    }
  };
  
  console.log('   Sending test message:', testMessage);
  chrome.runtime.sendMessage({
    type: 'CHAT_MESSAGE',
    message: testMessage,
    gameState: testState
  }, response => {
    if (response && response.success) {
      console.log('✅ Chat API working!');
      console.log('   AI Response preview:', response.response.substring(0, 100) + '...');
    } else {
      console.error('❌ Chat API failed:', response ? response.error : 'No response');
    }
  });
}, 1000);

// Test 5: Check localStorage/chrome.storage for persistence
console.log('\n💾 Test 5: Storage Check');
chrome.storage.local.get(['chatState'], (result) => {
  if (result.chatState) {
    console.log('✅ Chat state found in storage');
    console.log('   Messages stored:', result.chatState.messages ? result.chatState.messages.length : 0);
    console.log('   Window open:', result.chatState.windowState?.isOpen || false);
    if (result.chatState.windowState?.position) {
      console.log('   Position saved:', result.chatState.windowState.position);
    }
  } else {
    console.warn('⚠️ No chat state in storage (normal for first use)');
  }
});

// Test 6: Check for data scraping
console.log('\n📊 Test 6: Data Scraping Check');
setTimeout(() => {
  // Look for scraper logs in console
  const logs = document.querySelectorAll('script');
  console.log('   Looking for scraper activity...');
  
  // Try to trigger a data refresh
  const refreshButton = document.querySelector('.tla-refresh');
  if (refreshButton) {
    console.log('   Found refresh button, checking logs for [TLA Safe Scraper]');
  } else {
    console.log('   No refresh button found, check console for [TLA] prefixed messages');
  }
}, 2000);

// Test 7: Direct proxy test
console.log('\n🔗 Test 7: Proxy Connection Test');
fetch('https://travian-proxy-simple.vercel.app/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: 'Reply with exactly: "Proxy working"'
    }]
  })
})
.then(r => r.json())
.then(data => {
  if (data.content && data.content[0]) {
    console.log('✅ Direct proxy test successful');
    console.log('   Response:', data.content[0].text);
  } else {
    console.error('❌ Proxy response invalid:', data);
  }
})
.catch(err => {
  console.error('❌ Proxy unreachable:', err.message);
});

console.log('\n🏁 Test suite initiated. Results will appear above as tests complete.');
console.log('   Some tests are async and may take a few seconds.');
console.log('\n📋 Summary will appear when all tests complete...');

// Final summary after all tests
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('Check results above. Key issues to look for:');
  console.log('- ❌ marks indicate failures that need fixing');
  console.log('- ⚠️ marks indicate warnings to investigate');
  console.log('- ✅ marks indicate working features');
  console.log('\nIf Chat API failed but Proxy test passed:');
  console.log('  → Issue is in background.js message handling');
  console.log('If both failed:');
  console.log('  → Check proxy URL or API key configuration');
  console.log('If storage shows wrong state:');
  console.log('  → Clear extension data and reload');
}, 5000);