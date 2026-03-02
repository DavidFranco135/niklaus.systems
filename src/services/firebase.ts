import { initializeApp, FirebaseApp, getApps } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAQ-XjP4tc6axCBB95vN1BZQsljek6hdQI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "niklaus-28a8a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "niklaus-28a8a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "niklaus-28a8a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "129215868968",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:129215868968:web:0aece864574d7e8fcf051d",
};

export const isConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  // Evitar inicialização duplicada
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db, storage };
