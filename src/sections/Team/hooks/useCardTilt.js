/**
 * useCardTilt.js
 *
 * Ultra-subtle 3D hover tilt for executive cards.
 *
 * Architecture decisions:
 *
 * 1. ZERO REACT STATE
 *    All values are lerped in a RAF loop and written directly to
 *    CSS custom properties on the card element. No useState, no
 *    useMotionValue, no re-renders during mouse movement.
 *
 * 2. SINGLE RAF PER CARD (not per-frame global)
 *    The RAF loop is started on mouseenter and cancelled after the
 *    exit return animation completes (~350ms). Between hovers the
 *    loop is completely idle — no wasted frames.
 *
 * 3. CSS CUSTOM PROPERTIES AS THE BRIDGE
 *    The card's CSS reads:
 *      --card-rx, --card-ry   → card rotation (perspective transform)
 *      --portrait-tx, --ty    → portrait parallax translate
 *      --body-tx, --body-ty   → text block parallax translate
 *      --divider-tx           → divider parallax translate
 *      --socials-tx           → socials parallax translate
 *      --light-x, --light-y   → light highlight position (%)
 *      --light-opacity        → highlight visibility
 *      --shadow-y             → shadow vertical offset adjustment
 *
 * 4. LERP FACTOR = 0.08
 *    Provides heavy damping — the card settles in ~350ms with
 *    no spring, no overshoot, no elastic movement.
 *    Apple cards typically use 0.06–0.10.
 *
 * 5. PREFERS-REDUCED-MOTION
 *    Checked once at hook init. If reduced motion is active,
 *    the hook returns a no-op — zero overhead.
 *
 * 6. MAX ROTATION = 2.5°
 *    Hard-clamped. Never reaches 3°.
 *
 * 7. LAYER PARALLAX MULTIPLIERS
 *    Portrait: 0.6  → max ±3.6px internal shift
 *    Text:     0.25 → max ±1.5px
 *    Divider:  0.40 → max ±2.4px
 *    Socials:  0.45 → max ±2.7px
 *    Maximum internal movement per layer: 6px (brief requirement)
 */

import { useRef, useEffect } from 'react';

const MAX_ROT   = 1.8;   // degrees — hard ceiling
const MAX_SHIFT = 6;     // px — max internal parallax
const LERP      = 0.06;  // damping factor — softer, more organic settling

// Layer depth multipliers
const D_PORTRAIT = 0.60;
const D_TEXT     = 0.25;
const D_DIVIDER  = 0.40;
const D_SOCIALS  = 0.45;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export function useCardTilt(reducedMotion = false) {
  const cardRef     = useRef(null);
  const stateRef    = useRef({
    // Current (interpolated) values
    rx: 0, ry: 0,
    lx: 50, ly: 50, lo: 0,
    sy: 0,
    // Target values
    trx: 0, try: 0,
    tlx: 50, tly: 50, tlo: 0,
    tsy: 0,
    // RAF handle + active flag
    raf: null,
    active: false,
  });

  useEffect(() => {
    // Bail immediately — no handlers attached, zero overhead
    if (reducedMotion) return;

    const card = cardRef.current;
    if (!card) return;

    const s = stateRef.current;

    /* ── Helpers ─────────────────────────────────────────────── */

    function setProps() {
      const el = card;
      // Card 3D rotation
      el.style.setProperty('--card-rx', `${s.rx.toFixed(3)}deg`);
      el.style.setProperty('--card-ry', `${s.ry.toFixed(3)}deg`);
      // Portrait parallax
      el.style.setProperty('--portrait-tx', `${(s.ry * -D_PORTRAIT * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      el.style.setProperty('--portrait-ty', `${(s.rx *  D_PORTRAIT * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      // Text parallax
      el.style.setProperty('--body-tx', `${(s.ry * -D_TEXT * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      el.style.setProperty('--body-ty', `${(s.rx *  D_TEXT * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      // Divider parallax (horizontal only — vertical looks wrong on a line)
      el.style.setProperty('--divider-tx', `${(s.ry * -D_DIVIDER * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      // Socials parallax
      el.style.setProperty('--socials-tx', `${(s.ry * -D_SOCIALS * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      el.style.setProperty('--socials-ty', `${(s.rx *  D_SOCIALS * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      // Light highlight
      el.style.setProperty('--light-x',  `${s.lx.toFixed(1)}%`);
      el.style.setProperty('--light-y',  `${s.ly.toFixed(1)}%`);
      el.style.setProperty('--light-opacity', s.lo.toFixed(3));
      // Shadow offset
      el.style.setProperty('--shadow-y', `${s.sy.toFixed(2)}px`);
    }

    function tick() {
      const threshold = 0.002; // stop lerping when values are this close

      s.rx = lerp(s.rx, s.trx, LERP);
      s.ry = lerp(s.ry, s.try, LERP);
      s.lx = lerp(s.lx, s.tlx, LERP);
      s.ly = lerp(s.ly, s.tly, LERP);
      s.lo = lerp(s.lo, s.tlo, LERP);
      s.sy = lerp(s.sy, s.tsy, LERP);

      setProps();

      // Keep looping if any value is still moving meaningfully
      const settled =
        Math.abs(s.rx - s.trx) < threshold &&
        Math.abs(s.ry - s.try) < threshold &&
        Math.abs(s.lo - s.tlo) < 0.001;

      if (settled && !s.active) {
        // Exit animation complete — stop loop
        cancelAnimationFrame(s.raf);
        s.raf = null;
      } else {
        s.raf = requestAnimationFrame(tick);
      }
    }

    /* ── Mouse move ──────────────────────────────────────────── */

    function onMouseMove(e) {
      const rect = card.getBoundingClientRect();
      // Normalised coordinates: –1 → +1 from card center
      const nx = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
      const ny = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;

      // Rotation: rotateX is driven by vertical position (inverted — top = tilt back)
      //           rotateY is driven by horizontal position
      s.trx = clamp(-ny * MAX_ROT, -MAX_ROT, MAX_ROT);
      s.try = clamp( nx * MAX_ROT, -MAX_ROT, MAX_ROT);

      // Light position: follows cursor directly (in %)
      s.tlx = ((e.clientX - rect.left) / rect.width)  * 100;
      s.tly = ((e.clientY - rect.top)  / rect.height) * 100;
      s.tlo = 0.05; // max 5% opacity

      // Shadow: mouse near top → shorter (negative offset), near bottom → longer
      // ny is –1 (top) to +1 (bottom) — we want top = –4px, bottom = +4px
      s.tsy = ny * 4;
    }

    /* ── Enter ───────────────────────────────────────────────── */

    function onMouseEnter() {
      s.active = true;
      if (!s.raf) {
        s.raf = requestAnimationFrame(tick);
      }
    }

    /* ── Leave ───────────────────────────────────────────────── */

    function onMouseLeave() {
      s.active = false;
      // Return all targets to zero
      s.trx = 0; s.try = 0;
      s.tlx = 50; s.tly = 50; s.tlo = 0;
      s.tsy = 0;
      // Loop continues until values settle (then self-terminates above)
      if (!s.raf) {
        s.raf = requestAnimationFrame(tick);
      }
    }

    card.addEventListener('mousemove',  onMouseMove);
    card.addEventListener('mouseenter', onMouseEnter);
    card.addEventListener('mouseleave', onMouseLeave);

    return () => {
      card.removeEventListener('mousemove',  onMouseMove);
      card.removeEventListener('mouseenter', onMouseEnter);
      card.removeEventListener('mouseleave', onMouseLeave);
      if (s.raf) {
        cancelAnimationFrame(s.raf);
        s.raf = null;
      }
    };
  }, [reducedMotion]);

  return cardRef;
}
