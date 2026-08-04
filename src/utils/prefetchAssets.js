/**
 * Warms the site's assets in the background while the preloader video plays.
 *
 * The route components are imported statically in App.jsx, so their JS is
 * already in the main bundle and the Home page mounts *behind* the preloader
 * overlay (its 3D canvas initialises during the intro). What is still missing
 * at reveal time are the images and webfonts, which normally only start
 * downloading once a section scrolls into view. This kicks them off up front.
 *
 * Everything here is fire-and-forget: failures are swallowed and nothing is
 * allowed to delay or block the preloader.
 */

// All bundled images (nav logo, team portraits, sponsor logos, ...).
// Vite resolves these to their final hashed URLs at build time.
const bundledAssets = import.meta.glob(
  '../assets/**/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, query: '?url', import: 'default' }
)

// Assets served straight from /public.
const publicAssets = [
  '/LEAD_white.png',
  '/mascot.png',
  '/favicon.svg',
  '/icons.svg',
]

const FONT_URL = '/fonts/Anton-Regular.ttf'

function preloadImage(url, priority = 'low') {
  return new Promise((resolve) => {
    const img = new Image()
    // don't compete with the preloader video for bandwidth
    if ('fetchPriority' in img) img.fetchPriority = priority
    img.onload = () => {
      // decode() gets it fully ready to paint, not just downloaded
      if (img.decode) img.decode().then(resolve, resolve)
      else resolve()
    }
    img.onerror = resolve // never reject: a missing asset must not block anything
    img.src = url
  })
}

function preloadFont() {
  // Register the Anton face early so text doesn't reflow after the reveal.
  if (typeof FontFace === 'undefined') return Promise.resolve()
  try {
    const face = new FontFace('Anton', `url(${FONT_URL}) format('truetype')`)
    return face
      .load()
      .then((loaded) => { document.fonts.add(loaded) })
      .catch(() => {})
  } catch {
    return Promise.resolve()
  }
}

let warmupPromise = null

/**
 * Kick off the background warm-up. Safe to call more than once — every caller
 * gets the same underlying promise, which settles when the warm-up actually
 * finishes (so StrictMode's double-mount neither double-fetches nor lets a
 * second caller believe the work is already done).
 *
 * @returns {Promise<void>} resolves when the warm-up settles
 */
export function prefetchSiteAssets() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (warmupPromise) return warmupPromise
  return (warmupPromise = startWarmup())
}

function startWarmup() {

  const bundled = Object.values(bundledAssets)
  const urls = [...bundled, ...publicAssets]

  // The nav logo is on screen the instant the preloader lifts — fetch it first
  // and at normal priority; everything else trickles in behind the video.
  const logo = bundled.find((u) => /LEAD(?!_white)/i.test(u))

  const work = [
    logo ? preloadImage(logo, 'high') : Promise.resolve(),
    preloadFont(),
    ...urls.map((u) => preloadImage(u, 'low')),
  ]

  return Promise.allSettled(work).then(() => {
    // also let the browser settle any CSS-declared webfonts (Google Fonts, etc.)
    return document.fonts?.ready?.catch?.(() => {}) ?? undefined
  }).then(() => {})
}
