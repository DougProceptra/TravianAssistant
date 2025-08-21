// Debug script to find village selectors in Travian
// Run this in browser console while on Travian page

console.log('=== TravianAssistant Village Selector Debug ===');

// Try various possible selectors for village list
const selectors = [
  '#sidebarBoxVillagelist',
  '#villageList',
  '.villageList',
  '.village-list',
  '[class*="village"]',
  '.sidebarBox:has(.village)',
  '.panel:has(.village)',
  'div:has(> div:contains("Villages"))',
  '.boxTitle:contains("Villages")',
  '[class*="Villages"]'
];

console.log('Searching for village containers...\n');

selectors.forEach(selector => {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ Found ${elements.length} elements with selector: "${selector}"`);
      elements.forEach((el, i) => {
        // Check if this might be the village list
        const text = el.textContent || '';
        if (text.includes('Village') || text.includes('Capital')) {
          console.log(`   Element ${i}:`, {
            classes: el.className,
            id: el.id,
            childCount: el.children.length,
            sample: text.substring(0, 100)
          });
        }
      });
    }
  } catch (e) {
    // Invalid selector, skip
  }
});

console.log('\n=== Looking for villages by content ===\n');

// Find all elements containing coordinates pattern
const coordPattern = /\(\d+\|\d+\)/;
const allElements = document.querySelectorAll('*');
const villageElements = [];

allElements.forEach(el => {
  const text = el.textContent || '';
  // Check if element has coordinates and village-like text
  if (coordPattern.test(text) && 
      (text.includes('Village') || text.includes('Capital')) &&
      el.children.length < 20) { // Not a huge container
    
    // Check if this is a list item or clickable element
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'a' || tagName === 'li' || tagName === 'div' || tagName === 'span') {
      villageElements.push(el);
    }
  }
});

console.log(`Found ${villageElements.length} potential village elements:\n`);

// Group by parent to find the container
const parentMap = new Map();
villageElements.forEach(el => {
  const parent = el.parentElement;
  if (parent) {
    if (!parentMap.has(parent)) {
      parentMap.set(parent, []);
    }
    parentMap.get(parent).push(el);
  }
});

// Find parent with most village children
let bestParent = null;
let maxChildren = 0;

parentMap.forEach((children, parent) => {
  if (children.length > maxChildren) {
    maxChildren = children.length;
    bestParent = parent;
  }
});

if (bestParent) {
  console.log('🎯 Most likely village container:', {
    element: bestParent,
    tagName: bestParent.tagName,
    id: bestParent.id || '(no id)',
    classes: bestParent.className || '(no classes)',
    villageCount: maxChildren,
    selector: bestParent.id ? `#${bestParent.id}` : `.${bestParent.className.split(' ')[0]}`
  });
  
  console.log('\nVillage elements inside:');
  parentMap.get(bestParent).forEach((village, i) => {
    console.log(`  Village ${i + 1}:`, {
      text: village.textContent?.trim(),
      tagName: village.tagName,
      href: village.getAttribute('href'),
      classes: village.className
    });
  });
}

console.log('\n=== Checking for active village ===\n');

// Look for active/current village indicators
const activeSelectors = [
  '.active',
  '.selected',
  '.current',
  '[class*="active"]',
  '[class*="selected"]',
  '[class*="current"]'
];

activeSelectors.forEach(selector => {
  const active = document.querySelector(selector);
  if (active && active.textContent?.match(coordPattern)) {
    console.log(`✅ Active village indicator found:`, {
      selector,
      text: active.textContent?.trim(),
      element: active
    });
  }
});

console.log('\n=== Testing village ID extraction ===\n');

// Find links with newdid parameter
const villageLinks = document.querySelectorAll('a[href*="newdid"]');
if (villageLinks.length > 0) {
  console.log(`Found ${villageLinks.length} village switch links:`);
  villageLinks.forEach((link, i) => {
    const href = link.getAttribute('href') || '';
    const idMatch = href.match(/newdid=(\d+)/);
    if (idMatch) {
      console.log(`  Link ${i + 1}:`, {
        villageId: idMatch[1],
        text: link.textContent?.trim(),
        href: href
      });
    }
  });
}

console.log('\n=== Recommended Fix ===\n');
console.log('Based on the analysis above, update village-navigator.ts with the correct selectors.');
console.log('Look for the selector with 6 village elements (your village count).');

// Try to generate the fix
if (bestParent) {
  const selector = bestParent.id ? `#${bestParent.id}` : `.${bestParent.className.split(' ')[0]}`;
  const villageSelector = bestParent.querySelector('a[href*="newdid"]') ? 'a[href*="newdid"]' : 'a';
  
  console.log('\nSuggested code fix for village-navigator.ts:\n');
  console.log(`const villageSwitcher = document.querySelector('${selector}');`);
  console.log(`const villageLinks = villageSwitcher.querySelectorAll('${villageSelector}');`);
}

console.log('\n=== End Debug ===');
