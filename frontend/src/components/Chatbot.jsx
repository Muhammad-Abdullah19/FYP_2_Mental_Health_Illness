//Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';
import { useLanguage } from '../context/LanguageContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Chatbot = ({ currentUser }) => {
    const { currentLang, t } = useLanguage();
    const CONDITION_LABELS_UR = {
        Depression: 'ڈپریشن',
        Anxiety: 'بے چینی',
        Stress: 'ذہنی دباؤ',
    };
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: t('chat_welcome') }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const chatBodyRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // Auto scroll
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Recording timer
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    // ---------------------------------------------------------------------------
    // Send text to backend
    // ---------------------------------------------------------------------------
    const sendMessage = async (textToSend) => {
        const text = textToSend || inputText;
        if (!text.trim()) return;

        setMessages(prev => [...prev, { type: 'user', text }]);
        if (!textToSend) setInputText('');
        setIsLoading(true);

        try {
            const user = currentUser ? (await import('../config/firebase')).auth.currentUser : null;
            const token = user ? await user.getIdToken() : null;
            const endpoint = token
                ? `${BASE_URL}/api/chat/message`
                : `${BASE_URL}/api/chat/message/public`;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            console.log('📤 Sending message to backend:', text);

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: text,
                    language: currentLang
                })
            });

            console.log('📨 Backend response status:', res.status);

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Backend error');
            }

            const data = await res.json();
            console.log('✅ Backend response:', data);

            setMessages(prev => [...prev, {
                type: 'bot',
                text: data.reply,
                islamic_remedy: data.islamic_remedy,
                clinical_remedy: data.clinical_remedy,
                condition: data.condition,
                condition_confidence: data.condition_confidence,
                condition_breakdown: data.condition_breakdown,
                severity_percent: data.severity_percent,
                severity_level: data.severity_level
            }]);

        } catch (err) {
            console.error('❌ sendMessage error:', err);
            setMessages(prev => [...prev, {
                type: 'bot',
                text: currentLang === 'ur'
                    ? 'معذرت، سرور سے جواب نہیں ملا۔ دوبارہ کوشش کریں۔'
                    : 'Sorry, could not reach the server. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Start recording
    // ---------------------------------------------------------------------------
    const startRecording = async () => {
        console.log('🎙️ Starting recording...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, sampleRate: 16000 }
            });

            console.log('✅ Microphone access granted');
            audioChunksRef.current = [];

            // Find best supported format
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/ogg;codecs=opus';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = '';
                    }
                }
            }
            console.log('🎵 mimeType:', mimeType || 'browser default');

            const mediaRecorder = new MediaRecorder(
                stream,
                mimeType ? { mimeType } : {}
            );

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                    console.log('📦 Chunk:', e.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                console.log('⏹️ Recording stopped, chunks:', audioChunksRef.current.length);

                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mimeType || 'audio/webm'
                });
                console.log('📦 Final blob:', audioBlob.size, 'bytes');
                await transcribeAudio(audioBlob);
            };

            mediaRecorder.onerror = (e) => {
                console.error('❌ MediaRecorder error:', e.error);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100);
            setIsRecording(true);
            console.log('✅ Recording started');

            setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    stopRecording();
                }
            }, 30000);

        } catch (err) {
            console.error('❌ Mic error:', err.name, err.message);
            alert(err.name === 'NotAllowedError'
                ? (currentLang === 'ur'
                    ? 'مائیکروفون کی اجازت درکار ہے'
                    : 'Microphone permission required')
                : 'Microphone error: ' + err.message
            );
        }
    };

    // ---------------------------------------------------------------------------
    // Stop recording
    // ---------------------------------------------------------------------------
    const stopRecording = () => {
        console.log('⏹️ Stopping recording...');
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Transcribe audio via backend
    // ---------------------------------------------------------------------------
    const transcribeAudio = async (audioBlob) => {
        console.log('🎙️ Transcribing audio...');
        console.log('📦 Blob size:', audioBlob.size, 'type:', audioBlob.type);

        if (audioBlob.size === 0) {
            console.error('❌ Empty audio blob');
            setMessages(prev => [...prev, {
                type: 'bot',
                text: currentLang === 'ur'
                    ? 'آواز ریکارڈ نہیں ہوئی۔ دوبارہ کوشش کریں۔'
                    : 'No audio recorded. Please try again.'
            }]);
            return;
        }

        setIsLoading(true);
        setMessages(prev => [...prev, {
            type: 'bot',
            text: currentLang === 'ur'
                ? '🎙️ آواز پہچانی جا رہی ہے...'
                : '🎙️ Transcribing...',
            isTemporary: true
        }]);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('language', currentLang === 'ur' ? 'ur' : 'en');

            console.log('📤 POST to /api/voice/transcribe');

            const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
                method: 'POST',
                body: formData
            });

            console.log('📨 Transcribe response:', res.status);

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Transcription failed');
            }

            const data = await res.json();
            console.log('✅ Transcription:', data);

            setMessages(prev => prev.filter(m => !m.isTemporary));

            if (data.text) {
                setMessages(prev => [...prev, {
                    type: 'user',
                    text: `🎙️ ${data.text}`,
                    isVoice: true
                }]);
                await sendMessage(data.text);
            } else {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: currentLang === 'ur'
                        ? 'آواز نہیں سنی گئی۔ دوبارہ بولیں۔'
                        : 'No speech detected. Please try again.'
                }]);
            }

        } catch (err) {
            console.error('❌ Transcription error:', err);
            setMessages(prev => prev.filter(m => !m.isTemporary));
            setMessages(prev => [...prev, {
                type: 'bot',
                text: currentLang === 'ur'
                    ? `آواز کی خرابی: ${err.message}`
                    : `Transcription error: ${err.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <>
            {!isOpen && (
                <div
                    className="chatbot-toggle floating"
                    onClick={() => setIsOpen(true)}
                >
                    <i className="fas fa-comments"></i>
                </div>
            )}

            <div
                className="chat-window"
                style={{ display: isOpen ? 'flex' : 'none' }}
            >
                {/* Header */}
                <div className="chat-header">
                    <i className="fas fa-robot"></i>
                    <div>
                        <h4>Dr. AI Assistant</h4>
                        <small>
                            <span className="status-dot"></span>
                            {' '}{t('chat_status')}
                        </small>
                    </div>
                    <i
                        className="fas fa-times"
                        style={{ marginInlineStart: 'auto', cursor: 'pointer' }}
                        onClick={() => setIsOpen(false)}
                    />
                </div>

                {/* Messages */}
                <div className="chat-body" ref={chatBodyRef}>
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`message ${msg.type === 'bot'
                                ? 'bot-msg'
                                : 'user-msg'}`}
                        >
                            <p>{msg.text}</p>

                            {/* Condition analysis with percentage breakdown */}
                            {msg.condition_breakdown && (
                                <div style={{ marginTop: '8px', fontSize: '0.72rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        color: 'var(--primary)',
                                        fontWeight: 600,
                                        marginBottom: '4px'
                                    }}>
                                        <span>🧠 {currentLang === 'ur' ? 'تجزیہ' : 'Analysis'}</span>
                                        <span>
                                            {currentLang === 'ur' ? 'شدت' : 'Severity'}: {msg.severity_percent}%
                                            {msg.severity_level ? ` (${msg.severity_level})` : ''}
                                        </span>
                                    </div>

                                    {Object.entries(msg.condition_breakdown)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([cond, pct]) => (
                                            <div key={cond} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                margin: '3px 0',
                                                direction: currentLang === 'ur' ? 'rtl' : 'ltr'
                                            }}>
                                                <span style={{ width: '78px' }}>
                                                    {currentLang === 'ur'
                                                        ? (CONDITION_LABELS_UR[cond] || cond)
                                                        : cond}
                                                </span>
                                                <div style={{
                                                    flex: 1,
                                                    height: '6px',
                                                    background: 'rgba(0,0,0,0.08)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${pct}%`,
                                                        height: '100%',
                                                        background: 'var(--primary)',
                                                        borderRadius: '3px'
                                                    }} />
                                                </div>
                                                <span style={{ width: '34px', textAlign: 'left' }}>{pct}%</span>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Islamic remedy with reference */}
                            {msg.islamic_remedy && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '8px',
                                    background: 'rgba(0,128,128,0.05)',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    borderRight: '3px solid var(--primary)',
                                    fontFamily: 'Noto Nastaliq Urdu, serif'
                                }}>
                                    ☪️ {msg.islamic_remedy}
                                    {msg.islamic_reference && (
                                        <div style={{
                                            marginTop: '4px',
                                            fontSize: '0.68rem',
                                            opacity: 0.75,
                                            fontStyle: 'italic',
                                            direction: 'ltr',
                                            textAlign: 'left'
                                        }}>
                                            📖 {msg.islamic_reference}
                                            {msg.islamic_verified === false && ' *'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Clinical remedy */}
                            {msg.clinical_remedy && (
                                <div style={{
                                    marginTop: '6px',
                                    padding: '8px',
                                    background: 'rgba(32,178,170,0.05)',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    borderLeft: '3px solid var(--primary-light)'
                                }}>
                                    🏥 {msg.clinical_remedy}
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="message bot-msg">
                            <p>
                                <i className="fas fa-circle-notch fa-spin"></i>
                                {' '}{currentLang === 'ur'
                                    ? 'جواب تیار ہو رہا ہے...'
                                    : 'Preparing response...'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Recording Banner */}
                {isRecording && (
                    <div style={{
                        background: '#ffebee',
                        color: '#c62828',
                        textAlign: 'center',
                        padding: '6px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            background: 'red',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'pulse-soft 1s infinite'
                        }}></span>
                        {currentLang === 'ur'
                            ? `ریکارڈنگ ${recordingTime}s`
                            : `Recording ${recordingTime}s`}
                        {' — '}
                        {currentLang === 'ur'
                            ? 'روکنے کے لیے دبائیں'
                            : 'tap to stop'}
                    </div>
                )}

                {/* Input */}
                <div
                    className="chat-input"
                    dir={currentLang === 'ur' ? 'rtl' : 'ltr'}
                >
                    <input
                        type="text"
                        placeholder={t('chat_placeholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={isRecording || isLoading}
                    />

                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                            background: isRecording ? '#e53935' : 'var(--primary)',
                            animation: isRecording
                                ? 'pulse-soft 1s infinite'
                                : 'none'
                        }}
                        title={isRecording ? 'Stop' : 'Voice input'}
                    >
                        <i className={`fas ${isRecording
                            ? 'fa-stop'
                            : 'fa-microphone'}`}
                        ></i>
                    </button>

                    <button
                        onClick={() => sendMessage()}
                        disabled={isRecording || isLoading || !inputText.trim()}
                        title="Send"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>

                <div style={{
                    fontSize: '0.7rem',
                    color: '#aaa',
                    textAlign: 'center',
                    padding: '4px'
                }}>
                    {currentLang === 'ur'
                        ? 'Dr. AI معلومات فراہم کرتا ہے، تشخیص نہیں'
                        : 'Dr. AI provides info, not medical diagnosis'}
                </div>
            </div>
        </>
    );
};

export default Chatbot;