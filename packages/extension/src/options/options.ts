// Options page script
// Configure backend URL and other settings

document.addEventListener('DOMContentLoaded', async () => {
  // Load current settings
  const settings = await chrome.storage.sync.get([
    'backendUrl',
    'backendEnabled',
    'proxyUrl'
  ]);
  
  // Backend settings
  const backendEnabled = document.getElementById('backend-enabled') as HTMLInputElement;
  const backendUrl = document.getElementById('backend-url') as HTMLInputElement;
  const backendOptions = document.getElementById('backend-options') as HTMLDivElement;
  
  backendEnabled.checked = settings.backendEnabled || false;
  backendUrl.value = settings.backendUrl || '';
  backendOptions.style.display = backendEnabled.checked ? 'block' : 'none';
  
  backendEnabled.addEventListener('change', () => {
    backendOptions.style.display = backendEnabled.checked ? 'block' : 'none';
    saveSettings();
  });
  
  // Proxy settings
  const proxyUrl = document.getElementById('proxy-url') as HTMLInputElement;
  proxyUrl.value = settings.proxyUrl || '';
  
  // Save settings on change
  backendUrl.addEventListener('change', saveSettings);
  proxyUrl.addEventListener('change', saveSettings);
  
  async function saveSettings() {
    const settings = {
      backendEnabled: backendEnabled.checked,
      backendUrl: backendUrl.value || 'http://localhost:3001',
      proxyUrl: proxyUrl.value || 'https://travian-proxy-simple.vercel.app/api/proxy'
    };
    
    await chrome.storage.sync.set(settings);
    
    // Notify background script to update
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings
    });
    
    showStatus('Settings saved!', 'success');
  }
  
  // Test backend connection
  document.getElementById('test-backend')?.addEventListener('click', async () => {
    const url = backendUrl.value || 'http://localhost:3001';
    const statusEl = document.getElementById('backend-status')!;
    
    try {
      statusEl.textContent = 'Testing connection...';
      statusEl.className = 'status';
      statusEl.style.display = 'block';
      
      const response = await fetch(`${url}/api/account/test`);
      
      if (response.ok) {
        statusEl.textContent = '✅ Backend connection successful!';
        statusEl.className = 'status success';
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      statusEl.textContent = `❌ Connection failed: ${error.message}\nMake sure your backend server is running.`;
      statusEl.className = 'status error';
    }
  });
  
  // Test proxy connection
  document.getElementById('test-proxy')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('proxy-status')!;
    
    try {
      statusEl.textContent = 'Testing AI connection...';
      statusEl.className = 'status';
      statusEl.style.display = 'block';
      
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_CONNECTION'
      });
      
      if (response.success) {
        statusEl.textContent = '✅ AI connection successful!';
        statusEl.className = 'status success';
      } else {
        throw new Error(response.error || 'Connection failed');
      }
    } catch (error) {
      statusEl.textContent = `❌ AI connection failed: ${error.message}`;
      statusEl.className = 'status error';
    }
  });
  
  // Export data
  document.getElementById('export-data')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('data-status')!;
    try {
      // Send message to content script to export
      const tabs = await chrome.tabs.query({ url: '*://*.travian.com/*' });
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id!, { type: 'EXPORT_DATA' });
        statusEl.textContent = '✅ Data export triggered - check your downloads';
        statusEl.className = 'status success';
        statusEl.style.display = 'block';
      } else {
        throw new Error('Please open a Travian tab first');
      }
    } catch (error) {
      statusEl.textContent = `❌ Export failed: ${error.message}`;
      statusEl.className = 'status error';
      statusEl.style.display = 'block';
    }
  });
  
  // Clear cache
  document.getElementById('clear-cache')?.addEventListener('click', async () => {
    if (confirm('This will clear all locally stored game data. Are you sure?')) {
      const statusEl = document.getElementById('data-status')!;
      try {
        await chrome.storage.local.clear();
        statusEl.textContent = '✅ Local cache cleared';
        statusEl.className = 'status success';
        statusEl.style.display = 'block';
      } catch (error) {
        statusEl.textContent = `❌ Failed to clear cache: ${error.message}`;
        statusEl.className = 'status error';
        statusEl.style.display = 'block';
      }
    }
  });
  
  function showStatus(message: string, type: 'success' | 'error') {
    // Show a temporary status message
    const statusEl = document.createElement('div');
    statusEl.className = `status ${type}`;
    statusEl.textContent = message;
    statusEl.style.position = 'fixed';
    statusEl.style.top = '20px';
    statusEl.style.right = '20px';
    statusEl.style.zIndex = '9999';
    document.body.appendChild(statusEl);
    
    setTimeout(() => {
      statusEl.remove();
    }, 3000);
  }
});

// Helper function for preset buttons
(window as any).setBackendUrl = function(url: string) {
  const input = document.getElementById('backend-url') as HTMLInputElement;
  input.value = url;
  input.dispatchEvent(new Event('change'));
};