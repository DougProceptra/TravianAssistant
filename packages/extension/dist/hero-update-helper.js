// TravianAssistant HUD - Manual Hero Data Update Button
// Add this to the existing content.js by appending at the end of the createHUD function

// Add a manual update button to the hero window
(function() {
  // Wait for HUD to load
  setTimeout(() => {
    const heroWindow = document.querySelector('.ta-hero-window .ta-window-content');
    if (heroWindow) {
      // Add manual update button
      const updateBtn = document.createElement('button');
      updateBtn.textContent = 'Update Hero Data';
      updateBtn.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-top: 10px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      `;
      updateBtn.onclick = () => {
        // Manual hero data capture
        const heroData = {};
        
        // Look for the hero stats table that's visible
        const statsPanel = document.querySelector('.heroStats, [class*="hero"], #heroStats');
        if (statsPanel) {
          const text = statsPanel.innerText || statsPanel.textContent;
          
          // Extract level
          const levelMatch = text.match(/Level[:\s]+(\d+)/i);
          if (levelMatch) heroData.level = parseInt(levelMatch[1]);
          
          // Extract experience
          const expMatch = text.match(/Experience[:\s]+(\d+)/i);
          if (expMatch) heroData.experience = parseInt(expMatch[1]);
          
          // Extract health percentage
          const healthMatch = text.match(/Health[:\s]+(\d+)%/i);
          if (healthMatch) heroData.health = parseInt(healthMatch[1]);
          
          // Extract fighting strength
          const strengthMatch = text.match(/Fighting[:\s]+(\d+)/i);
          if (strengthMatch) heroData.fightingStrength = parseInt(strengthMatch[1]);
        }
        
        // Store the data
        if (Object.keys(heroData).length > 0) {
          localStorage.setItem('TLA_HERO_DATA', JSON.stringify({
            ...heroData,
            timestamp: new Date().toISOString()
          }));
          
          // Update display
          document.getElementById('ta-hero-level').textContent = heroData.level || '-';
          document.getElementById('ta-hero-exp').textContent = heroData.experience ? 
            (heroData.experience > 1000 ? (heroData.experience/1000).toFixed(1) + 'k' : heroData.experience) : '-';
          document.getElementById('ta-hero-health').textContent = heroData.health ? heroData.health + '%' : '-';
          document.getElementById('ta-hero-fighting').textContent = heroData.fightingStrength ? 
            (heroData.fightingStrength > 1000 ? (heroData.fightingStrength/1000).toFixed(1) + 'k' : heroData.fightingStrength) : '-';
          
          updateBtn.textContent = 'Updated!';
          setTimeout(() => {
            updateBtn.textContent = 'Update Hero Data';
          }, 2000);
        }
      };
      
      heroWindow.appendChild(updateBtn);
    }
  }, 2000);
})();