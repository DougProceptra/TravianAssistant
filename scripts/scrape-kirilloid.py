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
        
        # Scrape the page
        result = app.scrape(
            url,
            formats=['markdown', 'html'],
            wait_for=3000,  # Wait 3 seconds for JavaScript
            timeout=15000
        )
        
        print(f"   ✓ Got response from Firecrawl")
        print(f"   Response type: {type(result)}")
        
        # The result is a Document object, not a dict
        # Try to access its attributes
        if hasattr(result, '__dict__'):
            print(f"   Document attributes: {list(result.__dict__.keys())}")
        
        # Try different ways to access the content
        markdown_content = None
        html_content = None
        
        # Try direct attributes
        if hasattr(result, 'markdown'):
            markdown_content = result.markdown
            if markdown_content:
                print(f"   📝 Got markdown content ({len(markdown_content)} chars)")
        
        if hasattr(result, 'html'):
            html_content = result.html
            if html_content:
                print(f"   📄 Got HTML content ({len(html_content)} chars)")
        
        # Try as dict-like object
        if hasattr(result, 'get'):
            markdown_content = result.get('markdown')
            html_content = result.get('html')
        
        # Try to convert to dict
        if hasattr(result, 'to_dict'):
            result_dict = result.to_dict()
            print(f"   Converted to dict with keys: {list(result_dict.keys())}")
            markdown_content = result_dict.get('markdown')
            html_content = result_dict.get('html')
        elif hasattr(result, '__dict__'):
            result_dict = result.__dict__
            markdown_content = result_dict.get('markdown')
            html_content = result_dict.get('html')
        
        # Process the content we found
        if markdown_content:
            return parse_markdown_table(markdown_content, building_name)
        elif html_content:
            return parse_html_table(html_content, building_name)
        else:
            print(f"   ⚠ No content found in response")
            # Try to print the actual object for debugging
            print(f"   Full object: {str(result)[:500]}")
            
    except Exception as e:
        print(f"   ✗ Error scraping {building_name}: {e}")
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
        print(f"   First 500 chars: {markdown[:500]}")
        
        lines = markdown.split('\n')
        data = {
            "name": building_name,
            "levels": []
        }
        
        # Look for table data in various formats
        for i, line in enumerate(lines):
            # Skip empty lines
            if not line.strip():
                continue
            
            # Debug first few lines with content
            if i < 20 and line.strip():
                print(f"   Line {i}: {line[:100]}")
            
            # Look for numeric data that could be building levels
            # Kirilloid might format as: "1 220 160 90 40 4 5 0:16:40"
            parts = line.split()
            
            if len(parts) >= 8:
                try:
                    # Check if first part is a level number (1-20)
                    first = parts[0].strip().replace('.', '').replace(',', '')
                    if first.isdigit() and 1 <= int(first) <= 20:
                        level = int(first)
                        
                        # Clean and parse the numbers
                        def clean_num(s):
                            return int(s.replace(',', '').replace('.', '').strip())
                        
                        level_data = {
                            "level": level,
                            "wood": clean_num(parts[1]),
                            "clay": clean_num(parts[2]),
                            "iron": clean_num(parts[3]),
                            "crop": clean_num(parts[4]),
                            "population": clean_num(parts[5]),
                            "culture_points": clean_num(parts[6]),
                            "build_time": parts[7] if ':' in parts[7] else ' '.join(parts[7:])
                        }
                        
                        # Validate the data makes sense
                        if level_data["wood"] > 0 and level_data["wood"] < 100000:
                            data["levels"].append(level_data)
                            
                            if level == 1:
                                print(f"   ✓ Found Level 1: {level_data}")
                                
                except (ValueError, IndexError) as e:
                    continue
            
            # Also try pipe-separated format
            if '|' in line and len(line.split('|')) >= 8:
                parts = [p.strip() for p in line.split('|') if p.strip()]
                if len(parts) >= 8:
                    try:
                        first = parts[0].strip()
                        if first.isdigit() and 1 <= int(first) <= 20:
                            level = int(first)
                            
                            level_data = {
                                "level": level,
                                "wood": int(parts[1].replace(',', '').replace('.', '')),
                                "clay": int(parts[2].replace(',', '').replace('.', '')),
                                "iron": int(parts[3].replace(',', '').replace('.', '')),
                                "crop": int(parts[4].replace(',', '').replace('.', '')),
                                "population": int(parts[5].replace(',', '').replace('.', '')),
                                "culture_points": int(parts[6].replace(',', '').replace('.', '')),
                                "build_time": parts[7].strip()
                            }
                            
                            if level_data["wood"] > 0 and level_data["wood"] < 100000:
                                data["levels"].append(level_data)
                                
                                if level == 1:
                                    print(f"   ✓ Found Level 1 (pipe format): {level_data}")
                    except (ValueError, IndexError):
                        continue
        
        if data["levels"]:
            data["max_level"] = len(data["levels"])
            print(f"   ✓ Parsed {len(data['levels'])} levels")
            return data
        else:
            print(f"   ⚠ No level data found in markdown")
            
    except Exception as e:
        print(f"   Error parsing markdown: {e}")
        import traceback
        traceback.print_exc()
    
    return None

def parse_html_table(html: str, building_name: str) -> Optional[Dict]:
    """
    Parse building data from HTML table
    """
    try:
        print(f"   🔍 Parsing HTML table...")
        
        # Check if there's a table
        if '<table' not in html.lower():
            print(f"   ⚠ No table found in HTML")
            print(f"   HTML preview: {html[:500]}")
            return None
        
        # Use regex to extract table data
        import re
        
        # Find all table rows
        row_pattern = r'<tr[^>]*>(.*?)</tr>'
        rows = re.findall(row_pattern, html, re.DOTALL | re.IGNORECASE)
        
        print(f"   Found {len(rows)} table rows")
        
        data = {
            "name": building_name,
            "levels": []
        }
        
        for row_num, row in enumerate(rows):
            # Extract cells from row
            cell_pattern = r'<t[dh][^>]*>(.*?)</t[dh]>'
            cells = re.findall(cell_pattern, row, re.DOTALL | re.IGNORECASE)
            
            if len(cells) >= 8:
                try:
                    # Clean HTML tags from cell content
                    clean_cells = []
                    for cell in cells:
                        # Remove all HTML tags
                        clean = re.sub(r'<[^>]+>', '', cell).strip()
                        clean = clean.replace('&nbsp;', ' ').replace('&amp;', '&')
                        clean_cells.append(clean)
                    
                    # Debug first row with enough cells
                    if row_num < 3:
                        print(f"   Row {row_num} cells: {clean_cells[:5]}")
                    
                    # Check if first cell is a level number
                    first = clean_cells[0].strip()
                    if first.isdigit() and 1 <= int(first) <= 20:
                        level_data = {
                            "level": int(first),
                            "wood": int(clean_cells[1].replace(',', '').replace('.', '')),
                            "clay": int(clean_cells[2].replace(',', '').replace('.', '')),
                            "iron": int(clean_cells[3].replace(',', '').replace('.', '')),
                            "crop": int(clean_cells[4].replace(',', '').replace('.', '')),
                            "population": int(clean_cells[5].replace(',', '').replace('.', '')),
                            "culture_points": int(clean_cells[6].replace(',', '').replace('.', '')),
                            "build_time": clean_cells[7].strip()
                        }
                        
                        data["levels"].append(level_data)
                        
                        if level_data["level"] == 1:
                            print(f"   ✓ Found Level 1: {level_data}")
                            
                except (ValueError, IndexError) as e:
                    continue
        
        if data["levels"]:
            data["max_level"] = len(data["levels"])
            print(f"   ✓ Parsed {len(data['levels'])} levels from HTML")
            return data
        else:
            print(f"   ⚠ No valid level data found in HTML table")
                
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
