import React, { useState } from "react";
import "./Navbar.css";
import leadLogo from "../../assets/LEAD.png";

const Navbar = () => {
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { id: "about", label: "About Us" },
    { id: "domains", label: "Domains" },
    { id: "initiative", label: "Initiative" },
    { id: "leadership", label: "Leadership" },
    { id: "network", label: "Network" },
    { id: "archive", label: "Archive" },
    { id: "contact", label: "Let's Connect" },
  ];

  const scrollToSection = (id) => {
    setActiveTab(id);
    const section = document.getElementById(id);
    
    if (section) {
      // 1. Calculate the absolute pixel distance from the top of the entire document
      const targetPosition = section.getBoundingClientRect().top + window.pageYOffset;
      
      // 2. Account for your absolute floating navbar capsule placement height (around 90px padding)
      const offsetPosition = targetPosition - 90;

      // 3. Trigger a manual frame-by-frame hardware accelerated browser window glide
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="navbar-container">
      <nav className="floating-navbar">
        {/* LEAD Logo Button */}
        <div className="nav-logo-section">
          <button
            className={`nav-logo-link ${activeTab === "home" ? "active-logo" : ""}`}
            onClick={() => scrollToSection("home")}
          >
            <img src={leadLogo} alt="LEAD Logo" className="nav-logo" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="nav-links-section">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;