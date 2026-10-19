import re
import json

DATA_PATH = "assets/js/data.js"

with open(DATA_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Verify syntax before
print(f"Read data.js, length={len(content)} chars")

NEW_ENTRIES = [
    {
        "house": "Afnan Perfumes",
        "name": "9 PM Elixir",
        "gender": "Unisex",
        "notes": "Oriental especiado nocturno y magnético, cardamomo vibrante, nuez moscada, acorde elegante de cuero, lavanda fina y vainilla ambarina.",
        "image": "assets/img/perfumes/afnan-perfumes-9-pm-elixir.png"
    },
    {
        "house": "Armaf",
        "name": "Club de Nuit Iconic",
        "gender": "Hombre",
        "notes": "Cítrico aromático vigorizante y azul, toronja chispeante, menta fresca, jengibre especiado, incienso misterioso y cedro seco.",
        "image": "assets/img/perfumes/armaf-club-de-nuit-iconic.png"
    },
    {
        "house": "Armaf",
        "name": "Odyssey Eau de Montagne",
        "gender": "Unisex",
        "notes": "Oriental gourmand cremoso, almendra dulce, notas lácteas reconfortantes, flores blancas alpinas, vainilla y cacao aterciopelado.",
        "image": "assets/img/perfumes/armaf-odyssey-eau-de-montagne.png"
    },
    {
        "house": "Armaf",
        "name": "Beach Party",
        "gender": "Unisex",
        "notes": "Frutal acuático tropical efervescente, toronja jugosa, guayaba rosada madura, notas marinas frescas, maderas solares y almizcle blanco.",
        "image": "assets/img/perfumes/armaf-beach-party.png"
    },
    {
        "house": "Armaf",
        "name": "Delicacy Cotton Candy",
        "gender": "Unisex",
        "notes": "Dulce gourmand adictivo y esponjoso, frambuesa confitada, cacao delicado, pimienta rosa, rosa dulce, algodón de azúcar y benjuí cálido.",
        "image": "assets/img/perfumes/armaf-delicacy-cotton-candy.png"
    },
    {
        "house": "Armaf",
        "name": "Odyssey Lichi Lush",
        "gender": "Mujer",
        "notes": "Floral frutal exótico y seductor, lichi jugoso dulce, frambuesa madura, mandarina, peonía fresca, flor de azahar y caramelo avainillado.",
        "image": "assets/img/perfumes/armaf-odyssey-lichi-lush.png"
    },
    {
        "house": "Armaf",
        "name": "Odyssey Pink Pop",
        "gender": "Mujer",
        "notes": "Frutal floral alegre y goloso, durazno jugoso, fresas maduras, piña tropical, agua de coco cremosa, magnolia y sándalo dulce.",
        "image": "assets/img/perfumes/armaf-odyssey-pink-pop.png"
    },
    {
        "house": "Bharara",
        "name": "Viking Kashmir",
        "gender": "Unisex",
        "notes": "Amaderado aromático distinguido, cardamomo especiado, papiro terroso, sándalo cremoso de Ceilán, lirio noble y madera de cachemira.",
        "image": "assets/img/perfumes/bharara-viking-kashmir.png"
    },
    {
        "house": "Chanel",
        "name": "Bleu de Chanel L'Exclusif",
        "gender": "Hombre",
        "notes": "Ámbar amaderado intenso y magnético, sándalo puro de Nueva Caledonia, ládano resinoso, toques de cuero oscuro y tabaco sofisticado.",
        "image": "assets/img/perfumes/chanel-bleu-de-chanel-lexclusif.png"
    },
    {
        "house": "Coach",
        "name": "Pure Platinum",
        "gender": "Hombre",
        "notes": "Amaderado aromático moderno e imponente, aceite de lavanda francesa, mandarina, manzana crujiente, licor de ron añejo, ambroxan y cedro.",
        "image": "assets/img/perfumes/coach-pure-platinum.png"
    },
    {
        "house": "DKNY",
        "name": "Be Delicious Latte Matcha",
        "gender": "Mujer",
        "notes": "Floral frutal cremoso, manzana crujiente verde, pimienta rosa, té matcha latte aterciopelado, jazmín fresco y sándalo suave.",
        "image": "assets/img/perfumes/dkny-be-delicious-latte-matcha.png"
    },
    {
        "house": "French Avenue",
        "name": "Vulcan Baie",
        "gender": "Unisex",
        "notes": "Floral frutal vibrante y chispeante, zarzamora jugosa, grosellas negras, frambuesa fresca, toque herbal de albahaca y fondo ambarado.",
        "image": "assets/img/perfumes/french-avenue-vulcan-baie.png"
    },
    {
        "house": "Lattafa",
        "name": "Dynasty",
        "gender": "Unisex",
        "notes": "Amaderado especiado aristocrático y elegante, bergamota fresca, jengibre chispeante, té rooibos exótico, gamuza suave y cashmeran.",
        "image": "assets/img/perfumes/lattafa-dynasty.png"
    },
    {
        "house": "Lattafa",
        "name": "Atheeri",
        "gender": "Mujer",
        "notes": "Floral gourmand etéreo y luminoso, flor de la pasión, rocío fresco matutino, orquídea silvestre, jazmín y fondo cálido de vainilla ambarada.",
        "image": "assets/img/perfumes/lattafa-atheeri.png"
    },
    {
        "house": "Lattafa",
        "name": "His Confession",
        "gender": "Hombre",
        "notes": "Ámbar amaderado seductor y refinado, canela cálida, lavanda aromática, iris empolvado lujoso, benjuí, vainilla y maderas oscuras.",
        "image": "assets/img/perfumes/lattafa-his-confession.png"
    },
    {
        "house": "Lattafa",
        "name": "Khamrah Waha",
        "gender": "Unisex",
        "notes": "Aromático acuático fresco con toque gourmand, yuzu vibrante, enebro fresco, pepino crujiente, brisa marina mineral, vainilla y tonka suave.",
        "image": "assets/img/perfumes/lattafa-khamrah-waha.png"
    },
    {
        "house": "Moschino",
        "name": "Toy Boy 2",
        "gender": "Hombre",
        "notes": "Amaderado especiado cálido y seductor, azafrán aromático, jengibre picante, acorde tostado de café, cedro y mirra resinosa.",
        "image": "assets/img/perfumes/moschino-toy-boy-2.png"
    },
    {
        "house": "Moschino",
        "name": "Toy 2 Yummy",
        "gender": "Mujer",
        "notes": "Floral frutal almizclado radiante, mandarina amarilla chispeante, bergamota fresca, jazmín sambac, toques de pimienta timut y vetiver limpio.",
        "image": "assets/img/perfumes/moschino-toy-2-yummy.png"
    },
    {
        "house": "Tubbees",
        "name": "Berry Explosion",
        "gender": "Unisex",
        "notes": "Frutal gourmand chispeante y jugoso, frambuesa dulce, fresa silvestre, grosellas negras, sirope de arándanos, algodón de azúcar y vainilla.",
        "image": "assets/img/perfumes/tubbees-berry-explosion.png"
    }
]

def format_entry(p):
    return f'{{ house: "{p["house"]}", name: "{p["name"]}", gender: "{p["gender"]}", notes: "{p["notes"]}", image: "{p["image"]}" }}'

# Parse existing entries using regex or js parser
# Each item is { house: ..., name: ..., gender: ..., notes: ..., image: ... }
# Let's insert into the array string:
# Find 'var catalogData = ['
match = re.search(r'var\s+catalogData\s*=\s*\[', content)
if not match:
    raise ValueError("Could not find start of catalogData")

start_pos = match.end()

# End of array is '];' at the end
end_pos = content.rfind("];")
if end_pos == -1:
    raise ValueError("Could not find end of catalogData '];'")

array_body = content[start_pos:end_pos].strip()

# Format each new entry
new_lines = [format_entry(p) for p in NEW_ENTRIES]
new_text = ",\n" + ",\n".join(new_lines)

# Insert before '];'
updated_content = content[:end_pos].rstrip() + new_text + "\n" + content[end_pos:]

with open(DATA_PATH, "w", encoding="utf-8") as f:
    f.write(updated_content)

print(f"Successfully appended {len(NEW_ENTRIES)} entries to data.js")
