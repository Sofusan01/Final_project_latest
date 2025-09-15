// /lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDRn8HHi_a4SAgFDAOvm0-ks_IGVfhCEZ0",
  authDomain: "dashboard-4de68.firebaseapp.com",
  databaseURL: "https://dashboard-4de68-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dashboard-4de68",
  storageBucket: "dashboard-4de68.firebasestorage.app",
  messagingSenderId: "759947044425",
  appId: "1:759947044425:web:6db0a728a2b831d26f8198",
  measurementId: "G-RRNL8VHNL4"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);

// Export the app instance
export default app;
