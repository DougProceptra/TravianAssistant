/**
 * Travian Network Monitor - Advanced Request/Response Interceptor
 * Captures ALL network traffic and extracts game data
 * 
 * Run in console BEFORE navigating or performing any game actions
 */

(function() {
    console.log('%c🌐 TRAVIAN NETWORK MONITOR ACTIVE 🌐', 'color: #00ff00; font-size: 20px; font-weight: bold');
    
    const capturedData = {
        requests: [],
        responses: [],
        gameState: {},
        patterns: new Set(),
        endpoints: new Set()
    };

    // Override Fetch API
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const [url, options = {}] = args;
        const requestId = Date.now() + Math.random();
        
        // Log request
        const requestData = {
            id: requestId,
            url: typeof url === 'string' ? url : url.href,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body,
            timestamp: new Date().toISOString()
        };
        
        // Parse body if it's FormData
        if (options.body instanceof FormData) {
            const formEntries = {};
            for (let [key, value] of options.body.entries()) {
                formEntries[key] = value;
            }
            requestData.parsedBody = formEntries;
        }
        
        capturedData.requests.push(requestData);
        capturedData.endpoints.add(requestData.url);
        
        console.log('%c→ FETCH Request:', 'color: #ff9900', requestData.url);
        if (requestData.parsedBody) {
            console.log('  Body:', requestData.parsedBody);
        }
        
        try {
            const response = await originalFetch.apply(this, args);
            const clonedResponse = response.clone();
            
            // Try to parse response
            try {
                const contentType = response.headers.get('content-type');
                let responseData;
                
                if (contentType?.includes('application/json')) {
                    responseData = await clonedResponse.json();
                } else {
                    const text = await clonedResponse.text();
                    try {
                        responseData = JSON.parse(text);
                    } catch {
                        responseData = text;
                    }
                }
                
                const capturedResponse = {
                    id: requestId,
                    url: requestData.url,
                    status: response.status,
                    data: responseData,
                    timestamp: new Date().toISOString()
                };
                
                capturedData.responses.push(capturedResponse);
                
                console.log('%c← FETCH Response:', 'color: #00cc00', requestData.url);
                console.log('  Data:', responseData);
                
                // Extract game data patterns
                extractGameData(responseData, requestData.url);
                
            } catch (e) {
                console.error('Error parsing response:', e);
            }
            
            return response;
        } catch (error) {
            console.error('%c✗ FETCH Error:', 'color: #ff0000', error);
            throw error;
        }
    };

    // Override XMLHttpRequest
    const XHROpen = XMLHttpRequest.prototype.open;
    const XHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._requestData = {
            method: method,
            url: url,
            timestamp: new Date().toISOString()
        };
        capturedData.endpoints.add(url);
        return XHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
        const xhr = this;
        const requestId = Date.now() + Math.random();
        
        if (xhr._requestData) {
            xhr._requestData.id = requestId;
            xhr._requestData.body = data;
            
            // Parse FormData
            if (data instanceof FormData) {
                const formEntries = {};
                for (let [key, value] of data.entries()) {
                    formEntries[key] = value;
                }
                xhr._requestData.parsedBody = formEntries;
            }
            
            capturedData.requests.push(xhr._requestData);
            
            console.log('%c→ XHR Request:', 'color: #ff6600', xhr._requestData.url);
            if (xhr._requestData.parsedBody) {
                console.log('  Body:', xhr._requestData.parsedBody);
            }
        }
        
        // Intercept response
        const onReadyStateChange = xhr.onreadystatechange;
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                try {
                    let responseData;
                    try {
                        responseData = JSON.parse(xhr.responseText);
                    } catch {
                        responseData = xhr.responseText;
                    }
                    
                    const capturedResponse = {
                        id: requestId,
                        url: xhr._requestData?.url,
                        status: xhr.status,
                        data: responseData,
                        timestamp: new Date().toISOString()
                    };
                    
                    capturedData.responses.push(capturedResponse);
                    
                    console.log('%c← XHR Response:', 'color: #00ff00', xhr._requestData?.url);
                    console.log('  Data:', responseData);
                    
                    // Extract game data
                    extractGameData(responseData, xhr._requestData?.url);
                    
                } catch (e) {
                    console.error('Error parsing XHR response:', e);
                }
            }
            
            if (onReadyStateChange) {
                return onReadyStateChange.apply(this, arguments);
            }
        };
        
        return XHRSend.apply(this, arguments);
    };

    // Function to extract game data from responses
    function extractGameData(data, url) {
        if (!data || typeof data !== 'object') return;
        
        // Look for village data
        if (data.villages || data.village) {
            capturedData.gameState.villages = data.villages || data.village;
            capturedData.patterns.add('VILLAGE_DATA');
            console.log('%c🏘️ Village data found!', 'color: #ffff00', capturedData.gameState.villages);
        }
        
        // Look for resource data
        if (data.resources || data.production || data.storage) {
            capturedData.gameState.resources = {
                current: data.resources,
                production: data.production,
                storage: data.storage
            };
            capturedData.patterns.add('RESOURCE_DATA');
            console.log('%c💰 Resource data found!', 'color: #ffff00', capturedData.gameState.resources);
        }
        
        // Look for troop data
        if (data.troops || data.units || data.army) {
            capturedData.gameState.troops = data.troops || data.units || data.army;
            capturedData.patterns.add('TROOP_DATA');
            console.log('%c⚔️ Troop data found!', 'color: #ffff00', capturedData.gameState.troops);
        }
        
        // Look for building data
        if (data.buildings || data.constructions) {
            capturedData.gameState.buildings = data.buildings || data.constructions;
            capturedData.patterns.add('BUILDING_DATA');
            console.log('%c🏗️ Building data found!', 'color: #ffff00', capturedData.gameState.buildings);
        }
        
        // Look for map data
        if (data.map || data.tiles || data.coordinates) {
            capturedData.gameState.map = data.map || data.tiles || data.coordinates;
            capturedData.patterns.add('MAP_DATA');
            console.log('%c🗺️ Map data found!', 'color: #ffff00', capturedData.gameState.map);
        }
        
        // Deep search for interesting keys
        searchObject(data, '', url);
    }

    // Recursive search for game data
    function searchObject(obj, path, url) {
        const interestingKeys = [
            'village', 'resource', 'production', 'troop', 'unit', 'building',
            'wood', 'clay', 'iron', 'crop', 'warehouse', 'granary',
            'attack', 'defense', 'population', 'culture', 'loyalty'
        ];
        
        for (let key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            
            const currentPath = path ? `${path}.${key}` : key;
            const value = obj[key];
            
            // Check if key is interesting
            if (interestingKeys.some(k => key.toLowerCase().includes(k))) {
                console.log(`%c📍 Found ${currentPath}:`, 'color: #00ffff', value);
                
                if (!capturedData.gameState.discovered) {
                    capturedData.gameState.discovered = {};
                }
                capturedData.gameState.discovered[currentPath] = value;
            }
            
            // Recurse if object
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                searchObject(value, currentPath, url);
            }
        }
    }

    // WebSocket monitoring
    if (window.WebSocket) {
        const OriginalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            console.log('%c🔌 WebSocket opened:', 'color: #ff00ff', url);
            capturedData.endpoints.add(url);
            
            const ws = new OriginalWebSocket(url, protocols);
            
            ws.addEventListener('message', function(event) {
                console.log('%c📨 WebSocket message:', 'color: #ff00ff', event.data);
                try {
                    const data = JSON.parse(event.data);
                    extractGameData(data, url);
                } catch (e) {}
            });
            
            const originalSend = ws.send;
            ws.send = function(data) {
                console.log('%c📤 WebSocket send:', 'color: #ff00ff', data);
                return originalSend.apply(this, arguments);
            };
            
            return ws;
        };
    }

    // EventSource (Server-Sent Events) monitoring
    if (window.EventSource) {
        const OriginalEventSource = window.EventSource;
        window.EventSource = function(url, options) {
            console.log('%c📡 EventSource opened:', 'color: #ff00ff', url);
            capturedData.endpoints.add(url);
            
            const es = new OriginalEventSource(url, options);
            
            es.addEventListener('message', function(event) {
                console.log('%c📨 EventSource message:', 'color: #ff00ff', event.data);
                try {
                    const data = JSON.parse(event.data);
                    extractGameData(data, url);
                } catch (e) {}
            });
            
            return es;
        };
    }

    // Export functions
    window.networkMonitor = {
        getData: () => capturedData,
        
        getRequests: () => capturedData.requests,
        
        getResponses: () => capturedData.responses,
        
        getGameState: () => capturedData.gameState,
        
        getEndpoints: () => Array.from(capturedData.endpoints),
        
        getPatterns: () => Array.from(capturedData.patterns),
        
        findByUrl: (pattern) => {
            return capturedData.responses.filter(r => r.url.includes(pattern));
        },
        
        findByKey: (key) => {
            return capturedData.responses.filter(r => {
                return JSON.stringify(r.data).includes(key);
            });
        },
        
        clear: () => {
            capturedData.requests = [];
            capturedData.responses = [];
            capturedData.gameState = {};
            capturedData.patterns.clear();
            console.log('Network monitor data cleared');
        },
        
        summary: () => {
            console.log('%c📊 NETWORK MONITOR SUMMARY', 'color: #00ff00; font-size: 16px');
            console.log('Total Requests:', capturedData.requests.length);
            console.log('Total Responses:', capturedData.responses.length);
            console.log('Unique Endpoints:', capturedData.endpoints.size);
            console.log('Data Patterns Found:', Array.from(capturedData.patterns));
            console.log('Game State Keys:', Object.keys(capturedData.gameState));
            console.log('\nEndpoints:');
            capturedData.endpoints.forEach(endpoint => {
                console.log('  -', endpoint);
            });
            return capturedData;
        }
    };

    console.log('%c✅ Network Monitor Ready!', 'color: #00ff00');
    console.log('Commands:');
    console.log('  networkMonitor.getData()     - Get all captured data');
    console.log('  networkMonitor.getGameState() - Get extracted game state');
    console.log('  networkMonitor.getEndpoints() - List all API endpoints');
    console.log('  networkMonitor.summary()      - Show summary');
    console.log('  networkMonitor.findByUrl("ajax") - Find responses by URL');
    console.log('  networkMonitor.clear()        - Clear captured data');
    console.log('\n%c👉 Now perform game actions to capture network traffic!', 'color: #ffff00');
    
    return window.networkMonitor;
})();