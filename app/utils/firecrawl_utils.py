import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load Firecrawl API key
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)
firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
print(f"🔑 FIRECRAWL_API_KEY loaded: {bool(firecrawl_api_key)}")

def fallback_scrape(url: str):
    """Scrape using direct requests + BeautifulSoup as fallback."""
    try:
        res = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0"
        })
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        paragraphs = soup.find_all("p")
        return "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
    except Exception as e:
        raise Exception(f"🔥 Fallback scraping failed: {str(e)}")

def scrape_url(url: str):
    """Scrapes content using Firecrawl and BeautifulSoup fallback."""
    if not firecrawl_api_key:
        raise ValueError("FIRECRAWL_API_KEY is missing in .env file")

    endpoint = "https://api.firecrawl.dev/v0/scrape"
    headers = {
        "Authorization": f"Bearer {firecrawl_api_key}",
        "Content-Type": "application/json"
    }
    body = {
        "url": url,
        "render": True  # render JS
    }

    try:
        response = requests.post(endpoint, headers=headers, json=body, timeout=15)
        response.raise_for_status()
        data = response.json()

        extracted_text = data.get("text", "").strip()
        if extracted_text:
            return extracted_text

        # Fallback: Try HTML parsing if Firecrawl text is empty
        html = data.get("html", "")
        if html.strip():
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()
            paragraphs = soup.find_all("p")
            cleaned_text = "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
            if cleaned_text.strip():
                return cleaned_text

    except Exception as e:
        print(f"⚠️ Firecrawl error: {str(e)}")

    # Final fallback
    print("🔁 Falling back to direct scraping...")
    return fallback_scrape(url)