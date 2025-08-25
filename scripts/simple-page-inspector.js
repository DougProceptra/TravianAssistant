// TravianAssistant Simple Page Inspector
// This version inspects ONLY the current page - no navigation
// Run this on each page you want to inspect

(function() {
  'use strict';
  
  console.log('%c🔍 TravianAssistant Simple Inspector Started!', 'color: green; font-size: 16px; font-weight: bold');
  
  const results = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    pageType: 'unknown',
    data: {}
  };
  
  // Identify page type
  const path = window.location.pathname;
  if (path.includes('/village/statistics/overview')) {
    results.pageType = 'statistics-overview';
  } else if (path.includes('/village/statistics/resources')) {
    results.pageType = 'statistics-resources';
  } else if (path.includes('/village/statistics/culturepoints')) {
    results.pageType = 'statistics-culture';
  } else if (path.includes('/village/statistics/troops')) {
    results.pageType = 'statistics-troops';
  } else if (path.includes('/production.php')) {
    results.pageType = 'production';
  } else if (path.includes('/dorf1.php')) {
    results.pageType = 'village-resources';
  } else if (path.includes('/dorf2.php')) {
    results.pageType = 'village-buildings';
  } else if (path.includes('/build.php')) {
    results.pageType = 'building';
  }
  
  console.log('📍 Current page type:', results.pageType);
  
  // Check for resources in stockBar
  console.group('🌾 Checking Resources...');
  const resourceSelectors = [
    { name: 'wood', selectors: ['#l1', '.r1', '#stockBarResource1 .value'] },
    { name: 'clay', selectors: ['#l2', '.r2', '#stockBarResource2 .value'] },
    { name: 'iron', selectors: ['#l3', '.r3', '#stockBarResource3 .value'] },
    { name: 'crop', selectors: ['#l4', '.r4', '#stockBarResource4 .value'] },
    { name: 'freeCrop', selectors: ['#l5', '.r5', '#stockBarFreeCrop .value'] }
  ];
  
  results.data.resources = {};
  resourceSelectors.forEach(res => {
    for (let selector of res.selectors) {
      const elem = document.querySelector(selector);
      if (elem) {
        const value = elem.textContent.replace(/[^\d-]/g, '');
        results.data.resources[res.name] = parseInt(value) || 0;
        console.log(`✅ ${res.name}: ${value} (selector: ${selector})`);
        break;
      }
    }
    if (!results.data.resources[res.name]) {
      console.log(`❌ ${res.name}: not found`);
    }
  });
  console.groupEnd();
  
  // Check for tables
  console.group('📋 Checking Tables...');
  const tables = document.querySelectorAll('table');
  results.data.tables = [];
  
  tables.forEach((table, idx) => {
    const tableInfo = {
      index: idx,
      id: table.id || 'no-id',
      className: table.className || 'no-class',
      headerCount: table.querySelectorAll('thead th').length,
      rowCount: table.querySelectorAll('tbody tr').length
    };
    
    // Get headers
    const headers = [];
    table.querySelectorAll('thead th, tbody tr:first-child th').forEach(th => {
      headers.push(th.textContent.trim());
    });
    tableInfo.headers = headers;
    
    console.log(`Table ${idx}: ${tableInfo.id || tableInfo.className}`);
    console.log(`  Headers: ${headers.join(', ')}`);
    console.log(`  Rows: ${tableInfo.rowCount}`);
    
    results.data.tables.push(tableInfo);
  });
  console.groupEnd();
  
  // Special handling for statistics pages
  if (results.pageType.includes('statistics')) {
    console.group('📊 Statistics Page Analysis...');
    
    const overviewTable = document.querySelector('table#overview, table.overview, table');
    if (overviewTable) {
      const rows = overviewTable.querySelectorAll('tbody tr');
      console.log(`Found ${rows.length} village rows`);
      
      if (rows.length > 0) {
        // Analyze first row structure
        const firstRow = rows[0];
        const cells = firstRow.querySelectorAll('td');
        console.log(`First row has ${cells.length} cells:`);
        
        cells.forEach((cell, idx) => {
          console.log(`  Cell ${idx}: "${cell.textContent.trim().substring(0, 30)}..."`);
        });
      }
    }
    console.groupEnd();
  }
  
  // Check for game variables
  console.group('🎮 Checking Game Variables...');
  const gameVars = ['resources', 'production', 'storage', 'Travian'];
  results.data.gameVariables = {};
  
  gameVars.forEach(varName => {
    if (typeof window[varName] !== 'undefined') {
      console.log(`✅ window.${varName} exists:`, typeof window[varName]);
      results.data.gameVariables[varName] = typeof window[varName];
    } else {
      console.log(`❌ window.${varName} not found`);
    }
  });
  console.groupEnd();
  
  // Save to localStorage
  const storageKey = `TLA_INSPECT_${results.pageType}_${Date.now()}`;
  localStorage.setItem(storageKey, JSON.stringify(results));
  
  console.log('%c✅ Inspection Complete!', 'color: green; font-size: 14px; font-weight: bold');
  console.log('Results saved to localStorage with key:', storageKey);
  console.log('Full results:', results);
  
  // Create summary
  console.group('📝 Summary');
  console.log('Page Type:', results.pageType);
  console.log('Resources Found:', Object.keys(results.data.resources).length);
  console.log('Tables Found:', results.data.tables.length);
  console.log('Game Variables Found:', Object.keys(results.data.gameVariables).length);
  console.groupEnd();
  
  // Add helper to window
  window.TLA_LastInspection = results;
  console.log('💡 Tip: Access results anytime with: window.TLA_LastInspection');
  
  return results;
})();