/**
 * J.J PARFUMS - Catálogo Exclusivo de Perfumería Fina en Roll-On
 * Motor de UI, Directorio de Casas (164 marcas), Filtros, Favoritos, WhatsApp y Rendimiento Móvil
 */

// --- ESTADO GLOBAL ---
var state = {
    favorites: JSON.parse(localStorage.getItem("jj_favorites") || "[]"),
    favoritesOnly: false,
    activeHouse: "all",
    activeGenders: ["all"],
    activeMood: "all",
    activeNote: "all",
    activeLetter: "all",
    searchTerm: "",
    viewMode: localStorage.getItem("jj_view_mode") || "grid",
    filteredList: [],
    renderedCount: 0,
    pageSize: 28,
    currentModalPerfume: null
};

// --- MAPAS DE FILTRO ---
var MOOD_MAP = {
    seductive: ["ámbar", "ambar", "vainilla", "canela", "dulce", "cuero", "café", "cafe", "haba tonka", "praliné", "praline", "incienso", "almizcle", "tabaco", "chocolate", "seductor", "seducción", "seduccion", "ron", "caramelo"],
    fresh: ["cítrico", "citrico", "limón", "limon", "bergamota", "mandarina", "naranja", "acuático", "acuatico", "marino", "menta", "fresco", "verde", "manzana", "ozónico", "ozonico", "pomelo", "toronja"],
    elegant: ["amaderado", "cedro", "sándalo", "sandalo", "vetiver", "iris", "pachulí", "pachuli", "oud", "especiado", "cardamomo", "lavanda", "chipre", "cuero", "musgo"],
    romantic: ["floral", "rosa", "jazmín", "jazmin", "peonía", "peonia", "orquídea", "orquidea", "violeta", "frutal", "durazno", "fresa", "frambuesa", "cereza", "vainilla", "lirio", "magnolia"]
};

// --- UTILIDADES ---
function getPerfumeId(p) {
    if (!p) return "";
    return ((p.house || "") + "___" + (p.name || "")).toLowerCase().trim();
}

// Corazón de favoritos como icono SVG (marca coherente; rojo al activar)
function getFavHeartIcon(active) {
    return '<svg class="lade fav-heart' + (active ? " active" : "") + '" aria-hidden="true"><use href="#lc-heart"/></svg>';
}

function getWhatsAppUrl(p) {
    var phone = "573126654386";
    var text = "Hola J.J Parfums, me interesa pedir el extracto en roll-on concentrado de *" + p.name + "* (" + p.house + ") de máxima fijación. ¿Me confirmas precio y disponibilidad?";
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(text);
}

function getFavoritesWhatsAppUrl() {
    var phone = "573126654386";
    var favPerfumes = catalogData.filter(function(p) {
        return state.favorites.indexOf(getPerfumeId(p)) !== -1;
    });
    if (favPerfumes.length === 0) return "";
    var lines = favPerfumes.map(function(p, i) {
        return (i + 1) + ". *" + p.name + "* (" + p.house + " - " + p.gender + ")";
    }).join("\n");
    var text = "Hola J.J Parfums, he guardado estos extractos en roll-on en mi lista de favoritos y me gustaría consultar disponibilidad y precio:\n\n" + lines + "\n\n¿Me brindas más información?";
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(text);
}

function getRollonPlaceholderSVG() {
    return '<svg viewBox="0 0 100 160" class="bottle-svg-placeholder" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
            '<linearGradient id="goldCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
                '<stop offset="0%" stop-color="#faecc8"/>' +
                '<stop offset="50%" stop-color="#c8a45d"/>' +
                '<stop offset="100%" stop-color="#7d5d24"/>' +
            '</linearGradient>' +
            '<linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
                '<stop offset="0%" stop-color="#141720"/>' +
                '<stop offset="50%" stop-color="#242b38"/>' +
                '<stop offset="100%" stop-color="#10131a"/>' +
            '</linearGradient>' +
        '</defs>' +
        '<rect x="36" y="10" width="28" height="34" rx="3" fill="url(#goldCapGrad)" stroke="#c8a45d" stroke-width="1.2"/>' +
        '<line x1="36" y1="21" x2="64" y2="21" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>' +
        '<rect x="30" y="44" width="40" height="98" rx="6" fill="url(#glassGrad)" stroke="rgba(200,164,93,0.4)" stroke-width="1.2"/>' +
        '<rect x="33" y="66" width="34" height="56" rx="2" fill="#101217" stroke="rgba(200,164,93,0.5)" stroke-width="0.8"/>' +
        '<text x="50" y="85" text-anchor="middle" font-family="\'Cinzel\', Georgia, serif" font-size="9" font-weight="700" fill="#eddab1">JJ</text>' +
        '<text x="50" y="96" text-anchor="middle" font-family="\'Montserrat\', sans-serif" font-size="3.8" letter-spacing="0.8" fill="#c8a45d">PARFUMS</text>' +
        '<line x1="37" y1="102" x2="63" y2="102" stroke="#c8a45d" stroke-width="0.6"/>' +
        '<text x="50" y="112" text-anchor="middle" font-family="\'Montserrat\', sans-serif" font-size="3.5" fill="#8f94a0">ROLL-ON</text>' +
    '</svg>';
}

// --- ACTUALIZACIÓN DE CONTADORES DE FAVORITOS ---
function updateFavoritesBadge() {
    var countFavs = document.getElementById("countFavs");
    if (countFavs) {
        countFavs.textContent = state.favorites.length;
    }
}

// --- LÓGICA DE FAVORITOS (ALTO RENDIMIENTO) ---
function toggleFavorite(perfumeId, triggerBtn) {
    if (!perfumeId) return;
    var index = state.favorites.indexOf(perfumeId);
    var isFav = false;

    if (index === -1) {
        state.favorites.push(perfumeId);
        isFav = true;
    } else {
        state.favorites.splice(index, 1);
        isFav = false;
    }

    localStorage.setItem("jj_favorites", JSON.stringify(state.favorites));
    updateFavoritesBadge();

    // Actualizar botón en el modal de perfume si está abierto
    var modalFavBtn = document.getElementById("modalFavBtn");
    if (modalFavBtn && state.currentModalPerfume && getPerfumeId(state.currentModalPerfume) === perfumeId) {
        modalFavBtn.innerHTML = getFavHeartIcon(isFav);
        modalFavBtn.classList.toggle("active", isFav);
    }

    // Actualizar botones de tarjetas activas en pantalla
    var cardFavBtns = document.querySelectorAll('.favorite-btn[data-id="' + perfumeId + '"]');
    cardFavBtns.forEach(function(btn) {
        btn.innerHTML = getFavHeartIcon(isFav);
        btn.classList.toggle("active", isFav);
        btn.classList.add("pulse");
        setTimeout(function() { btn.classList.remove("pulse"); }, 300);
    });

    // Si está viendo exclusivamente favoritos, actualizar la vista
    if (state.favoritesOnly) {
        filterAndRender(true);
    }
}

// --- MODAL / BOTTOM SHEET DE FICHA TÉCNICA ---
function openPerfumeModal(perfume) {
    if (!perfume) return;
    state.currentModalPerfume = perfume;

    var modal = document.getElementById("perfumeModal");
    var img = document.getElementById("modalBottleImg");
    var placeholder = document.getElementById("modalBottlePlaceholder");
    var name = document.getElementById("modalPerfumeName");
    var house = document.getElementById("modalHouse");
    var gender = document.getElementById("modalGender");
    var notes = document.getElementById("modalNotes");
    var tagsContainer = document.getElementById("modalTagsContainer");
    var waBtn = document.getElementById("modalWhatsAppBtn");
    var modalFavBtn = document.getElementById("modalFavBtn");

    if (!modal) return;

    name.textContent = perfume.name;
    house.textContent = perfume.house;
    gender.textContent = perfume.gender;
    gender.className = "gender-badge badge-" + perfume.gender;
    notes.textContent = perfume.notes || "Extracto puro de perfumería fina de máxima fijación.";

    // Configurar imagen o placeholder
    if (perfume.image) {
        img.src = perfume.image;
        img.style.display = "block";
        if (placeholder) placeholder.style.display = "none";
        img.onerror = function() {
            img.style.display = "none";
            if (placeholder) {
                placeholder.innerHTML = getRollonPlaceholderSVG();
                placeholder.style.display = "flex";
            }
        };
    } else {
        img.style.display = "none";
        if (placeholder) {
            placeholder.innerHTML = getRollonPlaceholderSVG();
            placeholder.style.display = "flex";
        }
    }

    // Generar tags olfativos desde las notas
    if (tagsContainer) {
        tagsContainer.innerHTML = "";
        var noteKeywords = ["amaderado", "cítrico", "floral", "gourmand", "ámbar", "acuático", "especiado", "cuero", "vainilla", "oud", "lavanda", "fresco", "frutal"];
        var lowerNotes = (perfume.notes || "").toLowerCase();
        var foundTags = [];

        noteKeywords.forEach(function(k) {
            if (lowerNotes.indexOf(k) !== -1) {
                foundTags.push(k.charAt(0).toUpperCase() + k.slice(1));
            }
        });

        if (foundTags.length === 0) {
            foundTags = ["Extracto Concentrado", "Larga Duración"];
        }

        foundTags.slice(0, 4).forEach(function(t) {
            var tagEl = document.createElement("span");
            tagEl.className = "modal-tag";
            tagEl.textContent = t;
            tagsContainer.appendChild(tagEl);
        });
    }

    // Link directo a WhatsApp
    if (waBtn) {
        waBtn.href = getWhatsAppUrl(perfume);
    }

    // Estado del botón de favorito en el modal
    if (modalFavBtn) {
        var id = getPerfumeId(perfume);
        var isFav = (state.favorites.indexOf(id) !== -1);
        modalFavBtn.innerHTML = getFavHeartIcon(isFav);
        modalFavBtn.classList.toggle("active", isFav);
        modalFavBtn.onclick = function() {
            toggleFavorite(id);
        };
    }

    var modalAddOrderBtn = document.getElementById("modalAddOrderBtn");
    if (modalAddOrderBtn) {
        modalAddOrderBtn.onclick = function() {
            addToOrder(id);
        };
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closePerfumeModal() {
    var modal = document.getElementById("perfumeModal");
    if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }
}

// --- CREACIÓN DE TARJETA DE PERFUME ---
function createPerfumeCard(p) {
    var id = getPerfumeId(p);
    var isFav = (state.favorites.indexOf(id) !== -1);
    var card = document.createElement("article");
    card.className = "perfume-card";

    var waUrl = getWhatsAppUrl(p);

    var imgHtml = p.image
        ? '<img src="' + p.image + '" alt="' + p.name + '" class="card-bottle-img" loading="lazy" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' +
          '<div class="card-bottle-placeholder" style="display:none;">' + getRollonPlaceholderSVG() + '</div>'
        : '<div class="card-bottle-placeholder">' + getRollonPlaceholderSVG() + '</div>';

    card.innerHTML =
        '<div class="card-top">' +
            '<span class="card-house-micro">' + p.house + '</span>' +
            '<button type="button" class="favorite-btn ' + (isFav ? 'active' : '') + '" data-id="' + id + '" title="' + (isFav ? 'Quitar de favoritos' : 'Añadir a favoritos') + '" aria-label="Favorito">' +
                getFavHeartIcon(isFav) +
            '</button>' +
        '</div>' +
        '<div class="card-image-box">' +
            imgHtml +
        '</div>' +
        '<div class="card-info">' +
            '<div class="card-header-left">' +
                '<h3 class="perfume-name">' + p.name + '</h3>' +
                '<span class="gender-badge badge-' + p.gender + '">' + p.gender + '</span>' +
            '</div>' +
            '<p class="card-notes">' + (p.notes || 'Extracto puro concentrado en roll-on.') + '</p>' +
        '</div>' +
        '<div class="card-footer">' +
            '<button type="button" class="card-view-notes-btn">Ver Ficha</button>' +
            '<button type="button" class="card-add-order-btn ' + (inOrder(id) ? 'added' : '') + '" data-id="' + id + '" title="Añadir al pedido" aria-label="Añadir ' + p.name + ' al pedido">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
                    (inOrder(id) ? '<polyline points="20 6 9 17 4 12"></polyline>' : '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>') +
                '</svg>' +
            '</button>' +
            '<a href="' + waUrl + '" class="card-whatsapp-quick" target="_blank" rel="noopener noreferrer" title="Pedir por WhatsApp">' +
                '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">' +
                    '<path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>' +
                '</svg>' +
                '<span>Pedir</span>' +
            '</a>' +
        '</div>';

    // Abrir modal al tocar la tarjeta o botón "Ver Ficha"
    card.onclick = function(e) {
        if (e.target.closest(".favorite-btn") || e.target.closest(".card-whatsapp-quick") || e.target.closest(".card-add-order-btn")) {
            return;
        }
        openPerfumeModal(p);
    };

    var favBtn = card.querySelector(".favorite-btn");
    if (favBtn) {
        favBtn.onclick = function(e) {
            e.stopPropagation();
            toggleFavorite(id, this);
        };
    }

    var waBtn = card.querySelector(".card-whatsapp-quick");
    if (waBtn) {
        waBtn.onclick = function(e) {
            e.stopPropagation();
        };
    }

    var addOrderBtn = card.querySelector(".card-add-order-btn");
    if (addOrderBtn) {
        addOrderBtn.onclick = function(e) {
            e.stopPropagation();
            addToOrder(id);
        };
    }

    return card;
}

// --- FILTRADO DE DATOS ---
function filterData() {
    var term = state.searchTerm.toLowerCase().trim();

    return catalogData.filter(function(p) {
        // Búsqueda en nombre, casa y notas
        var matchesSearch = !term ||
            (p.name && p.name.toLowerCase().indexOf(term) !== -1) ||
            (p.house && p.house.toLowerCase().indexOf(term) !== -1) ||
            (p.notes && p.notes.toLowerCase().indexOf(term) !== -1);

        if (!matchesSearch) return false;

        // Casa
        if (state.activeHouse !== "all" && p.house !== state.activeHouse) {
            return false;
        }

        // Género
        if (state.activeGenders.indexOf("all") === -1 && state.activeGenders.indexOf(p.gender) === -1) {
            return false;
        }

        // Favoritos
        if (state.favoritesOnly) {
            var id = getPerfumeId(p);
            if (state.favorites.indexOf(id) === -1) {
                return false;
            }
        }

        // Filtro por Ocasión / Mood
        if (state.activeMood !== "all") {
            var keywords = MOOD_MAP[state.activeMood] || [];
            var lowerNotes = (p.notes || "").toLowerCase();
            var matchesMood = keywords.some(function(k) {
                return lowerNotes.indexOf(k) !== -1;
            });
            if (!matchesMood) return false;
        }

        // Filtro por Acordes Olfativos
        if (state.activeNote !== "all") {
            var noteTerm = state.activeNote.toLowerCase();
            var pNotes = (p.notes || "").toLowerCase();
            var normNotes = pNotes.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var normTerm = noteTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (normNotes.indexOf(normTerm) === -1) {
                return false;
            }
        }

        // Filtro por Letra Inicial de Casa
        if (state.activeLetter !== "all") {
            var firstLetter = (p.house || "").trim().charAt(0).toUpperCase();
            if (firstLetter !== state.activeLetter) {
                return false;
            }
        }

        return true;
    });
}

// --- SELECCIÓN Y GESTIÓN DE CASAS PERFUMISTAS ---
function selectHouse(houseName) {
    state.activeHouse = houseName || "all";

    // Actualizar select si existe
    var houseSelect = document.getElementById("houseSelect");
    if (houseSelect) {
        houseSelect.value = state.activeHouse;
    }

    // Actualizar botón disparador de directorio
    var triggerBtn = document.getElementById("openHousesModalBtn");
    var triggerLabel = document.getElementById("housesBtnText");
    if (triggerLabel && triggerBtn) {
        if (state.activeHouse === "all") {
            triggerLabel.textContent = "Casas (164)";
            triggerBtn.classList.remove("selected");
        } else {
            triggerLabel.innerHTML = '<strong>' + state.activeHouse + '</strong> <span class="clear-house-x" title="Quitar filtro">✕</span>';
            triggerBtn.classList.add("selected");
        }
    }

    // Actualizar estado activo en los pills horizontales
    var pills = document.querySelectorAll(".house-pill-btn");
    pills.forEach(function(pill) {
        var h = pill.getAttribute("data-house");
        pill.classList.toggle("active", h === state.activeHouse);
    });

    closeHousesModal();
    filterAndRender(true);
}
window.selectHouse = selectHouse;

// --- ACTUALIZACIÓN DE CONTADORES Y CHIPS ACTIVOS ---
function updateFilterCountsAndBadges() {
    var counts = { Hombre: 0, Mujer: 0, Unisex: 0 };
    catalogData.forEach(function(p) {
        if (counts.hasOwnProperty(p.gender)) {
            counts[p.gender]++;
        }
    });

    var countAll = document.getElementById("countAll");
    var countH = document.getElementById("countHombre");
    var countM = document.getElementById("countMujer");
    var countU = document.getElementById("countUnisex");

    if (countAll) countAll.textContent = catalogData.length;
    if (countH) countH.textContent = counts.Hombre;
    if (countM) countM.textContent = counts.Mujer;
    if (countU) countU.textContent = counts.Unisex;
    updateFavoritesBadge();

    // Contar filtros activos diferentes al default
    var activeFiltersCount = 0;
    if (state.activeHouse !== "all") activeFiltersCount++;
    if (state.activeMood !== "all") activeFiltersCount++;
    if (state.activeNote !== "all") activeFiltersCount++;
    if (state.activeLetter !== "all") activeFiltersCount++;

    var badge = document.getElementById("activeFilterBadge");
    if (badge) {
        if (activeFiltersCount > 0) {
            badge.textContent = activeFiltersCount;
            badge.style.display = "inline-flex";
        } else {
            badge.style.display = "none";
        }
    }

    var resetBtn = document.getElementById("resetFiltersBtn");
    if (resetBtn) {
        var hasAnyFilter = (activeFiltersCount > 0 || state.searchTerm || state.favoritesOnly || state.activeGenders.indexOf("all") === -1);
        resetBtn.style.display = hasAnyFilter ? "inline-flex" : "none";
    }

    // Actualizar etiquetas activas en la barra de resultados
    var activeContainer = document.getElementById("activeFiltersContainer");
    if (activeContainer) {
        activeContainer.innerHTML = "";

        if (state.activeHouse !== "all") {
            createFilterTag("Casa: " + state.activeHouse, function() {
                selectHouse("all");
            });
        }
        if (state.activeMood !== "all") {
            var moodNames = { seductive: "Seductor", fresh: "Fresco", elegant: "Elegante", romantic: "Romántico" };
            createFilterTag("Mood: " + (moodNames[state.activeMood] || state.activeMood), function() {
                state.activeMood = "all";
                document.querySelectorAll(".mood-btn").forEach(function(b) {
                    b.classList.toggle("active", b.getAttribute("data-mood") === "all");
                });
                filterAndRender(true);
            });
        }
        if (state.activeNote !== "all") {
            createFilterTag("Nota: " + state.activeNote, function() {
                state.activeNote = "all";
                document.querySelectorAll(".chip-btn").forEach(function(b) {
                    b.classList.toggle("active", b.getAttribute("data-note") === "all");
                });
                filterAndRender(true);
            });
        }
        if (state.activeLetter !== "all") {
            createFilterTag("Letra: " + state.activeLetter, function() {
                state.activeLetter = "all";
                document.querySelectorAll(".alpha-btn").forEach(function(b) {
                    b.classList.remove("active");
                });
                filterAndRender(true);
            });
        }
    }
}

function createFilterTag(label, onRemove) {
    var activeContainer = document.getElementById("activeFiltersContainer");
    if (!activeContainer) return;
    var tag = document.createElement("span");
    tag.className = "active-tag";
    tag.innerHTML = label + ' <span class="tag-remove" aria-hidden="true">&times;</span>';
    tag.onclick = onRemove;
    activeContainer.appendChild(tag);
}

// --- RENDERIZADO PROGRESIVO DEL CATÁLOGO ---
function renderNextChunk() {
    var container = document.getElementById("catalogContainer");
    var loadMoreContainer = document.getElementById("loadMoreContainer");
    if (!container) return;

    var total = state.filteredList.length;
    var start = state.renderedCount;
    var end = Math.min(start + state.pageSize, total);

    var grid = container.querySelector(".perfumes-grid");
    if (!grid) {
        grid = document.createElement("div");
        grid.className = "perfumes-grid";
        container.appendChild(grid);
    }

    for (var i = start; i < end; i++) {
        var card = createPerfumeCard(state.filteredList[i]);
        grid.appendChild(card);
    }

    state.renderedCount = end;

    // Actualizar contador
    var resultsCounter = document.getElementById("resultsCounter");
    if (resultsCounter) {
        if (state.favoritesOnly) {
            resultsCounter.textContent = "Mostrando tus " + total + " fragancias favoritas";
        } else if (state.activeHouse !== "all") {
            resultsCounter.textContent = "Mostrando " + end + " de " + total + " fragancias de " + state.activeHouse;
        } else {
            resultsCounter.textContent = "Mostrando " + end + " de " + total + " fragancias";
        }
    }

    // Manejar botón de cargar más
    if (loadMoreContainer) {
        if (state.renderedCount < total) {
            loadMoreContainer.style.display = "flex";
            var remaining = total - state.renderedCount;
            var btnSpan = loadMoreContainer.querySelector("span");
            if (btnSpan) btnSpan.textContent = "Ver más fragancias (quedan " + remaining + ")";
        } else {
            loadMoreContainer.style.display = "none";
        }
    }
}

function filterAndRender(reset) {
    if (reset) {
        state.renderedCount = 0;
    }

    var container = document.getElementById("catalogContainer");
    var bannerSlot = document.getElementById("favoritesBannerSlot");
    var loadMoreContainer = document.getElementById("loadMoreContainer");

    if (!container) return;

    state.filteredList = filterData();
    updateFilterCountsAndBadges();

    container.innerHTML = "";
    if (bannerSlot) bannerSlot.innerHTML = "";

    // Manejo de Favoritos: Banner o Estado Vacío
    if (state.favoritesOnly) {
        if (state.filteredList.length === 0) {
            if (bannerSlot) bannerSlot.innerHTML = "";
            container.innerHTML =
                '<div class="favorites-empty-box">' +
                    '<div class="fav-empty-heart" aria-hidden="true"><svg class="lade fav-heart"><use href="#lc-heart"/></svg></div>' +
                    '<h3 class="fav-empty-title">Aún no has guardado fragancias favoritas</h3>' +
                    '<p class="fav-empty-desc">Toca el corazón en cualquier perfume del catálogo para crear tu selección y consultar precio o encargo por WhatsApp.</p>' +
                    '<button type="button" class="fav-empty-browse-btn" id="exitFavoritesBtn">Explorar Catálogo Completo</button>' +
                '</div>';

            var exitBtn = document.getElementById("exitFavoritesBtn");
            if (exitBtn) {
                exitBtn.onclick = function() {
                    state.favoritesOnly = false;
                    var favPill = document.getElementById("favoritesFilterBtn");
                    if (favPill) favPill.classList.remove("active");
                    filterAndRender(true);
                };
            }
            if (loadMoreContainer) loadMoreContainer.style.display = "none";
            return;
        } else {
            if (bannerSlot) {
                var favCount = state.filteredList.length;
                var waFavUrl = getFavoritesWhatsAppUrl();
                bannerSlot.innerHTML =
                    '<div class="favorites-action-banner">' +
                        '<div class="fav-banner-content">' +
                            '<div class="fav-banner-badge">✨ Tu Selección Personal (' + favCount + ')</div>' +
                            '<h2 class="fav-banner-title">¿Listo para encargar tus extractos favoritos?</h2>' +
                            '<p class="fav-banner-desc">Envíanos tu lista guardada en un solo mensaje de WhatsApp para darte asesoría y precio preferencial.</p>' +
                        '</div>' +
                        '<a href="' + waFavUrl + '" target="_blank" rel="noopener noreferrer" class="fav-banner-wa-btn">' +
                            '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">' +
                                '<path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>' +
                            '</svg>' +
                            '<span>Consultar Selección (' + favCount + ') por WhatsApp</span>' +
                        '</a>' +
                    '</div>';
            }
        }
    }

    if (state.filteredList.length === 0) {
        container.innerHTML =
            '<div class="no-results-box">' +
                '<div class="no-results-icon">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                        '<circle cx="11" cy="11" r="8"></circle>' +
                        '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
                        '<line x1="8" y1="11" x2="14" y2="11"></line>' +
                    '</svg>' +
                '</div>' +
                '<h3 class="no-results-title">No se encontraron fragancias</h3>' +
                '<p class="no-results-text">Intenta ajustar tu búsqueda o restablecer los filtros para ver más opciones.</p>' +
                '<button type="button" class="no-results-btn" onclick="resetAllFilters()">Restablecer Filtros</button>' +
            '</div>';

        var resultsCounter = document.getElementById("resultsCounter");
        if (resultsCounter) resultsCounter.textContent = "0 fragancias encontradas";
        if (loadMoreContainer) loadMoreContainer.style.display = "none";
        return;
    }

    // Renderizar primer lote
    renderNextChunk();
}

window.renderCatalog = function() {
    filterAndRender(true);
};

// --- RESTABLECER TODOS LOS FILTROS ---
function resetAllFilters() {
    state.searchTerm = "";
    state.activeGenders = ["all"];
    state.activeMood = "all";
    state.activeNote = "all";
    state.activeLetter = "all";
    state.favoritesOnly = false;
    selectHouse("all");

    var sInput = document.getElementById("searchInput");
    if (sInput) sInput.value = "";

    var clearBtn = document.getElementById("clearSearchBtn");
    if (clearBtn) clearBtn.classList.remove("visible");

    document.querySelectorAll(".gender-filters .filter-btn").forEach(function(b) {
        var g = b.getAttribute("data-gender");
        b.classList.toggle("active", g === "all");
    });

    var favPill = document.getElementById("favoritesFilterBtn");
    if (favPill) favPill.classList.remove("active");

    document.querySelectorAll(".mood-btn").forEach(function(b) {
        b.classList.toggle("active", b.getAttribute("data-mood") === "all");
    });

    document.querySelectorAll(".chip-btn").forEach(function(b) {
        b.classList.toggle("active", b.getAttribute("data-note") === "all");
    });

    document.querySelectorAll(".alpha-btn").forEach(function(b) {
        b.classList.remove("active");
    });

    filterAndRender(true);
}
window.resetAllFilters = resetAllFilters;

// --- DIRECTORIO DE CASAS PERFUMISTAS (MODAL & BARRA DESLIZABLE) ---
function openHousesModal() {
    var modal = document.getElementById("housesModal");
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    // Limpiar y enfocar buscador del directorio
    var searchInput = document.getElementById("houseDirectorySearch");
    if (searchInput) {
        searchInput.value = "";
        renderHousesDirectory("");
        setTimeout(function() { searchInput.focus(); }, 150);
    }
}

function closeHousesModal() {
    var modal = document.getElementById("housesModal");
    if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }
}

function getHousesListWithCounts() {
    var houseCounts = {};
    catalogData.forEach(function(p) {
        if (!p.house) return;
        houseCounts[p.house] = (houseCounts[p.house] || 0) + 1;
    });

    var sortedHouses = Object.keys(houseCounts).map(function(h) {
        return { name: h, count: houseCounts[h] };
    });

    return sortedHouses;
}

function renderHousesDirectory(searchTerm, filterLetter) {
    var grid = document.getElementById("housesDirectoryGrid");
    if (!grid) return;
    grid.innerHTML = "";

    var houses = getHousesListWithCounts().sort(function(a, b) {
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });

    var term = (searchTerm || "").toLowerCase().trim();
    var filtered = houses.filter(function(h) {
        var matchesTerm = !term || h.name.toLowerCase().indexOf(term) !== -1;
        var matchesLetter = !filterLetter || filterLetter === "all" || h.name.trim().toUpperCase().startsWith(filterLetter);
        return matchesTerm && matchesLetter;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-houses-found">No se encontraron casas con "' + searchTerm + '"</div>';
        return;
    }

    filtered.forEach(function(h) {
        var itemBtn = document.createElement("button");
        itemBtn.type = "button";
        itemBtn.className = "house-dir-card" + (state.activeHouse === h.name ? " active" : "");
        itemBtn.innerHTML =
            '<span class="house-dir-name">' + h.name + '</span>' +
            '<span class="house-dir-badge">' + h.count + '</span>';

        itemBtn.onclick = function() {
            selectHouse(h.name);
        };

        grid.appendChild(itemBtn);
    });
}

function initHousesNavigation() {
    var houses = getHousesListWithCounts();

    // 1. Barra rápida deslizable con las casas más populares
    var pillsContainer = document.getElementById("housesPillsContainer");
    if (pillsContainer) {
        pillsContainer.innerHTML = "";

        // Botón "Todas"
        var allPill = document.createElement("button");
        allPill.type = "button";
        allPill.className = "house-pill-btn" + (state.activeHouse === "all" ? " active" : "");
        allPill.setAttribute("data-house", "all");
        allPill.textContent = "Todas";
        allPill.onclick = function() { selectHouse("all"); };
        pillsContainer.appendChild(allPill);

        // Top 14 casas con mayor catálogo
        var topHouses = houses.slice().sort(function(a, b) {
            return b.count - a.count;
        }).slice(0, 14);

        topHouses.forEach(function(h) {
            var pill = document.createElement("button");
            pill.type = "button";
            pill.className = "house-pill-btn" + (state.activeHouse === h.name ? " active" : "");
            pill.setAttribute("data-house", h.name);
            pill.innerHTML = h.name + ' <span class="pill-count">' + h.count + '</span>';
            pill.onclick = function() { selectHouse(h.name); };
            pillsContainer.appendChild(pill);
        });

        // Pill "+ Ver todas (164)"
        var morePill = document.createElement("button");
        morePill.type = "button";
        morePill.className = "house-pill-btn house-pill-more";
        morePill.innerHTML = '+ Ver las 164 marcas...';
        morePill.onclick = openHousesModal;
        pillsContainer.appendChild(morePill);
    }

    // 2. Disparador principal de Directorio de Casas
    var openHousesModalBtn = document.getElementById("openHousesModalBtn");
    if (openHousesModalBtn) {
        openHousesModalBtn.onclick = function(e) {
            // Si tiene casa seleccionada y pulsa la X, quitamos el filtro
            if (e.target.classList.contains("clear-house-x")) {
                e.stopPropagation();
                selectHouse("all");
                return;
            }
            openHousesModal();
        };
    }

    // 3. Cierre del modal de casas
    var closeBtn = document.getElementById("housesModalCloseBtn");
    if (closeBtn) closeBtn.onclick = closeHousesModal;

    var modalOverlay = document.getElementById("housesModal");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", function(e) {
            if (e.target === this) closeHousesModal();
        });
    }

    // 4. Buscador en tiempo real dentro del directorio
    var dirSearch = document.getElementById("houseDirectorySearch");
    var clearDirSearch = document.getElementById("clearHouseSearchBtn");
    if (dirSearch) {
        dirSearch.addEventListener("input", function() {
            var val = this.value;
            if (clearDirSearch) clearDirSearch.style.display = val.length > 0 ? "flex" : "none";
            renderHousesDirectory(val);
        });
    }
    if (clearDirSearch) {
        clearDirSearch.addEventListener("click", function() {
            if (dirSearch) {
                dirSearch.value = "";
                dirSearch.focus();
            }
            this.style.display = "none";
            renderHousesDirectory("");
        });
    }

    // 5. Salto alfabético en el modal de casas
    var alphaStrip = document.getElementById("housesModalAlphaStrip");
    if (alphaStrip) {
        alphaStrip.innerHTML = "";
        var letters = [...new Set(houses.map(function(h) {
            return h.name.trim().charAt(0).toUpperCase();
        }))].sort();

        var allAlphaBtn = document.createElement("button");
        allAlphaBtn.type = "button";
        allAlphaBtn.className = "alpha-pill active";
        allAlphaBtn.textContent = "Todas";
        allAlphaBtn.onclick = function() {
            document.querySelectorAll(".alpha-pill").forEach(function(b) { b.classList.remove("active"); });
            this.classList.add("active");
            renderHousesDirectory(dirSearch ? dirSearch.value : "", "all");
        };
        alphaStrip.appendChild(allAlphaBtn);

        letters.forEach(function(letter) {
            var lBtn = document.createElement("button");
            lBtn.type = "button";
            lBtn.className = "alpha-pill";
            lBtn.textContent = letter;
            lBtn.onclick = function() {
                document.querySelectorAll(".alpha-pill").forEach(function(b) { b.classList.remove("active"); });
                this.classList.add("active");
                renderHousesDirectory(dirSearch ? dirSearch.value : "", letter);
            };
            alphaStrip.appendChild(lBtn);
        });
    }

    // 6. Botón reset en el footer del modal
    var houseResetBtn = document.getElementById("houseResetAllBtn");
    if (houseResetBtn) {
        houseResetBtn.onclick = function() {
            selectHouse("all");
        };
    }
}

// --- INICIALIZACIÓN DE CONTROLES GENERALES ---
function initControls() {
    // 1. Buscador en Vivo con debounce
    var searchInput = document.getElementById("searchInput");
    var clearSearchBtn = document.getElementById("clearSearchBtn");
    var searchTimeout = null;

    if (searchInput) {
        searchInput.addEventListener("input", function() {
            var val = this.value;
            if (clearSearchBtn) {
                clearSearchBtn.classList.toggle("visible", val.length > 0);
            }
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                state.searchTerm = val;
                filterAndRender(true);
            }, 120);
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", function() {
            if (searchInput) {
                searchInput.value = "";
                searchInput.focus();
            }
            this.classList.remove("visible");
            state.searchTerm = "";
            filterAndRender(true);
        });
    }

    // 2. Toggle de Gaveta de Filtros Avanzados (Mobile & Desktop)
    var toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
    var advancedDrawer = document.getElementById("advancedFiltersDrawer");
    if (toggleFiltersBtn && advancedDrawer) {
        toggleFiltersBtn.addEventListener("click", function() {
            var isOpen = advancedDrawer.classList.toggle("open");
            this.classList.toggle("active", isOpen);
            this.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
    }

    // 3. Filtros de Género
    var genderBtns = document.querySelectorAll(".gender-filters .filter-btn:not(#favoritesFilterBtn)");
    genderBtns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            var gender = this.getAttribute("data-gender");
            state.favoritesOnly = false;
            var favBtn = document.getElementById("favoritesFilterBtn");
            if (favBtn) favBtn.classList.remove("active");

            if (gender === "all") {
                state.activeGenders = ["all"];
                genderBtns.forEach(function(b) { b.classList.remove("active"); });
                this.classList.add("active");
            } else {
                if (state.activeGenders.indexOf("all") !== -1) {
                    state.activeGenders = [];
                }
                var idx = state.activeGenders.indexOf(gender);
                if (idx === -1) {
                    state.activeGenders.push(gender);
                    this.classList.add("active");
                } else {
                    state.activeGenders.splice(idx, 1);
                    this.classList.remove("active");
                    if (state.activeGenders.length === 0) {
                        state.activeGenders = ["all"];
                        var allBtn = document.querySelector('.filter-btn[data-gender="all"]');
                        if (allBtn) allBtn.classList.add("active");
                    }
                }
                var allBtnEl = document.querySelector('.filter-btn[data-gender="all"]');
                if (allBtnEl && state.activeGenders.indexOf("all") === -1) {
                    allBtnEl.classList.remove("active");
                }
            }
            filterAndRender(true);
        });
    });

    // 4. Botón de Favoritos en la Barra Rápida
    var favPillBtn = document.getElementById("favoritesFilterBtn");
    if (favPillBtn) {
        favPillBtn.addEventListener("click", function() {
            state.favoritesOnly = !state.favoritesOnly;
            this.classList.toggle("active", state.favoritesOnly);

            if (state.favoritesOnly) {
                genderBtns.forEach(function(b) {
                    b.classList.toggle("active", b.getAttribute("data-gender") === "all");
                });
                state.activeGenders = ["all"];
            }
            filterAndRender(true);
        });
    }

    // 5. Selector de Casas Perfumistas tradicional (dropdown auxiliar)
    var houseSelect = document.getElementById("houseSelect");
    if (houseSelect && window.catalogData) {
        var houses = [...new Set(catalogData.map(function(p) { return p.house; }))].sort(function(a, b) {
            return a.localeCompare(b, "es", { sensitivity: "base" });
        });

        houses.forEach(function(h) {
            var opt = document.createElement("option");
            opt.value = h;
            opt.textContent = h;
            houseSelect.appendChild(opt);
        });

        houseSelect.addEventListener("change", function() {
            selectHouse(this.value);
        });
    }

    // 6. Selector de Moods / Ocasión
    var moodBtns = document.querySelectorAll(".mood-btn");
    moodBtns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            var mood = this.getAttribute("data-mood");
            state.activeMood = mood;
            moodBtns.forEach(function(b) { b.classList.remove("active"); });
            this.classList.add("active");
            filterAndRender(true);
        });
    });

    // 7. Chips de Acordes Olfativos
    var chipBtns = document.querySelectorAll(".chip-btn");
    chipBtns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            var note = this.getAttribute("data-note");
            state.activeNote = note;
            chipBtns.forEach(function(b) { b.classList.remove("active"); });
            this.classList.add("active");
            filterAndRender(true);
        });
    });

    // 8. Índice Alfabético de Casas en Drawer
    var alphaContainer = document.getElementById("alphabetIndex");
    if (alphaContainer && window.catalogData) {
        alphaContainer.innerHTML = "";
        var availableLetters = [...new Set(catalogData.map(function(p) {
            return (p.house || "").trim().charAt(0).toUpperCase();
        }))].sort();

        var allLetterBtn = document.createElement("button");
        allLetterBtn.type = "button";
        allLetterBtn.className = "alpha-btn active";
        allLetterBtn.textContent = "Todas";
        allLetterBtn.onclick = function() {
            state.activeLetter = "all";
            document.querySelectorAll(".alpha-btn").forEach(function(b) { b.classList.remove("active"); });
            this.classList.add("active");
            filterAndRender(true);
        };
        alphaContainer.appendChild(allLetterBtn);

        availableLetters.forEach(function(letter) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "alpha-btn";
            btn.textContent = letter;
            btn.onclick = function() {
                if (state.activeLetter === letter) {
                    state.activeLetter = "all";
                    allLetterBtn.classList.add("active");
                    this.classList.remove("active");
                } else {
                    state.activeLetter = letter;
                    document.querySelectorAll(".alpha-btn").forEach(function(b) { b.classList.remove("active"); });
                    this.classList.add("active");
                }
                filterAndRender(true);
            };
            alphaContainer.appendChild(btn);
        });
    }

    // 9. Alternador de Vista (Cuadrícula / Lista)
    var viewGridBtn = document.getElementById("viewGridBtn");
    var viewListBtn = document.getElementById("viewListBtn");
    var catalogContainer = document.getElementById("catalogContainer");

    function applyViewMode(mode) {
        state.viewMode = mode;
        localStorage.setItem("jj_view_mode", mode);
        if (catalogContainer) {
            catalogContainer.classList.toggle("list-mode", mode === "list");
        }
        if (viewGridBtn) viewGridBtn.classList.toggle("active", mode === "grid");
        if (viewListBtn) viewListBtn.classList.toggle("active", mode === "list");
    }

    if (viewGridBtn) viewGridBtn.onclick = function() { applyViewMode("grid"); };
    if (viewListBtn) viewListBtn.onclick = function() { applyViewMode("list"); };
    applyViewMode(state.viewMode);

    // 10. Botón de Reset Filtros
    var resetBtn = document.getElementById("resetFiltersBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", resetAllFilters);
    }

    // 11. Carga Progresiva / Infinite Scroll con IntersectionObserver
    var loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", function() {
            renderNextChunk();
        });
    }

    var sentinel = document.getElementById("catalogSentinel");
    if (sentinel && window.IntersectionObserver) {
        var observer = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
                if (state.renderedCount < state.filteredList.length) {
                    renderNextChunk();
                }
            }
        }, { rootMargin: "300px" });
        observer.observe(sentinel);
    }

    // 12. Modal Ficha de Perfume Eventos de Cierre
    var closeBtns = [
        document.getElementById("modalCloseBtn"),
        document.getElementById("modalFooterCloseBtn")
    ];
    closeBtns.forEach(function(btn) {
        if (btn) btn.onclick = closePerfumeModal;
    });

    var perfumeModalOverlay = document.getElementById("perfumeModal");
    if (perfumeModalOverlay) {
        perfumeModalOverlay.addEventListener("click", function(e) {
            if (e.target === this) {
                closePerfumeModal();
            }
        });
    }

    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            closePerfumeModal();
            closeHousesModal();
        }
    });

    // 13. Botón Volver Arriba
    var backToTopBtn = document.getElementById("backToTopBtn");
    if (backToTopBtn) {
        window.addEventListener("scroll", function() {
            backToTopBtn.classList.toggle("visible", window.pageYOffset > 500);
        });
        backToTopBtn.addEventListener("click", function() {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // 14. Video de Fondo Responsivo
    var heroVideo = document.getElementById("heroVideo");
    if (heroVideo) {
        function updateVideoSource() {
            var isMobile = window.innerWidth <= 768;
            var targetSource = isMobile ? "img/herovertical.mp4" : "img/hero.mp4";
            var currentSource = heroVideo.currentSrc || heroVideo.getAttribute("src") || "";
            if (currentSource.indexOf(targetSource) === -1) {
                heroVideo.src = targetSource;
                heroVideo.load();
            }
        }
        updateVideoSource();
        window.addEventListener("resize", updateVideoSource);
    }

    // 15. Inicializar Directorio y Barra de Casas
    initHousesNavigation();
}

// --- ARRANQUE PRINCIPAL ---
document.addEventListener("DOMContentLoaded", function() {
    initControls();
    filterAndRender(true);
});

// ==========================================================================
// PEDIDO GUIADO (CARRITO) → UN SOLO MENSAJE DE WHATSAPP
// Acumula fragancias y genera la conversión con las promos vigentes aplicadas.
// ==========================================================================
var ORDER_PHONE = "573126654386";
var orderState = {
    items: JSON.parse(localStorage.getItem("jj_order") || "[]")
};

function computeOrderTotal(n) {
    var packs5 = Math.floor(n / 5);
    var rest = n - packs5 * 5;
    var packs3 = Math.floor(rest / 3);
    var singles = rest - packs3 * 3;
    return {
        total: packs5 * 100000 + packs3 * 65000 + singles * 25000,
        packs5: packs5,
        packs3: packs3,
        singles: singles
    };
}

function formatCOP(v) {
    return "$" + v.toLocaleString("es-CO");
}

function inOrder(id) {
    return orderState.items.indexOf(id) !== -1;
}

function saveOrder() {
    localStorage.setItem("jj_order", JSON.stringify(orderState.items));
}

function findPerfumeById(id) {
    for (var i = 0; i < catalogData.length; i++) {
        if (getPerfumeId(catalogData[i]) === id) return catalogData[i];
    }
    return null;
}

function showToast(msg) {
    var toast = document.createElement("div");
    toast.className = "jj-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>' + msg + "</span>";
    document.body.appendChild(toast);
    window.setTimeout(function() { toast.classList.add("visible"); }, 20);
    window.setTimeout(function() {
        toast.classList.remove("visible");
        window.setTimeout(function() { toast.remove(); }, 350);
    }, 2300);
}

function addToOrder(id) {
    var p = findPerfumeById(id);
    if (!p) return;
    if (inOrder(id)) {
        showToast("Ya está en tu pedido");
        openOrderDrawer();
        return;
    }
    orderState.items.push(id);
    saveOrder();
    updateOrderUI();
    showToast(p.name + " añadido al pedido");
    var cardAddBtns = document.querySelectorAll('.card-add-order-btn[data-id="' + id + '"]');
    cardAddBtns.forEach(function(b) { b.classList.add("added"); });
    window.setTimeout(openOrderDrawer, 450);
}

function removeFromOrder(id) {
    var idx = orderState.items.indexOf(id);
    if (idx === -1) return;
    orderState.items.splice(idx, 1);
    saveOrder();
    updateOrderUI();
    var cardAddBtns = document.querySelectorAll('.card-add-order-btn[data-id="' + id + '"]');
    cardAddBtns.forEach(function(b) { b.classList.remove("added"); });
}

function buildOrderWhatsAppText() {
    var perfumes = orderState.items.map(findPerfumeById).filter(Boolean);
    if (perfumes.length === 0) return "";
    var lines = perfumes.map(function(p, i) {
        return (i + 1) + ". " + p.name + " (" + p.house + ")";
    }).join("\n");

    var t = computeOrderTotal(perfumes.length);
    var promoNotes = [];
    if (t.packs5 > 0) promoNotes.push(t.packs5 + " x Promo 5 por " + formatCOP(100000) + " (¡1 GRATIS!)");
    if (t.packs3 > 0) promoNotes.push(t.packs3 + " x Promo 3 por " + formatCOP(65000));
    if (t.singles > 0) promoNotes.push(t.singles + " individual(es)");

    var text = "Hola J.J Parfums, quiero hacer mi pedido de extractos concentrados en roll-on:\n\n" +
        lines +
        "\n\n" + (promoNotes.length > 0 ? "Promos que deseo aplicar: " + promoNotes.join(" · ") + "\n" : "") +
        "Total estimado: *" + formatCOP(t.total) + " COP*\n\n" +
        "¿Me confirmas disponibilidad para coordinar el pago y el envío?";
    return text;
}

function getOrderWhatsAppUrl() {
    var text = buildOrderWhatsAppText();
    if (!text) return "";
    return "https://wa.me/" + ORDER_PHONE + "?text=" + encodeURIComponent(text);
}

function updateOrderUI() {
    var bar = document.getElementById("orderBar");
    var drawer = document.getElementById("orderDrawer");
    if (!bar || !drawer) return;

    var count = orderState.items.length;
    var t = computeOrderTotal(count);

    if (count === 0) {
        bar.classList.remove("visible");
        drawer.classList.remove("open");
        document.getElementById("orderDrawerOverlay").classList.remove("visible");
        drawer.setAttribute("aria-hidden", "true");
        return;
    }

    bar.classList.add("visible");
    document.getElementById("orderItemCount").textContent = count;
    document.getElementById("orderItemCountLabel").textContent = count + (count === 1 ? " extracto" : " extractos");
    document.getElementById("orderBarTotal").textContent = formatCOP(t.total) + " COP";

    // Lista de artículos
    var listEl = document.getElementById("orderItemsList");
    listEl.innerHTML = "";
    orderState.items.forEach(function(id) {
        var p = findPerfumeById(id);
        if (!p) return;
        var row = document.createElement("div");
        row.className = "order-item-row";
        row.innerHTML =
            '<div class="order-item-info">' +
                '<strong>' + p.name + "</strong>" +
                "<span>" + p.house + "</span>" +
            '</div>' +
            '<button type="button" class="order-item-remove" title="Quitar del pedido" aria-label="Quitar ' + p.name + ' del pedido">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            "</button>";
        row.querySelector(".order-item-remove").onclick = function() { removeFromOrder(id); };
        listEl.appendChild(row);
    });

    // Resumen de promos
    var promoEl = document.getElementById("orderPromoSummary");
    var parts = [];
    if (t.packs5 > 0) parts.push('<span class="order-promo-tag gold"><svg class="lade" aria-hidden="true"><use href="#lc-crown"/></svg> Promo 5 por ' + formatCOP(100000) + " × " + t.packs5 + "</span>");
    if (t.packs3 > 0) parts.push('<span class="order-promo-tag">Promo 3 por $65.000 × ' + t.packs3 + "</span>");
    if (t.singles > 0) parts.push('<span class="order-promo-tag">Individuales × ' + t.singles + "</span>");
    promoEl.innerHTML = parts.length > 0
        ? '<div class="order-promo-onsale">' + parts.join("") + '<span class="order-promo-hint">Las promociones se confirman por WhatsApp</span></div>'
        : "";

    document.getElementById("orderDrawerTotal").textContent = formatCOP(t.total) + " COP";
    var waBtn = document.getElementById("orderSendBtn");
    waBtn.href = getOrderWhatsAppUrl();
    var barSend = document.getElementById("orderBarSendLink");
    if (barSend) barSend.href = getOrderWhatsAppUrl();

    var titleEl = document.getElementById("orderDrawerCount");
    if (titleEl) titleEl.textContent = "(" + count + ")";
}

function openOrderDrawer() {
    var drawer = document.getElementById("orderDrawer");
    if (!drawer || orderState.items.length === 0) return;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.getElementById("orderDrawerOverlay").classList.add("visible");
}

function closeOrderDrawer() {
    var drawer = document.getElementById("orderDrawer");
    if (!drawer) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.getElementById("orderDrawerOverlay").classList.remove("visible");
}

(function initOrder() {
    document.addEventListener("DOMContentLoaded", function() {
        var bar = document.getElementById("orderBar");
        var drawer = document.getElementById("orderDrawer");

        if (bar) {
            bar.addEventListener("click", function(e) {
                if (e.target.closest(".order-bar-send")) return;
                openOrderDrawer();
            });
        }

        var closeBtn = document.getElementById("orderDrawerCloseBtn");
        if (closeBtn) closeBtn.addEventListener("click", closeOrderDrawer);
        var overlay = document.getElementById("orderDrawerOverlay");
        if (overlay) overlay.addEventListener("click", closeOrderDrawer);
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") closeOrderDrawer();
        });

        updateOrderUI();

        // Marcar tarjetas ya añadidas tras renderizado progresivo
        var grid = document.getElementById("catalogContainer");
        if (grid) {
            grid.addEventListener("DOMNodeInserted", function() {}, false);
        }
    });
})();

