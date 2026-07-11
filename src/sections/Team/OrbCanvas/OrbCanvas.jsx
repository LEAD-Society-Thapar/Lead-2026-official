import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./OrbCanvas.css";

export default function OrbCanvas({ orbStateRef, execSignalRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    renderer.setSize(w, h);

    const group = new THREE.Group();
    scene.add(group);
    group.position.y = -1.0;

    function makeGlowTexture() {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const ctx = c.getContext("2d");
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(120,240,255,0.9)");
      grad.addColorStop(0.4, "rgba(63,227,255,0.35)");
      grad.addColorStop(1, "rgba(63,227,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    }

    const glowTex = makeGlowTexture();
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(7.5, 7.5, 1);
    group.add(glowSprite);

    const coreGeo = new THREE.IcosahedronGeometry(1.55, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x1c5f73,
      transparent: true,
      opacity: 0.5,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const shellGeo1 = new THREE.IcosahedronGeometry(1.95, 1);
    const wireMat1 = new THREE.LineBasicMaterial({
      color: 0x3fe3ff,
      transparent: true,
      opacity: 0.55,
    });
    const wire1 = new THREE.LineSegments(
      new THREE.EdgesGeometry(shellGeo1),
      wireMat1,
    );
    group.add(wire1);

    const shellGeo2 = new THREE.IcosahedronGeometry(2.5, 1);
    const wireMat2 = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.25,
    });
    const wire2 = new THREE.LineSegments(
      new THREE.EdgesGeometry(shellGeo2),
      wireMat2,
    );
    group.add(wire2);

    const PCOUNT = 550;
    const positions = new Float32Array(PCOUNT * 3);
    for (let i = 0; i < PCOUNT; i++) {
      const r = 2.8 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x9bf3ff,
      size: 0.035,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(pGeo, pMat);
    group.add(points);

    let mx = 0;
    let my = 0;
    let tmx = 0;
    let tmy = 0;

    let allowMouse = true;

    const handleMouse = (event) => {
      tmx = (event.clientX / window.innerWidth - 0.5) * 2;
      tmy = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouse);
    const handleScroll = () => {
      allowMouse = window.scrollY < window.innerHeight * 0.8;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", resize);

    const HERO_DEFAULTS = {
      scale: 1.0,
      wire1Opacity: 0.55,
      wire2Opacity: 0.25,
      particleOpacity: 0.85,
      glowScale: 7.5,
      cameraZ: 9.0,
      groupY: -1.0,
    };

    const target = { ...HERO_DEFAULTS };
    const current = { ...HERO_DEFAULTS };

    const clock = new THREE.Clock();
    let frameId;

    function animate(time) {
      frameId = requestAnimationFrame(animate);

      // Tick Lenis scroll physics in the same RAF frame as Three.js render.
      // This is the key integration point — one loop, two jobs.
      // window.__LENIS__ is set by useLenis() in App.jsx.
      // time is DOMHighResTimeStamp provided by rAF — exactly what Lenis needs.
      window.__LENIS__?.raf(time);

      const t = clock.getElapsedTime();
      const state = orbStateRef?.current;

      if (state) {
        target.scale = state.scale ?? HERO_DEFAULTS.scale;
        target.wire1Opacity = state.wire1Opacity ?? HERO_DEFAULTS.wire1Opacity;
        target.wire2Opacity = state.wire2Opacity ?? HERO_DEFAULTS.wire2Opacity;
        target.particleOpacity =
          state.particleOpacity ?? HERO_DEFAULTS.particleOpacity;
        target.glowScale = state.glowScale ?? HERO_DEFAULTS.glowScale;
        target.cameraZ = state.cameraZ ?? HERO_DEFAULTS.cameraZ;
        target.groupY = state.groupY ?? HERO_DEFAULTS.groupY;
      }

      const L = 0.06;
      current.scale += (target.scale - current.scale) * L;
      current.wire1Opacity += (target.wire1Opacity - current.wire1Opacity) * L;
      current.wire2Opacity += (target.wire2Opacity - current.wire2Opacity) * L;
      current.particleOpacity +=
        (target.particleOpacity - current.particleOpacity) * L;
      current.glowScale += (target.glowScale - current.glowScale) * L;
      current.cameraZ += (target.cameraZ - current.cameraZ) * L;
      current.groupY += (target.groupY - current.groupY) * L;

      if (allowMouse) {
        mx += (tmx - mx) * 0.04;
        my += (tmy - my) * 0.04;
      } else {
        mx *= 0.92;
        my *= 0.92;
      }

      const rotationBoost = 0;

      const rotationSpeed = allowMouse ? 0.09 : 0.04;
      const mouseInfluence = allowMouse ? 0.28 : 0.08;

      group.rotation.y =
        t * (rotationSpeed + rotationBoost) + mx * mouseInfluence;
      group.rotation.x = my * (allowMouse ? 0.22 : 0.08);
      points.rotation.y = -t * (allowMouse ? 0.05 : 0.02);
      wire1.rotation.y = t * (allowMouse ? 0.04 : 0.02);

      wire2.rotation.x = t * (allowMouse ? 0.03 : 0.015);

      const pulse = 1 + Math.sin(t * 2.1) * 0.055;
      core.scale.setScalar(pulse);

      group.scale.setScalar(current.scale);
      group.position.y = current.groupY;
      wire1.material.opacity = current.wire1Opacity;
      wire2.material.opacity = current.wire2Opacity;
      points.material.opacity = current.particleOpacity;

      glowSprite.scale.setScalar(current.glowScale + Math.sin(t * 1.2) * 0.4);

      core.material.opacity = 0.5;
      camera.position.z = current.cameraZ;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      glowTex.dispose();
      glowMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      shellGeo1.dispose();
      wireMat1.dispose();
      shellGeo2.dispose();
      wireMat2.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="orb-canvas-global" />;
}
