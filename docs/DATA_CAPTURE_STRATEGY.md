# Travian Data Capture Strategy - Alternative Approaches

## Current Roadblock
We're unable to reliably capture real-time game data from Travian. The game appears to be hiding or obfuscating the data we need for the AI agent.

## Data Discovery Tools Created
1. **data-audit-tool.js** - Comprehensive scanner for all data sources
2. **network-monitor.js** - Intercepts all network traffic  
3. **dom-mutation-tracker.js** - Watches for DOM changes

## Alternative Strategies

### 1. Browser Extension Permissions Strategy
**Approach**: Use more aggressive Chrome extension permissions
```json
{
  "permissions": [
    "webRequest",
    "webRequestBlocking",
    "debugger",
    "tabs",
    "cookies"
  ]
}
```
**Pros**: Can intercept ALL requests before encryption
**Cons**: Requires more permissions, may trigger security warnings

### 2. Proxy Server Strategy
**Approach**: Route game traffic through local proxy
- Use tools like mitmproxy or Charles Proxy
- Decrypt HTTPS traffic with custom certificate
- Extract data before it reaches browser
**Pros**: Complete visibility into all traffic
**Cons**: Complex setup, may violate ToS

### 3. Visual Recognition Strategy (OCR)
**Approach**: Use OCR to read numbers directly from screen
```javascript
// Use Tesseract.js or similar
const screenshot = await captureTab();
const text = await Tesseract.recognize(screenshot);
const resources = extractNumbersFromText(text);
```
**Pros**: Works regardless of code obfuscation
**Cons**: Slower, less accurate, resource intensive

### 4. Piggyback Strategy
**Approach**: Leverage other extensions that already have the data
- ResourceBarPlus (already partially integrated)
- TravianPlus features
- Other popular Travian tools
**Pros**: Data already parsed and available
**Cons**: Dependency on third-party tools

### 5. Manual Input + Prediction Strategy
**Approach**: User manually inputs key data periodically, AI predicts between updates
- User enters village data once per session
- AI calculates production rates and estimates current values
- Periodic manual corrections
**Pros**: Always works, no technical barriers
**Cons**: Requires user input, less real-time

### 6. Game API Reverse Engineering
**Approach**: Deep dive into Travian's actual API
- Monitor all POST/GET parameters
- Replay requests with modified parameters
- Map out entire API surface
**Tools**: 
- Postman for API testing
- Burp Suite for detailed analysis
**Pros**: Direct access to game data
**Cons**: Time intensive, may change with updates

### 7. Memory Reading Strategy
**Approach**: Read game data directly from browser memory
- Use Chrome DevTools Protocol
- Access JavaScript heap snapshots
- Extract game objects from memory
**Pros**: Bypasses all UI obfuscation
**Cons**: Complex, may be unstable

### 8. Event Injection Strategy
**Approach**: Inject into game's JavaScript context earlier
```javascript
// Inject before game loads
const script = document.createElement('script');
script.textContent = `
  // Override game functions to capture data
  const originalUpdate = Game.updateResources;
  Game.updateResources = function(data) {
    window.postMessage({type: 'GAME_DATA', data}, '*');
    return originalUpdate.apply(this, arguments);
  }
`;
document.documentElement.appendChild(script);
```
**Pros**: Can intercept data at source
**Cons**: Fragile, depends on game structure

### 9. Collaborative Data Strategy
**Approach**: Multiple users share data
- Users in same alliance share village data
- Central database aggregates information
- AI has broader strategic view
**Pros**: Network effects, better strategic advice
**Cons**: Privacy concerns, requires user base

### 10. Statistical Inference Strategy
**Approach**: Infer game state from available indicators
- Monitor page load times (correlate with army size)
- Track UI element positions (indicate building levels)
- Analyze CSS classes (often contain state info)
**Pros**: Subtle, hard to block
**Cons**: Indirect, requires calibration

## Recommended Test Sequence

### Phase 1: Quick Wins
1. Run `data-audit-tool.js` on game page
2. Click around game while `network-monitor.js` runs
3. Watch `dom-mutation-tracker.js` during resource updates
4. Check if ResourceBarPlus exposes usable data

### Phase 2: Enhanced Detection
1. Try injecting earlier in page load
2. Check localStorage/sessionStorage after actions
3. Monitor WebSocket connections if any
4. Look for hidden iframes with data

### Phase 3: Alternative Approaches
1. Test OCR on resource bar
2. Implement manual input UI
3. Research other Travian extensions' methods
4. Consider proxy approach if desperate

## Key Questions to Answer

1. **Is the data encrypted client-side?**
   - Run network monitor during login
   - Check if responses are encrypted

2. **Is the data in memory but not in DOM?**
   - Use Chrome DevTools Memory Profiler
   - Search heap for known values

3. **Are other extensions succeeding?**
   - Install ResourceBarPlus and inspect its data
   - Check what TravianPlus official tools can access

4. **Is there a WebAssembly component?**
   - Check Network tab for .wasm files
   - Data might be processed in WASM

5. **Are there anti-bot measures?**
   - Check for fingerprinting scripts
   - Look for rate limiting or behavior analysis

## Fallback Plan

If we cannot reliably capture real-time data:

1. **Hybrid Approach**: 
   - Manual input for critical data
   - Automated capture where possible
   - AI fills gaps with predictions

2. **Strategic Advisor Mode**:
   - User describes situation
   - AI provides strategic advice
   - Less automation, more intelligence

3. **Screenshot Analysis**:
   - User takes screenshot
   - Extension analyzes image
   - Extracts data via OCR/CV

## Next Steps

1. Run all three audit scripts on live game
2. Document findings in `/data/audit-results.md`
3. Test ResourceBarPlus data availability
4. Decide on primary strategy
5. Implement proof of concept

## Success Criteria

We need at minimum:
- Current resources (wood, clay, iron, crop)
- Production rates (per hour)
- Village list with basic info
- Current building queue
- Troop counts (even if approximate)

Without these, the AI cannot provide meaningful strategic advice.

## Notes

- Travian Legends may have different protection than Travian Kingdoms
- Some servers have different security settings
- Mobile version might expose different data
- Consider testing on different browsers