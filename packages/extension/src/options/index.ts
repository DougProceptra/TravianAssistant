// packages/extension/src/options/index.ts
console.log("[TLA] Options page v0.3.1 loaded");

// Load saved settings on page load
chrome.storage.local.get(['profile'], (result) => {
  if (result.profile) {
    const p = result.profile;
    setValue('tribe', p.tribe);
    setValue('style', p.style);
    setValue('goldUsage', p.goldUsage);
    setValue('hoursPerDay', p.hoursPerDay);
    setValue('primaryGoal', p.primaryGoal);
  }
});

function setValue(id: string, value: any) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
  if (el) el.value = String(value);
}

function getValue(id: string): string | number {
  const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
  if (!el) return '';
  return el.type === 'number' ? Number(el.value) : el.value;
}

function showStatus(message: string, isError = false) {
  const status = document.getElementById('status')!;
  status.textContent = message;
  status.className = `status ${isError ? 'error' : 'success'}`;
  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

// Save settings
document.getElementById('saveBtn')?.addEventListener('click', () => {
  const profile = {
    tribe: getValue('tribe'),
    style: getValue('style'),
    goldUsage: getValue('goldUsage'),
    hoursPerDay: Number(getValue('hoursPerDay')),
    primaryGoal: getValue('primaryGoal'),
    weights: {
      economy: getValue('style') === 'economic' ? 70 : 30,
      military: getValue('style') === 'aggressive' ? 70 : 20,
      alliance: 10,
      risk: getValue('style') === 'aggressive' ? 30 : 10
    }
  };
  
  chrome.storage.local.set({ profile }, () => {
    showStatus('Settings saved successfully!');
  });
});

// Test connection to proxy
document.getElementById('testBtn')?.addEventListener('click', async () => {
  showStatus('Testing AI connection...');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_CONNECTION'
    });
    
    console.log('[TLA Options] Test response:', response);
    
    if (response.success) {
      showStatus('✅ AI connection successful! Ready to analyze your game.');
    } else if (response.error) {
      showStatus(`❌ Connection failed: ${response.error}`, true);
    } else {
      showStatus('⚠️ Unexpected response from AI', true);
    }
  } catch (error) {
    showStatus('❌ Failed to connect to AI service', true);
    console.error('[TLA Options] Test error:', error);
  }
});

console.log('[TLA Options] Ready');
