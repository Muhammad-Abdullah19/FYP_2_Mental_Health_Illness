import React, { useState } from 'react';
import './AuthModal.css';
import { useLanguage } from '../context/LanguageContext';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { verifyToken } from '../services/api';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
    const { t, currentLang } = useLanguage();
    const [activeTab, setActiveTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            let userCredential;

            if (activeTab === 'login') {
                // --- REAL FIREBASE LOGIN ---
                userCredential = await signInWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );
            } else {
                // --- REAL FIREBASE SIGNUP ---
                userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );
            }

            // Get the Firebase ID token
            const idToken = await userCredential.user.getIdToken();

            // Verify token with our FastAPI backend
            const backendResponse = await verifyToken(idToken);

            console.log('Backend verified user:', backendResponse);

            // Pass user data up to parent component
            if (onAuthSuccess) {
                onAuthSuccess({
                    uid: backendResponse.uid,
                    email: backendResponse.email,
                    idToken
                });
            }

            onClose();

        } catch (err) {
            // Map Firebase error codes to friendly messages
            const errorMessages = {
                'auth/user-not-found': currentLang === 'ur'
                    ? 'یہ ای میل رجسٹرڈ نہیں ہے'
                    : 'No account found with this email',
                'auth/wrong-password': currentLang === 'ur'
                    ? 'پاس ورڈ غلط ہے'
                    : 'Incorrect password',
                'auth/email-already-in-use': currentLang === 'ur'
                    ? 'یہ ای میل پہلے سے موجود ہے'
                    : 'Email already in use',
                'auth/weak-password': currentLang === 'ur'
                    ? 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے'
                    : 'Password must be at least 6 characters',
                'auth/invalid-email': currentLang === 'ur'
                    ? 'ای میل درست نہیں ہے'
                    : 'Invalid email address',
                'auth/network-request-failed': currentLang === 'ur'
                    ? 'انٹرنیٹ کنیکشن چیک کریں'
                    : 'Check your internet connection',
            };

            const friendlyMessage = errorMessages[err.code] || err.message;
            setError(friendlyMessage);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="auth-modal-overlay active"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="auth-modal">
                <i className="fas fa-times auth-close" onClick={onClose}></i>

                <div className="auth-header">
                    <h2>
                        {activeTab === 'login' ? t('auth_welcome') : t('auth_signup_title')}
                    </h2>
                    <p style={{ color: 'var(--text-light)' }}>
                        {activeTab === 'login'
                            ? t('auth_login_subtitle')
                            : t('auth_signup_subtitle')}
                    </p>
                </div>

                <div className="auth-tabs">
                    <div
                        className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('login'); setError(''); }}
                    >
                        {t('auth_tab_login')}
                    </div>
                    <div
                        className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('signup'); setError(''); }}
                    >
                        {t('auth_tab_signup')}
                    </div>
                </div>

                {/* Error Message Display */}
                {error && (
                    <div style={{
                        background: '#FFEBEE',
                        color: '#C62828',
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                <form className="auth-form active" onSubmit={handleSubmit}>
                    {activeTab === 'signup' && (
                        <div className="auth-input-group">
                            <i className="fas fa-user"></i>
                            <input
                                type="text"
                                name="name"
                                placeholder={t('auth_name_placeholder')}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="auth-input-group">
                        <i className="fas fa-envelope"></i>
                        <input
                            type="email"
                            name="email"
                            placeholder={t('auth_email_placeholder')}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <i className="fas fa-lock"></i>
                        <input
                            type="password"
                            name="password"
                            placeholder={t('auth_password_placeholder')}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {activeTab === 'login' && (
                        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                {t('auth_forgot_password')}
                            </a>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                        style={{ opacity: isLoading ? 0.7 : 1 }}
                    >
                        {isLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                {' '}{currentLang === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading...'}
                            </>
                        ) : (
                            activeTab === 'login' ? t('auth_login_btn') : t('auth_signup_btn')
                        )}
                    </button>

                    <div className="auth-footer">
                        <span>
                            {activeTab === 'login'
                                ? t('auth_no_account')
                                : t('auth_have_account')}
                        </span>{' '}
                        {/* FIX: Added the opening <a tag here */}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(activeTab === 'login' ? 'signup' : 'login');
                                setError('');
                            }}
                        >
                            {activeTab === 'login' ? t('auth_tab_signup') : t('auth_tab_login')}
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;