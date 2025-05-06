
import React from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // Uncomment if needed

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXLV2eIuPC42Xg-aiw6AiITSZ3qtH6tv4",
  authDomain: "sky-ton.firebaseapp.com",
  projectId: "sky-ton",
  storageBucket: "sky-ton.firebasestorage.app",
  messagingSenderId: "482942616533",
  appId: "1:482942616533:web:70d8c9a04087cf9282335c",
  measurementId: "G-67R5PJVBJK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const analytics = getAnalytics(app); // Uncomment if needed

export { db };
  