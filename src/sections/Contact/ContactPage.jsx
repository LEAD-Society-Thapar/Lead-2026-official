import React from 'react';
import Background from './components/Background/Background';
import Hero from './components/Hero/Hero';
import GlassPlatform from './components/GlassPlatform/GlassPlatform';
import LeftPanel from './components/LeftPanel/LeftPanel';
import ContactForm from './components/CenterPanel/ContactForm';
import FeatureCards from './components/RightPanel/FeatureCards';
import Footer from '../../components/Footer/Footer';
import './ContactPage.css';

export default function ContactPage() {
  return (
    <>
      <div className="contact-page">
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
      <Footer />
    </>
  );
}
