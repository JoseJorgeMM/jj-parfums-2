import os
import json
import time
import random
import re
import unicodedata
import requests
import io
from bs4 import BeautifulSoup
from PIL import Image
from rembg import remove
from pathlib import Path
from urllib.parse import urljoin, quote
import sys

# Fix for Windows console Unicode characters (Emojis)
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# --- CONFIGURATION ---
DATA_FILE = "assets/js/data.js"
MANIFEST_FILE = "img/perfumes_manifest.json"
RAW_DIR = "img/raw_downloads"
FINAL_DIR = "img/perfumes"
TARGET_SIZE = (800, 800)
PADDING_PERCENT = 0.10

# Expanded User-Agents to avoid bot detection
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1"
]

def get_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.google.com/",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }

def slugify(text):
    text = text.lower()
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text).strip('-')
    return text

def load_manifest():
    if not os.path.exists(MANIFEST_FILE):
        return {}
    with open(MANIFEST_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_manifest(manifest):
    with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

def resolve_url(url):
    try:
        if "duckduckgo.com/l/" in url:
            resp = requests.head(url, headers=get_headers(), allow_redirects=True, timeout=10)
            return resp.url
        return url
    except Exception:
        return url

def extract_image_from_page(page_url):
    try:
        resp = requests.get(page_url, headers=get_headers(), timeout=15)
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, 'html.parser')

        img_tags = soup.find_all('img')
        candidates = []
        for img in img_tags:
            src = img.get('src') or img.get('data-src') or img.get('srcset')
            if not src: continue
            if ',' in src:
                src = src.split(',')[0].split(' ')[0]
            url = urljoin(page_url, src)
            low_src = url.lower()
            score = 0
            if 'product' in low_src: score += 2
            if 'bottle' in low_src: score += 2
            if 'large' in low_src or 'big' in low_src: score += 1
            if 'main' in low_src or 'hero' in low_src: score += 1
            candidates.append((score, url))

        if candidates:
            candidates.sort(key=lambda x: x[0], reverse=True)
            return candidates[0][1]
        return None
    except Exception:
        return None

def search_image(house, name):
    queries = [
        f"{house} {name} perfume bottle",
        f"{house} {name} fragrance bottle packshot",
        f"{house} {name} bottle high resolution"
    ]

    for query in queries:
        encoded_query = quote(query)
        target = f"https://html.duckduckgo.com/html/?q={encoded_query}"

        try:
            time.sleep(random.uniform(3, 7))
            resp = requests.get(target, headers=get_headers(), timeout=15)
            if resp.status_code != 200:
                continue

            soup = BeautifulSoup(resp.text, 'html.parser')
            links = soup.find_all('a', href=True)

            page_candidates = []
            for link in links:
                url = urljoin(target, link['href'])
                resolved = resolve_url(url)
                if "duckduckgo.com" not in resolved:
                    page_candidates.append(resolved)

            for page_url in page_candidates[:5]:
                img_url = extract_image_from_page(page_url)
                if img_url:
                    return img_url
                time.sleep(random.uniform(1, 3))

        except Exception:
            continue
    return None

def validate_and_download(url):
    try:
        response = requests.get(url, headers=get_headers(), timeout=15, stream=True)
        if response.status_code != 200:
            return None

        content_type = response.headers.get('Content-Type', '').lower()
        if not content_type.startswith('image/'):
            return None

        content = response.content
        if len(content) < 5120:
            return None

        return content
    except Exception:
        return None

def process_image(image_bytes, final_path):
    try:
        output_data = remove(image_bytes)
        img = Image.open(io.BytesIO(output_data)).convert("RGBA")

        bbox = img.getbbox()
        if not bbox:
            return False
        img = img.crop(bbox)

        available_dim = TARGET_SIZE[0] * (1 - 2 * PADDING_PERCENT)
        img_w, img_h = img.size
        scale = min(available_dim / img_w, available_dim / img_h)

        new_w = int(img_w * scale)
        new_h = int(img_h * scale)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        canvas = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
        offset = ((TARGET_SIZE[0] - new_w) // 2, (TARGET_SIZE[1] - new_h) // 2)
        canvas.paste(img, offset, img)

        canvas.save(final_path, "PNG")
        return True
    except Exception as e:
        print(f"Processing error: {e}")
        return False

def main():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(FINAL_DIR, exist_ok=True)

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    perfume_pattern = re.compile(r'\{\s*house:\s*"([^"]+)",\s*name:\s*"([^"]+)"')
    perfumes_found = perfume_pattern.findall(content)

    if not perfumes_found:
        print("No perfumes found")
        return

    catalogData = [{"house": h, "name": n} for h, n in perfumes_found]
    houses = {}
    for p in catalogData:
        h = p['house']
        if h not in houses: houses[h] = []
        houses[h].append(p)

    manifest = load_manifest()
    sorted_houses = sorted(houses.keys())

    for house_name in sorted_houses:
        house_perfumes = houses[house_name]
        print(f"\n>>> Processing House: {house_name} ({len(house_perfumes)} perfumes)")

        for perfume in house_perfumes:
            slug = slugify(f"{perfume['house']} {perfume['name']}")
            if manifest.get(slug, {}).get('status') == 'completed':
                continue

            print(f" Searching for {slug}...", end=" ", flush=True)
            success = False

            url = search_image(perfume['house'], perfume['name'])
            if url:
                img_bytes = validate_and_download(url)
                if img_bytes:
                    final_path = os.path.join(FINAL_DIR, f"{slug}.png")
                    if process_image(img_bytes, final_path):
                        print(f"SUCCESS")
                        manifest[slug] = {"house": perfume['house'], "name": perfume['name'], "status": "completed", "source_url": url}
                        success = True

            if not success:
                print(f"FAILED")
                manifest[slug] = {"house": perfume['house'], "name": perfume['name'], "status": "failed"}

        save_manifest(manifest)
        print(f"\nFinished House: {house_name}. Moving to next house.")

if __name__ == "__main__":
    main()
