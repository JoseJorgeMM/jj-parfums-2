/**
 * J.J PARFUMS - Catálogo Exclusivo
 * Lógica de Filtrado, Búsqueda en Vivo, Navegación y Modal Informativo
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
        glow.style.left = `${x}px`;
        glow.style.top = `${y}px`;
    });

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
    let favoritesOnly = false;
    let activeView = "grid";

    let favorites = JSON.parse(localStorage.getItem("jj_favorites") || "[]");

    function normalize(str) {
        if (!str) return "";
        return str.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();
    }

    // 4. Inicializar Métricas
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

    // 5. Poblar el Selector de Casas
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

    // 6. Generar Índice Alfabético
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
            if (hasHouses) {
                btn.addEventListener("click", () => jumpToLetter(letter));
            }
            alphabetIndex.appendChild(btn);
        });
    }

    function jumpToLetter(letter) {
        const normLetter = letter.toLowerCase();
        const houseHeaders = document.querySelectorAll(".house-group");
        for (const group of houseHeaders) {
            const titleEl = group.querySelector(".house-title");
            if (titleEl && normalize(titleEl.textContent).startsWith(normLetter)) {
                group.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
        }
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        const normText = normalize(text);
        const normQuery = normalize(query);
        const idx = normText.indexOf(normQuery);
        if (idx === -1) return text;
        const originalMatch = text.substr(idx, query.length);
        return `${text.substring(0, idx)}<mark class="search-highlight">${originalMatch}</mark>${text.substring(idx + query.length)}`;
    }

    // 8. Renderizado del Catálogo
    function renderCatalog() {
        if (!container) return;
        container.innerHTML = "";
        const normSearch = normalize(searchTerm);
        const normNote = normalize(activeNote);

        const filtered = catalogData.filter(item => {
            let matchesGender = true;
            if (activeGenders.size > 1 || !activeGenders.has("all")) {
                const gender = item.gender.toLowerCase();
                matchesGender = (activeGenders.has("Hombre") && gender.includes("hombre")) ||
                                (activeGenders.has("Mujer") && gender.includes("mujer")) ||
                                (activeGenders.has("Unisex") && gender.includes("unisex"));
            }
            const matchesHouse = activeHouse === "all" || item.house === activeHouse;
            let matchesFavorites = true;
            if (favoritesOnly) {
                matchesFavorites = favorites.some(f => f.name === item.name && f.house === item.house);
            }
            let matchesNoteChip = true;
            if (activeNote !== "all") {
                matchesNoteChip = normalize(item.notes).includes(normNote);
            }
            let matchesSearch = true;
            if (normSearch) {
                matchesSearch = normalize(item.name).includes(normSearch) ||
                                normalize(item.house).includes(normSearch) ||
                                normalize(item.notes).includes(normSearch);
            }
            return matchesGender && matchesHouse && matchesNoteChip && matchesSearch && matchesFavorites;
        });

        updateSummaryBar(filtered.length);

        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-results-box">
                <h3 class="no-results-title">No se encontraron fragancias</h3>
                <p class="no-results-text">No encontramos coincidencias. Intente con otro nombre o casa.</p>
                <button type="button" class="no-results-btn" id="emptyStateResetBtn">Ver Todo el Catálogo</button>
            </div>`;
            const emptyBtn = document.getElementById("emptyStateResetBtn");
            if (emptyBtn) emptyBtn.addEventListener("click", resetAllFilters);
            return;
        }

        const grouped = {};
        filtered.forEach(p => {
            if (!grouped[p.house]) grouped[p.house] = [];
            grouped[p.house].push(p);
        });

        const fragment = document.createDocumentFragment();
        Object.keys(grouped).sort().forEach(houseName => {
            const perfumesInHouse = grouped[houseName];
            const houseGroup = document.createElement("section");
            houseGroup.className = "house-group";
            houseGroup.id = `house-${normalize(houseName).replace(/[^a-z0-9]/g, "-")}`;
            houseGroup.innerHTML = `<div class="house-header">
                <h2 class="house-title">${highlightMatch(houseName, searchTerm)}</h2>
                <span class="house-count">${perfumesInHouse.length} ${perfumesInHouse.length === 1 ? 'fragancia' : 'fragancias'}</span>
            </div>`;

            const gridDiv = document.createElement("div");
            gridDiv.className = "perfumes-grid";

            perfumesInHouse.forEach(perfume => {
                const card = document.createElement("article");
                card.className = "perfume-card" + (perfume.image ? " has-image" : "");
                card.tabIndex = 0;
                card.setAttribute("role", "button");

                const isFav = favorites.some(f => f.name === perfume.name && f.house === perfume.house);
                card.innerHTML = `
                    ${perfume.image ? `<div class="card-image-box"><img src="${perfume.image}" class="card-bottle-img" loading="lazy" /></div>` : ''}
                    <button class="favorite-btn ${isFav ? 'active' : ''}" data-name="${perfume.name}" data-house="${perfume.house}">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                    <div class="card-top">
                        <div class="card-header-left">
                            <span class="card-house-micro">${perfume.house}</span>
                            <h3 class="perfume-name">${highlightMatch(perfume.name, searchTerm)}</h3>
                        </div>
                        <span class="gender-badge badge-${perfume.gender}">${perfume.gender}</span>
                    </div>
                    <p class="card-notes">${highlightMatch(perfume.notes, searchTerm)}</p>
                    <div class="card-footer">
                        <span class="card-extract-label">Extracto Concentrado</span>
                        <span class="card-view-notes-btn">Ver Ficha &rarr;</span>
                    </div>
                `;

                card.querySelector(".favorite-btn").addEventListener("click", (e) => {
                    e.stopPropagation();
                    toggleFavorite(perfume);
                });
                card.addEventListener("click", () => openPerfumeModal(perfume));
                gridDiv.appendChild(card);
            });
            houseGroup.appendChild(gridDiv);
            fragment.appendChild(houseGroup);
        });
        container.appendChild(fragment);
        observeCards();
    }

    function updateSummaryBar(matchCount) {
        if (!resultsCounter) return;
        resultsCounter.textContent = matchCount === catalogData.length ?
            `Mostrando catálogo completo (${matchCount} fragancias)` :
            `Mostrando ${matchCount} de ${catalogData.length} fragancias`;

        activeFiltersContainer.innerHTML = "";
        let hasFilters = false;
        if (searchTerm) {
            hasFilters = true;
            addActiveFilterTag(`Búsqueda: "${searchTerm}"`, () => {
                searchTerm = ""; searchInput.value = ""; clearSearchBtn.classList.remove("visible"); renderCatalog();
            });
        }
        if (activeGenders.size > 1 || !activeGenders.has("all")) {
            hasFilters = true;
            addActiveFilterTag(`Géneros: ${Array.from(activeGenders).filter(g => g !== "all").join(", ")}`, () => setGenderFilter("all"));
        }
        if (activeHouse !== "all") {
            hasFilters = true;
            addActiveFilterTag(`Casa: ${activeHouse}`, () => {
                activeHouse = "all"; houseSelect.value = "all"; renderCatalog();
            });
        }
        if (activeNote !== "all") {
            hasFilters = true;
            addActiveFilterTag(`Acorde: ${activeNote}`, () => setNoteChip("all"));
        }
        if (resetFiltersBtn) resetFiltersBtn.style.display = hasFilters ? "inline-block" : "none";
    }

    function addActiveFilterTag(label, callback) {
        const tag = document.createElement("span");
        tag.className = "active-tag";
        tag.innerHTML = `${label} <span style="cursor:pointer;margin-left:4px;">&times;</span>`;
        tag.addEventListener("click", callback);
        activeFiltersContainer.appendChild(tag);
    }

    function setGenderFilter(gender) {
        if (gender === "all") {
            activeGenders.clear(); activeGenders.add("all");
        } else {
            if (activeGenders.has("all")) activeGenders.delete("all");
            if (activeGenders.has(gender)) {
                activeGenders.delete(gender);
                if (activeGenders.size === 0) activeGenders.add("all");
            } else {
                activeGenders.add(gender);
            }
        }
        genderFilterBtns.forEach(btn => {
            const g = btn.getAttribute("data-gender");
            btn.classList.toggle("active", g === "all" ? (activeGenders.size === 1) : activeGenders.has(g));
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
        searchTerm = ""; activeGenders.clear(); activeGenders.add("all");
        activeHouse = "all"; activeNote = "all"; favoritesOnly = false;
        if (searchInput) searchInput.value = "";
        if (clearSearchBtn) clearSearchBtn.classList.remove("visible");
        if (houseSelect) houseSelect.value = "all";
        genderFilterBtns.forEach(btn => btn.classList.toggle("active", btn.getAttribute("data-gender") === "all"));
        if (document.getElementById("favoritesFilterBtn")) document.getElementById("favoritesFilterBtn").classList.remove("active");
        olfactoryChips.forEach(chip => chip.classList.toggle("active", chip.getAttribute("data-note") === "all"));
        renderCatalog();
    }

    function initLightbox() {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="imageLightbox" class="lightbox" aria-hidden="true" role="dialog">
                <img src="" alt="Vista detallada" />
                <span class="lightbox-close">&times;</span>
            </div>
        `);
        const lb = document.getElementById("imageLightbox");
        const lbImg = lb.querySelector("img");
        lb.addEventListener("click", (e) => {
            if (e.target === lb || e.target.classList.contains("lightbox-close")) {
                lb.classList.remove("active");
                lb.setAttribute("aria-hidden", "true");
                document.body.style.overflow = "";
            }
        });
        return {
            open: (src) => {
                lbImg.src = src;
                lb.classList.add("active");
                lb.setAttribute("aria-hidden", "false");
                document.body.style.overflow = "hidden";
            }
        };
    }

    const lightbox = initLightbox();

    function openPerfumeModal(perfume) {
        if (!perfumeModal) return;
        modalHouse.textContent = perfume.house;
        modalPerfumeName.textContent = perfume.name;
        modalGender.textContent = perfume.gender;
        modalGender.className = `gender-badge badge-${perfume.gender}`;
        modalNotes.textContent = perfume.notes;
        if (perfume.image) {
            if (modalCard) modalCard.classList.add("has-image");
            if (modalBottleStage) modalBottleStage.style.display = "flex";
            if (modalBottleImg) {
                modalBottleImg.src = perfume.image;
                modalBottleImg.onclick = () => lightbox.open(perfume.image);
            }
        } else {
            if (modalCard) modalCard.classList.remove("has-image");
            if (modalBottleStage) modalBottleStage.style.display = "none";
        }
        modalTagsContainer.innerHTML = "";
        perfume.notes.split(/[,.;]/).map(s => s.trim()).filter(Boolean).slice(0, 8).forEach(tag => {
            const span = document.createElement("span");
            span.className = "modal-tag";
            span.textContent = tag;
            modalTagsContainer.appendChild(span);
        });
        perfumeModal.classList.add("active");
        perfumeModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closePerfumeModal() {
        if (perfumeModal) {
            perfumeModal.classList.remove("active");
            perfumeModal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        }
    }

    // Events
    searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value.trim();
        clearSearchBtn.classList.toggle("visible", searchTerm.length > 0);
        renderCatalog();
    });

    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = ""; searchTerm = ""; clearSearchBtn.classList.remove("visible"); renderCatalog();
    });

    houseSelect.addEventListener("change", (e) => {
        activeHouse = e.target.value; renderCatalog();
    });

    genderFilterBtns.forEach(btn => {
        if (btn.id === "favoritesFilterBtn") return;
        btn.addEventListener("click", () => setGenderFilter(btn.getAttribute("data-gender")));
    });

    const favFilterBtn = document.getElementById("favoritesFilterBtn");
    if (favFilterBtn) {
        favFilterBtn.addEventListener("click", () => {
            favoritesOnly = !favoritesOnly;
            favFilterBtn.classList.toggle("active", favoritesOnly);
            renderCatalog();
        });
    }

    olfactoryChips.forEach(chip => {
        chip.addEventListener("click", () => setNoteChip(chip.getAttribute("data-note")));
    });

    if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", resetAllFilters);

    if (viewGridBtn && viewListBtn) {
        viewGridBtn.addEventListener("click", () => {
            activeView = "grid"; viewGridBtn.classList.add("active"); viewListBtn.classList.remove("active");
            container.classList.remove("list-mode");
        });
        viewListBtn.addEventListener("click", () => {
            activeView = "list"; viewListBtn.classList.add("active"); viewGridBtn.classList.remove("active");
            container.classList.add("list-mode");
        });
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closePerfumeModal);
    if (modalFooterCloseBtn) modalFooterCloseBtn.addEventListener("click", closePerfumeModal);
    perfumeModal.addEventListener("click", (e) => { if (e.target === perfumeModal) closePerfumeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePerfumeModal(); });

    if (controlsToggle) {
        controlsToggle.addEventListener("click", () => controlsSection.classList.toggle("minimized"));
    }

    window.addEventListener("scroll", () => {
        if (backToTopBtn) backToTopBtn.classList.toggle("visible", window.scrollY > 350);
    }, { passive: true });
    if (backToTopBtn) backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // --- Animation Logic ---
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });

    function observeCards() {
        document.querySelectorAll('.perfume-card').forEach(card => {
            card.classList.add('reveal');
            revealObserver.observe(card);
        });
    }

    // Final Initialization
    try {
        initMetrics();
        populateHouseSelect();
        generateAlphabetIndex();
        renderCatalog();
        console.log("Catalog initialized successfully.");
    } catch (error) {
        console.error("Initialization error:", error);
    }
});

function toggleFavorite(perfume) {
    let favorites = JSON.parse(localStorage.getItem("jj_favorites") || "[]");
    const index = favorites.findIndex(f => f.name === perfume.name && f.house === perfume.house);
    if (index === -1) {
        favorites.push({ name: perfume.name, house: perfume.house });
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem("jj_favorites", JSON.stringify(favorites));
    document.querySelectorAll(".perfume-card").forEach(card => {
        const favBtn = card.querySelector(".favorite-btn");
        if (favBtn) {
            const name = favBtn.getAttribute("data-name");
            const house = favBtn.getAttribute("data-house");
            favBtn.classList.toggle("active", favorites.some(f => f.name === name && f.house === house));
        }
    });
}
