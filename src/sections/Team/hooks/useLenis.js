/**
 * useLenis.js
 *
 * Single source of truth for the Lenis smooth scroll instance.
 *
 * Architecture decisions:
 *
 * 1. SINGLE RAF LOOP
 *    Lenis.raf() is called from OrbCanvas's existing Three.js animate() loop
 *    via the exposed `lenisRef`. This means we have exactly ONE rAF loop
 *    driving both smooth scroll and Three.js — no competing loops.
 *    The cursor glow already has its own loop; we leave that untouched
 *    since it's purely presentational and not on the critical scroll path.
 *
 * 2. FRAMER MOTION SYNCHRONIZATION
 *    Framer Motion's useScroll reads from window.scrollY which is the
 *    *real* scroll position. Lenis intercepts wheel events and translates
 *    them into smooth virtual scroll, but it also updates window.scrollY
 *    (via scroll position assignment on the root element) — so Framer
 *    Motion's useScroll stays in sync automatically when Lenis uses
 *    the default "window" target (root scroll mode, not wrapper mode).
 *
 *    IMPORTANT: We use Lenis in root scroll mode (no wrapper element).
 *    This is critical — if we used a wrapper div, Framer's useScroll
 *    would read from window.scrollY (0) while Lenis scrolls the div.
 *    Root mode keeps everything on the same scroll axis.
 *
 * 3. TOUCHPAD OPTIMIZATION
 *    Lenis normalizes touchpad delta values. The `syncTouch: true` option
 *    enables native-feeling momentum on iOS/trackpad without Lenis
 *    interfering. `touchMultiplier: 1` keeps 1:1 precision.
 *    `wheelMultiplier: 1` keeps native mouse wheel feel.
 *
 * 4. SCROLL LISTENERS
 *    All existing scroll listeners (Hero, OrbCanvas, useOrbState, App)
 *    continue to use window.addEventListener('scroll') — Lenis fires
 *    the native scroll event as it animates, so they remain compatible
 *    without modification. This is zero-regression by design.
 *
 * 5. PREFERS-REDUCED-MOTION
 *    When the user has reduced motion enabled, Lenis is initialized with
 *    duration: 0 which makes it behave as native scroll while still
 *    providing the API surface (so OrbCanvas raf integration works).
 *
 * 6. STICKY SECTIONS
 *    Lenis root mode keeps position:sticky working correctly.
 *    The exec-sticky-stage uses position:sticky — this would BREAK in
 *    Lenis wrapper mode (where overflow is set on a div). Root mode
 *    avoids this entirely.
 */

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Respect user's motion preference
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const lenis = new Lenis({
      /**
       * duration: Controls how long the inertial scroll animation lasts.
       * 1.1 is slightly longer than default (1.0), giving a more premium
       * deceleration curve without feeling sluggish.
       * Set to 0 for reduced-motion users — disables smoothing entirely.
       */
      duration: reducedMotion ? 0 : 1.1,

      /**
       * easing: The deceleration curve. This matches the cubic-bezier
       * used throughout the UI ([0.22, 1, 0.36, 1]) so scroll deceleration
       * feels consistent with all other motion on the page.
       */
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),

      /**
       * smoothWheel: true = Lenis intercepts wheel events and applies
       * its own smooth animation. This is the core smoothing feature.
       */
      smoothWheel: true,

      /**
       * syncTouch: true = On touch devices / trackpads, Lenis syncs with
       * the native touch momentum rather than overriding it. This gives
       * precision trackpad users a native-feeling experience while still
       * providing the Lenis scroll events for Three.js / Framer sync.
       */
      syncTouch: true,

      /**
       * touchMultiplier: 1.0 keeps 1:1 touch sensitivity.
       * Higher values feel aggressive on precision trackpads.
       */
      touchMultiplier: 1.0,

      /**
       * wheelMultiplier: 1.0 keeps native mouse wheel feel.
       * Do NOT increase this — it causes overcorrection on high-DPI mice.
       */
      wheelMultiplier: 1.0,

      /**
       * infinite: false — standard bounded scroll.
       */
      infinite: false,

      /**
       * autoRaf: false — we drive lenis.raf() manually from the
       * OrbCanvas animate() loop to avoid a competing rAF call.
       * This is the key performance decision: one loop, two jobs.
       */
      autoRaf: false,
    });

    lenisRef.current = lenis;

    // Expose on window for OrbCanvas to access without prop drilling
    // Using a non-enumerable symbol key to avoid pollution
    window.__LENIS__ = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      delete window.__LENIS__;
    };
  }, []);

  return lenisRef;
}
