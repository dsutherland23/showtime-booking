import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA4ZBM5vUZuJ86RU19YsYJfDWgW-tLpomE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0882288265.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gen-lang-client-0882288265",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0882288265.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "379204519277",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:379204519277:web:28f3343eda18fc3a114664"
};

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let _auth: Auth | null = null;
try {
  if (typeof window !== 'undefined' || (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5)) {
    _auth = getAuth(app);
  }
} catch (err) {
  // Gracefully avoid crashing server-side prerender builds if credentials are being configured
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Firebase] Auth initialization skipped during build/prerender:', err);
  }
}

export const auth = _auth as unknown as Auth;

export function getSafeAuth(): Auth {
  if (_auth) return _auth;
  try {
    _auth = getAuth(app);
    return _auth;
  } catch (err) {
    console.error('[Firebase] Failed to initialize Auth:', err);
    throw err;
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
