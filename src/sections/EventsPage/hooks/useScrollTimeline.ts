import { useEffect } from 'react';

type ScrollCallback = (progress: number) => void;

// --- Capsule hit-test geometry (must match PillOpening / InteractiveGrid) ---
const PILL_H = 0.78; // capsule height as a fraction of the viewport
const PILL_ASPECT = 0.42; // width : height of the at-rest capsule

// --- Scrub feel ------------------------------------------------------------
// Quarter speed: the reveal takes ~4x more scrolling, so the event cards stay
// on screen long enough to actually be read.
const WHEEL_SENSITIVITY = 0.000175; // wheel px → progress delta
const TOUCH_SENSITIVITY = 0.00045; // touch px → progress delta
const LERP = 7; // higher = snappier catch-up to the target
// The events section must be at least this visible before a capsule-hover
// scroll is allowed to *start* opening it (prevents accidental yank-in).
const ENGAGE_VISIBILITY = 0.6;

// --- Snap-to-node ------------------------------------------------------------
// When a capsule scrub engages, the page glides so the section sits dead-centre.
// Purely cosmetic: it runs alongside the scrub and never blocks input.
const SNAP_LERP = 6; // glide speed toward the node
const SNAP_EPS = 0.5; // px — close enough to pin exactly

/** True when (px, py) sits inside the centred vertical capsule (stadium). */
function inCapsule(px: number, py: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ph = h * PILL_H;
  const pw = Math.max(ph * PILL_ASPECT, 1);
  const rx = pw / 2;
  const ry = ph / 2;
  const dx = Math.abs(px - w / 2);
  const dy = Math.abs(py - h / 2);
  if (dx > rx) return false;
  const straightHalf = Math.max(ry - rx, 0);
  if (dy <= straightHalf) return true; // straight middle section
  const ddy = dy - straightHalf; // rounded cap
  return dx * dx + ddy * ddy <= rx * rx;
}

/** How much of the events section currently fills the viewport, 0..1. */
function eventsVisibility() {
  const sec = document.getElementById('events');
  if (!sec) return 1;
  const r = sec.getBoundingClientRect();
  const vh = window.innerHeight;
  const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
  return Math.max(0, Math.min(1, visible / vh));
}

/** Signed px offset between the section's current position and dead-centre. */
function centerOffset(): number {
  const sec = document.getElementById('events');
  if (!sec) return 0;
  const rect = sec.getBoundingClientRect();
  return rect.top - (window.innerHeight - rect.height) / 2;
}

/**
 * Capsule-gated scroll driver for the events segment of the one-page site.
 *
 * Wheel/touch input is captured only when the cursor is inside the central
 * capsule and the events section is sufficiently visible. While captured,
 * input scrubs the reveal (0..1). At either end, control returns to the page.
 */
export function useScrollTimeline(onProgress: ScrollCallback) {
  useEffect(() => {
    let mode: 'idle' | 'scrub' = 'idle';
    let target = 0;
    let current = 0;
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };

    /** Handle one scroll delta (px, +down). Returns true if it was captured. */
    const consume = (deltaPx: number, sensitivity: number): boolean => {
      const down = deltaPx > 0;

      if (mode === 'idle') {
        // Engage only on a capsule hover with the section sufficiently in view,
        // and only in the direction that has room to play (down, from closed).
        if (!inCapsule(pointer.x, pointer.y)) return false;
        if (eventsVisibility() < ENGAGE_VISIBILITY) return false;
        if (!down && target <= 0.001) return false; // scrolling up from closed
        if (down && target >= 0.999) return false; // scrolling down from open

        mode = 'scrub'; // go straight to scrubbing, no centering
      }

      // mode === 'scrub'
      const next = target + deltaPx * sensitivity;
      if (next >= 1 && down) {
        target = 1;
        mode = 'idle'; // fully open — release the page downward
        return true;
      }
      if (next <= 0 && !down) {
        target = 0;
        mode = 'idle'; // fully closed — release the page upward
        return true;
      }
      target = Math.min(1, Math.max(0, next));
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (consume(e.deltaY, WHEEL_SENSITIVITY)) e.preventDefault();
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      pointer.x = e.touches[0].clientX;
      pointer.y = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = touchY - y; // finger up (scroll down) → positive
      touchY = y;
      pointer.x = e.touches[0].clientX;
      pointer.y = y;
      if (consume(dy, TOUCH_SENSITIVITY)) e.preventDefault();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Reset once the section has fully left the viewport so it always
      // re-opens fresh the next time it scrolls back in.
      if (eventsVisibility() <= 0.02) {
        mode = 'idle';
        target = 0;
        current = 0;
      } else {
        // Snap-to-node: while a scrub is active, glide the page so the capsule
        // sits dead-centre. Runs in parallel with the scrub — never blocks it.
        if (mode === 'scrub') {
          const off = centerOffset();
          if (Math.abs(off) > SNAP_EPS) {
            window.scrollBy(0, off * Math.min(1, dt * SNAP_LERP));
          } else if (off !== 0) {
            window.scrollBy(0, off);
          }
        }

        current += (target - current) * Math.min(1, dt * LERP);
        if (Math.abs(target - current) < 0.0005) current = target;
      }

      onProgress(current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [onProgress]);
}
