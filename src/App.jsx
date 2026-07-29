import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

// ===== Pages imported from the SourcePage project (untouched) =====
import Home from './sections/Home/Home'
import Team from './sections/Team'
import ArcReactor from './sections/Sponsors/ArcReactor'
import Contact from './sections/Contact/ContactPage'
import { SPONSORS_DATA } from './data/sponsorsData'

// ===== Pages imported from the SourcePage Events / PhotoGallery projects =====
import Events from './sections/EventsPage/App'
import GalleryTunnel from './sections/GalleryPage/components/TunnelSection'
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

function App() {
  return (
    <CommandPaletteProvider>
      <BrowserRouter>
        <ScrollToTop />
        <SiteNav />
        <GlobalCommandPalette />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/team" element={<Team />} />
          <Route path="/sponsors" element={<ArcReactor sponsors={SPONSORS_DATA} />} />
          <Route path="/gallery" element={<GalleryTunnel />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </BrowserRouter>
    </CommandPaletteProvider>
  )
}

export default App
