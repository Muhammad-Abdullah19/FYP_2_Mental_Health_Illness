<<<<<<< HEAD
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
    const { t } = useLanguage();

    return (
        <section className="hero" id="home">
            <div className="hero-content">
                <h1>{t('hero_title')}</h1>
                <p>{t('hero_desc')}</p>
                <a href="#assessments" className="cta-btn floating">
                    <span>{t('hero_cta')}</span>
                    <i className="fas fa-arrow-right" style={{ marginInlineStart: '10px' }}></i>
                </a>
            </div>
            <div className="hero-visual">
                <div className="hero-blob floating-fast"></div>
                <div className="hero-icon-container floating">
                    <i className="fas fa-user-doctor"></i>
                </div>
            </div>
        </section>
    );
};

export default Hero;
=======
import React from 'react';
import './Hero.css';
import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
    const { t } = useLanguage();

    return (
        <section className="hero" id="home">
            <div className="hero-content">
                <h1>{t('hero_title')}</h1>
                <p>{t('hero_desc')}</p>
                <a href="#assessments" className="cta-btn floating">
                    <span>{t('hero_cta')}</span>
                    <i className="fas fa-arrow-right" style={{ marginInlineStart: '10px' }}></i>
                </a>
            </div>
            <div className="hero-visual">
                <div className="hero-blob floating-fast"></div>
                <div className="hero-icon-container floating">
                    <i className="fas fa-user-doctor"></i>
                </div>
            </div>
        </section>
    );
};

export default Hero;
>>>>>>> b833b64 (feat: Initialize front-end application with core pages, components, a multilingual chatbot, and authentication features.)
