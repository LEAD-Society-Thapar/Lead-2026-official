import "./Home.css";
import ParticleCube from "./Cube/ParticleCube";
import About from "./About";
import Domains from "../Domains/Domains";

function Home() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section id="home" className="hero">


        {/* Middle: 3D Interactive Text Particles */}
        <div className="hero-middle">
          <ParticleCube />
        </div>

        {/* Bottom: Subtitle */}
        <div className="hero-bottom">
          <p className="hero-subtitle">A society where you explore the world</p>
        </div>

      </section>

      {/* ================= ABOUT ================= */}
      <About />

      <Domains />

      <section id="initiative" style={{ minHeight: "100vh", padding: "120px 8%" }}>
        <h2>Initiative Section</h2>
      </section>

      <section id="leadership" style={{ minHeight: "100vh", padding: "120px 8%" }}>
        <h2>Leadership Section</h2>
      </section>

      <section id="network" style={{ minHeight: "100vh", padding: "120px 8%" }}>
        <h2>Network Section</h2>
      </section>

      <section id="archive" style={{ minHeight: "100vh", padding: "120px 8%" }}>
        <h2>Archive Section</h2>
      </section>

      <section id="contact" style={{ minHeight: "100vh", padding: "120px 8%" }}>
        <h2>Let's Connect Section</h2>
      </section>
    </>
  );
}

export default Home;