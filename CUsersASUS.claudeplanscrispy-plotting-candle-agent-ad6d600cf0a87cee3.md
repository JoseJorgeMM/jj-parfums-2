# Implementation Plan: J.J PARFUMS Hero Section Overhaul

## Vision: "Haute Couture Digital Experience"
Transform the landing experience into a high-end, cinematic introduction using a three-layer architectural system, staggered animations, and depth-based parallax.

## 1. HTML Structural Changes (`index.html`)
Restructure the `<header>` content within `.header-container` to support independent parallax layers and editorial layout.

**Current Structure:**
- `.header-container`
  - `.brand-emblem`
  - `.brand-title`
  - `.brand-subtitle`
  - `.brand-slogan-container`
  - `.brand-tagline`
  - `.header-badges`
  - `.divider-gold`

**New Structure:**
- `.header-container`
  - `<div class="layer-core">`
    - `.brand-emblem`
    - `.brand-title`
    - `.brand-subtitle`
  - `</div>`
  - `<div class="layer-editorial">`
    - `<div class="slogan-wrapper">`
      - `<div class="gold-accent-line"></div>`
      - `.brand-slogan`
    - `</div>`
  - `</div>`
  - `<div class="layer-grounding">`
    - `.brand-tagline`
    - `.header-badges`
    - `.divider-gold`
  - `</div>`

## 2. CSS Implementation (`assets/css/style.css`)

### A. Layout & Layering
- Update `.header-container` to `position: relative`.
- Set `.layer-core`, `.layer-editorial`, and `.layer-grounding` to `position: absolute` or `relative` with specific z-indexing to ensure the "depth" effect.
- **Editorial Slogan**: 
  - Position `.slogan-wrapper` to the right on desktop (e.g., `margin-left: auto; text-align: right;`).
  - Implement `.gold-accent-line` as a `div` with `width: 2px`, `background: var(--gold-gradient)`, and `position: absolute` to the left of the slogan.

### B. Cinematic Animations
- **The 'Curtain' Reveal**:
  - Modify `.brand-title` animation.
  - Keyframes `curtainReveal`:
    - `0%`: `letter-spacing: 20px`, `opacity: 0`, `filter: blur(10px)`.
    - `100%`: `letter-spacing: 8px`, `opacity: 1`, `filter: blur(0)`.
- **Staggered Timeline**:
  - Video: `animation-delay: 0s`
  - Emblem: `animation-delay: 0.4s`
  - Title: `animation-delay: 0.7s`
  - Slogan: `animation-delay: 1.2s`
  - Badges: `animation-delay: 1.6s`
- **Gold Accent Animation**:
  - `accentLineReveal`: Animate `height` from `0` to `auto` or a fixed height (e.g., `40px`).

### C. Spotlight Mask
- Update `.hero-overlay` to use a radial gradient that creates a "spotlight" effect on the center branding:
  - `background: radial-gradient(circle at center, rgba(9, 10, 13, 0.2) 0%, rgba(9, 10, 13, 0.8) 70%, var(--bg-body) 100%);`

### D. Responsive Strategy (< 768px)
- Center all layers (`text-align: center`).
- Transform `.gold-accent-line` from `width: 2px; height: 40px` to `width: 40px; height: 2px`.
- Reset `.slogan-wrapper` alignment to center.

## 3. JS Logic (`assets/js/script.js`)

### A. Parallax Depth Handler
Implement a scroll listener that applies `translateY` to the layers based on their multipliers.
```javascript
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const core = document.querySelector('.layer-core');
    const editorial = document.querySelector('.layer-editorial');
    const grounding = document.querySelector('.layer-grounding');
    
    if (core) core.style.transform = `translateY(${scrolled * 0.1}px)`;
    if (editorial) editorial.style.transform = `translateY(${scrolled * 0.3}px)`;
    if (grounding) grounding.style.transform = `translateY(${scrolled * 0.5}px)`;
}, { passive: true });
```

### B. Ambient Luxury Particles
Create a simple particle system that generates small gold dots floating slowly in the background.
- Generate 15-20 `div` elements with `position: absolute`, `border-radius: 50%`, and `background: var(--gold-primary)`.
- Use CSS animations for random floating movement (slow `translateY` and `translateX`).

## 4. Verification Plan
- **Visual Audit**: Verify the radial "spotlight" mask centers on the brand title.
- **Timing Audit**: Use Browser DevTools (Animations tab) to confirm the stagger sequence: Video $\to$ Emblem $\to$ Title $\to$ Slogan $\to$ Badges.
- **Parallax Test**: Scroll slowly and ensure the Grounding layer moves faster than the Core layer, creating a 3D depth effect.
- **Responsive Test**: Shrink window to < 768px and verify the slogan accent line flips from vertical to horizontal and elements center.
- **Performance Check**: Ensure the parallax `translateY` updates don't cause layout thrashing (use `will-change: transform` on layers).

### Critical Files for Implementation:
- `index.html`
- `assets/css/style.css`
- `assets/js/script.js`
