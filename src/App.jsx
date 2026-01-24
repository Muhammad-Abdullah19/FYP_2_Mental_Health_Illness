import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
<<<<<<< HEAD
import Hero from './components/Hero';
import Features from './components/Features';
import IslamicTherapy from './components/IslamicTherapy';
import DisorderLibrary from './components/DisorderLibrary';
import DashboardPreview from './components/DashboardPreview';
=======
>>>>>>> b833b64 (feat: Initialize front-end application with core pages, components, a multilingual chatbot, and authentication features.)
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';
import LanguageModal from './components/LanguageModal';
<<<<<<< HEAD
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
=======
import DisorderPage from './pages/DisorderPage';
import IslamicTherapyPage from './pages/IslamicTherapyPage';
import AssessmentPage from './pages/AssessmentPage';
import HomePage from './pages/HomePage';
>>>>>>> b833b64 (feat: Initialize front-end application with core pages, components, a multilingual chatbot, and authentication features.)

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <Router>
      <Navbar openAuthModal={() => setAuthModalOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/disorders" element={<DisorderPage />} />
<<<<<<< HEAD
=======
        <Route path="/islamic-therapy" element={<IslamicTherapyPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
>>>>>>> b833b64 (feat: Initialize front-end application with core pages, components, a multilingual chatbot, and authentication features.)
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
