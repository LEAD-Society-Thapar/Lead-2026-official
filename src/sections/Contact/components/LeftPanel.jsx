import React, { useRef } from 'react';
import { Mail } from 'lucide-react';
import { FaInstagram, FaLinkedinIn, FaGithub } from 'react-icons/fa6';
import useMouseParallax from '../hooks/useMouseParallax';
import './LeftPanel.css';

function InfoCard({ icon: Icon, title, lines, delayClass }) {
  const cardRef = useRef(null);
  const { rotate, reflect, isHovered } = useMouseParallax(cardRef, { maxRotation: 5 });

  const style = {
    '--card-rot-x': `${rotate.x}deg`,
    '--card-rot-y': `${rotate.y}deg`,
    '--card-reflect-x': `${reflect.x}%`,
    '--card-reflect-y': `${reflect.y}%`,
  };

  return (
    <div 
      ref={cardRef}
      className={`info-card ${delayClass} ${isHovered ? 'hovered' : ''}`}
      style={style}
    >
      <div className="card-glow-bg"></div>
      <div className="card-reflection" />
      <div className="card-icon-container">
        <Icon className="card-icon" />
      </div>
      <div className="card-content">
        {title === "Email Us" ? (
          <>
            <span className="card-text email-link">
              {lines[0]}
            </span>
            <p className="card-text">
              {lines[1]}
            </p>
          </>
        ) : (
          lines.map((line, idx) => (
            <p key={idx} className="card-text">
              {line}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function SocialsCard({ socialLinks, delayClass }) {
  const cardRef = useRef(null);
  const { rotate, reflect, isHovered } = useMouseParallax(cardRef, { maxRotation: 5 });

  const style = {
    '--card-rot-x': `${rotate.x}deg`,
    '--card-rot-y': `${rotate.y}deg`,
    '--card-reflect-x': `${reflect.x}%`,
    '--card-reflect-y': `${reflect.y}%`,
  };

  return (
    <div 
      ref={cardRef}
      className={`info-card socials-card-box ${delayClass} ${isHovered ? 'hovered' : ''}`}
      style={style}
    >
      <div className="card-reflection" />
      <div className="card-content socials-card-content">
        <h3 className="socials-card-title">FOLLOW LEAD</h3>
        <div className="socials-buttons">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a 
                key={social.name} 
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-btn"
                title={social.name}
              >
                <div className="social-btn-glow" />
                <div className="social-btn-inner">
                  <Icon className="social-icon" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LeftPanel() {
  const socialLinks = [
    { name: 'Instagram', icon: FaInstagram, url: 'https://www.instagram.com/lead_tiet?igsh=MWhmOHpzMnkwbThueA==' },
    { name: 'LinkedIn', icon: FaLinkedinIn, url: 'https://www.linkedin.com/company/lead-tiet/posts/?feedView=all' },
    { name: 'Github', icon: FaGithub, url: 'https://github.com/LEAD-Society-Thapar' }
  ];

  return (
    <div className="left-panel">
      <div className="cards-stack">
        <a
          href="mailto:lead_sc@thapar.edu"
          className="card-link"
        >
          <InfoCard
            icon={Mail}
            title="Email Us"
            lines={['lead_sc@thapar.edu','Click to send us an email']}
            delayClass="float-medium"
          />
        </a>
        <SocialsCard 
          socialLinks={socialLinks}
          delayClass="float-slow"
        />
      </div>
    </div>
  );
}
