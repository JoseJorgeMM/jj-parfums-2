# -*- coding: utf-8 -*-
"""Convierte los PNG de perfumes a WebP (con alfa si lo tienen), redimensiona a máx 900px."""
import os
from PIL import Image

DIR = os.path.join("assets", "img", "perfumes")
MAX = 900

def convert():
    files = sorted(f for f in os.listdir(DIR) if f.lower().endswith(".png"))
    ok = fail = 0
    for i, f in enumerate(files):
        src = os.path.join(DIR, f)
        dst = os.path.join(DIR, f[:-4] + ".webp")
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            continue
        try:
            im = Image.open(src)
            im.load()
            if im.mode in ("P", "CMYK"):
                im = im.convert("RGBA")
            w, h = im.size
            if max(w, h) > MAX:
                ratio = MAX / float(max(w, h))
                im = im.resize((max(1, int(w * ratio)), max(1, int(h * ratio))), Image.LANCZOS)
            im.save(dst, "WEBP", quality=82, method=6)
            os.remove(src)
            ok += 1
        except Exception as e:
            fail += 1
            print("FALLO", f, str(e)[:70])
        if (i + 1) % 100 == 0:
            print("va", i + 1, "/", len(files))
    print("convertidos:", ok, " fallos:", fail)

if __name__ == "__main__":
    convert()
