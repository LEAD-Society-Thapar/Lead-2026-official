import React from 'react';
import './Hero.css';

export default function Hero() {
  return (
    <header className="hero-section">
      <div className="glow-pill-container">
        <div className="glow-pill">
          <span className="glow-pill-dot" />
          <span className="glow-pill-text">LET'S CONNECT</span>
        </div>
      </div>
      
      <h1 className="hero-heading" style={{ marginBottom: '24px' }}>
        Ready to Build <br />
        Something <span className="gradient-highlight">Amazing?</span>
      </h1>
      
    </header>
  );
}
