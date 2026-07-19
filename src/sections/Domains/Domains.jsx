import React, { useEffect, useRef, useState } from "react";
import { DOMAIN_DATA } from "./Data";
import "./Domains.css";

// SVG Icons
const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Fallback helper functions for domains with empty arrays
const getDomainMembers = (domain) => {
  if (domain.members && domain.members.length > 0) {
    return domain.members;
  }
  return [
    { name: "John Doe", linkedin: "https://linkedin.com" },
    { name: "Jane Smith", linkedin: "https://linkedin.com" },
    { name: "Alex Johnson", linkedin: "https://linkedin.com" },
    { name: "Emily Davis", linkedin: "https://linkedin.com" },
  ];
};

const getDomainProjects = (domain) => {
  if (domain.projects && domain.projects.length > 0) {
    return domain.projects;
  }
  return [
    {
      title: "Project Alpha",
      creator: "John Doe",
      github: "https://github.com",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam convallis tellus id dui elementum.",
    },
    {
      title: "Project Beta",
      creator: "Jane Smith",
      github: "https://github.com",
      description: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
    },
  ];
};

export default function Domains() {
  const trackRef = useRef(null);
  const autoScrollRef = useRef(null);
  const isInteracting = useRef(false);
  const interactionTimeoutRef = useRef(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [bookOpened, setBookOpened] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleWheel = (e) => {
      // Only hijack scroll when the gesture is primarily horizontal,
      // OR when the user is hovering over the track and scrolling horizontally.
      // This lets vertical page scroll pass through normally.
      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);

      if (isHorizontalScroll) {
        e.preventDefault();
        track.scrollLeft += e.deltaX;
      }
      // Vertical scroll: do NOT preventDefault — let the page scroll naturally
    };

    track.addEventListener("wheel", handleWheel, { passive: false });
    return () => track.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const scrollSpeed = 0.6;
    const drift = () => {
      if (!isInteracting.current && !selectedDomain) {
        if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 1) {
          track.scrollLeft = 0;
        } else {
          track.scrollLeft += scrollSpeed;
        }
      }
      autoScrollRef.current = requestAnimationFrame(drift);
    };

    autoScrollRef.current = requestAnimationFrame(drift);
    return () => {
      cancelAnimationFrame(autoScrollRef.current);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [selectedDomain]);

  const pauseDrift = () => {
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    isInteracting.current = true;
  };

  const resumeDrift = () => {
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    // Delays resuming the auto-drift scroll by 2.5 seconds.
    // This gives the browser's native horizontal swipe momentum scroll
    // ample time to complete and settle before programmatic drifting starts again.
    interactionTimeoutRef.current = setTimeout(() => {
      isInteracting.current = false;
    }, 2500);
  };

  const openBook = (domain) => {
    setSelectedDomain(domain);
    // Brief delay to allow overlay to render, then open the book
    setTimeout(() => {
      setBookOpened(true);
    }, 50);
  };

  const closeBook = () => {
    setBookOpened(false);
    // Wait for the transition to finish before unmounting the modal overlay
    setTimeout(() => {
      setSelectedDomain(null);
    }, 800);
  };

  // Close book on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedDomain) {
        closeBook();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDomain]);

  return (
    <section id="domains" className="domain-section-wrapper">
      <div className="domain-header-block">
        <span className="about-tag">02 / SPECIALIZATIONS</span>
        <h2 className="about-title">Our Domains</h2>
      </div>

      <div className="slider-master-container">
        {/* Layer 1: Master Background Rod */}
        <div className="thick-metallic-rod"></div>

        {/* Edge fading overlays — blend rod & cards softly into page background */}
        <div className="slider-edge-fade left-fade"></div>
        <div className="slider-edge-fade right-fade"></div>

        <div
          className="domain-slider-track"
          ref={trackRef}
          onMouseEnter={pauseDrift}
          onMouseLeave={resumeDrift}
          onTouchStart={pauseDrift}
          onTouchEnd={resumeDrift}
        >
          <div className="domain-slider-spacer"></div>
          {DOMAIN_DATA.map((domain) => (
            <div key={domain.id} className="hanging-card" onClick={() => openBook(domain)}>
              {/* Layer 2: The Swinging Card physics wrapper */}
              <div className="card-swing-wrapper">
                <div className="card-body">
                  <div className="card-top">
                    <span className="card-number">{domain.id}</span>
                  </div>
                  <h3 className="card-title">{domain.title}</h3>
                  <p className="card-desc">{domain.desc}</p>
                  <span className="card-click-to-open">Click to open</span>
                </div>
                {/* The aesthetic ring sitting on the hole */}
                <div className="card-rod-hole-ring"></div>
              </div>

              {/* Layer 3: The 3D Phantom Rod (Overlaps the right side of the card) */}
              <div className="fake-front-rod"></div>
            </div>
          ))}
          <div className="domain-slider-spacer"></div>
        </div>
      </div>

      {/* 3D Book Interactive Modal */}
      {selectedDomain && (
        <div className="book-modal-overlay" onClick={closeBook}>
          <div className={`book-container ${bookOpened ? "opened" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="book-wrapper">

              {/* Back Cover */}
              <div className="book-back-cover"></div>

              {/* Left Page (Members) */}
              <div className="book-page book-left-page">
                <h4 className="book-page-subtitle">MEMBERS</h4>
                <div className="book-page-content scrollable-page-content">
                  {getDomainMembers(selectedDomain).map((member, index) => (
                    <div key={index} className="book-member-row">
                      <span className="book-member-name">{member.name}</span>
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="book-member-social" title="LinkedIn Profile">
                        <LinkedInIcon />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Page (Projects) */}
              <div className="book-page book-right-page">
                <h4 className="book-page-subtitle">FEATURED PROJECTS</h4>
                <div className="book-page-content scrollable-page-content">
                  {getDomainProjects(selectedDomain).map((project, index) => (
                    <div key={index} className="book-project-card">
                      <div className="book-project-header">
                        <h5 className="book-project-title">{project.title}</h5>
                        <a href={project.github} target="_blank" rel="noopener noreferrer" className="book-project-link" title="GitHub Repository">
                          <GithubIcon />
                        </a>
                      </div>
                      <p className="book-project-desc">{project.description}</p>
                      {project.creator && (
                        <div className="book-project-creator">
                          <span>By: {project.creator}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Front Cover (hinges on the left side of the right page, flips 180 deg to the left) */}
              <div className="book-cover-front">
                <div className="book-cover-top">
                  <span className="book-cover-number">{selectedDomain.id}</span>
                </div>
                <div className="book-cover-center">
                  <h3 className="book-cover-title">{selectedDomain.title}</h3>
                  <div className="book-cover-divider"></div>
                  <p className="book-cover-tagline">DOMAIN SPECS</p>
                </div>
                <div className="book-cover-bottom">
                  <span className="book-cover-prompt">Click to Open</span>
                </div>
              </div>

            </div>

            <button className="book-close-btn" onClick={closeBook} aria-label="Close Book">
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
