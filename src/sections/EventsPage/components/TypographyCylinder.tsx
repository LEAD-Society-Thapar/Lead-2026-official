import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, FONT_URL, LETTERS, PER_ROW } from '../lib/constants';
import { smoothstep } from '../lib/phases';

type Props = { progressRef: React.RefObject<number> };

const ROWS = LETTERS.length;
const ROW_CENTER = (ROWS - 1) / 2;
const COL_PITCH = 1.4;
const ROW_PITCH = 1.25;
const FSIZE = 1.25;
const HALF = (PER_ROW - 1) / 2;
const ROW_SPAN = PER_ROW * COL_PITCH;

const ZOOM_START = 0.78;

// Speeds: 0.2x of previous (which was already 0.15x of original).
// 3rd E (row 2) is slowest (base), others are multiples.
const BASE_SPEED = 0.0000007;
const ROW_SPEED = [
  -(1.3 * BASE_SPEED),   // row 0: 1st E
  -(1.2 * BASE_SPEED),   // row 1: V
  -(1.0 * BASE_SPEED),   // row 2: 3rd E (slowest)
  -(1.15 * BASE_SPEED),  // row 3: N
  -(1.4 * BASE_SPEED),   // row 4: T
];
// 1 loop for slowest row
const SCROLL_TRAVEL = (1.5 * ROW_SPAN) / BASE_SPEED;

// --- Phase boundaries (wider travel window for longer horizontal movement) ---
const SPREAD_START = 0.04;
const SPREAD_END = 0.22;
const TRAVEL_START = 0.24;
const TRAVEL_END = 0.78;
// Closing phase: mirror of opening spread
const CLOSE_START = 0.80;
const CLOSE_END = 0.96;

// --- Barrel / cylinder curvature ---
// Top rows bend UP (concave), bottom rows bend DOWN (convex).
// Edge letters are BIGGER (forced perspective — closer to camera at the cylinder surface).
const BARREL_CURVE = 0.6;
const EDGE_SCALE_MAX = 1.35;
const BARREL_COMPRESSION = 0.3;
const DEPTH_PUSH = 1.2;

// Glyph indices that render above floating cards (row * PER_ROW + slot)
const FRONT_GLYPHS = new Set([
  0 * 15 + 6,   // E row, slot 6
  1 * 15 + 11,  // V row, slot 11
  2 * 15 + 4,   // E row, slot 4
  3 * 15 + 9,   // N row, slot 9
  4 * 15 + 7,   // T row, slot 7
]);

type Glyph = { letter: string; row: number; slot: number; baseX: number };

function wrap(v: number, span: number) {
  return ((((v + span / 2) % span) + span) % span) - span / 2;
}

export function TypographyCylinder({ progressRef }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const nodes = useRef<(THREE.Group | null)[]>([]);

  const glyphs = useMemo<Glyph[]>(() => {
    const out: Glyph[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let slot = 0; slot < PER_ROW; slot++) {
        out.push({
          letter: LETTERS[row],
          row,
          slot,
          baseX: (slot - HALF) * COL_PITCH,
        });
      }
    }
    return out;
  }, []);

  useFrame(() => {
    const progress = progressRef.current ?? 0;

    const openSpread = smoothstep(SPREAD_START, SPREAD_END, progress);
    const closeCollapse = smoothstep(CLOSE_START, CLOSE_END, progress);
    const spread = openSpread * (1 - closeCollapse);

    const barrelIntensity = spread;

    const travel = smoothstep(TRAVEL_START, TRAVEL_END, progress);

    if (rootRef.current) {
      const openZoom = ZOOM_START + (1 - ZOOM_START) * smoothstep(0, SPREAD_END, progress);
      const closeZoom = openZoom * (1 - closeCollapse) + ZOOM_START * closeCollapse;
      rootRef.current.scale.setScalar(closeZoom);
    }

    const halfSpan = ROW_SPAN / 2;

    for (let i = 0; i < glyphs.length; i++) {
      const node = nodes.current[i];
      const g = glyphs[i];
      if (!node) continue;

      // Compute fully-deployed position (spread=1 with travel offset)
      const offset = ROW_SPEED[g.row] * travel * SCROLL_TRAVEL;
      const xFull = wrap(g.baseX + offset, ROW_SPAN);
      // spread goes 0→1→0 (opening then closing), so x smoothly emerges and returns
      let x = xFull * spread;

      const nx = halfSpan > 0 ? x / halfSpan : 0;
      const absNx = Math.min(Math.abs(nx), 1);

      // Horizontal compression at edges (subtle foreshortening)
      const compressionFactor = 1 - BARREL_COMPRESSION * barrelIntensity * (1 - Math.cos(absNx * Math.PI * 0.5));
      x *= (1 - barrelIntensity) + barrelIntensity * compressionFactor;

      // Vertical curvature: row offset from center determines bend direction.
      // rowOffset < 0 (top rows) → bend UP; rowOffset > 0 (bottom rows) → bend DOWN.
      const rowOffset = (g.row - ROW_CENTER) / ROW_CENTER;
      const curveY = -rowOffset * BARREL_CURVE * barrelIntensity * absNx * absNx;

      // Edge letters are BIGGER (perspective: edges of cylinder are closer to camera)
      const depthScale = 1 + (EDGE_SCALE_MAX - 1) * barrelIntensity * absNx * absNx;

      // Z-depth: edge letters push slightly forward
      const z = DEPTH_PUSH * barrelIntensity * absNx * absNx;

      const baseY = -(g.row - ROW_CENTER) * ROW_PITCH;
      node.position.set(x, baseY + curveY, z);
      node.scale.setScalar(depthScale);

      const isFront = FRONT_GLYPHS.has(i);

      const textMesh = node.children[0] as any;
      if (textMesh) {
        textMesh.renderOrder = isFront ? 10 : 0;
        const shadowIn = smoothstep(SPREAD_START, SPREAD_START + 0.06, progress);
        const shadowIntensity = shadowIn * (1 - closeCollapse);
        textMesh.outlineOffsetX = 0.05 * shadowIntensity;
        textMesh.outlineOffsetY = -0.06 * shadowIntensity;
        textMesh.outlineOpacity = 0.55 * shadowIntensity;
        if (textMesh.material) {
          textMesh.material.depthTest = !isFront;
          textMesh.material.depthWrite = !isFront;
        }
      }
    }
  });

  return (
    <group ref={rootRef}>
      {glyphs.map((g, i) => (
        <group
          key={`${g.row}-${g.slot}`}
          ref={(node) => {
            nodes.current[i] = node;
          }}
        >
          <Text
            font={FONT_URL}
            fontSize={FSIZE}
            color={COLORS.red}
            anchorX="center"
            anchorY="middle"
            letterSpacing={-0.04}
            material-toneMapped={false}
            outlineColor={COLORS.redDeep}
            outlineWidth={0.02}
            outlineOffsetX={0}
            outlineOffsetY={0}
            outlineOpacity={0}
          >
            {g.letter}
          </Text>
        </group>
      ))}
    </group>
  );
}
