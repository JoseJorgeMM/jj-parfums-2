# -*- coding: utf-8 -*-
"""Detecta webp corruptos; luego los regenera desde el PNG original en git."""
import os, subprocess, sys
from PIL import Image

DIR = os.path.join("assets", "img", "perfumes")
files = sorted(f for f in os.listdir(DIR) if f.lower().endswith(".webp"))
bad = []
for f in files:
    p = os.path.join(DIR, f)
    if os.path.getsize(p) < 200:
        bad.append(f); continue
    try:
        im = Image.open(p); im.load()
    except Exception:
        bad.append(f)
print("corruptos:", len(bad), bad[:20])

# buscar el png original en git (HEAD~1 contiene los png históricos)
for f in bad:
    base = f[:-5] + ".png"
    gitpath = "assets/img/perfumes/" + base
    r = subprocess.run(["git", "cat-file", "-p", gitpath], capture_output=True)
    if r.returncode != 0 or not r.stdout:
        print("SIN PNG EN GIT:", base)
        continue
    tmp = os.path.join(DIR, base)
    with open(tmp, "wb") as fp:
        fp.write(r.stdout)
    im = Image.open(tmp); im.load()
    w, h = im.size
    if max(w, h) > 900:
        ratio = 900 / float(max(w, h))
        im = im.resize((max(1, int(w * ratio)), max(1, int(h * ratio))), Image.LANCZOS)
    im.save(os.path.join(DIR, f), "WEBP", quality=82, method=6)
    os.remove(tmp)
    print("regenerado:", f)
