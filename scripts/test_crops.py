import os
from PIL import Image

def test_crop(img_path, box, out_path):
    im = Image.open(img_path)
    cropped = im.crop(box)
    cropped.save(out_path)
    print(f"Cropped {img_path} {box} -> {out_path} ({cropped.size})")

# 1. French Avenue Vulcan Baie: cand 2 (753x1000)
# The bottle is on the right side of the box. Let's inspect its width
im_vulcan = Image.open("scratch_candidates/french-avenue-vulcan-baie/cand_2_753x1000.jpg")
print("Vulcan cand 2 size:", im_vulcan.size)
# The box is roughly x: 0..450, bottle is roughly x: 420..753
test_crop("scratch_candidates/french-avenue-vulcan-baie/cand_2_753x1000.jpg", (440, 150, 745, 950), "scratch_candidates/vulcan_bottle_crop.jpg")

# 2. Lattafa His Confession: check cand 2 (lattafa.com)
im_his = Image.open("scratch_candidates/lattafa-his-confession/cand_2_2194x2560.jpg")
print("His Confession cand 2 size:", im_his.size)
im_his.save("scratch_candidates/his_cand2_preview.jpg")

# 3. Bharara Viking Kashmir: cand 1 (1080x1080)
im_viking = Image.open("scratch_candidates/bharara-viking-kashmir/cand_1_1080x1080.jpg")
print("Viking Kashmir cand 1 size:", im_viking.size)
# Bottle is on the right
test_crop("scratch_candidates/bharara-viking-kashmir/cand_1_1080x1080.jpg", (450, 200, 1080, 1000), "scratch_candidates/viking_bottle_crop.jpg")

# 4. Armaf Beach Party: check cand 3 and cand 5
im_beach3 = Image.open("scratch_candidates/armaf-beach-party/cand_3_1000x971.jpg")
print("Beach Party cand 3 size:", im_beach3.size)
im_beach3.save("scratch_candidates/beach3_preview.jpg")
im_beach5 = Image.open("scratch_candidates/armaf-beach-party/cand_5_1000x1000.jpg")
print("Beach Party cand 5 size:", im_beach5.size)
im_beach5.save("scratch_candidates/beach5_preview.jpg")

# 5. Armaf Delicacy Cotton Candy: cand 2 (1200x1345)
im_delicacy = Image.open("scratch_candidates/armaf-delicacy-cotton-candy/cand_2_1200x1345.jpg")
print("Delicacy cand 2 size:", im_delicacy.size)
# Bottle is on the right
test_crop("scratch_candidates/armaf-delicacy-cotton-candy/cand_2_1200x1345.jpg", (600, 150, 1200, 1250), "scratch_candidates/delicacy_bottle_crop.jpg")

# 6. Moschino Toy 2 Yummy: check cand 0
im_toy_yummy = Image.open("scratch_candidates/moschino-toy-2-yummy/cand_0_2500x3188.jpg")
print("Toy 2 Yummy cand 0 size:", im_toy_yummy.size)
im_toy_yummy.save("scratch_candidates/toy_yummy_cand0_preview.jpg")
