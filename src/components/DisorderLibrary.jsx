import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const DisorderLibrary = () => {
    const { t } = useLanguage();

    return (
        <section className="features" id="disorders">
            <div className="section-title">
                <h2>{t('library_title')}</h2>
                <p>{t('library_subtitle')}</p>
            </div>
            <div className="grid">
                <div className="card">
                    <div className="card-icon" style={{ background: '#FFF3E0', color: '#FF9800' }}><i className="fas fa-brain"></i></div>
                    <h3>{t('disorder_depression_title')}</h3>
                    <p>{t('disorder_depression_desc')}</p>
                    <ul style={{ marginTop: '1rem', paddingInlineStart: '1.2rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        <li><span>{t('symptom_fatigue')}</span></li>
                        <li><span>{t('symptom_sleep')}</span></li>
                    </ul>
                    <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', borderRadius: '5px', cursor: 'pointer' }}>
                        <span>{t('btn_read_guide')}</span>
                    </button>
                </div>
                <div className="card">
                    <div className="card-icon" style={{ background: '#FFEBEE', color: '#F44336' }}><i className="fas fa-bolt"></i></div>
                    <h3>{t('disorder_anxiety_title')}</h3>
                    <p>{t('disorder_anxiety_desc')}</p>
                    <ul style={{ marginTop: '1rem', paddingInlineStart: '1.2rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        <li><span>{t('symptom_heart')}</span></li>
                        <li><span>{t('symptom_shaking')}</span></li>
                    </ul>
                    <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', borderRadius: '5px', cursor: 'pointer' }}>
                        <span>{t('btn_read_guide')}</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default DisorderLibrary;
