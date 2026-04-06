// ================================================================
//  NeuroScan AI — MongoDB API Client
//  Drop-in replacement for firebase.js (Firestore functions)
//
//  Auth:    Still uses Firebase Auth (Google OAuth + Email/Password)
//  Storage: All data goes through Express + MongoDB backend API
//
//  All functions keep the SAME signatures as the old firebase.js
//  so no page code needs to change — only this import path changes.
// ================================================================

import { initializeApp }        from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup,
         signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, onAuthStateChanged, updateProfile }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ── CONFIGURATION ─────────────────────────────────────────────
// Firebase project: autusim-2c309
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDv9gK1gOTm13SwFGDKOfaM7PrNLY2Z-JU',
  authDomain:        'autusim-2c309.firebaseapp.com',
  projectId:         'autusim-2c309',
  storageBucket:     'autusim-2c309.firebasestorage.app',
  messagingSenderId: '843399983215',
  appId:             '1:843399983215:web:37a364aba10051a3659d9a',
};

// MongoDB backend API URL — update if deployed elsewhere
const API_BASE = window.NEUROSCAN_API_URL || 'http://localhost:3001/api';

// ── FIREBASE AUTH INIT ────────────────────────────────────────
const firebaseApp    = initializeApp(FIREBASE_CONFIG);
export const auth    = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ── API HELPER ────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  // Attach Firebase ID token to every request
  const user  = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  return res.json();
}

// ── AUTH HELPERS ──────────────────────────────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user);
  return result.user;
}

export async function signInEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await ensureUserDoc(result.user, displayName);
  return result.user;
}

export async function firebaseSignOut() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── USER PROFILE ──────────────────────────────────────────────
export async function ensureUserDoc(user, displayName) {
  try {
    await apiFetch(`/users/${user.uid}`, {
      method: 'PUT',
      body: JSON.stringify({
        email:       user.email,
        displayName: displayName || user.displayName || 'User',
        photoURL:    user.photoURL || '',
      }),
    });
  } catch (e) {
    console.warn('ensureUserDoc failed (non-fatal):', e.message);
  }
}

export async function getUserDoc(uid) {
  try {
    return await apiFetch(`/users/${uid}`);
  } catch (e) {
    if (e.message.includes('404')) return null;
    throw e;
  }
}

// ── ASSESSMENTS ───────────────────────────────────────────────
export async function saveAssessment(uid, data) {
  const result = await apiFetch('/assessments', {
    method: 'POST',
    body: JSON.stringify({ ...data, uid }),
  });
  return result.id;
}

export async function getUserAssessments(uid, maxCount = 20) {
  return apiFetch(`/assessments/${uid}?limit=${maxCount}`);
}

export async function deleteAssessment(id) {
  await apiFetch(`/assessments/${id}`, { method: 'DELETE' });
}

export async function getAssessmentById(id) {
  try {
    return await apiFetch(`/assessments/id/${id}`);
  } catch (e) {
    if (e.message.includes('404')) return null;
    throw e;
  }
}

// Real-time listener — MongoDB doesn't natively support browser push.
// We poll every 8 seconds and call the callback when data changes.
export function watchAssessments(uid, callback) {
  let lastCount = -1;

  async function poll() {
    try {
      const data = await getUserAssessments(uid, 10);
      // Only fire callback if something changed
      if (data.length !== lastCount) {
        lastCount = data.length;
        callback(data);
      }
    } catch (e) {
      console.warn('watchAssessments poll error:', e.message);
    }
  }

  // Fire immediately
  poll();
  // Then poll every 8 seconds
  const interval = setInterval(poll, 8000);

  // Return unsubscribe function (matching Firestore API)
  return () => clearInterval(interval);
}

// ── CHAT MESSAGES ─────────────────────────────────────────────
export async function saveChatMessage(uid, role, text) {
  await apiFetch('/chats', {
    method: 'POST',
    body: JSON.stringify({ uid, role, text }),
  });
}

export async function getChatHistory(uid, maxCount = 50) {
  return apiFetch(`/chats/${uid}?limit=${maxCount}`);
}

export async function clearChatHistory(uid) {
  await apiFetch(`/chats/${uid}`, { method: 'DELETE' });
}

// ── REFERRALS ─────────────────────────────────────────────────
export async function createReferral(uid, assessmentId, notes) {
  return apiFetch('/referrals', {
    method: 'POST',
    body: JSON.stringify({ uid, assessmentId, notes }),
  });
}

// ── LEGACY COMPAT ─────────────────────────────────────────────
// serverTimestamp is a Firestore concept — returns a JS Date for MongoDB
export function serverTimestamp() {
  return new Date();
}

// db export kept for any page that imports it (will be null for MongoDB)
export const db = null;
export { googleProvider };
