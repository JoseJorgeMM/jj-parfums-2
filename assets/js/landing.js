/* ==========================================================================
   J.J PARFUMS - LANDING PAGE OFICIAL
   Interacciones, Video Responsivo de Alto Impacto, Acordeón FAQ y WhatsApp
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Manejo y Reproducción de Video Responsivo (PC vs Móvil)
  var heroVideo = document.getElementById('landingHeroVideo');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.setAttribute('playsinline', '');
    heroVideo.setAttribute('muted', '');

    function updateLandingVideo() {
      var isMobile = window.innerWidth <= 768;
      var targetSource = isMobile ? 'img/herovertical.mp4' : 'img/hero.mp4';
      var currentSource = heroVideo.currentSrc || heroVideo.getAttribute('src') || '';

      if (currentSource.indexOf(targetSource) === -1) {
        heroVideo.src = targetSource;
        heroVideo.load();
      }

      var playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          // Si las políticas estrictas del navegador esperan interacción
          var forcePlay = function () {
            heroVideo.muted = true;
            heroVideo.play();
            window.removeEventListener('click', forcePlay);
            window.removeEventListener('touchstart', forcePlay);
            window.removeEventListener('scroll', forcePlay);
          };
          window.addEventListener('click', forcePlay, { once: true, passive: true });
          window.addEventListener('touchstart', forcePlay, { once: true, passive: true });
          window.addEventListener('scroll', forcePlay, { once: true, passive: true });
        });
      }
    }

    updateLandingVideo();
    window.addEventListener('resize', debounce(updateLandingVideo, 300));
  }

  // 2. Efecto de Resplandor Dinámico con Mouse (Desktop)
  var glow = document.getElementById('landingBgGlow');
  if (glow && window.innerWidth > 768) {
    window.addEventListener('mousemove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  }

  // 3. Acordeón Interactivo de FAQ
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-question-btn');
    var panel = item.querySelector('.faq-answer-panel');

    if (btn && panel) {
      btn.addEventListener('click', function () {
        var isActive = item.classList.contains('active');

        // Cerrar los demás acordeones para mantener orden visual
        faqItems.forEach(function (otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            var otherPanel = otherItem.querySelector('.faq-answer-panel');
            if (otherPanel) otherPanel.style.maxHeight = null;
          }
        });

        if (!isActive) {
          item.classList.add('active');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
          item.classList.remove('active');
          panel.style.maxHeight = null;
        }
      });
    }
  });

  // Abrir el primer FAQ por defecto para invitar a la lectura
  if (faqItems.length > 0) {
    var firstItem = faqItems[0];
    var firstPanel = firstItem.querySelector('.faq-answer-panel');
    firstItem.classList.add('active');
    if (firstPanel) {
      firstPanel.style.maxHeight = firstPanel.scrollHeight + 'px';
    }
  }

  // 4. Utilidad Debounce para Resize
  function debounce(func, wait) {
    var timeout;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(context, args);
      }, wait);
    };
  }

  // 4b. Menú Móvil de Lujo (Accesible: Esc, clic fuera, foco gestionado)
  (function initMobileMenu() {
    var toggle = document.getElementById('mobileMenuToggle');
    var drawer = document.getElementById('mobileMenuDrawer');
    var backdrop = document.getElementById('mobileMenuBackdrop');

    if (!toggle || !drawer) return;

    var lastFocusedElement = null;

    function isMenuOpen() {
      return document.body.classList.contains('menu-open');
    }

    function openMenu() {
      lastFocusedElement = document.activeElement;
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú de navegación');
      drawer.setAttribute('aria-hidden', 'false');
      if (backdrop) backdrop.setAttribute('aria-hidden', 'false');

      // Mover el foco al primer enlace para navegar con teclado
      var firstLink = drawer.querySelector('a');
      if (firstLink) {
        window.setTimeout(function () { firstLink.focus(); }, 300);
      }
    }

    function closeMenu(returnFocus) {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú de navegación');
      drawer.setAttribute('aria-hidden', 'true');
      if (backdrop) backdrop.setAttribute('aria-hidden', 'true');

      if (returnFocus) {
        var target = (lastFocusedElement && lastFocusedElement !== document.body) ? lastFocusedElement : toggle;
        target.focus();
      }
    }

    toggle.addEventListener('click', function () {
      if (isMenuOpen()) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    // Cerrar al hacer clic sobre un enlace del menú
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        closeMenu(false);
      }
    });

    // Cerrar al hacer clic en el fondo oscuro
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        closeMenu(true);
      });
    }

    // Cerrar con la tecla Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isMenuOpen()) {
        closeMenu(true);
      }
    });

    // Si la pantalla crece a desktop, resetear el estado sin mover el foco
    window.addEventListener('resize', debounce(function () {
      if (window.innerWidth > 992 && isMenuOpen()) {
        closeMenu(false);
      }
    }, 200));
  })();

  // 5. Carrusel y Filtros de Los Más Pedidos (Hombre y Mujer)
  (function initBestSellersCarousel() {
    var track = document.getElementById('bestSellersTrack');
    var viewport = document.getElementById('bestSellersViewport');
    var prevBtn = document.getElementById('bestSellersPrev');
    var nextBtn = document.getElementById('bestSellersNext');
    var dotsContainer = document.getElementById('bestSellersDots');
    var filterBtns = document.querySelectorAll('.filter-pill-btn');

    if (!track || !viewport) return;

    var allCards = Array.from(track.querySelectorAll('.best-seller-card'));
    var currentIndex = 0;
    var currentFilter = 'all';
    var autoPlayTimer = null;
    var isHovered = false;

    function getVisibleCards() {
      return allCards.filter(function (card) {
        return !card.classList.contains('hidden-card');
      });
    }

    function getCardsPerView() {
      var w = window.innerWidth;
      if (w <= 640) return 1;
      if (w <= 992) return 2;
      return 3;
    }

    function getMaxIndex() {
      var visible = getVisibleCards();
      var perView = getCardsPerView();
      return Math.max(0, visible.length - perView);
    }

    function updateCarousel() {
      var visible = getVisibleCards();
      var maxIdx = getMaxIndex();
      if (currentIndex > maxIdx) currentIndex = maxIdx;
      if (currentIndex < 0) currentIndex = 0;

      var perView = getCardsPerView();
      var cardWidth = visible[0] ? visible[0].offsetWidth : 300;
      var gap = 22;
      var offset = currentIndex * (cardWidth + gap);

      if (window.innerWidth <= 640) {
        viewport.scrollTo({
          left: offset,
          behavior: 'smooth'
        });
      } else {
        track.style.transform = 'translateX(-' + offset + 'px)';
      }

      updateDots();

      if (prevBtn) prevBtn.style.opacity = currentIndex === 0 ? '0.35' : '1';
      if (nextBtn) nextBtn.style.opacity = currentIndex >= maxIdx ? '0.35' : '1';
    }

    function createDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      var maxIdx = getMaxIndex();
      var totalDots = maxIdx + 1;

      for (var i = 0; i < totalDots; i++) {
        (function (idx) {
          var dot = document.createElement('span');
          dot.className = 'carousel-dot' + (idx === currentIndex ? ' active' : '');
          dot.setAttribute('role', 'button');
          dot.setAttribute('aria-label', 'Ir a diapositiva ' + (idx + 1));
          dot.addEventListener('click', function () {
            currentIndex = idx;
            updateCarousel();
          });
          dotsContainer.appendChild(dot);
        })(i);
      }
    }

    function updateDots() {
      if (!dotsContainer) return;
      var dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach(function (d, idx) {
        if (idx === currentIndex) {
          d.classList.add('active');
        } else {
          d.classList.remove('active');
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        var maxIdx = getMaxIndex();
        if (currentIndex < maxIdx) {
          currentIndex++;
        } else {
          currentIndex = 0;
        }
        updateCarousel();
      });
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter') || 'all';
        if (filter === currentFilter) return;

        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = filter;

        allCards.forEach(function (card) {
          var gender = card.getAttribute('data-gender');
          if (filter === 'all' || gender === filter || (filter === 'mujer' && gender === 'unisex') || (filter === 'hombre' && gender === 'unisex')) {
            card.classList.remove('hidden-card');
          } else {
            card.classList.add('hidden-card');
          }
        });

        currentIndex = 0;
        createDots();
        updateCarousel();
      });
    });

    var touchStartX = 0;
    var touchEndX = 0;
    viewport.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      var threshold = 40;
      if (Math.abs(diff) > threshold) {
        var maxIdx = getMaxIndex();
        if (diff > 0 && currentIndex < maxIdx) {
          currentIndex++;
        } else if (diff < 0 && currentIndex > 0) {
          currentIndex--;
        }
        updateCarousel();
      }
    }, { passive: true });

    function startAutoplay() {
      stopAutoplay();
      autoPlayTimer = setInterval(function () {
        if (!isHovered) {
          var maxIdx = getMaxIndex();
          if (currentIndex < maxIdx) {
            currentIndex++;
          } else {
            currentIndex = 0;
          }
          updateCarousel();
        }
      }, 5500);
    }

    function stopAutoplay() {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
    }

    var wrapper = document.querySelector('.carousel-wrapper');
    if (wrapper) {
      wrapper.addEventListener('mouseenter', function () { isHovered = true; });
      wrapper.addEventListener('mouseleave', function () { isHovered = false; });
    }

    createDots();
    updateCarousel();
    startAutoplay();

    window.addEventListener('resize', debounce(function () {
      createDots();
      updateCarousel();
    }, 250));
  })();
});
