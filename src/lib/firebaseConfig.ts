/**
 * Firebase Client Configuration
 * Sourced dynamically from environment variables (import.meta.env) with applet fallback
 */
export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "minhas-financas-bdcfa",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:399561830989:web:428e9610dd864770216204",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAqSXMhACg6y_2a3c4ZTV4GLt46fjMoTSQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "minhas-financas-bdcfa.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "minhas-financas-bdcfa.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "399561830989",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MYSM47CT5L",
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || "",
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || "",
};
