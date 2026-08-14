import React, { useRef } from 'react';
import { Users, Lightbulb } from 'lucide-react';
import useMouseParallax from '../../hooks/useMouseParallax';
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
      <div className="fcard-bg-layer">
        <div className="fcard-reflection" />
        <div className="fcard-glow-bg" />
      </div>

      <div className="fcard-icon-container" style={{ marginLeft: '16px' }}>
        <Icon className="fcard-icon" />
      </div>
      <div className="fcard-text-content">
        <h3 className="fcard-title">{title}</h3>
        <p className="fcard-desc">{description}</p>
      </div>
    </div>
  );
}

export default function FeatureCards() {
  return (
    <div className="right-panel" style={{ height: '100%' }}>
      <div className="feature-cards-stack" style={{ flex: 1, justifyContent: 'center' }}>
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
