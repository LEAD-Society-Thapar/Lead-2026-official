// ---------------------------------------------------------------------------
// Global constants for the WORK scroll experience.
// All scroll-driven choreography reads a single `progress` value in [0, 1].
// ---------------------------------------------------------------------------

export const COLORS = {
  red: '#080404',
  redDeep: '#1a1a1a',
  black: '#ffffff',
  pageRed: '#0a0a0a',
  gridLine: 'rgba(255, 255, 255, 0.55)',
  white: '#f6f4ef',
} as const;

/** The glyphs that build every row, cycled E → V → E → N → T. */
export const LETTERS = ['E', 'V', 'E', 'N', 'T'] as const;

/** Local font — bundled so troika never depends on a runtime network fetch. */
export const FONT_URL = '/fonts/Anton-Regular.ttf';

// --- Cylinder / barrel geometry -------------------------------------------
/** Letters per row (odd so a glyph sits exactly on the x=0 centre line). */
export const PER_ROW = 15;
/** Total rings stacked around the barrel (multiple of 4 → clean WORK cycles). */
export const RINGS = 12;
/** Which ring index sits closest to centre at rest (1.5 → W,O,R,K straddle 0). */
export const RING_CENTER = 1.5;

/** Vertical radius of the barrel (controls how fast rings dive over the top). */
export const RADIUS_Y = 4.6;
/** Bow radius along a row (gentle horizontal curve / foreshortening). */
export const RADIUS_X = 9.5;
/** Angular gap between stacked rings, radians. */
export const RING_ANGLE = (Math.PI * 2) / RINGS;
/** Half-arc each row bows across, radians. */
export const ROW_ARC = 0.62;

/** Flat-state layout (progress 0): row pitch and horizontal letter pitch. */
export const FLAT_ROW_PITCH = 1.46;
export const FLAT_COL_PITCH = 1.65;

export const FONT_SIZE = 1.18;

// --- Phase thresholds (in progress space) ---------------------------------
export const PHASE = {
  shearStart: 0.03,
  shearEnd: 0.2,
  warpStart: 0.14,
  warpEnd: 0.46,
  pillStart: 0.04,
  pillEnd: 0.32,
  spinStart: 0.3,
  cardsStart: 0.34,
} as const;
