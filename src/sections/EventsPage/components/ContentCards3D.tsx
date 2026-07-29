import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { CARD_SPECS } from '../lib/cardTextures';
import { COLORS, FONT_URL, PHASE } from '../lib/constants';
import { easeOutBack, smoothstep } from '../lib/phases';

type Props = { progressRef: React.RefObject<number> };

const CARD_W = 7.2; // larger on screen
const CARD_H = 4.5;
const CARD_Z = -0.8; // closer to barrel front
const SPAN_START = PHASE.cardsStart; // 0.34
const SPAN_END = 1.0;

export function ContentCards3D({ progressRef }: Props) {
  const groups = useRef<(THREE.Group | null)[]>([]);

  const cards = useMemo(
    () => CARD_SPECS.map((spec) => ({ spec, texture: spec.make() })),
    [],
  );

  const step = (SPAN_END - SPAN_START) / cards.length;

  useFrame(() => {
    const progress = progressRef.current ?? 0;

    cards.forEach((_, i) => {
      const group = groups.current[i];
      if (!group) return;

      const center = SPAN_START + step * (i + 0.5);
      // Rise: quick entry
      const rise = smoothstep(center - step * 0.6, center - step * 0.05, progress);
      // Fall: much later exit (or not at all if beyond SPAN_END)
      const fall = 1 - smoothstep(center + step * 1.2, center + step * 2.0, progress);
      const blend = rise * fall;

      // Eased scale: overshoot on entry, hold high thereafter
      const eased = easeOutBack(Math.min(1, rise * 1.1)) * fall;
      const scale = Math.max(0.01, eased);

      group.scale.set(scale, scale, scale);
      // Emerge from far depth, settle in plane
      group.position.z = THREE.MathUtils.lerp(-8, CARD_Z, smoothstep(center - step * 0.4, center + step * 0.4, progress));
      group.visible = blend > 0.02;
    });
  });

  return (
    <>
      {cards.map((card, i) => (
        <group
          key={card.spec.id}
          ref={(node) => {
            groups.current[i] = node;
          }}
          visible={false}
        >
          {/* thin white frame behind */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[CARD_W + 0.08, CARD_H + 0.08]} />
            <meshBasicMaterial color={COLORS.white} toneMapped={false} />
          </mesh>
          {/* the preview itself (opaque → clean depth occlusion) */}
          <mesh>
            <planeGeometry args={[CARD_W, CARD_H]} />
            <meshBasicMaterial map={card.texture} toneMapped={false} />
          </mesh>
          {/* metadata strip below the card — scales/occludes together with it */}
          <Text
            font={FONT_URL}
            fontSize={0.17}
            color={COLORS.red}
            anchorX="left"
            anchorY="middle"
            position={[-CARD_W / 2, -CARD_H / 2 - 0.32, 0]}
            material-toneMapped={false}
            letterSpacing={0.08}
          >
            {card.spec.label}
          </Text>
          <Text
            font={FONT_URL}
            fontSize={0.17}
            color={COLORS.red}
            anchorX="right"
            anchorY="middle"
            position={[CARD_W / 2, -CARD_H / 2 - 0.32, 0]}
            material-toneMapped={false}
            letterSpacing={0.08}
          >
            {card.spec.code}
          </Text>
        </group>
      ))}
    </>
  );
}
