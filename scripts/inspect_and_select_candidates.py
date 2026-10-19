import os
import json
from PIL import Image
import numpy as np
import io

try:
    from rembg import remove, new_session
    rembg_session = new_session("u2net")
except Exception as e:
    rembg_session = None
    print("rembg session init warning:", e)

MANIFEST = "scratch_candidates/manifest.json"
PREVIEW_DIR = "scratch_candidates/processed_preview"
os.makedirs(PREVIEW_DIR, exist_ok=True)

with open(MANIFEST, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Loaded manifest with {len(data)} items")

def process_candidate(img_path):
    # Load image
    with open(img_path, "rb") as f:
        img_bytes = f.read()
    
    # Process with rembg
    out_bytes = remove(img_bytes, session=rembg_session)
    img = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
    
    # Check bbox
    bbox = img.getbbox()
    if not bbox:
        return None, 0, 0
    
    # Crop to content
    cropped = img.crop(bbox)
    cw, ch = cropped.size
    
    # Max dimension target: 680 px
    TARGET_SIZE = 800
    MAX_DIM = 660 # giving a comfortable margin (~9%)
    scale = min(MAX_DIM / cw, MAX_DIM / ch)
    nw, nh = int(cw * scale), int(ch * scale)
    
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    
    # Center on 800x800 RGBA
    canvas = Image.new("RGBA", (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    offset = ((TARGET_SIZE - nw) // 2, (TARGET_SIZE - nh) // 2)
    canvas.paste(resized, offset, resized)
    
    # Check 4 corners alpha
    corners = [
        canvas.getpixel((0, 0))[3],
        canvas.getpixel((TARGET_SIZE - 1, 0))[3],
        canvas.getpixel((0, TARGET_SIZE - 1))[3],
        canvas.getpixel((TARGET_SIZE - 1, TARGET_SIZE - 1))[3]
    ]
    corner_clean = all(a == 0 for a in corners)
    
    return canvas, nw, nh, corner_clean

for slug, cand_list in data.items():
    print(f"\nProcessing {slug}: {len(cand_list)} candidates")
    for idx, c in enumerate(cand_list[:4]):
        p = c["path"]
        try:
            res = process_candidate(p)
            if res and res[0]:
                canvas, nw, nh, corner_clean = res
                out_name = f"{slug}_cand{idx}_{nw}x{nh}.png"
                out_p = os.path.join(PREVIEW_DIR, out_name)
                canvas.save(out_p, "PNG")
                print(f"  Cand #{idx}: saved {nw}x{nh}, corner_clean={corner_clean} -> {out_name}")
        except Exception as e:
            print(f"  Cand #{idx} error: {e}")
