import React, { useRef } from 'react';
import useMouseParallax from '../hooks/useMouseParallax';
import './GlassPlatform.css';

export default function GlassPlatform({ children }) {
  const platformRef = useRef(null);
  // Max rotation is small (e.g. 1 degree) so that it combined with the base tilt stays within 4°-7°
  const { rotate, reflect, isHovered } = useMouseParallax(platformRef, { maxRotation: 1 });

  // Base tilt: rotateX = 5.5deg, rotateY = -4.5deg
  const style = {
    '--rot-x': `${1 + rotate.x}deg`,
    '--rot-y': `${-1 + rotate.y}deg`,
    '--reflect-x': `${reflect.x}%`,
    '--reflect-y': `${reflect.y}%`,
  };

  return (
    <div className="platform-viewport">
      <div 
        className={`glass-platform ${isHovered ? 'hovered' : ''}`}
        style={style}
      >
        {/* Physical thickness refraction layers */}
        <div className="glass-edge-top" />
        <div className="glass-edge-left" />
        <div className="glass-reflection-layer" />
        
        {/* Content container */}
        <div
          ref={platformRef}
          className={`platform-content ${isHovered ? 'hovered' : ''}`}
        >
          {children}
        </div>
      </div>
      
      {/* Levitating shadow and ambient purple glow underneath */}
      <div className="platform-shadow-glow" />
    </div>
  );
}
