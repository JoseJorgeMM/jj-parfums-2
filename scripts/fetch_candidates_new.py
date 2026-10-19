import os
import re
import json
import time
import urllib.parse
import urllib.request
import requests
from PIL import Image
import io

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

PERFUMES = [
    {
        "slug": "chanel-bleu-de-chanel-lexclusif",
        "house": "Chanel",
        "name": "Bleu de Chanel L'Exclusif",
        "query": "Bleu de Chanel L'Exclusif bottle perfume"
    },
    {
        "slug": "french-avenue-vulcan-baie",
        "house": "French Avenue",
        "name": "Vulcan Baie",
        "query": "French Avenue Vulcan Baie perfume bottle"
    },
    {
        "slug": "moschino-toy-boy-2",
        "house": "Moschino",
        "name": "Toy Boy 2",
        "query": "Moschino Toy Boy 2 perfume bottle"
    },
    {
        "slug": "lattafa-dynasty",
        "house": "Lattafa",
        "name": "Dynasty",
        "query": "Lattafa Dynasty perfume bottle"
    },
    {
        "slug": "lattafa-atheeri",
        "house": "Lattafa",
        "name": "Atheeri",
        "query": "Lattafa Atheeri perfume bottle"
    },
    {
        "slug": "lattafa-his-confession",
        "house": "Lattafa",
        "name": "His Confession",
        "query": "Lattafa His Confession perfume bottle"
    },
    {
        "slug": "bharara-viking-kashmir",
        "house": "Bharara",
        "name": "Viking Kashmir",
        "query": "Bharara Viking Kashmir perfume bottle"
    },
    {
        "slug": "armaf-odyssey-eau-de-montagne",
        "house": "Armaf",
        "name": "Odyssey Eau de Montagne",
        "query": "Armaf Odyssey Eau de Montagne perfume bottle"
    },
    {
        "slug": "armaf-club-de-nuit-iconic",
        "house": "Armaf",
        "name": "Club de Nuit Iconic",
        "query": "Armaf Club de Nuit Blue Iconic perfume bottle"
    },
    {
        "slug": "lattafa-khamrah-waha",
        "house": "Lattafa",
        "name": "Khamrah Waha",
        "query": "Lattafa Khamrah Waha perfume bottle"
    },
    {
        "slug": "tubbees-berry-explosion",
        "house": "Tubbees",
        "name": "Berry Explosion",
        "query": "Tubbees Berry Explosion perfume bottle"
    },
    {
        "slug": "dkny-be-delicious-latte-matcha",
        "house": "DKNY",
        "name": "Be Delicious Latte Matcha",
        "query": "DKNY Be Delicious Matcha perfume bottle"
    },
    {
        "slug": "afnan-perfumes-9-pm-elixir",
        "house": "Afnan Perfumes",
        "name": "9 PM Elixir",
        "query": "Afnan 9 PM Elixir perfume bottle"
    },
    {
        "slug": "armaf-beach-party",
        "house": "Armaf",
        "name": "Beach Party",
        "query": "Armaf Beach Party perfume bottle"
    },
    {
        "slug": "armaf-delicacy-cotton-candy",
        "house": "Armaf",
        "name": "Delicacy Cotton Candy",
        "query": "Armaf Delicacy Cotton Candy perfume bottle"
    },
    {
        "slug": "armaf-odyssey-lichi-lush",
        "house": "Armaf",
        "name": "Odyssey Lichi Lush",
        "query": "Armaf Odyssey Lichi Lush perfume bottle"
    },
    {
        "slug": "armaf-odyssey-pink-pop",
        "house": "Armaf",
        "name": "Odyssey Pink Pop",
        "query": "Armaf Odyssey Pink Pop perfume bottle"
    },
    {
        "slug": "moschino-toy-2-yummy",
        "house": "Moschino",
        "name": "Toy 2 Yummy",
        "query": "Moschino Toy 2 Yummy perfume bottle"
    },
    {
        "slug": "coach-pure-platinum",
        "house": "Coach",
        "name": "Pure Platinum",
        "query": "Coach For Men Pure Platinum bottle perfume"
    }
]

OUT_DIR = "scratch_candidates"
os.makedirs(OUT_DIR, exist_ok=True)

DISALLOWED = ["ebay.", "mercari.", "poshmark.", "aliexpress.", "pinterest.", "pinimg.com"]

def get_bing_urls(query, count=25):
    encoded = urllib.parse.quote(query)
    url = f"https://www.bing.com/images/async?q={encoded}&first=0&count={count}&mmasync=1"
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}
    req = urllib.request.Request(url, headers=headers)
    try:
        html = urllib.request.urlopen(req, timeout=12).read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  Error fetching Bing search for {query}: {e}")
        return []

    # Bing image URLs are in div.iusc or m="{...}"
    raw_matches = re.findall(r'm="({.*?})"', html)
    urls = []
    for rm in raw_matches:
        try:
            clean = rm.replace("&quot;", '"')
            data = json.loads(clean)
            murl = data.get("murl")
            if murl and not any(d in murl.lower() for d in DISALLOWED):
                urls.append(murl)
        except Exception:
            continue
    return urls

def download_candidates():
    results = {}
    for item in PERFUMES:
        slug = item["slug"]
        print(f"\n--- Searching candidates for: {item['house']} {item['name']} ({slug}) ---")
        pdir = os.path.join(OUT_DIR, slug)
        os.makedirs(pdir, exist_ok=True)
        
        urls = get_bing_urls(item["query"])
        print(f"  Found {len(urls)} URLs from Bing")
        
        saved = 0
        cand_list = []
        for idx, url in enumerate(urls):
            if saved >= 6:
                break
            try:
                resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=8)
                if resp.status_code == 200 and len(resp.content) > 15000:
                    # Verify it's an image
                    img = Image.open(io.BytesIO(resp.content))
                    w, h = img.size
                    if w >= 350 and h >= 350:
                        ext = "png" if img.format == "PNG" else "jpg"
                        out_path = os.path.join(pdir, f"cand_{saved}_{w}x{h}.{ext}")
                        with open(out_path, "wb") as f:
                            f.write(resp.content)
                        saved += 1
                        cand_list.append({
                            "path": out_path,
                            "url": url,
                            "width": w,
                            "height": h,
                            "format": img.format,
                            "mode": img.mode
                        })
                        print(f"  Saved candidate #{saved}: {w}x{h} ({img.format}) from {url[:70]}")
            except Exception as e:
                continue
            time.sleep(0.5)

        results[slug] = cand_list

    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("\nCandidate download completed!")

if __name__ == "__main__":
    download_candidates()
