import os
from PIL import Image, ImageDraw

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

def make_checker(w, h, cell=20):
    img = Image.new("RGB", (w, h), (240, 240, 240))
    draw = ImageDraw.Draw(img)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if (x // cell + y // cell) % 2 == 1:
                draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(215, 215, 215))
    return img

COLS = 5
ROWS = 4
CELL_SIZE = 400
sheet = make_checker(COLS * CELL_SIZE, ROWS * CELL_SIZE, cell=15)
draw = ImageDraw.Draw(sheet)

for idx, (slug, p) in enumerate(FINAL_MAP.items()):
    r = idx // COLS
    c = idx % COLS
    x = c * CELL_SIZE
    y = r * CELL_SIZE
    
    img = Image.open(p).convert("RGBA")
    thumb = img.resize((CELL_SIZE, CELL_SIZE), Image.Resampling.LANCZOS)
    sheet.paste(thumb, (x, y), thumb)
    
    # draw label
    draw.rectangle([x, y + CELL_SIZE - 24, x + CELL_SIZE, y + CELL_SIZE], fill=(0, 0, 0))
    draw.text((x + 6, y + CELL_SIZE - 20), slug[:32], fill=(255, 255, 255))

out_sheet = "scratch_candidates/contact_sheet_v2.jpg"
sheet.save(out_sheet, "JPEG", quality=90)
print(f"Contact sheet v2 saved to {out_sheet}")
