import React, { useEffect, useState } from 'react';
import './LanguageModal.css';
import { useLanguage } from '../context/LanguageContext';

const LanguageModal = () => {
    const { setLanguage } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('preferredLanguage');
        if (!savedLang) {
            // Delay to show modal
            const timer = setTimeout(() => setIsVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleSelect = (lang) => {
        setLanguage(lang);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className={`language-modal-overlay active`}>
            <div className="language-modal">
                <div className="section-title" style={{ marginBottom: '1.5rem' }}>
                    <h2>Select Language / زبان منتخب کریں</h2>
                </div>
                <div className="lang-options">
                    <div className="lang-card" onClick={() => handleSelect('ur')}>
                        <i className="fas fa-moon"></i>
                        <h3>Urdu</h3>
                        <p>اردو</p>
                    </div>
                    <div className="lang-card" onClick={() => handleSelect('en')}>
                        <i className="fas fa-globe"></i>
                        <h3>English</h3>
                        <p>انگریزی</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageModal;
