/**
 * ProfilePanel.jsx — Executive Spotlight Modal
 *
 * Elevation pass: shared-element transition, precise timing choreography,
 * corrected parallax direction, refined exit sequence.
 *
 * Shared element: exec-card portrait ↔ epm-portrait-inner (layoutId)
 *                 exec-card frame    ↔ epm-modal            (layoutId)
 *
 * Opening timeline (absolute from click):
 *   0ms   — Backdrop opacity 0→1
 *   80ms  — Backdrop blur 0→6px (CSS transition on backdrop filter)
 *   120ms — Modal scales 0.97→1, y 20→0 (LayoutGroup handles card→modal morph)
 *   200ms — Portrait fades in (if layoutId morph already handles it, this is a no-op)
 *   260ms — Role
 *   300ms — Name
 *   340ms — Quote
 *   400ms — About + chips
 *   450ms — Socials
 *   500ms — Meta
 *
 * Exit timeline (reverse):
 *   0ms  — Meta + Socials
 *   60ms — About + chips
 *   110ms— Quote
 *   150ms— Name
 *   190ms— Role
 *   240ms— Portrait
 *   300ms— Modal collapses
 *   380ms— Backdrop fades
 */

import { useEffect, useRef, useId, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  LayoutGroup,
} from "framer-motion";
import "./ProfilePanel.css";

/**
 * linkedInHref — normalise exec.linkedin into a valid URL.
 * Handles both a bare handle ("yuvraj-malik") and a full URL
 * ("https://www.linkedin.com/in/...") stored in the data layer.
 */
function linkedInHref(value) {
  if (!value) return "#";
  return value.startsWith("http")
    ? value
    : `https://www.linkedin.com/in/${value}`;
}

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

const GitHubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ─── Domain map ─────────────────────────────────────────────────────────── */

const domainMap = {
  "General Secretary":      ["Leadership", "Strategy", "Operations"],
  "Joint Secretary":        ["Coordination", "Communication", "Planning"],
  "Technical Secretary":    ["Engineering", "Systems", "Infrastructure"],
  "Finance Secretary":      ["Finance", "Analysis", "Strategy"],
  "Creativity Head":        ["Creative Direction", "Ideation", "Design Thinking"],
  "Designing Head":         ["UI/UX", "Visual Design", "Branding"],
  "Tech Head":              ["Development", "Architecture", "DevOps"],
  "Content Head":           ["Copywriting", "Editorial", "Storytelling"],
  "Marketing Head":         ["Marketing", "Growth", "Analytics"],
  "Logistics Head":         ["Operations", "Execution", "Project Mgmt"],
  "Event Head":             ["Event Design", "Production", "Experience"],
  "Social Media & PR Head": ["Social Strategy", "PR", "Brand Voice"],
};

/* ─── Easing constants ───────────────────────────────────────────────────── */

// Primary ease — used for all enters. Gentle deceleration, no bounce.
const E_OUT  = [0.22, 1, 0.36, 1];
// Exit ease — sharp acceleration, feels intentional not jarring.
const E_IN   = [0.36, 0, 0.66, 0];
// Layout morph ease — slightly slower, more cinematic.
const E_MORPH = [0.16, 1, 0.3, 1];

/* ─── Motion variants ────────────────────────────────────────────────────── */

const backdropV = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.32, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    // Backdrop waits for content + modal to exit first
    transition: { duration: 0.28, ease: "easeIn", delay: 0.30 },
  },
};

// Modal frame — the layoutId handles the card→modal morph automatically.
// These variants handle the non-morph case (e.g. direct URL open).
const modalV = {
  hidden:  { opacity: 0, scale: 0.97, y: 20 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.48, ease: E_OUT, delay: 0.12 },
  },
  exit: {
    opacity: 0, scale: 0.97, y: 12,
    // Modal exits after content starts collapsing
    transition: { duration: 0.28, ease: E_IN, delay: 0.18 },
  },
};

// Portrait: enters 200ms into the sequence
const portraitV = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.48, ease: E_OUT, delay: 0.20 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.20, ease: E_IN, delay: 0.10 },
  },
};

// Content wrapper — controls per-item stagger
// Timing: first child at 260ms, each subsequent child +40ms
const contentV = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren:  0.040,
      delayChildren:    0.260,
    },
  },
  exit: {
    transition: {
      staggerChildren:  0.030,
      staggerDirection: -1,     // Reverse: socials first, role last
      delayChildren:    0,
    },
  },
};

// Standard item — 8px upward reveal, clean fade
const itemV = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.40, ease: E_OUT },
  },
  exit: {
    opacity: 0, y: 5,
    transition: { duration: 0.20, ease: E_IN },
  },
};

// Name — slightly more presence in the enter animation
const nameV = {
  hidden:  { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.48, ease: E_OUT },
  },
  exit: {
    opacity: 0, y: 7,
    transition: { duration: 0.22, ease: E_IN },
  },
};

/* ─── Parallax hook ──────────────────────────────────────────────────────── */
// Portrait moves OPPOSITE to the cursor — the image appears to float behind
// a window, creating depth rather than a dragging sensation.

function useDepthParallax(maxPx = 3) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Very gentle spring — imperceptible lag, no overshoot
  const cfg = { stiffness: 55, damping: 20, mass: 0.5 };
  const x = useSpring(rawX, cfg);
  const y = useSpring(rawY, cfg);

  const onMouseMove = useCallback((e) => {
    const r  = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    // Normalise –1 → +1, then invert for depth illusion
    const nx = (e.clientX - cx) / (r.width  / 2);
    const ny = (e.clientY - cy) / (r.height / 2);
    rawX.set(-nx * maxPx);   // Negative = opposite direction = depth
    rawY.set(-ny * maxPx);
  }, [rawX, rawY, maxPx]);

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { x, y, onMouseMove, onMouseLeave };
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ProfilePanel({ exec, onClose }) {
  const titleId     = useId();
  const modalRef    = useRef(null);
  const closeBtnRef = useRef(null);
  // Ref for the modal's scrollable content column.
  // Used to (a) route wheel/keyboard events into it and (b) check event origin.
  const scrollRef   = useRef(null);

  const domains    = domainMap[exec.role] ?? [];
  const indexLabel = String(exec.id).padStart(2, "0");

  const parallax = useDepthParallax(3);

  /* ── Focus trap ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const prevFocus = document.activeElement;
    const t = setTimeout(() => closeBtnRef.current?.focus(), 280);

    const SCROLL_KEYS = new Set([
      "Space", " ", "PageDown", "PageUp",
      "ArrowDown", "ArrowUp", "Home", "End",
    ]);

    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }

      // ── Keyboard scroll routing ──────────────────────────────────────
      // Arrow/Space/PgDn keys would normally be caught by Lenis and scroll
      // the page even when Lenis is stopped. Intercept them here and
      // manually drive the modal's scroll container instead.
      if (SCROLL_KEYS.has(e.key) && scrollRef.current) {
        e.preventDefault();
        const el   = scrollRef.current;
        const step = e.key === "Space" || e.key === "PageDown" || e.key === "PageUp"
          ? el.clientHeight * 0.85
          : 80; // Arrow keys: 80px per press
        const dir =
          (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "Space" || e.key === "End")
            ? 1 : -1;
        const target =
          (e.key === "Home")  ? 0 :
          (e.key === "End")   ? el.scrollHeight :
          el.scrollTop + step * dir;
        el.scrollTo({ top: target, behavior: "smooth" });
        return;
      }

      if (e.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  /* ── Lenis scroll lock ─────────────────────────────────────────────────
     lenis.stop() is Lenis's official pause API — it freezes the background
     at its current position and preserves it for lenis.start() on close.

     Previously this effect also hand-rolled wheel/touchmove interception to
     manually drive scrollRef.scrollTop, because Lenis's own wheel/touch
     listener is bound on window with { passive: false } and, while stopped,
     calls preventDefault() on every wheel/touch event regardless of target —
     including ones inside the modal — which is what made internal scrolling
     feel heavy (no native momentum, linear per-event scrollTop assignment).

     Lenis's officially documented escape hatch for nested scrollers is the
     `data-lenis-prevent` attribute (see the epm-scroll div below): any event
     whose path includes an element with that attribute is skipped entirely
     by Lenis's handler — no preventDefault, no interception — so the
     browser scrolls that element completely natively (wheel, touchpad, and
     iOS momentum touch all just work). That removes the need for any manual
     wheel/touchmove routing here; Lenis keeps blocking background scroll
     everywhere else via the same isStopped check it already had. ──────── */
  useEffect(() => {
    const lenis = window.__LENIS__;
    lenis?.stop();

    return () => {
      lenis?.start();
    };
  }, []);

  return (
    /* Backdrop */
    <motion.div
      className="epm-backdrop"
      variants={backdropV}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      {/* ── Modal ─────────────────────────────────────────────────────── */}
      <motion.div
        ref={modalRef}
        className="epm-modal"
        /* layoutId ties this frame to the clicked exec-card */
        layoutId={`exec-card-frame-${exec.id}`}
        variants={modalV}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={parallax.onMouseMove}
        onMouseLeave={parallax.onMouseLeave}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        /* Override Framer's default layout transition with our easing */
        transition={{ duration: 0.52, ease: E_MORPH }}
      >
        {/* ── Portrait column ─────────────────────────────────────────── */}
        <div className="epm-portrait-col">
          {/* Parallax container — portrait floats opposite cursor */}
          <motion.div
            className="epm-portrait-parallax"
            style={{ x: parallax.x, y: parallax.y }}
          >
            <motion.div
              className="epm-portrait-inner"
              /* layoutId ties this portrait to the card's portrait img */
              layoutId={`exec-portrait-${exec.id}`}
              variants={portraitV}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.52, ease: E_MORPH }}
            >
              <img
                src={exec.portrait}
                alt={`Portrait of ${exec.name}`}
                className="epm-portrait-img"
                draggable="false"
                style={exec.portraitPosition ? { objectPosition: exec.portraitPosition } : undefined}
              />
            </motion.div>
          </motion.div>

          {/* Structural gradients */}
          <div className="epm-portrait-grad-bottom" aria-hidden="true" />
          <div className="epm-portrait-grad-right"  aria-hidden="true" />

          {/* Decorative index numeral */}
          <motion.span
            className="epm-index"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.35, ease: E_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            {indexLabel}
          </motion.span>
        </div>

        {/* ── Content column ──────────────────────────────────────────── */}
        <div className="epm-content-col">
          {/* Close button */}
          <motion.button
            ref={closeBtnRef}
            className="epm-close"
            onClick={onClose}
            aria-label="Close profile"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1, scale: 1,
              transition: { duration: 0.32, ease: E_OUT, delay: 0.38 },
            }}
            exit={{
              opacity: 0, scale: 0.85,
              transition: { duration: 0.16, ease: E_IN },
            }}
            whileHover={{
              rotate: 90,
              /* No scale — brief says no scaling */
              transition: { duration: 0.28, ease: E_OUT },
            }}
            whileTap={{ scale: 0.92 }}
          >
            <CloseIcon />
          </motion.button>

          {/* Scrollable area — data-lenis-prevent tells Lenis to skip this
              container entirely (its official nested-scroll escape hatch),
              so wheel/touch/trackpad scrolling here is 100% native. */}
          <div className="epm-scroll" ref={scrollRef} data-lenis-prevent>
            <motion.div
              className="epm-content"
              variants={contentV}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Role */}
              <motion.p className="epm-role" variants={itemV}>
                {exec.role}
              </motion.p>

              {/* Name */}
              <motion.h2
                id={titleId}
                className="epm-name"
                /* Also share layoutId so name morphs from card */
                layoutId={`exec-name-${exec.id}`}
                variants={nameV}
                transition={{ duration: 0.52, ease: E_MORPH }}
              >
                {exec.name}
              </motion.h2>

              {/* Quote */}
              <motion.blockquote className="epm-quote" variants={itemV}>
                <p>{exec.statement}</p>
              </motion.blockquote>

              {/* About */}
              <motion.p className="epm-about" variants={itemV}>
                {exec.firstName} is a core member of{" "}
                <strong className="epm-strong">LEAD</strong>'s executive
                board, driving{" "}
                {domains[0]?.toLowerCase() ?? "strategy"} and{" "}
                {domains[1]?.toLowerCase() ?? "operations"} forward with
                clarity and conviction. Every initiative they lead reflects a
                deep commitment to the organization's mission.
              </motion.p>

              {/* Domain chips */}
              {domains.length > 0 && (
                <motion.div className="epm-chips" variants={itemV}>
                  {domains.map((d) => (
                    <span key={d} className="epm-chip">{d}</span>
                  ))}
                </motion.div>
              )}

              {/* Social links */}
              <motion.div className="epm-socials" variants={itemV}>
                {exec.github && (
                  <a
                    href={`https://github.com/${exec.github}`}
                    className="epm-social-row"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${exec.firstName} on GitHub`}
                  >
                    <span className="epm-social-left">
                      <GitHubIcon />
                      <span className="epm-social-name">GitHub</span>
                    </span>
                    <span className="epm-social-cta">
                      View Profile <ArrowRightIcon />
                    </span>
                  </a>
                )}
                {exec.linkedin && (
                  <a
                    href={linkedInHref(exec.linkedin)}
                    className="epm-social-row"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${exec.firstName} on LinkedIn`}
                  >
                    <span className="epm-social-left">
                      <LinkedInIcon />
                      <span className="epm-social-name">LinkedIn</span>
                    </span>
                    <span className="epm-social-cta">
                      Connect <ArrowRightIcon />
                    </span>
                  </a>
                )}
              </motion.div>

              {/* Board meta */}
              <motion.p className="epm-meta" variants={itemV}>
                LEAD · Executive Board · {indexLabel}
              </motion.p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
