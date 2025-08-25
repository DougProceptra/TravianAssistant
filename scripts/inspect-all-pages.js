// TravianAssistant Multi-Page Inspector v3
// Automatically inspects all key pages and saves results to localStorage
// Run this ONCE and it will navigate through pages collecting data

(function() {
  'use strict';
  
  const INSPECTOR_KEY = 'TLA_INSPECTION_RESULTS';
  const CURRENT_PAGE_KEY = 'TLA_CURRENT_INSPECTION';
  
  // Pages to inspect in order
  const PAGES_TO_INSPECT = [
    { url: '/village/statistics/overview', name: 'Statistics Overview' },
    { url: '/village/statistics/resources', name: 'Resources Tab' },
    { url: '/village/statistics/culturepoints', name: 'Culture Points Tab' },
    { url: '/village/statistics/troops', name: 'Troops Tab' },
    { url: '/production.php', name: 'Production Page' },
    { url: '/build.php', name: 'Village Center' },
    { url: '/build.php?id=39', name: 'Rally Point' },
    { url: '/build.php?id=17', name: 'Marketplace' }
  ];
  
  // Get current inspection state
  function getInspectionState() {
    const state = localStorage.getItem(CURRENT_PAGE_KEY);
    return state ? JSON.parse(state) : { index: 0, results: {} };
  }
  
  // Save inspection state
  function saveInspectionState(state) {
    localStorage.setItem(CURRENT_PAGE_KEY, JSON.stringify(state));
  }
  
  // Inspect current page
  function inspectCurrentPage() {
    const results = {
      url: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
      tables: [],
      resources: null,
      population: null,
      villages: [],
      rawData: {}
    };
    
    // Get resource bar data
    const stockBar = document.querySelector('#stockBar, .stockBar');
    if (stockBar) {
      results.resources = {
        wood: stockBar.querySelector('.wood .value')?.textContent?.trim(),
        clay: stockBar.querySelector('.clay .value')?.textContent?.trim(),
        iron: stockBar.querySelector('.iron .value')?.textContent?.trim(),
        crop: stockBar.querySelector('.crop .value')?.textContent?.trim(),
        freeCrop: stockBar.querySelector('.freeCrop .value')?.textContent?.trim()
      };
    }
    
    // Get population
    const popElement = document.querySelector('[class*="population"] .value, .inhabitants');
    if (popElement) {
      results.population = popElement.textContent.trim();
    }
    
    // Inspect all tables
    document.querySelectorAll('table').forEach((table, idx) => {
      const tableData = {
        index: idx,
        id: table.id || null,
        className: table.className || null,
        headers: [],
        sampleRows: [],
        rowCount: 0
      };
      
      // Get headers
      const headers = table.querySelectorAll('thead th, tbody tr:first-child th, tr:first-child td');
      headers.forEach(h => {
        const text = h.textContent.trim();
        if (text) tableData.headers.push(text);
      });
      
      // Get sample rows (first 3 data rows)
      const rows = table.querySelectorAll('tbody tr, tr');
      tableData.rowCount = rows.length;
      
      rows.forEach((row, rowIdx) => {
        if (rowIdx < 3) {
          const rowData = [];
          row.querySelectorAll('td').forEach(cell => {
            rowData.push(cell.textContent.trim());
          });
          if (rowData.length > 0) {
            tableData.sampleRows.push(rowData);
          }
        }
      });
      
      if (tableData.headers.length > 0 || tableData.sampleRows.length > 0) {
        results.tables.push(tableData);
      }
    });
    
    // Special handling for statistics pages
    if (window.location.pathname.includes('/village/statistics')) {
      // Look for village data in any format
      const villageRows = document.querySelectorAll('tr[data-village-id], .village-row, tbody tr');
      villageRows.forEach(row => {
        const villageData = {};
        row.querySelectorAll('td').forEach((cell, idx) => {
          villageData[`col_${idx}`] = cell.textContent.trim();
        });
        if (Object.keys(villageData).length > 0) {
          results.villages.push(villageData);
        }
      });
    }
    
    // Special handling for production page
    if (window.location.pathname.includes('production.php')) {
      const production = {};
      document.querySelectorAll('.production, .num, [class*="prod"]').forEach(el => {
        const text = el.textContent.trim();
        if (text.match(/\d+/)) {
          const parent = el.closest('tr, div');
          const label = parent?.querySelector('.res, .type, .name')?.textContent?.trim() || 'unknown';
          production[label] = text;
        }
      });
      results.rawData.production = production;
    }
    
    // Special handling for building page
    if (window.location.pathname.includes('build.php')) {
      const buildings = [];
      document.querySelectorAll('.buildingSlot, .building, [class*="building"]').forEach(el => {
        const building = {
          id: el.getAttribute('data-building-id') || el.className,
          level: el.querySelector('.level, .lvl, [class*="level"]')?.textContent?.trim(),
          name: el.querySelector('.name, [class*="name"]')?.textContent?.trim()
        };
        if (building.level || building.name) {
          buildings.push(building);
        }
      });
      results.rawData.buildings = buildings;
    }
    
    return results;
  }
  
  // Navigate to next page
  function navigateToNext(state) {
    if (state.index >= PAGES_TO_INSPECT.length) {
      // All done! Save final results
      localStorage.setItem(INSPECTOR_KEY, JSON.stringify(state.results));
      localStorage.removeItem(CURRENT_PAGE_KEY);
      
      console.log('%c✅ INSPECTION COMPLETE!', 'color: green; font-size: 16px; font-weight: bold');
      console.log('Results saved to localStorage. Run this to view:');
      console.log('JSON.parse(localStorage.getItem("TLA_INSPECTION_RESULTS"))');
      
      // Display summary
      displaySummary(state.results);
      return;
    }
    
    const nextPage = PAGES_TO_INSPECT[state.index];
    console.log(`📍 Navigating to: ${nextPage.name} (${state.index + 1}/${PAGES_TO_INSPECT.length})`);
    
    // Check if we're already on the right page
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath === nextPage.url) {
      // Already here, inspect and move on
      setTimeout(() => runInspection(), 500);
    } else {
      // Navigate to the page
      window.location.href = nextPage.url;
    }
  }
  
  // Display summary of results
  function displaySummary(results) {
    console.group('📊 Inspection Summary');
    
    Object.keys(results).forEach(pageName => {
      const pageData = results[pageName];
      console.group(`📄 ${pageName}`);
      
      if (pageData.tables && pageData.tables.length > 0) {
        console.log(`Tables found: ${pageData.tables.length}`);
        pageData.tables.forEach(table => {
          console.log(`  - ${table.id || table.className || 'unnamed'}: ${table.headers.join(', ')}`);
        });
      }
      
      if (pageData.resources) {
        console.log('Resources:', pageData.resources);
      }
      
      if (pageData.population) {
        console.log('Population:', pageData.population);
      }
      
      if (pageData.villages && pageData.villages.length > 0) {
        console.log(`Villages found: ${pageData.villages.length}`);
      }
      
      if (pageData.rawData && Object.keys(pageData.rawData).length > 0) {
        console.log('Additional data:', Object.keys(pageData.rawData));
      }
      
      console.groupEnd();
    });
    
    console.groupEnd();
    
    // Create download link
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    console.log(`💾 Download results: ${url}`);
    
    // Auto-download
    const a = document.createElement('a');
    a.href = url;
    a.download = `travian-inspection-${Date.now()}.json`;
    a.click();
  }
  
  // Main inspection runner
  function runInspection() {
    const state = getInspectionState();
    const currentPath = window.location.pathname + window.location.search;
    
    // Find which page we're on
    let currentPageIndex = -1;
    let currentPageName = 'Unknown';
    
    PAGES_TO_INSPECT.forEach((page, idx) => {
      if (currentPath === page.url) {
        currentPageIndex = idx;
        currentPageName = page.name;
      }
    });
    
    // If we're on a page to inspect and it matches our state index
    if (currentPageIndex === state.index) {
      console.log(`🔍 Inspecting: ${currentPageName}`);
      
      // Inspect this page
      const pageResults = inspectCurrentPage();
      state.results[currentPageName] = pageResults;
      
      // Move to next page
      state.index++;
      saveInspectionState(state);
      
      // Navigate after a short delay
      setTimeout(() => navigateToNext(state), 1000);
    } else if (currentPageIndex >= 0) {
      // We're on a page in our list but wrong index - reset to this page
      console.log(`📍 Resuming from: ${currentPageName}`);
      state.index = currentPageIndex;
      saveInspectionState(state);
      runInspection();
    } else {
      // We're not on any page in our list - start fresh
      console.log('🚀 Starting new inspection...');
      state.index = 0;
      state.results = {};
      saveInspectionState(state);
      navigateToNext(state);
    }
  }
  
  // Check if inspection is in progress
  const existingState = getInspectionState();
  if (existingState.index > 0 && existingState.index < PAGES_TO_INSPECT.length) {
    console.log(`📍 Resuming inspection from page ${existingState.index + 1}/${PAGES_TO_INSPECT.length}`);
  }
  
  // Add control functions
  window.TLA_Inspector = {
    start: () => {
      localStorage.removeItem(CURRENT_PAGE_KEY);
      localStorage.removeItem(INSPECTOR_KEY);
      console.log('🚀 Starting fresh inspection...');
      runInspection();
    },
    
    resume: () => {
      console.log('📍 Resuming inspection...');
      runInspection();
    },
    
    reset: () => {
      localStorage.removeItem(CURRENT_PAGE_KEY);
      localStorage.removeItem(INSPECTOR_KEY);
      console.log('🗑️ Inspection data cleared');
    },
    
    results: () => {
      const results = localStorage.getItem(INSPECTOR_KEY);
      return results ? JSON.parse(results) : null;
    }
  };
  
  console.log('%c🔍 TravianAssistant Multi-Page Inspector v3', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('Commands:');
  console.log('  TLA_Inspector.start()  - Start fresh inspection');
  console.log('  TLA_Inspector.resume() - Resume from current page');
  console.log('  TLA_Inspector.reset()  - Clear all inspection data');
  console.log('  TLA_Inspector.results() - View collected results');
  console.log('');
  console.log('📍 Auto-starting in 3 seconds... (Press Ctrl+C to cancel)');
  
  // Auto-start after 3 seconds
  setTimeout(() => runInspection(), 3000);
})();