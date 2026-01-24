<<<<<<< HEAD
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
=======
import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';
import { useLanguage } from '../context/LanguageContext';

const BOT_GUIDELINES = "You are Dr. AI, a helpful and empathetic medical assistant. You provide general health information but do not replace professional medical advice. Always advise users to consult a doctor for serious concerns. Keep responses concise.";

const URDU_PHONETIC_MAP = {
    'a': 'ا', 'b': 'ب', 'c': 'چ', 'd': 'د', 'e': 'ع', 'f': 'ف', 'g': 'گ', 'h': 'ہ', 'i': 'ی', 'j': 'ج',
    'k': 'ک', 'l': 'ل', 'm': 'م', 'n': 'ن', 'o': 'و', 'p': 'پ', 'q': 'ق', 'r': 'ر', 's': 'س', 't': 'ت',
    'u': 'و', 'v': 'و', 'w': 'و', 'x': 'ش', 'y': 'ے', 'z': 'ز',
    'A': 'آ', 'B': 'ب', 'C': 'ث', 'D': 'ڈ', 'E': 'ع', 'F': 'ف', 'G': 'غ', 'H': 'ح', 'I': 'ی', 'J': 'ض',
    'K': 'خ', 'L': 'ل', 'M': 'م', 'N': 'ں', 'O': 'و', 'P': 'ُ', 'Q': 'ق', 'R': 'ڑ', 'S': 'ش', 'T': 'ٹ',
    'U': 'ء', 'V': 'ظ', 'W': 'و', 'X': 'ژ', 'Y': 'ی', 'Z': 'ذ',
    ';': '؛', '?': '؟', ',': '،'
};

const Chatbot = () => {
    const { currentLang, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: t('chat_welcome'), lang: currentLang }
    ]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const chatBodyRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    // Update welcome message when language changes if it's the only message.
    useEffect(() => {
        if (messages.length === 1 && messages[0].type === 'bot') {
            setMessages([{ type: 'bot', text: t('chat_welcome'), lang: currentLang }]);
        }
    }, [currentLang, t, messages.length]);

    // Translate a single piece of text using Gemini
    const translateText = async (text, targetLang) => {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) return text;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
        const prompt = `Translate the following text to ${targetLang === 'ur' ? 'Urdu' : 'English'}. Return ONLY the translated text:\n\n${text}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 200 }
                })
            });
            if (!response.ok) return text;
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || text;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    };

    // Auto-translate history when language changes
    useEffect(() => {
        const translateHistory = async () => {
            if (messages.length <= 1) return; // Welcome message handled separately

            const needsTranslation = messages.some(msg => msg.type === 'bot' && msg.lang !== currentLang);
            if (!needsTranslation) return;

            setIsLoading(true);
            const translatedMessages = await Promise.all(
                messages.map(async (msg) => {
                    if (msg.type === 'bot' && msg.lang !== currentLang) {
                        const translatedText = await translateText(msg.text, currentLang);
                        return { ...msg, text: translatedText, lang: currentLang };
                    }
                    return msg;
                })
            );
            setMessages(translatedMessages);
            setIsLoading(false);
        };

        translateHistory();
    }, [currentLang]);

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

        const userMsg = { type: 'user', text: inputText, lang: currentLang };
        setMessages(prev => [...prev, userMsg]);
        const textToSend = inputText;
        setInputText('');

        setIsLoading(true);
        try {
            const responseText = await fetchBotResponse(textToSend, currentLang);
            setMessages(prev => [...prev, { type: 'bot', text: responseText, lang: currentLang }]);
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

    const handleInputChange = (e) => {
        const val = e.target.value;
        if (currentLang !== 'ur') {
            setInputText(val);
            return;
        }

        // Logic for phonetic mapping
        const prevVal = inputText;
        if (val.length > prevVal.length) {
            const lastChar = val.slice(-1);
            const mappedChar = URDU_PHONETIC_MAP[lastChar];
            if (mappedChar) {
                setInputText(prevVal + mappedChar);
                return;
            }
        }
        setInputText(val);
    };

    return (
        <>
            {!isOpen && (
                <div className="chatbot-toggle floating" onClick={() => setIsOpen(!isOpen)}>
                    <i className="fas fa-comments"></i>
                </div>
            )}

            <div className="chat-window" style={{ display: isOpen ? 'flex' : 'none' }}>
                <div className="chat-header">
                    <i className="fas fa-robot"></i>
                    <div>
                        <h4>Dr. AI Assistant</h4>
                        <small><span className="status-dot"></span> <span>{t('chat_status')}</span></small>
                    </div>
                    <i className="fas fa-times" style={{ marginInlineStart: 'auto', cursor: 'pointer' }} onClick={() => setIsOpen(false)}></i>
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
                <div className="chat-input" dir={currentLang === 'ur' ? 'rtl' : 'ltr'}>
                    <input
                        type="text"
                        placeholder={t('chat_placeholder')}
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        lang={currentLang}
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
>>>>>>> b833b64 (feat: Initialize front-end application with core pages, components, a multilingual chatbot, and authentication features.)
