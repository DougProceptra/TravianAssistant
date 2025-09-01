// Test script to verify resource scraping is working
// Run this in the browser console on a Travian page

console.log('=== TravianAssistant Scraper Test ===');

// Test 1: Find current village
console.log('\n1. Current Village Detection:');
const activeVillageLink = document.querySelector('#sidebarBoxVillagelist .active a, .villageList .active a');
if (activeVillageLink) {
  const href = activeVillageLink.getAttribute('href');
  const match = href?.match(/newdid=(\d+)/);
  const villageId = match ? match[1] : 'not found';
  const nameElement = activeVillageLink.querySelector('.name') || activeVillageLink;
  const villageName = nameElement?.textContent?.trim() || 'Unknown';
  console.log(`✓ Current village: ${villageName} (ID: ${villageId})`);
} else {
  console.log('✗ Could not find active village element');
}

// Test 2: Resource detection
console.log('\n2. Resource Detection:');
const resourceSelectors = {
  wood: ['#l1', '.l1', '#stockBarResource1 .value', '.wood .value', '[class*="wood"] .value'],
  clay: ['#l2', '.l2', '#stockBarResource2 .value', '.clay .value', '[class*="clay"] .value'],
  iron: ['#l3', '.l3', '#stockBarResource3 .value', '.iron .value', '[class*="iron"] .value'],
  crop: ['#l4', '.l4', '#stockBarResource4 .value', '.crop .value', '[class*="crop"] .value']
};

for (const [resource, selectors] of Object.entries(resourceSelectors)) {
  let found = false;
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const value = parseInt(element.textContent.replace(/[^\d-]/g, '')) || 0;
      if (value > 0) {
        console.log(`✓ ${resource}: ${value} (selector: ${selector})`);
        found = true;
        break;
      }
    }
  }
  if (!found) {
    console.log(`✗ ${resource}: not found`);
    // Try to help find the right selector
    console.log(`  Searching for ${resource} elements...`);
    const possibleElements = document.querySelectorAll(`[class*="${resource}"], [id*="${resource}"]`);
    if (possibleElements.length > 0) {
      console.log(`  Found ${possibleElements.length} possible elements:`, possibleElements);
    }
  }
}

// Test 3: Page detection
console.log('\n3. Current Page Detection:');
const url = window.location.href;
let pageType = 'unknown';

if (url.includes('dorf1.php')) pageType = 'resources';
else if (url.includes('dorf2.php')) pageType = 'village';
else if (url.includes('dorf3.php')) pageType = 'overview';
else if (url.includes('build.php')) {
  pageType = 'building';
  const buildingId = new URLSearchParams(window.location.search).get('id');
  if (buildingId) pageType += ` (id: ${buildingId})`;
}
else if (url.includes('berichte.php')) pageType = 'reports';
else if (url.includes('nachrichten.php')) pageType = 'messages';
else if (url.includes('statistiken.php')) pageType = 'statistics';
else if (url.includes('allianz.php')) pageType = 'alliance';
else if (url.includes('karte.php')) pageType = 'map';

console.log(`✓ Current page: ${pageType}`);

// Test 4: Production rates
console.log('\n4. Production Rates:');
const productionTable = document.querySelector('.production, #production, .productionTable');
if (productionTable) {
  console.log('✓ Found production table:', productionTable);
  const rows = productionTable.querySelectorAll('tr');
  console.log(`  Found ${rows.length} rows`);
} else {
  // Alternative selectors
  const productionSelectors = [
    '.r1 .num', '.production .r1', '#production1',
    '.r2 .num', '.production .r2', '#production2',
    '.r3 .num', '.production .r3', '#production3',
    '.r4 .num', '.production .r4', '#production4'
  ];
  
  console.log('✗ No production table found, trying alternative selectors...');
  productionSelectors.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`  Found: ${selector} = ${element.textContent}`);
    }
  });
}

// Test 5: Building queue
console.log('\n5. Building Queue:');
const buildQueue = document.querySelectorAll('.buildingList li, .buildQueue .name, .constructionList .name');
if (buildQueue.length > 0) {
  console.log(`✓ Found ${buildQueue.length} buildings in queue:`);
  buildQueue.forEach((el, i) => {
    const nameEl = el.querySelector('.name') || el;
    const name = nameEl?.textContent?.trim() || 'Unknown';
    console.log(`  ${i+1}. ${name}`);
  });
} else {
  console.log('✗ No buildings in queue or queue elements not found');
}

// Test 6: Culture points
console.log('\n6. Culture Points:');
const cultureSelectors = [
  '.culturepointsContainer .points',
  '#culture_points',
  '.culturePoints .value'
];

let cpFound = false;
for (const selector of cultureSelectors) {
  const element = document.querySelector(selector);
  if (element) {
    const value = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
    if (value > 0) {
      console.log(`✓ Culture points: ${value} (selector: ${selector})`);
      cpFound = true;
      break;
    }
  }
}
if (!cpFound) {
  console.log('✗ Culture points not found');
}

// Summary
console.log('\n=== Test Complete ===');
console.log('If any resources show as "not found", please:');
console.log('1. Right-click on the resource value in the game');
console.log('2. Select "Inspect Element"');
console.log('3. Note the class or ID of the element');
console.log('4. Share this information to update the selectors');

// Helper function to explore the DOM
console.log('\n=== DOM Explorer (optional) ===');
console.log('Run these commands to explore:');
console.log('document.querySelector("#stockBar")  // Find stock bar');
console.log('document.querySelector(".resources")  // Find resources container');
console.log('document.querySelectorAll("[class*=wood]")  // Find all wood-related elements');
