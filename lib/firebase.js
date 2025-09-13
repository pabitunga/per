// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQSyOBo8piJ1Je_fLtA7frZ7QDUKhAy18",
  authDomain: "job-neo-852c8.firebaseapp.com",
  projectId: "job-neo-852c8",
  storageBucket: "job-neo-852c8.firebasestorage.app",
  messagingSenderId: "117234893773",
  appId: "1:117234893773:web:3081cde10e48248ce1fa84",
  measurementId: "G-4VLX6VYH6R"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
