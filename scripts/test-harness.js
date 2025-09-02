/**
 * Test Harness for New Data Collection Methods
 * Run this in console to test all approaches WITHOUT breaking existing extension
 * 
 * Usage: Copy entire file and paste in browser console
 */

(function() {
    console.log('%c🧪 TRAVIAN DATA COLLECTION TEST HARNESS 🧪', 'color: #00ff00; font-size: 20px; font-weight: bold');
    
    const tests = {
        passed: [],
        failed: [],
        results: {}
    };

    // TEST 1: Check if window.resources exists in page context
    function testWindowResources() {
        console.log('\n%c[TEST 1] Checking window.resources access...', 'color: #00ffff');
        
        return new Promise((resolve) => {
            // Set up listener
            const listener = (event) => {
                if (event.data?.type === 'TEST_RESOURCES_RESULT') {
                    window.removeEventListener('message', listener);
                    
                    if (event.data.found) {
                        console.log('✅ window.resources found:', event.data.data);
                        tests.passed.push('window.resources access');
                        tests.results.windowResources = event.data.data;
                    } else {
                        console.log('❌ window.resources not found');
                        tests.failed.push('window.resources access');
                    }
                    resolve();
                }
            };
            window.addEventListener('message', listener);
            
            // Inject test script
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    const found = typeof window.resources !== 'undefined';
                    window.postMessage({
                        type: 'TEST_RESOURCES_RESULT',
                        found: found,
                        data: found ? {
                            production: window.resources.production,
                            storage: window.resources.storage
                        } : null
                    }, '*');
                })();
            `;
            document.head.appendChild(script);
            script.remove();
            
            // Timeout fallback
            setTimeout(() => {
                window.removeEventListener('message', listener);
                console.log('❌ Test timed out');
                tests.failed.push('window.resources access (timeout)');
                resolve();
            }, 2000);
        });
    }

    // TEST 2: Check overview page data
    function testOverviewPage() {
        console.log('\n%c[TEST 2] Checking overview page (dorf3.php)...', 'color: #00ffff');
        
        if (window.location.href.includes('dorf3.php')) {
            const rows = document.querySelectorAll('#overview tbody tr');
            if (rows.length > 0) {
                console.log(`✅ Found ${rows.length} village rows on overview page`);
                tests.passed.push('overview page parsing');
                tests.results.overviewVillages = rows.length;
            } else {
                console.log('❌ No village rows found on overview page');
                tests.failed.push('overview page parsing');
            }
        } else {
            console.log('⚠️ Not on overview page (dorf3.php) - skipping test');
        }
    }

    // TEST 3: Test statistics page AJAX fetch
    async function testStatisticsAjax() {
        console.log('\n%c[TEST 3] Testing statistics page AJAX fetch...', 'color: #00ffff');
        
        try {
            const response = await fetch('/statistics/general');
            const html = await response.text();
            
            if (html.includes('statisticsTable') || html.includes('production')) {
                console.log(`✅ Statistics page fetched successfully (${html.length} bytes)`);
                
                // Try to parse villages
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const rows = doc.querySelectorAll('table tbody tr');
                
                console.log(`   Found ${rows.length} rows in statistics table`);
                tests.passed.push('statistics AJAX fetch');
                tests.results.statisticsRows = rows.length;
            } else {
                console.log('❌ Statistics page fetch failed or returned unexpected content');
                tests.failed.push('statistics AJAX fetch');
            }
        } catch (error) {
            console.log('❌ Error fetching statistics page:', error);
            tests.failed.push('statistics AJAX fetch');
        }
    }

    // TEST 4: Check localStorage for useful data
    function testLocalStorage() {
        console.log('\n%c[TEST 4] Checking localStorage for game data...', 'color: #00ffff');
        
        const gameKeys = [];
        const rbpKeys = [];
        const tlaKeys = [];
        
        for (let key in localStorage) {
            if (key.includes('rbp') || key.includes('ResourceBarPlus')) {
                rbpKeys.push(key);
            }
            if (key.includes('tla') || key.includes('travian')) {
                tlaKeys.push(key);
            }
            if (key.includes('village') || key.includes('production')) {
                gameKeys.push(key);
            }
        }
        
        console.log(`   ResourceBarPlus keys: ${rbpKeys.length}`, rbpKeys);
        console.log(`   TravianAssistant keys: ${tlaKeys.length}`, tlaKeys);
        console.log(`   Game-related keys: ${gameKeys.length}`, gameKeys);
        
        if (rbpKeys.length > 0 || tlaKeys.length > 0 || gameKeys.length > 0) {
            tests.passed.push('localStorage data');
            tests.results.localStorage = { rbpKeys, tlaKeys, gameKeys };
        } else {
            console.log('⚠️ No relevant data found in localStorage');
        }
    }

    // TEST 5: Check game variables
    function testGameVariables() {
        console.log('\n%c[TEST 5] Checking game variables...', 'color: #00ffff');
        
        return new Promise((resolve) => {
            const listener = (event) => {
                if (event.data?.type === 'TEST_GAME_VARS_RESULT') {
                    window.removeEventListener('message', listener);
                    
                    console.log('   Game variables found:', event.data.data);
                    tests.results.gameVariables = event.data.data;
                    
                    if (Object.keys(event.data.data).some(k => event.data.data[k])) {
                        tests.passed.push('game variables');
                    } else {
                        tests.failed.push('game variables');
                    }
                    resolve();
                }
            };
            window.addEventListener('message', listener);
            
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    window.postMessage({
                        type: 'TEST_GAME_VARS_RESULT',
                        data: {
                            hasResources: typeof window.resources !== 'undefined',
                            hasTravian: typeof window.Travian !== 'undefined',
                            hasVillages: typeof window.villages !== 'undefined',
                            hasFieldsOfVillage: typeof window.fieldsOfVillage !== 'undefined',
                            travianVariables: window.Travian?.Variables ? Object.keys(window.Travian.Variables) : null
                        }
                    }, '*');
                })();
            `;
            document.head.appendChild(script);
            script.remove();
            
            setTimeout(() => {
                window.removeEventListener('message', listener);
                resolve();
            }, 2000);
        });
    }

    // TEST 6: Test CSP restrictions
    function testCSP() {
        console.log('\n%c[TEST 6] Testing Content Security Policy...', 'color: #00ffff');
        
        try {
            // Test inline script with eval (will fail if CSP blocks)
            const testScript = document.createElement('script');
            testScript.textContent = 'console.log("[CSP Test] Inline script executed");';
            document.head.appendChild(testScript);
            testScript.remove();
            
            console.log('✅ Inline scripts via textContent work');
            tests.passed.push('CSP allows textContent scripts');
        } catch (error) {
            console.log('❌ CSP blocks inline scripts:', error);
            tests.failed.push('CSP inline scripts');
        }
    }

    // Run all tests
    async function runAllTests() {
        console.log('\n%cRunning all tests...', 'color: #ffff00');
        
        await testWindowResources();
        testOverviewPage();
        await testStatisticsAjax();
        testLocalStorage();
        await testGameVariables();
        testCSP();
        
        // Generate report
        console.log('\n%c📊 TEST RESULTS SUMMARY 📊', 'color: #00ff00; font-size: 16px; font-weight: bold');
        console.log(`✅ Passed: ${tests.passed.length}`, tests.passed);
        console.log(`❌ Failed: ${tests.failed.length}`, tests.failed);
        console.log('\n📦 Collected Data:', tests.results);
        
        // Recommendations
        console.log('\n%c💡 RECOMMENDATIONS', 'color: #ffff00; font-size: 14px; font-weight: bold');
        
        if (tests.results.windowResources) {
            console.log('✅ window.resources is accessible - use context bridge approach');
        }
        
        if (tests.results.statisticsRows > 0) {
            console.log('✅ Statistics page AJAX works - can get all villages without navigation');
        }
        
        if (tests.results.localStorage?.rbpKeys?.length > 0) {
            console.log('✅ ResourceBarPlus data available - can piggyback on it');
        }
        
        window.testResults = tests;
        console.log('\n💾 Full test results saved to: window.testResults');
    }

    // Start tests
    runAllTests();
})();