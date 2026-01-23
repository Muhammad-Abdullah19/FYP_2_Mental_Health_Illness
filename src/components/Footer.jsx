import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer style={{ background: 'var(--primary)', color: 'var(--white)', padding: '3rem 5%', textAlign: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h3>Noor-e-Shifa</h3>
                <p>{t('footer_tagline')}</p>
            </div>
            <p>&copy; 2024 Noor-e-Shifa. <span>{t('footer_copyright')}</span></p>
        </footer>
    );
};

export default Footer;
