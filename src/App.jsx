import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'

// ===== Core Home page (loaded immediately) =====
import Home from './sections/Home/Home'
import { SPONSORS_DATA } from './data/sponsorsData'

// ===== Lazy-loaded secondary pages (reduces initial JS bundle size) =====
const Team = lazy(() => import('./sections/Team'))
const ArcReactor = lazy(() => import('./sections/Sponsors/ArcReactor'))
const Contact = lazy(() => import('./sections/Contact/ContactPage'))
const Events = lazy(() => import('./sections/EventsPage/App'))
const GalleryTunnel = lazy(() => import('./sections/GalleryPage/components/TunnelSection'))
import './sections/GalleryPage/styles/global.css'

// ===== Standalone shell =====
import SiteNav from './components/SiteNav/SiteNav'
import CommandPalette from './components/CommandPalette/CommandPalette'
import { CommandPaletteProvider, useCommandPalette } from './context/CommandPaletteContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function GlobalCommandPalette() {
  const { isVisible } = useCommandPalette();
  return <CommandPalette visible={isVisible} />;
}

function AppContent() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <>
      <ScrollToTop />
      <SiteNav />
      <GlobalCommandPalette />
      <div style={{ display: isHome ? 'block' : 'none' }}>
        <Home />
      </div>
      {!isHome && (
        <Suspense fallback={null}>
          <Routes>
            <Route path="/events" element={<Events />} />
            <Route path="/team" element={<Team />} />
            <Route path="/sponsors" element={<ArcReactor sponsors={SPONSORS_DATA} />} />
            <Route path="/gallery" element={<GalleryTunnel />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Suspense>
      )}
    </>
  )
}

function App() {
  return (
    <CommandPaletteProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CommandPaletteProvider>
  )
}

export default App
