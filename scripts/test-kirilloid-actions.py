#!/usr/bin/env python3
"""
Kirilloid Scraper using Firecrawl Actions
This version uses Actions to select buildings from the dropdown
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

# Building IDs we want to scrape
BUILDINGS_TO_TEST = {
    21: "Academy",
    20: "Workshop", 
    14: "Main Building",
    18: "Barracks"
}

print("\n🔍 TESTING WITH FIRECRAWL ACTIONS")
print("="*60)

# First, let's see what the page looks like
print("\n1. Getting initial page to understand structure...")

try:
    # Load the base page first
    base_url = "http://travian.kirilloid.ru/build.php"
    
    result = app.scrape(
        base_url,
        formats=['markdown', 'html'],
        wait_for=3000,
        timeout=15000,
        # Try to set initial parameters and select Academy
        actions=[
            {
                "type": "wait",
                "milliseconds": 2000
            },
            {
                "type": "select",
                "selector": "select#building",  # Assuming there's a building dropdown
                "value": "21"  # Academy ID
            },
            {
                "type": "wait", 
                "milliseconds": 2000
            }
        ]
    )
    
    # Check what we got
    markdown = result.markdown if hasattr(result, 'markdown') else ""
    html = result.html if hasattr(result, 'html') else ""
    
    print(f"   Got {len(markdown)} chars of markdown")
    print(f"   Got {len(html)} chars of HTML")
    
    # Look for select elements in HTML
    if '<select' in html:
        print("\n   ✓ Found select element(s) in page")
        
        # Extract select element info
        import re
        selects = re.findall(r'<select[^>]*id=["\']([^"\']*)["\'][^>]*>', html)
        if selects:
            print(f"   Select IDs found: {selects}")
    
    # Look for Academy in the content
    if "Academy" in markdown:
        print("   ✓ Found 'Academy' in content")
    if "220" in markdown and "160" in markdown:
        print("   ✓ Found Academy costs (220, 160)")
    
    # Show a sample of table data
    print("\n   Looking for table data in markdown...")
    lines = markdown.split('\n')
    for line in lines:
        if '|' in line and any(c.isdigit() for c in line):
            parts = [p.strip() for p in line.split('|') if p.strip()]
            if len(parts) >= 5 and parts[0] == "1":
                print(f"   Level 1 row: {parts[:5]}")
                break
    
except Exception as e:
    print(f"   Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("2. Alternative approach - Try clicking through UI")
print("="*60)

try:
    # Try with different actions - clicking instead of selecting
    result2 = app.scrape(
        "http://travian.kirilloid.ru/build.php#b=21&s=2.46&mb=1",
        formats=['markdown'],
        wait_for=5000,  # Wait longer for JS
        timeout=20000,
        actions=[
            {
                "type": "wait",
                "milliseconds": 3000
            },
            {
                "type": "click",
                "selector": "a[href*='b=21']"  # Try clicking Academy link if exists
            },
            {
                "type": "wait",
                "milliseconds": 2000
            }
        ]
    )
    
    markdown2 = result2.markdown if hasattr(result2, 'markdown') else ""
    
    # Check results
    if "Academy" in markdown2:
        print("   ✓ Successfully navigated to Academy")
    
    # Extract first row of data
    lines = markdown2.split('\n')
    for line in lines:
        if '|' in line and line.strip().startswith('| 1'):
            print(f"   Data found: {line}")
            break
            
except Exception as e:
    print(f"   Error with click approach: {e}")

print("\n" + "="*60)
print("3. Try JavaScript execution approach")
print("="*60)

try:
    # Try executing JavaScript to change the building
    result3 = app.scrape(
        "http://travian.kirilloid.ru/build.php",
        formats=['markdown'],
        wait_for=3000,
        timeout=15000,
        actions=[
            {
                "type": "wait",
                "milliseconds": 2000
            },
            {
                "type": "execute",
                "javascript": "window.location.hash = 'b=21&s=2.46&mb=1';"
            },
            {
                "type": "wait",
                "milliseconds": 3000
            }
        ]
    )
    
    markdown3 = result3.markdown if hasattr(result3, 'markdown') else ""
    
    if "Academy" in markdown3:
        print("   ✓ JavaScript execution worked - found Academy")
    
    # Check for Academy data
    if "220" in markdown3:
        print("   ✓ Found Academy Level 1 wood cost (220)")
        
except Exception as e:
    print(f"   Error with JS execution: {e}")

print("\n" + "="*60)
print("ANALYSIS:")
print("Based on the tests above, we can determine the best approach")
print("for scraping all buildings from Kirilloid.")
print("="*60)
