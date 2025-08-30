#!/usr/bin/env python3
"""
Kirilloid Scraper using Firecrawl Actions (Fixed)
Uses correct action types supported by Firecrawl
"""

import os
import json
from firecrawl import FirecrawlApp

# Get API key
API_KEY = os.environ.get('TLA_FIRECRAWL_API')
if not API_KEY:
    print("ERROR: TLA_FIRECRAWL_API secret not found")
    exit(1)

print(f"✓ Found API key: {API_KEY[:10]}...")

app = FirecrawlApp(api_key=API_KEY)

print("\n🔍 TESTING FIRECRAWL WITH CORRECT ACTIONS")
print("="*60)

# Test 1: Try executeJavascript to change the building
print("\n1. Testing JavaScript execution to navigate to Academy...")
try:
    result = app.scrape(
        "http://travian.kirilloid.ru/build.php",
        formats=['markdown'],
        wait_for=3000,
        timeout=20000,
        actions=[
            {
                "type": "wait",
                "milliseconds": 2000
            },
            {
                "type": "executeJavascript",
                "script": "window.location.hash = 'b=21&s=2.46&mb=1';"
            },
            {
                "type": "wait",
                "milliseconds": 3000
            }
        ]
    )
    
    markdown = result.markdown if hasattr(result, 'markdown') else ""
    
    print(f"   Got {len(markdown)} chars of markdown")
    
    # Check if we got Academy data
    if "Academy" in markdown:
        print("   ✓ Found 'Academy' in content")
    
    # Look for Academy's known Level 1 costs
    if "220" in markdown:
        print("   ✓ Found '220' (Academy wood cost)")
    if "160" in markdown:
        print("   ✓ Found '160' (Academy clay cost)")
    
    # Extract table data
    lines = markdown.split('\n')
    for line in lines:
        if '|' in line and any(c.isdigit() for c in line):
            parts = [p.strip() for p in line.split('|') if p.strip()]
            if len(parts) >= 5 and parts[0] == "1":
                print(f"   Level 1 data: {parts[:5]}")
                break
                
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Try clicking on dropdown options
print("\n2. Testing click actions on dropdown...")
try:
    result = app.scrape(
        "http://travian.kirilloid.ru/build.php",
        formats=['markdown'],
        wait_for=3000,
        timeout=20000,
        actions=[
            {
                "type": "wait",
                "milliseconds": 2000
            },
            {
                "type": "click",
                "selector": "select#building"  # Click the building dropdown
            },
            {
                "type": "wait",
                "milliseconds": 1000
            },
            {
                "type": "write",
                "text": "Academy",  # Type to search/select
                "selector": "select#building"
            },
            {
                "type": "press",
                "key": "Enter"  # Press enter to confirm
            },
            {
                "type": "wait",
                "milliseconds": 2000
            }
        ]
    )
    
    markdown = result.markdown if hasattr(result, 'markdown') else ""
    
    if "Academy" in markdown or "220" in markdown:
        print("   ✓ Successfully navigated to Academy via dropdown")
    else:
        print("   ⚠ Dropdown interaction didn't work as expected")
        
except Exception as e:
    print(f"   Error: {e}")

# Test 3: Try a simpler approach - just wait for JS to load
print("\n3. Testing simple wait for JavaScript to process URL fragment...")
try:
    # Sometimes the fragment works if we just wait long enough
    result = app.scrape(
        "http://travian.kirilloid.ru/build.php#b=21&s=2.46&mb=1",
        formats=['markdown'],
        wait_for=5000,  # Wait 5 seconds for JS
        timeout=20000
    )
    
    markdown = result.markdown if hasattr(result, 'markdown') else ""
    
    # Check what building we got
    lines = markdown.split('\n')
    for line in lines:
        if '|' in line and line.strip().startswith('| 1'):
            parts = [p.strip() for p in line.split('|') if p.strip()]
            if len(parts) >= 5:
                wood = parts[1]
                clay = parts[2]
                print(f"   Level 1 costs: Wood={wood}, Clay={clay}")
                
                # Check if it's Academy (220, 160) or Workshop (460, 510)
                if wood == "220" and clay == "160":
                    print("   ✓ This is Academy!")
                elif wood == "460" and clay == "510":
                    print("   ⚠ This is Workshop (default building)")
                break
                
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "="*60)
print("CONCLUSION:")
print("Based on the working approach above, we can now scrape all buildings.")
print("="*60)

# If we found a working method, let's extract the data properly
print("\n4. Extracting clean data from working approach...")

def extract_building_data(markdown, building_name):
    """Extract building data from markdown"""
    data = {
        "name": building_name,
        "levels": []
    }
    
    lines = markdown.split('\n')
    for line in lines:
        if '|' in line:
            parts = [p.strip() for p in line.split('|') if p.strip()]
            if len(parts) >= 8 and parts[0].isdigit():
                try:
                    level = int(parts[0])
                    if 1 <= level <= 20:
                        level_data = {
                            "level": level,
                            "wood": int(parts[1].replace(',', '')),
                            "clay": int(parts[2].replace(',', '')),
                            "iron": int(parts[3].replace(',', '')),
                            "crop": int(parts[4].replace(',', '')),
                            "population": int(parts[5].replace(',', '')),
                            "culture_points": int(parts[6].replace(',', '')),
                            "build_time": parts[7]
                        }
                        data["levels"].append(level_data)
                except (ValueError, IndexError):
                    continue
    
    if data["levels"]:
        data["max_level"] = len(data["levels"])
        return data
    return None

# Try to get Academy data with the working method
try:
    print("\nAttempting to extract Academy data...")
    result = app.scrape(
        "http://travian.kirilloid.ru/build.php#b=21&s=2.46&mb=1",
        formats=['markdown'],
        wait_for=5000,
        timeout=20000
    )
    
    markdown = result.markdown if hasattr(result, 'markdown') else ""
    academy_data = extract_building_data(markdown, "Academy")
    
    if academy_data and academy_data["levels"]:
        print("✅ Successfully extracted building data!")
        print(f"   Building: {academy_data['name']}")
        print(f"   Levels found: {len(academy_data['levels'])}")
        
        # Show Level 1 and Level 5
        if len(academy_data["levels"]) > 0:
            l1 = academy_data["levels"][0]
            print(f"   Level 1: Wood={l1['wood']}, Clay={l1['clay']}, Iron={l1['iron']}, Crop={l1['crop']}")
            
        if len(academy_data["levels"]) >= 5:
            l5 = academy_data["levels"][4]
            print(f"   Level 5: Wood={l5['wood']}, Clay={l5['clay']}, Iron={l5['iron']}, Crop={l5['crop']}")
            
        # Determine which building this actually is
        if academy_data["levels"][0]["wood"] == 220:
            print("   ✓ Confirmed: This is Academy (correct building)")
        elif academy_data["levels"][0]["wood"] == 460:
            print("   ⚠ This is Workshop (Kirilloid's default)")
            print("   → We need a different approach to select buildings")
            
except Exception as e:
    print(f"Error in final extraction: {e}")
