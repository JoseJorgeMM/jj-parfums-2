# -*- coding: utf-8 -*-
"""Escanea PNGs de perfumes y clasifica: fondo blanco, fondo(s) solido claro u oscuro, o transparente."""
import os, json
import numpy as np
from PIL import Image

DIR = os.path.join("assets", "img", "perfumes")
files = sorted(f for f in os.listdir(DIR) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")))

def border_ring(a, w=4):
    top = a[:w, :, :]; bottom = a[-w:, :, :]
    left = a[:, :w, :]; right = a[:, -w:, :]
    return np.concatenate([top.reshape(-1, 4), bottom.reshape(-1, 4), left.reshape(-1, 4), right.reshape(-1, 4)], axis=0)

white, dark, other, errored = [], [], [], []
for f in files:
    p = os.path.join(DIR, f)
    try:
        im = Image.open(p).convert("RGBA")
        a = np.array(im, dtype=np.int16)
        ring = border_ring(a, 4)
        alpha = ring[:, 3]
        opaque = alpha > 200
        if opaque.mean() < 0.02:
            continue  # ya transparente (sin fondo)
        lum = ring[:, :3].mean(axis=1)
        vis = lum[opaque]
        mean = vis.mean() if len(vis) else 255
        std = vis.std() if len(vis) else 255
        entry = {"file": f, "mean": round(float(mean), 1), "std": round(float(std), 1)}
        if mean >= 235 and std < 30:
            white.append(entry)
        elif mean < 130:
            dark.append(entry)
        else:
            other.append(entry)
    except Exception as e:
        errored.append({"file": f, "err": str(e)[:60]})

print("total:", len(files))
print("FONDO BLANCO:", len(white))
for e in white[:250]:
    print("   white", e["file"], e["mean"], e["std"])
print("FONDO OSCURO:", len(dark), [e["file"] for e in dark[:30]])
print("FONDO OTRO (gris/color):", len(other), [e["file"] for e in other[:60]])
print("errores:", len(errored))
with open("scripts/_scan-bg.json", "w", encoding="utf8") as fp:
    json.dump({"white": white, "dark": dark, "other": other}, fp)
