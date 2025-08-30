#!/usr/bin/env python3
"""
Kirilloid Building Data Scraper using Firecrawl
Quick test to see what Firecrawl actually returns
"""

import os
from firecrawl import FirecrawlApp

# Get API key
API_KEY = os.environ.get('TLA_FIRECRAWL_API')
if not API_KEY:
    print("ERROR: TLA_FIRECRAWL_API secret not found")
    exit(1)

print(f"✓ Found API key: {API_KEY[:10]}...")

# Test different URL formats
urls_to_test = [
    "http://travian.kirilloid.ru/build.php#b=21&s=2.46&mb=1",  # Academy
    "http://travian.kirilloid.ru/build.php?b=21&s=2.46&mb=1",  # Try query params
    "http://travian.kirilloid.ru/build.php",  # Base page
]

app = FirecrawlApp(api_key=API_KEY)

for url in urls_to_test:
    print(f"\n{'='*60}")
    print(f"Testing: {url}")
    print(f"{'='*60}")
    
    try:
        result = app.scrape(
            url,
            formats=['markdown'],
            wait_for=3000,
            timeout=15000
        )
        
        # Get markdown content
        markdown = result.markdown if hasattr(result, 'markdown') else str(result)
        
        # Look for building names in the content
        print("\nSearching for building names in content:")
        
        buildings_to_find = [
            ("Academy", "220"),
            ("Workshop", "460"),
            ("Main Building", "70"),
            ("Barracks", "210"),
            ("Smithy", "180")
        ]
        
        for building_name, expected_wood in buildings_to_find:
            if building_name in markdown:
                print(f"  ✓ Found '{building_name}'")
                # Look for the expected cost nearby
                if expected_wood in markdown:
                    print(f"    ✓ With expected wood cost {expected_wood}")
        
        # Show table data if found
        print("\nLooking for table data...")
        lines = markdown.split('\n')
        for i, line in enumerate(lines):
            # Look for lines that might be table data
            if '|' in line and any(char.isdigit() for char in line):
                parts = [p.strip() for p in line.split('|') if p.strip()]
                if len(parts) >= 8 and parts[0].isdigit():
                    level = parts[0]
                    if level == "1":
                        print(f"  Level 1 data found: {parts[:5]}")
                        break
        
        # Check what's in the title/header
        if "Academy" in markdown[:1000]:
            print("\n✓ Page title contains 'Academy'")
        elif "Workshop" in markdown[:1000]:
            print("\n✓ Page title contains 'Workshop'")
        else:
            print("\n⚠ Could not identify building from title")
            
    except Exception as e:
        print(f"Error: {e}")

print("\n" + "="*60)
print("CONCLUSION:")
print("If all URLs return the same building, Kirilloid likely defaults")
print("to a specific building when JavaScript doesn't execute the fragment.")
print("We may need to use Firecrawl's Actions to click/select buildings.")
print("="*60)
