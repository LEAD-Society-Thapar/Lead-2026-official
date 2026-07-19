import React, { useRef } from 'react';
import { Users, Lightbulb } from 'lucide-react';
import useMouseParallax from '../hooks/useMouseParallax';
import './FeatureCards.css';

function FeatureCard({ icon: Icon, title, description, delayClass }) {
  const cardRef = useRef(null);
  const { rotate, reflect, isHovered } = useMouseParallax(cardRef, { maxRotation: 5.5 });

  const style = {
    '--fcard-rot-x': `${rotate.x}deg`,
    '--fcard-rot-y': `${rotate.y}deg`,
    '--fcard-reflect-x': `${reflect.x}%`,
    '--fcard-reflect-y': `${reflect.y}%`,
  };

  return (
    <div 
      ref={cardRef}
      className={`feature-card ${delayClass} ${isHovered ? 'hovered' : ''}`}
      style={style}
    >
      <div className="fcard-reflection" />
      <div className="fcard-icon-container">
        <Icon className="fcard-icon" />
      </div>
      <h3 className="fcard-title">{title}</h3>
      <p className="fcard-desc">{description}</p>
      
      {/* Dynamic undercard ambient light reflection */}
      <div className="fcard-glow-bg" />
    </div>
  );
}

export default function FeatureCards() {
  return (
    <div className="right-panel">
      <div className="feature-cards-stack">
        <FeatureCard
          icon={Users}
          title="Collaborate"
          description="Build innovative projects with LEAD."
          delayClass="float-medium"
        />
        
        <FeatureCard
          icon={Lightbulb}
          title="Innovate"
          description="Turn ideas into impactful solutions."
          delayClass="float-fast"
        />
      </div>
    </div>
  );
}
