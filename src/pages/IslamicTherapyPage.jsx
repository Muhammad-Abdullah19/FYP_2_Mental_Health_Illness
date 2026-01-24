import React, { useEffect } from 'react';
import './IslamicTherapyPage.css';
import { useLanguage } from '../context/LanguageContext';

const IslamicTherapyPage = () => {
    const { t } = useLanguage();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const remedies = [
        {
            id: 'anxiety',
            title: t('remedy_anxiety_title'),
            type: t('remedy_anxiety_type'),
            verse: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
            translation: t('remedy_anxiety_verse_trans'),
            audio: 'Surah Ar-Rahman (15 mins)',
            icon: 'fa-heart-pulse',
            color: 'var(--primary)'
        },
        {
            id: 'grief',
            title: t('remedy_grief_title'),
            type: t('remedy_grief_type'),
            verse: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
            translation: t('remedy_grief_verse_trans'),
            action: 'Make Dua in Sujood',
            icon: 'fa-cloud-rain',
            color: 'var(--primary-light)'
        },
        {
            id: 'stress',
            title: t('remedy_islamic_title'),
            type: 'Quranic Healing',
            verse: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
            translation: t('remedy_stress_islamic'),
            action: 'Surah Ash-Sharh Recitation',
            icon: 'fa-sun',
            color: 'var(--secondary)'
        }
    ];

    return (
        <main className="islamic-therapy-page" style={{ paddingTop: '80px' }}>
            <section className="hero" style={{ minHeight: '40vh', padding: '4rem 5%' }}>
                <div className="hero-content">
                    <h1>{t('islamic_title')}</h1>
                    <p>{t('feature_remedies_desc')}</p>
                </div>
                <div className="hero-visual">
                    <div className="hero-blob floating-fast" style={{ width: '300px', height: '300px' }}></div>
                    <div className="hero-icon-container floating">
                        <i className="fas fa-moon"></i>
                    </div>
                </div>
            </section>

            <section className="features" style={{ background: 'var(--bg-color)' }}>
                <div className="grid">
                    {remedies.map((remedy) => (
                        <div key={remedy.id} className="remedy-card floating" style={{ background: 'var(--white)', height: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ color: remedy.color }}><i className={`fas ${remedy.icon}`}></i> <span>{remedy.title}</span></h4>
                                <span style={{ background: 'var(--accent)', padding: '5px 10px', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                                    <span>{remedy.type}</span>
                                </span>
                            </div>
                            <div className="verse-box">
                                {remedy.verse}
                            </div>
                            <p style={{ textAlign: 'center', color: 'var(--text-dark)' }}>{remedy.translation}</p>
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                {remedy.audio && (
                                    <p><strong><i className="fas fa-play-circle"></i> {t('remedy_anxiety_audio')}</strong> {remedy.audio}</p>
                                )}
                                {remedy.action && (
                                    <p><strong><i className="fas fa-hand-holding-heart"></i> {t('remedy_grief_action')}</strong> {remedy.action}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default IslamicTherapyPage;
