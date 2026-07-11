import Background from './components/Background';
import Hero from './components/Hero';
import GlassPlatform from './components/GlassPlatform';
import LeftPanel from './components/LeftPanel';
import ContactForm from './components/ContactForm';
import FeatureCards from './components/FeatureCards';
import './Contact.css';

export default function Contact() {
  return (
    <div className="contact-section-root">
      {/* Cinematic space-themed background layer */}
      <Background />
      
      {/* Central Interactive Content Area */}
      <main className="contact-main-content">
        {/* Header Hero Section */}
        <Hero />
        
        {/* levitating 3D Glass Platform containing contact modules */}
        <GlassPlatform>
          <LeftPanel />
          <ContactForm />
          <FeatureCards />
        </GlassPlatform>
      </main>
    </div>
  );
}
