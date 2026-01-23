import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

const BOT_GUIDELINES = "You are Dr. AI, a helpful and empathetic medical assistant. You provide general health information but do not replace professional medical advice. Always advise users to consult a doctor for serious concerns. Keep responses concise.";

const Chatbot = () => {
    const { currentLang, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: t('chat_welcome') }
    ]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const chatBodyRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    // Update welcome message when language changes if it's the only message?
    // Or just keep history. For now, we won't wipe history but adding a new welcome might be annoying.
    // Let's just rely on the key update or simple behavior.

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Fetch response from Gemini API
    const fetchBotResponse = async (input, lang) => {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        if (!apiKey) {
            console.warn('REACT_APP_GEMINI_API_KEY is not defined in .env');
            return "Configuration error: API key missing.";
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `${BOT_GUIDELINES}\n\nUser input: ${input}\nAnswer in language: ${lang === 'ur' ? 'Urdu' : 'English'}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 200,
                    }
                })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    return "I'm currently overloaded (Quota Exceeded). Please try again later.";
                }
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                console.error('Unexpected API response:', data);
                return 'I am unable to process that request right now.';
            }

        } catch (error) {
            console.error('Chatbot API error:', error);
            return 'Sorry, I am having trouble connecting to the server.';
        }
    };

    const speak = (text, lang) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg = { type: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        const textToSend = inputText;
        setInputText('');

        setIsLoading(true);
        try {
            const responseText = await fetchBotResponse(textToSend, currentLang);
            setMessages(prev => [...prev, { type: 'bot', text: responseText }]);
            speak(responseText, currentLang);
        } finally {
            setIsLoading(false);
        }
    };

    const startVoice = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = currentLang === 'ur' ? 'ur-PK' : 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            setIsListening(true);
            recognition.start();

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                // toggle listening off?
                // sendMessage(); // Optional auto-send
            };

            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
        } else {
            alert("Voice recognition not supported in this browser.");
        }
    };

    return (
        <>
            <div className="chatbot-toggle floating" onClick={() => setIsOpen(!isOpen)}>
                <i className="fas fa-comments"></i>
            </div>

            <div className="chat-window" style={{ display: isOpen ? 'flex' : 'none' }}>
                <div className="chat-header">
                    <i className="fas fa-robot"></i>
                    <div>
                        <h4>Dr. AI Assistant</h4>
                        <small><span className="status-dot"></span> <span>{t('chat_status')}</span></small>
                    </div>
                    <i className="fas fa-times" style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setIsOpen(false)}></i>
                </div>
                <div className="chat-body" ref={chatBodyRef}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.type === 'bot' ? 'bot-msg' : 'user-msg'}`}>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                </div>
                {isLoading && (
                    <div className="loading-spinner" style={{ textAlign: 'center', padding: '8px' }}>
                        Loading...
                    </div>
                )}
                <div className="chat-input">
                    <input
                        type="text"
                        placeholder={t('chat_placeholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={startVoice}
                        style={{ color: isListening ? '#ff4444' : 'white', animation: isListening ? 'pulse-soft 1s infinite' : 'none' }}
                    >
                        <i className="fas fa-microphone"></i>
                    </button>
                    <button onClick={sendMessage}><i className="fas fa-paper-plane"></i></button>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#ccc', textAlign: 'center', padding: '5px' }}>
                    Note: Dr. AI provides information, not medical diagnosis.
                </div>
            </div>
        </>
    );
};

export default Chatbot;
