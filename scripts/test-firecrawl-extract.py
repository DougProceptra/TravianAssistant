#!/usr/bin/env python3
"""
Firecrawl Extract API Test for Kirilloid Data
Uses LLM-powered extraction to get building data from JavaScript-heavy site
"""

import os
import json
import sys
from firecrawl import FirecrawlApp

# Get API key from Replit secret
API_KEY = os.environ.get('TLA_FIRECRAWL_API')
if not API_KEY:
    print("ERROR: TLA_FIRECRAWL_API secret not found")
    print("Make sure the secret is set in Replit")
    sys.exit(1)

print(f"✓ Found API key: {API_KEY[:10]}...")
app = FirecrawlApp(api_key=API_KEY)

print("\n" + "="*60)
print("🔬 FIRECRAWL EXTRACT TEST - KIRILLOID DATA SCRAPING")
print("="*60)

# Define the schema for building data
building_schema = {
    "type": "object",
    "properties": {
        "building_name": {
            "type": "string",
            "description": "Name of the building"
        },
        "building_id": {
            "type": "integer",
            "description": "Building ID number from the URL"
        },
        "levels": {
            "type": "array",
            "description": "Data for each level of the building",
            "items": {
                "type": "object",
                "properties": {
                    "level": {"type": "integer"},
                    "wood": {"type": "integer"},
                    "clay": {"type": "integer"},
                    "iron": {"type": "integer"},
                    "crop": {"type": "integer"},
                    "population": {"type": "integer"},
                    "culture_points": {"type": "integer"},
                    "build_time": {"type": "string"}
                },
                "required": ["level", "wood", "clay", "iron", "crop"]
            }
        }
    },
    "required": ["building_name", "levels"]
}

# Test 1: Single Building Extraction (Main Building)
print("\n📊 TEST 1: Single Building Extraction")
print("-" * 40)
print("Testing with Main Building (b=1)...")

try:
    result = app.extract(
        urls=["http://travian.kirilloid.ru/build.php#b=1&s=2.46&mb=1"],
        schema=building_schema,
        prompt="""Extract the building data from this Travian calculator page.
        
        The page shows a table with building upgrade costs and requirements.
        Extract:
        1. The building name (shown in dropdown or header)
        2. All level data from the table (usually levels 1-20)
        3. For each level, get: wood, clay, iron, crop costs, population, culture points, and build time
        
        The data is in a table format with columns for each resource.
        Make sure to parse numbers correctly (remove commas/spaces).
        Build time might be in format like "0:33:20" (hours:minutes:seconds).
        """
    )
    
    print("✅ Extraction completed!")
    
    # Parse and display results
    if result:
        # Check different possible result structures
        data = None
        if hasattr(result, 'data'):
            data = result.data
        elif isinstance(result, dict):
            data = result.get('data', result)
        elif isinstance(result, list):
            data = result
            
        if data:
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except:
                    pass
            
            print(f"\nResult type: {type(data)}")
            print(f"Result keys: {data.keys() if isinstance(data, dict) else 'Not a dict'}")
            
            if isinstance(data, dict):
                print(f"\nBuilding: {data.get('building_name', 'Unknown')}")
                levels = data.get('levels', [])
                print(f"Levels found: {len(levels)}")
                
                if levels and len(levels) > 0:
                    # Show first level
                    l1 = levels[0]
                    print(f"\nLevel 1 costs:")
                    print(f"  Wood: {l1.get('wood', 'N/A')}")
                    print(f"  Clay: {l1.get('clay', 'N/A')}")
                    print(f"  Iron: {l1.get('iron', 'N/A')}")
                    print(f"  Crop: {l1.get('crop', 'N/A')}")
            
            # Save to file
            with open('main_building_extract.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("\n💾 Saved to main_building_extract.json")
        else:
            print("❌ No data in result")
            print(f"Full result: {result}")
    else:
        print("❌ No result returned")
            
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Multiple Buildings at Once
print("\n\n📊 TEST 2: Multiple Buildings Extraction")
print("-" * 40)
print("Testing with 3 different buildings...")

# Schema for multiple buildings
multi_building_schema = {
    "type": "array",
    "items": building_schema
}

building_urls = [
    "http://travian.kirilloid.ru/build.php#b=1&s=2.46&mb=1",   # Main Building
    "http://travian.kirilloid.ru/build.php#b=10&s=2.46&mb=1",  # Warehouse
    "http://travian.kirilloid.ru/build.php#b=21&s=2.46&mb=1",  # Academy
]

try:
    result = app.extract(
        urls=building_urls,
        schema=multi_building_schema,
        prompt="""Extract building data from these Travian calculator pages.
        
        Each URL shows a different building with its upgrade costs.
        For each building, extract:
        1. Building name
        2. Building ID from URL parameter 'b='
        3. Complete level data (all levels shown in table)
        
        Return an array with one object per building.
        Parse all numeric values as integers (remove formatting).
        """
    )
    
    print("✅ Multi-extraction completed!")
    
    if result:
        data = None
        if hasattr(result, 'data'):
            data = result.data
        elif isinstance(result, dict):
            data = result.get('data', result)
        elif isinstance(result, list):
            data = result
            
        if data:
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except:
                    pass
            
            if isinstance(data, list):
                print(f"\nExtracted {len(data)} buildings:")
                for building in data:
                    if isinstance(building, dict):
                        name = building.get('building_name', 'Unknown')
                        levels = building.get('levels', [])
                        print(f"  - {name}: {len(levels)} levels")
            
            # Save all data
            with open('multiple_buildings_extract.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("\n💾 Saved to multiple_buildings_extract.json")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Simple extraction without extra parameters
print("\n\n📊 TEST 3: Simple Extraction")
print("-" * 40)
print("Testing basic extraction without wait parameters...")

try:
    result = app.extract(
        urls=["http://travian.kirilloid.ru/build.php"],
        prompt="""This is a Travian building calculator page.
        
        Extract the building data table that shows:
        - Building name (from dropdown or page)
        - For each level (1-20 or max):
          - Level number
          - Wood cost
          - Clay cost
          - Iron cost
          - Crop cost
          - Population (upkeep)
          - Culture Points (CP)
          - Build time
        
        Return structured data with all levels found.
        """,
        schema=building_schema
    )
    
    print("✅ Simple extraction completed!")
    
    if result:
        data = None
        if hasattr(result, 'data'):
            data = result.data
        elif isinstance(result, dict):
            data = result.get('data', result)
            
        if data:
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except:
                    pass
            
            print(f"\nExtracted: {data.get('building_name', 'Unknown') if isinstance(data, dict) else 'Check JSON'}")
            
            with open('simple_extract.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("\n💾 Saved to simple_extract.json")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Minimal test - just get something
print("\n\n📊 TEST 4: Minimal Extraction Test")
print("-" * 40)
print("Testing minimal extraction to see what we get...")

try:
    result = app.extract(
        urls=["http://travian.kirilloid.ru/build.php#b=1"],
        prompt="Extract all the building cost data from the table on this page"
    )
    
    print("✅ Minimal extraction completed!")
    
    # Print the raw result to understand structure
    print(f"\nRaw result type: {type(result)}")
    if hasattr(result, '__dict__'):
        print(f"Result attributes: {result.__dict__.keys()}")
    
    # Try to get data however it's structured
    data = result
    if hasattr(result, 'data'):
        data = result.data
    elif isinstance(result, dict) and 'data' in result:
        data = result['data']
    
    with open('minimal_extract.json', 'w') as f:
        if isinstance(data, str):
            f.write(data)
        else:
            json.dump(data, f, indent=2)
    print("\n💾 Saved to minimal_extract.json")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("📋 SUMMARY")
print("="*60)
print("\nCheck the generated JSON files to see what was extracted:")
print("  - main_building_extract.json")
print("  - multiple_buildings_extract.json")
print("  - simple_extract.json")
print("  - minimal_extract.json")
print("\nIf extraction worked, we can scale up to all buildings!")
print("\nNOTE: Extract API parameters may differ from documentation.")
print("The extract() function appears to only accept: urls, schema, prompt")
