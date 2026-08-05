import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const StarfieldBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 8.5); // Using exact camera position from ArcReactor

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    if (mountRef.current.childNodes.length > 0) mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    // Create starfield background exactly as in ArcReactor
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

    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      // Exact rotation logic from ArcReactor
      starSystem.rotation.y = elapsedTime * 0.015;
      starSystem.rotation.x = Math.sin(elapsedTime * 0.01) * 0.1;

      renderer.render(scene, camera);
    };
    
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 0, 
        backgroundColor: '#000000' 
      }} 
    />
  );
};

export default StarfieldBackground;
