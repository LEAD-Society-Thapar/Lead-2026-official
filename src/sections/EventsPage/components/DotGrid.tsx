import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';


export function DotGrid() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 40 * 23;
    const positions = new Float32Array(count * 3);
    let i = 0;

    for (let y = 0; y < 23; y += 1) {
      for (let x = 0; x < 40; x += 1) {
        positions[i++] = (x / 39) * 36 - 18;
        positions[i++] = (y / 22) * 20 - 10;
        positions[i++] = -8;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.22 + Math.sin(clock.elapsedTime * 0.4) * 0.03;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#000000"
        size={0.18}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
