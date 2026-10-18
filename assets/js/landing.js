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
});
