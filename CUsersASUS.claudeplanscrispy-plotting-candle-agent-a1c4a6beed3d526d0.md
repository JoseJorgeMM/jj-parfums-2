# Implementation Plan: Cinematic Luxury Header & 3D Parallax Effect

This plan describes the transformation of the `<header>` into a high-end cinematic experience with restructured HTML, advanced CSS animations, and a JS-driven 3D parallax effect.

## 1. HTML Restructuring (`index.html`)

The current `.header-container` will be replaced with a `hero-grid-container` to separate functional branding areas.

### Changes:
- **Wrap existing header content** (inside `.header-container`) into a new `.hero-grid-container`.
- **Divide into three functional areas**:
    1. `.hero-brand-main` (Left/Center): Contains the `.brand-emblem` and `.brand-title`.
    2. `.hero-brand-narrative` (Right/Center): Contains the `.brand-subtitle`, `.brand-slogan-container`, and `.brand-tagline`.
    3. `.hero-proof-section` (Bottom): Contains the `.header-badges` and `.divider-gold`.
- **Add Parallax Layers**: Wrap these areas in layer divs (e.g., `.parallax-layer-core`, `.parallax-layer-editorial`, `.parallax-layer-grounding`) to allow independent movement in JS.

## 2. CSS Animations & Layout (`assets/css/style.css`)

### New Layout Rules:
- **`.hero-grid-container`**: CSS Grid layout. 
    - Desktop: 2-column layout (Main Brand | Narrative) with a full-width bottom row for the Proof section.
    - Mobile (<768px): Single column centered stack.
- **`.gold-accent-line`**: A decorative line that is vertical on desktop (separating Main and Narrative) and horizontal on mobile.

### Cinematic Animations:
- **Curtain Reveal (`.brand-title`)**: 
    - Keyframes that animate `letter-spacing` from an expanded state (e.g., `20px`) down to the final `8px`.
- **Cinematic Timeline (Staggered Delays)**:
    - Video: `0s`
    - Emblem: `0.4s`
    - Title: `0.8s`
    - Slogan: `1.2s`
    - Badges: `1.6s`
- **Spotlight Mask**:
    - A radial gradient overlay on the `.header` that creates a focused "spotlight" effect on the branding, fading into the darkness of the background.

### Luxury Details:
- **Living Gold Particles**: CSS-based particles (or a small SVG overlay) with a floating animation to simulate gold dust in the air.
- **Pull-Quote Slogan**: Style `.brand-slogan` with exaggerated left/right quotes and a more refined typographic scale.

## 3. JavaScript Parallax Logic (`assets/js/script.js`)

Implement a scroll listener to create a depth effect (3D Parallax).

### Logic Specification:
- **Listener**: `window.addEventListener('scroll', ...)`
- **Multipliers**:
    - **Core Layer** (Emblem, Title): `translateY = scrollY * 0.2`
    - **Editorial Layer** (Slogan, Tagline): `translateY = scrollY * 0.4`
    - **Grounding Layer** (Badges, Divider): `translateY = scrollY * 0.6`
- **Application**: Update the `transform: translateY()` property of each layer in real-time using `requestAnimationFrame` for performance.

## 4. Verification & Testing

### Desktop Testing:
- [ ] Verify staggered animation sequence on page load.
- [ ] Confirm `letter-spacing` animation for the brand title.
- [ ] Test 3D parallax depth by scrolling; layers should move at different speeds.
- [ ] Ensure the radial spotlight mask is centered.

### Mobile Testing (<768px):
- [ ] Confirm layout collapses to a centered vertical stack.
- [ ] Verify the gold accent line shifts from vertical to horizontal.
- [ ] Ensure animations remain smooth and do not cause layout shifts.
- [ ] Verify parallax effect is either subtly adjusted or disabled for performance on low-end mobile devices.

## Critical Files for Implementation:
- `index.html`
- `assets/css/style.css`
- `assets/js/script.js`
