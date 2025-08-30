#!/usr/bin/env python3
"""
Test different approaches to access Kirilloid
"""

import os
import requests
from firecrawl import FirecrawlApp

print("="*60)
print("🔍 TESTING KIRILLOID ACCESS METHODS")
print("="*60)

# Test 1: Direct requests with different user agents
print("\n📊 TEST 1: Direct Python Requests")
print("-" * 40)

user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "FirecrawlBot",
    "Python/requests"
]

for ua in user_agents:
    try:
        response = requests.get(
            "http://travian.kirilloid.ru/build.php",
            headers={"User-Agent": ua},
            timeout=10
        )
        print(f"User-Agent: {ua[:30]}...")
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print(f"  Content length: {len(response.text)} chars")
            # Check for key content
            if "<table" in response.text:
                print("  ✓ Contains table tags")
            if "Workshop" in response.text:
                print("  ✓ Contains 'Workshop'")
    except Exception as e:
        print(f"  ❌ Error: {e}")

# Test 2: Try HTTPS with Firecrawl
print("\n\n📊 TEST 2: Firecrawl with HTTPS")
print("-" * 40)

API_KEY = os.environ.get('TLA_FIRECRAWL_API')
if API_KEY:
    app = FirecrawlApp(api_key=API_KEY)
    
    try:
        result = app.scrape(
            "https://travian.kirilloid.ru/build.php",  # HTTPS instead of HTTP
            formats=['markdown']
        )
        
        if hasattr(result, 'markdown'):
            markdown = result.markdown
            print(f"✅ HTTPS Scrape worked!")
            print(f"  Content length: {len(markdown)} chars")
            if "404" in markdown:
                print("  ❌ Still getting 404")
            else:
                print("  ✓ No 404 error")
                # Save for inspection
                with open('https_test.txt', 'w') as f:
                    f.write(markdown[:500])
                print("  First 500 chars saved to https_test.txt")
    except Exception as e:
        print(f"❌ HTTPS Error: {e}")

# Test 3: Try web scraping service alternatives
print("\n\n📊 TEST 3: Alternative Approaches")
print("-" * 40)

print("\n🎯 RECOMMENDATIONS:")
print("-" * 40)

print("""
Based on the 404 error from Firecrawl but 200 OK from curl, it appears that:

1. Kirilloid is blocking Firecrawl's bot user agent or IP range
2. The site works fine from Replit when using regular requests

SOLUTIONS TO TRY:

Option A: Use Playwright/Puppeteer locally
- These tools can run a real browser
- Better JavaScript support
- Can handle complex sites like Kirilloid

Option B: Manual extraction
- Use the browser console script (kirilloid-extractor.js)
- Takes 30 minutes but gets 100% accurate data
- One-time effort, then data is stored

Option C: Build a custom scraper
- Use Python requests to get the HTML
- Parse the JavaScript to understand how it loads data
- Reverse-engineer their data format

Option D: Try a different scraping service
- ScrapingBee, Scrapy Cloud, or similar
- These might not be blocked by Kirilloid

The quickest solution is probably Option B - just manually run the browser
console script and collect all the data once. Then store it in your project.
""")

print("\n" + "="*60)