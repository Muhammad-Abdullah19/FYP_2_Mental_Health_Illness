import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './DisclaimerModal.css';

const DisclaimerModal = () => {
    const { currentLang } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem('disclaimer_accepted');
        if (!accepted) {
            const timer = setTimeout(() => setIsVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        if (!isChecked) return;
        localStorage.setItem('disclaimer_accepted', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="disclaimer-overlay">
            <div className="disclaimer-modal">

                {/* Header */}
                <div className="disclaimer-header">
                    <div className="disclaimer-icon">
                        <i className="fas fa-shield-heart"></i>
                    </div>
                    <h2>
                        {currentLang === 'ur'
                            ? 'نور شفاء میں خوش آمدید'
                            : 'Welcome to Noor-e-Shifa'}
                    </h2>
                </div>

                {/* Badge */}
                <div className="disclaimer-badge">
                    <i className="fas fa-exclamation-triangle"></i>
                    {currentLang === 'ur'
                        ? 'اہم اطلاع — براہ کرم پڑھیں'
                        : 'Important Notice — Please Read'}
                </div>

                {/* Content */}
                <div className="disclaimer-content">
                    {currentLang === 'ur' ? (
                        <>
                            <p>
                                <strong>نور شفاء</strong> ایک{' '}
                                <strong>معاون ساتھی</strong> ہے،
                                نہ کہ طبی آلہ۔ یہ ایپ آپ کو جذباتی
                                سہارا اور معلومات فراہم کرتی ہے۔
                            </p>

                            <div className="disclaimer-list">
                                <div className="disclaimer-item disclaimer-item--warning">
                                    <i className="fas fa-times-circle"></i>
                                    <span>یہ ایپ کسی بیماری کی <strong>تشخیص نہیں</strong> کرتی</span>
                                </div>
                                <div className="disclaimer-item disclaimer-item--warning">
                                    <i className="fas fa-times-circle"></i>
                                    <span>یہ <strong>طبی علاج کا متبادل نہیں</strong></span>
                                </div>
                                <div className="disclaimer-item disclaimer-item--warning">
                                    <i className="fas fa-times-circle"></i>
                                    <span>AI کا جواب <strong>ڈاکٹر کی رائے نہیں</strong></span>
                                </div>
                                <div className="disclaimer-item disclaimer-item--ok">
                                    <i className="fas fa-check-circle"></i>
                                    <span>شدید تکلیف میں <strong>ماہر نفسیات</strong> سے ملیں</span>
                                </div>
                                <div className="disclaimer-item disclaimer-item--ok">
                                    <i className="fas fa-check-circle"></i>
                                    <span>بحران میں <strong>Umang: 0317-4288665</strong></span>
                                </div>
                            </div>

                            <div className="disclaimer-crisis">
                                <i className="fas fa-phone-alt"></i>
                                <div>
                                    <strong>پاکستان بحران ہیلپ لائن</strong>
                                    <p>Umang: 0317-4288665</p>
                                    <p>Rozan: 0304-1111744</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>
                                <strong>Noor-e-Shifa</strong> is a{' '}
                                <strong>supportive companion</strong>, not a
                                medical tool. This app provides emotional
                                support and general information only.
                            </p>

                            <div className="disclaimer-list">
                                <div className="disclaimer-item disclaimer-item--warning">
                                    <i className="fas fa-times-circle"></i>
                                    <span>This app does <strong>not diagnose</strong> any condition</span>
                                </div>
                                <div className="disclaimer-item disclaimer-item--warning">
                                    <i className="fas fa-times-circle"></i>
                                    <span>It is <strong>not a replacement</strong> for professional treatment</span>
                                </div>
                                <div className="disclaimer-item disclaimer-item--warning">
                                    <i className="fas fa-times-circle"></i>
                                    <span>AI responses are <strong>not medical advice</strong></span>
                                </div>
                                <div className="disclaimer-item disclaimer-item--ok">
                                    <i className="fas fa-check-circle"></i>
                                    <span>For serious concerns, consult a <strong>mental health professional</strong></span>
                                </div>
                                <div className="disclaimer-item disclaimer-item--ok">
                                    <i className="fas fa-check-circle"></i>
                                    <span>In crisis, call <strong>Umang: 0317-4288665</strong></span>
                                </div>
                            </div>

                            <div className="disclaimer-crisis">
                                <i className="fas fa-phone-alt"></i>
                                <div>
                                    <strong>Pakistan Crisis Helplines</strong>
                                    <p>Umang: 0317-4288665</p>
                                    <p>Rozan: 0304-1111744</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Checkbox */}
                <label className="disclaimer-checkbox">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                    />
                    <span>
                        {currentLang === 'ur'
                            ? 'میں سمجھتا/سمجھتی ہوں کہ یہ طبی آلہ نہیں ہے'
                            : 'I understand this is not a medical tool'}
                    </span>
                </label>

                {/* Accept Button */}
                <button
                    className="disclaimer-btn"
                    onClick={handleAccept}
                    disabled={!isChecked}
                    style={{ opacity: isChecked ? 1 : 0.4, cursor: isChecked ? 'pointer' : 'not-allowed' }}
                >
                    <i className="fas fa-check"></i>
                    {' '}
                    {currentLang === 'ur'
                        ? 'میں سمجھ گیا — جاری رکھیں'
                        : 'I Understand — Continue'}
                </button>

                {/* Footer */}
                <p className="disclaimer-footer">
                    {currentLang === 'ur'
                        ? 'نور شفاء — سائنس اور روحانیت کا سنگم'
                        : 'Noor-e-Shifa — Bridging Science & Spirituality'}
                </p>
            </div>
        </div>
    );
};

export default DisclaimerModal;