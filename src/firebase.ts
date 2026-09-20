import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDz8Wjeg6j4Ev0psknHGNMVVVYXB0uLLUs",
  authDomain: "la-casa-del-disfraz-web.firebaseapp.com",
  projectId: "la-casa-del-disfraz-web",
  storageBucket: "la-casa-del-disfraz-web.firebasestorage.app",
  messagingSenderId: "299535908234",
  appId: "1:299535908234:web:0566743568520bd79fdc73",
  measurementId: "G-P3JBYG577D"
};

// Initialize Firebase securely (singleton pattern)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
