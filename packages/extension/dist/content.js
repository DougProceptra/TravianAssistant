    captureHeroData() {
      // Check if we're on hero attributes page - Travian uses different URL patterns
      if (window.location.href.includes('hero.php') || 
          window.location.href.includes('/hero/attributes') ||
          window.location.href.includes('hero/')) {
        
        console.log('[TLA] On hero page - capturing hero data...');
        const heroData = {};
        
        // Extract hero level from header or level display
        const heroHeader = document.querySelector('#content h1');
        if (heroHeader) {
          const levelMatch = heroHeader.textContent.match(/level\s+(\d+)/i);
          if (levelMatch) {
            heroData.level = parseInt(levelMatch[1]);
          }
        }
        
        // Alternative method for level - look for level in any element
        if (!heroData.level) {
          const levelElements = document.querySelectorAll('*');
          for (let elem of levelElements) {
            const text = elem.textContent;
            if (text && text.includes('Level:')) {
              const levelMatch = text.match(/Level:\s*(\d+)/i);
              if (levelMatch) {
                heroData.level = parseInt(levelMatch[1]);
                break;
              }
            }
          }
        }
        
        // Extract experience from any element
        const bodyText = document.body.textContent;
        const expMatch = bodyText.match(/Experience[\s\S]*?(\d{4,})/i) || bodyText.match(/(\d{5,})\s*exp/i);
        if (expMatch) {
          heroData.experience = parseInt(expMatch[1]);
        }
        
        // Extract health percentage
        const healthMatch = bodyText.match(/Health[\s\S]*?(\d+)%/i) || bodyText.match(/(\d+)%.*health/i);
        if (healthMatch) {
          heroData.health = parseInt(healthMatch[1]);
        }
        
        // Extract fighting strength
        const strengthMatch = bodyText.match(/Fighting strength[\s\S]*?(\d{3,})/i) || bodyText.match(/(\d{3,})\s*fighting/i);
        if (strengthMatch) {
          heroData.fightingStrength = parseInt(strengthMatch[1]);
        }
        
        // Extract bonuses
        const offBonusMatch = bodyText.match(/Off bonus[\s\S]*?([\d.]+)%/i);
        if (offBonusMatch) {
          heroData.offBonus = parseFloat(offBonusMatch[1]);
        }
        
        const defBonusMatch = bodyText.match(/Def bonus[\s\S]*?([\d.]+)%/i);
        if (defBonusMatch) {
          heroData.defBonus = parseFloat(defBonusMatch[1]);
        }
        
        const resourceBonusMatch = bodyText.match(/Resource Bonus[\s\S]*?(\d+)%/i);
        if (resourceBonusMatch) {
          heroData.resourceBonus = parseInt(resourceBonusMatch[1]);
        }
        
        // Debug logging
        console.log('[TLA] Hero page URL:', window.location.href);
        console.log('[TLA] Hero data extracted:', heroData);
        
        // Store if we found any data
        if (heroData.level || heroData.experience || heroData.health) {
          this.gameData.heroData = heroData;
          localStorage.setItem('TLA_HERO_DATA', JSON.stringify({
            ...heroData,
            timestamp: new Date().toISOString()
          }));
          console.log('[TLA] Captured hero data:', heroData);
        } else {
          console.log('[TLA] No hero data found on this page');
        }
      }
      
      // Also try to capture hero data from any page that shows hero stats
      const heroStatsDiv = document.querySelector('.heroStats, #heroStats, [class*="hero"]');
      if (heroStatsDiv && !this.gameData.heroData?.level) {
        console.log('[TLA] Found hero stats element, trying to extract data...');
        const heroData = {};
        const statsText = heroStatsDiv.textContent;
        
        const levelMatch = statsText.match(/Level[\s:]*(\d+)/i);
        if (levelMatch) heroData.level = parseInt(levelMatch[1]);
        
        const expMatch = statsText.match(/Experience[\s:]*(\d+)/i);
        if (expMatch) heroData.experience = parseInt(expMatch[1]);
        
        const healthMatch = statsText.match(/Health[\s:]*(\d+)%/i);
        if (healthMatch) heroData.health = parseInt(healthMatch[1]);
        
        if (Object.keys(heroData).length > 0) {
          this.gameData.heroData = { ...this.gameData.heroData, ...heroData };
          localStorage.setItem('TLA_HERO_DATA', JSON.stringify({
            ...this.gameData.heroData,
            timestamp: new Date().toISOString()
          }));
          console.log('[TLA] Captured hero data from stats element:', heroData);
        }
      }
    }