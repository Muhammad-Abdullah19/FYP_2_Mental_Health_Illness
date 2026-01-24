import React, { useState } from 'react';
import './AuthModal.css';
import { useLanguage } from '../context/LanguageContext';

const AuthModal = ({ isOpen, onClose }) => {
    const { t, currentLang } = useLanguage();
    const [activeTab, setActiveTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            onClose();
            alert(activeTab === 'login'
                ? (currentLang === 'ur' ? 'لاگ ان کامیاب!' : 'Login Successful!')
                : (currentLang === 'ur' ? 'اکاؤنٹ بن گیا!' : 'Account Created Successfully!')
            );
        }, 1500);
    };

    return (
        <div className={`auth-modal-overlay active`} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="auth-modal">
                <i className="fas fa-times auth-close" onClick={onClose}></i>

                <div className="auth-header">
                    <h2>{activeTab === 'login' ? t('auth_welcome') : t('auth_signup_title')}</h2>
                    <p style={{ color: 'var(--text-light)' }}>
                        {activeTab === 'login' ? t('auth_login_subtitle') : t('auth_signup_subtitle')}
                    </p>
                </div>

                <div className="auth-tabs">
                    <div
                        className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                    >
                        {t('auth_tab_login')}
                    </div>
                    <div
                        className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                    >
                        {t('auth_tab_signup')}
                    </div>
                </div>

                <form className={`auth-form active`} onSubmit={handleSubmit}>
                    {activeTab === 'signup' && (
                        <div className="auth-input-group">
                            <i className="fas fa-user"></i>
                            <input type="text" placeholder={t('auth_name_placeholder')} required />
                        </div>
                    )}
                    <div className="auth-input-group">
                        <i className="fas fa-envelope"></i>
                        <input type="email" placeholder={t('auth_email_placeholder')} required />
                    </div>
                    <div className="auth-input-group">
                        <i className="fas fa-lock"></i>
                        <input type="password" placeholder={t('auth_password_placeholder')} required />
                    </div>

                    {activeTab === 'login' && (
                        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                {t('auth_forgot_password')}
                            </a>
                        </div>
                    )}

                    <button type="submit" className="auth-submit-btn">
                        {isLoading ? 'Loading...' : (activeTab === 'login' ? t('auth_login_btn') : t('auth_signup_btn'))}
                    </button>

                    <div className="auth-footer">
                        <span>{activeTab === 'login' ? t('auth_no_account') : t('auth_have_account')}</span> <a href="#" onClick={(e) => {
                            e.preventDefault();
                            setActiveTab(activeTab === 'login' ? 'signup' : 'login');
                        }}>
                            {activeTab === 'login' ? t('auth_tab_signup') : t('auth_tab_login')}
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;
