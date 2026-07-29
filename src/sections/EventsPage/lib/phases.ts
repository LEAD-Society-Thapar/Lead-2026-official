import { PHASE } from './constants';

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

/** Hermite smoothstep between two edges. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Back ease-out with overshoot — used for the content-card micro-snap. */
export function easeOutBack(t: number, overshoot = 1.6) {
  const c1 = overshoot;
  const c3 = c1 + 1;
  const p = clamp(t);
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

// --- Phase readouts derived from a single progress value ------------------

/** Alternating horizontal shear of the rows (0 → none, 1 → full grind). */
export function getShear(progress: number) {
  const rise = smoothstep(PHASE.shearStart, PHASE.shearEnd, progress);
  // Shear relaxes once the barrel takes over.
  const fall = 1 - smoothstep(PHASE.warpStart, PHASE.warpEnd, progress);
  return rise * fall;
}

/** Flat grid → 3D barrel (0 → flat, 1 → fully wrapped). */
export function getWarp(progress: number) {
  return smoothstep(PHASE.warpStart, PHASE.warpEnd, progress);
}

/** Continuous barrel rotation amount, in turns. */
export function getSpin(progress: number) {
  return smoothstep(PHASE.spinStart, 1, progress);
}

/** Opacity/scale of the DOM pill-grid overlay (1 → covering, 0 → gone). */
export function getPillReveal(progress: number) {
  return smoothstep(PHASE.pillStart, PHASE.pillEnd, progress);
}
