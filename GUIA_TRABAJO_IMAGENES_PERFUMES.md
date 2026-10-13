# GUÍA MAESTRA: PROCESAMIENTO E INTEGRACIÓN DE IMÁGENES DE PERFUMES

Esta guía documenta el trabajo realizado, la arquitectura técnica, los métodos que garantizan una tasa de éxito del 100% y las instrucciones paso a paso para continuar el trabajo sin errores.

---

## 1. Estado Actual del Catálogo

- **Total de perfumes en `catalogo/data.js`:** 934.
- **Perfumes con imagen integrada (`image: "img/perfumes/..."`):** **162**.
- **PNG en `catalogo/img/perfumes/`:** 164 (2 huérfanos, ver §7).
- **Punto de reanudación:** la siguiente casa pendiente es **Carolina Herrera** (línea 227 de `catalogo/data.js`), y después **Cerruti / Chanel / Chloé / Coach / Creed...** en orden alfabético.

### Casas completadas en esta sesión (47 perfumes nuevos)

| Casa | Perfumes | Slugs |
| --- | --- | --- |
| Bvlgari | 19 | `bvlgari-omnia-amethyste` … `bvlgari-aqva-divina` |
| Cacharel | 5 | `cacharel-anais-anais`, `cacharel-yes-i-am`, `cacharel-amor-amor-tentation`, `cacharel-scarlet`, `cacharel-amor-amor` |
| Calvin Klein | 23 | `calvin-klein-ck-shock-for-her` … `calvin-klein-eternity-flame` |

### Casas completadas anteriormente (115 perfumes, heredadas)
Abercrombie & Fitch, Acqua di Parma, Adidas, Adolfo Dominguez, Afnan, Agatha Ruiz de la Prada, Ahli, Ajmal, Al Haramain, Al Zaafaran, Alexandre.J, Amouage, Animale, Antonio Banderas, Ariana Grande, Armaf, Avon, Azzaro, Bath & Body Works, Benetton, Bharara, Billie Eilish, Bond No. 9, Borntostandout, Britney Spears, Burberry.

> **Aviso:** 9 de las 115 imágenes heredadas **no cumplen** el estándar (ver §7). El resto de las 162 sí lo cumplen.

---

## 2. Estándar Técnico de las Imágenes

1. **Dimensiones:** exactamente `800 x 800 px`.
2. **Modo:** `RGBA` (PNG de 32 bits).
3. **Fondo transparente real:** `alpha == 0` en las cuatro esquinas y alrededor de la silueta; sin marcas de agua, cuadrículas ni halos.
4. **Centrado:** botella centrada horizontal y verticalmente, margen de seguridad ~8% (lado mayor de la botella ≤ **680 px**).
5. **Autenticidad:** SOLO la botella (packshot frontal oficial). Nunca caja, gift set, muestra de 5 ml, modelo humano, banner con texto, foto de ambiente con fondo no uniforme.
6. **Nomenclatura:** `catalogo/img/perfumes/<casa>-<nombre>.png` en minúsculas, sin acentos, sin repetir la casa dentro del nombre (`bvlgari-man`, no `bvlgari-bvlgari-man`), propiedad `image: "img/perfumes/<nombre>.png"` en `data.js`.

---

## 3. Diagnóstico: por qué fallan los agentes y cómo lograr el 100%

### ❌ Lo que NO funciona
- Búsquedas ciegas tipo `"perfume bottle transparent png"` en Google/DuckDuckGo: Cloudflare, captchas y stock falso.
- Guardar páginas HTML como imagen → `cannot identify image file`.
- Confiar en la ficha del producto de la marca: `media.bulgari.com` mezcla la botella correcta con otras fragancias de la línea y con la caja.
- Recortar por color de fondo cuando **la botella es blanca**: el flood-fill se come el propio frasco (ver §5.4).

### ✅ Fuentes que funcionan (probadas en esta sesión)
1. **Bing Images async (fuente principal, sin bloqueo):**
   `https://www.bing.com/images/async?q=<QUERY>&first=0&count=35&mmasync=1`
   Extraer el atributo `m` de los `div.iusc`: `{"murl": ...}` = URL directa de la imagen original. Filtrar `ebay`, `mercari`, `poshmark`, `aliexpress`, `pinterest/pinimg`, `fragrantica`, redes sociales.
2. **PNGs transparentes de origen (los mejores):** `media.bulgari.com/image/upload/...png`, `cdn.shopify.com` (`_1024x1024`, `_1200x`), Parfumo (`media.parfumo.com`), Fragrantica (`fimgs.net/mdimg/perfume/375x500.<ID>.jpg`).
3. **CDNs de retailers abiertos:** `cdn.notinoimg.com`, `cdn2.jomashop.com`, `cdn.fragrancenet.com`, `img.fragrancex.com`, `i5.walmartimages.com`, `fimgs.net`.
4. **Tiendas Shopify de la marca/multimarca:** `https://<dominio>/products.json?limit=250`.

**Regla de oro:** primero los candidatos con `transparent_ratio > 0.3` (PNG transparente de estudio); solo si no hay, fotos con fondo blanco puro; nunca fotos de ambiente.

---

## 4. Flujo de Trabajo (por lote de casa)

```powershell
# 0. variables
$py = "C:\Users\ASUS\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"

# 1. Preparar el lote completo (batch -> candidatos -> regiones -> fichas de revisión)
& $py scratch\run_batch.py Cacharel
& $py scratch\run_batch.py "Calvin Klein" --offset=0  --limit=12
& $py scratch\run_batch.py "Calvin Klein" --offset=12

# 2. QA visual + procesado (una tarea por lote de 5-6 perfumes, ver §6)
#    Cada tarea mira scratch/preview_regions/<slug>.jpg y escribe scratch/choices/<slug>.json

# 3. Integrar en data.js (añade image solo a las entradas cuyo PNG existe)
& $py scratch\apply_images.py Cacharel "Calvin Klein"

# 4. Validación obligatoria
node -c catalogo\data.js
& $py scratch\verify_batch.py <slug> <slug> ...      # estricto, solo el lote nuevo
& $py scratch\verify_all_images.py                   # global
```

---

## 5. Herramientas (`scratch/`)

### 5.1 Pipeline
| Script | Función |
| --- | --- |
| `run_batch.py <casa> [--offset --limit]` | Encadena `make_batch` → `fetch_candidates` → `montage_regions` → `prepare_review`. |
| `make_batch.py --out=<json> [--offset --limit] <casa...>` | Genera el lote de perfumes **sin** `image` a partir de `data.js`. |
| `fetch_candidates.py <batch.json>` | Bing async → descarga hasta 14 candidatos por perfume en `scratch/cand/<slug>/` + `scratch/cand_manifest.json`. |
| `montage_regions.py <slug...>` | `scratch/preview_regions/<slug>.jpg`: candidatos con las regiones detectadas dibujadas y numeradas. |
| `prepare_review.py <batch.json>` | `scratch/review/<slug>.json`: ficha con candidatos, resolución, `transparent_ratio` y regiones. |
| `process_one.py <slug> <idx> [region] [--crop=x0,y0,x1,y1] [--tol=N]` | Procesa el candidato → `catalogo/img/perfumes/<slug>.png` (800×800 RGBA) y valida. |
| `montage_final.py <slug...>` / `--all` | `scratch/preview_final/<slug>.jpg` sobre fondo ajedrezado. |
| `inspect_final.py <slug> [--zoom=1.5]` | Ampliación de una imagen final para cazar halos/restos. |
| `crop_preview.py <slug> <idx> <x0> <y0> <x1> <y1>` | Amplía una zona del candidato (para leer el grabado del frasco). |
| `apply_images.py <casa...>` / `--all` `[--force]` | Añade `image:` a `data.js` solo si el PNG existe. No toca `house/name/gender/notes`. |
| `verify_batch.py <slug...>` | Validación estricta (800×800, RGBA, esquinas, 300 ≤ lado mayor ≤ 680, sin cuadrícula). |
| `verify_all_images.py` | Validación global de todo lo referenciado en `data.js`. |
| `audit_images.py` | Informe de entradas inválidas + PNG huérfanos. |
| `imgtool.py`, `regions.py`, `http_util.py` | Librerías: fondo transparente + centrado, componentes conexas, HTTP sin dependencias. |

> **Sin `scipy`:** la dilatación binaria usa `PIL.ImageFilter.MaxFilter` y las componentes conexas un union-find por *run-length*. Todo funciona solo con `Pillow` + `numpy`.

### 5.2 Algoritmo de fondo transparente (`imgtool.remove_background`)
1. Si las cuatro esquinas ya son transparentes → no se toca nada.
2. Color de fondo = media de las 4 esquinas; `dist` = distancia euclídea de cada píxel.
3. Flood-fill BFS **conectado desde los 4 bordes** sobre `dist < tolerance` (nunca borra blancos internos de la etiqueta).
4. Suavizado de bordes: en el anillo `tolerance ≤ dist < tolerance*1.4` que toca la zona borrada, `alpha *= (dist-tolerance)/(tolerance*0.4)`.
5. `getbbox()` → escala proporcional a 680 px → centrado en lienzo 800×800 transparente.

Tolerancias usadas: **25-30** por defecto, **60-80** si queda sombra/reflejo de suelo, **12** si la botella es casi blanca y el fondo puro.

### 5.3 Recorte manual `--crop`
Muchas fotos traen la caja **detrás o pegada** a la botella, y entonces la región detectada las fusiona. En esos casos:
```powershell
& $py scratch\process_one.py <slug> <idx> --crop=x0,y0,x1,y1 --tol=25
```
Usa `crop_preview.py` para localizar las coordenadas exactas antes de recortar.

### 5.4 Modo luminancia (`--tol=-240`) y su límite
`process_one.py` acepta tolerancia negativa: entonces solo se considera fondo lo muy claro (`luma >= |tol|`). Sirve para frascos casi blancos con fondo blanco puro… pero **no resuelve** el caso de un frasco blanco sin línea de contorno propia: el flood-fill entra por el borde y vacía el cuerpo. Cuando eso ocurre, la solución es elegir otro candidato con sombra de contorno (habitualmente la foto social de Fragrantica) o aceptar el defecto y documentarlo en `scratch/choices/<slug>.json`.

### 5.5 Registro de decisiones
Cada perfume procesado deja `scratch/choices/<slug>.json`:
```json
{"slug": "...", "idx": 3, "region": null, "crop": "x0,y0,x1,y1", "url": "...",
 "why": "motivo y descartes", "fallback": {"idx": 5, "region": 0}}
```
Este archivo es la trazabilidad: permite rehacer cualquier imagen sin volver a investigar.

---

## 6. QA visual con subagentes (patrón probado)

Para cada lote de 5-6 perfumes se lanza un subagente con:
- la lista de slugs y el nombre exacto de la fragancia,
- los criterios de §2 (solo botella, sin caja, sin marca de agua, fondo uniforme, ≥300 px),
- las herramientas de §5.1 (y la prohibición de crear scripts nuevos o tocar `data.js`),
- la obligación de mirar `scratch/preview_regions/<slug>.jpg` con `read_image`, procesar, y **verificar** `scratch/preview_final/<slug>.jpg` antes de dar el visto bueno,
- la obligación de escribir `scratch/choices/<slug>.json`.

Pistas de identificación por casa (evitan el error más caro, coger otra fragancia de la línea):
- **Bvlgari Man**: EDT 2010 = cristal grueso transparente, banda negra superior con "BVLGARI" en plata, grabado "BVLGARI / MAN". No es *Man in Black*, ni *Wood Essence*, ni *Rain Essence*, ni *Man Extreme*.
- **Calvin Klein**: `CK One` (esmerilado + tapón plateado), `CK Be` (negro mate), `CK All` (blanco mate), `CK Everyone` (cilindro con banda textil), `CK Shock`/`for Her` (frasco blanco con "SHOCK" magenta / negro-verde), `IN2U` (frasco esbelto), `Euphoria` (curvo violeta mujer / rectangular negro hombre).
- **Cacharel**: `Anais Anais` (blanco opaco), `Yes I Am` (negro + capuchón rojo), `Amor Amor` (rojo con rosa), `Amor Amor Tentation` (morado con anilla), `Scarlet` (cilindro floral rosa).

---

## 7. Pendientes y avisos

### Imágenes heredadas que incumplen el estándar (9)
| Casa | Perfume | Problema |
| --- | --- | --- |
| Abercrombie & Fitch | Fierce | 375×500 (no 800×800) |
| Abercrombie & Fitch | Authentic Man | 1000×1000 |
| Abercrombie & Fitch | First Instinct Blue | 720×720 |
| Afnan Perfumes | 9 PM | 1080×1080 |
| Afnan Perfumes | 9 PM Pour Femme | 1080×1080 |
| Afnan Perfumes | 9 AM Pour Femme | 1080×1080 |
| Afnan Perfumes | 9 PM Rebel | 1080×1080 |
| Afnan Perfumes | 9 AM Dive | 1080×1080 |
| Ahli | Pegasus | esquinas opacas + contenido 800×800 |

Se arreglan reprocesando el PNG original con `imgtool.trim_and_center` (o volviendo a descargar candidatos), sin tocar `data.js`.

### PNG huérfanos en disco (sin entrada en `data.js`)
`alexandrej-rose-alba.png`, `ariana-grande-love-notes---pink-woods.png` (800×800 RGBA válidos, solo falta referenciarlos o son restos).

### Casos con limitación conocida (documentados en `scratch/choices/`)
- `calvin-klein-ck-shock-for-her`: frasco blanco sobre blanco; se usa el candidato de Fragrantica recortado, queda un reflejo de suelo tenue.
- `bvlgari-pour-homme`, `bvlgari-man-wood-essence`: recortes oficiales de `media.bulgari.com` con fondo claro del propio anuncio (sin alternativa mejor en Bing).

### Directorios de trabajo
- `scratch/cand/<slug>/` candidatos crudos, `scratch/regions/`, `scratch/review/`, `scratch/choices/` (decisiones), `scratch/preview*/` (montajes), `scratch/log_*.txt` (logs).

---

## 8. Resumen de ubicaciones clave

- **Base de datos:** `catalogo/data.js`
- **Imágenes finales:** `catalogo/img/perfumes/`
- **Decisiones de QA:** `scratch/choices/`
- **Scripts:** `scratch/`
- **Validación:** `scratch/verify_all_images.py`, `scratch/verify_batch.py`, `scratch/audit_images.py`
