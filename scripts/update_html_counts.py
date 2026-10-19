import re

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    initial = content
    for old, new in replacements:
        content = content.replace(old, new)
        
    if content != initial:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")
    else:
        print(f"No changes in {path}")

# Update index.html
update_file("index.html", [
    ("Colecciones (934)", "Colecciones (953)"),
    ("Ver Catálogo (934)", "Ver Catálogo (953)"),
    ("Explorar Catálogo Completo (934 Fragancias)", "Explorar Catálogo Completo (953 Fragancias)"),
    ("Catálogo de <strong>934 fragancias</strong> &bull; <strong>164 casas perfumistas</strong>", "Catálogo de <strong>953 fragancias</strong> &bull; <strong>166 casas perfumistas</strong>"),
    ("Explorar 934 Perfumes en el Catálogo ➔", "Explorar 953 Perfumes en el Catálogo ➔"),
    ("(934 FRAGANCIAS Y 164 CASAS)", "(953 FRAGANCIAS Y 166 CASAS)"),
    ("Más de 934 Fragancias en Nuestro Catálogo", "Más de 953 Fragancias en Nuestro Catálogo"),
    ("Explorar los 934 Perfumes en el Catálogo Interactivo ➔", "Explorar los 953 Perfumes en el Catálogo Interactivo ➔"),
    ("Explora más de 934 fragancias", "Explora más de 953 fragancias"),
    ("Explorar Catálogo Completo (934) ➔", "Explorar Catálogo Completo (953) ➔"),
    ("Catálogo Completo (934)", "Catálogo Completo (953)")
])

# Update catalogo.html
update_file("catalogo.html", [
    ("934 Fragancias", "953 Fragancias"),
    ('<span class="stat-number" id="totalFragrancesCount">934</span>', '<span class="stat-number" id="totalFragrancesCount">953</span>'),
    ('<span class="gender-count" id="countAll">934</span>', '<span class="gender-count" id="countAll">953</span>')
])
