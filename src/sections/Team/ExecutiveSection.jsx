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
import { useFormationTilt } from "./hooks/useFormationTilt";
import "./ExecutiveSection.css";

// Checked once at module level — no per-render overhead.
const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * linkedInHref — normalise exec.linkedin into a fully-qualified URL.
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
/**
 * ExecCard is memoized. Props that change per interaction:
 *   - isActive, isDimmed   (from parent state)
 *   - hoveredIndexRef      (a stable ref — does NOT cause re-renders)
 *   - positionIndex        (static per card)
 *   - rowSize              (static per row)
 *
 * The formation tilt hook reads hoveredIndexRef on every RAF frame
 * without triggering React re-renders.
 */
const ExecCard = memo(function ExecCard({
  exec,
  absoluteIndex,
  positionIndex,
  rowSize,
  isVisible,
  isActive,
  isDimmed,
  onSelect,
  onHoverStart,
  onHoverEnd,
  hoveredIndexRef,
}) {
  const [hovered, setHovered] = useState(false);

  const tiltRef = useFormationTilt(
    REDUCED_MOTION,
    positionIndex,
    rowSize,
    hoveredIndexRef
  );

  const handleHoverStart = () => {
    setHovered(true);
    onHoverStart(positionIndex);
  };

  const handleHoverEnd = () => {
    setHovered(false);
    onHoverEnd();
  };

  return (
    /*
      Tilt wrapper: receives perspective() + formation rotation from hook.
      --formation-tx drives the inward translate on edge hover.
    */
    <div
      ref={tiltRef}
      className={`exec-card-tilt-wrapper${positionIndex === 0 ? " is-left-edge" : ""}${positionIndex === rowSize - 1 ? " is-right-edge" : ""}`}
      data-exec-id={exec.id}
    >
      <motion.button
        key={exec.id}
        type="button"
        layoutId={`exec-card-frame-${exec.id}`}
        className={`exec-card ${isActive ? "is-active" : ""} ${isDimmed ? "is-dimmed" : ""} ${hovered ? "is-hovered" : ""}`}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : 20,
          scale: isVisible ? 1 : 0.98,
        }}
        transition={{
          duration: isVisible ? 0.35 : 0.3,
          delay: isVisible ? positionIndex * 0.04 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{
          y: -11,
          scale: 1.01,
          transition: {
            duration: 0.38,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        onClick={() => onSelect(exec, absoluteIndex)}
      >
        {/* Portrait */}
        <motion.div
          className="exec-card-portrait"
          layoutId={`exec-portrait-${exec.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{
            duration: 0.35,
            delay: 0.08 + positionIndex * 0.04,
          }}
        >
          <img
            src={exec.portrait}
            alt={exec.name}
            loading="lazy"
            decoding="async"
            style={{
              ...(exec.cardPortraitPosition || exec.portraitPosition
                ? { objectPosition: exec.cardPortraitPosition ?? exec.portraitPosition }
                : {}),
              ...(exec.cardPortraitScale ? { '--card-scale': exec.cardPortraitScale } : {}),
              ...(exec.cardPortraitY ? { '--card-ty': exec.cardPortraitY } : {}),
            }}
          />
        </motion.div>

        {/* Light highlight overlay */}
        <div className="exec-card-light" aria-hidden="true" />

        {/* Bottom info block */}
        <div className="exec-card-body">
          <p className="exec-card-role">{exec.role}</p>
          <motion.h3
            className="exec-card-name"
            layoutId={`exec-name-${exec.id}`}
          >
            {exec.name}
          </motion.h3>
          <p className="exec-card-meta">
            Executive board · {String(absoluteIndex + 1).padStart(2, "0")}
          </p>

          <div className="exec-card-divider" aria-hidden="true" />

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

/* ─── Formation Row ─────────────────────────────────────────────────────── */
/**
 * FormationRow wraps one row of 4 cards and owns the row-level hover state.
 * hoveredIndexRef is a stable ref written on every hover event — shared
 * with all child cards without triggering re-renders.
 */
function FormationRow({ row, rowIndex, startIndex, isVisible, activeExec, onSelect }) {
  // Stable ref: stores which position in THIS row is hovered (-1 = none)
  // Written synchronously from card hover handlers — never causes re-renders
  const hoveredIndexRef = useRef(-1);
  const [dimmedByActive, setDimmedByActive] = useState(false);

  useEffect(() => {
    setDimmedByActive(!!activeExec);
  }, [activeExec]);

  const handleHoverStart = useCallback((positionIndex) => {
    hoveredIndexRef.current = positionIndex;
  }, []);

  const handleHoverEnd = useCallback(() => {
    hoveredIndexRef.current = -1;
  }, []);

  return (
    <motion.div
      key={`row-${rowIndex}`}
      className={`exec-row exec-row-${rowIndex + 1}`}
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 1.1,
        delay: rowIndex * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {row.map((exec, cardIndex) => {
        const absoluteIndex = startIndex + cardIndex;
        const isActive = activeExec?.id === exec.id;
        const isDimmed = !!activeExec && !isActive;

        return (
          <ExecCard
            key={exec.id}
            exec={exec}
            absoluteIndex={absoluteIndex}
            positionIndex={cardIndex}
            rowSize={row.length}
            isVisible={isVisible}
            isActive={isActive}
            isDimmed={isDimmed}
            onSelect={onSelect}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
            hoveredIndexRef={hoveredIndexRef}
          />
        );
      })}
    </motion.div>
  );
}

/* ─── Executive section ─────────────────────────────────────────────────── */
export default function ExecutiveSection({ execSignalRef }) {
  const sectionRef = useRef(null);
  const [activeExec, setActiveExec] = useState(null);
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

  // 4-4-4 formation
  const rowGroups = [
    executives.slice(0, 4),
    executives.slice(4, 8),
    executives.slice(8, 12),
  ];

  // Start indices for absolute card numbering
  const rowStartIndices = [0, 4, 8];

  const [visibleRows, setVisibleRows] = useState([false, false, false]);
  const [headingVisible, setHeadingVisible] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.3) setPhaseLabel("CONVERGENCE INITIATED");
    else if (v < 0.7) setPhaseLabel("12 MINDS • ONE SIGNAL");
    else setPhaseLabel("LEADERSHIP SYNCHRONIZED");
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const nextHeadingVisible = v > 0.04;
    setHeadingVisible((prev) =>
      prev === nextHeadingVisible ? prev : nextHeadingVisible,
    );

    // 3 rows now — slightly tighter thresholds
    const nextVisibleRows = [v > 0.06, v > 0.22, v > 0.38];
    setVisibleRows((prev) =>
      prev[0] === nextVisibleRows[0] &&
      prev[1] === nextVisibleRows[1] &&
      prev[2] === nextVisibleRows[2]
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
          initial={{ opacity: 0, y: 20, filter: "blur(16px)" }}
          animate={{
            opacity: headingVisible ? 1 : 0,
            y: headingVisible ? 0 : 20,
            filter: headingVisible ? "blur(0px)" : "blur(16px)",
          }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          {" "}
          Executive Board{" "}
        </motion.h1>

        <div className="exec-orb-anchor" aria-hidden="true" />

        <LayoutGroup>
          <div className="exec-formation">
            <AnimatePresence initial={false}>
              {rowGroups.map((row, rowIndex) => (
                <FormationRow
                  key={`row-${rowIndex}`}
                  row={row}
                  rowIndex={rowIndex}
                  startIndex={rowStartIndices[rowIndex]}
                  isVisible={visibleRows[rowIndex]}
                  activeExec={activeExec}
                  onSelect={handleSelect}
                />
              ))}
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
