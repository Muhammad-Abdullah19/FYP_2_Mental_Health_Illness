import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './config/firebase';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';
import LanguageModal from './components/LanguageModal';
import DisorderPage from './pages/DisorderPage';
import IslamicTherapyPage from './pages/IslamicTherapyPage';
import AssessmentPage from './pages/AssessmentPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import DisclaimerModal from './components/DisclaimerModal';

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for Firebase auth state changes automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-color)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--primary)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem' }}></i>
          <p style={{ marginTop: '1rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar
        openAuthModal={() => setAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/disorders" element={<DisorderPage />} />
        <Route path="/islamic-therapy" element={<IslamicTherapyPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
      <Footer />
      <Chatbot currentUser={currentUser} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <LanguageModal />
      <DisclaimerModal />
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