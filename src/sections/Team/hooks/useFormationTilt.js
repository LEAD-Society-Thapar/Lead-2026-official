/**
 * useFormationTilt.js — v4
 *
 * DESIGN INTENT
 * ─────────────
 * The formation should be readable before any interaction.
 * Every row is a single coordinated structure — not four independent cards.
 * Hover temporarily resolves the formation's natural tension before
 * it settles back. The motion communicates weight, not speed.
 *
 * DEPTH ARCHITECTURE (six layered cues — none dominant alone)
 * ───────────────────────────────────────────────────────────
 *   1. rotateY          — smooth four-card arc (5.5° / 2.5° / 2.5° / 5.5°)
 *   2. scale            — size gradient (edge 0.973, inner 0.988 → 1.0)
 *   3. shadow-x         — lateral shadow tracks rotation direction
 *   4. transform-origin — edge cards pivot from outer boundary (CSS)
 *   5. portrait filter  — edge cards 2% more contrast (CSS)
 *   6. glass depth      — edge cards slightly richer background (CSS)
 *
 * HOVER CHOREOGRAPHY
 * ──────────────────
 *   Edge hover:
 *     t=0ms    hovered card begins rotating to 0°, translates inward
 *     t=55ms   adjacent card (dist 1) leans toward hovered side
 *     t=110ms  next card (dist 2) acknowledges
 *     t=165ms  opposite edge: barely perceptible sympathetic lean
 *     → entire row settles as a unit, then relaxes on cursor leave
 *
 *   Inner hover:
 *     t=0ms    inner card: no self-response
 *     t=55ms   edge cards lean very gently inward (closed formation)
 *
 *   On leave:
 *     All cards return to idle immediately (no stagger — clean dissolution)
 *
 * SPRING PHYSICS
 * ──────────────
 *   Formation values (ry, tx, scale) use a critically-near spring instead
 *   of pure lerp. This produces a tiny physical "settle" at rest position
 *   without bounce — the motion feels like it has weight, not machinery.
 *   Damping ratio ≈ 0.78 (slightly underdamped) → ~1-2% overshoot.
 *
 *   Mouse tracking uses pure lerp (responsive, no overshoot needed).
 *
 * LEFT / RIGHT PERSONALITY
 * ─────────────────────────
 *   Left edge: damping -2 (slightly more elastic, settles a touch looser)
 *   Right edge: damping +1 (marginally snappier, clicks into place)
 *   This is nearly imperceptible but creates a sense that the two
 *   anchors have distinct character without breaking symmetry.
 *
 * CSS VARS WRITTEN (on tilt-wrapper div, cascade to children)
 * ────────────────────────────────────────────────────────────
 *   --card-rx         X rotation (mouse vertical tilt)
 *   --card-ry         Y rotation (idle arc + formation response + mouse)
 *   --form-scale      Depth scale (idle gradient + hover response)
 *   --formation-tx    Horizontal inward slide
 *   --shadow-x        Lateral shadow (tracks ry for physical grounding)
 *   --shadow-y        Vertical shadow (tracks mouse Y)
 *   --portrait-tx/ty  Portrait parallax (mouse only)
 *   --body-tx/ty      Text parallax
 *   --divider-tx      Divider parallax
 *   --socials-tx/ty   Socials parallax
 *   --light-x/y       Specular light position
 *   --light-opacity   Specular light visibility
 */

import { useRef, useEffect } from 'react';

// ── Timing ────────────────────────────────────────────────────────────────────
const L_FAST = 0.08;   // mouse tracking — stays responsive

// ── Spring parameters ─────────────────────────────────────────────────────────
// DT assumes ~60fps. Spring produces tiny settle on formation transitions.
// DAMPING at 17 → damping ratio ≈ 0.78 (underdamped) → ~1.5% overshoot.
const DT               = 1 / 60;
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING   = 17;    // base — overridden per position for personality

// ── Mouse limits ──────────────────────────────────────────────────────────────
const MAX_ROT   = 1.8;   // degrees
const MAX_SHIFT = 6;     // px — internal parallax ceiling

// ── Idle formation arc ────────────────────────────────────────────────────────
// Four-card gradient: 5.5° / 2.5° / 2.5° / 5.5°
// The 2.5° inner lean fills the gap that made the previous arc feel stepped.
// The formation now reads as one curved plane, not two leaning edges.
const IDLE_ROT_OUTER = 5.5;   // positions 0 and 3
const IDLE_ROT_INNER = 2.5;   // positions 1 and 2 — fills the gradient

// Scale gradient reinforces the depth arc through perceived size.
// Edge 2.7% smaller → reads as further back. Inner: 1.2% smaller.
const IDLE_SCALE_OUTER = 0.973;
const IDLE_SCALE_INNER = 0.988;

// ── Response stagger (ripple) ─────────────────────────────────────────────────
// On hover enter: each card responds with a delay proportional to its distance
// from the hovered card. Creates choreographed ripple, not simultaneous reaction.
// On hover leave: all cards return to idle immediately (clean dissolution).
const STAGGER_MS = 55;  // ms delay per unit of distance

// ── Hover choreography ────────────────────────────────────────────────────────
const EDGE_TX          = 20;   // edge card inward slide (px) — slightly bolder
const CONVERGENCE_ROT  = 1.1;  // neighbor lean toward hovered edge (degrees)
const INNER_EDGE_LEAN  = 0.8;  // edge lean inward when inner card hovered

// ── Shadow ────────────────────────────────────────────────────────────────────
const SHADOW_X_SCALE = 2.2;   // px shadow-x per degree of total ry

// ── Parallax depths ───────────────────────────────────────────────────────────
const D_PORTRAIT = 0.60;
const D_TEXT     = 0.25;
const D_DIVIDER  = 0.40;
const D_SOCIALS  = 0.45;

// ── Utilities ─────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

// Verlet spring step — produces physically-grounded motion with tiny settle.
// Underdamped by design: the card "clicks" into rest rather than gliding.
function spring(pos, vel, target, stiffness, damping) {
  const acc    = (target - pos) * stiffness - vel * damping;
  const newVel = vel + acc * DT;
  return { pos: pos + newVel * DT, vel: newVel };
}

// ── Formation geometry ────────────────────────────────────────────────────────

// Returns idle Y rotation — smooth 4-card arc.
// The gradient is now 5.5° / 2.5° / 2.5° / 5.5° instead of 5.5° / 0.9° / 0.9° / 5.5°.
// This makes the formation arc continuously readable, not a step function.
function computeIdleRy(pos, size) {
  if (pos === 0)          return -IDLE_ROT_OUTER;
  if (pos === size - 1)   return  IDLE_ROT_OUTER;
  if (pos === 1)          return -IDLE_ROT_INNER;
  if (pos === size - 2)   return  IDLE_ROT_INNER;
  return 0;
}

// Returns idle scale — depth gradient that reinforces rotation arc.
function computeIdleScale(pos, size) {
  if (pos === 0 || pos === size - 1) return IDLE_SCALE_OUTER;
  if (pos === 1 || pos === size - 2) return IDLE_SCALE_INNER;
  return 1.0;
}

// Left / right personality: tiny damping variation.
// Left edge: slightly looser (settles a touch more elastic)
// Right edge: marginally snappier (clicks into place)
// The difference is nearly imperceptible but gives each anchor distinct character.
function computeDamping(pos, size) {
  if (pos === 0)        return SPRING_DAMPING - 2;  // left: more elastic
  if (pos === size - 1) return SPRING_DAMPING + 1;  // right: marginally snappier
  return SPRING_DAMPING;
}

// Stagger delay in ms for hover-enter ripple.
// Hover leave always returns at 0ms (clean dissolution).
function computeDelay(pos, size, hov) {
  if (hov === -1 || pos === hov) return 0;
  return Math.abs(pos - hov) * STAGGER_MS;
}

// Formation response deltas when another card in this row is hovered.
// Returns { ry, tx, scale } — all deltas to ADD to idle base values.
function computeFormationResponse(pos, size, hov) {
  if (hov === -1) return { ry: 0, tx: 0, scale: 0 };

  const isLeftEdge  = hov === 0;
  const isRightEdge = hov === size - 1;
  const isEdge      = isLeftEdge || isRightEdge;

  // ── Hovered card self-response ─────────────────────────────────────────
  if (pos === hov) {
    if (isEdge) {
      const idle_ry    = computeIdleRy(pos, size);
      const idle_scale = computeIdleScale(pos, size);
      return {
        ry:    -idle_ry,                              // rotate to perpendicular
        tx:    isLeftEdge ? EDGE_TX : -EDGE_TX,       // step inward
        scale: 1.0 - idle_scale,                     // restore to full size
      };
    }
    return { ry: 0, tx: 0, scale: 0 };
  }

  // ── Non-hovered card response ──────────────────────────────────────────
  const dist    = Math.abs(pos - hov);
  const falloff = Math.max(0, 1 - dist * 0.36);

  if (isEdge) {
    // Entire row converges toward hovered edge — the formation turns as a unit
    const toward = isLeftEdge ? 1 : -1;
    return {
      ry:    toward * CONVERGENCE_ROT * falloff,
      tx:    toward * 3.5 * falloff,
      scale: 0,
    };
  }

  // Inner card hovered → edges acknowledge by leaning gently inward
  if (pos === 0)        return { ry:  INNER_EDGE_LEAN * falloff, tx: 0, scale: 0 };
  if (pos === size - 1) return { ry: -INNER_EDGE_LEAN * falloff, tx: 0, scale: 0 };
  return { ry: 0, tx: 0, scale: 0 };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFormationTilt(
  reducedMotion   = false,
  positionIndex   = 0,
  rowSize         = 4,
  hoveredIndexRef = null,
) {
  const cardRef = useRef(null);

  // All mutable animation state — never causes React re-renders.
  // Pre-initialised to the idle formation values so first paint is correct.
  const s = useRef(null);
  if (!s.current) {
    const initRy    = computeIdleRy(positionIndex, rowSize);
    const initScale = computeIdleScale(positionIndex, rowSize);
    s.current = {
      // Spring-driven (ry, scale, tx)
      ry: initRy, vel_ry: 0,
      scale: initScale, vel_scale: 0,
      tx: 0, vel_tx: 0,

      // Lerp-driven (mouse + light + shadow)
      rx: 0,
      mouse_ry: 0, mouse_ry_raw: 0,
      lx: 50, ly: 50, lo: 0,
      sy: 0,
      t_lx: 50, t_ly: 50, t_sy: 0,

      // Formation state
      lastHoveredIdx:  -1,
      formResp:        { ry: 0, tx: 0, scale: 0 },

      // Timing handles
      raf:             null,
      pollTid:         null,
      responseDelayTid: null,

      // Mouse active flag
      active: false,
    };
  }

  useEffect(() => {
    if (reducedMotion) return;

    const card = cardRef.current;
    if (!card) return;

    const st = s.current;
    const damping = computeDamping(positionIndex, rowSize);

    // Write initial idle state immediately — no first-frame pop.
    card.style.setProperty('--card-ry',    `${st.ry.toFixed(3)}deg`);
    card.style.setProperty('--form-scale',  st.scale.toFixed(4));

    // ── Property flush — all CSS vars in one pass ────────────────────────
    function flush() {
      const ry = st.ry;

      card.style.setProperty('--card-rx',      `${st.rx.toFixed(3)}deg`);
      card.style.setProperty('--card-ry',      `${ry.toFixed(3)}deg`);
      card.style.setProperty('--form-scale',    st.scale.toFixed(4));
      card.style.setProperty('--formation-tx', `${st.tx.toFixed(2)}px`);

      // Shadow x tracks rotation for physical grounding of the 3D lean
      const sx = ry * -SHADOW_X_SCALE;
      card.style.setProperty('--shadow-x', `${sx.toFixed(1)}px`);
      card.style.setProperty('--shadow-y', `${st.sy.toFixed(2)}px`);

      // Parallax uses ONLY mouse_ry (not idle or formation) — text always
      // feels anchored to the cursor, not to the formation rotation
      const mry = st.mouse_ry;
      card.style.setProperty('--portrait-tx', `${(mry * -D_PORTRAIT * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      card.style.setProperty('--portrait-ty', `${(st.rx *  D_PORTRAIT * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      card.style.setProperty('--body-tx',     `${(mry * -D_TEXT     * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      card.style.setProperty('--body-ty',     `${(st.rx *  D_TEXT    * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      card.style.setProperty('--divider-tx',  `${(mry * -D_DIVIDER  * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      card.style.setProperty('--socials-tx',  `${(mry * -D_SOCIALS  * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      card.style.setProperty('--socials-ty',  `${(st.rx *  D_SOCIALS * MAX_SHIFT / MAX_ROT).toFixed(2)}px`);
      card.style.setProperty('--light-x',     `${st.lx.toFixed(1)}%`);
      card.style.setProperty('--light-y',     `${st.ly.toFixed(1)}%`);
      card.style.setProperty('--light-opacity', st.lo.toFixed(3));
    }

    // ── Animation tick ────────────────────────────────────────────────────
    function tick() {
      const idle_ry    = computeIdleRy(positionIndex, rowSize);
      const idle_scale = computeIdleScale(positionIndex, rowSize);
      const resp       = st.formResp;

      // Formation + mouse targets
      const t_ry    = idle_ry    + resp.ry    + st.mouse_ry_raw;
      const t_scale = idle_scale + resp.scale;
      const t_tx    = resp.tx;

      // Spring-driven: ry, scale, tx — physical settle feel
      const sr = spring(st.ry,    st.vel_ry,    t_ry,    SPRING_STIFFNESS, damping);
      st.ry = sr.pos; st.vel_ry = sr.vel;

      const ss = spring(st.scale, st.vel_scale, t_scale, SPRING_STIFFNESS, damping * 1.4);
      st.scale = ss.pos; st.vel_scale = ss.vel;

      const stx = spring(st.tx, st.vel_tx, t_tx, SPRING_STIFFNESS * 0.85, damping * 0.9);
      st.tx = stx.pos; st.vel_tx = stx.vel;

      // Lerp-driven: mouse, light, shadow — stays responsive
      st.rx       = lerp(st.rx,  st.active ? clamp(st.mouse_ry_raw * -0.28, -MAX_ROT, MAX_ROT) : 0, L_FAST);
      st.mouse_ry = lerp(st.mouse_ry, st.mouse_ry_raw, L_FAST);
      st.lx       = lerp(st.lx, st.active ? st.t_lx : 50,   L_FAST);
      st.ly       = lerp(st.ly, st.active ? st.t_ly : 50,   L_FAST);
      st.lo       = lerp(st.lo, st.active ? 0.055  : 0,     L_FAST);
      st.sy       = lerp(st.sy, st.active ? st.t_sy : 0,    L_FAST);

      flush();

      // ── Settle check ─────────────────────────────────────────────────
      const EPS = 0.003;
      const settled =
        Math.abs(st.vel_ry)     < 0.01  && Math.abs(st.ry    - t_ry)    < EPS   &&
        Math.abs(st.vel_scale)  < 0.0005 && Math.abs(st.scale - t_scale) < 0.0003 &&
        Math.abs(st.vel_tx)     < 0.08  && Math.abs(st.tx    - t_tx)    < 0.2   &&
        Math.abs(st.lo)         < 0.001;

      if (settled && !st.active) {
        st.raf = null;
        return; // self-terminate
      }
      st.raf = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!st.raf) st.raf = requestAnimationFrame(tick);
    }

    // ── Formation watcher (20fps — 50ms setTimeout) ───────────────────────
    // Detects row hover changes and dispatches staggered responses.
    // Hover-enter: staggered by distance (ripple).
    // Hover-leave: immediate for all cards (clean dissolution).
    function watchFormation() {
      const hov = hoveredIndexRef?.current ?? -1;

      if (hov !== st.lastHoveredIdx) {
        st.lastHoveredIdx = hov;
        clearTimeout(st.responseDelayTid);

        if (hov === -1) {
          // Leave: immediate — all cards snap to idle in sync
          st.formResp = { ry: 0, tx: 0, scale: 0 };
          startLoop();
        } else {
          const delay = computeDelay(positionIndex, rowSize, hov);
          if (delay === 0) {
            st.formResp = computeFormationResponse(positionIndex, rowSize, hov);
            startLoop();
          } else {
            st.responseDelayTid = setTimeout(() => {
              st.formResp = computeFormationResponse(positionIndex, rowSize, hov);
              startLoop();
            }, delay);
          }
        }
      }

      st.pollTid = setTimeout(watchFormation, 50);
    }
    st.pollTid = setTimeout(watchFormation, 50);

    // ── Mouse events ──────────────────────────────────────────────────────
    function onMouseMove(e) {
      const rect = card.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
      st.mouse_ry_raw = clamp(nx * MAX_ROT, -MAX_ROT, MAX_ROT);
      st.t_lx = ((e.clientX - rect.left) / rect.width)  * 100;
      st.t_ly = ((e.clientY - rect.top)  / rect.height) * 100;
      st.t_sy = ny * 5;
    }

    function onMouseEnter() {
      st.active = true;
      startLoop();
    }

    function onMouseLeave() {
      st.active        = false;
      st.mouse_ry_raw  = 0;
      startLoop();
    }

    card.addEventListener('mousemove',  onMouseMove);
    card.addEventListener('mouseenter', onMouseEnter);
    card.addEventListener('mouseleave', onMouseLeave);

    return () => {
      card.removeEventListener('mousemove',  onMouseMove);
      card.removeEventListener('mouseenter', onMouseEnter);
      card.removeEventListener('mouseleave', onMouseLeave);
      if (st.raf)              cancelAnimationFrame(st.raf);
      if (st.pollTid)          clearTimeout(st.pollTid);
      if (st.responseDelayTid) clearTimeout(st.responseDelayTid);
      st.raf = null; st.pollTid = null; st.responseDelayTid = null;
    };
  }, [reducedMotion, positionIndex, rowSize, hoveredIndexRef]);

  return cardRef;
}
