import React, { useEffect, useRef } from 'react';
import './Background.css';

export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = 75; // Subtle and elegant, not crowded
    const dustCount = 0; // Removed glowing dust to match dark theme

    class Particle {
      constructor(isDust = false) {
        this.isDust = isDust;
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = this.isDust 
          ? Math.random() * 80 + 40 // Cosmic dust is large and blurry
          : Math.random() * 2 + 0.5; // Stars are small and sharp
        this.speedX = (Math.random() - 0.5) * (this.isDust ? 0.08 : 0.15);
        this.speedY = (Math.random() - 0.5) * (this.isDust ? 0.08 : 0.15) - (this.isDust ? 0.02 : 0.05); // slight drift upwards
        this.opacity = Math.random() * 0.5 + 0.1;
        this.fadeSpeed = Math.random() * 0.005 + 0.002;
        this.fadeDir = Math.random() > 0.5 ? 1 : -1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Twinkle effect
        if (!this.isDust) {
          this.opacity += this.fadeDir * this.fadeSpeed;
          if (this.opacity > 0.8) this.fadeDir = -1;
          if (this.opacity < 0.1) this.fadeDir = 1;
        }

        // Boundary wrap
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        if (this.isDust) {
          // Volumetric glowing dust
          const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
          );
          gradient.addColorStop(0, `rgba(28, 95, 115, ${this.opacity * 0.08})`);
          gradient.addColorStop(0.5, `rgba(40, 125, 150, ${this.opacity * 0.03})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sharp stars
          ctx.fillStyle = `rgba(130, 220, 255, ${this.opacity})`;
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(false));
    }
    for (let i = 0; i < dustCount; i++) {
      particles.push(new Particle(true));
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // trail effect for depth
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="cosmic-background">
      {/* Canvas stars */}
      <canvas ref={canvasRef} className="particles-canvas" />

      {/* Noise Texture */}
      <div className="noise-overlay" />
    </div>
  );
}
