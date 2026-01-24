<<<<<<< HEAD
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const Navbar = ({ openAuthModal }) => {
    const { currentLang, toggleLanguage, t } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav>
            <Link to="/" className="logo floating" style={{ textDecoration: 'none' }}>
                <i className="fas fa-brain"></i>
                <span>Noor-e-Shifa</span>
            </Link>
            {/* Mobile Menu Button */}
            <div
                className="mobile-menu-btn"
                style={{ display: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                <i className="fas fa-bars"></i>
            </div>
            <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                <li><Link to="/"><i className="fas fa-home"></i> <span>{t('nav_home')}</span></Link></li>
                <li><Link to="/disorders"><i className="fas fa-notes-medical"></i> <span>{t('nav_disorders')}</span></Link></li>
                <li><a href="/#islamic"><i className="fas fa-kaaba"></i> <span>{t('nav_islamic')}</span></a></li>
                <li><a href="/#assessments"><i className="fas fa-clipboard-list"></i> <span>{t('nav_assessments')}</span></a></li>
                <li>
                    <a href="#" className="nav-btn" onClick={(e) => { e.preventDefault(); openAuthModal(); }}>
                        <span>{t('nav_login')}</span>
                    </a>
                </li>
                <li>
                    <button
                        id="langToggle"
                        className="nav-btn"
                        style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', cursor: 'pointer' }}
                        onClick={toggleLanguage}
                    >
                        <i className="fas fa-globe"></i>
                        <span id="langLabel" style={{ margin: '0 5px' }}>
                            {currentLang === 'ur' ? 'English' : 'اردو'}
                        </span>
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
=======
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ openAuthModal }) => {
    const { currentLang, toggleLanguage, t } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav>
            <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
                <i className="fas fa-brain"></i>
                <span>Noor-e-Shifa</span>
            </Link>
            {/* Mobile Menu Button */}
            <div
                className="mobile-menu-btn"
                style={{ display: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                <i className="fas fa-bars"></i>
            </div>
            <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                <li><NavLink to="/"><i className="fas fa-home"></i> <span>{t('nav_home')}</span></NavLink></li>
                <li><NavLink to="/disorders"><i className="fas fa-book-medical"></i> <span>{t('nav_disorders')}</span></NavLink></li>
                <li><NavLink to="/islamic-therapy"><i className="fas fa-moon"></i> <span>{t('nav_islamic')}</span></NavLink></li>
                <li><NavLink to="/assessment"><i className="fas fa-clipboard-list"></i> <span>{t('nav_assessments')}</span></NavLink></li>
                <li>
                    <button
                        className="nav-btn"
                        onClick={() => openAuthModal()}
                        style={{ border: 'none', cursor: 'pointer', font: 'inherit' }}
                    >
                        <span>{t('nav_login')}</span>
                    </button>
                </li>
                <li>
                    <button
                        id="langToggle"
                        className="nav-btn"
                        style={{ background: 'transparent', border: '1px solid var(--primary)', cursor: 'pointer' }}
                        onClick={toggleLanguage}
                    >
                        <i className="fas fa-globe"></i>
                        <span id="langLabel" style={{ margin: '0 5px' }}>
                            {currentLang === 'ur' ? 'English' : 'اردو'}
                        </span>
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
>>>>>>> b833b64 (feat: Initialize front-end application with core pages, components, a multilingual chatbot, and authentication features.)
