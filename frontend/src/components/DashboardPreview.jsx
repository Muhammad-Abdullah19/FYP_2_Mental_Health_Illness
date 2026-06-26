import React from 'react';
import './DashboardPreview.css';
import { useLanguage } from '../context/LanguageContext';

const DashboardPreview = () => {
    const { t } = useLanguage();

    return (
        <section className="dashboard-preview">
            <div className="section-title">
                <h2>{t('dashboard_title')}</h2>
                <p>{t('dashboard_subtitle')}</p>
            </div>
            <div className="stats-container">
                <div className="stat-card floating">
                    <div className="stat-number">85%</div>
                    <p>{t('stat_mood')}</p>
                </div>
                <div className="stat-card floating-fast">
                    <div className="stat-number">12</div>
                    <p>{t('stat_zikr')}</p>
                </div>
                <div className="stat-card floating">
                    <div className="stat-number">Normal</div>
                    <p>{t('stat_anxiety')}</p>
                </div>
            </div>
        </section>
    );
};

export default DashboardPreview;
