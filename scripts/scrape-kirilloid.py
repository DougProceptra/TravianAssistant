#!/usr/bin/env python3
"""
Kirilloid Building Data Scraper using Firecrawl
Extracts accurate building costs, population, and culture points from Kirilloid calculator
"""

import os
import json
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

# Check if we're in Replit environment
try:
    from firecrawl import FirecrawlApp
    from pydantic import BaseModel, Field
except ImportError:
    print("Installing required packages...")
    os.system("pip install firecrawl-py pydantic")
    from firecrawl import FirecrawlApp
    from pydantic import BaseModel, Field

# Get API key from Replit secret
API_KEY = os.environ.get('TLA_FIRECRAWL_API')
if not API_KEY:
    print("ERROR: TLA_FIRECRAWL_API secret not found in environment")
    print("Please set it in Replit Secrets")
    exit(1)

print(f"✓ Found Firecrawl API key: {API_KEY[:10]}...")

# =====================================================
# BUILDING IDS FROM KIRILLOID SOURCE
# =====================================================
BUILDINGS = {
    # Resource Fields (k=1.67)
    0: "Woodcutter",
    1: "Clay Pit",
    2: "Iron Mine",
    3: "Cropland",
    
    # Resource Boosters (k=1.80)
    4: "Sawmill",
    5: "Brickyard",
    6: "Iron Foundry",
    7: "Grain Mill",
    8: "Bakery",
    
    # Infrastructure (k=1.28)
    9: "Warehouse",
    10: "Granary",
    11: "Smithy",
    14: "Main Building",
    15: "Rally Point",
    16: "Marketplace",
    17: "Embassy",
    
    # Military (k=1.28)
    18: "Barracks",
    19: "Stables",
    20: "Workshop",
    21: "Academy",
    
    # Other Buildings
    22: "Cranny",
    23: "Town Hall",
    24: "Residence",
    25: "Palace",
    26: "Treasury",
    
    # Walls (k=1.28)
    30: "City Wall",
    31: "Earth Wall",
    32: "Palisade",
    
    # Special (k=1.33)
    36: "Hero Mansion"
}

# Server configuration
SERVER_SPEED = "2.46"  # T4.6 2x server
MAIN_BUILDING_LEVEL = "1"

# =====================================================
# PYDANTIC MODELS FOR STRUCTURED EXTRACTION
# =====================================================
class BuildingLevel(BaseModel):
    """Single level of a building"""
    level: int
    wood: int
    clay: int
    iron: int
    crop: int
    population: int
    culture_points: int = Field(alias="cp")
    build_time: str

class BuildingData(BaseModel):
    """Complete building data"""
    name: str
    levels: List[BuildingLevel]
    max_level: int = 20
    prerequisites: Optional[Dict[str, int]] = None

# =====================================================
# SCRAPING FUNCTIONS
# =====================================================
def scrape_building_with_firecrawl(building_id: int, building_name: str) -> Optional[Dict]:
    """
    Scrape a single building from Kirilloid using Firecrawl
    """
    url = f"http://travian.kirilloid.ru/build.php#b={building_id}&s={SERVER_SPEED}&mb={MAIN_BUILDING_LEVEL}"
    
    print(f"\n📊 Scraping {building_name} (ID: {building_id})")
    print(f"   URL: {url}")
    
    try:
        app = FirecrawlApp(api_key=API_KEY)
        
        # Method 1: Try structured extraction with schema
        result = app.scrape_url(
            url,
            params={
                "formats": ["markdown", "extract", "html"],
                "extract": {
                    "schema": BuildingData.model_json_schema(),
                    "prompt": f"""
                    Extract building data for {building_name} from the cost table.
                    The table shows costs for T4.6 2x server with Main Building level 1.
                    
                    For each level (1-20), extract:
                    - Level number
                    - Wood cost
                    - Clay cost 
                    - Iron cost
                    - Crop cost
                    - Population (upkeep)
                    - Culture Points (CP)
                    - Build time
                    
                    Return as structured data matching the schema.
                    """
                },
                "waitFor": 3000,  # Wait 3 seconds for JavaScript
                "timeout": 15000,
                "actions": [
                    {"type": "wait", "milliseconds": 2000}
                ]
            }
        )
        
        # Check if we got structured data
        if 'extract' in result and result['extract']:
            print(f"   ✓ Got structured data for {building_name}")
            return result['extract']
        
        # Method 2: Fallback to markdown parsing
        if 'markdown' in result:
            print(f"   ⚠ Falling back to markdown parsing for {building_name}")
            return parse_markdown_table(result['markdown'], building_name)
        
        # Method 3: Last resort - HTML parsing
        if 'html' in result:
            print(f"   ⚠ Falling back to HTML parsing for {building_name}")
            return parse_html_table(result['html'], building_name)
            
    except Exception as e:
        print(f"   ✗ Error scraping {building_name}: {e}")
        return None

def parse_markdown_table(markdown: str, building_name: str) -> Optional[Dict]:
    """
    Parse building data from markdown table
    """
    try:
        lines = markdown.split('\n')
        data = {
            "name": building_name,
            "levels": []
        }
        
        # Find table rows (look for lines with | separators)
        for line in lines:
            if '|' in line and any(char.isdigit() for char in line):
                parts = [p.strip() for p in line.split('|') if p.strip()]
                
                # Try to parse as level data
                if len(parts) >= 8 and parts[0].isdigit():
                    try:
                        level_data = {
                            "level": int(parts[0]),
                            "wood": int(parts[1].replace(',', '').replace(' ', '')),
                            "clay": int(parts[2].replace(',', '').replace(' ', '')),
                            "iron": int(parts[3].replace(',', '').replace(' ', '')),
                            "crop": int(parts[4].replace(',', '').replace(' ', '')),
                            "population": int(parts[5]),
                            "culture_points": int(parts[6]),
                            "build_time": parts[7]
                        }
                        data["levels"].append(level_data)
                    except (ValueError, IndexError):
                        continue
        
        if data["levels"]:
            data["max_level"] = len(data["levels"])
            return data
            
    except Exception as e:
        print(f"   Error parsing markdown: {e}")
    
    return None

def parse_html_table(html: str, building_name: str) -> Optional[Dict]:
    """
    Parse building data from HTML table using BeautifulSoup
    """
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        os.system("pip install beautifulsoup4")
        from bs4 import BeautifulSoup
    
    try:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Look for the main data table
        tables = soup.find_all('table')
        
        for table in tables:
            rows = table.find_all('tr')
            if len(rows) < 2:
                continue
                
            data = {
                "name": building_name,
                "levels": []
            }
            
            for row in rows[1:]:  # Skip header
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 8:
                    try:
                        level_data = {
                            "level": int(cells[0].text.strip()),
                            "wood": int(cells[1].text.strip().replace(',', '')),
                            "clay": int(cells[2].text.strip().replace(',', '')),
                            "iron": int(cells[3].text.strip().replace(',', '')),
                            "crop": int(cells[4].text.strip().replace(',', '')),
                            "population": int(cells[5].text.strip()),
                            "culture_points": int(cells[6].text.strip()),
                            "build_time": cells[7].text.strip()
                        }
                        data["levels"].append(level_data)
                    except (ValueError, IndexError):
                        continue
            
            if data["levels"]:
                data["max_level"] = len(data["levels"])
                return data
                
    except Exception as e:
        print(f"   Error parsing HTML: {e}")
    
    return None

# =====================================================
# MAIN SCRAPING LOGIC
# =====================================================
def scrape_all_buildings():
    """
    Scrape all buildings from Kirilloid
    """
    print("=" * 60)
    print("KIRILLOID BUILDING DATA SCRAPER")
    print(f"Server: T4.6 2x (speed {SERVER_SPEED})")
    print(f"Main Building: Level {MAIN_BUILDING_LEVEL}")
    print("=" * 60)
    
    all_data = {}
    success_count = 0
    
    # Test with just Academy first
    test_buildings = {21: "Academy"}  # Start with one building
    
    for building_id, building_name in test_buildings.items():
        result = scrape_building_with_firecrawl(building_id, building_name)
        
        if result:
            all_data[building_name.lower().replace(' ', '_')] = result
            success_count += 1
            
            # Show sample of data
            if result.get('levels'):
                print(f"   Sample: Level 1 = {result['levels'][0]}")
                if len(result['levels']) > 4:
                    print(f"   Sample: Level 5 = {result['levels'][4]}")
        
        # Rate limiting - be nice to the API
        time.sleep(2)
    
    print("\n" + "=" * 60)
    print(f"SCRAPING COMPLETE: {success_count}/{len(test_buildings)} buildings")
    print("=" * 60)
    
    # Save to JSON
    output_file = "kirilloid_building_data.json"
    with open(output_file, 'w') as f:
        json.dump(all_data, f, indent=2)
    
    print(f"\n✓ Data saved to {output_file}")
    
    # Also create a JavaScript module for the extension
    create_js_module(all_data)
    
    return all_data

def create_js_module(data: Dict):
    """
    Create a JavaScript module for the Chrome extension
    """
    js_content = """// Auto-generated from Kirilloid scraper
// T4.6 2x server, Main Building Level 1

export const KIRILLOID_BUILDING_DATA = """
    
    js_content += json.dumps(data, indent=2)
    js_content += ";\n"
    
    output_file = "packages/extension/src/game-data/kirilloid-data.js"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w') as f:
        f.write(js_content)
    
    print(f"✓ JavaScript module saved to {output_file}")

# =====================================================
# TEST SINGLE BUILDING FIRST
# =====================================================
def test_single_building():
    """
    Test with Academy to validate the approach
    """
    print("\n🧪 TESTING WITH SINGLE BUILDING (Academy)")
    print("-" * 40)
    
    result = scrape_building_with_firecrawl(21, "Academy")
    
    if result:
        print("\n✅ SUCCESS! Got data:")
        print(json.dumps(result, indent=2)[:500] + "...")  # Show first 500 chars
        
        # Validate against known values
        if result.get('levels') and len(result['levels']) > 0:
            level1 = result['levels'][0]
            expected = {"wood": 220, "clay": 160, "iron": 90, "crop": 40}
            
            print("\n📋 Validation:")
            print(f"   Expected Level 1: {expected}")
            print(f"   Got Level 1: Wood={level1.get('wood')}, Clay={level1.get('clay')}, Iron={level1.get('iron')}, Crop={level1.get('crop')}")
            
            if (level1.get('wood') == expected['wood'] and 
                level1.get('clay') == expected['clay']):
                print("   ✓ Data matches expected values!")
                return True
            else:
                print("   ⚠ Data doesn't match - may need to adjust parsing")
    else:
        print("\n❌ FAILED to get data")
    
    return False

# =====================================================
# MAIN EXECUTION
# =====================================================
if __name__ == "__main__":
    # First test with a single building
    if test_single_building():
        print("\n" + "=" * 60)
        print("Test successful! Ready to scrape all buildings.")
        print("Uncomment the next line to scrape everything:")
        print("=" * 60)
        
        # Uncomment this to scrape all buildings after test succeeds
        # scrape_all_buildings()
    else:
        print("\nTest failed. Please check:")
        print("1. Is the Firecrawl API key correct?")
        print("2. Can Firecrawl access travian.kirilloid.ru?")
        print("3. Is the table structure as expected?")
