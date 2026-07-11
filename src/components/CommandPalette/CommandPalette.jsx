// Import required dependencies
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Home, Calendar, Users, HelpCircle, ArrowRight, Star, Image, Mail } from 'lucide-react';
import './CommandPalette.css';

// Custom social icons
const InstagramIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

const LinkedinIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect width="4" height="12" x="2" y="9"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const GithubIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
    <path d="M9 18c-4.51 2-5-2-7-2"></path>
  </svg>
);

// Core roster data
const EB_ROSTER = {
  joint_secretary: { name: "Manya Kedia", role: "Joint Secretary", url: "https://www.linkedin.com/in/manya-kedia-157b08272/" },
  technical_secretary: { name: "Yuvraj Malik", role: "Technical Secretary", url: "https://www.linkedin.com/in/yuvraj-malik27/" }
};

// System AI context
const SYSTEM_CONTEXT = `
You are the official AI Console Assistant for the LEAD Society at Thapar Institute (TIET). 
Answer in FIRST PERSON as a sharp, highly technical, confident peer organization bot.

Use this exact information to construct answers about LEAD:
- About Us: LEAD stands for Learn, Emerge, Aspire, Discover. We are a premier student-run organization at TIET bridging technical engineering, holistic development, and industry collaboration. Fosters peer-to-peer learning and open-source systems.
- Major Events: We organize three major flagship initiatives.
  1. MATRIX 4.0: 3-day flagship fest split into Tech, Non-Tech, and Semi-Tech tracks.
  2. SEAFERNO: High-energy 1-day semi-tech event serving as a precursor hype machine for Matrix.
  3. LEADCODE: Intense overnight hacking arena held exclusively for internal LEAD members.
  ***CRITICAL RULE***: If a user asks about events, list them briefly and ALWAYS append this exact markdown text at the end of your response so they can view the page: [Explore Our Initiatives](#events)
- Core Projects: "Code Vault", a custom-built full-stack MERN framework engineered to scale for real-time submission tracking.
- Departments: Technical, Design, Content, PR & Marketing, and Media.
- Roster/Executive Board: Manya Kedia is the Joint Secretary. Yuvraj Malik is the Technical Secretary.
- Recruitment Cycles: Conducted twice per batch. Phase 1 (Sept-Oct) for incoming freshers. Phase 2 (May-June) as they transition into their second year.
- Communications: Official mail is lead_sc@thapar.edu.

Rules: Keep responses strictly limited to 2-3 short sentences. Format text cleanly. Use Markdown for bolding (**text**). Never mention unrelated individuals. If you lack info, redirect users to talk to us at lead_sc@thapar.edu.
`;

export default function CommandPalette({ visible }) {
  // Component state setup
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const inputRef = useRef(null);
  const aiPanelRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Handle AI link clicks
  useEffect(() => {
    const handleAiLinkClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        setOpen(false);
        const elementId = target.getAttribute('href');
        const element = document.querySelector(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.log(`Routing execution context shifted to: ${elementId}`);
        }
      }
    };
    
    const panel = aiPanelRef.current;
    if (panel) {
      panel.addEventListener('click', handleAiLinkClick);
      return () => panel.removeEventListener('click', handleAiLinkClick);
    }
  }, [aiResponse]);

  // Handle section routing
  const handleRouting = (elementId) => {
    setOpen(false);
    const target = document.querySelector(elementId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.log(`Routing execution context shifted to: ${elementId}`);
    }
  };

  // Handle external links
  const handleExternalLink = (url) => {
    setOpen(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Process local quick queries
  const processLocalQuery = (lowerInput) => {
    if (/\b(full form|stand for|stands for|acronym|meaning)\b/.test(lowerInput) && lowerInput.includes('lead')) {
      return "LEAD stands for **Learn, Emerge, Aspire, Discover**.";
    }
    if (/\b(joint|manya|js)\b/.test(lowerInput)) {
      return `Our Joint Secretary is <strong>Manya Kedia</strong>. Check out her work or reach out here: <a href="${EB_ROSTER.joint_secretary.url}" target="_blank" rel="noopener noreferrer">LinkedIn Profile</a>.`;
    }
    if (/\b(technical|yuvraj|ts)\b/.test(lowerInput)) {
      return `Our Technical Secretary is <strong>Yuvraj Malik</strong>. Check out his work or reach out here: <a href="${EB_ROSTER.technical_secretary.url}" target="_blank" rel="noopener noreferrer">LinkedIn Profile</a>.`;
    }
    if (/\b(join|recruit|member)\b/.test(lowerInput)) {
      return "LEAD runs two recruitment phases per batch: <strong>Phase 1 (Sept-Oct)</strong> for incoming freshers and <strong>Phase 2 (May-June)</strong> as they transition into their sophomore year.";
    }
    if (/\b(project|code vault)\b/.test(lowerInput)) {
      return "We build the tech that runs our ecosystem, like <strong>Code Vault</strong>—our custom-engineered, full-stack MERN platform built to handle massive traffic loops during live hackathons.";
    }
    return null;
  };

  // Groq API integration
  const handleAssistantQuery = async (stringVal) => {
    const cleansedInput = stringVal.trim().toLowerCase();
    if (!cleansedInput) return;

    const localMatch = processLocalQuery(cleansedInput);
    if (localMatch) {
      setAiResponse(localMatch);
      return;
    }

    setLoading(true);
    setAiResponse("");

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        setAiResponse("System Environment Error: Groq API Key configuration missing inside .env structure.");
        setLoading(false);
        return;
      }

      const connection = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_CONTEXT },
            { role: "user", content: stringVal }
          ],
          max_tokens: 150,
          temperature: 0.4 
        })
      });

      if (!connection.ok) throw new Error(`Inference returned status code: ${connection.status}`);

      const data = await connection.json();
      let outcomeText = data?.choices?.[0]?.message?.content || "No connection payload generated.";
      
      // Parse bold text
      outcomeText = outcomeText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      
      // Parse markdown links
      outcomeText = outcomeText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        const isExternal = url.startsWith('http');
        const targetProps = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${url}"${targetProps}>${text}</a>`;
      });
      
      // Parse raw emails
      outcomeText = outcomeText.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g, '<a href="mailto:$1">$1</a>');

      setAiResponse(outcomeText);
    } catch (err) {
      console.error(err);
      setAiResponse("Inference link timed out. Reach out via email structure directly: <a href='mailto:lead_sc@thapar.edu'>lead_sc@thapar.edu</a>.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`cp-fab-wrap ${visible ? 'visible' : 'hidden'}`}>
        {showTooltip && !open && (
          <div className="cp-tooltip-wrap">
            <span className="cp-tooltip-text">Have any doubts? Ask us!</span>
            <button 
              className="cp-tooltip-close" 
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <div className="cp-fab-pulse" />
        <button 
          className="cp-fab" 
          onClick={() => {
            setOpen(true);
            setShowTooltip(false);
          }} 
          aria-label="Open System Terminal"
        >
          <span className="cp-fab-symbol">&gt;_</span>
        </button>
      </div>

      {open && (
        <div className="cp-overlay" onClick={() => setOpen(false)}>
          <div className="cp-panel" onClick={(e) => e.stopPropagation()}>
            
            <div className="cp-header">
              <span className="cp-title-badge">LEAD Core Terminal Engine</span>
              <button className="cp-close-trigger" onClick={() => setOpen(false)}>&times;</button>
            </div>

            <div className="cp-input-container">
              <Search size={16} color="rgba(168, 85, 247, 0.7)" />
              <input
                ref={inputRef}
                className="cp-input-field"
                type="text"
                value={query}
                placeholder="Ask about events, board members, recruitments..."
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!e.target.value) setAiResponse("");
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAssistantQuery(query);
                }}
              />
              {query && (
                <button className="cp-close-trigger" style={{ fontSize: '14px' }} onClick={() => { setQuery(""); setAiResponse(""); }}>&times;</button>
              )}
            </div>

            {!query && (
              <div className="cp-menu-list">
                <div className="cp-group-header">Navigation Modules</div>
                <div className="cp-menu-row" onClick={() => handleRouting('#hero')}>
                  <Home size={14} color="#00d2ff" />
                  <span className="cp-row-label">Go to Home</span>
                  <span className="cp-row-desc">Overview</span>
                </div>
                <div className="cp-menu-row" onClick={() => handleRouting('#events')}>
                  <Calendar size={14} color="#00d2ff" />
                  <span className="cp-row-label">Go to Events</span>
                  <span className="cp-row-desc">Our Initiatives</span>
                </div>
                <div className="cp-menu-row" onClick={() => handleRouting('#team')}>
                  <Users size={14} color="#00d2ff" />
                  <span className="cp-row-label">Go to Team</span>
                  <span className="cp-row-desc">Our Leadership</span>
                </div>
                <div className="cp-menu-row" onClick={() => handleRouting('#sponsors')}>
                  <Star size={14} color="#00d2ff" />
                  <span className="cp-row-label">Go to Sponsors</span>
                  <span className="cp-row-desc">Our Network</span>
                </div>
                <div className="cp-menu-row" onClick={() => handleRouting('#gallery')}>
                  <Image size={14} color="#00d2ff" />
                  <span className="cp-row-label">Go to Gallery</span>
                  <span className="cp-row-desc">Archive</span>
                </div>
                <div className="cp-menu-row" onClick={() => handleRouting('#contact')}>
                  <Mail size={14} color="#00d2ff" />
                  <span className="cp-row-label">Go to Contact Us</span>
                  <span className="cp-row-desc">Let's Connect</span>
                </div>

                <div className="cp-group-header" style={{ marginTop: '8px' }}>Know More About Us At</div>
                <div className="cp-menu-row" onClick={() => handleExternalLink('https://www.instagram.com/lead_tiet/?hl=en')}>
                  <InstagramIcon size={14} color="#00d2ff" />
                  <span className="cp-row-label">Our Instagram</span>
                  <span className="cp-row-desc">@lead_tiet</span>
                </div>
                <div className="cp-menu-row" onClick={() => handleExternalLink('https://www.linkedin.com/company/lead-tiet/')}>
                  <LinkedinIcon size={14} color="#00d2ff" />
                  <span className="cp-row-label">Our LinkedIn</span>
                  <span className="cp-row-desc">LEAD Society</span>
                </div>
                <div className="cp-menu-row" onClick={() => handleExternalLink('https://github.com/LEAD-Society-Thapar')}>
                  <GithubIcon size={14} color="#00d2ff" />
                  <span className="cp-row-label">Our GitHub</span>
                  <span className="cp-row-desc">Open Source</span>
                </div>
              </div>
            )}

            {(loading || aiResponse) && (
              <div className="cp-ai-panel" ref={aiPanelRef}>
                <div className="cp-ai-label">System Response</div>
                {loading ? (
                  <div className="cp-loader-dots">
                    <div className="cp-dot" />
                    <div className="cp-dot" />
                    <div className="cp-dot" />
                  </div>
                ) : (
                  <p className="cp-ai-text" dangerouslySetInnerHTML={{ __html: aiResponse }} />
                )}
              </div>
            )}

            {query && !loading && !aiResponse && (
              <div className="cp-menu-row" style={{ borderTop: '1px solid rgba(168, 85, 247, 0.15)' }} onClick={() => handleAssistantQuery(query)}>
                <HelpCircle size={14} color="#d8b4fe" />
                <span className="cp-row-label" style={{ color: '#d8b4fe' }}>Press Enter to query internal AI core module</span>
                <ArrowRight size={12} color="#d8b4fe" style={{ marginLeft: 'auto' }} />
              </div>
            )}

            <div className="cp-footer">
              LEAD-AI
            </div>

          </div>
        </div>
      )}
    </>
  );
}