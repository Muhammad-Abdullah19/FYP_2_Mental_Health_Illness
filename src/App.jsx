import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import IslamicTherapy from './components/IslamicTherapy';
import DisorderLibrary from './components/DisorderLibrary';
import DashboardPreview from './components/DashboardPreview';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';
import LanguageModal from './components/LanguageModal';
import DisorderPage from './components/DisorderPage';

function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <IslamicTherapy />
      <DisorderLibrary />
      <DashboardPreview />
    </>
  );
}

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <Router>
      <Navbar openAuthModal={() => setAuthModalOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/disorders" element={<DisorderPage />} />
      </Routes>
      <Footer />

      <Chatbot />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <LanguageModal />
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
