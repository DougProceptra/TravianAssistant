# Travian Data Extraction Research Report
*Date: August 30, 2025*
*Researcher: Claude AI*

## Executive Summary

After thorough investigation of travian.kirilloid.ru, I've identified three primary extraction approaches with varying complexity, reliability, and maintenance requirements. The site contains complete game mechanics data but presents challenges due to its JavaScript-heavy architecture and dynamic content loading.

## Site Architecture Analysis

### Technical Stack
- **Frontend**: React-based SPA (Single Page Application)
- **Data Storage**: Client-side JavaScript objects
- **Server Detection**: Dropdown selectors for versions (T4, T4.5, T4.6) and speeds (1x, 2x, 3x, 5x, 10x)
- **URL Structure**: Query parameters control server/speed selection
  - Example: `http://travian.kirilloid.ru/build.php?b=15&s=5&a=t`
  - `b=15` (building ID for Main Building)
  - `s=5` (server speed selector)
  - `a=t` (additional parameter)

### Data Organization
The site loads data into JavaScript global variables:
- Building data per level (costs, time, effects)
- Troop statistics per tribe
- Game mechanics (culture points, celebrations, etc.)
- Server-specific multipliers applied client-side

### Key Discovery
**Each server/speed combination has DIFFERENT values** - not just time multipliers but actual resource costs, culture point requirements, and other mechanics change between server types.

## Extraction Approach Options

### Option 1: Browser Automation with Puppeteer
**Complexity**: High  
**Reliability**: High  
**Maintenance**: Medium

#### Pros
- Can interact with dropdowns and dynamic content
- Executes JavaScript to get computed values
- Can systematically navigate all pages/tabs
- Handles AJAX and dynamic loading

#### Cons  
- Requires headless browser setup
- Slower extraction (2-3 hours for complete data)
- More complex error handling
- Resource intensive

#### Implementation Approach
```javascript
// Pseudocode for Puppeteer extraction
const puppeteer = require('puppeteer');

async function extractData() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // For each server configuration
  for (const config of SERVER_CONFIGS) {
    await page.goto(`http://travian.kirilloid.ru/build.php${config.params}`);
    
    // Extract JavaScript variables
    const data = await page.evaluate(() => {
      return {
        buildings: window.buildings || {},
        troops: window.troops || {},
        // ... other global variables
      };
    });
    
    // Save to file
    await saveData(config.name, data);
  }
}
```

### Option 2: Direct HTTP + JavaScript Parsing
**Complexity**: Medium  
**Reliability**: Medium  
**Maintenance**: High

#### Pros
- Faster than browser automation
- Lower resource usage
- Can run in simple Node.js environment

#### Cons
- Must parse/execute JavaScript code
- Brittle if site structure changes
- May miss dynamically loaded content
- Complex regex/parsing required

#### Implementation Approach
```javascript
// Fetch HTML and extract embedded JavaScript
const response = await fetch('http://travian.kirilloid.ru/build.php?s=5');
const html = await response.text();

// Extract JavaScript variables using regex
const buildingDataMatch = html.match(/var buildings = (\[.*?\]);/s);
const buildingData = eval(buildingDataMatch[1]); // UNSAFE - needs sandboxing
```

### Option 3: Reverse Engineer from GitHub Source
**Complexity**: Very High  
**Reliability**: Low  
**Maintenance**: Low (once completed)

#### Pros
- Direct access to source data structures
- No web scraping needed
- Most efficient once mapped

#### Cons
- Source code is TypeScript/React (complex build process)
- Data scattered across multiple files
- May not have latest game updates
- Requires understanding site's build system

#### Key Finding
The GitHub repository (https://github.com/kirilloid/travian) contains the source but:
- Data is in TypeScript modules requiring compilation
- Uses complex inheritance patterns (`extend(data, { buildings })`)
- Server variations handled through multiple model files

### Option 4: Hybrid API Discovery (Recommended)
**Complexity**: Low-Medium  
**Reliability**: High  
**Maintenance**: Low

#### Pros
- Most robust long-term solution
- Faster than full page scraping
- Can cache responses

#### Cons
- Requires initial investigation time
- May need periodic updates if endpoints change

#### Investigation Plan
1. Monitor browser Network tab while using the site
2. Identify any API endpoints or data files loaded
3. Check for static JSON files or API patterns
4. Test direct access to data endpoints

## Specific Data Requirements

### Critical Data Points Needed
1. **Buildings** (40+ types, 20 levels each)
   - Resource costs (wood, clay, iron, crop)
   - Build time in seconds
   - Population increase
   - Culture points
   - Effect values (production bonus, etc.)
   - Prerequisites

2. **Troops** (7 tribes × ~10 units each)
   - Attack/defense values
   - Speed and carry capacity
   - Training time and costs
   - Building requirements

3. **Game Mechanics**
   - Culture point requirements per village
   - Celebration costs and effects
   - Hero experience tables
   - Oasis bonuses and defenders

### Server Configurations to Extract
Priority order based on Doug's needs:
1. **T4.6 2x** (Current server - HIGHEST PRIORITY)
2. T4.6 1x (Standard speed comparison)
3. T4 1x (Baseline classic)
4. T4.5 variants (if time permits)

## Recommended Implementation Strategy

### Phase 1: Proof of Concept (2 hours)
1. Use Puppeteer to extract ONE complete building from T4.6 2x
2. Validate against Doug's screenshot (Main Building costs)
3. Document JavaScript variable structure

### Phase 2: Full Extraction (4 hours)
1. Implement systematic extraction for all buildings
2. Add troop data extraction
3. Include game mechanics data
4. Handle all priority server configs

### Phase 3: Storage & Access Layer (2 hours)
1. Design normalized JSON structure
2. Create TypeScript interfaces
3. Build query methods
4. Add caching layer

### Phase 4: Validation (1 hour)
1. Test against known values
2. Compare server variations
3. Verify completeness
4. Document any gaps

## Technical Considerations

### Performance Optimization
- Cache extracted data locally
- Implement incremental updates
- Use parallel extraction where possible

### Error Handling
- Retry failed extractions
- Log incomplete data
- Validate data integrity
- Handle site unavailability

### Maintenance Strategy
- Version extracted data
- Document extraction date/time
- Create update detection mechanism
- Build re-extraction scripts

## Risk Assessment

### High Risk
- Site structure changes breaking extraction
- IP blocking from too many requests
- JavaScript obfuscation in future updates

### Medium Risk
- Incomplete data extraction
- Server configuration changes
- Performance degradation over time

### Low Risk
- Data accuracy (site is well-maintained)
- Legal issues (data is publicly available)

## Alternative Data Sources

### Investigated Alternatives
1. **Official Travian API**: Not available for game mechanics
2. **Game Wiki**: Incomplete and often outdated
3. **Other Tools**: Most rely on Kirilloid or are less comprehensive
4. **In-Game Scraping**: Against ToS and incomplete

### Conclusion
Kirilloid remains the most complete and reliable source for Travian game mechanics data.

## Recommended Next Steps

### Immediate Actions
1. **Test Puppeteer Setup** (30 minutes)
   - Install puppeteer in project
   - Test basic page navigation
   - Extract sample JavaScript variable

2. **Validate Data Structure** (30 minutes)
   - Confirm building data format
   - Map server selector values
   - Document variable names

3. **Build Extraction Script** (2 hours)
   - Focus on T4.6 2x first
   - Extract buildings and troops
   - Save to structured JSON

### Decision Points
1. **Extraction Method**: Puppeteer (most reliable) vs Direct HTTP (faster)
2. **Update Frequency**: One-time vs periodic updates
3. **Storage Format**: JSON files vs SQLite database
4. **Validation Level**: Spot checks vs comprehensive testing

## Questions for Doug

1. **Priority Data**: Which game mechanics are most critical for beta?
   - Just buildings and troops?
   - Or also celebrations, hero, artifacts?

2. **Server Coverage**: Should we extract data for servers you don't play?
   - Focus only on T4.6 2x?
   - Or prepare for future servers?

3. **Update Frequency**: How often does game data change?
   - Can we do one-time extraction?
   - Or need automatic updates?

4. **Accuracy Requirements**: What's acceptable margin of error?
   - Must match exactly?
   - Or close approximations okay?

5. **Time Investment**: How much time to allocate?
   - Quick and dirty for beta?
   - Or comprehensive solution?

## Implementation Estimate

### Quick Solution (4 hours)
- Puppeteer script for T4.6 2x only
- Buildings and troops data
- Basic JSON storage
- Manual validation

### Comprehensive Solution (12 hours)
- All server configurations
- Complete game mechanics
- SQLite database with indices
- Automated validation
- Update detection system

### Recommended Approach
Start with Quick Solution for beta (September 1), then enhance based on user feedback and needs.

## Conclusion

The Kirilloid site contains all required data but needs systematic extraction. Puppeteer-based browser automation offers the best balance of reliability and completeness. We can have working extraction for T4.6 2x server within 4 hours, sufficient for beta launch.

The main technical challenge is handling the JavaScript-heavy site, but this is manageable with modern tools. The bigger question is scope - how comprehensive should the extraction be for initial launch vs. future enhancements.

## Appendix: Code Samples

### Sample Puppeteer Extraction
```javascript
const extractBuildingData = async (page) => {
  return await page.evaluate(() => {
    // Access global variables
    const buildings = window.buildings || [];
    
    // Transform to our format
    return buildings.map(building => ({
      id: building.id,
      name: building.name,
      maxLevel: building.maxLevel,
      levels: building.levels.map(level => ({
        level: level.lvl,
        costs: {
          wood: level.res[0],
          clay: level.res[1],
          iron: level.res[2],
          crop: level.res[3]
        },
        time: level.time,
        pop: level.pop,
        cp: level.cp
      }))
    }));
  });
};
```

### Sample Data Validation
```javascript
const validateExtraction = (data) => {
  // Check against known values
  const mainBuilding = data.buildings.find(b => b.id === 15);
  const level6 = mainBuilding.levels[5];
  
  assert(level6.costs.wood === 240, 'Wood cost mismatch');
  assert(level6.costs.clay === 135, 'Clay cost mismatch');
  assert(level6.costs.iron === 205, 'Iron cost mismatch');
  assert(level6.costs.crop === 70, 'Crop cost mismatch');
};
```

---

*This research provides the foundation for implementing a robust data extraction system. The recommended Puppeteer approach balances reliability with implementation complexity, suitable for the September 1 beta deadline.*