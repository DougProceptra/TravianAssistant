// Temporary diagnostic script to find where Travian stores global village data
// This will help us locate the JavaScript objects that contain all village production

export function findGlobalVillageData() {
  console.log('🔍 Searching for global village data...');
  
  // Check window object for Travian-specific properties
  const travianKeys = Object.keys(window).filter(key => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('travian') || 
           lowerKey.includes('village') || 
           lowerKey.includes('resource') ||
           lowerKey.includes('production') ||
           lowerKey.includes('game');
  });
  
  console.log('Found potential Travian keys:', travianKeys);
  
  // Check common Travian global objects
  const checkObjects = [
    'Travian',
    'TravianDefaults', 
    'resources',
    'village',
    'villageList',
    'game',
    'Game',
    'player',
    'Player'
  ];
  
  checkObjects.forEach(objName => {
    if (window[objName]) {
      console.log(`Found window.${objName}:`, window[objName]);
      
      // Deep inspect for production data
      if (typeof window[objName] === 'object') {
        Object.keys(window[objName]).forEach(key => {
          if (key.toLowerCase().includes('produc') || 
              key.toLowerCase().includes('village') ||
              key.toLowerCase().includes('resource')) {
            console.log(`  -> ${objName}.${key}:`, window[objName][key]);
          }
        });
      }
    }
  });
  
  // Check for Travian's AJAX/fetch interceptors
  if (window.Travian?.Game?.worldDataStorage) {
    console.log('Found worldDataStorage:', window.Travian.Game.worldDataStorage);
  }
  
  // Check jQuery data stores (Travian uses jQuery)
  if (window.$) {
    // Check for cached village data
    const $villageList = $('#sidebarBoxVillagelist');
    if ($villageList.length) {
      const data = $villageList.data();
      console.log('Village list jQuery data:', data);
    }
  }
  
  // Look for village switcher data
  const villageSwitcher = document.querySelector('#villageListLinks');
  if (villageSwitcher) {
    // Check for data attributes
    const villages = villageSwitcher.querySelectorAll('a[href*="newdid"]');
    villages.forEach((v, i) => {
      console.log(`Village ${i} link:`, v.href, 'data:', v.dataset);
    });
  }
  
  // Check statistics page specific data
  if (window.location.pathname.includes('statistics')) {
    console.log('On statistics page, checking for data tables...');
    
    // Look for the production table
    const tables = document.querySelectorAll('table');
    tables.forEach((table, i) => {
      const headers = table.querySelectorAll('th');
      const headerText = Array.from(headers).map(h => h.textContent?.trim());
      if (headerText.some(h => h?.includes('Production') || h?.includes('Resource'))) {
        console.log(`Found production table ${i}:`, table);
        
        // Extract data from rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 4) {
            const villageData = {
              name: cells[0]?.textContent?.trim(),
              wood: cells[1]?.textContent?.trim(),
              clay: cells[2]?.textContent?.trim(),
              iron: cells[3]?.textContent?.trim(),
              crop: cells[4]?.textContent?.trim()
            };
            console.log('Village production data:', villageData);
          }
        });
      }
    });
  }
  
  // Check for AJAX response interceptors
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const result = originalFetch.apply(this, args);
    result.then(response => {
      const url = args[0];
      if (url.includes('ajax') || url.includes('api')) {
        console.log('AJAX call intercepted:', url);
        response.clone().json().then(data => {
          if (data.villages || data.production || data.resources) {
            console.log('Found village data in AJAX response:', data);
          }
        }).catch(() => {});
      }
    });
    return result;
  };
  
  console.log('Global data search complete. Check console for results.');
}

// Run the diagnostic
findGlobalVillageData();