/**
 * Travian DOM Mutation Tracker - Watches for dynamic data updates
 * Specifically designed for Travian's update patterns
 * 
 * Run this to track all DOM changes and identify where data appears
 */

(function() {
    console.log('%c🔬 TRAVIAN DOM MUTATION TRACKER 🔬', 'color: #00ff00; font-size: 20px; font-weight: bold');
    
    const mutations = {
        total: 0,
        byType: {},
        byElement: {},
        dataChanges: [],
        resourceUpdates: [],
        timers: [],
        counters: []
    };

    // Resource number patterns
    const resourcePattern = /^[\d,]+$/;
    const productionPattern = /[+-]?\d+\/h|\/hour/i;
    const timePattern = /\d{1,2}:\d{2}:\d{2}/;
    
    // Track specific elements
    const trackedSelectors = [
        // Resource bars
        '#stockBar', '.stockBar', '[class*="stock"]',
        '#resourceFieldContainer', '.resourceWrapper',
        
        // Production
        '[class*="production"]', '[class*="produce"]',
        
        // Timers
        '.timer', '[class*="timer"]', '[class*="countdown"]',
        
        // Village info
        '#villageList', '.villageList', '[class*="village"]',
        
        // Troops
        '[class*="troop"]', '[class*="unit"]', '.troops',
        
        // Buildings
        '[class*="building"]', '.buildingSlot', '#village_map',
        
        // Any data attributes
        '[data-*]'
    ];

    // Create observer
    const observer = new MutationObserver(function(mutationsList) {
        mutationsList.forEach(mutation => {
            mutations.total++;
            
            // Track by type
            mutations.byType[mutation.type] = (mutations.byType[mutation.type] || 0) + 1;
            
            // Get element info
            const element = mutation.target;
            const elementKey = `${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ')[0] : ''}`;
            
            if (!mutations.byElement[elementKey]) {
                mutations.byElement[elementKey] = {
                    count: 0,
                    changes: []
                };
            }
            
            const elementTracker = mutations.byElement[elementKey];
            elementTracker.count++;
            
            // Analyze mutation
            if (mutation.type === 'characterData') {
                const oldValue = mutation.oldValue;
                const newValue = mutation.target.textContent;
                
                // Check if it's a number change (possible resource)
                if (resourcePattern.test(oldValue) && resourcePattern.test(newValue)) {
                    const change = {
                        element: elementKey,
                        old: oldValue,
                        new: newValue,
                        timestamp: new Date().toISOString(),
                        parent: element.parentElement?.className || element.parentElement?.id,
                        type: 'number'
                    };
                    
                    mutations.resourceUpdates.push(change);
                    console.log('%c💰 Resource Update:', 'color: #ffff00', change);
                }
                
                // Check for timer
                if (timePattern.test(newValue)) {
                    mutations.timers.push({
                        element: elementKey,
                        value: newValue,
                        timestamp: new Date().toISOString()
                    });
                }
                
                elementTracker.changes.push({
                    type: 'text',
                    old: oldValue,
                    new: newValue,
                    timestamp: new Date().toISOString()
                });
                
            } else if (mutation.type === 'attributes') {
                const attrName = mutation.attributeName;
                const oldValue = mutation.oldValue;
                const newValue = element.getAttribute(attrName);
                
                // Track data attributes specially
                if (attrName.startsWith('data-')) {
                    const dataChange = {
                        element: elementKey,
                        attribute: attrName,
                        old: oldValue,
                        new: newValue,
                        timestamp: new Date().toISOString()
                    };
                    
                    mutations.dataChanges.push(dataChange);
                    console.log('%c📊 Data Attribute Change:', 'color: #00ffff', dataChange);
                }
                
                elementTracker.changes.push({
                    type: 'attribute',
                    name: attrName,
                    old: oldValue,
                    new: newValue,
                    timestamp: new Date().toISOString()
                });
                
            } else if (mutation.type === 'childList') {
                // Check added nodes
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for interesting content
                        const text = node.textContent;
                        if (text && resourcePattern.test(text.trim())) {
                            console.log('%c➕ Added element with number:', 'color: #00ff00', 
                                node.tagName, text.trim());
                        }
                        
                        // Check for data attributes
                        if (node.attributes) {
                            Array.from(node.attributes).forEach(attr => {
                                if (attr.name.startsWith('data-')) {
                                    console.log('%c➕ Added element with data:', 'color: #00ff00',
                                        node.tagName, attr.name, attr.value);
                                }
                            });
                        }
                    }
                });
                
                // Track removed nodes
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        elementTracker.changes.push({
                            type: 'removed',
                            element: node.tagName,
                            id: node.id,
                            class: node.className,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
        });
    });

    // Start observing
    const config = {
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    };

    observer.observe(document.body, config);

    // Also set up interval polling for specific values
    const pollInterval = setInterval(() => {
        // Check resource values
        ['l1', 'l2', 'l3', 'l4', 'l5'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const value = element.textContent.trim();
                if (value && !element._lastValue || element._lastValue !== value) {
                    console.log(`%c📈 Resource ${id} changed:`, 'color: #ffff00', 
                        element._lastValue || 'unknown', '→', value);
                    element._lastValue = value;
                }
            }
        });
        
        // Check for any elements with production info
        document.querySelectorAll('[title*="Production"], [title*="production"], [title*="hour"]').forEach(el => {
            const title = el.getAttribute('title');
            const text = el.textContent.trim();
            if (!el._lastTracked || el._lastTracked !== text) {
                console.log('%c⚡ Production element:', 'color: #00ffff', 
                    text, 'Title:', title);
                el._lastTracked = text;
            }
        });
    }, 1000);

    // Export control functions
    window.domTracker = {
        stop: () => {
            observer.disconnect();
            clearInterval(pollInterval);
            console.log('DOM tracking stopped');
        },
        
        start: () => {
            observer.observe(document.body, config);
            console.log('DOM tracking restarted');
        },
        
        getData: () => mutations,
        
        getResourceUpdates: () => mutations.resourceUpdates,
        
        getDataChanges: () => mutations.dataChanges,
        
        getMostChanged: () => {
            const sorted = Object.entries(mutations.byElement)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 10);
            console.log('%c🏆 Most Changed Elements:', 'color: #ffff00');
            sorted.forEach(([key, data], index) => {
                console.log(`${index + 1}. ${key}: ${data.count} changes`);
            });
            return sorted;
        },
        
        findElement: (searchTerm) => {
            const results = {};
            Object.entries(mutations.byElement).forEach(([key, data]) => {
                if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results[key] = data;
                }
            });
            return results;
        },
        
        summary: () => {
            console.log('%c📊 DOM TRACKER SUMMARY', 'color: #00ff00; font-size: 16px');
            console.log('Total Mutations:', mutations.total);
            console.log('By Type:', mutations.byType);
            console.log('Resource Updates:', mutations.resourceUpdates.length);
            console.log('Data Attribute Changes:', mutations.dataChanges.length);
            console.log('Timers Detected:', mutations.timers.length);
            console.log('Unique Elements Changed:', Object.keys(mutations.byElement).length);
            return mutations;
        },
        
        clear: () => {
            mutations.total = 0;
            mutations.byType = {};
            mutations.byElement = {};
            mutations.dataChanges = [];
            mutations.resourceUpdates = [];
            mutations.timers = [];
            mutations.counters = [];
            console.log('Mutation data cleared');
        },
        
        // Watch specific element
        watch: (selector) => {
            const element = document.querySelector(selector);
            if (!element) {
                console.error('Element not found:', selector);
                return;
            }
            
            const watchObserver = new MutationObserver((muts) => {
                muts.forEach(mut => {
                    console.log('%c🎯 Watched Element Changed:', 'color: #ff00ff', 
                        selector, mut);
                });
            });
            
            watchObserver.observe(element, config);
            console.log('Now watching:', selector);
            return watchObserver;
        }
    };

    console.log('%c✅ DOM Tracker Active!', 'color: #00ff00');
    console.log('Commands:');
    console.log('  domTracker.getData()          - Get all mutation data');
    console.log('  domTracker.getResourceUpdates() - Get resource changes');
    console.log('  domTracker.getMostChanged()   - See most active elements');
    console.log('  domTracker.summary()          - Show summary');
    console.log('  domTracker.watch("#id")       - Watch specific element');
    console.log('  domTracker.stop()             - Stop tracking');
    console.log('\n%c👉 Perform actions in game to see DOM changes!', 'color: #ffff00');
    
    return window.domTracker;
})();