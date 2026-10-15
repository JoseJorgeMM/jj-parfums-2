/**
 * J.J PARFUMS - Catálogo Exclusivo
 * Versión Profesional con Favoritos y Lightbox
 */

// --- ESTADO GLOBAL ---
var state = {
    favorites: JSON.parse(localStorage.getItem("jj_favorites") || "[]"),
    favoritesOnly: false,
    activeHouse: "all",
    searchTerm: "",
    activeGenders: ["all"]
};

// --- INICIALIZACIÓN DE UI ---
function initUI() {
    // Manejo de Video Responsivo (PC vs Móvil)
    var heroVideo = document.getElementById("heroVideo");
    if (heroVideo) {
        function updateVideoSource() {
            var isMobile = window.innerWidth <= 768;
            var source = isMobile ? "img/herovertical.mp4" : "img/hero.mp4";
            if (heroVideo.src !== source) {
                heroVideo.src = source;
                heroVideo.load();
            }
        }
        updateVideoSource();
        window.addEventListener("resize", updateVideoSource);
    }

    // Efecto de Brillo de Fondo
    var glow = document.getElementById("bgGlow");

    if (glow) {
        window.addEventListener("mousemove", function(e) {
            glow.style.left = e.clientX + "px";
            glow.style.top = e.clientY + "px";
        });
    }

    // Efectos Parallax del Hero
    var layers = {
        core: document.querySelector(".layer-core"),
        editorial: document.querySelector(".layer-editorial"),
        grounding: document.querySelector(".layer-grounding")
    };
    window.addEventListener("scroll", function() {
        var scrolled = window.pageYOffset;
        if (layers.core) layers.core.style.transform = "translateY(" + (scrolled * 0.1) + "px)";
        if (layers.editorial) layers.editorial.style.transform = "translateY(" + (scrolled * 0.3) + "px)";
        if (layers.grounding) layers.grounding.style.transform = "translateY(" + (scrolled * 0.5) + "px)";
    });

    // Inyectar Lightbox al final del body
    var lightbox = document.createElement("div");
    lightbox.id = "imageLightbox";
    lightbox.className = "lightbox";
    lightbox.innerHTML = '<div class="lightbox-overlay"><img src="" id="lightboxImg" alt="Vista ampliada"><span class="lightbox-close">&times;</span></div>';
    document.body.appendChild(lightbox);

    lightbox.addEventListener("click", function() {
        lightbox.classList.remove("active");
    });
}

// --- LÓGICA DE FAVORITOS ---
function toggleFavorite(perfumeId) {
    console.log("Toggling favorite for:", perfumeId);
    var index = state.favorites.indexOf(perfumeId);
    if (index === -1) {
        state.favorites.push(perfumeId);
    } else {
        state.favorites.splice(index, 1);
    }
    localStorage.setItem("jj_favorites", JSON.stringify(state.favorites));
    window.renderCatalog();
}

// --- MODAL Y LIGHTBOX ---
function openPerfumeModal(perfume) {
    console.log("Opening modal for:", perfume.name);
    var modal = document.getElementById("perfumeModal");
    var img = document.getElementById("modalBottleImg");
    var name = document.getElementById("modalPerfumeName");
    var house = document.getElementById("modalHouse");
    var gender = document.getElementById("modalGender");
    var notes = document.getElementById("modalNotes");

    if (!modal) {
        console.error("Modal element not found");
        return;
    }

    name.textContent = perfume.name;
    house.textContent = perfume.house;
    gender.textContent = perfume.gender;
    notes.textContent = perfume.notes;

    var imgPath = (perfume && perfume.image) ? perfume.image : "";
    img.src = imgPath;

    document.getElementById("modalBottleStage").style.display = "block";
    modal.style.display = "flex";
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    img.onclick = function() {
        var lb = document.getElementById("imageLightbox");
        var lbImg = document.getElementById("lightboxImg");
        lbImg.src = img.src;
        lb.classList.add("active");
    };
}

function closePerfumeModal() {
    var modal = document.getElementById("perfumeModal");
    if (modal) {
        modal.style.display = "none";
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
    }
}

// --- RENDERIZADO DEL CATÁLOGO ---
window.renderCatalog = function() {
    var container = document.getElementById("catalogContainer");
    var resultsCounter = document.getElementById("resultsCounter");
    if (!container) return;

    container.innerHTML = "";

    var filtered = catalogData.filter(function(p) {
        var matchesSearch = !state.searchTerm ||
                            (p.name && p.name.toLowerCase().indexOf(state.searchTerm) !== -1) ||
                            (p.house && p.house.toLowerCase().indexOf(state.searchTerm) !== -1);
        var matchesHouse = state.activeHouse === "all" || p.house === state.activeHouse;

        var matchesGender = state.activeGenders.indexOf("all") !== -1 ||
                            state.activeGenders.indexOf(p.gender) !== -1;

        var id = p.id || p.name;
        var matchesFavs = !state.favoritesOnly || (id && state.favorites.indexOf(id) !== -1);

        return matchesSearch && matchesHouse && matchesGender && matchesFavs;
    });

    // --- ACTUALIZACIÓN DE CONTADORES DE GÉNERO ---
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

    if (resultsCounter) {
        resultsCounter.textContent = "Mostrando " + filtered.length + " fragancias";
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">No se encontraron fragancias que coincidan con los filtros.</div>';
        return;
    }

    var grouped = {};
    filtered.forEach(function(p) {
        if (!grouped[p.house]) grouped[p.house] = [];
        grouped[p.house].push(p);
    });

    var sortedHouses = Object.keys(grouped).sort(function(a, b) {
        return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
    });
    sortedHouses.forEach(function(houseName) {
        var section = document.createElement("section");
        section.className = "house-group";
        section.innerHTML = '<div class="house-header"><h2 class="house-title">' + houseName + '</h2></div>';

        var grid = document.createElement("div");
        grid.className = "perfumes-grid";

        grouped[houseName].forEach(function(p) {
            var id = p.id || p.name;
            var isFav = (id && state.favorites.indexOf(id) !== -1);
            var card = document.createElement("article");
            card.className = "perfume-card";

            var imgPath = p.image || "";

            card.innerHTML =
                '<div class="card-top">' +
                    '<button class="favorite-btn ' + (isFav ? 'active' : '') + '" title="Añadir a favoritos">' +
                        (isFav ? '❤️' : '🤍') +
                    '</button>' +
                '</div>' +
                '<div class="card-image-box">' +
                    '<img src="' + imgPath + '" alt="' + p.name + '" class="card-bottle-img">' +
                '</div>' +
                '<div class="card-info">' +
                    '<div class="card-header-left">' +
                        '<span class="card-house-micro">' + p.house + '</span>' +
                        '<h3 class="perfume-name">' + p.name + '</h3>' +
                        '<span class="gender-badge badge-' + p.gender + '">' + p.gender + '</span>' +
                    '</div>' +
                    '<p class="card-notes">' + p.notes + '</p>' +
                '</div>' +
                '<div class="card-footer">' +
                    '<button class="card-view-notes-btn" onclick="openPerfumeModal(' + JSON.stringify(p).replace(/"/g, '&quot;') + ')">Ver Detalles</button>' +
                    '<span class="card-extract-label">Extracto Puro</span>' +
                '</div>';

            card.onclick = function() {
                openPerfumeModal(p);
            };

            var favBtn = card.querySelector(".favorite-btn");
            if (favBtn) {
                favBtn.onclick = function(e) {
                    e.stopPropagation();
                    toggleFavorite(id);
                };
            }

            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    });
};

// --- EVENTOS DE DOCUMENTO ---
document.addEventListener("DOMContentLoaded", function() {
    initUI();

    var searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            state.searchTerm = this.value.toLowerCase();
            window.renderCatalog();
        });
    }

    var houseSelect = document.getElementById("houseSelect");
    if (houseSelect) {
        var houses = [...new Set(catalogData.map(p => p.house))].sort();
        houses.forEach(h => {
            var opt = document.createElement("option");
            opt.value = h;
            opt.textContent = h;
            houseSelect.appendChild(opt);
        });

        houseSelect.addEventListener("change", function() {
            state.activeHouse = this.value;
            window.renderCatalog();
        });
    }

    var genderBtns = document.querySelectorAll(".filter-btn");
    genderBtns.forEach(btn => {
        btn.addEventListener("click", function() {
            var filter = this.getAttribute("data-filter");
            var gender = this.getAttribute("data-gender");

            if (filter === "favorites") {
                // Al activar favoritos, desactivamos todo lo demás para evitar conflictos
                state.favoritesOnly = !state.favoritesOnly;
                this.classList.toggle("active");

                if (state.favoritesOnly) {
                    state.activeGenders = ["all"];
                    genderBtns.forEach(b => {
                        if (b.getAttribute("data-gender")) b.classList.remove("active");
                    });
                }
            } else if (gender) {
                // Al seleccionar un género, desactivamos el filtro de favoritos
                if (gender === "all") {
                    state.activeGenders = ["all"];
                    genderBtns.forEach(b => {
                        if (b.getAttribute("data-gender")) b.classList.remove("active");
                    });
                    this.classList.add("active");
                } else {
                    state.favoritesOnly = false;
                    var favBtn = document.getElementById("favoritesFilterBtn");
                    if (favBtn) favBtn.classList.remove("active");

                    if (state.activeGenders.indexOf("all") !== -1) {
                        state.activeGenders = [];
                    }

                    if (state.activeGenders.indexOf(gender) === -1) {
                        state.activeGenders.push(gender);
                        this.classList.add("active");
                    } else {
                        // DESACTIVAR: Si ya estaba seleccionado, lo quitamos
                        state.activeGenders = state.activeGenders.filter(function(g) { return g !== gender; });
                        this.classList.remove("active");

                        // Si no queda ningún género seleccionado, volvemos a "all"
                        if (state.activeGenders.length === 0) {
                            state.activeGenders = ["all"];
                            genderBtns.forEach(b => {
                                if (b.getAttribute("data-gender") === "all") b.classList.add("active");
                            });
                        }
                    }
                }
                window.renderCatalog();
            }
        });
    });

    var closeBtns = [
        document.getElementById("modalCloseBtn"),
        document.getElementById("modalFooterCloseBtn")
    ];
    closeBtns.forEach(btn => {
        if (btn) btn.onclick = closePerfumeModal;
    });

    window.renderCatalog();
});
