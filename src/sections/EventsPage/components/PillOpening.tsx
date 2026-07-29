import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { COLORS } from '../lib/constants';
import { clamp, lerp, smoothstep } from '../lib/phases';

type Props = { progress: number };

function useViewport() {
  const [size, setSize] = useState({ w: 1920, h: 1080 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

export function PillOpening({ progress }: Props) {
  const { w, h } = useViewport();

  const openReveal = smoothstep(0.04, 0.22, progress);
  const closeReveal = 1 - smoothstep(0.80, 0.96, progress);
  const rawReveal = progress < 0.5 ? openReveal : closeReveal;

  const revealMV = useMotionValue(rawReveal);
  useEffect(() => { revealMV.set(rawReveal); }, [rawReveal, revealMV]);

  const reveal = useSpring(revealMV, { stiffness: 120, damping: 28, mass: 0.8 });

  const ASPECT = 0.42;
  const ph0 = h * 0.78;
  const pw0 = Math.max(ph0 * ASPECT, 1);
  const targetW = 1.25 * Math.max(w, h * 0.72);

  const pw = useTransform(reveal, (r) => Math.max(pw0 * lerp(1, targetW / pw0, r), 0));
  const ph_ = useTransform(reveal, (r) => Math.max(ph0 * lerp(1, targetW / pw0, r), 0));
  const rx = useTransform(() => Math.min(pw.get(), ph_.get()) / 2);
  const capsuleX = useTransform(pw, (v) => (w - v) / 2);
  const capsuleY = useTransform(ph_, (v) => (h - v) / 2);
  const containerOpacity = useTransform(reveal, (r) => 1 - clamp((r - 0.86) / 0.14));

  const outerX = useTransform(capsuleX, (v) => v - 10);
  const outerY = useTransform(capsuleY, (v) => v - 10);
  const outerW = useTransform(pw, (v) => v + 20);
  const outerH = useTransform(ph_, (v) => v + 20);
  const outerRx = useTransform(rx, (v) => v + 10);

  if (w < 1 || h < 1) return null;

  return (
    <motion.div
      className="pill-opening"
      style={{ opacity: containerOpacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <mask id="work-hole">
            <rect width={w} height={h} fill="#fff" />
            <motion.rect
              x={capsuleX} y={capsuleY}
              width={pw} height={ph_}
              rx={rx} ry={rx}
              fill="#000"
            />
          </mask>
        </defs>

        <rect width={w} height={h} fill={COLORS.pageRed} mask="url(#work-hole)" />

        <motion.rect
          x={capsuleX} y={capsuleY}
          width={pw} height={ph_}
          rx={rx} ry={rx}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2}
        />
        <motion.rect
          x={outerX} y={outerY}
          width={outerW} height={outerH}
          rx={outerRx} ry={outerRx}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2}
        />
      </svg>
    </motion.div>
  );
}
