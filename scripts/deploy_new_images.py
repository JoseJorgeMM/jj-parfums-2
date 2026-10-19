import os
import shutil
from PIL import Image

FINAL_MAP = {
    "chanel-bleu-de-chanel-lexclusif": "scratch_candidates/processed_preview/chanel-bleu-de-chanel-lexclusif_cand3_490x660.png",
    "french-avenue-vulcan-baie": "scratch_candidates/processed_preview/french-avenue-vulcan-baie_cand_final.png",
    "moschino-toy-boy-2": "scratch_candidates/processed_preview/moschino-toy-boy-2_cand3_351x660.png",
    "lattafa-dynasty": "scratch_candidates/processed_preview/lattafa-dynasty_cand3_286x660.png",
    "lattafa-atheeri": "scratch_candidates/processed_preview/lattafa-atheeri_cand1_282x660.png",
    "lattafa-his-confession": "scratch_candidates/processed_preview/lattafa-his-confession_cand_final.png",
    "bharara-viking-kashmir": "scratch_candidates/processed_preview/bharara-viking-kashmir_cand_final.png",
    "armaf-odyssey-eau-de-montagne": "scratch_candidates/processed_preview/armaf-odyssey-eau-de-montagne_cand2_453x660.png",
    "armaf-club-de-nuit-iconic": "scratch_candidates/processed_preview/armaf-club-de-nuit-iconic_cand3_394x660.png",
    "lattafa-khamrah-waha": "scratch_candidates/processed_preview/lattafa-khamrah-waha_cand1_490x660.png",
    "tubbees-berry-explosion": "scratch_candidates/processed_preview/tubbees-berry-explosion_cand1_308x660.png",
    "dkny-be-delicious-latte-matcha": "scratch_candidates/processed_preview/dkny-be-delicious-latte-matcha_cand2_495x660.png",
    "afnan-perfumes-9-pm-elixir": "scratch_candidates/processed_preview/afnan-perfumes-9-pm-elixir_cand1_292x660.png",
    "armaf-beach-party": "scratch_candidates/processed_preview/armaf-beach-party_cand_final.png",
    "armaf-delicacy-cotton-candy": "scratch_candidates/processed_preview/armaf-delicacy-cotton-candy_cand_final.png",
    "armaf-odyssey-lichi-lush": "scratch_candidates/processed_preview/armaf-odyssey-lichi-lush_cand0_386x660.png",
    "armaf-odyssey-pink-pop": "scratch_candidates/processed_preview/armaf-odyssey-pink-pop_cand1_450x660.png",
    "moschino-toy-2-yummy": "scratch_candidates/processed_preview/moschino-toy-2-yummy_cand_final.png",
    "coach-pure-platinum": "scratch_candidates/processed_preview/coach-pure-platinum_cand0_395x660.png"
}

TARGET_DIR = "assets/img/perfumes"
os.makedirs(TARGET_DIR, exist_ok=True)

TARGET_SIZE = 800
MAX_DIM = 660

for slug, src_path in FINAL_MAP.items():
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found!")
        continue
    
    im = Image.open(src_path).convert("RGBA")
    bbox = im.getbbox()
    if not bbox:
        print(f"Error: {slug} has empty bbox!")
        continue
        
    content = im.crop(bbox)
    cw, ch = content.size
    scale = min(MAX_DIM / cw, MAX_DIM / ch)
    nw, nh = int(cw * scale), int(ch * scale)
    resized = content.resize((nw, nh), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    offset = ((TARGET_SIZE - nw) // 2, (TARGET_SIZE - nh) // 2)
    canvas.paste(resized, offset, resized)
    
    dest_path = os.path.join(TARGET_DIR, f"{slug}.png")
    canvas.save(dest_path, "PNG")
    
    # Verify saved image
    saved_im = Image.open(dest_path)
    sw, sh = saved_im.size
    s_mode = saved_im.mode
    s_bbox = saved_im.getbbox()
    s_cw = s_bbox[2] - s_bbox[0]
    s_ch = s_bbox[3] - s_bbox[1]
    corners = [
        saved_im.getpixel((0, 0))[3],
        saved_im.getpixel((sw - 1, 0))[3],
        saved_im.getpixel((0, sh - 1))[3],
        saved_im.getpixel((sw - 1, sh - 1))[3]
    ]
    corners_clean = all(c == 0 for c in corners)
    
    print(f"Deployed {slug}.png: {sw}x{sh} {s_mode}, content={s_cw}x{s_ch}, corners_clean={corners_clean}")

print("\nAll 19 images deployed and verified!")
