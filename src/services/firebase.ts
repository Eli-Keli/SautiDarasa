import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp, type Database } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is valid
const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.databaseURL &&
    firebaseConfig.apiKey !== 'AIzaSyDummyKeyForDevelopment'
  );
};

// Initialize Firebase only if properly configured
let app: FirebaseApp | null = null;
let database: Database | null = null;

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  } else {
    console.warn('[Firebase] Not configured. Using demo/offline mode. Add credentials to .env file.');
  }
} catch (error) {
  console.error('[Firebase] Initialization failed:', error);
  console.warn('[Firebase] Running in offline mode.');
}

// Connection state monitoring
export const monitorConnection = (callback: (connected: boolean) => void) => {
  if (!database) {
    callback(true); // Assume connected in offline mode
    return () => {};
  }
  const connectedRef = ref(database, '.info/connected');
  return onValue(connectedRef, (snapshot) => {
    callback(snapshot.val() === true);
  });
};

// Subscribe to captions for a session
export const subscribeToSessionCaptions = (
  sessionId: string,
  callback: (caption: string | null) => void
) => {
  if (!database) {
    console.warn('[Firebase] Database not initialized. Captions will not be synced.');
    return () => {};
  }
  const captionRef = ref(database, `captions/${sessionId}/latest`);
  return onValue(captionRef, (snapshot) => {
    callback(snapshot.val());
  });
};

// Publish caption (for testing purposes - normally done by backend)
export const publishCaption = async (sessionId: string, caption: string) => {
  if (!database) {
    console.warn('[Firebase] Database not initialized. Cannot publish caption.');
    return;
  }
  const captionRef = ref(database, `captions/${sessionId}/latest`);
  await set(captionRef, {
    text: caption,
    timestamp: serverTimestamp(),
  });
};

// Mark teacher presence in session
export const markTeacherPresence = async (sessionId: string) => {
  if (!database) {
    console.warn('[Firebase] Database not initialized. Presence tracking disabled.');
    return;
  }
  const presenceRef = ref(database, `sessions/${sessionId}/teacher`);
  await set(presenceRef, {
    connected: true,
    connectedAt: serverTimestamp(),
  });
  
  // Clear on disconnect
  onDisconnect(presenceRef).set({
    connected: false,
    disconnectedAt: serverTimestamp(),
  });
};

export { database };
