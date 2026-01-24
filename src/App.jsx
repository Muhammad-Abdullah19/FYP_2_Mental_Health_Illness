import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';
import LanguageModal from './components/LanguageModal';
import DisorderPage from './pages/DisorderPage';
import IslamicTherapyPage from './pages/IslamicTherapyPage';
import AssessmentPage from './pages/AssessmentPage';
import HomePage from './pages/HomePage';

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <Router>
      <Navbar openAuthModal={() => setAuthModalOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/disorders" element={<DisorderPage />} />
        <Route path="/islamic-therapy" element={<IslamicTherapyPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
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

