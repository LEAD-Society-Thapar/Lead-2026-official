/**
 * Hero.jsx — Phase 1.5 (text-only overlay)
 *
 * REMOVED:
 *   - import * as THREE (entire Three.js scene)
 *   - import gsap / ScrollTrigger (dead import — was never used here)
 *   - canvasRef and WebGLRenderer
 *   - IcosahedronGeometry, EdgesGeometry, particles, glow sprite
 *   - handleMouse for orb parallax (now in OrbCanvas)
 *   - updateScroll for orb scroll-zoom (now in useOrbState)
 *   - canvas.style.opacity fade (was the root of the disconnection bug)
 *   - <canvas> JSX element
 *
 * PRESERVED (byte-for-byte):
 *   - heroRef, heroTextRef, layerRefs
 *   - heroText.style.opacity scroll fade (text disappears on scroll, not the orb)
 *   - handleTextMove mouse parallax on the 3 text layers
 *   - All JSX: hero-eyebrow, layer-stack, layer-outline/glow/front, hero-sub, scroll-cue
 *
 * Orb is now rendered exclusively by <OrbCanvas> in App.jsx.
 * Hero is a pure text overlay sitting above the fixed canvas (z-index: 1).
 */

import { useEffect, useRef } from "react";
import "./TeamHero.css";

function TeamHero() {
  const heroRef      = useRef(null);
  const heroTextRef  = useRef(null);
  const layerRefs    = useRef([]);

  useEffect(() => {
    const heroSection = heroRef.current;
    const heroText    = heroTextRef.current;

    if (!heroSection || !heroText) return;

    // ─────────────────────────────────────────────
    // TEXT FADE ON SCROLL
    //
    // Only the hero TEXT fades on scroll — the orb no longer does.
    // The orb's scroll behavior is handled by useOrbState → OrbCanvas.
    // ─────────────────────────────────────────────
    const handleScroll = () => {
      const rect     = heroSection.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / window.innerHeight));
      const fade     = 1 - progress;
      heroText.style.opacity = Math.max(0, fade * 1.2);
    };

    // ─────────────────────────────────────────────
    // TEXT PARALLAX ON MOUSE MOVE
    //
    // Three text layers move at different depths — outline fastest,
    // glow middle, front layer slowest. Creates an inexpensive 3D illusion.
    // ─────────────────────────────────────────────
    const handleTextMove = (e) => {
      const x = e.clientX / window.innerWidth  - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;

      layerRefs.current.forEach((el) => {
        if (!el) return;

        let depth = 6;
        if (el.classList.contains("layer-glow"))    depth = 14;
        if (el.classList.contains("layer-outline")) depth = 22;

        const prefix = el.classList.contains("layer-outline")
          ? "translateY(-2%) scale(1.04) "
          : "";

        el.style.transform = prefix + `translate(${x * depth}px, ${y * depth}px)`;
      });
    };

    window.addEventListener("scroll",    handleScroll,   { passive: true });
    window.addEventListener("mousemove", handleTextMove);

    // Sync state on mount (handles reload at non-zero scroll position)
    handleScroll();

    return () => {
      window.removeEventListener("scroll",    handleScroll);
      window.removeEventListener("mousemove", handleTextMove);
    };
  }, []);

  return (
    <section className="hero" id="home" ref={heroRef}>
      {/*
        No <canvas> here.
        The global OrbCanvas (position: fixed, z-index: 0) in App.jsx
        renders the orb behind this section automatically.
      */}

      <div className="hero-text" ref={heroTextRef}>
        <div className="hero-eyebrow">Learn • Emerge • Aspire • Discover</div>

        <div className="layer-stack">
          <div
            className="layer layer-outline"
            ref={(el) => (layerRefs.current[0] = el)}
          >
            <span>THE MINDS</span>
            <span>BEHIND LEAD</span>
          </div>

          <div
            className="layer layer-glow"
            ref={(el) => (layerRefs.current[1] = el)}
          >
            <span>THE MINDS</span>
            <span>BEHIND LEAD</span>
          </div>

          <div
            className="layer layer-front"
            ref={(el) => (layerRefs.current[2] = el)}
          >
            <span>THE MINDS</span>
            <span>BEHIND LEAD</span>
          </div>
        </div>

        <div className="hero-sub">
          A collective of <b>builders, engineers and dreamers</b> — the people
          powering LEAD.
        </div>
      </div>

      <div className="scroll-cue">
        <span>Descend</span>
        <div className="line">
          <div className="dot"></div>
        </div>
      </div>
    </section>
  );
}

export default TeamHero;
