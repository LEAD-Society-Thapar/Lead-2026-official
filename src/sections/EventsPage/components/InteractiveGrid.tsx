import { useEffect, useRef } from 'react';
import { clamp, lerp, smoothstep } from '../lib/phases';

type Props = { progress: number };

// ---------------------------------------------------------------------------
// Interactive DOT FIELD around the event capsule.
//   1. Magnetic lattice — dots repel from the cursor with a springy falloff,
//      growing and brightening as it approaches.
//   2. Gravity-well halo — dots brighten and swell near the capsule edge, with
//      a slow breathing pulse radiating outward, so the capsule anchors the
//      composition even at rest.
//   3. Scroll streaming — while the reveal is scrubbing, dots drift toward the
//      capsule (opening) or away from it (closing), as if the field feeds the
//      reveal.
// ---------------------------------------------------------------------------

// Lattice
const SPACING = 30; // px between dots
const DOT_R = 1.6; // base dot radius
const BASE_ALPHA = 0.26;

// 1 — magnetic cursor
const MAG_RADIUS = 160; // influence radius
const MAG_PUSH = 30; // max displacement away from cursor
const MAG_GROW = 1.7; // extra radius at the cursor
const MAG_GLOW = 0.5; // extra alpha at the cursor
const MOUSE_LERP = 0.12;

// 2 — capsule halo
const HALO_RANGE = 210; // falloff distance of the halo, px from capsule edge
const HALO_GLOW = 0.55; // added alpha right at the edge
const HALO_GROW = 1.2; // added radius right at the edge
const BREATH_SPEED = 1.3; // rad/s of the breathing pulse
const BREATH_WAVELEN = 0.011; // spatial frequency of the pulse
const BREATH_DEPTH = 0.35; // how much the pulse modulates the halo

// 3 — scroll streaming
const STREAM_GAIN = 110; // px of drift at full scrub speed
const STREAM_RANGE = 320; // falloff distance of the drift
const STREAM_SMOOTH = 5; // response speed of the drift envelope
const STREAM_VEL_SCALE = 1.6; // progress-velocity → envelope

export function InteractiveGrid({ progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rawMouseRef = useRef({ x: -9999, y: -9999 });
  const smoothMouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    let lastMoveAt = -1e9; // timestamp of the last real cursor movement
    let magActivity = 0; // 0..1 envelope: magnetic effect only while moving

    const onMove = (e: MouseEvent) => {
      rawMouseRef.current = { x: e.clientX, y: e.clientY };
      lastMoveAt = performance.now();
    };
    window.addEventListener('mousemove', onMove);

    let prevW = 0;
    let prevH = 0;
    let dpr = 1;
    let lastTime = performance.now();
    let prevProgress = progressRef.current;
    let stream = 0; // smoothed signed scrub velocity envelope

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeRef.current += dt;

      const w = window.innerWidth;
      const h = window.innerHeight;
      dpr = window.devicePixelRatio || 1;

      if (w !== prevW || h !== prevH) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        prevW = w;
        prevH = h;
      }

      // Smooth hover mouse
      const sm = smoothMouseRef.current;
      const rm = rawMouseRef.current;
      sm.x += (rm.x - sm.x) * MOUSE_LERP;
      sm.y += (rm.y - sm.y) * MOUSE_LERP;

      // Magnetic effect is only alive while the cursor is actually moving:
      // ramps in fast on movement, dissolves gently once it stops.
      const moving = now - lastMoveAt < 120;
      magActivity += ((moving ? 1 : 0) - magActivity) * Math.min(1, dt * (moving ? 12 : 4));

      const p = progressRef.current;

      // Scrub velocity → streaming envelope (signed: + opening, − closing)
      const vel = dt > 0 ? (p - prevProgress) / dt : 0;
      prevProgress = p;
      const targetStream = Math.max(-1, Math.min(1, vel * STREAM_VEL_SCALE));
      stream += (targetStream - stream) * Math.min(1, dt * STREAM_SMOOTH);

      const openReveal = smoothstep(0.04, 0.22, p);
      const closeReveal = 1 - smoothstep(0.80, 0.96, p);
      const reveal = p < 0.5 ? openReveal : closeReveal;
      const opacity = 1 - clamp((reveal - 0.86) / 0.14);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (opacity <= 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // --- Capsule geometry (mirrors PillOpening's expanding hole) ----------
      const ASPECT = 0.42;
      const ph0 = h * 0.78;
      const pw0 = Math.max(ph0 * ASPECT, 1);
      const targetW = 1.25 * Math.max(w, h * 0.72);
      const scale = lerp(1, targetW / pw0, reveal);
      const cpw = Math.max(pw0 * scale, 0);
      const cph = Math.max(ph0 * scale, 0);
      const capX = (w - cpw) / 2;
      const capY = (h - cph) / 2;

      // Stadium (capsule) SDF pieces: a vertical segment + radius
      const capR = Math.min(cpw, cph) / 2;
      const segX = capX + cpw / 2;
      const segY1 = capY + capR;
      const segY2 = capY + cph - capR;

      // Clip: everything except the capsule hole (with a small pad)
      const PAD = 8;
      const cx2 = capX - PAD;
      const cy2 = capY - PAD;
      const pw2 = cpw + PAD * 2;
      const ph2 = cph + PAD * 2;
      const rx2 = Math.min(pw2, ph2) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.moveTo(cx2 + rx2, cy2);
      ctx.arcTo(cx2 + pw2, cy2, cx2 + pw2, cy2 + rx2, rx2);
      ctx.arcTo(cx2 + pw2, cy2 + ph2, cx2 + pw2 - rx2, cy2 + ph2, rx2);
      ctx.arcTo(cx2, cy2 + ph2, cx2, cy2 + ph2 - rx2, rx2);
      ctx.arcTo(cx2, cy2, cx2 + rx2, cy2, rx2);
      ctx.closePath();
      ctx.clip('evenodd');

      const mx = sm.x;
      const my = sm.y;
      const time = timeRef.current;

      const offsetX = w / 2 - Math.ceil(w / 2 / SPACING) * SPACING;
      const offsetY = h / 2 - Math.ceil(h / 2 / SPACING) * SPACING;

      ctx.fillStyle = '#ffffff';

      for (let gx = offsetX; gx <= w + SPACING; gx += SPACING) {
        for (let gy = offsetY; gy <= h + SPACING; gy += SPACING) {
          // --- capsule SDF: distance from dot to capsule edge (+ outside) ---
          const cy = Math.max(segY1, Math.min(segY2, gy));
          const ddx = gx - segX;
          const ddy = gy - cy;
          const dCenter = Math.sqrt(ddx * ddx + ddy * ddy);
          const edgeDist = dCenter - capR;

          if (edgeDist < -SPACING) continue; // deep inside the hole — clipped anyway

          let x = gx;
          let y = gy;
          let r = DOT_R;
          let a = BASE_ALPHA;

          // --- 2: gravity-well halo + breathing pulse -----------------------
          if (edgeDist < HALO_RANGE) {
            const ht = 1 - Math.max(edgeDist, 0) / HALO_RANGE;
            const halo = ht * ht * (3 - 2 * ht);
            const breath =
              1 - BREATH_DEPTH * 0.5 +
              BREATH_DEPTH * 0.5 *
                Math.sin(time * BREATH_SPEED - edgeDist * BREATH_WAVELEN);
            a += HALO_GLOW * halo * breath;
            r += HALO_GROW * halo * breath;
          }

          // --- 3: scroll streaming toward/away from the capsule -------------
          if (stream !== 0 && edgeDist > 0 && dCenter > 0.5) {
            const st = Math.exp(-edgeDist / STREAM_RANGE);
            const drift = STREAM_GAIN * stream * st;
            x -= (ddx / dCenter) * drift; // + stream (opening) pulls inward
            y -= (ddy / dCenter) * drift;
            a += 0.12 * Math.abs(stream) * st;
          }

          // --- 1: magnetic cursor repel (only while the cursor moves) -------
          const hdx = x - mx;
          const hdy = y - my;
          const hDist = Math.sqrt(hdx * hdx + hdy * hdy);
          if (magActivity > 0.01 && hDist < MAG_RADIUS && hDist > 0.5) {
            const mt = 1 - hDist / MAG_RADIUS;
            const ease = mt * mt * (3 - 2 * mt) * magActivity;
            x += (hdx / hDist) * MAG_PUSH * ease;
            y += (hdy / hDist) * MAG_PUSH * ease;
            r += MAG_GROW * ease;
            a += MAG_GLOW * ease;
          }

          ctx.globalAlpha = Math.min(1, a) * opacity;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 11,
        pointerEvents: 'none',
      }}
    />
  );
}
