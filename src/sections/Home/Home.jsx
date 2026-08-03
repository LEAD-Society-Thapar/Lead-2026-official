import "./Home.css";
import ParticleCube from "./Cube/ParticleCube";
import About from "./About";
import Domains from "../Domains/Domains";

function Home({ isHome = true }) {
  return (
    <>
      {/* ================= HERO ================= */}
      <section id="home" className="hero">


        {/* Middle: 3D Interactive Text Particles */}
        <div className="hero-middle">
          <ParticleCube isHome={isHome} />
        </div>

        {/* Bottom: Subtitle */}
        <div className="hero-bottom">
          <p className="hero-subtitle">A society where you explore the world</p>
        </div>

      </section>

      {/* ================= ABOUT ================= */}
      <About />

      <Domains />
    </>
  );
}

export default Home;