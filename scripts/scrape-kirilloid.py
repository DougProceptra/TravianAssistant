#!/usr/bin/env python3
"""
Kirilloid Building Data Scraper using Firecrawl
Extracts accurate building costs, population, and culture points from Kirilloid calculator
"""

import os
import json
import time
from typing import Dict, List, Optional

# Check if we're in Replit environment
try:
    from firecrawl import FirecrawlApp
except ImportError:
    print("Installing required packages...")
    os.system("pip install firecrawl-py")
    from firecrawl import FirecrawlApp

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
        
        # Use the correct parameters for firecrawl-py
        # Based on the SDK, parameters are passed directly, not in a params dict
        result = app.scrape(
            url,
            formats=['markdown', 'html'],
            wait_for=3000,  # Wait 3 seconds for JavaScript
            timeout=15000
        )
        
        print(f"   ✓ Got response from Firecrawl")
        
        # Check what we got
        if isinstance(result, dict):
            # Debug: show keys
            print(f"   Response keys: {list(result.keys())}")
            
            # Try to access the data
            # The response might be in result['data'] or directly in result
            data = result.get('data', result)
            
            # Try markdown first
            if 'markdown' in data and data['markdown']:
                print(f"   📝 Got markdown content ({len(data['markdown'])} chars)")
                return parse_markdown_table(data['markdown'], building_name)
            
            # Fallback to HTML
            if 'html' in data and data['html']:
                print(f"   📄 Got HTML content ({len(data['html'])} chars)")
                return parse_html_table(data['html'], building_name)
            
            # Try different possible structures
            if 'content' in data:
                content = data['content']
                if isinstance(content, str):
                    print(f"   📄 Got content string ({len(content)} chars)")
                    # Try to determine if it's HTML or markdown
                    if '<table' in content:
                        return parse_html_table(content, building_name)
                    else:
                        return parse_markdown_table(content, building_name)
            
            # Show actual structure for debugging
            print(f"   ⚠ Unexpected structure. Sample: {str(result)[:500]}")
            
        else:
            print(f"   ⚠ Unexpected response type: {type(result)}")
            
    except Exception as e:
        print(f"   ✗ Error scraping {building_name}: {e}")
        
        # Try to show available methods/attributes for debugging
        try:
            app = FirecrawlApp(api_key=API_KEY)
            print(f"   Available methods: {[m for m in dir(app) if not m.startswith('_')]}")
        except:
            pass
            
        import traceback
        traceback.print_exc()
        return None

def parse_markdown_table(markdown: str, building_name: str) -> Optional[Dict]:
    """
    Parse building data from markdown table
    """
    try:
        print(f"   🔍 Parsing markdown table...")
        
        # Debug: Show sample of content
        preview = markdown[:1000].replace('\n', '\\n')
        print(f"   Preview: {preview[:200]}...")
        
        lines = markdown.split('\n')
        data = {
            "name": building_name,
            "levels": []
        }
        
        # Find table rows - Kirilloid might use different separators
        for line in lines:
            # Skip empty lines
            if not line.strip():
                continue
                
            # Check if this looks like a data row
            # Could be separated by |, tabs, or spaces
            if '|' in line:
                parts = [p.strip() for p in line.split('|') if p.strip()]
            elif '\t' in line:
                parts = [p.strip() for p in line.split('\t') if p.strip()]
            else:
                # Try splitting by multiple spaces
                parts = line.split()
            
            # Try to parse as level data
            if len(parts) >= 8:
                try:
                    # Check if first part is a number (level)
                    first = parts[0].strip()
                    if first.isdigit():
                        level = int(first)
                        
                        # Clean up number strings
                        def clean_number(s):
                            return s.replace(',', '').replace('.', '').replace(' ', '').strip()
                        
                        level_data = {
                            "level": level,
                            "wood": int(clean_number(parts[1])),
                            "clay": int(clean_number(parts[2])),
                            "iron": int(clean_number(parts[3])),
                            "crop": int(clean_number(parts[4])),
                            "population": int(clean_number(parts[5])),
                            "culture_points": int(clean_number(parts[6])),
                            "build_time": parts[7].strip()
                        }
                        data["levels"].append(level_data)
                        
                        # Show first level found
                        if level == 1:
                            print(f"   ✓ Found Level 1: Wood={level_data['wood']}, Clay={level_data['clay']}")
                            
                except (ValueError, IndexError) as e:
                    # Not a data row, skip
                    continue
        
        if data["levels"]:
            data["max_level"] = len(data["levels"])
            print(f"   ✓ Parsed {len(data['levels'])} levels")
            return data
        else:
            print(f"   ⚠ No level data found in markdown")
            # Show more of the content for debugging
            print(f"   First 10 lines:")
            for i, line in enumerate(lines[:10]):
                print(f"     {i}: {line[:100]}")
            
    except Exception as e:
        print(f"   Error parsing markdown: {e}")
    
    return None

def parse_html_table(html: str, building_name: str) -> Optional[Dict]:
    """
    Parse building data from HTML table using regex as fallback
    """
    try:
        print(f"   🔍 Parsing HTML table...")
        
        # First, try to find if there's a table at all
        if '<table' not in html.lower():
            print(f"   ⚠ No table found in HTML")
            return None
        
        # Try BeautifulSoup first
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for tables
            tables = soup.find_all('table')
            print(f"   Found {len(tables)} tables")
            
            for i, table in enumerate(tables):
                rows = table.find_all('tr')
                
                if len(rows) < 2:
                    continue
                    
                data = {
                    "name": building_name,
                    "levels": []
                }
                
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    
                    if len(cells) >= 8:
                        try:
                            first_cell = cells[0].text.strip()
                            if first_cell.isdigit():
                                level_data = {
                                    "level": int(first_cell),
                                    "wood": int(cells[1].text.strip().replace(',', '').replace('.', '')),
                                    "clay": int(cells[2].text.strip().replace(',', '').replace('.', '')),
                                    "iron": int(cells[3].text.strip().replace(',', '').replace('.', '')),
                                    "crop": int(cells[4].text.strip().replace(',', '').replace('.', '')),
                                    "population": int(cells[5].text.strip().replace(',', '').replace('.', '')),
                                    "culture_points": int(cells[6].text.strip().replace(',', '').replace('.', '')),
                                    "build_time": cells[7].text.strip()
                                }
                                data["levels"].append(level_data)
                                
                                if level_data["level"] == 1:
                                    print(f"   ✓ Found Level 1: Wood={level_data['wood']}, Clay={level_data['clay']}")
                                    
                        except (ValueError, IndexError):
                            continue
                
                if data["levels"]:
                    data["max_level"] = len(data["levels"])
                    print(f"   ✓ Parsed {len(data['levels'])} levels from table {i+1}")
                    return data
                    
        except ImportError:
            print("   BeautifulSoup not available, using regex fallback")
            
            # Regex fallback for table parsing
            import re
            
            # Find all table rows
            row_pattern = r'<tr[^>]*>(.*?)</tr>'
            rows = re.findall(row_pattern, html, re.DOTALL | re.IGNORECASE)
            
            print(f"   Found {len(rows)} rows with regex")
            
            data = {
                "name": building_name,
                "levels": []
            }
            
            for row in rows:
                # Extract cells from row
                cell_pattern = r'<t[dh][^>]*>(.*?)</t[dh]>'
                cells = re.findall(cell_pattern, row, re.DOTALL | re.IGNORECASE)
                
                if len(cells) >= 8:
                    try:
                        # Clean HTML tags from cell content
                        clean_cells = []
                        for cell in cells:
                            clean = re.sub(r'<[^>]+>', '', cell).strip()
                            clean_cells.append(clean)
                        
                        if clean_cells[0].isdigit():
                            level_data = {
                                "level": int(clean_cells[0]),
                                "wood": int(clean_cells[1].replace(',', '').replace('.', '')),
                                "clay": int(clean_cells[2].replace(',', '').replace('.', '')),
                                "iron": int(clean_cells[3].replace(',', '').replace('.', '')),
                                "crop": int(clean_cells[4].replace(',', '').replace('.', '')),
                                "population": int(clean_cells[5].replace(',', '').replace('.', '')),
                                "culture_points": int(clean_cells[6].replace(',', '').replace('.', '')),
                                "build_time": clean_cells[7]
                            }
                            data["levels"].append(level_data)
                            
                            if level_data["level"] == 1:
                                print(f"   ✓ Found Level 1: Wood={level_data['wood']}, Clay={level_data['clay']}")
                    except (ValueError, IndexError):
                        continue
            
            if data["levels"]:
                data["max_level"] = len(data["levels"])
                print(f"   ✓ Parsed {len(data['levels'])} levels with regex")
                return data
                
    except Exception as e:
        print(f"   Error parsing HTML: {e}")
        import traceback
        traceback.print_exc()
    
    return None

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
        print(json.dumps(result, indent=2)[:1000] + "...")  # Show first 1000 chars
        
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
        print("To scrape all buildings, run:")
        print("python scripts/scrape-kirilloid.py --all")
        print("=" * 60)
        
        # Check for --all flag
        import sys
        if '--all' in sys.argv:
            print("\n🚀 Scraping ALL buildings...")
            # TODO: Implement scrape_all_buildings()
    else:
        print("\nTest failed. Debugging info above.")
