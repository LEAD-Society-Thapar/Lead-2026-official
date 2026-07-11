import { useRef, useEffect } from 'react'

export const EXEC_PHASES = {
  ENTER_END: 0.45,
}

const SCENES = {
  HERO: {
    scale: 1.0,
    wire1Opacity: 0.55,
    wire2Opacity: 0.25,
    particleOpacity: 0.15,
    glowScale: 6.5,
    cameraZ: 9.0,
    groupY: -0.7,
  },

  EXEC: {
    scale: 0.9,
    wire1Opacity: 0.20,
    wire2Opacity: 0.10,
    particleOpacity: 0.05,
    glowScale: 3.0,
    cameraZ: 8.0,
    groupY: -0.7,
  },

  EXEC_HOLD: {
    scale: 0.9,
    wire1Opacity: 0.20,
    wire2Opacity: 0.10,
    particleOpacity: 0.05,
    glowScale: 3.0,
    cameraZ: 9.0,
    groupY: -0.7,
  },

  DEPT: {
    scale: 0.5,
    wire1Opacity: 0.03,
    wire2Opacity: 0.02,
    particleOpacity: 0.12,
    glowScale: 3.8,
    cameraZ: 14,
    groupY: -0.72,
  },

  CTA: {
    scale: 0.65,
    wire1Opacity: 0.12,
    wire2Opacity: 0.06,
    particleOpacity: 0.35,
    glowScale: 5.8,
    cameraZ: 8.6,
    groupY: -0.6,
  },
}

function lerpScenes(from, to, t) {
  const out = {}
  for (const key of Object.keys(from)) {
    out[key] = from[key] + (to[key] - from[key]) * t
  }
  return out
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
}

function smooth(t) {
  return t * t * (3 - 2 * t)
}

export function useOrbState() {
  const orbStateRef = useRef({ ...SCENES.HERO })

  useEffect(() => {
    // Sections are queried once on mount instead of on every scroll tick.
    // They are static landmarks that never remount, so re-running
    // document.getElementById() 4x per scroll event was pure overhead —
    // this is most noticeable during the Hero → Executive transition,
    // where scroll events fire rapidly while Lenis is animating.
    const sections = {
      hero: document.getElementById('home'),
      exec: document.getElementById('exec-board'),
      dept: document.getElementById('departments'),
      cta: document.getElementById('cta'),
    }

    // Coalesce scroll events to at most one computation per animation
    // frame. Lenis can dispatch more than one native `scroll` event
    // between rendered frames while it's actively animating (exactly
    // the Hero → Executive window) — without this guard, every one of
    // those events forces its own synchronous layout read via
    // getBoundingClientRect(), stacking on top of the Three.js render
    // and Framer Motion's own scroll tracking in ExecutiveSection.
    let ticking = false

    const computeState = () => {
      ticking = false

      if (sections.hero) {
        const heroRect = sections.hero.getBoundingClientRect()
        const heroProgress = clamp(-heroRect.top / heroRect.height, 0, 1)

        if (heroProgress < 1) {
          let tempState

          if (heroProgress < 0.5) {
            const t = heroProgress / 0.5
            tempState = {
              ...SCENES.HERO,
              scale: 1 + t * 0.12,
              cameraZ: 9 - t * 0.7,
              glowScale: 7.5 + t * 0.8,
              particleOpacity: 0.85 + t * 0.08,
            }
          } else {
            const t = (heroProgress - 0.5) / 0.5
            tempState = lerpScenes(
              {
                ...SCENES.HERO,
                scale: 1.16,
                cameraZ: 6.9,
                glowScale: 8.2,
                particleOpacity: 0.93,
              },
              SCENES.EXEC,
              t
            )
          }

          orbStateRef.current = tempState
          return
        }
      }

      if (sections.exec) {
        const execRect = sections.exec.getBoundingClientRect()
        const execProgress = clamp(-execRect.top / execRect.height, 0, 1)

        if (execProgress < 1) {
          const end = EXEC_PHASES.ENTER_END
          const t = execProgress < end ? smooth(execProgress / end) : 1
          const tempState = execProgress < end
            ? lerpScenes(SCENES.EXEC, SCENES.EXEC_HOLD, t)
            : { ...SCENES.EXEC_HOLD }

          orbStateRef.current = tempState
          return
        }
      }

      if (sections.exec && sections.dept) {
        const execRect = sections.exec.getBoundingClientRect()
        const execExitProgress = clamp(
          (-execRect.top - window.innerHeight * 0.5) / execRect.height,
          0,
          1
        )

        if (execExitProgress > 0) {
          const deptRect = sections.dept.getBoundingClientRect()
          const deptProgress = clamp(-deptRect.top / deptRect.height, 0, 1)

          if (deptProgress < 1) {
            orbStateRef.current = lerpScenes(
              SCENES.EXEC_HOLD,
              SCENES.DEPT,
              deptProgress
            )
            return
          }
        }
      }

      orbStateRef.current = { ...SCENES.DEPT }
    }

    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(computeState)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    computeState()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return orbStateRef
}

export function useExecSignal() {
  return useRef({ hoverIndex: -1, activeIndex: -1 })
}
