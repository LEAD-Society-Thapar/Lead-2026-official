import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { smoothstep } from '../lib/phases';

type Props = { progressRef: React.RefObject<number> };

const CARD_COUNT = 8;

const X_RIGHT = 8;
const X_LEFT = -8;
const X_TRAVEL = X_RIGHT - X_LEFT;

const CARDS_START = 0.24;
const CARDS_END = 0.78;

const BARREL_CURVE = 0.3;
const EDGE_SCALE_MAX = 1.35;
const DEPTH_PUSH = 1.2;

const CARD_SIZES: [number, number][] = [
  [4.68, 3.12],
  [3.38, 2.21],
  [4.16, 2.73],
  [3.64, 2.86],
  [4.94, 2.60],
  [3.12, 2.08],
  [4.42, 2.99],
  [4.68, 2.86],
];

const Y_SLOTS = [0.8, -1.3, 0.2, 1.2, -0.6, -1.8, 1.0, -1.0];
const Z_SLOTS = [0.3, 0.5, 0.2, 0.6, 0.4, 0.3, 0.7, 0.35];

const STAGGER_OFFSETS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
const CARD_CROSS_DURATION = 0.07;

const HOVER_LERP = 5;
const HOVER_SCALE = 0.05;

/** World units → CSS px. A 4.68-unit-wide card renders as a 468px div. */
const PX_PER_UNIT = 100;
/** Calibrated so a PX_PER_UNIT-px div spans one world unit in drei's CSS3D space. */
const HTML_SCALE = 0.39;

type EventInfo = {
  tag: string;
  title: string;
  date: string;
  desc: string;
  /** Fallback gradient, used when no `img` is set (e.g. AMA). */
  art: string;
  /** Card photo from /public/event-images; falls back to `art` when absent. */
  img?: string;
  code: string;
};

// Details (date / desc) are placeholders until finalised.
const EVENTS: EventInfo[] = [
  {
    tag: 'FLAGSHIP',
    title: 'STEALTH SELL',
    date: 'TBA',
    desc: 'An immersive heist adventure where crew of masterminds completed missions, gathered resources, and made strategic auction decisions to outsmart rivals and secure the perfect escape.',
    art: 'linear-gradient(135deg, #1a1a1a 0%, #3d0a0a 100%)',
    img: '/event-images/stealth-sell.jpg',
    code: 'EV-01',
  },
  {
    tag: 'FLAGSHIP',
    title: 'CODE RED',
    date: 'TBA',
    desc: 'A fast-paced quest driven by curiosity, strategy, and the excitement of uncovering what comes next. ',
    art: 'linear-gradient(135deg, #241010 0%, #7a0f0f 100%)',
    img: '/event-images/code-red.jpg',
    code: 'EV-02',
  },
  {
    tag: 'FLAGSHIP',
    title: 'PHANTOM',
    date: 'TBA',
    desc: 'Phantom is a high-stakes detective adventure where every clue tells a story. Uncover hidden secrets, reconstruct the crime, and identify the culprit behind a daring museum heist.',
    art: 'linear-gradient(135deg, #101014 0%, #2a0a33 100%)',
    img: '/event-images/phantom.jpg',
    code: 'EV-03',
  },
  {
    tag: '---',
    title: 'AMA SESSION WITH MICROSOFT',
    date: 'TBA',
    desc: 'An open Ask-Me-Anything with Microsoft engineers and leaders — candid career advice, real stories from building at scale, and straight answers to whatever you have always wanted to ask.',
    art: 'linear-gradient(135deg, #14181c 0%, #0e3542 100%)',
    code: 'EV-04',
  },
  {
    tag: '---',
    title: 'SEAFERNO',
    date: 'TBA',
    desc: 'A high-energy, one-day semi-tech showdown that sets the stage — the precursor hype machine that builds momentum straight into Matrix.',
    art: 'linear-gradient(135deg, #0d1614 0%, #0e4436 100%)',
    code: 'EV-05',
  },
  {
    tag: '---',
    title: 'CHARCHA-AE-CELEBAL',
    date: 'TBA',
    desc: 'Great ideas start over chai. No speeches, no awkward intros — just good chai, good people, and great conversations, games, and new friends. Sip. Talk. Connect. Repeat.',
    art: 'linear-gradient(135deg, #1b1712 0%, #5c400c 100%)',
    img: '/event-images/charcha.jpg',
    code: 'EV-06',
  },
  {
    tag: '---',
    title: 'WEBINAR-IOT',
    date: 'TBA',
    desc: 'Everyday objects, meet brainpower. Lights that switch on before you enter. Plants that text you when thirsty. Come learn how sensors, devices, and code combine to build smart solutions. Build. Connect. Automate. Innovate.',
    art: 'linear-gradient(135deg, #131a15 0%, #0e4426 100%)',
    img: '/event-images/webinar.jpg',
    code: 'EV-07',
  },
  {
    tag: 'FLAGSHIP',
    title: 'MATRIX 3.0',
    date: 'TBA',
    desc: 'Our flagship three-day fest — a sprawling arena of Tech, Non-Tech and Semi-Tech tracks where builders, strategists and creators go head to head.',
    art: 'linear-gradient(135deg, #1a1a1a 0%, #7a0f0f 100%)',
    img: '/event-images/matrix.jpg',
    code: 'EV-08',
  },
];

export function FloatingCards({ progressRef }: Props) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const hoverTarget = useRef<Float32Array>(new Float32Array(CARD_COUNT));
  const hoverState = useRef<Float32Array>(new Float32Array(CARD_COUNT));

  useFrame((_, delta) => {
    const progress = progressRef.current ?? 0;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < CARD_COUNT; i++) {
      const group = groupRefs.current[i];
      const el = cardEls.current[i];
      if (!group) continue;

      const cardStart = CARDS_START + STAGGER_OFFSETS[i] * (CARDS_END - CARDS_START - CARD_CROSS_DURATION);
      const cardEnd = cardStart + CARD_CROSS_DURATION;
      const t = (progress - cardStart) / (cardEnd - cardStart);

      if (t < -0.05 || t > 1.05) {
        if (group.visible) group.visible = false;
        if (el && el.style.display !== 'none') el.style.display = 'none';
        continue;
      }

      group.visible = true;
      if (el && el.style.display !== 'block') el.style.display = 'block';

      const x = X_RIGHT - t * X_TRAVEL;
      const nx = x / (X_TRAVEL / 2);
      const absNx = Math.min(Math.abs(nx), 1);

      const yBase = Y_SLOTS[i];
      const curveY = yBase > 0
        ? BARREL_CURVE * absNx * absNx
        : -BARREL_CURVE * absNx * absNx;

      const edgeScale = 1 + (EDGE_SCALE_MAX - 1) * absNx * absNx;
      const z = Z_SLOTS[i] + DEPTH_PUSH * absNx * absNx;

      const fadeIn = smoothstep(0, 0.1, t);
      const fadeOut = 1 - smoothstep(0.9, 1, t);
      const opacity = fadeIn * fadeOut;

      hoverState.current[i] +=
        (hoverTarget.current[i] - hoverState.current[i]) * (1 - Math.exp(-HOVER_LERP * dt));
      const hv = hoverState.current[i];

      group.position.set(x, yBase + curveY, z);
      group.scale.setScalar(edgeScale * (1 + HOVER_SCALE * hv));

      if (el) {
        el.style.opacity = String(opacity);
        // Ignore pointer input while a card is fading in/out.
        el.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
      }
    }
  });

  return (
    <group>
      {EVENTS.map((ev, i) => {
        const [w, h] = CARD_SIZES[i];
        const pw = Math.round(w * PX_PER_UNIT);
        const ph = Math.round(h * PX_PER_UNIT);
        return (
          <group
            key={ev.code}
            ref={(el) => { groupRefs.current[i] = el; }}
            visible={false}
          >
            {/* CSS3D maps 1px → 1 world unit, so shrink by PX_PER_UNIT */}
            <group scale={HTML_SCALE / PX_PER_UNIT * 100}>
              <Html transform zIndexRange={[16, 12]}>
                <div
                  ref={(el) => { cardEls.current[i] = el; }}
                  className="ecard"
                  style={{ width: pw, height: ph, display: 'none', opacity: 0 }}
                  onPointerEnter={(e) => {
                    hoverTarget.current[i] = 1;
                    e.currentTarget.classList.add('is-hover');
                  }}
                  onPointerLeave={(e) => {
                    hoverTarget.current[i] = 0;
                    e.currentTarget.classList.remove('is-hover');
                  }}
                >
                  <div className="ecard__text">
                    <span className="ecard__tag">{ev.tag}</span>
                    <h3 className="ecard__title" style={{ fontSize: Math.round(pw * 0.058) }}>
                      {ev.title}
                    </h3>
                    <p className="ecard__meta">{ev.date}</p>
                    <p className="ecard__desc">{ev.desc}</p>
                  </div>
                  <div className="ecard__frame">
                    <div
                      className="ecard__img"
                      style={ev.img
                        ? { backgroundImage: `url(${ev.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: ev.art }}
                    />
                    <span className="ecard__imglabel">{ev.title}</span>
                  </div>
                </div>
              </Html>
            </group>
          </group>
        );
      })}
    </group>
  );
}
