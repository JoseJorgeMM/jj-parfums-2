# -*- coding: utf-8 -*-
"""
Extrae la botella de imágenes con fondo uniforme (blanco/gris/color) usando
flood-fill desde los bordes. Las imágenes con resultado dudoso NO se tocan.
Solo procesa fondos CLAROS (blanco/gris): los oscuros se funden con el tema.
"""
import os, json, shutil, sys
import numpy as np
from PIL import Image
from scipy import ndimage

DIR = os.path.join("assets", "img", "perfumes")
BACKUP = os.path.join("scripts", "_backup-bg")  # copia solo si no está en git
MODIFIED = []

def border_ring_visible(a, w=4):
    top = a[:w, :, :]; bottom = a[-w:, :, :]
    left = a[:, :w, :]; right = a[:, -w:, :]
    return np.concatenate([top.reshape(-1, 4), bottom.reshape(-1, 4),
                           left.reshape(-1, 4), right.reshape(-1, 4)], axis=0)

def process(path):
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    h, w = a.shape[:2]

    ring = border_ring_visible(a.astype(np.int16), 4)
    opaque = ring[:, 3] > 200
    if opaque.mean() < 0.02:
        return None  # ya sin fondo

    vis = ring[opaque]
    # color referencia del fondo: mediana
    ref = np.median(vis[:, :3], axis=0)
    if ref.mean() < 200:  # solo fondos claros/blancos
        return None

    # distancia al color del fondo
    dist = np.abs(a[:, :, :3].astype(np.int16) - ref.reshape(1, 1, 3)).max(axis=2)
    bg_mask = (dist <= 26)
    # iluminación suave cerca de bordes de escena (gradienete leve): ampliar tolerancia
    bg_mask |= (dist <= 40) & (a[:, :, :3].min(axis=2) >= 215)

    seed = np.zeros_like(bg_mask)
    seed[0, :] = True; seed[-1, :] = True; seed[:, 0] = True; seed[:, -1] = True
    seed &= bg_mask
    if seed.sum() == 0:
        return None

    # conectividad: propaga el fondo desde los bordes
    struct = ndimage.generate_binary_structure(2, 2)
    bg_region = ndimage.binary_propagation(seed, structure=struct, mask=bg_mask)

    frac_removed = bg_region.mean()
    if frac_removed < 0.15 or frac_removed > 0.90:
        return None  # resultado dudoso: no tocar

    out = a.copy()
    out[:, :, 3][bg_region] = 0
    #omma defringe suave: píxeles claros en el borde del recorte quedan semitransparentes
    edge = bg_region ^ ndimage.binary_erosion(bg_region, structure=struct)
    near_white = (dist <= 90) & (a[:, :, :3].mean(axis=2) >= 225)
    soft = edge & near_white & (out[:, :, 3] == 255)
    out[:, :, 3][soft] = 140

    opaque_new = (out[:, :, 3] > 200).mean()
    if opaque_new < 0.05:
        return None  # se comió casi todo: abortar

    res = Image.fromarray(out)
    if path.lower().endswith(".jpg") or path.lower().endswith(".jpeg"):
        tgt = path.rsplit(".", 1)[0] + ".png"
        res.save(tgt, optimize=True)
        os.remove(path)
    else:
        res.save(path, optimize=True)
    return {"file": os.path.basename(path), "removed": round(float(frac_removed), 2)}

def main():
    scan = os.path.join("scripts", "_scan-bg.json")
    payload = json.load(open(scan, encoding="utf8"))
    targets = [e["file"] for e in payload["white"]] + [e["file"] for e in payload["other"]]
    print("candidatas:", len(targets))
    done, skipped = [], 0
    for i, f in enumerate(targets):
        if f.lower().endswith((".jpg", ".jpeg")):
            continue  # jpg no soporta alfa y no están referenciados
        p = os.path.join(DIR, f)
        if not os.path.exists(p):
            skipped += 1
            continue
        r = process(p)
        if r:
            done.append(r)
            MODIFIED.append(f)
            if len(done) % 60 == 0:
                print("procesadas:", len(done), "/", i + 1)
        else:
            skipped += 1
    print("RESULTADO: exitos=", len(done), " sin-cambio=", skipped)
    out_path = os.path.join("scripts", "_touched.json")
    json.dump(MODIFIED, open(out_path, "w"))
    for r in done[:20]:
        print("  ok", r["file"], r["removed"])

if __name__ == "__main__":
    main()
