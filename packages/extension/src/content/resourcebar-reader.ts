// Read data from ResourceBarPlus extension display
export class ResourceBarPlusReader {
  
  /**
   * Find and read data from ResourceBarPlus UI elements
   */
  readResourceBarData(): any {
    console.log('🔍 Looking for ResourceBarPlus data...');
    
    // ResourceBarPlus adds elements with IDs like 'resbarProduction', 'resbarStorage', etc.
    // Look for their UI elements
    
    // Try common ResourceBarPlus element IDs and classes
    const possibleSelectors = [
      '#resbarProduction',
      '#resbar',
      '#rbMain',
      '[id*="resbar"]',
      '[class*="resbar"]',
      '#overview_table', // They might enhance the overview table
      '.res_bar_table'
    ];
    
    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ResourceBarPlus elements with selector: ${selector}`, elements);
        
        // Extract data from the elements
        elements.forEach(el => {
          console.log('Element content:', el.textContent);
          console.log('Element HTML:', el.innerHTML.substring(0, 200));
        });
      }
    }
    
    // Look for their production display (usually shows all villages)
    const productionData = this.extractProductionData();
    
    return productionData;
  }
  
  /**
   * Extract production data from ResourceBarPlus display
   */
  private extractProductionData(): any {
    const data = {
      villages: [],
      totalProduction: null
    };
    
    // ResourceBarPlus often adds a table or div with production info
    // Look for elements containing production numbers
    const productionElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent || '';
      // Look for production-like patterns (numbers with /hr or per hour)
      return text.includes('/hr') || text.includes('per hour') || 
             (text.includes('Production') && /\d+/.test(text));
    });
    
    console.log(`Found ${productionElements.length} potential production elements`);
    
    productionElements.slice(0, 5).forEach(el => {
      console.log('Production element:', el.tagName, el.className, el.textContent?.substring(0, 100));
    });
    
    // Also check for data stored in window by ResourceBarPlus
    if ((window as any).RB) {
      console.log('🎯 Found window.RB (ResourceBarPlus data):', (window as any).RB);
      data.rbData = (window as any).RB;
    }
    
    // Check for villages data
    if ((window as any).villages || (window as any).villageList) {
      console.log('🎯 Found village data in window:', {
        villages: (window as any).villages,
        villageList: (window as any).villageList
      });
    }
    
    return data;
  }
  
  /**
   * Monitor ResourceBarPlus for updates
   */
  watchForUpdates(callback: (data: any) => void) {
    // Watch for DOM changes where ResourceBarPlus typically updates
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.target instanceof Element) {
          const element = mutation.target;
          if (element.id?.includes('resbar') || element.className?.includes('resbar')) {
            console.log('ResourceBarPlus updated, reading new data...');
            const data = this.readResourceBarData();
            callback(data);
            break;
          }
        }
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    console.log('👀 Watching for ResourceBarPlus updates...');
  }
}

export const rbReader = new ResourceBarPlusReader();