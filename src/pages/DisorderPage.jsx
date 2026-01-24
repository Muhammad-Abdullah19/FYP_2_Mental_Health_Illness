import React, { useEffect } from 'react';
import './DisorderPage.css';
import { useLanguage } from '../context/LanguageContext';

const DisorderPage = () => {
    const { t } = useLanguage();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const disorders = [
        {
            id: 'depression',
            title: t('disorder_depression_title'),
            desc: t('disorder_depression_desc'),
            icon: 'fa-brain',
            color: '#FF9800',
            bg: '#FFF3E0',
            symptoms: [t('symptom_fatigue'), t('symptom_sleep')],
            remedies: {
                islamic: t('remedy_depression_islamic'),
                clinical: t('remedy_depression_clinical')
            }
        },
        {
            id: 'anxiety',
            title: t('disorder_anxiety_title'),
            desc: t('disorder_anxiety_desc'),
            icon: 'fa-bolt',
            color: '#F44336',
            bg: '#FFEBEE',
            symptoms: [t('symptom_heart'), t('symptom_shaking')],
            remedies: {
                islamic: t('remedy_anxiety_islamic'),
                clinical: t('remedy_anxiety_clinical')
            }
        },
        {
            id: 'stress',
            title: t('disorder_stress_title'),
            desc: t('disorder_stress_desc'),
            icon: 'fa-wind',
            color: '#2196F3',
            bg: '#E3F2FD',
            symptoms: [t('symptom_muscle_tension'), t('symptom_irritability')],
            remedies: {
                islamic: t('remedy_stress_islamic'),
                clinical: t('remedy_stress_clinical')
            }
        }
    ];

    return (
        <main className="disorder-page" style={{ paddingTop: '80px' }}>
            <section className="hero" style={{ minHeight: '40vh', padding: '4rem 5%' }}>
                <div className="hero-content">
                    <h1>{t('disorder_page_title')}</h1>
                    <p>{t('disorder_page_subtitle')}</p>
                </div>
                <div className="hero-visual">
                    <div className="hero-blob floating-fast" style={{ width: '300px', height: '300px' }}></div>
                    <div className="hero-icon-container floating">
                        <i className="fas fa-book-medical"></i>
                    </div>
                </div>
            </section>

            <section className="features" style={{ background: 'var(--bg-color)' }}>
                <div className="grid">
                    {disorders.map((disorder) => (
                        <div key={disorder.id} className="card" style={{ height: 'auto' }}>
                            <div className="card-icon" style={{ background: disorder.bg, color: disorder.color }}>
                                <i className={`fas ${disorder.icon}`}></i>
                            </div>
                            <h3>{disorder.title}</h3>
                            <p>{disorder.desc}</p>

                            <div className="symptoms-section" style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Symptoms:</h4>
                                <ul style={{ paddingInlineStart: '1.2rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                    {disorder.symptoms.map((symptom, index) => (
                                        <li key={index}><span>{symptom}</span></li>
                                    ))}
                                </ul>
                            </div>

                            <div className="remedies-container" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="remedy-box" style={{ background: 'rgba(0, 128, 128, 0.05)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-moon"></i> {t('remedy_islamic_title')}
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.6' }}>{disorder.remedies.islamic}</p>
                                </div>

                                <div className="remedy-box" style={{ background: 'rgba(32, 178, 170, 0.05)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--primary-light)' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-stethoscope"></i> {t('remedy_clinical_title')}
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.6' }}>{disorder.remedies.clinical}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default DisorderPage;
