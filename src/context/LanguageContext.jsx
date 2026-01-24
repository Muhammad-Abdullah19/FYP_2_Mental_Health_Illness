import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [currentLang, setCurrentLang] = useState('ur');

    useEffect(() => {
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang) {
            setCurrentLang(savedLang);
        } else {
            // Default to Urdu but could logic for LanguageModal trigger here
            setCurrentLang('ur');
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('preferredLanguage', currentLang);
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === 'ur' ? 'rtl' : 'ltr';

        // Add class to body for specific CSS overrides if needed
        document.body.className = `lang-${currentLang}`;
    }, [currentLang]);

    const toggleLanguage = () => {
        setCurrentLang(prev => prev === 'ur' ? 'en' : 'ur');
    };

    const setLanguage = (lang) => {
        setCurrentLang(lang);
    };

    const t = (key) => {
        return translations[currentLang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ currentLang, toggleLanguage, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
