import os
import glob
from PIL import Image

SELECTIONS = {
    "chanel-bleu-de-chanel-lexclusif": "scratch_candidates/processed_preview/chanel-bleu-de-chanel-lexclusif_cand3_490x660.png",
    "french-avenue-vulcan-baie": "scratch_candidates/processed_preview/french-avenue-vulcan-baie_cand2_496x660.png",
    "moschino-toy-boy-2": "scratch_candidates/processed_preview/moschino-toy-boy-2_cand3_351x660.png",
    "lattafa-dynasty": "scratch_candidates/processed_preview/lattafa-dynasty_cand3_286x660.png",
    "lattafa-atheeri": "scratch_candidates/processed_preview/lattafa-atheeri_cand1_282x660.png",
    "lattafa-his-confession": "scratch_candidates/processed_preview/lattafa-his-confession_cand0_495x660.png",
    "bharara-viking-kashmir": "scratch_candidates/processed_preview/bharara-viking-kashmir_cand1_638x660.png",
    "armaf-odyssey-eau-de-montagne": "scratch_candidates/processed_preview/armaf-odyssey-eau-de-montagne_cand2_453x660.png",
    "armaf-club-de-nuit-iconic": "scratch_candidates/processed_preview/armaf-club-de-nuit-iconic_cand3_394x660.png",
    "lattafa-khamrah-waha": "scratch_candidates/processed_preview/lattafa-khamrah-waha_cand1_490x660.png",
    "tubbees-berry-explosion": "scratch_candidates/processed_preview/tubbees-berry-explosion_cand1_308x660.png",
    "dkny-be-delicious-latte-matcha": "scratch_candidates/processed_preview/dkny-be-delicious-latte-matcha_cand2_495x660.png",
    "afnan-perfumes-9-pm-elixir": "scratch_candidates/processed_preview/afnan-perfumes-9-pm-elixir_cand1_292x660.png",
    "armaf-beach-party": "scratch_candidates/processed_preview/armaf-beach-party_cand1_600x660.png",
    "armaf-delicacy-cotton-candy": "scratch_candidates/processed_preview/armaf-delicacy-cotton-candy_cand2_607x660.png",
    "armaf-odyssey-lichi-lush": "scratch_candidates/processed_preview/armaf-odyssey-lichi-lush_cand0_386x660.png",
    "armaf-odyssey-pink-pop": "scratch_candidates/processed_preview/armaf-odyssey-pink-pop_cand1_450x660.png",
    "moschino-toy-2-yummy": "scratch_candidates/processed_preview/moschino-toy-2-yummy_cand2_558x660.png",
    "coach-pure-platinum": "scratch_candidates/processed_preview/coach-pure-platinum_cand0_395x660.png"
}

# Let's check each selection
for slug, path in SELECTIONS.items():
    if not os.path.exists(path):
        print(f"MISSING: {slug} -> {path}")
        continue
    img = Image.open(path)
    w, h = img.size
    mode = img.mode
    bbox = img.getbbox()
    bw = bbox[2] - bbox[0]
    bh = bbox[3] - bbox[1]
    
    # Check corners
    corners = [
        img.getpixel((0, 0))[3],
        img.getpixel((w - 1, 0))[3],
        img.getpixel((0, h - 1))[3],
        img.getpixel((w - 1, h - 1))[3]
    ]
    corners_ok = all(c == 0 for c in corners)
    
    # Check centering
    center_x = (bbox[0] + bbox[2]) / 2.0
    center_y = (bbox[1] + bbox[3]) / 2.0
    dx = abs(center_x - w / 2.0)
    dy = abs(center_y - h / 2.0)
    
    print(f"{slug}:")
    print(f"  size: {w}x{h}, mode: {mode}, bbox: {bw}x{bh}, max_dim: {max(bw, bh)}")
    print(f"  corners_ok: {corners_ok}, dx: {dx:.1f}px, dy: {dy:.1f}px")
