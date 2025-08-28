console.log('[TEST] Background script loaded');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[TEST] Message received:', message);
  sendResponse({success: true, test: 'response'});
  return true;
});
