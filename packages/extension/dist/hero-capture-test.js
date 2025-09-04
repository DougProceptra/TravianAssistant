// TravianAssistant Hero Data Capture Test
// Run this in console on the hero/attributes page to capture ALL hero data

(function captureHeroData() {
  console.log('=== CAPTURING HERO DATA ===');
  const heroData = {};
  
  // Method 1: Look for specific labeled rows
  document.querySelectorAll('tr').forEach(row => {
    const text = row.innerText || '';
    
    // Hero name and level (format: "McCarthy - level 39")
    if (text.includes('level') && !text.includes('Level:')) {
      const match = text.match(/level\s+(\d+)/i);
      if (match) {
        heroData.level = parseInt(match[1]);
        console.log('Found level:', heroData.level);
      }
      // Extract hero name
      const nameMatch = text.match(/^([^-]+)\s*-\s*level/i);
      if (nameMatch) {
        heroData.name = nameMatch[1].trim();
        console.log('Found name:', heroData.name);
      }
    }
    
    // Experience (look for row with "Experience" label)
    if (text.includes('Experience') && !heroData.experience) {
      const match = text.match(/Experience[:\s]*(\d+)/i) || text.match(/(\d{5,})/);
      if (match) {
        heroData.experience = parseInt(match[1]);
        console.log('Found experience:', heroData.experience);
      }
    }
    
    // Health (look for row with "Health" label - should be 91%)
    if (text.includes('Health') && !heroData.health) {
      // Get all percentages in the row and take the last one (usually the value)
      const percentages = text.match(/(\d+)\s*%/g);
      if (percentages && percentages.length > 0) {
        // Take the last percentage found in the health row
        const lastPercent = percentages[percentages.length - 1];
        heroData.health = parseInt(lastPercent);
        console.log('Found health:', heroData.health + '%');
      }
    }
    
    // Fighting Strength
    if ((text.includes('Fighting') || text.includes('Strength')) && !heroData.fightingStrength) {
      const match = text.match(/(\d{4,5})/);
      if (match) {
        heroData.fightingStrength = parseInt(match[1]);
        console.log('Found fighting strength:', heroData.fightingStrength);
      }
    }
    
    // Speed
    if (text.includes('Speed') && !heroData.speed) {
      const match = text.match(/Speed[:\s]*(\d+)/i) || text.match(/(\d+)\s*fields/i);
      if (match) {
        heroData.speed = parseInt(match[1]);
        console.log('Found speed:', heroData.speed);
      }
    }
    
    // Attack value
    if (text.includes('Attack') && !text.includes('Bonus') && !heroData.attack) {
      const match = text.match(/(\d+)/);
      if (match) {
        heroData.attack = parseInt(match[1]);
        console.log('Found attack:', heroData.attack);
      }
    }
    
    // Defence values
    if (text.includes('Defence') && !text.includes('Bonus')) {
      const numbers = text.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        heroData.defenceInfantry = parseInt(numbers[0]);
        heroData.defenceCavalry = parseInt(numbers[1]);
        console.log('Found defence:', heroData.defenceInfantry, '/', heroData.defenceCavalry);
      }
    }
  });
  
  // Method 2: Look for Hero Production section
  console.log('\n=== CHECKING HERO PRODUCTION ===');
  const productionSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent && el.textContent.includes('Hero production')
  );
  
  if (productionSection) {
    const parent = productionSection.closest('table') || productionSection.parentElement;
    if (parent) {
      // Find all radio inputs to see which is selected
      const radios = parent.querySelectorAll('input[type="radio"]');
      const checkedIndex = Array.from(radios).findIndex(r => r.checked);
      
      // Find production values (usually 4-5 digit numbers)
      const prodValues = parent.textContent.match(/\d{4,5}/g);
      if (prodValues) {
        console.log('Production values found:', prodValues);
        console.log('Selected option index:', checkedIndex);
        
        if (checkedIndex === 0) {
          // All resources
          heroData.resourceProduction = {
            type: 'all',
            wood: parseInt(prodValues[0]),
            clay: parseInt(prodValues[0]),
            iron: parseInt(prodValues[0]),
            crop: parseInt(prodValues[0])
          };
        } else if (checkedIndex > 0 && checkedIndex <= 4) {
          // Single resource
          const types = ['wood', 'clay', 'iron', 'crop'];
          heroData.resourceProduction = {
            type: types[checkedIndex - 1],
            value: parseInt(prodValues[1] || prodValues[0])
          };
        }
        console.log('Resource production:', heroData.resourceProduction);
      }
    }
  }
  
  // Method 3: Look for Hero Equipment Benefits section
  console.log('\n=== CHECKING EQUIPMENT BENEFITS ===');
  heroData.equipment = {};
  
  // Find the equipment section
  const equipSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent && (
      el.textContent.includes('Equipment') || 
      el.textContent.includes('Bonus') ||
      el.textContent.includes('Hero items')
    )
  );
  
  if (equipSection) {
    const parent = equipSection.closest('table, .heroItems, .equipment') || equipSection.parentElement;
    if (parent) {
      const text = parent.textContent || parent.innerText || '';
      
      // Culture points bonus
      const cpMatch = text.match(/Culture\s+points[:\s]*([\d.]+)/i);
      if (cpMatch) {
        heroData.equipment.culturePoints = parseFloat(cpMatch[1]);
        console.log('Culture points bonus:', heroData.equipment.culturePoints);
      }
      
      // Attack bonus
      const attackBonusMatch = text.match(/Attack\s+bonus[:\s]*([\d.]+)%?/i);
      if (attackBonusMatch) {
        heroData.equipment.attackBonus = parseFloat(attackBonusMatch[1]);
        console.log('Attack bonus:', heroData.equipment.attackBonus + '%');
      }
      
      // Defense bonus
      const defBonusMatch = text.match(/Def(?:ence|ense)?\s+bonus[:\s]*([\d.]+)%?/i);
      if (defBonusMatch) {
        heroData.equipment.defenseBonus = parseFloat(defBonusMatch[1]);
        console.log('Defense bonus:', heroData.equipment.defenseBonus + '%');
      }
      
      // Fighting strength bonus
      const fightingBonusMatch = text.match(/Fighting\s+strength[:\s]+\+([\d.]+)/i);
      if (fightingBonusMatch) {
        heroData.equipment.fightingStrengthBonus = parseFloat(fightingBonusMatch[1]);
        console.log('Fighting strength bonus:', heroData.equipment.fightingStrengthBonus);
      }
      
      // Speed bonus
      const speedBonusMatch = text.match(/Speed[:\s]+\+([\d.]+)/i);
      if (speedBonusMatch) {
        heroData.equipment.speedBonus = parseFloat(speedBonusMatch[1]);
        console.log('Speed bonus:', heroData.equipment.speedBonus);
      }
      
      // Health regeneration
      const regenMatch = text.match(/Health\s+regeneration[:\s]*([\d.]+)/i);
      if (regenMatch) {
        heroData.equipment.healthRegen = parseFloat(regenMatch[1]);
        console.log('Health regeneration:', heroData.equipment.healthRegen);
      }
      
      // Return time
      const returnMatch = text.match(/Return\s+time[:\s]*([\d.]+)%?/i);
      if (returnMatch) {
        heroData.equipment.returnTime = parseFloat(returnMatch[1]);
        console.log('Return time:', heroData.equipment.returnTime + '%');
      }
    }
  }
  
  // Method 4: Check for specific item bonuses in a list format
  document.querySelectorAll('li, .equipment-item, .hero-bonus').forEach(item => {
    const text = item.textContent || '';
    
    // Troop training time
    if (text.includes('training time') || text.includes('Training duration')) {
      const match = text.match(/([\d.]+)%/);
      if (match) {
        heroData.equipment = heroData.equipment || {};
        heroData.equipment.trainingTime = parseFloat(match[1]);
        console.log('Training time reduction:', heroData.equipment.trainingTime + '%');
      }
    }
    
    // Resource production bonus
    if (text.includes('production') && text.match(/\+?([\d.]+)%/)) {
      const match = text.match(/\+?([\d.]+)%/);
      if (match) {
        heroData.equipment = heroData.equipment || {};
        heroData.equipment.productionBonus = parseFloat(match[1]);
        console.log('Production bonus:', heroData.equipment.productionBonus + '%');
      }
    }
    
    // Capacity bonus
    if (text.includes('capacity') || text.includes('Capacity')) {
      const match = text.match(/([\d.]+)/);
      if (match) {
        heroData.equipment = heroData.equipment || {};
        heroData.equipment.capacityBonus = parseFloat(match[1]);
        console.log('Capacity bonus:', heroData.equipment.capacityBonus);
      }
    }
  });
  
  // Method 5: Try to find equipment items by image or tooltip
  console.log('\n=== CHECKING EQUIPMENT ITEMS ===');
  heroData.items = [];
  
  document.querySelectorAll('img[alt*="item"], img[title*="item"], .item, .heroItem').forEach(item => {
    const alt = item.alt || '';
    const title = item.title || '';
    const parent = item.parentElement;
    const tooltip = parent ? parent.title || parent.getAttribute('tooltip') || '' : '';
    
    const itemInfo = alt || title || tooltip;
    if (itemInfo && itemInfo.length > 0) {
      heroData.items.push(itemInfo);
      console.log('Found item:', itemInfo);
    }
  });
  
  // Final summary
  console.log('\n=== FINAL HERO DATA ===');
  console.log(JSON.stringify(heroData, null, 2));
  
  // Store in localStorage for the extension to use
  if (Object.keys(heroData).length > 0) {
    localStorage.setItem('TLA_HERO_DATA', JSON.stringify({
      ...heroData,
      timestamp: new Date().toISOString()
    }));
    console.log('Data stored in localStorage');
  }
  
  // Also update display if HUD exists
  if (typeof window.updateHeroDisplay === 'function') {
    window.updateHeroDisplay(heroData);
  }
  
  return heroData;
})();