import { useEffect, useRef } from 'react';

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
    const dustCount = 15; // Larger blurry cosmic dust

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
          gradient.addColorStop(0, `rgba(157, 78, 221, ${this.opacity * 0.04})`);
          gradient.addColorStop(0.5, `rgba(123, 44, 191, ${this.opacity * 0.01})`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sharp stars
          ctx.fillStyle = `rgba(224, 170, 255, ${this.opacity})`;
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
      ctx.fillStyle = 'rgba(5, 3, 13, 0.2)'; // trail effect for depth
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
      {/* Canvas stars & dust */}
      <canvas ref={canvasRef} className="particles-canvas" />

      {/* Volumetric glow and horizon */}
      <div className="glow-horizon" />
      <div className="glow-orb glow-orb-left" />
      <div className="glow-orb glow-orb-right" />
      <div className="glow-orb glow-orb-center" />

      {/* Noise Texture */}
      <div className="noise-overlay" />

      {/* Giant transparent LEAD text behind hero */}
      <div className="giant-lead-text">LEAD</div>

      {/* Abstract Wave Mesh at the bottom */}
      <div className="wave-mesh-container">
        <svg
          className="wave-mesh"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 250"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(123, 44, 191, 0.08)" />
              <stop offset="50%" stopColor="rgba(157, 78, 221, 0.03)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(224, 170, 255, 0.06)" />
              <stop offset="100%" stopColor="rgba(123, 44, 191, 0)" />
            </linearGradient>
          </defs>
          
          {/* Animated overlapping mesh waves */}
          <path
            className="wave-path wave-path-1"
            d="M0,160 C320,240 640,80 960,180 C1280,280 1400,120 1440,160 L1440,250 L0,250 Z"
            fill="url(#wave-grad-1)"
          />
          <path
            className="wave-path wave-path-2"
            d="M0,190 C240,120 480,220 720,150 C960,80 1200,210 1440,170 L1440,250 L0,250 Z"
            fill="url(#wave-grad-2)"
          />
        </svg>
      </div>
    </div>
  );
}
