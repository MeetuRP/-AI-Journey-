from utils.firecrawl_utils import scrape_url

url = "https://example.com"  # Replace with real test URL

try:
    text = scrape_url(url)
    print("✅ Scraped text:\n", text[:1000])
except Exception as e:
    print("❌ Error:", e)
