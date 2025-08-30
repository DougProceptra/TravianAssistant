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
        """,
        wait_for=5000,  # Wait for JavaScript to render
        timeout=30000
    )
    
    print("✅ Extraction completed!")
    
    # Parse and display results
    if result and hasattr(result, 'data'):
        data = result.data
        if isinstance(data, str):
            data = json.loads(data)
        
        print(f"\nBuilding: {data.get('building_name', 'Unknown')}")
        levels = data.get('levels', [])
        print(f"Levels found: {len(levels)}")
        
        if levels:
            # Show first and last level
            l1 = levels[0]
            print(f"\nLevel 1 costs:")
            print(f"  Wood: {l1.get('wood', 'N/A')}")
            print(f"  Clay: {l1.get('clay', 'N/A')}")
            print(f"  Iron: {l1.get('iron', 'N/A')}")
            print(f"  Crop: {l1.get('crop', 'N/A')}")
            
            if len(levels) >= 20:
                l20 = levels[19]
                print(f"\nLevel 20 costs:")
                print(f"  Wood: {l20.get('wood', 'N/A')}")
                print(f"  Clay: {l20.get('clay', 'N/A')}")
                print(f"  Iron: {l20.get('iron', 'N/A')}")
                print(f"  Crop: {l20.get('crop', 'N/A')}")
        
        # Save to file
        with open('main_building_extract.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("\n💾 Saved to main_building_extract.json")
        
    else:
        print("❌ No data returned")
        if hasattr(result, '__dict__'):
            print(f"Result object: {result.__dict__}")
            
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
        """,
        wait_for=5000,
        timeout=60000  # Longer timeout for multiple pages
    )
    
    print("✅ Multi-extraction completed!")
    
    if result and hasattr(result, 'data'):
        data = result.data
        if isinstance(data, str):
            data = json.loads(data)
        
        if isinstance(data, list):
            print(f"\nExtracted {len(data)} buildings:")
            for building in data:
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

# Test 3: Smart Extraction with Navigation Instructions
print("\n\n📊 TEST 3: Smart Extraction with Navigation")
print("-" * 40)
print("Testing LLM's ability to navigate the page...")

try:
    result = app.extract(
        urls=["http://travian.kirilloid.ru/build.php"],
        prompt="""This is a Travian building calculator page.
        
        The page has a dropdown menu to select different buildings.
        I need you to:
        1. Identify the current building shown
        2. Extract the complete data table with all levels
        3. Note that some buildings have max level 5, others 20 or 25
        
        Focus on extracting:
        - Building name (from dropdown or page)
        - For each level row in the table:
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
        schema=building_schema,
        wait_for=5000,
        timeout=30000
    )
    
    print("✅ Smart extraction completed!")
    
    if result and hasattr(result, 'data'):
        data = result.data
        if isinstance(data, str):
            data = json.loads(data)
        
        print(f"\nExtracted: {data.get('building_name', 'Unknown')}")
        print(f"Levels: {len(data.get('levels', []))}")
        
        with open('smart_extract.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("\n💾 Saved to smart_extract.json")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Extract with allowExternalLinks for discovering all buildings
print("\n\n📊 TEST 4: Wildcard Domain Extraction")
print("-" * 40)
print("Testing extraction across domain...")

try:
    # This might discover multiple building pages if they exist
    result = app.extract(
        urls=["http://travian.kirilloid.ru/build.php"],
        prompt="""Extract ALL building data available on this calculator.
        
        If there are links or ways to access other buildings, follow them.
        For each building found, extract the complete level progression table.
        
        Return an array of all buildings with their full data.
        """,
        schema=multi_building_schema,
        allowExternalLinks=False,  # Stay within domain
        includeSubdomains=False,
        wait_for=5000,
        timeout=60000
    )
    
    print("✅ Domain extraction completed!")
    
    if result and hasattr(result, 'data'):
        data = result.data
        if isinstance(data, str):
            data = json.loads(data)
        
        if isinstance(data, list):
            print(f"\nFound {len(data)} buildings across domain")
        else:
            print("\nSingle building returned")
        
        with open('domain_extract.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("\n💾 Saved to domain_extract.json")
        
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
print("  - smart_extract.json")
print("  - domain_extract.json")
print("\nIf extraction worked, we can scale up to all buildings!")
print("\nNOTE: Extract API is in Beta, so behavior may vary.")
print("Consider using FIRE-1 model for better JavaScript handling.")
