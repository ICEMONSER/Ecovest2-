// Firebase Configuration Helper (Modular SDK)

// Get Firebase config from environment variables
// For vanilla JS: expects window.__ENV to be set in index.html
// For Vite: uses import.meta.env.VITE_*
const getEnvVar = (key, defaultValue = '') => {
  if (typeof window !== 'undefined' && window.__ENV) {
    return window.__ENV[key] || defaultValue;
  }

  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }

  return defaultValue;
};

export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnvVar('FIREBASE_DATABASE_URL'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID')
};

/**
 * Expose Firebase config globally so that modular SDK consumers can import it.
 * This avoids initializing Firebase in multiple places when using <script type="module">.
 */
if (typeof window !== 'undefined') {
  window.__FIREBASE_CONFIG__ = firebaseConfig;
}

/**
 * Helper for modules to get the config safely.
 * Falls back to the globally stored config.
 */
export function getFirebaseConfig() {
  if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) {
    return window.__FIREBASE_CONFIG__;
  }
  return firebaseConfig;
}

// Attach helper for classic scripts
if (typeof window !== 'undefined') {
  window.getFirebaseConfig = getFirebaseConfig;
}

