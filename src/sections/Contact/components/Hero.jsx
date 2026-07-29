import React from 'react';
import './Hero.css';

export default function Hero() {
  return (
    <header className="hero-section">
      <h1 className="hero-heading">
        Every Big Idea <br />
        Starts With <span className="gradient-highlight">Hello.</span>
      </h1>

      <p className="hero-description">
        Want to join the society, partner on an event, or pitch us something
        we haven't thought of yet? Tell us below—we read every message.
      </p>
    </header>
  );
}
