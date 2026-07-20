import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  useScroll,
  useTransform,
  useMotionValueEvent,
  motion,
  AnimatePresence,
  LayoutGroup,
} from "framer-motion";
import { executives } from "../../data/teamData";
import ProfilePanel from "./ProfilePanel";
import { useCardTilt } from "./hooks/useCardTilt";
import "./ExecutiveSection.css";

// Checked once at module level — no per-render overhead.
// The result is stable for the lifetime of the page.
const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * linkedInHref — normalise whatever is stored in exec.linkedin into a
 * fully-qualified URL that will always open the correct LinkedIn page.
 *
 * The data layer is inconsistent:
 *   • Most entries store just a handle:  "yuvraj-malik"
 *   • Some entries store a full URL:     "https://www.linkedin.com/in/..."
 *
 * Strategy:
 *   1. If the value already starts with "http" → use it as-is.
 *   2. Otherwise → prefix with the LinkedIn profile base URL.
 *
 * This means the data layer can store either format and the UI always works.
 */
function linkedInHref(value) {
  if (!value) return "#";
  return value.startsWith("http")
    ? value
    : `https://www.linkedin.com/in/${value}`;
}

/* ─── Minimalist SVG icons ─────────────────────────────────────────────── */
const GitHubIcon = () => (
  <svg
    className="exec-social-icon-svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedInIcon = () => (
  <svg
    className="exec-social-icon-svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

/* ─── Single executive card ─────────────────────────────────────────────── */
// Memoized: ExecutiveSection re-renders on every scroll-progress tick during
// the Hero → Executive transition (Framer's useScroll/useMotionValueEvent).
// Without memo, all 12 cards (each a motion.button with its own tilt hook,
// portrait, and layoutId) would re-render on every one of those ticks even
// though their own props rarely change. onSelect is stabilized with
// useCallback below so its reference doesn't defeat this memoization.
const ExecCard = memo(function ExecCard({
  exec,
  absoluteIndex,
  isVisible,
  isActive,
  isDimmed,
  onSelect,
}) {
  const [hovered, setHovered] = useState(false);

  // 3D tilt hook — attaches to the wrapper div, not the motion.button.
  // This keeps the CSS tilt transform completely isolated from Framer's
  // transform chain (y, scale, layoutId corrections) — no conflict.
  const tiltRef = useCardTilt(REDUCED_MOTION);

  return (
    /*
      Tilt wrapper: receives perspective() rotateX() rotateY() from the hook.
      It is a plain div — no Framer involvement — so there is zero transform
      conflict with the motion.button inside it.
    */
    <div ref={tiltRef} className="exec-card-tilt-wrapper">
      <motion.button
        key={exec.id}
        type="button"
        /* layoutId matches epm-modal's layoutId — card frame morphs into modal */
        layoutId={`exec-card-frame-${exec.id}`}
        className={`exec-card ${isActive ? "is-active" : ""} ${isDimmed ? "is-dimmed" : ""} ${hovered ? "is-hovered" : ""}`}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : 20,
          scale: isVisible ? 1 : 0.98,
        }}
        transition={{
          duration: isVisible ? 0.35 : 0.3,
          delay: isVisible ? (absoluteIndex % 4) * 0.03 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{
          y: -11,
          scale: 1.02,
          transition: {
            duration: 0.38,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        onClick={() => onSelect(exec, absoluteIndex)}
      >
        {/* Portrait — layoutId matches epm-portrait-inner */}
        <motion.div
          className="exec-card-portrait"
          layoutId={`exec-portrait-${exec.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{
            duration: 0.35,
            delay: 0.08 + (absoluteIndex % 4) * 0.03,
          }}
        >
          <img
            src={exec.portrait}
            alt={exec.name}
            loading="lazy"
            decoding="async"
            style={(exec.cardPortraitPosition || exec.portraitPosition)
              ? { objectPosition: exec.cardPortraitPosition ?? exec.portraitPosition }
              : undefined}
          />
        </motion.div>

        {/*
          Light highlight overlay.
          Reads --light-x, --light-y, --light-opacity from the tilt wrapper's
          CSS custom properties — they cascade down to this child automatically.
          aria-hidden: purely decorative.
        */}
        <div className="exec-card-light" aria-hidden="true" />

        {/* Bottom info block */}
        <div className="exec-card-body">
          <p className="exec-card-role">{exec.role}</p>
          {/* layoutId matches epm-name so name morphs into modal heading */}
          <motion.h3
            className="exec-card-name"
            layoutId={`exec-name-${exec.id}`}
          >
            {exec.name}
          </motion.h3>
          <p className="exec-card-meta">
            Executive board · {String(absoluteIndex + 1).padStart(2, "0")}
          </p>

          {/* Divider — animates left-to-right on hover */}
          <div className="exec-card-divider" aria-hidden="true" />

          {/* Social links — slide up + fade in on hover */}
          <div className="exec-card-socials">
            {exec.github && (
              <a
                href={`https://github.com/${exec.github}`}
                className="exec-social-link exec-social-gh"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`${exec.firstName} on GitHub`}
              >
                <GitHubIcon />
                <span className="exec-social-label">GitHub</span>
              </a>
            )}
            {exec.linkedin && (
              <a
                href={linkedInHref(exec.linkedin)}
                className="exec-social-link exec-social-li"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`${exec.firstName} on LinkedIn`}
              >
                <LinkedInIcon />
                <span className="exec-social-label">LinkedIn</span>
              </a>
            )}
          </div>
        </div>
      </motion.button>
    </div>
  );
});

/* ─── Executive section ─────────────────────────────────────────────────── */
export default function ExecutiveSection({ execSignalRef }) {
  const sectionRef = useRef(null);
  const [activeExec, setActiveExec] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [phaseLabel, setPhaseLabel] = useState("THE ORB GUIDES YOU FORWARD");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "end 20%"],
  });

  const headingOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.8, 1],
    [0, 1, 1, 0],
  );

  const rowGroups = [
    executives.slice(0, 3),
    executives.slice(3, 6),
    executives.slice(6, 9),
    executives.slice(9, 12),
  ];

  const [visibleRows, setVisibleRows] = useState([false, false, false, false]);
  const [headingVisible, setHeadingVisible] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.3) setPhaseLabel("CONVERGENCE INITIATED");
    else if (v < 0.7) setPhaseLabel("12 MINDS • ONE SIGNAL");
    else setPhaseLabel("LEADERSHIP SYNCHRONIZED");
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // scrollYProgress fires a "change" event on essentially every rendered
    // frame while it's moving — i.e. continuously throughout the Hero →
    // Executive transition. Passing a fresh array/boolean to setState on
    // every one of those ticks forces a full re-render (of this component
    // and, pre-memoization, all 12 cards) even when the derived values are
    // identical to what's already on screen. Returning the previous
    // reference when nothing actually changed lets React bail out of the
    // re-render entirely (same behavior, same thresholds, same timing —
    // just skips redundant work).
    const nextHeadingVisible = v > 0.04;
    setHeadingVisible((prev) =>
      prev === nextHeadingVisible ? prev : nextHeadingVisible,
    );

    const nextVisibleRows = [v > 0.06, v > 0.18, v > 0.3, v > 0.42];
    setVisibleRows((prev) =>
      prev[0] === nextVisibleRows[0] &&
      prev[1] === nextVisibleRows[1] &&
      prev[2] === nextVisibleRows[2] &&
      prev[3] === nextVisibleRows[3]
        ? prev
        : nextVisibleRows,
    );
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveExec(null);
        if (execSignalRef?.current) execSignalRef.current.activeIndex = -1;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [execSignalRef]);

  const handleHoverStart = (id, index) => {
    setHoveredId(id);
    if (execSignalRef?.current) execSignalRef.current.hoverIndex = index;
  };

  const handleHoverEnd = () => {
    setHoveredId(null);
    if (execSignalRef?.current) execSignalRef.current.hoverIndex = -1;
  };

  // Stabilized with useCallback so its reference stays the same across
  // re-renders — required for the ExecCard memoization above to actually
  // prevent re-renders (a new function reference every render would
  // otherwise defeat React.memo's prop comparison).
  const handleSelect = useCallback(
    (exec, index) => {
      setActiveExec(exec);
      if (execSignalRef?.current) execSignalRef.current.activeIndex = index;
    },
    [execSignalRef],
  );

  const handleClose = () => {
    setActiveExec(null);
    if (execSignalRef?.current) execSignalRef.current.activeIndex = -1;
  };

  return (
    <section ref={sectionRef} id="exec-board" className="exec-board-section">
      <div className="exec-sticky-stage">
        <motion.p
          className="exec-phase-label"
          style={{ opacity: headingOpacity }}
        >
          {phaseLabel}
        </motion.p>

        <motion.h1
          className="exec-main-heading"
          initial={{
            opacity: 0,
            y: 20,
            filter: "blur(16px)",
          }}
          animate={{
            opacity: headingVisible ? 1 : 0,
            y: headingVisible ? 0 : 20,
            filter: headingVisible ? "blur(0px)" : "blur(16px)",
          }}
          transition={{
            duration: 0.85,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {" "}
          Executive Board{" "}
        </motion.h1>

        <div className="exec-orb-anchor" aria-hidden="true" />

        {/*
          LayoutGroup ties the card layoutIds to the modal layoutIds.
          Without this, Framer treats card and modal as unrelated trees
          and the shared-element morph won't fire.
        */}
        <LayoutGroup>
          <div className="exec-formation">
            <AnimatePresence initial={false}>
              {rowGroups.map((row, rowIndex) => {
                const isVisible = visibleRows[rowIndex];

                return (
                  <motion.div
                    key={`row-${rowIndex}`}
                    className={`exec-row exec-row-${rowIndex + 1}`}
                    initial={{ opacity: 0, y: 70, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {row.map((exec, cardIndex) => {
                      const absoluteIndex =
                        rowIndex === 0
                          ? cardIndex
                          : rowIndex === 1
                            ? 4 + cardIndex
                            : rowIndex === 2
                              ? 7 + cardIndex
                              : 10 + cardIndex;
                      const isActive = activeExec?.id === exec.id;
                      const isDimmed = !!activeExec && !isActive;

                      return (
                        <ExecCard
                          key={exec.id}
                          exec={exec}
                          absoluteIndex={absoluteIndex}
                          isVisible={isVisible}
                          isActive={isActive}
                          isDimmed={isDimmed}
                          onSelect={handleSelect}
                        />
                      );
                    })}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {activeExec && (
              <ProfilePanel exec={activeExec} onClose={handleClose} />
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
}
