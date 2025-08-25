// TravianAssistant Multi-Page Inspector v4
// Enhanced with ResourceBarPlus proven selectors and techniques
// Run this ONCE and it will navigate through pages collecting REAL data

(function() {
  'use strict';
  
  const INSPECTOR_KEY = 'TLA_INSPECTION_RESULTS';
  const CURRENT_PAGE_KEY = 'TLA_CURRENT_INSPECTION';
  
  // Pages to inspect - updated based on ResourceBarPlus approach
  const PAGES_TO_INSPECT = [
    { url: '/village/statistics/overview', name: 'Statistics Overview' },
    { url: '/village/statistics/resources', name: 'Resources Tab' },
    { url: '/village/statistics/culturepoints', name: 'Culture Points Tab' },
    { url: '/village/statistics/troops', name: 'Troops Tab' },
    { url: '/production.php', name: 'Production Page' },
    { url: '/dorf1.php', name: 'Village Resources View' },
    { url: '/dorf2.php', name: 'Village Buildings View' },
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
  
  // Enhanced page inspector using ResourceBarPlus techniques
  function inspectCurrentPage() {
    const results = {
      url: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
      tables: [],
      resources: null,
      production: null,
      population: null,
      villages: [],
      rawData: {},
      gameVariables: {}
    };
    
    // Method 1: Get resources from stockBar (ResourceBarPlus method)
    const stockBar = document.querySelector('#stockBar, .stockBar, .stockBarTable');
    if (stockBar) {
      results.resources = {
        // ResourceBarPlus uses these exact selectors
        wood: parseInt(document.querySelector('#l1, .r1')?.textContent?.replace(/[^\d]/g, '') || '0'),
        clay: parseInt(document.querySelector('#l2, .r2')?.textContent?.replace(/[^\d]/g, '') || '0'),
        iron: parseInt(document.querySelector('#l3, .r3')?.textContent?.replace(/[^\d]/g, '') || '0'),
        crop: parseInt(document.querySelector('#l4, .r4')?.textContent?.replace(/[^\d]/g, '') || '0'),
        freeCrop: parseInt(document.querySelector('#l5, .r5')?.textContent?.replace(/[^\d]/g, '') || '0'),
        
        // Storage capacities
        woodCapacity: parseInt(document.querySelector('#stockBarResource1 .capacity')?.textContent?.replace(/[^\d]/g, '') || '0'),
        clayCapacity: parseInt(document.querySelector('#stockBarResource2 .capacity')?.textContent?.replace(/[^\d]/g, '') || '0'),
        ironCapacity: parseInt(document.querySelector('#stockBarResource3 .capacity')?.textContent?.replace(/[^\d]/g, '') || '0'),
        cropCapacity: parseInt(document.querySelector('#stockBarResource4 .capacity')?.textContent?.replace(/[^\d]/g, '') || '0')
      };
    }
    
    // Method 2: Get production rates
    const productionTable = document.querySelector('#production, .production, table.production');
    if (productionTable) {
      results.production = {
        wood: parseInt(productionTable.querySelector('tr:nth-child(1) td.num')?.textContent?.replace(/[^\d]/g, '') || '0'),
        clay: parseInt(productionTable.querySelector('tr:nth-child(2) td.num')?.textContent?.replace(/[^\d]/g, '') || '0'),
        iron: parseInt(productionTable.querySelector('tr:nth-child(3) td.num')?.textContent?.replace(/[^\d]/g, '') || '0'),
        crop: parseInt(productionTable.querySelector('tr:nth-child(4) td.num')?.textContent?.replace(/[^\d]/g, '') || '0')
      };
    }
    
    // Method 3: Get population (ResourceBarPlus technique)
    const popElement = document.querySelector('.inhabitants, .population .value, #population');
    if (popElement) {
      results.population = parseInt(popElement.textContent.replace(/[^\d]/g, '') || '0');
    }
    
    // Method 4: Check for game's JavaScript variables (key insight from ResourceBarPlus)
    if (typeof window.resources !== 'undefined') {
      results.gameVariables.resources = window.resources;
    }
    if (typeof window.production !== 'undefined') {
      results.gameVariables.production = window.production;
    }
    if (typeof window.storage !== 'undefined') {
      results.gameVariables.storage = window.storage;
    }
    if (typeof window.Travian !== 'undefined' && window.Travian.Game) {
      results.gameVariables.TravianGame = {
        villageId: window.Travian.Game.villageId,
        speed: window.Travian.Game.speed
      };
    }
    
    // Method 5: Special handling for statistics pages (ResourceBarPlus approach)
    if (window.location.pathname.includes('/village/statistics')) {
      const overviewTable = document.querySelector('table#overview, table.overview');
      if (overviewTable) {
        const rows = overviewTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const villageData = {
              name: cells[0]?.querySelector('a')?.textContent?.trim() || cells[0]?.textContent?.trim(),
              coordinates: cells[1]?.textContent?.trim(),
              population: parseInt(cells[2]?.textContent?.replace(/[^\d]/g, '') || '0'),
              // Look for resource columns
              wood: parseInt(cells[3]?.textContent?.replace(/[^\d]/g, '') || '0'),
              clay: parseInt(cells[4]?.textContent?.replace(/[^\d]/g, '') || '0'),
              iron: parseInt(cells[5]?.textContent?.replace(/[^\d]/g, '') || '0'),
              crop: parseInt(cells[6]?.textContent?.replace(/[^\d]/g, '') || '0')
            };
            results.villages.push(villageData);
          }
        });
      }
    }
    
    // Method 6: Check dorf1 and dorf2 pages (village views)
    if (window.location.pathname.includes('dorf1')) {
      // Resource fields
      const fields = document.querySelectorAll('#village_map .gid1, #village_map .gid2, #village_map .gid3, #village_map .gid4');
      results.rawData.resourceFields = [];
      fields.forEach(field => {
        const level = field.querySelector('.level')?.textContent?.replace(/[^\d]/g, '');
        if (level) {
          results.rawData.resourceFields.push({
            type: field.className.match(/gid(\d)/)?.[1],
            level: parseInt(level)
          });
        }
      });
    }
    
    if (window.location.pathname.includes('dorf2')) {
      // Buildings
      const buildings = document.querySelectorAll('#village_map .building');
      results.rawData.buildings = [];
      buildings.forEach(building => {
        const gid = building.className.match(/g(\d+)/)?.[1];
        const level = building.querySelector('.level')?.textContent?.replace(/[^\d]/g, '');
        if (gid && level) {
          results.rawData.buildings.push({
            gid: parseInt(gid),
            level: parseInt(level)
          });
        }
      });
    }
    
    // Method 7: Capture all tables for analysis
    document.querySelectorAll('table').forEach((table, idx) => {
      const tableData = {
        index: idx,
        id: table.id || null,
        className: table.className || null,
        headers: [],
        firstRow: [],
        rowCount: 0
      };
      
      // Get headers
      const headers = table.querySelectorAll('thead th, tbody tr:first-child th');
      headers.forEach(h => {
        const text = h.textContent.trim();
        if (text) tableData.headers.push(text);
      });
      
      // Get first data row for structure analysis
      const firstDataRow = table.querySelector('tbody tr:nth-child(2), tbody tr:first-child');
      if (firstDataRow) {
        firstDataRow.querySelectorAll('td').forEach(cell => {
          tableData.firstRow.push({
            text: cell.textContent.trim(),
            className: cell.className,
            hasLink: !!cell.querySelector('a'),
            hasInput: !!cell.querySelector('input')
          });
        });
      }
      
      tableData.rowCount = table.querySelectorAll('tbody tr').length;
      
      if (tableData.headers.length > 0 || tableData.firstRow.length > 0) {
        results.tables.push(tableData);
      }
    });
    
    // Method 8: Try to intercept AJAX data (ResourceBarPlus technique)
    // This captures data that might be loaded dynamically
    if (window.XMLHttpRequest) {
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('load', function() {
          if (url.includes('ajax') || url.includes('api')) {
            try {
              const response = JSON.parse(this.responseText);
              results.rawData.ajaxResponses = results.rawData.ajaxResponses || [];
              results.rawData.ajaxResponses.push({
                url: url,
                data: response
              });
            } catch (e) {
              // Not JSON, ignore
            }
          }
        });
        originalOpen.apply(this, arguments);
      };
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
      
      if (pageData.resources) {
        console.log('✅ Resources found:', pageData.resources);
      }
      
      if (pageData.production) {
        console.log('✅ Production found:', pageData.production);
      }
      
      if (pageData.population) {
        console.log('✅ Population:', pageData.population);
      }
      
      if (pageData.gameVariables && Object.keys(pageData.gameVariables).length > 0) {
        console.log('✅ Game variables found:', pageData.gameVariables);
      }
      
      if (pageData.villages && pageData.villages.length > 0) {
        console.log(`✅ Villages found: ${pageData.villages.length}`);
        console.table(pageData.villages);
      }
      
      if (pageData.tables && pageData.tables.length > 0) {
        console.log(`📋 Tables found: ${pageData.tables.length}`);
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
      console.log('Using ResourceBarPlus proven selectors...');
      
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
  
  console.log('%c🔍 TravianAssistant Inspector v4 - Enhanced with ResourceBarPlus techniques', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('This version uses proven selectors from ResourceBarPlus that successfully get game data');
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