// Popup script for TravianAssistant
document.addEventListener('DOMContentLoaded', () => {
  // Open options page
  document.getElementById('open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Trigger sync now
  document.getElementById('sync-now').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SYNC_NOW' }, (response) => {
      if (response && response.success) {
        const statusEl = document.getElementById('backend-status');
        statusEl.textContent = 'Sync triggered!';
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    });
  });

  // Check backend status
  chrome.runtime.sendMessage({ type: 'CHECK_BACKEND_STATUS' }, (response) => {
    const statusEl = document.getElementById('backend-status');
    if (chrome.runtime.lastError) {
      statusEl.textContent = 'Extension error';
      statusEl.className = 'backend-status disconnected';
    } else if (response && response.connected) {
      statusEl.textContent = 'Connected to backend';
      statusEl.className = 'backend-status connected';
    } else {
      statusEl.textContent = 'Not connected';
      statusEl.className = 'backend-status disconnected';
    }
  });
});