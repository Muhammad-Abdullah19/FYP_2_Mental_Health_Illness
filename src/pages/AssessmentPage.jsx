import React, { useState, useEffect } from 'react';
import './AssessmentPage.css';
import { useLanguage } from '../context/LanguageContext';

const PHQ9_QUESTIONS = [
    'phq9_q1', 'phq9_q2', 'phq9_q3', 'phq9_q4', 'phq9_q5', 'phq9_q6', 'phq9_q7', 'phq9_q8', 'phq9_q9'
];

const GAD7_QUESTIONS = [
    'gad7_q1', 'gad7_q2', 'gad7_q3', 'gad7_q4', 'gad7_q5', 'gad7_q6', 'gad7_q7'
];

const PSS10_QUESTIONS = [
    'pss10_q1', 'pss10_q2', 'pss10_q3', 'pss10_q4', 'pss10_q5', 'pss10_q6', 'pss10_q7', 'pss10_q8', 'pss10_q9', 'pss10_q10'
];

const PHQ9_OPTIONS = [
    { label: 'opt_not_all', value: 0 },
    { label: 'opt_several', value: 1 },
    { label: 'opt_half', value: 2 },
    { label: 'opt_nearly', value: 3 }
];

const PSS10_OPTIONS = [
    { label: 'opt_never', value: 0 },
    { label: 'opt_almost_never', value: 1 },
    { label: 'opt_sometimes', value: 2 },
    { label: 'opt_fairly_often', value: 3 },
    { label: 'opt_very_often', value: 4 }
];

const AssessmentPage = () => {
    const { t } = useLanguage();
    const [activeTest, setActiveTest] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTest, showResult]);

    const assessments = [
        {
            id: 'depression',
            title: t('assessment_depression_title'),
            desc: t('assessment_depression_desc'),
            duration: '5 mins',
            questions: 9,
            icon: 'fa-face-frown'
        },
        {
            id: 'anxiety',
            title: t('assessment_anxiety_title'),
            desc: t('assessment_anxiety_desc'),
            duration: '4 mins',
            questions: 7,
            icon: 'fa-face-grin-beam-sweat'
        },
        {
            id: 'stress',
            title: t('assessment_stress_title'),
            desc: t('assessment_stress_desc'),
            duration: '3 mins',
            questions: 10,
            icon: 'fa-bolt-lightning'
        }
    ];

    const startAssessment = (id) => {
        setActiveTest(id);
        setCurrentStep(0);
        setAnswers([]);
        setShowResult(false);
    };

    const activeQuestions = activeTest === 'depression'
        ? PHQ9_QUESTIONS
        : activeTest === 'anxiety'
            ? GAD7_QUESTIONS
            : PSS10_QUESTIONS;

    const handleAnswer = (value) => {
        const newAnswers = [...answers, value];
        setAnswers(newAnswers);

        if (currentStep < activeQuestions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setShowResult(true);
        }
    };

    const calculateResult = () => {
        const totalScore = answers.reduce((acc, curr) => acc + curr, 0);
        let severity = '';
        let suggestion = '';

        if (activeTest === 'depression') {
            if (totalScore <= 4) {
                severity = t('depression_none');
                suggestion = "Keep maintaining your positive mental health routine.";
            } else if (totalScore <= 9) {
                severity = t('depression_mild');
                suggestion = "Consider talking to a friend or starting a mood journal.";
            } else if (totalScore <= 14) {
                severity = t('depression_moderate');
                suggestion = "We recommend consulting a counselor for professional guidance.";
            } else if (totalScore <= 19) {
                severity = t('depression_mod_severe');
                suggestion = "Please seek professional help from a psychologist or therapist.";
            } else {
                severity = t('depression_severe');
                suggestion = "URGENT: Please contact a mental health professional or a psychiatrist immediately.";
            }
        } else if (activeTest === 'anxiety') {
            // GAD-7 Scoring
            if (totalScore <= 4) {
                severity = t('anxiety_none');
                suggestion = "You have minimal anxiety. Continue practicing mindfulness.";
            } else if (totalScore <= 9) {
                severity = t('anxiety_mild');
                suggestion = "You show symptoms of mild anxiety. Try relaxing breathing exercises.";
            } else if (totalScore <= 14) {
                severity = t('anxiety_moderate');
                suggestion = "Moderate anxiety detected. Speaking with a counselor could be very beneficial.";
            } else {
                severity = t('anxiety_severe');
                suggestion = "Severe anxiety levels. We strongly recommend professional clinical evaluation.";
            }
        } else if (activeTest === 'stress') {
            // PSS-10 Scoring (Reverse items: 4, 5, 7, 8)
            const reverseIndices = [3, 4, 6, 7]; // 0-indexed indices for questions 4, 5, 7, 8
            let pssScore = 0;
            answers.forEach((val, idx) => {
                if (reverseIndices.includes(idx)) {
                    pssScore += (4 - val);
                } else {
                    pssScore += val;
                }
            });

            const finalScore = pssScore;
            if (finalScore <= 13) {
                severity = t('stress_low');
                suggestion = "You are handling stress well. Keep up your healthy coping mechanisms.";
            } else if (finalScore <= 26) {
                severity = t('stress_moderate');
                suggestion = "You are experiencing moderate stress. Consider time management or relaxation techniques.";
            } else {
                severity = t('stress_high');
                suggestion = "High stress level detected. It's important to identify your triggers and seek support.";
            }
            return { totalScore: finalScore, severity, suggestion };
        }

        return { totalScore, severity, suggestion };
    };

    if (showResult) {
        const result = calculateResult();
        return (
            <main className="assessment-page" style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg-color)' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                    <div className="card glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '30px', animation: 'fadeIn 0.8s ease-out' }}>
                        <div className="card-icon" style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{t('assessment_result')}</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', margin: '2rem 0' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-light)' }}>{t('assessment_score')}</h4>
                                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{result.totalScore}</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--text-light)' }}>{t('assessment_severity')}</h4>
                                <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>{result.severity}</p>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0, 128, 128, 0.05)', padding: '2rem', borderRadius: '20px', marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}><i className="fas fa-lightbulb"></i> {t('assessment_suggestion')}</h4>
                            <p>{result.suggestion}</p>
                        </div>
                        <button className="cta-btn" onClick={() => {
                            setActiveTest(null);
                            setShowResult(false);
                            setCurrentStep(0);
                        }}>
                            {t('back_to_assessments')}
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    if (activeTest) {
        const progress = ((currentStep + 1) / activeQuestions.length) * 100;
        return (
            <main className="assessment-page" style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg-color)' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                    <div className="card" style={{ padding: '3rem', borderRadius: '30px', animation: 'slideInUp 0.6s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <button
                                    onClick={() => setActiveTest(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1.2rem' }}
                                    title={t('back_to_assessments')}
                                >
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                                <h3 style={{ color: 'var(--primary)' }}>
                                    {activeTest === 'depression' ? t('assessment_depression_title') :
                                        activeTest === 'anxiety' ? t('assessment_anxiety_title') :
                                            t('assessment_stress_title')}
                                </h3>
                            </div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Question {currentStep + 1} of {activeQuestions.length}</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '10px', marginBottom: '3rem', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(to right, var(--primary), #00a8a8)', transition: '0.5s ease' }}></div>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', lineHeight: '1.4', marginBottom: '3rem', minHeight: '100px' }}>{t(activeQuestions[currentStep])}</h2>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {(activeTest === 'stress' ? PSS10_OPTIONS : PHQ9_OPTIONS).map((opt) => (
                                <button
                                    key={opt.value}
                                    className="option-btn"
                                    onClick={() => handleAnswer(opt.value)}
                                    style={{
                                        padding: '1.2rem 2rem',
                                        background: 'var(--white)',
                                        border: '2px solid #eee',
                                        borderRadius: '15px',
                                        textAlign: 'start',
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        transition: '0.3s'
                                    }}
                                >
                                    {t(opt.label)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main key="main-assessment-list" className="assessment-page" style={{ paddingTop: '80px' }}>
            <section className="hero" style={{ minHeight: '40vh', padding: '4rem 5%' }}>
                <div className="hero-content">
                    <h1>{t('nav_assessments')}</h1>
                    <p>{t('feature_assessments_desc')}</p>
                </div>
                <div className="hero-visual">
                    <div className="hero-blob floating-fast" style={{ width: '300px', height: '300px' }}></div>
                    <div className="hero-icon-container floating">
                        <i className="fas fa-clipboard-list"></i>
                    </div>
                </div>
            </section>

            <section className="features" style={{ background: 'var(--bg-color)' }}>
                <div className="grid">
                    {assessments.map((test) => (
                        <div key={test.id} className="card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div className="card-icon">
                                    <i className={`fas ${test.icon}`}></i>
                                </div>
                                <h3 style={{ margin: '1rem 0' }}>{test.title}</h3>
                                <p>{test.desc}</p>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                    <span><i className="far fa-clock"></i> {test.duration}</span>
                                    <span><i className="far fa-file-alt"></i> {test.questions} Questions</span>
                                </div>
                            </div>
                            <button
                                className="cta-btn"
                                style={{ marginTop: '2rem', padding: '0.8rem', width: '100%', fontSize: '1rem' }}
                                onClick={() => startAssessment(test.id)}
                            >
                                {t('btn_start_assessment')}
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default AssessmentPage;
