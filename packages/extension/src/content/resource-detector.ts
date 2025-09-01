// Simple resource detector that actually works
// This gets injected into the page to find resources

export function detectResources() {
  console.log('[TLA Resource Detector] Searching for resources...');
  
  const resources = { wood: 0, clay: 0, iron: 0, crop: 0 };
  
  // Method 1: stockBarButton (modern Travian)
  const stockButtons = document.querySelectorAll('.stockBarButton');
  if (stockButtons.length >= 4) {
    stockButtons.forEach((btn, index) => {
      const valueEl = btn.querySelector('.value');
      if (valueEl) {
        const value = parseInt(valueEl.textContent.replace(/[^\d]/g, '')) || 0;
        if (index === 0) resources.wood = value;
        else if (index === 1) resources.clay = value;
        else if (index === 2) resources.iron = value;
        else if (index === 3) resources.crop = value;
        console.log(`[TLA Resource Detector] Found ${Object.keys(resources)[index]}: ${value}`);
      }
    });
  }
  
  // Method 2: Direct IDs
  if (resources.wood === 0) {
    ['l1', 'l2', 'l3', 'l4'].forEach((id, index) => {
      const el = document.getElementById(id);
      if (el) {
        const value = parseInt(el.textContent.replace(/[^\d]/g, '')) || 0;
        if (index === 0) resources.wood = value;
        else if (index === 1) resources.clay = value;
        else if (index === 2) resources.iron = value;
        else if (index === 3) resources.crop = value;
        console.log(`[TLA Resource Detector] Found via ID ${id}: ${value}`);
      }
    });
  }
  
  // Method 3: Look for any element with resource values
  if (resources.wood === 0) {
    // Search for elements containing numbers that look like resources
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.match(/^\d{3,6}$/) && !el.querySelector('*')) {
        // This element only contains a number, might be a resource
        const value = parseInt(text);
        const parent = el.parentElement;
        const grandparent = parent?.parentElement;
        
        // Check if it's near resource-related classes
        const nearbyText = (parent?.className + ' ' + grandparent?.className + ' ' + parent?.id + ' ' + grandparent?.id).toLowerCase();
        
        if (nearbyText.includes('wood') || nearbyText.includes('lumber') || nearbyText.includes('r1')) {
          resources.wood = value;
          console.log(`[TLA Resource Detector] Found wood via search:`, value, el);
        } else if (nearbyText.includes('clay') || nearbyText.includes('r2')) {
          resources.clay = value;
          console.log(`[TLA Resource Detector] Found clay via search:`, value, el);
        } else if (nearbyText.includes('iron') || nearbyText.includes('r3')) {
          resources.iron = value;
          console.log(`[TLA Resource Detector] Found iron via search:`, value, el);
        } else if (nearbyText.includes('crop') || nearbyText.includes('wheat') || nearbyText.includes('r4') || nearbyText.includes('r5')) {
          resources.crop = value;
          console.log(`[TLA Resource Detector] Found crop via search:`, value, el);
        }
      }
    });
  }
  
  console.log('[TLA Resource Detector] Final resources:', resources);
  return resources;
}

// Auto-detect every 5 seconds
setInterval(() => {
  const resources = detectResources();
  if (resources.wood > 0 || resources.clay > 0 || resources.iron > 0 || resources.crop > 0) {
    // Store in window for other scripts to access
    window.TLA_RESOURCES = resources;
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('TLA_RESOURCES_DETECTED', {
      detail: resources
    }));
  }
}, 5000);

// Initial detection
setTimeout(() => {
  detectResources();
}, 1000);
