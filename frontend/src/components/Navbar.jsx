import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ openAuthModal, currentUser, onLogout }) => {
    const { currentLang, toggleLanguage, t } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <nav>
            <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
                <i className="fas fa-brain"></i>
                <span>Noor-e-Shifa</span>
            </Link>

            <div
                className="mobile-menu-btn"
                style={{ display: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                <i className="fas fa-bars"></i>
            </div>

            <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                <li>
                    <NavLink to="/"><i className="fas fa-home"></i> <span>{t('nav_home')}</span></NavLink>
                </li>
                <li>
                    <NavLink to="/disorders"><i className="fas fa-book-medical"></i> <span>{t('nav_disorders')}</span></NavLink>
                </li>
                <li>
                    <NavLink to="/islamic-therapy"><i className="fas fa-moon"></i> <span>{t('nav_islamic')}</span></NavLink>
                </li>
                <li>
                    <NavLink to="/assessment"><i className="fas fa-clipboard-list"></i> <span>{t('nav_assessments')}</span></NavLink>
                </li>

                <li>
                    {currentUser ? (
                        // --- LOGGED IN STATE ---
                        <div style={{ position: 'relative' }}>
                            <button
                                className="nav-btn"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    border: 'none',
                                    cursor: 'pointer',
                                    font: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <i className="fas fa-user-circle"></i>
                                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {currentUser.email?.split('@')[0]}
                                </span>
                                <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem' }}></i>
                            </button>

                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '110%',
                                    right: 0,
                                    background: 'var(--white)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    padding: '0.5rem',
                                    minWidth: '160px',
                                    zIndex: 9999,
                                    border: '1px solid rgba(0,128,128,0.1)'
                                }}>
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-light)',
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        {currentUser.email}
                                    </div>
                                    <button
                                        onClick={() => { onLogout(); setDropdownOpen(false); }}
                                        style={{
                                            width: '100%',
                                            padding: '0.7rem 1rem',
                                            background: 'none',
                                            border: 'none',
                                            color: '#e53935',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <i className="fas fa-sign-out-alt"></i>
                                        {currentLang === 'ur' ? 'لاگ آؤٹ' : 'Logout'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // --- LOGGED OUT STATE ---
                        <button
                            className="nav-btn"
                            onClick={() => openAuthModal()}
                            style={{ border: 'none', cursor: 'pointer', font: 'inherit' }}
                        >
                            <span>{t('nav_login')}</span>
                        </button>
                    )}
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