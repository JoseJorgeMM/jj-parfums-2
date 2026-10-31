# -*- coding: utf-8 -*-
"""Genera el mapa SCENE_IMAGES (fotos con fondo opaco) y lo agrega a data.js."""
import os
import numpy as np
from PIL import Image

DIR = os.path.join("assets", "img", "perfumes")
files = sorted(f for f in os.listdir(DIR) if f.lower().endswith(".webp"))

def ring(a, w=3):
    top = a[:w, :, :]; bottom = a[-w:, :, :]
    left = a[:, :w, :]; right = a[:, -w:, :]
    return np.concatenate([top.reshape(-1, 4), bottom.reshape(-1, 4),
                           left.reshape(-1, 4), right.reshape(-1, 4)], axis=0)

scene = []
for f in files:
    a = np.array(Image.open(os.path.join(DIR, f)).convert("RGBA"), dtype=np.int16)
    r = ring(a, 3)
    op = r[:, 3] > 200
    if op.mean() < 0.02:
        continue  # botella recortada (esquinas transparentes)
    scene.append("assets/img/perfumes/" + f)

block = "\n// IMÁGENES FOTOGRÁFICAS DE ESCENA (fondo opaco): se presentan a sangre completa\n"
block += "var SCENE_IMAGES = {\n" + ",\n".join('    "%s": 1' % p for p in scene) + "\n};\n"

d = open("assets/js/data.js", encoding="utf8").read()
# reemplazar un bloque previo si existiera
start = d.find("// IMÁGENES FOTOGRÁFICAS DE ESCENA")
if start != -1:
    d = d[:start].rstrip() + "\n" + block
else:
    d = d.rstrip() + "\n" + block
open("assets/js/data.js", "w", encoding="utf8").write(d)
print("scene images:", len(scene), "de", len(files))
