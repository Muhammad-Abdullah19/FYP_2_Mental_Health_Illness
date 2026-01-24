<<<<<<< HEAD
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Features = () => {
    const { t } = useLanguage();

    return (
        <section className="features">
            <div className="section-title">
                <h2>{t('features_title')}</h2>
            </div>
            <div className="grid">
                <div className="card">
                    <div className="card-icon"><i className="fas fa-robot"></i></div>
                    <h3>{t('feature_chatbot_title')}</h3>
                    <p>{t('feature_chatbot_desc')}</p>
                </div>
                <div className="card">
                    <div className="card-icon"><i className="fas fa-clipboard-check"></i></div>
                    <h3>{t('feature_assessments_title')}</h3>
                    <p>{t('feature_assessments_desc')}</p>
                </div>
                <div className="card">
                    <div className="card-icon"><i className="fas fa-book-quran"></i></div>
                    <h3>{t('feature_remedies_title')}</h3>
                    <p>{t('feature_remedies_desc')}</p>
                </div>
                <div className="card">
                    <div className="card-icon"><i className="fas fa-user-md"></i></div>
                    <h3>{t('feature_specialist_title')}</h3>
                    <p>{t('feature_specialist_desc')}</p>
                </div>
            </div>
        </section>
    );
};

export default Features;
=======
import React from 'react';
import './Features.css';
import { useLanguage } from '../context/LanguageContext';

const Features = () => {
    const { t } = useLanguage();

    return (
        <section className="features">
            <div className="section-title">
                <h2>{t('features_title')}</h2>
            </div>
            <div className="grid">
                <div className="card">
                    <div className="card-icon"><i className="fas fa-robot"></i></div>
                    <h3>{t('feature_chatbot_title')}</h3>
                    <p>{t('feature_chatbot_desc')}</p>
                </div>
                <div className="card">
                    <div className="card-icon"><i className="fas fa-clipboard-check"></i></div>
                    <h3>{t('feature_assessments_title')}</h3>
                    <p>{t('feature_assessments_desc')}</p>
                </div>
                <div className="card">
                    <div className="card-icon"><i className="fas fa-book-quran"></i></div>
                    <h3>{t('feature_remedies_title')}</h3>
                    <p>{t('feature_remedies_desc')}</p>
                </div>
                <div className="card">
                    <div className="card-icon"><i className="fas fa-user-md"></i></div>
                    <h3>{t('feature_specialist_title')}</h3>
                    <p>{t('feature_specialist_desc')}</p>
                </div>
            </div>
        </section>
    );
};

export default Features;
>>>>>>> b833b64 (feat: Initialize front-end application with core pages, components, a multilingual chatbot, and authentication features.)
