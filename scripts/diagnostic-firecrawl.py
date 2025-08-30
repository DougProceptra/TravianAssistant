#!/usr/bin/env python3
"""
Diagnostic script to see what Firecrawl actually sees on Kirilloid
"""

import os
import json
from firecrawl import FirecrawlApp

# Get API key from Replit secret
API_KEY = os.environ.get('TLA_FIRECRAWL_API')
if not API_KEY:
    print("ERROR: TLA_FIRECRAWL_API secret not found")
    exit(1)

print(f"✓ Found API key: {API_KEY[:10]}...")
app = FirecrawlApp(api_key=API_KEY)

print("\n" + "="*60)
print("🔍 FIRECRAWL DIAGNOSTIC - What Does It Actually See?")
print("="*60)

# Test 1: Use regular scrape to see raw content
print("\n📊 TEST 1: Regular Scrape with Markdown")
print("-" * 40)

try:
    result = app.scrape(
        "http://travian.kirilloid.ru/build.php#b=1&s=2.46&mb=1",
        formats=['markdown', 'html']
    )
    
    print("✅ Scrape completed!")
    
    # Check what we got
    if hasattr(result, 'markdown'):
        markdown = result.markdown
        print(f"\nMarkdown length: {len(markdown)} chars")
        
        # Look for key indicators
        if "table" in markdown.lower():
            print("✓ Found 'table' in markdown")
        if "wood" in markdown.lower():
            print("✓ Found 'wood' in markdown")
        if "clay" in markdown.lower():
            print("✓ Found 'clay' in markdown")
        if "Main Building" in markdown:
            print("✓ Found 'Main Building' in markdown")
        if "Workshop" in markdown:
            print("✓ Found 'Workshop' in markdown (default building)")
            
        # Save first 2000 chars to see structure
        print("\n--- First 2000 chars of markdown ---")
        print(markdown[:2000])
        
        # Save full markdown
        with open('diagnostic_markdown.txt', 'w') as f:
            f.write(markdown)
        print("\n💾 Full markdown saved to diagnostic_markdown.txt")
        
    if hasattr(result, 'html'):
        html = result.html
        print(f"\nHTML length: {len(html)} chars")
        
        # Check for tables in HTML
        import re
        tables = re.findall(r'<table.*?</table>', html, re.DOTALL)
        print(f"Tables found in HTML: {len(tables)}")
        
        # Save HTML
        with open('diagnostic_html.html', 'w') as f:
            f.write(html)
        print("💾 Full HTML saved to diagnostic_html.html")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Try screenshot to see what's visually there
print("\n\n📊 TEST 2: Screenshot Capture")
print("-" * 40)

try:
    result = app.scrape(
        "http://travian.kirilloid.ru/build.php#b=1&s=2.46&mb=1",
        formats=['screenshot']
    )
    
    print("✅ Screenshot completed!")
    
    if hasattr(result, 'screenshot'):
        # Screenshot is base64 encoded
        import base64
        screenshot_data = result.screenshot
        
        # Decode and save
        if screenshot_data:
            # Remove data URL prefix if present
            if ',' in screenshot_data:
                screenshot_data = screenshot_data.split(',')[1]
            
            img_data = base64.b64decode(screenshot_data)
            with open('diagnostic_screenshot.png', 'wb') as f:
                f.write(img_data)
            print("💾 Screenshot saved to diagnostic_screenshot.png")
            print("   Check this image to see what Firecrawl sees visually")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Try Extract with a very simple prompt
print("\n\n📊 TEST 3: Extract with Debug Info")
print("-" * 40)

try:
    result = app.extract(
        urls=["http://travian.kirilloid.ru/build.php#b=1&s=2.46&mb=1"],
        prompt="""Debug: Tell me everything you can see on this page.
        List all text, tables, dropdowns, any data visible.
        If you see nothing, say 'EMPTY PAGE'.
        If you see a table, describe its structure and first few rows.
        """
    )
    
    print("✅ Extract debug completed!")
    
    # Get the full response
    if hasattr(result, 'data'):
        data = result.data
        print("\n--- Extract Debug Response ---")
        if isinstance(data, str):
            print(data[:1000])
        else:
            print(json.dumps(data, indent=2)[:1000])
            
        with open('diagnostic_extract.json', 'w') as f:
            if isinstance(data, str):
                f.write(data)
            else:
                json.dump(data, f, indent=2)
        print("\n💾 Full response saved to diagnostic_extract.json")
        
    # Check for errors or warnings
    if hasattr(result, 'error') and result.error:
        print(f"\n⚠️ Error in response: {result.error}")
    if hasattr(result, 'warning') and result.warning:
        print(f"\n⚠️ Warning in response: {result.warning}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*60)
print("📋 DIAGNOSTIC SUMMARY")
print("="*60)
print("\nCheck these files to understand what Firecrawl sees:")
print("  - diagnostic_markdown.txt - Raw markdown from page")
print("  - diagnostic_html.html - Raw HTML from page")
print("  - diagnostic_screenshot.png - Visual screenshot")
print("  - diagnostic_extract.json - What the LLM sees")
print("\nThis will tell us if:")
print("  1. JavaScript is rendering (tables should be visible)")
print("  2. URL fragments are working (should see Main Building, not Workshop)")
print("  3. Extract LLM can see the content")
