// DashboardPage.jsx
// Progress dashboard: severity-over-time chart + summary cards.
// Requires: npm install recharts
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { auth } from '../config/firebase';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Dot
} from 'recharts';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Color per condition so each point is colour-coded
const CONDITION_COLORS = {
    Depression: '#5c6bc0',
    Anxiety: '#ef6c00',
    Stress: '#26a69a',
};

const DashboardPage = () => {
    const { currentLang } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sessions, setSessions] = useState([]);
    const [summary, setSummary] = useState(null);

    const ur = currentLang === 'ur';

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) {
                setError(ur ? 'براہ کرم پہلے لاگ ان کریں۔' : 'Please log in to see your progress.');
                setLoading(false);
                return;
            }
            try {
                const token = await user.getIdToken();
                const res = await fetch(`${BASE_URL}/api/chat/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                const data = await res.json();
                setSessions(data.sessions || []);
                setSummary(data.summary || null);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [ur]);

    // Shape data for the chart: index on x, severity on y, keep condition for colour
    const chartData = sessions.map((s, i) => ({
        idx: i + 1,
        severity: s.severity_percent,
        condition: s.condition,
        date: s.created_at ? new Date(s.created_at).toLocaleDateString() : `#${i + 1}`,
    }));

    const trendLabel = {
        improving: ur ? 'بہتری کی طرف' : 'Improving',
        worsening: ur ? 'بگاڑ کی طرف' : 'Worsening',
        steady: ur ? 'مستحکم' : 'Steady',
    };
    const trendColor = { improving: '#2e7d32', worsening: '#c62828', steady: '#757575' };

    // Custom coloured dot per condition
    const ColoredDot = (props) => {
        const { cx, cy, payload } = props;
        if (cx == null || cy == null) return null;
        return <Dot cx={cx} cy={cy} r={5}
            fill={CONDITION_COLORS[payload.condition] || '#888'} stroke="#fff" strokeWidth={1} />;
    };

    const card = {
        flex: '1 1 140px', background: 'var(--white, #fff)', borderRadius: '14px',
        padding: '1rem', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', textAlign: 'center',
    };
    const cardNum = { fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary, #20b2aa)' };
    const cardLbl = { fontSize: '0.75rem', color: 'var(--text-light, #888)', marginTop: '4px' };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}
            dir={ur ? 'rtl' : 'ltr'}>
            <h2 style={{ color: 'var(--primary, #20b2aa)', marginBottom: '0.25rem' }}>
                {ur ? 'آپ کی پیش رفت' : 'Your Progress'}
            </h2>
            <p style={{ color: 'var(--text-light, #888)', marginTop: 0, fontSize: '0.9rem' }}>
                {ur
                    ? 'یہ صفحہ صرف خود سے آگاہی کے لیے ہے، یہ طبی تشخیص نہیں۔'
                    : 'This page is for self-awareness only and is not a medical diagnosis.'}
            </p>

            {loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary,#20b2aa)' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} />
                    <p>{ur ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</p>
                </div>
            )}

            {!loading && error && (
                <div style={{
                    background: '#fff3e0', color: '#e65100', padding: '1rem',
                    borderRadius: '12px', textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            {!loading && !error && sessions.length === 0 && (
                <div style={{
                    background: 'rgba(0,128,128,0.05)', padding: '2rem',
                    borderRadius: '14px', textAlign: 'center', color: 'var(--text-light,#888)'
                }}>
                    {ur
                        ? 'ابھی کوئی سیشن محفوظ نہیں۔ چیٹ بوٹ سے بات کریں، آپ کی پیش رفت یہاں نظر آئے گی۔'
                        : 'No sessions saved yet. Chat with the assistant and your progress will appear here.'}
                </div>
            )}

            {!loading && !error && sessions.length > 0 && (
                <>
                    {/* Summary cards */}
                    {summary && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', margin: '1.25rem 0' }}>
                            <div style={card}>
                                <div style={cardNum}>{summary.total_sessions}</div>
                                <div style={cardLbl}>{ur ? 'کل سیشنز' : 'Total sessions'}</div>
                            </div>
                            <div style={card}>
                                <div style={cardNum}>{summary.latest_severity ?? '—'}%</div>
                                <div style={cardLbl}>{ur ? 'تازہ ترین شدت' : 'Latest severity'}</div>
                            </div>
                            <div style={card}>
                                <div style={cardNum}>{summary.average_severity ?? '—'}%</div>
                                <div style={cardLbl}>{ur ? 'اوسط شدت' : 'Average severity'}</div>
                            </div>
                            <div style={card}>
                                <div style={{ ...cardNum, fontSize: '1.1rem', color: trendColor[summary.trend] || '#757575' }}>
                                    {trendLabel[summary.trend] || '—'}
                                </div>
                                <div style={cardLbl}>{ur ? 'رجحان' : 'Trend'}</div>
                            </div>
                        </div>
                    )}

                    {/* Severity-over-time chart */}
                    <div style={{
                        background: 'var(--white,#fff)', borderRadius: '14px',
                        padding: '1rem', boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
                    }}>
                        <h4 style={{ marginTop: 0, color: 'var(--primary,#20b2aa)' }}>
                            {ur ? 'وقت کے ساتھ شدت' : 'Severity over time'}
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(val, name, props) =>
                                        [`${val}% (${props.payload.condition})`, ur ? 'شدت' : 'Severity']}
                                />
                                {/* severity band reference lines */}
                                <ReferenceLine y={40} stroke="#ffd54f" strokeDasharray="4 4" />
                                <ReferenceLine y={70} stroke="#ef9a9a" strokeDasharray="4 4" />
                                <Line
                                    type="monotone" dataKey="severity"
                                    stroke="var(--primary,#20b2aa)" strokeWidth={2}
                                    dot={<ColoredDot />} activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                            {Object.entries(CONDITION_COLORS).map(([cond, color]) => (
                                <span key={cond} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                                    {cond}
                                </span>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardPage;
