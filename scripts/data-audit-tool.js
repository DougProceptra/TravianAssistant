/**
 * Travian Data Audit Tool - Comprehensive Data Discovery Script
 * Run this in browser console to find ALL exposed data sources
 * 
 * Usage: Copy entire script and paste in browser console on any Travian page
 */

(function() {
    console.log('%c🔍 TRAVIAN DATA AUDIT TOOL v2.0 🔍', 'color: #00ff00; font-size: 20px; font-weight: bold');
    console.log('%cSearching for all exposed data sources...', 'color: #ffff00');
    
    const findings = {
        windowObjects: {},
        globalVariables: {},
        dataAttributes: [],
        hiddenInputs: [],
        scriptTags: [],
        ajaxInterceptions: [],
        websockets: [],
        localStorage: {},
        sessionStorage: {},
        cookies: {},
        reactProps: {},
        vueInstances: {},
        angularScopes: {},
        customEvents: [],
        mutationTargets: []
    };

    // 1. SCAN WINDOW OBJECT
    console.log('\n%c[1/15] Scanning window object...', 'color: #00ffff');
    const interestingKeys = [
        'resources', 'Travian', 'village', 'player', 'game', 'data',
        'production', 'troops', 'buildings', 'map', 'alliance',
        'TravianDefaults', 'travian', 'gameData', 'serverData',
        'questData', 'resourceBarPlus', 'RBP', 'rbp'
    ];
    
    for (let key in window) {
        try {
            if (interestingKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
                findings.windowObjects[key] = typeof window[key] === 'object' ? 
                    JSON.stringify(window[key], null, 2).substring(0, 500) + '...' : 
                    window[key];
                console.log(`✅ Found window.${key}:`, window[key]);
            }
        } catch(e) {}
    }

    // 2. CHECK COMMON TRAVIAN PATTERNS
    console.log('\n%c[2/15] Checking common Travian patterns...', 'color: #00ffff');
    const patterns = [
        'window.resources',
        'window.resources.production',
        'window.resources.storage',
        'window.TravianDefaults',
        'window.Travian',
        'window.village',
        'window.questData',
        'window.player',
        'window.game_data',
        'window.gameData'
    ];
    
    patterns.forEach(pattern => {
        try {
            const result = eval(pattern);
            if (result !== undefined) {
                findings.globalVariables[pattern] = result;
                console.log(`✅ ${pattern} exists:`, result);
            }
        } catch(e) {}
    });

    // 3. SCAN DATA ATTRIBUTES
    console.log('\n%c[3/15] Scanning data attributes...', 'color: #00ffff');
    document.querySelectorAll('*[data-*]').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                const entry = {
                    element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : ''),
                    attribute: attr.name,
                    value: attr.value
                };
                if (attr.value && !findings.dataAttributes.some(f => f.attribute === attr.name && f.value === attr.value)) {
                    findings.dataAttributes.push(entry);
                    if (attr.name.includes('village') || attr.name.includes('resource') || 
                        attr.name.includes('troop') || attr.name.includes('building')) {
                        console.log(`✅ Found ${attr.name}:`, attr.value);
                    }
                }
            }
        });
    });

    // 4. CHECK HIDDEN INPUTS
    console.log('\n%c[4/15] Checking hidden inputs...', 'color: #00ffff');
    document.querySelectorAll('input[type="hidden"]').forEach(input => {
        if (input.value) {
            findings.hiddenInputs.push({
                name: input.name || input.id,
                value: input.value,
                form: input.form?.id || 'no-form'
            });
            console.log(`✅ Hidden input ${input.name}:`, input.value.substring(0, 50));
        }
    });

    // 5. ANALYZE SCRIPT TAGS
    console.log('\n%c[5/15] Analyzing inline script tags...', 'color: #00ffff');
    document.querySelectorAll('script:not([src])').forEach(script => {
        const content = script.innerHTML;
        if (content.includes('village') || content.includes('resource') || 
            content.includes('production') || content.includes('troops')) {
            
            // Try to extract variable assignments
            const varMatches = content.match(/(?:var|let|const|window\.)\s*(\w+)\s*=\s*({[\s\S]*?});/g);
            if (varMatches) {
                varMatches.forEach(match => {
                    findings.scriptTags.push(match.substring(0, 200));
                    console.log(`✅ Found script variable:`, match.substring(0, 100));
                });
            }
        }
    });

    // 6. INTERCEPT AJAX CALLS
    console.log('\n%c[6/15] Setting up AJAX interception...', 'color: #00ffff');
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('%c📡 AJAX Request:', 'color: #ff00ff', args[0]);
        return originalFetch.apply(this, args).then(response => {
            const cloned = response.clone();
            cloned.text().then(text => {
                try {
                    const json = JSON.parse(text);
                    console.log('%c📥 AJAX Response:', 'color: #ff00ff', json);
                    findings.ajaxInterceptions.push({
                        url: args[0],
                        response: JSON.stringify(json, null, 2).substring(0, 500)
                    });
                } catch(e) {
                    if (text.length < 1000) {
                        console.log('%c📥 AJAX Response (text):', 'color: #ff00ff', text.substring(0, 200));
                    }
                }
            });
            return response;
        });
    };

    // XMLHttpRequest interception
    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
        console.log('%c📡 XHR Request:', 'color: #ff00ff', method, url);
        this.addEventListener('load', function() {
            try {
                const json = JSON.parse(this.responseText);
                console.log('%c📥 XHR Response:', 'color: #ff00ff', json);
            } catch(e) {}
        });
        return originalXHR.apply(this, arguments);
    };

    // 7. CHECK WEBSOCKETS
    console.log('\n%c[7/15] Checking WebSockets...', 'color: #00ffff');
    if (window.WebSocket) {
        const originalWS = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            console.log('%c🔌 WebSocket connection:', 'color: #ff00ff', url);
            findings.websockets.push(url);
            const ws = new originalWS(url, protocols);
            ws.addEventListener('message', function(e) {
                console.log('%c📨 WebSocket message:', 'color: #ff00ff', e.data);
            });
            return ws;
        };
    }

    // 8. LOCAL STORAGE
    console.log('\n%c[8/15] Scanning localStorage...', 'color: #00ffff');
    for (let key in localStorage) {
        try {
            const value = localStorage.getItem(key);
            if (value && (key.includes('travian') || key.includes('village') || 
                key.includes('resource') || key.includes('rbp'))) {
                findings.localStorage[key] = value.substring(0, 200);
                console.log(`✅ localStorage.${key}:`, value.substring(0, 100));
            }
        } catch(e) {}
    }

    // 9. SESSION STORAGE
    console.log('\n%c[9/15] Scanning sessionStorage...', 'color: #00ffff');
    for (let key in sessionStorage) {
        try {
            const value = sessionStorage.getItem(key);
            if (value) {
                findings.sessionStorage[key] = value.substring(0, 200);
                console.log(`✅ sessionStorage.${key}:`, value.substring(0, 100));
            }
        } catch(e) {}
    }

    // 10. COOKIES
    console.log('\n%c[10/15] Scanning cookies...', 'color: #00ffff');
    document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            findings.cookies[name] = value.substring(0, 50);
        }
    });

    // 11. CHECK FOR REACT
    console.log('\n%c[11/15] Checking for React...', 'color: #00ffff');
    const reactRoot = document.querySelector('#root') || document.querySelector('[data-reactroot]');
    if (reactRoot) {
        try {
            const reactKey = Object.keys(reactRoot).find(key => key.startsWith('__react'));
            if (reactKey) {
                console.log('✅ React detected!', reactRoot[reactKey]);
                findings.reactProps = 'React found - check __reactInternalInstance';
            }
        } catch(e) {}
    }

    // 12. CHECK FOR VUE
    console.log('\n%c[12/15] Checking for Vue...', 'color: #00ffff');
    if (window.Vue || document.querySelector('[v-cloak]')) {
        console.log('✅ Vue detected!');
        findings.vueInstances = 'Vue found';
    }

    // 13. MUTATION OBSERVER
    console.log('\n%c[13/15] Setting up DOM mutation observer...', 'color: #00ffff');
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName?.startsWith('data-')) {
                console.log('%c🔄 DOM Update:', 'color: #ffff00', 
                    mutation.target.tagName, mutation.attributeName, 
                    mutation.target.getAttribute(mutation.attributeName));
            }
        });
    });
    observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['data-*']
    });

    // 14. EVENT LISTENERS
    console.log('\n%c[14/15] Checking custom events...', 'color: #00ffff');
    const originalDispatch = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function(event) {
        if (event.type.includes('travian') || event.type.includes('game') || 
            event.type.includes('village') || event.type.includes('resource')) {
            console.log('%c🎯 Custom Event:', 'color: #ff00ff', event.type, event);
            findings.customEvents.push(event.type);
        }
        return originalDispatch.apply(this, arguments);
    };

    // 15. EXTRACT VISIBLE DATA
    console.log('\n%c[15/15] Extracting visible data from UI...', 'color: #00ffff');
    const visibleData = {
        resources: {},
        buildings: [],
        troops: []
    };

    // Try to extract resource values from UI
    ['wood', 'clay', 'iron', 'crop'].forEach(resource => {
        const elements = document.querySelectorAll(`[class*="${resource}"], [id*="${resource}"], [data-*="${resource}"]`);
        elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && /\d+/.test(text)) {
                console.log(`📊 Possible ${resource} value:`, text);
            }
        });
    });

    // Look for production values
    document.querySelectorAll('[class*="production"], [class*="prod"], [title*="production"], [title*="hour"]').forEach(el => {
        const text = el.textContent?.trim();
        if (text && /\d+/.test(text)) {
            console.log('📊 Possible production value:', text, 'from', el.className || el.id);
        }
    });

    // GENERATE REPORT
    console.log('\n%c📋 AUDIT COMPLETE - SUMMARY REPORT 📋', 'color: #00ff00; font-size: 16px; font-weight: bold');
    console.log('Window Objects Found:', Object.keys(findings.windowObjects).length);
    console.log('Global Variables:', Object.keys(findings.globalVariables).length);
    console.log('Data Attributes:', findings.dataAttributes.length);
    console.log('Hidden Inputs:', findings.hiddenInputs.length);
    console.log('Script Variables:', findings.scriptTags.length);
    console.log('LocalStorage Keys:', Object.keys(findings.localStorage).length);
    
    console.log('\n%c📦 Full findings object available as: window.auditFindings', 'color: #ffff00');
    window.auditFindings = findings;
    
    console.log('\n%c💡 INTERACTIVE MODE ENABLED', 'color: #00ff00; font-weight: bold');
    console.log('- AJAX/XHR calls are now being logged');
    console.log('- DOM mutations are being watched');
    console.log('- Type window.auditFindings to see all data');
    console.log('- Click around the game to trigger AJAX calls');
    
    // Helper function to search findings
    window.searchFindings = function(keyword) {
        console.log(`Searching for "${keyword}"...`);
        const results = {};
        const searchStr = keyword.toLowerCase();
        
        Object.keys(findings).forEach(category => {
            const categoryData = findings[category];
            const matches = [];
            
            if (Array.isArray(categoryData)) {
                categoryData.forEach(item => {
                    if (JSON.stringify(item).toLowerCase().includes(searchStr)) {
                        matches.push(item);
                    }
                });
            } else if (typeof categoryData === 'object') {
                Object.keys(categoryData).forEach(key => {
                    if (key.toLowerCase().includes(searchStr) || 
                        JSON.stringify(categoryData[key]).toLowerCase().includes(searchStr)) {
                        matches.push({key, value: categoryData[key]});
                    }
                });
            }
            
            if (matches.length > 0) {
                results[category] = matches;
            }
        });
        
        console.log('Search results:', results);
        return results;
    };
    
    console.log('- Use window.searchFindings("keyword") to search the findings');
    
    return findings;
})();