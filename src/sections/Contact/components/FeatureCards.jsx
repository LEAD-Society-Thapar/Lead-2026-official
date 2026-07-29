import React, { useRef } from 'react';
import { Users, Handshake } from 'lucide-react';
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
          title="Join Us"
          description="Recruitments open every semester across eight domains."
          delayClass="float-medium"
        />

        <FeatureCard
          icon={Handshake}
          title="Partner With Us"
          description="Sponsor an event and reach students across the campus."
          delayClass="float-fast"
        />
      </div>
    </div>
  );
}
