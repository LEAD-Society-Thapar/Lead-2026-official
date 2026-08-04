import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import leadLogo from "../../../assets/LEAD.png";
import "./ParticleCube.css";

// ─── Responsive Camera ──────────────────────────────────────────────────────────
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (size.width >= 768) {
      camera.fov = 35;
    } else if (size.width >= 480) {
      camera.fov = 50;
    } else if (size.width >= 360) {
      camera.fov = 85;
    } else {
      camera.fov = 95;
    }
    camera.updateProjectionMatrix();
  }, [size.width, camera]);
  return null;
}

// ─── Glow Sprite Texture (Cached) ─────────────────────────────────────────────
let cachedGlowTexture = null;
function createGlowTexture() {
  if (cachedGlowTexture) return cachedGlowTexture;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const center = size / 2;
  const g = ctx.createRadialGradient(center, center, 0, center, center, center);
  g.addColorStop(0, "rgba(255,255,255,1.0)");
  g.addColorStop(0.18, "rgba(255,255,255,0.98)");
  g.addColorStop(0.40, "rgba(220,235,255,0.72)");
  g.addColorStop(0.65, "rgba(180,210,255,0.35)");
  g.addColorStop(0.85, "rgba(140,190,255,0.12)");
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  cachedGlowTexture = new THREE.CanvasTexture(c);
  return cachedGlowTexture;
}

// ─── Fast Canvas Sampling ──────────────────────────────────────────────────────
function sampleCanvasPositions(data, width, height, scaleXY, depth) {
  const positions = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 140) continue;

      const posX = (x - width / 2) * scaleXY;
      const posY = -(y - height / 2) * scaleXY;

      // Front face shell
      positions.push(posX, posY, depth / 2 + THREE.MathUtils.randFloat(-0.04, 0.04));
      // Back face shell
      positions.push(posX, posY, -depth / 2 + THREE.MathUtils.randFloat(-0.04, 0.04));

      // Side-wall edge column check inline (avoid array & function allocation overhead)
      const left  = x > 0 ? data[(y * width + (x - 1)) * 4 + 3] : 0;
      const right = x < width - 1 ? data[(y * width + (x + 1)) * 4 + 3] : 0;
      const top   = y > 0 ? data[((y - 1) * width + x) * 4 + 3] : 0;
      const bot   = y < height - 1 ? data[((y + 1) * width + x) * 4 + 3] : 0;

      if (left < 140 || right < 140 || top < 140 || bot < 140) {
        for (let i = 0; i < 8; i++) {
          positions.push(posX, posY, THREE.MathUtils.randFloat(-depth / 2, depth / 2));
        }
      }
    }
  }
  return positions;
}

// ─── Equalise Array Lengths ───────────────────────────────────────────────────
function equaliseArrays(a, b) {
  const na = a.length, nb = b.length;
  const maxLen = Math.max(na, nb);

  while (a.length < maxLen) {
    const i = Math.floor(Math.random() * (na / 3)) * 3;
    a.push(a[i], a[i + 1], a[i + 2]);
  }
  while (b.length < maxLen) {
    const i = Math.floor(Math.random() * (nb / 3)) * 3;
    b.push(b[i], b[i + 1], b[i + 2]);
  }
  return maxLen;
}

// ─── Module-Level Cache & Instant Preloader ───────────────────────────────────
let cachedParticleData = null;
let preloadPromise = null;

function loadParticleData() {
  if (cachedParticleData) return Promise.resolve(cachedParticleData);
  if (preloadPromise) return preloadPromise;

  preloadPromise = new Promise((resolve) => {
    const img = new Image();
    img.src = leadLogo;
    img.crossOrigin = "anonymous";

    const process = () => {
      const cA = document.createElement("canvas");
      const ctxA = cA.getContext("2d");
      const wA = 220; // Crisp sampling resolution
      const hA = Math.round((img.height / img.width) * wA);
      cA.width = wA; cA.height = hA;
      ctxA.drawImage(img, 0, 0, wA, hA);

      const scaleXY = (260 * 0.065) / wA; // Preserve exact world space scale (~16.9 units)
      const depth = 2.5;

      const rawA = sampleCanvasPositions(ctxA.getImageData(0, 0, wA, hA).data, wA, hA, scaleXY, depth);

      const cB = document.createElement("canvas");
      const ctxB = cB.getContext("2d");
      const wB = 280;
      const hB = 80;
      cB.width = wB; cB.height = hB;
      ctxB.clearRect(0, 0, wB, hB);
      ctxB.fillStyle = "white";

      const scaleB = (wA * scaleXY) / wB;

      const fontPx = 26;
      ctxB.font = `800 ${fontPx}px 'Arial Black', Arial, sans-serif`;
      ctxB.textBaseline = "middle";
      ctxB.textAlign = "center";
      ctxB.fillText("Learn  |  Emerge", wB / 2, hB * 0.28);
      ctxB.fillText("Aspire  |  Discover", wB / 2, hB * 0.72);

      const rawB = sampleCanvasPositions(ctxB.getImageData(0, 0, wB, hB).data, wB, hB, scaleB, depth / 12);

      const total = equaliseArrays(rawA, rawB) / 3;

      const colors = new Float32Array(total * 3);
      for (let i = 0; i < total; i++) {
        const r = Math.random();
        let b;
        if (r < 0.05) b = 1.0;
        else if (r < 0.20) b = 0.45;
        else b = 0.78;
        colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = b;
      }

      const posA = new Float32Array(rawA);
      const posB = new Float32Array(rawB);

      cachedParticleData = { posA, posB, colors };
      resolve(cachedParticleData);
    };

    if (img.complete) {
      process();
    } else {
      img.onload = process;
    }
  });

  return preloadPromise;
}

// Start preloading immediately when module loads
if (typeof window !== "undefined") {
  loadParticleData();
}

// ─── Background Star Field ────────────────────────────────────────────────────
function BackgroundParticles() {
  const pointsRef = useRef();
  const count = 700;

  const { positions, originalPositions, offsets, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const orig = new Float32Array(count * 3);
    const offs = new Float32Array(count * 3);
    const sps = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = THREE.MathUtils.randFloatSpread(38);
      const y = THREE.MathUtils.randFloatSpread(20);
      const z = THREE.MathUtils.randFloat(-18, 18);
      pos[i * 3] = orig[i * 3] = x;
      pos[i * 3 + 1] = orig[i * 3 + 1] = y;
      pos[i * 3 + 2] = orig[i * 3 + 2] = z;
      offs[i * 3] = Math.random() * Math.PI * 2;
      offs[i * 3 + 1] = Math.random() * Math.PI * 2;
      offs[i * 3 + 2] = Math.random() * Math.PI * 2;
      sps[i] = THREE.MathUtils.randFloat(0.08, 0.25);
    }
    return { positions: pos, originalPositions: orig, offsets: offs, speeds: sps };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const arr = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      arr[idx] = originalPositions[idx] + Math.sin(t * speeds[i] + offsets[idx]) * 0.07;
      arr[idx + 1] = originalPositions[idx + 1] + Math.cos(t * speeds[i] * 0.9 + offsets[idx + 1]) * 0.07;
      arr[idx + 2] = originalPositions[idx + 2] + Math.sin(t * speeds[i] * 1.1 + offsets[idx + 2]) * 0.05;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.018} sizeAttenuation transparent opacity={0.5} depthWrite={false} color="#ffffff" />
    </points>
  );
}

// ─── Logo Particles (with click-to-morph) ────────────────────────────────────
function LogoParticles({ controlsRef, isDragging }) {
  const pointsRef = useRef();
  const [particleData, setParticleData] = useState(() => {
    if (cachedParticleData) {
      return {
        ...cachedParticleData,
        work: new Float32Array(cachedParticleData.posA),
      };
    }
    return null;
  });

  const { camera } = useThree();

  // Morph state
  const morphT = useRef(0);   // 0 = LEAD form, 1 = acronym form
  const morphTarget = useRef(0);
  const isMorphing = useRef(false);

  // Click tracking
  const pointerDownPos = useRef({ x: 0, y: 0 });

  const targetCameraPos = useMemo(() => new THREE.Vector3(0, 0, 12), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const glowTexture = useMemo(() => createGlowTexture(), []);

  const { gl, scene } = useThree();

  useEffect(() => {
    if (!particleData) {
      loadParticleData().then((data) => {
        setParticleData({
          ...data,
          work: new Float32Array(data.posA),
        });
      });
    }
  }, [particleData]);

  useEffect(() => {
    if (particleData && pointsRef.current) {
      // Force compile the shader immediately after the mesh is created 
      // so it's ready backstage while the preloader is still showing.
      gl.compile(scene, camera);
      // Force a synchronous render to defeat any browser occlusion culling
      gl.render(scene, camera);
    }
  }, [particleData, gl, scene, camera]);

  const handlePointerDown = (e) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 6) {
      morphTarget.current = morphTarget.current === 0 ? 1 : 0;
      isMorphing.current = true;
    }
  };

  useFrame((state, delta) => {
    if (!pointsRef.current || !particleData) return;
    const t = state.clock.getElapsedTime();

    if (!isDragging.current) {
      camera.position.lerp(targetCameraPos, 0.06);
      controlsRef.current?.target.lerp(targetLookAt, 0.06);
      controlsRef.current?.update();

      pointsRef.current.rotation.y = Math.sin(t * 0.28) * 0.18;
      pointsRef.current.rotation.x = Math.sin(t * 0.20) * 0.07;
      pointsRef.current.position.y = Math.sin(t * 0.65) * 0.14;
    }

    if (isMorphing.current) {
      const speed = 1.2;
      const dir = morphTarget.current === 1 ? 1 : -1;
      morphT.current = Math.max(0, Math.min(1, morphT.current + dir * delta * speed));

      const tEased = morphT.current < 0.5
        ? 4 * morphT.current ** 3
        : 1 - (-2 * morphT.current + 2) ** 3 / 2;

      const posAttr = pointsRef.current.geometry.attributes.position;
      const arr = posAttr.array;
      const a = particleData.posA;
      const b = particleData.posB;
      for (let i = 0; i < arr.length; i++) {
        arr[i] = a[i] + (b[i] - a[i]) * tEased;
      }
      posAttr.needsUpdate = true;

      if ((dir === 1 && morphT.current >= 1) || (dir === -1 && morphT.current <= 0)) {
        isMorphing.current = false;
      }
    }
  });

  if (!particleData) return null;

  return (
    <points
      ref={pointsRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particleData.work}
          count={particleData.work.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={particleData.colors}
          count={particleData.colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.10}
        map={glowTexture}
        sizeAttenuation
        transparent
        opacity={0.90}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Scene Root ───────────────────────────────────────────────────────────────
export default function ParticleCube({ isHome = true }) {
  const controlsRef = useRef();
  const isDragging = useRef(false);

  return (
    <div
      className="particle-cube"
      onPointerDown={() => { isDragging.current = true; }}
      onPointerUp={() => { isDragging.current = false; }}
      onPointerLeave={() => { isDragging.current = false; }}
    >
      <Canvas
        frameloop={isHome ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ fov: 35, near: 0.01, far: 1000, position: [0, 0, 12] }}
        onCreated={({ gl, scene, camera }) => {
          gl.compile(scene, camera);
          gl.render(scene, camera);
        }}
      >
        <color attach="background" args={["#0d0d0d"]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />

        <ResponsiveCamera />

        <BackgroundParticles />
        <LogoParticles controlsRef={controlsRef} isDragging={isDragging} />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.07}
          enableZoom={false}
        />
      </Canvas>
    </div>
  );
}