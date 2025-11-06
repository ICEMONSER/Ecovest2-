// Firebase Configuration and Initialization

// Get Firebase config from environment variables
// For vanilla JS: expects window.__ENV to be set in index.html
// For Vite: uses import.meta.env.VITE_*
const getEnvVar = (key, defaultValue = '') => {
  if (typeof window !== 'undefined' && window.__ENV) {
    return window.__ENV[key] || defaultValue;
  }
  // Fallback for Vite if needed
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnvVar('FIREBASE_DATABASE_URL'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID')
};

// Initialize Firebase
let app, auth, database, storage;

try {
  // Check if Firebase is loaded and config is valid
  if (typeof firebase !== 'undefined') {
    // Check if config has required values
    const hasValidConfig = firebaseConfig.apiKey && 
                          firebaseConfig.authDomain && 
                          firebaseConfig.databaseURL &&
                          firebaseConfig.projectId;
    
    if (hasValidConfig) {
      app = firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      database = firebase.database();
      storage = firebase.storage();
      console.log('Firebase initialized successfully');
    } else {
      console.warn('Firebase config incomplete. Using localStorage fallback. Set environment variables to enable Firebase.');
    }
  } else {
    console.warn('Firebase SDK not loaded. Make sure Firebase scripts are included in HTML. Using localStorage fallback.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.warn('Falling back to localStorage. Check Firebase configuration.');
}

// Export Firebase services
const firebaseServices = {
  app,
  auth,
  database,
  storage,
  isInitialized: () => !!app
};

