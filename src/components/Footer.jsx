import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer>
            <div className="footer-content">
                <h3>Noor-e-Shifa</h3>
                <p>{t('footer_tagline')}</p>
            </div>
            <p>&copy; 2024 Noor-e-Shifa. <span>{t('footer_copyright')}</span></p>
        </footer>
    );
};

export default Footer;
