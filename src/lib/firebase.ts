// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Your web app's Firebase configuration
// This is public and safe to be in the code.
const firebaseConfig = {
  apiKey: "AIzaSyAzLx7Q-CAeRcOnAm8dpOd3wWH9WtA8SAE",
  authDomain: "menuplanner-438b7.firebaseapp.com",
  projectId: "menuplanner-438b7",
  storageBucket: "menuplanner-438b7.firebasestorage.app",
  messagingSenderId: "660491312189",
  appId: "1:660491312189:web:1d364726103d834bee9e54",
  measurementId: "G-4MTFYG3LDQ"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});

export { app, db, auth };
