// src/sections/Sponsors/ArcReactor.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';
import './ArcReactor.css'; 

// Import AI command palette
import CommandPalette from '../../components/CommandPalette';

const ArcReactor = ({ sponsors = [] }) => {
  // DOM element refs
  const mountRef = useRef(null);
  const introRef = useRef(null); 
  const uiLayerRef = useRef(null);
  
  // Modal animation refs
  const modalOverlayRef = useRef(null);
  const modalCardRef = useRef(null);
  
  // Component state variables
  const [sponsorsUI, setSponsorsUI] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  
  // Command palette visibility state
  const [isBotVisible, setIsBotVisible] = useState(false);
  
  // WebGL scene refs
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const anchorsRef = useRef([]);
  const tetherMatRef = useRef(null);
  const reactorGroupRef = useRef(null); 
  const materialsRef = useRef([]);
  
  // Animation state locks
  const isFocusedRef = useRef(false); 
  const isInitialRender = useRef(true); 
  const introCompleteRef = useRef(false); 
  const wasModalOpenRef = useRef(false); 
  const globalUIRef = useRef({ opacity: 0 }); 

  // Initialize WebGL scene
  useEffect(() => {
    // Core scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 8.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera; 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    if (mountRef.current.childNodes.length > 0) mountRef.current.innerHTML = ''; 
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; 
    controls.enablePan = false; 
    controlsRef.current = controls;

    const clock = new THREE.Clock();

    // Create starfield background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for(let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 140;     
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 100; 
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 100; 
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.8 });
    const starSystem = new THREE.Points(starGeo, starMat);
    scene.add(starSystem);

    // Master scaling group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    reactorGroupRef.current = masterGroup;

    // Initialize particle system
    const particleCount = 45000; 
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3); 
    const particlesData = [];

    const colorCore = new THREE.Color(0xffffff); 
    const colorCyan = new THREE.Color(0x00d2ff); 
    const colorFrontMetal = new THREE.Color(0x4a5a6a); 
    const colorDarkMetal = new THREE.Color(0x284b7a); 
    const colorCopper = new THREE.Color(0xc17845); 
    const colorDeepGlow = new THREE.Color(0x002288); 

    // Calculate geometric volumes
    for (let i = 0; i < particleCount; i++) {
      let tx, ty, tz; 
      let pColor = new THREE.Color();
      let radiusForAnimation = 0; 
      const pType = i / particleCount; 

      if (pType < 0.03) {
        const radius = Math.cbrt(Math.random()) * 0.3; 
        radiusForAnimation = radius;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        tx = radius * Math.sin(phi) * Math.cos(theta);
        ty = radius * Math.sin(phi) * Math.sin(theta);
        tz = 0.4 + (radius * Math.cos(phi) * 0.4); 
        pColor.copy(colorCore);
      } else if (pType < 0.08) {
        const R = 0.7; 
        const r = 0.15 * Math.sqrt(Math.random()); 
        radiusForAnimation = R;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI * 2;
        tx = (R + r * Math.cos(phi)) * Math.cos(theta);
        ty = (R + r * Math.cos(phi)) * Math.sin(theta);
        tz = 0.3 + (r * Math.sin(phi)); 
        pColor.copy(colorFrontMetal);
      } else if (pType < 0.15) {
        const numProngs = 3;
        const prongIndex = Math.floor(Math.random() * numProngs);
        const baseAngle = (Math.PI * 2 / numProngs) * prongIndex - (Math.PI / 2);
        const localX = 0.3 + Math.random() * 1.1; 
        radiusForAnimation = localX;
        const localY = (Math.random() - 0.5) * 0.45; 
        tx = localX * Math.cos(baseAngle) - localY * Math.sin(baseAngle);
        ty = localX * Math.sin(baseAngle) + localY * Math.cos(baseAngle);
        tz = 0.2 + Math.random() * 0.3; 
        pColor.copy(colorFrontMetal);
      } else if (pType < 0.35) { 
        const R = 1.6; 
        const r = 0.45 * Math.sqrt(Math.random()); 
        radiusForAnimation = R;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI * 2;
        tx = (R + r * Math.cos(phi)) * Math.cos(theta);
        ty = (R + r * Math.cos(phi)) * Math.sin(theta);
        tz = 0.0 + (r * Math.sin(phi)); 
        pColor.copy(colorCyan);
      } else if (pType < 0.45) { 
        const R = 2.5; 
        const r = 0.4 * Math.sqrt(Math.random()); 
        radiusForAnimation = R;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI * 2;
        tx = (R + r * Math.cos(phi)) * Math.cos(theta);
        ty = (R + r * Math.cos(phi)) * Math.sin(theta);
        tz = -0.3 + (r * Math.sin(phi)); 
        pColor.copy(colorDarkMetal);
      } else if (pType < 0.60) { 
        const numCoils = 10;
        const coilIndex = Math.floor(Math.random() * numCoils);
        const baseAngle = (Math.PI * 2 / numCoils) * coilIndex;
        const R = 2.5; 
        const r = 0.45 * Math.sqrt(Math.random()); 
        radiusForAnimation = R;
        const phi = Math.random() * Math.PI * 2; 
        const theta = baseAngle + ((Math.random() - 0.5) * 0.22); 
        tx = (R + r * Math.cos(phi)) * Math.cos(theta);
        ty = (R + r * Math.cos(phi)) * Math.sin(theta);
        tz = -0.3 + (r * Math.sin(phi) * 1.5); 
        pColor.copy(colorCopper);
      } else if (pType < 0.85) {
        const theta = Math.random() * Math.PI * 2; 
        const t = Math.random(); 
        const radius = 2.5 - (1.2 * t); 
        radiusForAnimation = 2.5;
        tx = radius * Math.cos(theta);
        ty = radius * Math.sin(theta);
        tz = -0.3 - (2.2 * t); 
        tx += Math.cos(theta) * ((Math.random() - 0.5) * 0.4);
        ty += Math.sin(theta) * ((Math.random() - 0.5) * 0.4);
        pColor.copy(colorDarkMetal);
      } else if (pType < 0.97) {
        const theta = Math.random() * Math.PI * 2;
        const radius = 1.3 * Math.sqrt(Math.random()); 
        radiusForAnimation = 1.3;
        tx = radius * Math.cos(theta);
        ty = radius * Math.sin(theta);
        tz = -2.5 + (Math.random() - 0.5) * 0.4; 
        pColor.copy(colorDarkMetal);
      } else {
        const radius = Math.cbrt(Math.random()) * 0.4; 
        radiusForAnimation = 0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        tx = radius * Math.sin(phi) * Math.cos(theta);
        ty = radius * Math.sin(phi) * Math.sin(theta);
        tz = -1.5 + (radius * Math.cos(phi)); 
        pColor.copy(colorDeepGlow);
      }

      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = 20 + Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;

      particlesData.push({ x: positions[i*3], y: positions[i*3+1], z: positions[i*3+2], tx, ty, tz, dist: radiusForAnimation });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); 

    const material = new THREE.PointsMaterial({ size: 0.035, transparent: true, opacity: 0, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.rotation.set(0.5, -0.4, 0); 
    particleSystem.frustumCulled = false; 
    masterGroup.add(particleSystem);

    // Create structural wireframes
    const structuralGroup = new THREE.Group();
    const borderMatsArray = []; 

    const clampMat = new THREE.LineBasicMaterial({ color: 0x7ce5e6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    borderMatsArray.push(clampMat);
    for (let i = 0; i < 3; i++) {
      const baseAngle = (Math.PI * 2 / 3) * i - (Math.PI / 2);
      const boxGeo = new THREE.BoxGeometry(1.1, 0.45, 0.3);
      const edges = new THREE.EdgesGeometry(boxGeo);
      const boxLine = new THREE.LineSegments(edges, clampMat);
      
      const localX = 0.85; 
      boxLine.position.set(localX * Math.cos(baseAngle), localX * Math.sin(baseAngle), 0.35);
      boxLine.rotation.z = baseAngle;
      structuralGroup.add(boxLine);
    }

    const ringMat = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    borderMatsArray.push(ringMat);
    
    const innerRingGeo = new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, 1.15, 0, Math.PI * 2).getPoints(64));
    const innerRing = new THREE.LineLoop(innerRingGeo, ringMat);
    structuralGroup.add(innerRing);

    const outerRingGeo = new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, 2.05, 0, Math.PI * 2).getPoints(64));
    const outerRing = new THREE.LineLoop(outerRingGeo, ringMat);
    structuralGroup.add(outerRing);

    const casingMat = new THREE.LineBasicMaterial({ color: 0x284b7a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    borderMatsArray.push(casingMat);

    const capFrontGeo = new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, 2.5, 0, Math.PI * 2).getPoints(64));
    const capFront = new THREE.LineLoop(capFrontGeo, casingMat);
    capFront.position.z = -0.3;
    structuralGroup.add(capFront);

    const capBackGeo = new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, 1.3, 0, Math.PI * 2).getPoints(64));
    const capBack = new THREE.LineLoop(capBackGeo, casingMat);
    capBack.position.z = -2.5;
    structuralGroup.add(capBack);

    for(let i=0; i<10; i++) {
        const angle = (Math.PI * 2 / 10) * i;
        const strutGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(2.5 * Math.cos(angle), 2.5 * Math.sin(angle), -0.3),
            new THREE.Vector3(1.3 * Math.cos(angle), 1.3 * Math.sin(angle), -2.5)
        ]);
        const strut = new THREE.Line(strutGeo, casingMat);
        structuralGroup.add(strut);
    }
    particleSystem.add(structuralGroup);

    // Create constellation tethers
    const localAnchorObjects = [];
    const orbitRadius = 4.8; 

    const tetherGeo = new THREE.BufferGeometry();
    const tetherPositions = new Float32Array(sponsors.length * 6); 
    tetherGeo.setAttribute('position', new THREE.BufferAttribute(tetherPositions, 3));
    const tetherMat = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending });
    const tetherSystem = new THREE.LineSegments(tetherGeo, tetherMat);
    particleSystem.add(tetherSystem);
    tetherMatRef.current = tetherMat;

    sponsors.forEach((sponsor, index) => {
      const anchor = new THREE.Object3D();
      const phi = Math.acos(1 - 2 * (index + 0.5) / sponsors.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      anchor.position.set(orbitRadius * Math.cos(theta) * Math.sin(phi), orbitRadius * Math.sin(theta) * Math.sin(phi), orbitRadius * Math.cos(phi));
      particleSystem.add(anchor);
      localAnchorObjects.push({ data: sponsor, ref: anchor, index }); 
    });
    
    anchorsRef.current = localAnchorObjects;

    // Cache material transitions
    materialsRef.current = [
      { mat: material, baseOpacity: 0.85 },
      { mat: tetherMat, baseOpacity: 0.25 },
      { mat: clampMat, baseOpacity: 0.5 },
      { mat: ringMat, baseOpacity: 0.5 },
      { mat: casingMat, baseOpacity: 0.5 }
    ];

    // Reset UI opacities
    if (uiLayerRef.current) gsap.set(uiLayerRef.current, { opacity: 0 });

    // Animate intro text
    if (introRef.current) {
      gsap.to(introRef.current, { 
        y: "-150px", opacity: 0, duration: 1.5, delay: 2.5, ease: "power2.inOut",
        onComplete: () => { if (introRef.current) introRef.current.style.display = "none"; }
      });
    }

    // Animate particle assembly
    gsap.to(material, { opacity: 0.85, duration: 2.0, delay: 3.0, ease: "power2.inOut" });
    
    particlesData.forEach((p, i) => {
      gsap.to(p, {
        x: p.tx, y: p.ty, z: p.tz,
        duration: 2.5 + Math.random() * 1.5,
        delay: 3.0 + (p.dist * 0.2) + (Math.random() * 0.2), 
        ease: "power3.out",
        onUpdate: () => {
          const posArray = geometry.attributes.position.array;
          posArray[i * 3] = p.x; posArray[i * 3 + 1] = p.y; posArray[i * 3 + 2] = p.z;
          geometry.attributes.position.needsUpdate = true;
        }
      });
    });

    // Fade in subsystems
    borderMatsArray.forEach(mat => {
        gsap.to(mat, { opacity: 0.5, duration: 2.0, delay: 5.0, ease: "power2.inOut" });
    });

    // Show bot on load
    gsap.to(tetherMat, { 
      opacity: 0.25, 
      duration: 2.0, 
      delay: 5.5, 
      ease: "power2.inOut", 
      onComplete: () => {
        introCompleteRef.current = true;
        setIsBotVisible(true); 
      }
    });

    gsap.to(globalUIRef.current, { opacity: 1, duration: 2.0, delay: 5.5, ease: "power2.inOut" });
    
    if (uiLayerRef.current) {
        gsap.to(uiLayerRef.current, { opacity: 1, duration: 2.0, delay: 5.5, ease: "power2.inOut" });
    }

    // Main render loop
    let animationFrameId;
    const tempVector = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      masterGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.1;
      
      if (!isFocusedRef.current) {
         masterGroup.rotation.z += 0.002; 
      }
      
      starSystem.rotation.y = elapsedTime * 0.015;
      starSystem.rotation.x = Math.sin(elapsedTime * 0.01) * 0.1;

      if (tetherMatRef.current && introCompleteRef.current) {
          const targetOpacity = isFocusedRef.current ? 0.03 : 0.25;
          tetherMatRef.current.opacity += (targetOpacity - tetherMatRef.current.opacity) * 0.05;
      }

      const tethers = tetherGeo.attributes.position.array;
      localAnchorObjects.forEach((obj) => {
        const i = obj.index * 6;
        tethers[i] = 0; tethers[i+1] = 0; tethers[i+2] = 0.2; 
        tethers[i+3] = obj.ref.position.x; tethers[i+4] = obj.ref.position.y; tethers[i+5] = obj.ref.position.z;
      });
      tetherGeo.attributes.position.needsUpdate = true;

      controls.update(); 
      renderer.render(scene, camera);

      // Project DOM UI
      if (mountRef.current && !isFocusedRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const projectedSponsors = localAnchorObjects.map((anchorObj) => {
          anchorObj.ref.getWorldPosition(tempVector);
          const distanceToCamera = camera.position.distanceTo(tempVector);
          
          tempVector.project(camera);
          const x = (tempVector.x * 0.5 + 0.5) * width;
          const y = (tempVector.y * -0.5 + 0.5) * height;
          const scale = Math.max(0.3, 6.0 / distanceToCamera); 
          const zIndex = Math.round(100 - distanceToCamera);
          
          const isBehind = distanceToCamera > 8.5;
          const baseOpacity = isBehind ? 0.15 : 1.0;
          const finalOpacity = baseOpacity * globalUIRef.current.opacity;
          
          return { ...anchorObj.data, x, y, scale, zIndex, opacity: finalOpacity, isBehind };
        });
        setSponsorsUI(projectedSponsors);
      }
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      gsap.killTweensOf("*"); 
      controls.dispose(); geometry.dispose(); material.dispose();
      starGeo.dispose(); starMat.dispose(); tetherGeo.dispose(); tetherMat.dispose();
      renderer.dispose();
    };
  }, [sponsors]); 

  // Open sponsor modal
  useEffect(() => {
    if (!reactorGroupRef.current) return;
    if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
    }

    if (selectedSponsor && !wasModalOpenRef.current) {
      isFocusedRef.current = true;
      wasModalOpenRef.current = true; 
      
      // Hide bot on focus
      setIsBotVisible(false);

      // Animate 3D and UI
      gsap.to(globalUIRef.current, { opacity: 0, duration: 0.4 });
      if (uiLayerRef.current) gsap.to(uiLayerRef.current, { opacity: 0, duration: 0.4, ease: "power2.out" });
      
      gsap.to(reactorGroupRef.current.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 1.2, ease: "power3.inOut" });
      materialsRef.current.forEach(({ mat }) => {
          gsap.to(mat, { opacity: 0, duration: 0.8, ease: "power2.out" });
      });

      // Animate modal entry
      if (modalOverlayRef.current) {
          modalOverlayRef.current.style.display = "flex";
          gsap.to(modalOverlayRef.current, { opacity: 1, duration: 0.4 });
      }
      if (modalCardRef.current) {
          gsap.fromTo(modalCardRef.current, 
              { opacity: 0, scale: 0.8, y: 40 }, 
              { opacity: 1, scale: 1, y: 0, duration: 0.6, delay: 0.2, ease: "back.out(1.5)" }
          );
      }
    }
  }, [selectedSponsor]);

  // Close sponsor modal
  const handleCloseModal = () => {
      if (modalCardRef.current) {
          gsap.to(modalCardRef.current, { scale: 0.9, y: 30, opacity: 0, duration: 0.3, ease: "power2.in" });
      }
      
      if (modalOverlayRef.current) {
          gsap.to(modalOverlayRef.current, { 
              opacity: 0, 
              duration: 0.4, 
              delay: 0.1,
              ease: "power2.in", 
              onComplete: () => { 
                  modalOverlayRef.current.style.display = "none"; 
                  setSelectedSponsor(null); 
                  wasModalOpenRef.current = false;
              }
          });
      }

      // Restore 3D elements
      gsap.to(reactorGroupRef.current.scale, { x: 1, y: 1, z: 1, duration: 1.2, delay: 0.2, ease: "power3.inOut" });
      materialsRef.current.forEach(({ mat, baseOpacity }) => {
          gsap.to(mat, { opacity: baseOpacity, duration: 1.0, delay: 0.2, ease: "power2.inOut" });
      });

      // Restore floating logos
      gsap.to(globalUIRef.current, { opacity: 1, duration: 0.8, delay: 0.6 });
      if (uiLayerRef.current) {
          gsap.to(uiLayerRef.current, { opacity: 1, duration: 0.8, delay: 0.6, ease: "power2.inOut" });
      }
      
      // Show bot on close
      setIsBotVisible(true);

      setTimeout(() => { isFocusedRef.current = false; }, 800);
  };

  return (
    <div className="reactor-container">
      <div ref={mountRef} className="canvas-container" />
      
      <div ref={introRef} className="intro-container">
        <div className="intro-eyebrow">LEARN &bull; EMERGE &bull; ASPIRE &bull; DISCOVER</div>
        <div className="intro-title">OUR NETWORK</div>
        <div className="intro-subtitle">The incredible partners powering the future of LEAD.</div>
      </div>

      <div ref={uiLayerRef} className="ui-layer">
        {sponsorsUI.map((sp) => (
          <div
            key={sp.id}
            className="sponsor-logo"
            onClick={() => setSelectedSponsor(sp)}
            style={{
              left: `${sp.x}px`,
              top: `${sp.y}px`,
              zIndex: sp.zIndex,
              opacity: sp.opacity,
              pointerEvents: sp.isBehind || selectedSponsor ? 'none' : 'auto',
              '--dynamic-scale': sp.scale
            }}
          >
            <img src={sp.logo} alt={sp.name} draggable="false" />
          </div>
        ))}
      </div>

      <div ref={modalOverlayRef} className="hud-modal-overlay">
        {selectedSponsor && (
          <div ref={modalCardRef} className="hud-modal-content">
            <div className="modal-inner-border">
              
              <div className="hud-corner tl"></div>
              <div className="hud-corner br"></div>
              
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
              
              <div className="modal-left">
                <div className="modal-logo-container">
                  <img src={selectedSponsor.logo} alt={selectedSponsor.name} draggable="false" />
                </div>
                <div className="tech-barcode"></div>
              </div>
              
              <div className="modal-right">
                <h2>{selectedSponsor.name}</h2>
                <p>{selectedSponsor.description || "A proud partner of the LEAD Society. Together, we are bridging the gap between innovation and student excellence through cutting-edge technology and mentorship."}</p>
                
              <div className="modal-buttons">
                <a href={selectedSponsor.url || "#"} target="_blank" rel="noreferrer" className="btn-hud primary">
                  {selectedSponsor.urlText || "VISIT WEBSITE"}
                </a>
                <a href={selectedSponsor.contact || "#"} target="_blank" rel="noreferrer" className="btn-hud secondary">
                  {selectedSponsor.contactText || "CONTACT US"}
                </a>
              </div>
              </div>
              
            </div>
          </div>
        )}
      </div>

      {/* Render command palette */}
      <CommandPalette visible={isBotVisible} />

    </div>
  );
};

export default ArcReactor;