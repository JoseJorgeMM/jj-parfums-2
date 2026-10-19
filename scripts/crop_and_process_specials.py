import os
from PIL import Image
import io
from rembg import remove, new_session

session = new_session("u2net")

def process_and_center(cropped_img, target_size=800, max_dim=660):
    # save cropped to bytes
    buf = io.BytesIO()
    cropped_img.save(buf, format="PNG")
    # rembg
    rembg_bytes = remove(buf.getvalue(), session=session)
    im = Image.open(io.BytesIO(rembg_bytes)).convert("RGBA")
    
    # get bbox
    bbox = im.getbbox()
    if not bbox:
        print("Error: empty bbox after rembg")
        return None
    
    content = im.crop(bbox)
    cw, ch = content.size
    scale = min(max_dim / cw, max_dim / ch)
    nw, nh = int(cw * scale), int(ch * scale)
    resized = content.resize((nw, nh), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    offset = ((target_size - nw) // 2, (target_size - nh) // 2)
    canvas.paste(resized, offset, resized)
    return canvas

# 1. Vulcan Baie: cand_4_4096x4096.png (bottle is on the left half)
im_v = Image.open("scratch_candidates/french-avenue-vulcan-baie/cand_4_4096x4096.png")
# let's crop left half: x from 400 to 1600, y from 800 to 4000
v_crop = im_v.crop((450, 900, 1550, 3950))
v_final = process_and_center(v_crop)
v_final.save("scratch_candidates/processed_preview/french-avenue-vulcan-baie_cand_final.png")
print("Vulcan Baie processed!")

# 2. Lattafa His Confession: cand_2_2194x2560.jpg (bottle is on the right half)
im_h = Image.open("scratch_candidates/lattafa-his-confession/cand_2_2194x2560.jpg")
# bottle is from x: 1400 to 2150, y: 200 to 2500
h_crop = im_h.crop((1400, 200, 2150, 2500))
h_final = process_and_center(h_crop)
h_final.save("scratch_candidates/processed_preview/lattafa-his-confession_cand_final.png")
print("His Confession processed!")

# 3. Bharara Viking Kashmir: cand_4_1280x1280.jpg (bottle is in middle)
im_vk = Image.open("scratch_candidates/bharara-viking-kashmir/cand_4_1280x1280.jpg")
# let's find the bottle bbox in cand 4:
# in 1280x1280, box is on left (0..600), bottle is middle (600..900), travel spray is right (900..1280)
vk_crop = im_vk.crop((600, 750, 890, 1260))
vk_final = process_and_center(vk_crop)
vk_final.save("scratch_candidates/processed_preview/bharara-viking-kashmir_cand_final.png")
print("Viking Kashmir processed!")

# 4. Armaf Beach Party: cand_3_1000x971.jpg (bottle is on right)
im_bp = Image.open("scratch_candidates/armaf-beach-party/cand_3_1000x971.jpg")
# bottle is from x: 570 to 1000, y: 50 to 900
bp_crop = im_bp.crop((570, 50, 1000, 880))
bp_final = process_and_center(bp_crop)
bp_final.save("scratch_candidates/processed_preview/armaf-beach-party_cand_final.png")
print("Beach Party processed!")

# 5. Armaf Delicacy Cotton Candy: cand_2_1200x1345.jpg (bottle is on right)
im_cc = Image.open("scratch_candidates/armaf-delicacy-cotton-candy/cand_2_1200x1345.jpg")
# bottle is from x: 730 to 1200, y: 150 to 1320
cc_crop = im_cc.crop((730, 150, 1200, 1320))
cc_final = process_and_center(cc_crop)
cc_final.save("scratch_candidates/processed_preview/armaf-delicacy-cotton-candy_cand_final.png")
print("Delicacy Cotton Candy processed!")

# 6. Moschino Toy 2 Yummy: cand_0_2500x3188.jpg (bottle is on left)
im_ty = Image.open("scratch_candidates/moschino-toy-2-yummy/cand_0_2500x3188.jpg")
# bear is from x: 0 to 1180, y: 650 to 2750
ty_crop = im_ty.crop((50, 700, 1150, 2750))
ty_final = process_and_center(ty_crop)
ty_final.save("scratch_candidates/processed_preview/moschino-toy-2-yummy_cand_final.png")
print("Moschino Toy 2 Yummy processed!")
