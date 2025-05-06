// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXLV2eIuPC42Xg-aiw6AiITSZ3qtH6tv4",
  authDomain: "sky-ton.firebaseapp.com",
  projectId: "sky-ton",
  storageBucket: "sky-ton.appspot.com",
  messagingSenderId: "482942616533",
  appId: "1:482942616533:web:70d8c9a04087cf9282335c",
  measurementId: "G-67R5PJVBJK"
};

const app = initializeApp(firebaseConfig);
let analytics = null;
isSupported().then((yes) => {
  if (yes) analytics = getAnalytics(app);
});

const db = getFirestore(app);

export { app, db, analytics };