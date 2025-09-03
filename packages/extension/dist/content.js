    updateHeroDisplay() {
      const hero = this.gameData.heroData || {};
      document.getElementById('ta-hero-level').textContent = hero.level || '-';
      document.getElementById('ta-hero-exp').textContent = hero.experience ? this.formatNumber(hero.experience) : '-';
      document.getElementById('ta-hero-health').textContent = hero.health !== undefined ? hero.health : '-';
      document.getElementById('ta-hero-fighting').textContent = hero.fightingStrength ? this.formatNumber(hero.fightingStrength) : '-';
      document.getElementById('ta-hero-off-bonus').textContent = hero.offBonus !== undefined ? hero.offBonus.toFixed(1) : '-';
      document.getElementById('ta-hero-def-bonus').textContent = hero.defBonus !== undefined ? hero.defBonus.toFixed(1) : '-';
      
      // Handle resource production display
      if (hero.resourceProduction) {
        const prod = hero.resourceProduction;
        const resourceText = this.formatNumber(prod.wood) + '/' + 
                            this.formatNumber(prod.clay) + '/' + 
                            this.formatNumber(prod.iron) + '/' + 
                            this.formatNumber(prod.crop) + ' /h';
        document.getElementById('ta-hero-resources').textContent = resourceText;
      } else if (hero.resourceBonus !== undefined) {
        // Fallback to old format
        document.getElementById('ta-hero-resources').textContent = hero.resourceBonus;
      } else {
        document.getElementById('ta-hero-resources').textContent = '-';
      }
    }