#!/usr/bin/env python3
"""
Custom Kirilloid scraper using Python requests + JavaScript extraction
Since Firecrawl is blocked, we'll parse the JavaScript directly
"""

import re
import json
import requests
from bs4 import BeautifulSoup

print("="*60)
print("🔧 CUSTOM KIRILLOID SCRAPER")
print("="*60)

def fetch_kirilloid_page(building_id=1, speed=2.46, main_building=1):
    """Fetch Kirilloid page with specific parameters"""
    # Note: The fragment (#b=1) doesn't affect server response
    # JavaScript reads it client-side
    url = f"http://travian.kirilloid.ru/build.php"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    response = requests.get(url, headers=headers)
    return response.text

def extract_building_data_from_js(html_content):
    """Extract building data from JavaScript in the HTML"""
    
    # Kirilloid embeds all building data in JavaScript
    # Look for the buildings data structure
    
    # Pattern 1: Look for the buildings array
    buildings_pattern = r'var\s+buildings\s*=\s*(\[[\s\S]*?\]);'
    match = re.search(buildings_pattern, html_content)
    
    if match:
        try:
            # Clean up the JavaScript to make it valid JSON
            js_data = match.group(1)
            
            # Replace JavaScript syntax with JSON syntax
            js_data = re.sub(r'(\w+):', r'"\1":', js_data)  # Add quotes to keys
            js_data = re.sub(r"'", '"', js_data)  # Replace single quotes
            js_data = re.sub(r',\s*}', '}', js_data)  # Remove trailing commas
            js_data = re.sub(r',\s*]', ']', js_data)  # Remove trailing commas
            
            buildings = json.loads(js_data)
            return buildings
        except Exception as e:
            print(f"❌ Failed to parse buildings array: {e}")
    
    # Pattern 2: Look for individual building definitions
    # Kirilloid might define buildings individually
    building_defs = {}
    
    # Look for patterns like: BUILDINGS[1] = {...} or buildings[1] = {...}
    pattern = r'(?:BUILDINGS|buildings)\[(\d+)\]\s*=\s*({[^}]+})'
    matches = re.finditer(pattern, html_content)
    
    for match in matches:
        building_id = match.group(1)
        building_data = match.group(2)
        try:
            # Clean and parse
            building_data = re.sub(r'(\w+):', r'"\1":', building_data)
            building_data = re.sub(r"'", '"', building_data)
            data = json.loads(building_data)
            building_defs[building_id] = data
            print(f"  Found building {building_id}: {data.get('name', 'Unknown')}")
        except:
            pass
    
    if building_defs:
        return building_defs
    
    # Pattern 3: Look for cost tables in JavaScript
    # Sometimes the data is in a costs object
    costs_pattern = r'var\s+costs\s*=\s*({[\s\S]*?});'
    match = re.search(costs_pattern, html_content)
    
    if match:
        print("  Found costs object")
        # Process costs data...
    
    return None

def extract_tables_from_html(html_content):
    """Extract data from HTML tables as fallback"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    tables = soup.find_all('table')
    print(f"\n📊 Found {len(tables)} tables in HTML")
    
    for i, table in enumerate(tables):
        rows = table.find_all('tr')
        if len(rows) > 10:  # Likely a building data table
            print(f"\nTable {i+1}: {len(rows)} rows")
            
            # Check first few rows
            for j, row in enumerate(rows[:3]):
                cells = row.find_all(['td', 'th'])
                if cells:
                    cell_texts = [cell.text.strip() for cell in cells]
                    print(f"  Row {j}: {cell_texts[:5]}...")  # First 5 cells
            
            # Try to extract structured data
            if len(rows) >= 20:  # Likely building levels 1-20
                building_data = {"levels": []}
                
                for row in rows[1:]:  # Skip header
                    cells = row.find_all('td')
                    if len(cells) >= 8:
                        try:
                            level_data = {
                                "level": int(cells[0].text.strip()),
                                "wood": int(cells[1].text.replace(',', '').replace('.', '')),
                                "clay": int(cells[2].text.replace(',', '').replace('.', '')),
                                "iron": int(cells[3].text.replace(',', '').replace('.', '')),
                                "crop": int(cells[4].text.replace(',', '').replace('.', '')),
                                "population": int(cells[5].text.replace(',', '').replace('.', '')),
                                "culture_points": int(cells[6].text.replace(',', '').replace('.', '')),
                                "build_time": cells[7].text.strip()
                            }
                            building_data["levels"].append(level_data)
                        except (ValueError, IndexError):
                            continue
                
                if building_data["levels"]:
                    print(f"  ✓ Extracted {len(building_data['levels'])} levels")
                    return building_data
    
    return None

def find_javascript_data(html_content):
    """Look for JavaScript data definitions"""
    print("\n🔍 Searching for JavaScript data...")
    
    # Common patterns in Kirilloid
    patterns = [
        r'var\s+(\w+)\s*=\s*(\[[\s\S]{100,10000}\])',  # Arrays
        r'var\s+(\w+)\s*=\s*({[\s\S]{100,10000}})',    # Objects
        r'window\.(\w+)\s*=\s*(\[[\s\S]{100,10000}\])', # Window properties
        r'data\s*:\s*(\[[\s\S]{100,10000}\])',          # Data properties
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, html_content)
        for match in matches:
            var_name = match.group(1) if match.lastindex > 1 else "data"
            var_value = match.group(match.lastindex)
            
            # Check if it looks like building data
            if any(keyword in var_value.lower() for keyword in ['wood', 'clay', 'iron', 'crop', 'cost']):
                print(f"  Found potential data in variable: {var_name}")
                print(f"  Size: {len(var_value)} chars")
                
                # Save for inspection
                with open(f'found_js_{var_name}.txt', 'w') as f:
                    f.write(var_value[:2000])  # First 2000 chars
                print(f"  Saved preview to found_js_{var_name}.txt")
    
    # Look specifically for Kirilloid's data structure
    if "BUILDINGS" in html_content:
        print("  ✓ Found BUILDINGS variable")
    if "buildings" in html_content:
        print("  ✓ Found buildings variable")
    if "costs" in html_content:
        print("  ✓ Found costs reference")

# Main execution
print("\n📥 Fetching Kirilloid page...")
html = fetch_kirilloid_page()
print(f"✓ Got {len(html)} chars of HTML")

# Save HTML for inspection
with open('kirilloid_raw.html', 'w') as f:
    f.write(html)
print("💾 Saved raw HTML to kirilloid_raw.html")

# Try to extract JavaScript data
print("\n🔧 Attempting to extract building data from JavaScript...")
building_data = extract_building_data_from_js(html)

if building_data:
    print(f"✅ Extracted building data!")
    with open('extracted_buildings.json', 'w') as f:
        json.dump(building_data, f, indent=2)
    print("💾 Saved to extracted_buildings.json")
else:
    print("❌ Couldn't extract from JavaScript")
    
    # Try HTML tables as fallback
    print("\n🔧 Trying to extract from HTML tables...")
    table_data = extract_tables_from_html(html)
    
    if table_data:
        print(f"✅ Extracted from HTML table!")
        with open('extracted_table.json', 'w') as f:
            json.dump(table_data, f, indent=2)
        print("💾 Saved to extracted_table.json")

# Search for JavaScript data
find_javascript_data(html)

print("\n" + "="*60)
print("📋 NEXT STEPS:")
print("  1. Check kirilloid_raw.html to see the structure")
print("  2. Look for JavaScript variables containing building data")
print("  3. Once we find the pattern, we can extract all buildings")
print("="*60)
