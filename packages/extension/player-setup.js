// Player Setup Script for Chrome Extension
// Each player runs this ONCE in their Chrome console while on a Travian page

(function setupTravianAssistant() {
  const BACKEND_URL = 'https://travianassistant.dougdostal.repl.co';
  
  // Prompt for email
  const email = prompt('Enter your email for TravianAssistant (will be hashed for privacy):');
  
  if (!email) {
    console.error('❌ Email is required for setup');
    return;
  }
  
  // Hash the email for privacy
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const userId = Math.abs(hash).toString(36);
  
  // Store in Chrome storage
  chrome.storage.sync.set({
    userEmail: email,
    userId: userId,
    backendUrl: BACKEND_URL
  }, function() {
    console.log('✅ TravianAssistant configured!');
    console.log('📧 Email:', email);
    console.log('🔑 User ID:', userId);
    console.log('🌐 Backend:', BACKEND_URL);
    console.log('');
    console.log('🎮 You can now use TravianAssistant!');
    console.log('Your data will be stored separately from other players.');
    
    // Test connection
    fetch(`${BACKEND_URL}/health`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'healthy') {
          console.log('✅ Backend connection successful!');
        }
      })
      .catch(err => {
        console.error('❌ Backend connection failed:', err);
      });
  });
  
  // Inject visual indicator
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 10000;
  `;
  indicator.textContent = `TA: ${userId}`;
  indicator.title = `TravianAssistant configured for ${email}`;
  document.body.appendChild(indicator);
  
  setTimeout(() => {
    indicator.remove();
  }, 5000);
})();
