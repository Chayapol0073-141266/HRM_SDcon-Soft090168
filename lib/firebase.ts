
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBFScFetz2k6iEzKgFE6hOvWRASRgSb1Nc",
  authDomain: "hrm-080169.firebaseapp.com",
  projectId: "hrm-080169",
  storageBucket: "hrm-080169.firebasestorage.app",
  messagingSenderId: "789740770630",
  appId: "1:789740770630:web:9e59dcca6cc00937cf8147"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
