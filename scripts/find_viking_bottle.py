import urllib.parse
import urllib.request
import re
import json
import requests
from PIL import Image
import io

query = 'site:fragrantica.com "Viking Kashmir" OR "Bharara Viking Kashmir" bottle'
url = f"https://www.bing.com/images/async?q={urllib.parse.quote(query)}&first=0&count=35&mmasync=1"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
raw_matches = re.findall(r'm="({.*?})"', html)
print(f"Found {len(raw_matches)} matches")

for i, rm in enumerate(raw_matches):
    try:
        clean = rm.replace('&quot;', '"')
        data = json.loads(clean)
        murl = data.get("murl")
        if not murl: continue
        print(f"[{i}] {murl}")
        resp = requests.get(murl, timeout=5)
        if resp.status_code == 200:
            im = Image.open(io.BytesIO(resp.content))
            print(f"    Size: {im.size}, mode: {im.mode}")
            im.save(f"scratch_candidates/viking_search_{i}.png")
    except Exception as e:
        continue
