import React from 'react';
import './IslamicTherapy.css';
import { useLanguage } from '../context/LanguageContext';

const IslamicTherapy = () => {
    const { t } = useLanguage();

    return (
        <section className="islamic-therapy" id="islamic">
            <div className="section-title">
                <h2>{t('islamic_title')}</h2>
            </div>
            <div className="grid">
                {/* Anxiety Remedy */}
                <div className="remedy-card floating">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4><i className="fas fa-heart-pulse"></i> <span>{t('remedy_anxiety_title')}</span></h4>
                        <span style={{ background: '#e0f2f1', padding: '5px 10px', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                            <span>{t('remedy_anxiety_type')}</span>
                        </span>
                    </div>
                    <div className="verse-box">
                        أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
                    </div>
                    <p style={{ textAlign: 'center' }}>{t('remedy_anxiety_verse_trans')}</p>
                    <div style={{ marginTop: '1rem' }}>
                        <strong><i className="fas fa-play-circle"></i> <span>{t('remedy_anxiety_audio')}</span></strong> Surah Ar-Rahman (15 mins)
                    </div>
                </div>

                {/* Depression Remedy */}
                <div className="remedy-card floating-fast">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4><i className="fas fa-cloud-rain"></i> <span>{t('remedy_grief_title')}</span></h4>
                        <span style={{ background: '#e0f2f1', padding: '5px 10px', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                            <span>{t('remedy_grief_type')}</span>
                        </span>
                    </div>
                    <div className="verse-box">
                        لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا
                    </div>
                    <p style={{ textAlign: 'center' }}>{t('remedy_grief_verse_trans')}</p>
                    <div style={{ marginTop: '1rem' }}>
                        <strong><i className="fas fa-hands-praying"></i> <span>{t('remedy_grief_action')}</span></strong> Make Dua in Sujood
                    </div>
                </div>
            </div>
        </section>
    );
};

export default IslamicTherapy;
