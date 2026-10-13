/**
 * J.J PARFUMS - Catálogo Exclusivo
 * Lógica de Filtrado, Búsqueda en Vivo, Navegación y Modal Informativo
 * (Solo Consulta / Sin elementos de pedido o compra)
 */

// --- Global Functions (Outside DOMContentLoaded for body onload) ---

/**
 * Background Dynamic Glow
 * Crea un efecto de luz suave que sigue el movimiento del mouse
 */
function initBackgroundGlow() {
    const glow = document.getElementById("bgGlow");
    if (!glow) return;

    window.addEventListener("mousemove", (e) => {
        const x = e.clientX;
        const y = e.clientY;

        // Move the glow element
        glow.style.left = `${x}px`;
        glow.style.top = `${y}px`;
    });

    // Mobile optimization: slow pulse instead of mouse follow
    if (window.innerWidth < 768) {
        let angle = 0;
        setInterval(() => {
            angle += 0.02;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const radius = 300;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            glow.style.left = `${x}px`;
            glow.style.top = `${y}px`;
        }, 30);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Validar que la base de datos esté disponible
    if (typeof catalogData === "undefined" || !Array.isArray(catalogData)) {
        console.error("Error: No se encontró la base de datos catalogData.");
        const container = document.getElementById("catalogContainer");
        if (container) {
            container.innerHTML = `<div class="no-results-box">
        <h3 class="no-results-title">Error al cargar el catálogo</h3>
        <p class="no-results-text">No se pudo cargar la base de datos de fragancias. Verifique que data.js esté en la misma carpeta.</p>
      </div>`;
        }
        return;
    }

    // 2. Elementos del DOM
    const container = document.getElementById("catalogContainer");
    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const houseSelect = document.getElementById("houseSelect");
    const genderFilterBtns = document.querySelectorAll(".gender-filters .filter-btn");
    const olfactoryChips = document.querySelectorAll(".olfactory-chips .chip-btn");
    const resultsCounter = document.getElementById("resultsCounter");
    const activeFiltersContainer = document.getElementById("activeFiltersContainer");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const alphabetIndex = document.getElementById("alphabetIndex");
    const viewGridBtn = document.getElementById("viewGridBtn");
    const viewListBtn = document.getElementById("viewListBtn");
    const backToTopBtn = document.getElementById("backToTopBtn");
    const controlsSection = document.getElementById("controlsSection");
    const controlsToggle = document.getElementById("controlsToggle");

    // Elementos del Modal
    const perfumeModal = document.getElementById("perfumeModal");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalFooterCloseBtn = document.getElementById("modalFooterCloseBtn");
    const modalHouse = document.getElementById("modalHouse");
    const modalPerfumeName = document.getElementById("modalPerfumeName");
    const modalGender = document.getElementById("modalGender");
    const modalNotes = document.getElementById("modalNotes");
    const modalTagsContainer = document.getElementById("modalTagsContainer");
    const modalCard = document.getElementById("modalCard");
    const modalBottleStage = document.getElementById("modalBottleStage");
    const modalBottleImg = document.getElementById("modalBottleImg");

    // Elementos de métricas del encabezado
    const totalFragrancesCount = document.getElementById("totalFragrancesCount");
    const totalHousesCount = document.getElementById("totalHousesCount");
    const countAll = document.getElementById("countAll");
    const countHombre = document.getElementById("countHombre");
    const countMujer = document.getElementById("countMujer");
    const countUnisex = document.getElementById("countUnisex");

    // 3. Estado de la aplicación
    let searchTerm = "";
    let activeGenders = new Set(["all"]);
    let activeHouse = "all";
    let activeNote = "all";
    let activeView = "grid"; // 'grid' | 'list'

    // Favoritos State
    let favorites = JSON.parse(localStorage.getItem("jj_favorites") || "[]");

    // Función utilitaria para normalizar texto (sin acentos, minúsculas)
    function normalize(str) {
        if (!str) return "";
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .trim();
    }

    // 4. Inicializar Métricas y Contadores
    function initMetrics() {
        const total = catalogData.length;
        const uniqueHouses = [...new Set(catalogData.map(p => p.house))];

        if (totalFragrancesCount) totalFragrancesCount.textContent = total;
        if (totalHousesCount) totalHousesCount.textContent = uniqueHouses.length;

        let h = 0, m = 0, u = 0;
        catalogData.forEach(p => {
            const g = p.gender.toLowerCase();
            if (g.includes("hombre")) h++;
            else if (g.includes("mujer")) m++;
            else if (g.includes("unisex")) u++;
        });

        if (countAll) countAll.textContent = total;
        if (countHombre) countHombre.textContent = h;
        if (countMujer) countMujer.textContent = m;
        if (countUnisex) countUnisex.textContent = u;
    }

    // 5. Poblar el Selector de Casas Perfumistas
    function populateHouseSelect() {
        if (!houseSelect) return;
        const uniqueHouses = [...new Set(catalogData.map(p => p.house))].sort((a, b) =>
            a.localeCompare(b, "es", { sensitivity: "base" })
        );

        houseSelect.innerHTML = `<option value="all">Todas las Casas Perfumistas (${uniqueHouses.length})</option>`;
        uniqueHouses.forEach(house => {
            const count = catalogData.filter(p => p.house === house).length;
            const option = document.createElement("option");
            option.value = house;
            option.textContent = `${house} (${count})`;
            houseSelect.appendChild(option);
        });
    }

    // 6. Generar el Índice Alfabético Rápido
    function generateAlphabetIndex() {
        if (!alphabetIndex) return;
        alphabetIndex.innerHTML = "";

        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const houses = [...new Set(catalogData.map(p => p.house))];

        alphabet.forEach(letter => {
            const hasHouses = houses.some(h => normalize(h).startsWith(letter.toLowerCase()));
            const btn = document.createElement("button");
            btn.className = `alpha-btn ${hasHouses ? "" : "disabled"}`;
            btn.textContent = letter;
            btn.setAttribute("aria-label", `Ir a casas con letra ${letter}`);

            if (hasHouses) {
                btn.addEventListener("click", () => {
                    jumpToLetter(letter);
                });
            }

            alphabetIndex.appendChild(btn);
        });
    }

    // Salto suave a la primera casa con la letra seleccionada
    function jumpToLetter(letter) {
        const normLetter = letter.toLowerCase();
        const houseHeaders = document.querySelectorAll(".house-group");

        for (const group of houseHeaders) {
            const titleEl = group.querySelector(".house-title");
            if (titleEl) {
                const houseTitle = normalize(titleEl.textContent);
                if (houseTitle.startsWith(normLetter)) {
                    group.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                }
            }
        }
    }

    // 7. Resaltar término de búsqueda en texto
    function highlightMatch(text, query) {
        if (!query) return text;
        const normText = normalize(text);
        const normQuery = normalize(query);
        const idx = normText.indexOf(normQuery);

        if (idx === -1) return text;

        const originalMatch = text.substr(idx, query.length);
        const before = text.substring(0, idx);
        const after = text.substring(idx + query.length);

        return `${before}<mark class="search-highlight">${originalMatch}</mark>${after}`;
    }

    // 8. Renderizado del Catálogo
    function renderCatalog() {
        container.innerHTML = "";

        const normSearch = normalize(searchTerm);
        const normNote = normalize(activeNote);

        // Filtrar dataset
        const filtered = catalogData.filter(item => {
            // Filtro Género (Soporta selección múltiple)
            let matchesGender = true;
            if (activeGenders.size > 1 || !activeGenders.has("all")) {
                const gender = item.gender.toLowerCase();
                matchesGender =
                    activeGenders.has("Hombre") && gender.includes("hombre") ||
                    activeGenders.has("Mujer") && gender.includes("mujer") ||
                    activeGenders.has("Unisex") && gender.includes("unisex");
            }

            // Filtro Casa
            const matchesHouse = activeHouse === "all" || item.house === activeHouse;

            // Filtro Acorde Olfativo (Chips)
            let matchesNoteChip = true;
            if (activeNote !== "all") {
                const normItemNotes = normalize(item.notes);
                matchesNoteChip = normItemNotes.includes(normNote);
            }

            // Filtro Búsqueda en Vivo
            let matchesSearch = true;
            if (normSearch) {
                const normName = normalize(item.name);
                const normItemHouse = normalize(item.house);
                const normNotes = normalize(item.notes);

                matchesSearch =
                    normName.includes(normSearch) ||
                    normItemHouse.includes(normSearch) ||
                    normNotes.includes(normSearch);
            }

            return matchesGender && matchesHouse && matchesNoteChip && matchesSearch;
        });

        // Actualizar Contador y Resumen
        updateSummaryBar(filtered.length);

        // Si no hay resultados
        if (filtered.length === 0) {
            container.innerHTML = `
        <div class="no-results-box">
          <svg class="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10 2h4m-2 0v4m-5 4v10a2 2 0 002 2h6a2 2 0 002-2V10a2 2 0 00-2-2H9a2 2 0 00-2 2z"/>
            <line x1="8" y1="14" x2="16" y2="14"/>
          </svg>
          <h3 class="no-results-title">No se encontraron fragancias</h3>
          <p class="no-results-text">
            No encontramos coincidencias para los criterios seleccionados.
            Intente con otro nombre, casa o nota aromática.
          </p>
          <button type="button" class="no-results-btn" id="emptyStateResetBtn">
            Ver Todo el Catálogo
          </button>
        </div>
      `;
            const emptyBtn = document.getElementById("emptyStateResetBtn");
            if (emptyBtn) emptyBtn.addEventListener("click", resetAllFilters);
            return;
        }

        // Agrupar por Casa respetando orden alfabético
        const grouped = {};
        filtered.forEach(perfume => {
            if (!grouped[perfume.house]) {
                grouped[perfume.house] = [];
            }
            grouped[perfume.house].push(perfume);
        });

        const fragment = document.createDocumentFragment();

        Object.keys(grouped).forEach(houseName => {
            const perfumesInHouse = grouped[houseName];
            const houseGroup = document.createElement("section");
            houseGroup.className = "house-group";
            houseGroup.id = `house-${normalize(houseName).replace(/[^a-z0-9]/g, "-")}`;

            const headerDiv = document.createElement("div");
            headerDiv.className = "house-header";
            headerDiv.innerHTML = `
        <h2 class="house-title">${highlightMatch(houseName, searchTerm)}</h2>
        <span class="house-count">${perfumesInHouse.length} ${perfumesInHouse.length === 1 ? 'fragancia' : 'fragancias'}</span>
      `;
            houseGroup.appendChild(headerDiv);

            const gridDiv = document.createElement("div");
            gridDiv.className = "perfumes-grid";

            perfumesInHouse.forEach(perfume => {
                const card = document.createElement("article");
                card.className = "perfume-card" + (perfume.image ? " has-image" : "");
                card.tabIndex = 0;
                card.setAttribute("role", "button");
                card.setAttribute("aria-label", `Ver notas de ${perfume.name} de ${perfume.house}`);

                const displayName = highlightMatch(perfume.name, searchTerm);
                const displayNotes = highlightMatch(perfume.notes, searchTerm);

                const imageHtml = perfume.image ? `
          <div class="card-image-box">
            <img src="${perfume.image}" alt="Frasco de ${perfume.name} - ${perfume.house}" class="card-bottle-img" loading="lazy" />
          </div>
        ` : '';

                // Lógica de Favorito en tarjeta
                const isFav = favorites.some(f => f.name === perfume.name && f.house === perfume.house);
                const favBtnHtml = `
                    <button class="favorite-btn ${isFav ? 'active' : ''}"
                            data-name="${perfume.name}"
                            data-house="${perfume.house}"
                            title="Agregar a favoritos">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                `;

                card.innerHTML = `
          ${imageHtml}
          ${favBtnHtml}
          <div class="card-top">
            <div class="card-header-left">
              <span class="card-house-micro">${perfume.house}</span>
              <h3 class="perfume-name">${displayName}</h3>
            </div>
            <span class="gender-badge badge-${perfume.gender}">${perfume.gender}</span>
          </div>
          <p class="card-notes">${displayNotes}</p>
          <div class="card-footer">
            <span class="card-extract-label">Extracto Concentrado</span>
            <span class="card-view-notes-btn">Ver Ficha &rarr;</span>
          </div>
        `;

                // Evitar que el clic en el botón de favorito abra el modal
                const favBtn = card.querySelector(".favorite-btn");
                if (favBtn) {
                    favBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        toggleFavorite(perfume);
                    });
                }

                // Abrir modal con detalles de la fragancia al hacer clic o presionar Enter
                card.addEventListener("click", () => openPerfumeModal(perfume));
                card.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openPerfumeModal(perfume);
                    }
                });

                gridDiv.appendChild(card);
            });

            houseGroup.appendChild(gridDiv);
            fragment.appendChild(houseGroup);
        });

        container.appendChild(fragment);
    }

    // 9. Actualizar Barra de Resumen y Filtros Activos
    function updateSummaryBar(matchCount) {
        if (!resultsCounter) return;

        const total = catalogData.length;
        if (matchCount === total) {
            resultsCounter.textContent = `Mostrando catálogo completo (${total} fragancias)`;
        } else {
            resultsCounter.textContent = `Mostrando ${matchCount} de ${total} fragancias`;
        }

        // Renderizar tags de filtros activos
        activeFiltersContainer.innerHTML = "";
        let hasFilters = false;

        if (searchTerm) {
            hasFilters = true;
            addActiveFilterTag(`Búsqueda: "${searchTerm}"`, () => {
                searchTerm = "";
                searchInput.value = "";
                clearSearchBtn.classList.remove("visible");
                renderCatalog();
            });
        }

        if (activeGenders.size > 1 || !activeGenders.has("all")) {
            hasFilters = true;
            const selected = Array.from(activeGenders).filter(g => g !== "all");
            addActiveFilterTag(`Géneros: ${selected.join(", ")}`, () => {
                setGenderFilter("all");
            });
        }

        if (activeHouse !== "all") {
            hasFilters = true;
            addActiveFilterTag(`Casa: ${activeHouse}`, () => {
                activeHouse = "all";
                houseSelect.value = "all";
                renderCatalog();
            });
        }

        if (activeNote !== "all") {
            hasFilters = true;
            addActiveFilterTag(`Acorde: ${activeNote}`, () => {
                setNoteChip("all");
            });
        }

        if (resetFiltersBtn) {
            resetFiltersBtn.style.display = hasFilters ? "inline-block" : "none";
        }
    }

    function addActiveFilterTag(label, removeCallback) {
        const tag = document.createElement("span");
        tag.className = "active-tag";
        tag.innerHTML = `${label} <span style="cursor:pointer;margin-left:4px;" title="Quitar">&times;</span>`;
        tag.addEventListener("click", removeCallback);
        activeFiltersContainer.appendChild(tag);
    }

    function setGenderFilter(gender) {
        if (gender === "all") {
            activeGenders.clear();
            activeGenders.add("all");
        } else {
            if (activeGenders.has("all")) {
                activeGenders.delete("all");
            }
            if (activeGenders.has(gender)) {
                activeGenders.delete(gender);
                if (activeGenders.size === 0) {
                    activeGenders.add("all");
                }
            } else {
                activeGenders.add(gender);
            }
        }

        genderFilterBtns.forEach(btn => {
            const btnGender = btn.getAttribute("data-gender");
            const isActive = (btnGender === "all")
                ? activeGenders.size === 1 && activeGenders.has("all")
                : activeGenders.has(btnGender);
            btn.classList.toggle("active", isActive);
        });
        renderCatalog();
    }

    function setNoteChip(note) {
        activeNote = note;
        olfactoryChips.forEach(chip => {
            chip.classList.toggle("active", chip.getAttribute("data-note") === note);
        });
        renderCatalog();
    }

    function resetAllFilters() {
        searchTerm = "";
        activeGenders.clear();
        activeGenders.add("all");
        activeHouse = "all";
        activeNote = "all";

        if (searchInput) searchInput.value = "";
        if (clearSearchBtn) clearSearchBtn.classList.remove("visible");
        if (houseSelect) houseSelect.value = "all";

        genderFilterBtns.forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-gender") === "all");
        });

        olfactoryChips.forEach(chip => {
            chip.classList.toggle("active", chip.getAttribute("data-note") === "all");
        });

        renderCatalog();
    }

    // 10. Modal Informativo de Ficha Técnica Olfativa (Solo Consulta)
    function openPerfumeModal(perfume) {
        if (!perfumeModal) return;

        modalHouse.textContent = perfume.house;
        modalPerfumeName.textContent = perfume.name;
        modalGender.textContent = perfume.gender;
        modalGender.className = `gender-badge badge-${perfume.gender}`;
        modalNotes.textContent = perfume.notes;

        // Mostrar u ocultar imagen del frasco en el modal
        if (perfume.image) {
            if (modalCard) modalCard.classList.add("has-image");
            if (modalBottleStage) modalBottleStage.style.display = "flex";
            if (modalBottleImg) {
                modalBottleImg.src = perfume.image;
                modalBottleImg.alt = `Frasco oficial de ${perfume.name} - ${perfume.house}`;
            }
        } else {
            if (modalCard) modalCard.classList.remove("has-image");
            if (modalBottleStage) modalBottleStage.style.display = "none";
            if (modalBottleImg) {
                modalBottleImg.src = "";
                modalBottleImg.alt = "";
            }
        }

        // Desglosar notas en etiquetas visuales
        modalTagsContainer.innerHTML = "";
        const rawParts = perfume.notes.split(/[,.;]/).map(s => s.trim()).filter(Boolean);
        const tags = [...new Set(rawParts.slice(0, 8))];

        tags.forEach(tag => {
            const span = document.createElement("span");
            span.className = "modal-tag";
            span.textContent = tag;
            modalTagsContainer.appendChild(span);
        });

        perfumeModal.classList.add("active");
        perfumeModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden"; // Bloquear scroll de fondo
    }

    function closePerfumeModal() {
        if (!perfumeModal) return;
        perfumeModal.classList.remove("active");
        perfumeModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    // 11. Escuchadores de Eventos

    // Buscador con debounce ligero
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value.trim();
        if (searchTerm.length > 0) {
            clearSearchBtn.classList.add("visible");
        } else {
            clearSearchBtn.classList.remove("visible");
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderCatalog();
        }, 150);
    });

    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchTerm = "";
        clearSearchBtn.classList.remove("visible");
        searchInput.focus();
        renderCatalog();
    });

    // Selector de Casa
    houseSelect.addEventListener("change", (e) => {
        activeHouse = e.target.value;
        renderCatalog();
    });

    // Botones de Género
    genderFilterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            setGenderFilter(btn.getAttribute("data-gender"));
        });
    });

    // Chips Olfativos
    olfactoryChips.forEach(chip => {
        chip.addEventListener("click", () => {
            setNoteChip(chip.getAttribute("data-note"));
        });
    });

    // Botón Restablecer Filtros
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", resetAllFilters);
    }

    // Alternador de Vista (Cuadrícula / Lista)
    if (viewGridBtn && viewListBtn) {
        viewGridBtn.addEventListener("click", () => {
            activeView = "grid";
            viewGridBtn.classList.add("active");
            viewListBtn.classList.remove("active");
            container.classList.remove("list-mode");
        });

        viewListBtn.addEventListener("click", () => {
            activeView = "list";
            viewListBtn.classList.add("active");
            viewGridBtn.classList.remove("active");
            container.classList.add("list-mode");
        });
    }

    // Modal Events
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closePerfumeModal);
    if (modalFooterCloseBtn) modalFooterCloseBtn.addEventListener("click", closePerfumeModal);

    perfumeModal.addEventListener("click", (e) => {
        if (e.target === perfumeModal) {
            closePerfumeModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && perfumeModal.classList.contains("active")) {
            closePerfumeModal();
        }
    });

    // Toggle controls section (Minimize/Expand)
    if (controlsToggle && controlsSection) {
        controlsToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            controlsSection.classList.toggle("minimized");
            console.log("Controls toggle clicked. Minimized state:", controlsSection.classList.contains("minimized"));
        });
    }

    // Botón Volver Arriba
    window.addEventListener("scroll", () => {
        if (window.scrollY > 350) {
            backToTopBtn.classList.add("visible");
        } else {
            backToTopBtn.classList.remove("visible");
        }
    }, { passive: true });

    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 12. Inicializar todo
    initMetrics();
    populateHouseSelect();
    generateAlphabetIndex();
    renderCatalog();

    // Observer para revelado progresivo de tarjetas
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    // Aplicar observer a las tarjetas después de renderizar
    const observeCards = () => {
        document.querySelectorAll('.perfume-card').forEach(card => {
            card.classList.add('reveal');
            revealObserver.observe(card);
        });
    };

    // Modificar renderCatalog para llamar a observeCards
    const originalRenderCatalog = renderCatalog;
    renderCatalog = () => {
        originalRenderCatalog();
        observeCards();
    };
});

/**
 * Lógica de Favoritos
 */
function toggleFavorite(perfume) {
    const index = favorites.findIndex(f => f.name === perfume.name && f.house === perfume.house);

    if (index === -1) {
        favorites.push({ name: perfume.name, house: perfume.house });
    } else {
        favorites.splice(index, 1);
    }

    localStorage.setItem("jj_favorites", JSON.stringify(favorites));

    // Actualizar UI de las tarjetas sin renderizar todo el catálogo para evitar saltos
    document.querySelectorAll(".perfume-card").forEach(card => {
        const favBtn = card.querySelector(".favorite-btn");
        if (favBtn) {
            const name = favBtn.getAttribute("data-name");
            const house = favBtn.getAttribute("data-house");
            const isActive = favorites.some(f => f.name === name && f.house === house);
            favBtn.classList.toggle("active", isActive);
        }
    });
}
