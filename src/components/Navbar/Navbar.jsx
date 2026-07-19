import React, { useState, useEffect } from "react";
import "./Navbar.css";
import leadLogo from "../../assets/LEAD.png";

const Navbar = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const centerItems = [
    { id: "domains", label: "Domains" },
    { id: "initiative", label: "Initiative" },
    { id: "leadership", label: "Leadership" },
    { id: "network", label: "Network" },
    { id: "archive", label: "Archive" },
  ];

  // All items for scroll tracking & mobile menu
  const navItems = [
    ...centerItems,
    { id: "contact", label: "Let's Connect" },
  ];

  // Smooth scroll when clicking
  const scrollToSection = (id) => {
    setActiveTab(id);
    setMenuOpen(false); // close mobile menu on click

    const section = document.getElementById(id);
    if (section) {
      const targetPosition =
        section.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = targetPosition - 90;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  // Update active tab while scrolling
  useEffect(() => {
    const sections = ["home", ...navItems.map((item) => item.id)];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      let currentSection = "home";

      sections.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        if (scrollPosition >= section.offsetTop) {
          currentSection = id;
        }
      });

      setActiveTab(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <div className="navbar-container">
        <nav className="floating-navbar">

          {/* Logo */}
          <div className="nav-logo-section">
            <button
              className={`nav-logo-link ${activeTab === "home" ? "active-logo" : ""}`}
              onClick={() => scrollToSection("home")}
            >
              <img src={leadLogo} alt="LEAD Logo" className="nav-logo" />
            </button>
          </div>

          {/* Desktop Centre Links: Domains → Archive */}
          <div className="nav-links-section">
            {centerItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side: Let's Connect — mirrors the logo section on the left */}
          <div className="nav-contact-section">
            <button
              className={`nav-item nav-item--contact ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => scrollToSection("contact")}
            >
              Let's Connect
            </button>
          </div>

          {/* Hamburger Button (mobile only) */}
          <button
            className={`hamburger-btn ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </nav>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}>
        <div className="mobile-menu-inner">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`mobile-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
};

export default Navbar;