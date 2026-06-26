/**
 * api.js
 * ------
 * Central service layer for all communication between the React
 * frontend and the Noor-e-Shifa FastAPI backend.
 *
 * Usage:
 *   import { analyzeText, getHistory } from '../services/api';
 *   const result = await analyzeText("میں بہت اداس ہوں", idToken);
 */

import { auth } from '../config/firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Helper: build headers, optionally attaching the Firebase ID token
// ---------------------------------------------------------------------------
async function buildHeaders(requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated.');
    const idToken = await user.getIdToken(/* forceRefresh */ false);
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Helper: handle response errors uniformly
// ---------------------------------------------------------------------------
async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// ===========================================================================
// AUTH
// ===========================================================================

/**
 * Sends the Firebase ID token to the backend for verification.
 * Called immediately after signInWithEmailAndPassword / signInWithPopup.
 *
 * @param {string} idToken  Firebase ID token from user.getIdToken()
 * @returns {Promise<object>} UserProfile { uid, email, display_name, ... }
 */
export async function verifyToken(idToken) {
  const res = await fetch(`${BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  return handleResponse(res);
}

/**
 * Fetches the current user's profile from the backend.
 * Requires the user to be signed in.
 *
 * @returns {Promise<object>} UserProfile
 */
export async function getMyProfile() {
  const headers = await buildHeaders(true);
  const res = await fetch(`${BASE_URL}/api/auth/me`, { headers });
  return handleResponse(res);
}

/**
 * Server-side account registration (optional — you can also register
 * client-side with Firebase's createUserWithEmailAndPassword).
 *
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<object>} { message, uid }
 */
export async function registerUser(email, password, displayName = '') {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  return handleResponse(res);
}

// ===========================================================================
// CHAT / ANALYSIS
// ===========================================================================

/**
 * Sends Urdu text through the full analysis pipeline.
 * Saves the session to Firestore under the user's account.
 *
 * @param {string} text  Urdu message (typed or Whisper-transcribed)
 * @returns {Promise<AnalysisResult>}
 *   {
 *     transcription, emotion, condition, confidence,
 *     severity, response_text, islamic_remedy, clinical_remedy, session_id
 *   }
 */
export async function analyzeText(text) {
  const headers = await buildHeaders(true);
  const res = await fetch(`${BASE_URL}/api/chat/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: text }),
  });
  return handleResponse(res);
}

/**
 * Same as analyzeText but does NOT require authentication.
 * Results are not saved — useful for guest / demo mode.
 *
 * @param {string} text
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeTextPublic(text) {
  const res = await fetch(`${BASE_URL}/api/chat/analyze/public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text }),
  });
  return handleResponse(res);
}

/**
 * Fetches the authenticated user's last 20 sessions.
 *
 * @returns {Promise<SessionSummary[]>}
 *   Array of { session_id, timestamp, condition, severity, emotion }
 */
export async function getHistory() {
  const headers = await buildHeaders(true);
  const res = await fetch(`${BASE_URL}/api/chat/history`, { headers });
  return handleResponse(res);
}

/**
 * Fetches the full details of a single session.
 *
 * @param {string} sessionId
 * @returns {Promise<AnalysisResult>}
 */
export async function getSession(sessionId) {
  const headers = await buildHeaders(true);
  const res = await fetch(`${BASE_URL}/api/chat/session/${sessionId}`, { headers });
  return handleResponse(res);
}

// ===========================================================================
// HEALTH CHECK
// ===========================================================================

/**
 * Pings the backend to confirm it's reachable.
 * Call this on app mount to show a connection status badge.
 *
 * @returns {Promise<{ status: string, version: string }>}
 */
export async function pingBackend() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse(res);
  } catch {
    throw new Error('Cannot reach the Noor-e-Shifa backend.');
  }
}
